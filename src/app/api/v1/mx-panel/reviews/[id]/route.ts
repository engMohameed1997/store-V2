import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { adminReplySchema } from "@/lib/validators/review";
import { ReviewService } from "@/lib/services/review.service";

export const PUT = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const review = await ReviewService.adminApprove(id);
  return apiSuccess(review, "Review approved");
});

export const POST = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, adminReplySchema);
  const review = await ReviewService.adminReply(id, input.reply);
  return apiSuccess(review);
});

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  await ReviewService.adminDelete(id);
  return apiNoContent();
});
