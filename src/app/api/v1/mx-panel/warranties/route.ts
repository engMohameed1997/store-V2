import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { WarrantyService } from "@/lib/services/warranty.service";
import { sanitizeSearchQuery } from "@/lib/api/sanitize";

export const GET = warehouseRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const result = await WarrantyService.list({
    search: searchParams.get("search")
      ? sanitizeSearchQuery(searchParams.get("search")!)
      : undefined,
    status: searchParams.get("status") || undefined,
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
  });

  return apiPaginated(result.warranties, result.total, result.page, result.limit);
});
