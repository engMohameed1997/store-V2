import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { BrandService } from "@/lib/services/brand.service";

export const GET = publicRoute(async () => {
  const brands = await BrandService.list();
  return apiSuccess(brands);
});
