import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AnalyticsService } from "@/lib/services/analytics.service";

export const GET = adminRoute(async () => {
  const data = await AnalyticsService.getDashboard();
  return apiSuccess(data);
});
