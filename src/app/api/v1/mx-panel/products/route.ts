import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiPaginated, apiCreated } from "@/lib/api/response";
import { validateBody, validateQuery } from "@/lib/api/validate";
import { createProductSchema, productSearchSchema } from "@/lib/validators/product";
import { ProductService } from "@/lib/services/product.service";
import { sanitizeSearchQuery } from "@/lib/api/sanitize";

export const GET = adminRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = validateQuery(searchParams, productSearchSchema);

  const isActive = query.isActive === "true" ? true : query.isActive === "false" ? false : undefined;

  const result = await ProductService.list({
    search: query.search ? sanitizeSearchQuery(query.search) : undefined,
    category: query.category || undefined,
    brand: query.brand || undefined,
    page: query.page || 1,
    limit: query.limit || 20,
    sortBy: query.sortBy || undefined,
    sortOrder: query.sortOrder || undefined,
    activeOnly: false,
    isActive,
    branchId: query.branchId || undefined,
    stockStatus: query.stockStatus || undefined,
  });

  return apiPaginated(result.products, result.total, result.page, result.limit);
});

export const POST = adminRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createProductSchema);
  const product = await ProductService.create(input);
  return apiCreated(product);
});
