import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  nameAr: z.string().min(2).max(255).optional(),
  description: z.string().max(5000).optional(),
  descriptionAr: z.string().max(5000).optional(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
  weight: z.number().positive().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  warrantyDuration: z.number().int().min(1).optional(),
  warrantyUnit: z.enum(["DAYS", "MONTHS", "YEARS"]).optional(),
  warrantyCoverage: z.string().max(1000).optional(),
  categoryId: z.string().cuid().optional(),
  brandId: z.string().cuid().optional(),
  branchId: z.string().cuid().optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  images: z
    .array(
      z.object({
        url: z
          .string()
          .regex(
            /^\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i,
            "Image must be uploaded via the /api/v1/uploads endpoint first"
          ),
        alt: z.string().max(255).optional(),
        position: z.number().int().min(0).default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .optional(),
  specs: z
    .array(
      z.object({
        key: z.string().min(1).max(100),
        value: z.string().min(1).max(500),
        position: z.number().int().min(0).default(0),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        price: z.number().positive(),
        stock: z.number().int().min(0).default(0),
        attributes: z
          .array(z.object({ optionId: z.string().cuid(), value: z.string() }))
          .optional(),
      })
    )
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productSearchSchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  sortBy: z.enum(["price", "createdAt", "soldCount", "avgRating", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
