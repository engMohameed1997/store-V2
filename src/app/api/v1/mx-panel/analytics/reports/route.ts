import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AnalyticsService } from "@/lib/services/analytics.service";

export const GET = adminRoute(async () => {
  const reports = await AnalyticsService.getReports();
  return apiSuccess(reports);
});
