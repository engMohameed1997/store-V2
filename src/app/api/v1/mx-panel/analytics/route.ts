import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AnalyticsService } from "@/lib/services/analytics.service";

export const GET = adminRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const skipCache = searchParams.get("refresh") === "true";
  const data = await AnalyticsService.getDashboard(skipCache);
  return apiSuccess(data);
});
