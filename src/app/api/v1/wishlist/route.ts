import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { WishlistService } from "@/lib/services/wishlist.service";
import { z } from "zod";
import { validateBody } from "@/lib/api/validate";

const toggleWishlistSchema = z.object({
  productId: z.string().cuid(),
});

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const items = await WishlistService.list(context.user!.userId);
  return apiSuccess(items);
});

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, toggleWishlistSchema);
  const result = await WishlistService.toggle(context.user!.userId, input.productId);
  return apiSuccess(result);
});
