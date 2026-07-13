import { NextRequest } from "next/server";
import { salesRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { OrderService } from "@/lib/services/order.service";

export const GET = salesRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const result = await OrderService.adminList({
    status: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
  });

  return apiPaginated(result.orders, result.total, result.page, result.limit);
});
