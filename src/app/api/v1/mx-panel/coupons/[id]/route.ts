import { NextRequest } from "next/server";
import { salesRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateCouponSchema } from "@/lib/validators/coupon";
import { crudGet, crudDelete } from "@/lib/api/crud";
import { CouponService } from "@/lib/services/coupon.service";

export const GET = salesRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  return crudGet(id, {
    model: "coupon",
    include: {
      couponProducts: { select: { productId: true } },
      couponCategories: { select: { categoryId: true } },
    },
  });
});

export const PUT = salesRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateCouponSchema);
  const coupon = await CouponService.update(id, input);
  return apiSuccess(coupon);
});

export const DELETE = salesRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  return crudDelete(id, { model: "coupon", soft: true });
});
