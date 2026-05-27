import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateCartItemSchema } from "@/lib/validators/cart";
import { CartService } from "@/lib/services/cart.service";

export const PUT = protectedRoute(async (request: NextRequest, context) => {
  const { itemId } = await context.params;
  const input = await validateBody(request, updateCartItemSchema);
  const cart = await CartService.updateItem(context.user!.userId, itemId, input);
  return apiSuccess(cart);
});

export const DELETE = protectedRoute(async (_request: NextRequest, context) => {
  const { itemId } = await context.params;
  const cart = await CartService.removeItem(context.user!.userId, itemId);
  return apiSuccess(cart);
});
