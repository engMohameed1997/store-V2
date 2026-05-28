import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { AddToCartInput, UpdateCartItemInput } from "@/lib/validators/cart";

const CART_INCLUDE = {
  items: {
    include: {
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
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" as const },
  },
};

const MAX_CART_ITEMS = 50;
const MAX_QUANTITY_PER_ITEM = 100;

export class CartService {
  static async getOrCreate(userId: string) {
    let cart = await db.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
        include: CART_INCLUDE,
      });
    }

    // Non-null guaranteed after create above
    const resolvedCart = cart;

    // Remove stale items (inactive/deleted products or variants)
    const staleIds = resolvedCart.items
      .filter((item) => !item.product.isActive || (item.variant && !item.variant.isActive))
      .map((item) => item.id);

    if (staleIds.length > 0) {
      await db.cartItem.deleteMany({ where: { id: { in: staleIds } } });
      return (await db.cart.findUnique({ where: { userId }, include: CART_INCLUDE }))!;
    }

    return resolvedCart;
  }

  static async addItem(userId: string, input: AddToCartInput) {
    const product = await db.product.findUnique({
      where: { id: input.productId, isActive: true, deletedAt: null },
    });

    if (!product) throw Errors.notFound("Product");

    let availableStock = product.stock;
    if (input.variantId) {
      const variant = await db.productVariant.findUnique({
        where: { id: input.variantId },
      });
      if (!variant || variant.productId !== input.productId) {
        throw Errors.badRequest("Variant does not belong to this product");
      }
      if (!variant.isActive) {
        throw Errors.badRequest("Variant is not available");
      }
      availableStock = variant.stock;
    }

    if (availableStock < input.quantity) {
      throw Errors.badRequest(`Only ${availableStock} items available`);
    }

    if (input.quantity > MAX_QUANTITY_PER_ITEM) {
      throw Errors.badRequest(`Maximum quantity per item is ${MAX_QUANTITY_PER_ITEM}`);
    }

    const cart = await this.getOrCreate(userId);

    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId ?? null,
      },
    });

    if (!existingItem) {
      const itemCount = await db.cartItem.count({ where: { cartId: cart.id } });
      if (itemCount >= MAX_CART_ITEMS) {
        throw Errors.badRequest(`Cart limit reached (max ${MAX_CART_ITEMS} items)`);
      }
    }

    if (existingItem) {
      const newQty = existingItem.quantity + input.quantity;
      if (newQty > availableStock) {
        throw Errors.badRequest(`Only ${availableStock} items available`);
      }
      if (newQty > MAX_QUANTITY_PER_ITEM) {
        throw Errors.badRequest(`Maximum quantity per item is ${MAX_QUANTITY_PER_ITEM}`);
      }

      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: input.productId,
          variantId: input.variantId,
          quantity: input.quantity,
        },
      });
    }

    return this.getOrCreate(userId);
  }

  static async updateItem(userId: string, itemId: string, input: UpdateCartItemInput) {
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) throw Errors.notFound("Cart");

    const item = await db.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true, variant: true },
    });

    if (!item) throw Errors.notFound("Cart item");

    const stock = item.variant?.stock ?? item.product.stock;
    if (input.quantity > stock) {
      throw Errors.badRequest(`Only ${stock} items available`);
    }
    if (input.quantity > MAX_QUANTITY_PER_ITEM) {
      throw Errors.badRequest(`Maximum quantity per item is ${MAX_QUANTITY_PER_ITEM}`);
    }

    await db.cartItem.update({
      where: { id: itemId },
      data: { quantity: input.quantity },
    });

    return this.getOrCreate(userId);
  }

  static async removeItem(userId: string, itemId: string) {
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) throw Errors.notFound("Cart");

    const item = await db.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) throw Errors.notFound("Cart item");

    await db.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreate(userId);
  }

  static async clear(userId: string) {
    const cart = await db.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
