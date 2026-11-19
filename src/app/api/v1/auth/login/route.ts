import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { loginSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { setAuthCookies } from "@/lib/api/auth-cookies";

export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, loginSchema);

  const result = await AuthService.login(input, {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  const response = apiSuccess({ user: result.user }, "تم تسجيل الدخول بنجاح.");

  setAuthCookies(response, result.accessToken, result.refreshToken);

  return response;
}, "auth");
