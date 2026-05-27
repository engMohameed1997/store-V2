import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiPaginated, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { createProductSchema } from "@/lib/validators/product";
import { ProductService } from "@/lib/services/product.service";
import { sanitizeSearchQuery } from "@/lib/api/sanitize";

export const GET = adminRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const result = await ProductService.list({
    search: searchParams.get("search")
      ? sanitizeSearchQuery(searchParams.get("search")!)
      : undefined,
    category: searchParams.get("category") || undefined,
    brand: searchParams.get("brand") || undefined,
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
    activeOnly: false,
  });

  return apiPaginated(result.products, result.total, result.page, result.limit);
});

export const POST = adminRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createProductSchema);
  const product = await ProductService.create(input);
  return apiCreated(product);
});
