import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { createCategorySchema } from "@/lib/validators/category";
import { CategoryService } from "@/lib/services/category.service";

export const GET = warehouseRoute(async () => {
  const categories = await CategoryService.list(false);
  return apiSuccess(categories);
});

export const POST = warehouseRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createCategorySchema);
  const category = await CategoryService.create(input);
  return apiCreated(category);
});
