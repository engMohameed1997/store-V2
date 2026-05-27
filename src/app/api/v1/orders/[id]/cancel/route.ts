import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { cancelOrderSchema } from "@/lib/validators/order";
import { OrderService } from "@/lib/services/order.service";

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, cancelOrderSchema);
  const order = await OrderService.cancel(id, context.user!.userId, input);
  return apiSuccess(order);
});
