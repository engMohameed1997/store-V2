import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiPaginated, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { parsePagination } from "@/lib/api/pagination";
import { createOrderSchema } from "@/lib/validators/order";
import { OrderService } from "@/lib/services/order.service";

export const GET = protectedRoute(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const { page, limit } = parsePagination(searchParams);

  const result = await OrderService.getMyOrders(context.user!.userId, page, limit);
  return apiPaginated(result.orders, result.total, result.page, result.limit);
});

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, createOrderSchema);
  const order = await OrderService.create(context.user!.userId, input);
  return apiCreated(order);
}, "strict");
