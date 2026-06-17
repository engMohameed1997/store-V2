import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AnalyticsService } from "@/lib/services/analytics.service";

export const GET = adminRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const skipCache = searchParams.get("refresh") === "true";
  const reports = await AnalyticsService.getReports(skipCache);
  return apiSuccess(reports);
});
