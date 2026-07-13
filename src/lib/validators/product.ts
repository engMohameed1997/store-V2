import { z } from "zod";

const productBaseSchema = z.object({
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
            /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp))$/i,
            "Image must be uploaded via the /api/v1/uploads endpoint first"
          ),
        alt: z.string().max(255).optional(),
        position: z.number().int().min(0).default(0),
        isPrimary: z.boolean().default(false),
      })
    )
    .max(20, "Maximum 20 images allowed")
    .optional(),
  specs: z
    .array(
      z.object({
        key: z.string().min(1).max(100),
        value: z.string().min(1).max(500),
        position: z.number().int().min(0).default(0),
      })
    )
    .max(50, "Maximum 50 specs allowed")
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
    .max(10, "Maximum 10 variants allowed")
    .optional(),
});

export const createProductSchema = productBaseSchema
  .refine(
    (data) =>
      data.compareAtPrice === undefined ||
      data.price === undefined ||
      data.compareAtPrice > data.price,
    { message: "compareAtPrice must be greater than price", path: ["compareAtPrice"] }
  )
  .refine(
    (data) =>
      (data.warrantyDuration && data.warrantyUnit) ||
      (!data.warrantyDuration && !data.warrantyUnit),
    { message: "warrantyDuration and warrantyUnit must both be provided or both omitted", path: ["warrantyUnit"] }
  );

export const updateProductSchema = productBaseSchema.partial()
  .refine(
    (data) =>
      data.compareAtPrice === undefined ||
      data.price === undefined ||
      data.compareAtPrice > data.price,
    { message: "compareAtPrice must be greater than price", path: ["compareAtPrice"] }
  )
  .refine(
    (data) =>
      (data.warrantyDuration && data.warrantyUnit) ||
      (!data.warrantyDuration && !data.warrantyUnit),
    { message: "warrantyDuration and warrantyUnit must both be provided or both omitted", path: ["warrantyUnit"] }
  );

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
  isActive: z.enum(["true", "false"]).optional(),
  branchId: z.string().cuid().optional(),
  stockStatus: z.enum(["all", "in_stock", "out_of_stock"]).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
