import { NextRequest } from "next/server";
import { salesRoute } from "@/lib/api/route-handler";
import { apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { createCouponSchema } from "@/lib/validators/coupon";
import { crudList } from "@/lib/api/crud";
import { CouponService } from "@/lib/services/coupon.service";

export const GET = salesRoute(async (request: NextRequest) => {
  return crudList(request, {
    model: "coupon",
    searchFields: ["code", "description"],
    allowedSortFields: ["createdAt", "code", "usageCount"],
    include: {
      couponProducts: { select: { productId: true } },
      couponCategories: { select: { categoryId: true } },
    },
  });
});

export const POST = salesRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createCouponSchema);
  const coupon = await CouponService.create(input);
  return apiCreated(coupon);
});
