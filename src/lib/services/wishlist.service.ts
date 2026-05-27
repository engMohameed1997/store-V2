import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";

const WISHLIST_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      nameAr: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      isActive: true,
      images: { where: { isPrimary: true }, take: 1 },
    },
  },
};

export class WishlistService {
  static async list(userId: string) {
    return db.wishlistItem.findMany({
      where: { userId },
      include: WISHLIST_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
  }

  static async toggle(userId: string, productId: string) {
    const product = await db.product.findUnique({
      where: { id: productId, isActive: true, deletedAt: null },
    });
    if (!product) throw Errors.notFound("Product");

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return { added: false };
    }

    await db.wishlistItem.create({ data: { userId, productId } });
    return { added: true };
  }

  static async remove(userId: string, productId: string) {
    await db.wishlistItem.deleteMany({ where: { userId, productId } });
  }
}
