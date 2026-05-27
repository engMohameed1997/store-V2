import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { addToCartSchema } from "@/lib/validators/cart";
import { CartService } from "@/lib/services/cart.service";

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const cart = await CartService.getOrCreate(context.user!.userId);
  return apiSuccess(cart);
});

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, addToCartSchema);
  const cart = await CartService.addItem(context.user!.userId, input);
  return apiSuccess(cart);
});

export const DELETE = protectedRoute(async (_request: NextRequest, context) => {
  await CartService.clear(context.user!.userId);
  return apiSuccess(null, "Cart cleared");
});
