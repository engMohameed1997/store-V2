import { z } from "zod";

export const checkoutSummarySchema = z.object({
  couponCode: z.string().min(1).max(50).optional(),
});

export type CheckoutSummaryInput = z.infer<typeof checkoutSummarySchema>;
