import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { ProductService } from "@/lib/services/product.service";

export const GET = publicRoute(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);

  const result = await ProductService.list({
    category: slug,
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
  });

  return apiPaginated(result.products, result.total, result.page, result.limit);
});
