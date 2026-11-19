import crypto from "crypto";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validators/product";
import { MAX_PAGINATION_LIMIT } from "@/lib/constants/pagination";
import { sanitizeString } from "@/lib/api/sanitize";
import { buildProductSlug, newSlugSuffix, slugSuffix } from "@/lib/utils/product-slug";

// View deduplication: prevents viewCount inflation (1 count per IP per product per hour)
// Uses Redis instead of in-memory Map to work correctly across multiple instances/pods.
const VIEW_DEDUP_TTL_SEC = 60 * 60; // 1 hour

const PRODUCT_INCLUDE = {
  images: { orderBy: { position: "asc" as const } },
  specs: { orderBy: { position: "asc" as const } },
  variants: {
    include: { attributes: { include: { option: true } } },
    where: { isActive: true },
  },
  category: { select: { id: true, name: true, slug: true, nameAr: true } },
  brand: { select: { id: true, name: true, slug: true, nameAr: true } },
  branchInventories: { select: { branchId: true, stock: true } },
};

const PRODUCT_PUBLIC_SELECT = {
  id: true,
  sku: true,
  slug: true,
  name: true,
  nameAr: true,
  description: true,
  descriptionAr: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  weight: true,
  isActive: true,
  isFeatured: true,
  isDigital: true,
  avgRating: true,
  reviewCount: true,
  soldCount: true,
  warrantyDuration: true,
  warrantyUnit: true,
  warrantyCoverage: true,
  createdAt: true,
  images: { orderBy: { position: "asc" as const } },
  specs: { orderBy: { position: "asc" as const } },
  variants: {
    include: { attributes: { include: { option: true } } },
    where: { isActive: true },
  },
  category: { select: { id: true, name: true, slug: true, nameAr: true } },
  brand: { select: { id: true, name: true, slug: true, nameAr: true } },
};

const PRODUCT_LIST_SELECT = {
  id: true,
  slug: true,
  name: true,
  nameAr: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  isActive: true,
  isFeatured: true,
  avgRating: true,
  reviewCount: true,
  soldCount: true,
  createdAt: true,
  images: { where: { isPrimary: true }, take: 1 },
  category: { select: { id: true, name: true, slug: true, nameAr: true } },
  brand: { select: { id: true, name: true, slug: true, nameAr: true } },
};

/** A suffix no other product uses, so it identifies this product's links. */
async function uniqueSlugSuffix(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = newSlugSuffix();
    const taken = await db.product.findFirst({
      where: { slug: { endsWith: `-${suffix}` } },
      select: { id: true },
    });
    if (!taken) return suffix;
  }
  throw new Error("Could not generate a unique product slug");
}

function buildSkuCandidate(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SKU-${timestamp}-${random}`;
}

async function generateUniqueSku(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = buildSkuCandidate();
    const exists = await db.product.findUnique({ where: { sku: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
  throw Errors.internal("Failed to generate a unique SKU — please retry");
}

export class ProductService {
  static async list(filters: {
    search?: string;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    featured?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    activeOnly?: boolean;
    isActive?: boolean;
    branchId?: string;
    stockStatus?: "all" | "in_stock" | "out_of_stock";
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else if (filters.activeOnly !== false) {
      where.isActive = true;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { nameAr: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.category) {
      where.category = { slug: filters.category };
    }

    if (filters.brand) {
      where.brand = { slug: filters.brand };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) (where.price as Record<string, unknown>).gte = filters.minPrice;
      if (filters.maxPrice !== undefined) (where.price as Record<string, unknown>).lte = filters.maxPrice;
    }

    if (filters.branchId) {
      if (filters.stockStatus === "in_stock") {
        where.branchInventories = {
          some: {
            branchId: filters.branchId,
            stock: { gt: 0 }
          }
        };
      } else if (filters.stockStatus === "out_of_stock") {
        where.AND = [
          {
            OR: [
              {
                branchInventories: {
                  none: {
                    branchId: filters.branchId
                  }
                }
              },
              {
                branchInventories: {
                  some: {
                    branchId: filters.branchId,
                    stock: { lte: 0 }
                  }
                }
              }
            ]
          }
        ];
      } else {
        where.branchInventories = {
          some: {
            branchId: filters.branchId
          }
        };
      }
    } else {
      if (filters.stockStatus === "in_stock") {
        where.stock = { gt: 0 };
      } else if (filters.stockStatus === "out_of_stock") {
        where.stock = { lte: 0 };
      } else if (filters.inStock) {
        where.stock = { gt: 0 };
      }
    }

    if (filters.featured) where.isFeatured = true;

    const ALLOWED_SORT_FIELDS = ["createdAt", "price", "name", "soldCount", "avgRating", "reviewCount"];
    const sortField = ALLOWED_SORT_FIELDS.includes(filters.sortBy || "")
      ? filters.sortBy!
      : "createdAt";
    const orderBy: Record<string, string> = {};
    orderBy[sortField] = filters.sortOrder || "desc";

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        select: PRODUCT_LIST_SELECT,
        skip,
        take: limit,
        orderBy,
      }),
      db.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  static async getById(id: string) {
    const product = await db.product.findUnique({
      where: { id, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });

    if (!product) throw Errors.notFound("Product");
    return product;
  }

  static async getByIdPublic(id: string) {
    const product = await db.product.findUnique({
      where: { id, deletedAt: null },
      select: PRODUCT_PUBLIC_SELECT,
    });

    if (!product) throw Errors.notFound("Product");
    return product;
  }

  static async getBySlug(slug: string, clientIp?: string) {
    const product = await db.product.findUnique({
      where: { slug, deletedAt: null },
      select: PRODUCT_PUBLIC_SELECT,
    });

    if (!product) throw Errors.notFound("Product");

    // Deduplicate: only count once per IP per product per hour (Redis-backed for multi-instance safety)
    // Uses a lazy dynamic import so SSR pages work even without Redis configured (dev environment).
    const viewKey = `view:${product.id}:${clientIp || "anon"}`;
    let shouldCount: boolean;
    try {
      const { redis } = await import("@/lib/redis");
      const isNewView = await redis.set(viewKey, "1", { nx: true, ex: VIEW_DEDUP_TTL_SEC });
      shouldCount = !!isNewView;
    } catch {
      // Redis not available (e.g. dev without env vars) — always count
      shouldCount = true;
    }
    if (shouldCount) {
      await db.product.update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return product;
  }

  /**
   * Current slug of the product a stale link points to (renamed product or
   * an old Arabic slug), matched by the 6-hex suffix that never changes.
   */
  static async findSlugBySuffix(slug: string): Promise<string | null> {
    const suffix = slugSuffix(slug);
    if (!suffix) return null;
    const product = await db.product.findFirst({
      where: { slug: { endsWith: `-${suffix}` }, deletedAt: null },
      select: { slug: true },
    });
    return product?.slug ?? null;
  }

  static async create(input: CreateProductInput) {
    // ── Sanitize all free-text string fields against XSS ──────────────────
    const sanitizedInput: CreateProductInput = {
      ...input,
      name: sanitizeString(input.name),
      nameAr: input.nameAr ? sanitizeString(input.nameAr) : undefined,
      description: input.description ? sanitizeString(input.description) : undefined,
      descriptionAr: input.descriptionAr ? sanitizeString(input.descriptionAr) : undefined,
      metaTitle: input.metaTitle ? sanitizeString(input.metaTitle) : undefined,
      metaDescription: input.metaDescription ? sanitizeString(input.metaDescription) : undefined,
      warrantyCoverage: input.warrantyCoverage ? sanitizeString(input.warrantyCoverage) : undefined,
      images: input.images?.map((img) => ({
        ...img,
        alt: img.alt ? sanitizeString(img.alt) : undefined,
      })),
      specs: input.specs?.map((s) => ({
        ...s,
        key: sanitizeString(s.key),
        value: sanitizeString(s.value),
      })),
      variants: input.variants?.map((v) => ({
        ...v,
        name: sanitizeString(v.name),
      })),
    };

    // Verify branch exists before creating the product
    if (sanitizedInput.branchId) {
      const branch = await db.branch.findUnique({
        where: { id: sanitizedInput.branchId },
        select: { id: true },
      });
      if (!branch) throw Errors.notFound("Branch");
    }

    // Verify category exists if provided
    let categoryName: string | null = null;
    if (sanitizedInput.categoryId) {
      const category = await db.category.findUnique({
        where: { id: sanitizedInput.categoryId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!category) throw Errors.notFound("Category");
      categoryName = category.name;
    }

    // Verify brand exists if provided
    let brandName: string | null = null;
    if (sanitizedInput.brandId) {
      const brand = await db.brand.findUnique({
        where: { id: sanitizedInput.brandId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!brand) throw Errors.notFound("Brand");
      brandName = brand.name;
    }

    const finalSlug = buildProductSlug(
      { name: sanitizedInput.name, brand: brandName, category: categoryName },
      await uniqueSlugSuffix()
    );

    const sku = await generateUniqueSku();

    const { images, specs, variants, branchId, ...productData } = sanitizedInput;

    // ── Use transaction so product + branch inventory are atomic ──────────
    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...productData,
          slug: finalSlug,
          sku,
          images: images ? { createMany: { data: images } } : undefined,
          specs: specs ? { createMany: { data: specs } } : undefined,
          variants: variants
            ? {
                create: variants.map((v, i) => ({
                  name: v.name,
                  sku: `${sku}-V${i + 1}`,
                  price: v.price,
                  stock: v.stock,
                  attributes: v.attributes
                    ? { createMany: { data: v.attributes } }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: PRODUCT_INCLUDE,
      });

      if (branchId) {
        const existingInv = await tx.branchInventory.findFirst({
          where: { branchId, productId: created.id, variantId: null },
        });
        if (existingInv) {
          await tx.branchInventory.update({
            where: { id: existingInv.id },
            data: { stock: sanitizedInput.stock || 0 },
          });
        } else {
          await tx.branchInventory.create({
            data: {
              branchId,
              productId: created.id,
              variantId: null,
              stock: sanitizedInput.stock || 0,
            },
          });
        }
      }

      return created;
    });

    return product;
  }

  static async update(id: string, input: UpdateProductInput) {
    const existing = await db.product.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, name: true, slug: true, sku: true, brandId: true, categoryId: true },
    });
    if (!existing) throw Errors.notFound("Product");

    // ── Sanitize all free-text string fields against XSS ──────────────────
    const sanitizedInput: UpdateProductInput = {
      ...input,
      name: input.name ? sanitizeString(input.name) : undefined,
      nameAr: input.nameAr ? sanitizeString(input.nameAr) : undefined,
      description: input.description ? sanitizeString(input.description) : undefined,
      descriptionAr: input.descriptionAr ? sanitizeString(input.descriptionAr) : undefined,
      metaTitle: input.metaTitle ? sanitizeString(input.metaTitle) : undefined,
      metaDescription: input.metaDescription ? sanitizeString(input.metaDescription) : undefined,
      warrantyCoverage: input.warrantyCoverage ? sanitizeString(input.warrantyCoverage) : undefined,
      images: input.images?.map((img) => ({
        ...img,
        alt: img.alt ? sanitizeString(img.alt) : undefined,
      })),
      specs: input.specs?.map((s) => ({
        ...s,
        key: sanitizeString(s.key),
        value: sanitizeString(s.value),
      })),
      variants: input.variants?.map((v) => ({
        ...v,
        name: sanitizeString(v.name),
      })),
    };

    // Verify branch exists before updating the product
    if (sanitizedInput.branchId) {
      const branch = await db.branch.findUnique({
        where: { id: sanitizedInput.branchId },
        select: { id: true },
      });
      if (!branch) throw Errors.notFound("Branch");
    }

    // Verify category exists if provided
    if (sanitizedInput.categoryId) {
      const category = await db.category.findUnique({
        where: { id: sanitizedInput.categoryId, deletedAt: null },
        select: { id: true },
      });
      if (!category) throw Errors.notFound("Category");
    }

    // Verify brand exists if provided
    if (sanitizedInput.brandId) {
      const brand = await db.brand.findUnique({
        where: { id: sanitizedInput.brandId, deletedAt: null },
        select: { id: true },
      });
      if (!brand) throw Errors.notFound("Brand");
    }

    const { images, specs, variants, branchId, ...productData } = sanitizedInput;

    // The slug follows the name and brand; keeping its suffix lets old links redirect.
    let slugData = {};
    const nameChanged = !!sanitizedInput.name && sanitizedInput.name !== existing.name;
    const brandChanged = !!sanitizedInput.brandId && sanitizedInput.brandId !== existing.brandId;
    if (nameChanged || brandChanged) {
      const brandId = sanitizedInput.brandId ?? existing.brandId;
      const categoryId = sanitizedInput.categoryId ?? existing.categoryId;
      const brand = brandId
        ? await db.brand.findUnique({ where: { id: brandId }, select: { name: true } })
        : null;
      const category = categoryId
        ? await db.category.findUnique({ where: { id: categoryId }, select: { name: true } })
        : null;
      slugData = {
        slug: buildProductSlug(
          { name: sanitizedInput.name ?? existing.name, brand: brand?.name, category: category?.name },
          slugSuffix(existing.slug) ?? (await uniqueSlugSuffix())
        ),
      };
    }

    // ── Use transaction: delete old images/specs + update + branch inv ────
    const updatedProduct = await db.$transaction(async (tx) => {
      if (images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
      }
      if (specs) {
        await tx.productSpec.deleteMany({ where: { productId: id } });
      }
      if (variants) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }

      const cleanProductData = Object.fromEntries(
        Object.entries(productData).filter(([, v]) => v !== undefined)
      );

      const updated = await tx.product.update({
        where: { id },
        data: {
          ...cleanProductData,
          ...slugData,
          images: images ? { createMany: { data: images } } : undefined,
          specs: specs ? { createMany: { data: specs } } : undefined,
          variants: variants
            ? {
                create: variants.map((v, i) => ({
                  name: v.name,
                  sku: `${existing.sku}-V${i + 1}`,
                  price: v.price,
                  stock: v.stock,
                  attributes: v.attributes
                    ? { createMany: { data: v.attributes } }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: PRODUCT_INCLUDE,
      });

      if (branchId !== undefined) {
        await tx.branchInventory.deleteMany({ where: { productId: id } });
        if (branchId) {
          await tx.branchInventory.create({
            data: {
              branchId,
              productId: id,
              variantId: null,
              stock: sanitizedInput.stock ?? updated.stock,
            },
          });
        }
      }

      return updated;
    });

    return updatedProduct;
  }

  static async softDelete(id: string) {
    const existing = await db.product.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw Errors.notFound("Product");

    await db.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
