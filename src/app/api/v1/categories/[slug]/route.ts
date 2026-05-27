import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { CategoryService } from "@/lib/services/category.service";

export const GET = publicRoute(async (_request: NextRequest, context) => {
  const { slug } = await context.params;
  const category = await CategoryService.getBySlug(slug);
  return apiSuccess(category);
});
