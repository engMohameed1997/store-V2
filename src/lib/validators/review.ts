import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100).optional(),
  comment: z.string().min(10).max(1000).optional(),
});

export const adminReplySchema = z.object({
  reply: z.string().min(1).max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AdminReplyInput = z.infer<typeof adminReplySchema>;
