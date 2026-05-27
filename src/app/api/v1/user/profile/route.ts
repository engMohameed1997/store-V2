import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateProfileSchema } from "@/lib/validators/user";
import { UserService } from "@/lib/services/user.service";

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const profile = await UserService.getProfile(context.user!.userId);
  return apiSuccess(profile);
});

export const PUT = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, updateProfileSchema);
  const profile = await UserService.updateProfile(context.user!.userId, input);
  return apiSuccess(profile);
});
