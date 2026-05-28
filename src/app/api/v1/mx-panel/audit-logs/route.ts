import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { AuditService } from "@/lib/services/audit.service";

export const GET = adminRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const userId = searchParams.get("userId") || undefined;
  const action = searchParams.get("action") || undefined;
  const entity = searchParams.get("entity") || undefined;

  const result = await AuditService.list({ page, limit, userId, action, entity });
  return apiPaginated(result.logs, result.total, result.page, result.limit);
});
