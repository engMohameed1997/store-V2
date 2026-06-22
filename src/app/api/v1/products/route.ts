import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { ProductService } from "@/lib/services/product.service";
import { productSearchSchema } from "@/lib/validators/product";
import { validateQuery } from "@/lib/api/validate";
import { sanitizeSearchQuery } from "@/lib/api/sanitize";
import { optionalAuth } from "@/lib/api/auth-guard";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const filters = validateQuery(searchParams, productSearchSchema);

  const sanitizedQuery = filters.search ? sanitizeSearchQuery(filters.search) : undefined;

  if (sanitizedQuery && sanitizedQuery.trim().length > 1) {
    const authUser = await optionalAuth(request);
    db.searchHistory.create({
      data: {
        query: sanitizedQuery.trim().toLowerCase(),
        userId: authUser?.userId || null,
      }
    }).catch(err => logger.warn("Failed to log search history", { error: err }));
  }

  const result = await ProductService.list({
    ...filters,
    search: sanitizedQuery,
  });

  return apiPaginated(result.products, result.total, result.page, result.limit);
}, "search");
