import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parentId: z.string().cuid().optional().nullable(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
