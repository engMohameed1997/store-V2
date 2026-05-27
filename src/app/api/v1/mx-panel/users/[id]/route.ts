import { NextRequest } from "next/server";
import { adminRoute, superAdminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { adminUpdateUserSchema } from "@/lib/validators/user";
import { UserService } from "@/lib/services/user.service";
import { AuditService } from "@/lib/services/audit.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const user = await UserService.getProfile(id);
  return apiSuccess(user);
});

export const PUT = superAdminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, adminUpdateUserSchema);
  const oldUser = await UserService.getProfile(id);
  const user = await UserService.adminUpdate(id, input, context.user!.userId);
  await AuditService.log({
    userId: context.user!.userId,
    action: "UPDATE",
    entity: "User",
    entityId: id,
    oldData: oldUser,
    newData: input,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  return apiSuccess(user);
});

export const DELETE = superAdminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  await UserService.adminDelete(id, context.user!.userId);
  await AuditService.log({
    userId: context.user!.userId,
    action: "DELETE",
    entity: "User",
    entityId: id,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  return apiNoContent();
});
