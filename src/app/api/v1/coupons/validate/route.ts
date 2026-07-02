import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { validateCouponSchema } from "@/lib/validators/coupon";
import { CouponService } from "@/lib/services/coupon.service";

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, validateCouponSchema);
  const result = await CouponService.validate(
    input.code,
    context.user!.userId,
    input.items
  );
  return apiSuccess(result);
});
