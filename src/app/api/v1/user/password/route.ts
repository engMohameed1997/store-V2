import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { changePasswordSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const PATCH = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, changePasswordSchema);
  const result = await AuthService.changePassword(
    context.user!.userId,
    input.currentPassword,
    input.newPassword
  );
  return apiSuccess(result);
}, "auth");
