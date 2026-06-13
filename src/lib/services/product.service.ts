import crypto from "crypto";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validators/product";
import { MAX_PAGINATION_LIMIT } from "@/lib/constants/pagination";

// View deduplication: prevents viewCount inflation (1 count per IP per product per hour)
const VIEW_DEDUP_TTL_MS = 60 * 60 * 1000; // 1 hour
const recentViews = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentViews.entries()) {
    if (now - ts > VIEW_DEDUP_TTL_MS) recentViews.delete(key);
  }
}, 10 * 60 * 1000); // cleanup every 10 min

const PRODUCT_INCLUDE = {
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

function generateSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  if (!slug) {
    slug = "product";
  }

  // Always append a unique suffix: 6-char random hex for collision resistance
  const uniqueSuffix = crypto.randomBytes(3).toString("hex");
  return `${slug}-${uniqueSuffix}`;
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
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, MAX_PAGINATION_LIMIT);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (filters.activeOnly !== false) where.isActive = true;

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

    if (filters.inStock) where.stock = { gt: 0 };
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

  static async getBySlug(slug: string, clientIp?: string) {
    const product = await db.product.findUnique({
      where: { slug, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });

    if (!product) throw Errors.notFound("Product");

    // Deduplicate: only count once per IP per product per hour
    const viewKey = `${product.id}:${clientIp || "anon"}`;
    if (!recentViews.has(viewKey)) {
      recentViews.set(viewKey, Date.now());
      await db.product.update({
        where: { id: product.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return product;
  }

  static async create(input: CreateProductInput) {
    // Generate unique slug with retry for extremely rare collisions
    let finalSlug = generateSlug(input.name);
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await db.product.findUnique({ where: { slug: finalSlug }, select: { id: true } });
      if (!existing) break;
      finalSlug = generateSlug(input.name);
    }

    const sku = await generateUniqueSku();

    const { images, specs, variants, ...productData } = input;

    return db.product.create({
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
  }

  static async update(id: string, input: UpdateProductInput) {
    const existing = await db.product.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw Errors.notFound("Product");

    const { images, specs, variants, ...productData } = input;

    let slugData = {};
    if (input.name && input.name !== existing.name) {
      let newSlug = generateSlug(input.name);
      for (let attempt = 0; attempt < 5; attempt++) {
        const slugExists = await db.product.findFirst({
          where: { slug: newSlug, id: { not: id } },
          select: { id: true },
        });
        if (!slugExists) break;
        newSlug = generateSlug(input.name);
      }
      slugData = { slug: newSlug };
    }

    if (images) {
      await db.productImage.deleteMany({ where: { productId: id } });
    }
    if (specs) {
      await db.productSpec.deleteMany({ where: { productId: id } });
    }

    return db.product.update({
      where: { id },
      data: {
        ...productData,
        ...slugData,
        images: images ? { createMany: { data: images } } : undefined,
        specs: specs ? { createMany: { data: specs } } : undefined,
      },
      include: PRODUCT_INCLUDE,
    });
  }

  static async softDelete(id: string) {
    const existing = await db.product.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw Errors.notFound("Product");

    await db.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
