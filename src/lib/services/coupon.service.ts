import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { DiscountType, CouponScope } from "@/generated/prisma/client";

export interface CouponItem {
  productId: string;
  categoryId?: string | null;
  price: number;
  quantity: number;
}

export class CouponService {
  static async validate(
    code: string,
    userId: string,
    items?: CouponItem[]
  ) {
    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase(), deletedAt: null },
      include: {
        couponProducts: { select: { productId: true } },
        couponCategories: { select: { categoryId: true } },
      },
    });

    if (!coupon || !coupon.isActive) {
      throw Errors.badRequest("الكوبون غير صالح أو غير مفعل");
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw Errors.badRequest("الكوبون لم يبدأ بعد");
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw Errors.badRequest("انتهت صلاحية الكوبون");
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw Errors.badRequest("تم الوصول للحد الأقصى لاستخدام الكوبون");
    }

    const userUsages = await db.couponUsage.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsages >= coupon.perUserLimit) {
      throw Errors.badRequest("لقد استخدمت هذا الكوبون من قبل");
    }

    const orderTotal = items
      ? items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      : 0;
    const productIds = items?.map((i) => i.productId) ?? [];
    const categoryIds = items?.map((i) => i.categoryId).filter(Boolean) as string[] ?? [];

    if (coupon.scope === "SPECIFIC_PRODUCTS") {
      if (productIds.length === 0) {
        throw Errors.badRequest("هذا الكوبون يطبق على منتجات محددة فقط. يرجى تمرير معرفات المنتجات للتحقق.");
      }
      const allowedProductIds = coupon.couponProducts.map((cp: { productId: string }) => cp.productId);
      const hasValidProduct = productIds.some((pid) => allowedProductIds.includes(pid));
      if (!hasValidProduct) {
        throw Errors.badRequest("الكوبون لا يطبق على أي منتج في سلتك");
      }
    }

    if (coupon.scope === "SPECIFIC_CATEGORIES") {
      if (categoryIds.length === 0) {
        throw Errors.badRequest("هذا الكوبون يطبق على فئات محددة فقط. يرجى تمرير معرفات الفئات للتحقق.");
      }
      const allowedCategoryIds = coupon.couponCategories.map((cc: { categoryId: string }) => cc.categoryId);
      const hasValidCategory = categoryIds.some((cid) => allowedCategoryIds.includes(cid));
      if (!hasValidCategory) {
        throw Errors.badRequest("الكوبون لا يطبق على أي فئة في سلتك");
      }
    }

    if (coupon.minOrderAmount) {
      if (!orderTotal) {
        throw Errors.badRequest(`هذا الكوبون يتطلب حد أدنى للطلب بقيمة ${coupon.minOrderAmount}`);
      }
      if (orderTotal < Number(coupon.minOrderAmount)) {
        throw Errors.badRequest(`الحد الأدنى للطلب هو ${coupon.minOrderAmount}`);
      }
    }

    // Calculate eligible subtotal based on coupon scope
    let eligibleAmount = orderTotal;
    if (coupon.scope === "SPECIFIC_PRODUCTS" && items?.length) {
      const allowedProductIds = coupon.couponProducts.map((cp: { productId: string }) => cp.productId);
      eligibleAmount = items
        .filter((i) => allowedProductIds.includes(i.productId))
        .reduce((sum, i) => sum + i.price * i.quantity, 0);
    } else if (coupon.scope === "SPECIFIC_CATEGORIES" && items?.length) {
      const allowedCategoryIds = coupon.couponCategories.map((cc: { categoryId: string }) => cc.categoryId);
      eligibleAmount = items
        .filter((i) => i.categoryId && allowedCategoryIds.includes(i.categoryId))
        .reduce((sum, i) => sum + i.price * i.quantity, 0);
    }

    let discountAmount = 0;
    if (orderTotal) {
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
