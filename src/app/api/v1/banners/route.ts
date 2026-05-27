import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { BannerService } from "@/lib/services/banner.service";

export const GET = publicRoute(async () => {
  const banners = await BannerService.listActive();
  return apiSuccess(banners);
});
