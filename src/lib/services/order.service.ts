import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { CreateOrderInput, CancelOrderInput, UpdateOrderStatusInput } from "@/lib/validators/order";
import { MAX_PAGINATION_LIMIT } from "@/lib/constants/pagination";
import crypto from "crypto";
import { WarrantyService } from "./warranty.service";

const ORDER_INCLUDE = {
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true, sku: true, images: { where: { isPrimary: true }, take: 1 } } },
    },
  },
  user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
  shippingAddress: true,
  tracking: { orderBy: { createdAt: "desc" as const } },
  coupon: { select: { code: true, discountType: true, discountValue: true } },
};

// Helper to validate OrderItem totalPrice consistency
function validateOrderItemTotalPrice(item: { price: number; quantity: number; totalPrice: number }): boolean {
  const expectedTotal = item.price * item.quantity;
  return Math.abs(item.totalPrice - expectedTotal) < 0.01; // Allow small floating point differences
}

function generateOrderNumber(): string {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = crypto.randomBytes(5).toString("hex").toUpperCase();
  return `ORD-${datePart}-${random}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateUniqueOrderNumber(tx: any, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    const num = generateOrderNumber();
    const exists = await tx.order.findUnique({
      where: { orderNumber: num },
      select: { id: true },
    });
    if (!exists) return num;
  }
  // Fallback with extra entropy
  const ts = Date.now().toString(36).toUpperCase();
  const extra = crypto.randomBytes(8).toString("hex").toUpperCase();
  return `ORD-${ts}-${extra}`;
}

export class OrderService {
  static async create(userId: string, input: CreateOrderInput) {
    let discountAmount = 0;
    let couponId: string | undefined;
    let isFreeShipping = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await db.$transaction(async (tx: any) => {
      // Read cart inside transaction for atomicity
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  stock: true,
                  sku: true,
                  isActive: true,
                  deletedAt: true,
                  images: { where: { isPrimary: true }, take: 1 },
                  category: { select: { id: true, name: true, slug: true } },
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  stock: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!cart || !cart.items.length) throw Errors.badRequest("Cart is empty");

      // Check pending order limit to prevent stock hoarding
      const pendingCount = await tx.order.count({
        where: { userId, status: { in: ["PENDING", "CONFIRMED"] } },
      });
      if (pendingCount >= 5) {
        throw Errors.badRequest("You have too many pending orders. Please complete or cancel existing orders first.");
      }

      // Verify address ownership inside transaction
      const address = await tx.address.findFirst({
        where: { id: input.shippingAddressId, userId, deletedAt: null },
      });
      if (!address) throw Errors.notFound("Address");

      // Calculate shipping zone inside transaction
      const shippingZone = await tx.shippingZone.findFirst({
        where: { governorates: { has: address.governorate }, isActive: true },
      });

      // Re-read product prices and verify active status inside transaction
      let subtotal = 0;
      const orderItems: any[] = [];

      for (const item of cart.items) {
        // Verify product is still active
        const freshProduct = await tx.product.findFirst({
          where: { id: item.product.id, isActive: true, deletedAt: null },
        });
        if (!freshProduct) {
          throw Errors.badRequest(`Product "${item.product.name}" is no longer available`);
        }

        // Get current price from database and verify variant is active
        let price: number;
        if (item.variant) {
          const currentVariant = await tx.productVariant.findFirst({
            where: { id: item.variant.id, isActive: true },
            select: { price: true },
          });
          if (!currentVariant) {
            throw Errors.badRequest(`Variant "${item.variant.name}" is no longer available`);
          }
          price = Number(currentVariant.price);
        } else {
          price = Number(freshProduct.price);
        }

        const total = price * item.quantity;
        subtotal += total;

        orderItems.push({
          productId: item.product.id,
          variantId: item.variant?.id,
          productName: item.product.name,
          variantName: item.variant?.name,
          sku: item.variant?.sku || freshProduct.sku,
          price,
          quantity: item.quantity,
          totalPrice: total,
          categoryId: item.product.category?.id,
        });
      }

      // Validate and apply coupon inside transaction to prevent race condition
      if (input.couponCode) {
        const cartProductIds = cart.items.map((item: (typeof cart.items)[number]) => item.product.id);
        const cartCategoryIds = cart.items
          .map((item: (typeof cart.items)[number]) => item.product.category?.id)
          .filter(Boolean) as string[];

        const coupon = await tx.coupon.findUnique({
          where: { code: input.couponCode.toUpperCase(), deletedAt: null },
          include: {
            couponProducts: { select: { productId: true } },
            couponCategories: { select: { categoryId: true } },
          },
        });

        if (!coupon || !coupon.isActive) {
          throw Errors.badRequest("Invalid or inactive coupon");
        }

        const now = new Date();
        if (coupon.startsAt && coupon.startsAt > now) {
          throw Errors.badRequest("Coupon is not yet active");
        }
        if (coupon.expiresAt && coupon.expiresAt < now) {
          throw Errors.badRequest("Coupon has expired");
        }

        // Check usage limit atomically
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
          throw Errors.badRequest("Coupon usage limit reached");
        }

        const userUsages = await tx.couponUsage.count({
          where: { couponId: coupon.id, userId },
        });
        if (userUsages >= coupon.perUserLimit) {
          throw Errors.badRequest("You have already used this coupon");
        }

        if (coupon.scope === "SPECIFIC_PRODUCTS" && cartProductIds?.length) {
          const allowedProductIds = coupon.couponProducts.map((cp: { productId: string }) => cp.productId);
          const hasValidProduct = cartProductIds.some((pid: string) => allowedProductIds.includes(pid));
          if (!hasValidProduct) {
            throw Errors.badRequest("Coupon does not apply to any product in your cart");
          }
        }

        if (coupon.scope === "SPECIFIC_CATEGORIES" && cartCategoryIds?.length) {
          const allowedCategoryIds = coupon.couponCategories.map((cc: { categoryId: string }) => cc.categoryId);
          const hasValidCategory = cartCategoryIds.some((cid: string) => allowedCategoryIds.includes(cid));
          if (!hasValidCategory) {
            throw Errors.badRequest("Coupon does not apply to any category in your cart");
          }
        }

        if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
          throw Errors.badRequest(`Minimum order amount is ${coupon.minOrderAmount}`);
        }

        // Calculate eligible subtotal based on coupon scope
        let eligibleSubtotal = subtotal;
        if (coupon.scope === "SPECIFIC_PRODUCTS") {
          const allowedProductIds = coupon.couponProducts.map((cp: { productId: string }) => cp.productId);
          eligibleSubtotal = orderItems
            .filter((item: any) => allowedProductIds.includes(item.productId))
            .reduce((sum: number, item: any) => sum + item.totalPrice, 0);
        } else if (coupon.scope === "SPECIFIC_CATEGORIES") {
          const allowedCategoryIds = coupon.couponCategories.map((cc: { categoryId: string }) => cc.categoryId);
          eligibleSubtotal = orderItems
            .filter((item: any) => item.categoryId && allowedCategoryIds.includes(item.categoryId))
            .reduce((sum: number, item: any) => sum + item.totalPrice, 0);
        }

        // Calculate discount on eligible subtotal
        let couponDiscountAmount = 0;
        switch (coupon.discountType) {
          case "PERCENTAGE":
            couponDiscountAmount = (eligibleSubtotal * Number(coupon.discountValue)) / 100;
            break;
          case "FIXED_AMOUNT":
            couponDiscountAmount = Number(coupon.discountValue);
            break;
          case "FREE_SHIPPING":
            couponDiscountAmount = 0;
            break;
        }

        if (coupon.maxDiscount) {
          couponDiscountAmount = Math.min(couponDiscountAmount, Number(coupon.maxDiscount));
        }
        couponDiscountAmount = Math.min(couponDiscountAmount, eligibleSubtotal);

        discountAmount = couponDiscountAmount;
        couponId = coupon.id;
        isFreeShipping = coupon.discountType === "FREE_SHIPPING";
      }

      // Calculate shipping cost after coupon validation
      let shippingCost = 0;
      // Always check shipping zone availability, even with free shipping
      if (!shippingZone) {
        throw Errors.badRequest("Shipping is not available to your area");
      }
      if (!isFreeShipping) {
        shippingCost = shippingZone.freeAbove && subtotal >= Number(shippingZone.freeAbove)
          ? 0
          : Number(shippingZone.baseCost);
      }

      const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

      for (const item of cart.items) {
        if (item.variant) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variant.id, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw Errors.badRequest(`Insufficient stock for ${item.product.name}`);
          }
          // Also increment soldCount and decrement stock on the parent product
          await tx.product.update({
            where: { id: item.product.id },
            data: {
              soldCount: { increment: item.quantity },
              stock: { decrement: item.quantity },
            },
          });
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.product.id, stock: { gte: item.quantity } },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
          if (updated.count === 0) {
            throw Errors.badRequest(`Insufficient stock for ${item.product.name}`);
          }
        }
      }

      const orderNumber = await generateUniqueOrderNumber(tx);

      // Strip categoryId from orderItems before DB insert (used only for coupon calculation)
      const orderItemsForDb = orderItems.map(({ categoryId, ...rest }: any) => rest);

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          paymentMethod: input.paymentMethod,
          subtotal,
          shippingCost,
          discountAmount,
          totalAmount,
          couponId,
          shippingAddressId: input.shippingAddressId,
          shippingZoneId: shippingZone?.id,
          notes: input.notes,
          items: { createMany: { data: orderItemsForDb } },
          tracking: {
            create: { status: "PENDING", note: "Order placed" },
          },
          transactions: {
            create: {
              type: "CHARGE",
              status: "PENDING",
              method: input.paymentMethod,
              amount: totalAmount,
              currency: "IQD",
            },
          },
        },
        include: ORDER_INCLUDE,
      });

      if (couponId) {
        const couponRecord = await tx.coupon.findUnique({ where: { id: couponId } });
        if (!couponRecord) throw Errors.badRequest("Coupon not found");

        const couponWhere: Record<string, unknown> = { id: couponId };
        if (couponRecord.usageLimit !== null) {
          couponWhere.usageCount = { lt: couponRecord.usageLimit };
        }

        const couponUpdate = await tx.coupon.updateMany({
          where: couponWhere,
          data: { usageCount: { increment: 1 } },
        });
        if (couponUpdate.count === 0) {
          throw Errors.badRequest("Coupon usage limit reached");
        }
        await tx.couponUsage.create({
          data: { couponId, userId, orderId: newOrder.id },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } });

      return newOrder;
    });

    return order;
  }

  static async getMyOrders(userId: string, page = 1, limit = 10) {
    const limitCapped = Math.min(limit, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * limitCapped;

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where: { userId },
        include: ORDER_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip,
        take: limitCapped,
      }),
      db.order.count({ where: { userId } }),
    ]);

    return { orders, total, page, limit: limitCapped };
  }

  static async getById(id: string, userId?: string) {
    const where: Record<string, unknown> = { id };
    if (userId) where.userId = userId;

    const order = await db.order.findFirst({
      where,
      include: ORDER_INCLUDE,
    });

    if (!order) throw Errors.notFound("Order");

    // Validate totalPrice consistency (log warnings for data integrity)
    for (const item of order.items) {
      if (!validateOrderItemTotalPrice(item as any)) {
        console.warn(`OrderItem ${item.id} has inconsistent totalPrice: expected ${Number(item.price) * item.quantity}, got ${Number(item.totalPrice)}`);
      }
    }

    return order;
  }

  static async cancel(orderId: string, userId: string, input: CancelOrderInput) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      // Read and lock order inside transaction (optimistic lock via status check)
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        include: { items: true },
      });

      if (!order) throw Errors.notFound("Order");
      if (!["PENDING", "CONFIRMED"].includes(order.status)) {
        throw Errors.badRequest("Order cannot be cancelled at this stage");
      }

      // Optimistic lock - update status first to prevent concurrent cancellations
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: { in: ["PENDING", "CONFIRMED"] } },
        data: {
          status: "CANCELLED",
          cancelReason: input.reason,
          cancelledAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw Errors.badRequest("Order already cancelled or cannot be cancelled");
      }

      // Restore stock after successful status update
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
          if (item.productId) {
            await tx.product.updateMany({
              where: { id: item.productId, soldCount: { gte: item.quantity } },
              data: {
                soldCount: { decrement: item.quantity },
                stock: { increment: item.quantity },
              },
            });
          }
        } else if (item.productId) {
          await tx.product.updateMany({
            where: { id: item.productId, soldCount: { gte: item.quantity } },
            data: {
              stock: { increment: item.quantity },
              soldCount: { decrement: item.quantity },
            },
          });
        }
      }

      // Restore coupon usage if applicable (with guard against negative)
      if (order.couponId) {
        const couponUpdate = await tx.coupon.updateMany({
          where: { id: order.couponId, usageCount: { gte: 1 } },
          data: { usageCount: { decrement: 1 } },
        });
        if (couponUpdate.count > 0) {
          await tx.couponUsage.deleteMany({
            where: { orderId },
          });
        }
      }

      await tx.orderTracking.create({
        data: {
          orderId,
          status: "CANCELLED",
          note: `Cancelled by user: ${input.reason}`,
        },
      });
    });

    return this.getById(orderId, userId);
  }

  static readonly VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["REFUNDED"],
    CANCELLED: [],
    REFUNDED: [],
  };

  static async updateStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw Errors.notFound("Order");

    const allowed = this.VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(input.status)) {
      throw Errors.badRequest(
        `Cannot transition from ${order.status} to ${input.status}. Allowed: ${allowed.join(", ") || "none"}`
      );
    }

    // Prevent shipping without payment confirmation (except for CASH_ON_DELIVERY)
    if (input.status === "SHIPPED" && order.paymentMethod !== "CASH_ON_DELIVERY") {
      if (order.paymentStatus !== "PAID") {
        throw Errors.badRequest("Cannot ship order: payment not confirmed");
      }
    }

    // Require existing Return request for DELIVERED → REFUNDED transition
    if (order.status === "DELIVERED" && input.status === "REFUNDED") {
      const existingReturn = await db.return.findFirst({
        where: { orderId, status: { in: ["APPROVED", "RECEIVED"] } },
      });
      if (!existingReturn) {
        throw Errors.badRequest("Cannot refund order without an approved return request");
      }
    }

    const statusDates: Record<string, unknown> = {};
    if (input.status === "SHIPPED") statusDates.shippedAt = new Date();
    if (input.status === "DELIVERED") statusDates.deliveredAt = new Date();
    if (input.status === "CANCELLED") {
      statusDates.cancelledAt = new Date();
      statusDates.cancelReason = input.note || "Cancelled by admin";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      // Optimistic lock FIRST - update only if status hasn't changed
      const updated = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: input.status, ...statusDates },
      });

      if (updated.count === 0) {
        throw Errors.conflict("Order status has been modified by another operation");
      }

      // Create refund transaction record and restore stock when transitioning to REFUNDED
      if (input.status === "REFUNDED") {
        await tx.paymentTransaction.create({
          data: {
            orderId,
            type: "REFUND",
            status: "PENDING",
            method: order.paymentMethod,
            amount: order.totalAmount,
            currency: order.currency,
          },
        });

        // Restore stock on refund (use updateMany for safety if variant deleted)
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            if (item.productId) {
              await tx.product.updateMany({
                where: { id: item.productId, soldCount: { gte: item.quantity } },
                data: {
                  soldCount: { decrement: item.quantity },
                  stock: { increment: item.quantity },
                },
              });
            }
          } else if (item.productId) {
            await tx.product.updateMany({
              where: { id: item.productId, soldCount: { gte: item.quantity } },
              data: {
                stock: { increment: item.quantity },
                soldCount: { decrement: item.quantity },
              },
            });
          }
        }

        // Restore coupon usage on refund
        if (order.couponId) {
          const couponUpdate = await tx.coupon.updateMany({
            where: { id: order.couponId, usageCount: { gte: 1 } },
            data: { usageCount: { decrement: 1 } },
          });
          if (couponUpdate.count > 0) {
            await tx.couponUsage.deleteMany({
              where: { orderId },
            });
          }
        }
      }

      // Restock items when admin cancels an order
      if (input.status === "CANCELLED") {
        // Update paymentStatus to REFUNDED if order was paid
        if (order.paymentStatus === "PAID") {
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: "REFUNDED" },
          });
        }

        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            if (item.productId) {
              await tx.product.updateMany({
                where: { id: item.productId, soldCount: { gte: item.quantity } },
                data: {
                  soldCount: { decrement: item.quantity },
                  stock: { increment: item.quantity },
                },
              });
            }
          } else if (item.productId) {
            await tx.product.updateMany({
              where: { id: item.productId, soldCount: { gte: item.quantity } },
              data: {
                stock: { increment: item.quantity },
                soldCount: { decrement: item.quantity },
              },
            });
          }
        }

        // Restore coupon usage on admin cancel
        if (order.couponId) {
          const couponUpdate = await tx.coupon.updateMany({
            where: { id: order.couponId, usageCount: { gte: 1 } },
            data: { usageCount: { decrement: 1 } },
          });
          if (couponUpdate.count > 0) {
            await tx.couponUsage.deleteMany({
              where: { orderId },
            });
          }
        }
      }

      await tx.orderTracking.create({
        data: {
          orderId,
          status: input.status,
          note: input.note,
          location: input.location,
        },
      });

      if (input.status === "SHIPPED" || input.status === "DELIVERED") {
        await WarrantyService.activateWarrantiesForOrder(orderId, tx);
      }
    });

    return this.getById(orderId);
  }

  static async confirmPayment(orderId: string, transactionId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });
      if (!order) throw Errors.notFound("Order");
      if (order.paymentStatus === "PAID") {
        throw Errors.badRequest("Order is already paid");
      }
      // Prevent confirming payment for cancelled or refunded orders
      if (["CANCELLED", "REFUNDED"].includes(order.status)) {
        throw Errors.badRequest(`Cannot confirm payment for order with status: ${order.status}`);
      }

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", paidAt: new Date() },
      });

      await tx.paymentTransaction.updateMany({
        where: { orderId, status: "PENDING", type: "CHARGE" },
        data: { status: "SUCCESS", paidAt: new Date(), gatewayId: transactionId },
      });
    });

    return this.getById(orderId);
  }

  static async adminList(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: "insensitive" } },
        { user: { firstName: { contains: filters.search, mode: "insensitive" } } },
        { user: { phone: { contains: filters.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          ...ORDER_INCLUDE,
          user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }
}
