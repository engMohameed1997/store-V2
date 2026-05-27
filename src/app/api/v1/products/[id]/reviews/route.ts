import { NextRequest } from "next/server";
import { publicRoute, protectedRoute } from "@/lib/api/route-handler";
import { apiPaginated, apiCreated } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { parsePagination } from "@/lib/api/pagination";
import { ReviewService } from "@/lib/services/review.service";
import { validateBody } from "@/lib/api/validate";
import { createReviewSchema } from "@/lib/validators/review";

export const GET = publicRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const { page, limit } = parsePagination(searchParams);

  const result = await ReviewService.listByProduct(id, page, limit);
  return apiPaginated(result.reviews, result.total, result.page, result.limit);
});

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, createReviewSchema);

  if (input.productId !== id) {
    throw Errors.badRequest("Product ID in body does not match URL parameter");
  }

  const review = await ReviewService.create(context.user!.userId, input);
  return apiCreated(review);
});
