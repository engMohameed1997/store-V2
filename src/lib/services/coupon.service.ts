import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { DiscountType, CouponScope } from "@/generated/prisma/client";

export class CouponService {
  static async validate(
    code: string,
    userId: string,
    orderTotal?: number,
    productIds?: string[],
    categoryIds?: string[]
  ) {
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase(), deletedAt: null },
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

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw Errors.badRequest("Coupon usage limit reached");
    }

    const userUsages = await db.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsages >= coupon.perUserLimit) {
      throw Errors.badRequest("You have already used this coupon");
    }

    if (coupon.scope === "SPECIFIC_PRODUCTS") {
      if (!productIds || productIds.length === 0) {
        throw Errors.badRequest("This coupon applies to specific products only. Please provide product IDs for validation.");
      }
      const allowedProductIds = coupon.couponProducts.map((cp: { productId: string }) => cp.productId);
      const hasValidProduct = productIds.some((pid) => allowedProductIds.includes(pid));
      if (!hasValidProduct) {
        throw Errors.badRequest("Coupon does not apply to any product in your cart");
      }
    }

    if (coupon.scope === "SPECIFIC_CATEGORIES") {
      if (!categoryIds || categoryIds.length === 0) {
        throw Errors.badRequest("This coupon applies to specific categories only. Please provide category IDs for validation.");
      }
      const allowedCategoryIds = coupon.couponCategories.map((cc: { categoryId: string }) => cc.categoryId);
      const hasValidCategory = categoryIds.some((cid) => allowedCategoryIds.includes(cid));
      if (!hasValidCategory) {
        throw Errors.badRequest("Coupon does not apply to any category in your cart");
      }
    }

    if (coupon.minOrderAmount) {
      if (!orderTotal) {
        throw Errors.badRequest(`This coupon requires a minimum order amount of ${coupon.minOrderAmount}`);
      }
      if (orderTotal < Number(coupon.minOrderAmount)) {
        throw Errors.badRequest(`Minimum order amount is ${coupon.minOrderAmount}`);
      }
    }

    let discountAmount = 0;
    if (orderTotal) {
      // Calculate eligible subtotal based on scope
      let eligibleAmount = orderTotal;
      if (coupon.scope === "SPECIFIC_PRODUCTS" && productIds?.length) {
        // In validate endpoint we don't have item-level pricing, so discount applies to full orderTotal
        // The actual eligible amount will be recalculated accurately at order creation time
        eligibleAmount = orderTotal;
      } else if (coupon.scope === "SPECIFIC_CATEGORIES" && categoryIds?.length) {
        eligibleAmount = orderTotal;
      }

      switch (coupon.discountType) {
        case "PERCENTAGE":
          discountAmount = (eligibleAmount * Number(coupon.discountValue)) / 100;
          break;
        case "FIXED_AMOUNT":
          discountAmount = Math.min(Number(coupon.discountValue), eligibleAmount);
          break;
        case "FREE_SHIPPING":
          discountAmount = 0;
          break;
      }

      if (coupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
      discountAmount = Math.min(discountAmount, eligibleAmount);
    }

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discountAmount,
      isFreeShipping: coupon.discountType === "FREE_SHIPPING",
    };
  }

  static async create(input: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    scope?: CouponScope;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    isActive?: boolean;
    startsAt?: Date;
    expiresAt?: Date;
    productIds?: string[];
    categoryIds?: string[];
  }) {
    const existing = await db.coupon.findUnique({
      where: { code: input.code },
    });
    if (existing) {
      throw Errors.badRequest("Coupon code already exists");
    }

    const { productIds, categoryIds, ...couponData } = input;

    const coupon = await db.coupon.create({
      data: {
        ...couponData,
        ...(productIds?.length && {
          couponProducts: {
            createMany: {
              data: productIds.map((productId) => ({ productId })),
            },
          },
        }),
        ...(categoryIds?.length && {
          couponCategories: {
            createMany: {
              data: categoryIds.map((categoryId) => ({ categoryId })),
            },
          },
        }),
      },
      include: {
        couponProducts: { select: { productId: true } },
        couponCategories: { select: { categoryId: true } },
      },
    });

    return coupon;
  }

  static async update(id: string, input: {
    code?: string;
    description?: string;
    discountType?: DiscountType;
    discountValue?: number;
    scope?: CouponScope;
    minOrderAmount?: number;
    maxDiscount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    isActive?: boolean;
    startsAt?: Date;
    expiresAt?: Date;
    productIds?: string[];
    categoryIds?: string[];
  }) {
    const existing = await db.coupon.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw Errors.notFound("Coupon");

    if (input.code && input.code !== existing.code) {
      const duplicate = await db.coupon.findUnique({
        where: { code: input.code },
      });
      if (duplicate) {
        throw Errors.badRequest("Coupon code already exists");
      }
    }

    const { productIds, categoryIds, ...couponData } = input;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coupon = await db.$transaction(async (tx: any) => {
      if (productIds !== undefined) {
        await tx.couponProduct.deleteMany({ where: { couponId: id } });
        if (productIds.length > 0) {
          await tx.couponProduct.createMany({
            data: productIds.map((productId) => ({ couponId: id, productId })),
          });
        }
      }

      if (categoryIds !== undefined) {
        await tx.couponCategory.deleteMany({ where: { couponId: id } });
        if (categoryIds.length > 0) {
          await tx.couponCategory.createMany({
            data: categoryIds.map((categoryId) => ({ couponId: id, categoryId })),
          });
        }
      }

      return tx.coupon.update({
        where: { id },
        data: couponData,
        include: {
          couponProducts: { select: { productId: true } },
          couponCategories: { select: { categoryId: true } },
        },
      });
    });

    return coupon;
  }
}
