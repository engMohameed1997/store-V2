import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { OrderService } from "@/lib/services/order.service";

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const order = await OrderService.getById(id, context.user!.userId);
  return apiSuccess(order);
});
