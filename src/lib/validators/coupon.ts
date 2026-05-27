import { z } from "zod";

export const validateCouponSchema = z.object({
  code: z.string().min(1).max(50).transform((v) => v.trim().toUpperCase()),
  orderTotal: z.number().positive().optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
});

const couponBaseSchema = z.object({
  code: z.string().min(3).max(50).transform((v) => v.trim().toUpperCase()),
  description: z.string().max(500).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  discountValue: z.number().min(0),
  scope: z.enum(["ALL", "SPECIFIC_PRODUCTS", "SPECIFIC_CATEGORIES"]).default("ALL"),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  productIds: z.array(z.string().cuid()).optional(),
  categoryIds: z.array(z.string().cuid()).optional(),
});

export const createCouponSchema = couponBaseSchema
  .refine((data) => {
    // Cap percentage discount at 100%
    if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
      return false;
    }
    // Require positive discountValue for PERCENTAGE and FIXED_AMOUNT
    if (data.discountType !== "FREE_SHIPPING" && data.discountValue <= 0) {
      return false;
    }
    return true;
  }, {
    message: "Percentage discount cannot exceed 100%, and discount value must be positive for non-free-shipping coupons",
  })
  .refine((data) => {
    // Validate startsAt < expiresAt
    if (data.startsAt && data.expiresAt) {
      return data.startsAt < data.expiresAt;
    }
    return true;
  }, {
    message: "Start date must be before expiry date",
  })
  .refine((data) => {
    // Require productIds when scope is SPECIFIC_PRODUCTS
    if (data.scope === "SPECIFIC_PRODUCTS" && (!data.productIds || data.productIds.length === 0)) {
      return false;
    }
    // Require categoryIds when scope is SPECIFIC_CATEGORIES
    if (data.scope === "SPECIFIC_CATEGORIES" && (!data.categoryIds || data.categoryIds.length === 0)) {
      return false;
    }
    return true;
  }, {
    message: "Product IDs required for SPECIFIC_PRODUCTS scope, Category IDs required for SPECIFIC_CATEGORIES scope",
  });

export const updateCouponSchema = couponBaseSchema.partial();

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
