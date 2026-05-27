import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiPaginated } from "@/lib/api/response";
import { UserService } from "@/lib/services/user.service";

export const GET = adminRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const result = await UserService.adminList({
    search: searchParams.get("search") || undefined,
    role: searchParams.get("role") || undefined,
    status: searchParams.get("status") || undefined,
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 20),
  });

  return apiPaginated(result.users, result.total, result.page, result.limit);
});
