import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddressId: z.string().cuid(),
  paymentMethod: z.enum([
    "CASH_ON_DELIVERY",
    "CREDIT_CARD",
    "ZAIN_CASH",
    "QI_CARD",
    "FAST_PAY",
  ]),
  couponCode: z.string().max(50).transform((v) => v.trim().toUpperCase()).optional(),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  note: z.string().max(500).optional(),
  location: z.string().max(255).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
