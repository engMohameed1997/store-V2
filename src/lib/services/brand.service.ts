import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";

export class BrandService {
  static async list(activeOnly = true) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (activeOnly) where.isActive = true;

    return db.brand.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  }

  static async getBySlug(slug: string) {
    const brand = await db.brand.findUnique({ where: { slug, deletedAt: null } });
    if (!brand) throw Errors.notFound("Brand");
    return brand;
  }

  static async create(data: {
    name: string;
    nameAr?: string;
    logo?: string;
    description?: string;
    isActive?: boolean;
  }) {
    let slug = data.name
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `brand-${Date.now().toString(36)}`;

    return db.brand.create({ data: { ...data, slug } });
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      nameAr: string;
      logo: string;
      description: string;
      isActive: boolean;
    }>
  ) {
    const existing = await db.brand.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw Errors.notFound("Brand");

    const updateData: Record<string, unknown> = { ...data };
    if (data.name) {
      let slug = data.name
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (!slug) slug = `brand-${Date.now().toString(36)}`;
      updateData.slug = slug;
    }

    return db.brand.update({ where: { id }, data: updateData });
  }

  static async delete(id: string) {
    const brand = await db.brand.findUnique({
      where: { id, deletedAt: null },
      include: { products: { where: { deletedAt: null }, take: 1 } },
    });

    if (!brand) throw Errors.notFound("Brand");
    if (brand.products.length > 0) {
      throw Errors.badRequest("Cannot delete brand with products");
    }

    await db.brand.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
