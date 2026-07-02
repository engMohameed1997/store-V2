import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { checkoutSummarySchema } from "@/lib/validators/checkout";
import { CartService } from "@/lib/services/cart.service";
import { CouponService } from "@/lib/services/coupon.service";
import { db } from "@/lib/db";

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, checkoutSummarySchema);
  const userId = context.user!.userId;

  const cart = await CartService.getOrCreate(userId);
  if (!cart.items.length) {
    return apiSuccess({
      subtotal: 0,
      discount: 0,
      shipping: null,
      total: 0,
      isFreeShipping: false,
    });
  }

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant
      ? Number(item.variant.price)
      : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  let discount = 0;
  let isFreeShipping = false;

  if (input.couponCode) {
    try {
      const couponItems = cart.items.map((i) => ({
        productId: i.product.id,
        categoryId: i.product.category?.id ?? null,
        price: i.variant ? Number(i.variant.price) : Number(i.product.price),
        quantity: i.quantity,
      }));
      const couponResult = await CouponService.validate(
        input.couponCode,
        userId,
        couponItems
      );
      discount = couponResult.discountAmount;
      isFreeShipping = couponResult.isFreeShipping;
    } catch {
      // Coupon invalid — return summary without discount
    }
  }

  // Calculate shipping from default address
  let shipping: number | null = null;
  const defaultAddress = await db.address.findFirst({
    where: { userId, isDefault: true, deletedAt: null },
  });

  if (defaultAddress) {
    const shippingZone = await db.shippingZone.findFirst({
      where: { governorates: { has: defaultAddress.governorate }, isActive: true },
    });

    if (shippingZone) {
      if (isFreeShipping) {
        shipping = 0;
      } else {
        shipping =
          shippingZone.freeAbove && subtotal >= Number(shippingZone.freeAbove)
            ? 0
            : Number(shippingZone.baseCost);
      }
    }
  }

  const total = Math.max(0, subtotal - discount + (shipping ?? 0));

  return apiSuccess({
    subtotal,
    discount,
    shipping,
    total,
    isFreeShipping,
  });
});
