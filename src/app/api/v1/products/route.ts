import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { ProductService } from "@/lib/services/product.service";
import { productSearchSchema } from "@/lib/validators/product";
import { validateQuery } from "@/lib/api/validate";
import { sanitizeSearchQuery } from "@/lib/api/sanitize";

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const filters = validateQuery(searchParams, productSearchSchema);

  const result = await ProductService.list({
    ...filters,
    search: filters.search ? sanitizeSearchQuery(filters.search) : undefined,
  });

  return apiPaginated(result.products, result.total, result.page, result.limit);
}, "search");
