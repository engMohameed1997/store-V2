import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { sanitizeString } from "@/lib/api/sanitize";

export class BranchService {
  static async list(activeOnly = false) {
    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;

    return db.branch.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  static async get(id: string) {
    const branch = await db.branch.findUnique({
      where: { id },
      select: { id: true, name: true, nameAr: true, address: true, addressAr: true, phone: true, isActive: true },
    });
    if (!branch) throw Errors.notFound("Branch");
    return branch;
  }

  static async create(data: {
    name: string;
    nameAr?: string;
    address: string;
    addressAr?: string;
    phone: string;
    isActive?: boolean;
  }) {
    const sanitized = {
      ...data,
      name: sanitizeString(data.name),
      nameAr: data.nameAr ? sanitizeString(data.nameAr) : undefined,
      address: sanitizeString(data.address),
      addressAr: data.addressAr ? sanitizeString(data.addressAr) : undefined,
    };

    return db.branch.create({ data: sanitized });
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      nameAr: string;
      address: string;
      addressAr: string;
      phone: string;
      isActive: boolean;
    }>
  ) {
    const existing = await db.branch.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw Errors.notFound("Branch");

    const sanitized: Record<string, unknown> = { ...data };
    if (data.name) sanitized.name = sanitizeString(data.name);
    if (data.nameAr) sanitized.nameAr = sanitizeString(data.nameAr);
    if (data.address) sanitized.address = sanitizeString(data.address);
    if (data.addressAr) sanitized.addressAr = sanitizeString(data.addressAr);

    return db.branch.update({ where: { id }, data: sanitized });
  }

  static async delete(id: string) {
    const branch = await db.branch.findUnique({ where: { id }, select: { id: true } });
    if (!branch) throw Errors.notFound("Branch");

    // Delete associated inventories and the branch
    await db.$transaction([
      db.branchInventory.deleteMany({ where: { branchId: id } }),
      db.branch.delete({ where: { id } }),
    ]);
  }

  static async getInventory(branchId: string) {
    return db.branchInventory.findMany({
      where: { branchId },
      include: {
        product: { select: { id: true, name: true, nameAr: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });
  }

  static async setInventory(
    branchId: string,
    productId: string,
    variantId: string | null,
    stock: number
  ) {
    const branch = await db.branch.findUnique({ where: { id: branchId }, select: { id: true } });
    if (!branch) throw Errors.notFound("Branch");

    // Find existing inventory record
    const existing = await db.branchInventory.findFirst({
      where: {
        branchId,
        productId,
        variantId,
      },
    });

    if (existing) {
      // Update existing
      await db.branchInventory.update({
        where: { id: existing.id },
        data: { stock },
      });
    } else {
      // Create new
      await db.branchInventory.create({
        data: {
          branchId,
          productId,
          variantId,
          stock,
        },
      });
    }

    // Re-calculate and update total stock on the Product or ProductVariant
    if (variantId) {
      const totalVariantStock = await db.branchInventory.aggregate({
        where: { productId, variantId },
        _sum: { stock: true },
      });
      const newStock = totalVariantStock._sum.stock || 0;
      await db.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });
    } else {
      const totalProductStock = await db.branchInventory.aggregate({
        where: { productId, variantId: null },
        _sum: { stock: true },
      });
      const newStock = totalProductStock._sum.stock || 0;
      await db.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });
    }
  }
}
