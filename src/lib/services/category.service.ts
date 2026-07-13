import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { sanitizeString } from "@/lib/api/sanitize";

const CATEGORY_INCLUDE = {
  children: {
    where: { isActive: true, deletedAt: null },
    orderBy: { position: "asc" as const },
  },
  parent: { select: { id: true, name: true, slug: true } },
  _count: { select: { products: true } },
};

export class CategoryService {
  static async list(activeOnly = true) {
    const where: Record<string, unknown> = { parentId: null, deletedAt: null };
    if (activeOnly) where.isActive = true;

    return db.category.findMany({
      where,
      include: CATEGORY_INCLUDE,
      orderBy: { position: "asc" },
    });
  }

  static async getBySlug(slug: string) {
    const category = await db.category.findUnique({
      where: { slug, deletedAt: null },
      include: CATEGORY_INCLUDE,
    });

    if (!category) throw Errors.notFound("Category");
    return category;
  }

  static async getById(id: string) {
    const category = await db.category.findUnique({
      where: { id, deletedAt: null },
      include: CATEGORY_INCLUDE,
    });

    if (!category) throw Errors.notFound("Category");
    return category;
  }

  static async create(data: {
    name: string;
    nameAr?: string;
    description?: string;
    image?: string;
    parentId?: string | null;
    position?: number;
    isActive?: boolean;
  }) {
    let slug = data.name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `category-${Date.now().toString(36)}`;

    const sanitized = {
      ...data,
      name: sanitizeString(data.name),
      nameAr: data.nameAr ? sanitizeString(data.nameAr) : undefined,
      description: data.description ? sanitizeString(data.description) : undefined,
    };

    return db.category.create({
      data: { ...sanitized, slug },
      include: CATEGORY_INCLUDE,
    });
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      nameAr: string;
      description: string;
      image: string;
      parentId: string | null;
      position: number;
      isActive: boolean;
    }>
  ) {
    const existing = await db.category.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw Errors.notFound("Category");

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) updateData.name = sanitizeString(data.name);
    if (data.nameAr) updateData.nameAr = sanitizeString(data.nameAr);
    if (data.description) updateData.description = sanitizeString(data.description);
    if (data.name) {
      let slug = data.name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (!slug) slug = `category-${Date.now().toString(36)}`;
      updateData.slug = slug;
    }

    return db.category.update({
      where: { id },
      data: updateData,
      include: CATEGORY_INCLUDE,
    });
  }

  static async delete(id: string) {
    const category = await db.category.findUnique({
      where: { id, deletedAt: null },
      include: { children: { where: { deletedAt: null } }, products: { where: { deletedAt: null }, take: 1 } },
    });

    if (!category) throw Errors.notFound("Category");
    if (category.children.length > 0) {
      throw Errors.badRequest("Cannot delete category with subcategories");
    }
    if (category.products.length > 0) {
      throw Errors.badRequest("Cannot delete category with products");
    }

    await db.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
