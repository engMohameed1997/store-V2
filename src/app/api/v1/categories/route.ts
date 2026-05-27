import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { CategoryService } from "@/lib/services/category.service";

export const GET = publicRoute(async () => {
  const categories = await CategoryService.list();
  return apiSuccess(categories);
});
