import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateCategorySchema } from "@/lib/validators/category";
import { CategoryService } from "@/lib/services/category.service";

export const GET = warehouseRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const category = await CategoryService.getById(id);
  return apiSuccess(category);
});

export const PUT = warehouseRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateCategorySchema);
  const category = await CategoryService.update(id, input);
  return apiSuccess(category);
});

export const DELETE = warehouseRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  await CategoryService.delete(id);
  return apiNoContent();
});
