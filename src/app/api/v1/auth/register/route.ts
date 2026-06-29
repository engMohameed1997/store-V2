import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiCreated } from "@/lib/api/response";
import { registerByPhoneSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { REFRESH_TOKEN_COOKIE_MAX_AGE, ACCESS_TOKEN_COOKIE_MAX_AGE } from "@/lib/api/jwt";
import { verifyPreAuthToken } from "@/lib/api/pre-auth-token";
import { Errors } from "@/lib/api/errors";

export const POST = publicRoute(async (request: NextRequest) => {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const input = await validateBody(request, registerByPhoneSchema);

  if (!input.preAuthToken) {
    throw Errors.badRequest("تعذّر إنشاء الحساب. حاول لاحقاً.");
  }

  const preAuth = verifyPreAuthToken(input.preAuthToken);
  if (!preAuth) {
    throw Errors.badRequest("انتهت الجلسة. أعد المحاولة.");
  }

  const cleanedPreAuth = preAuth.phone.replace(/^(\+964|00964|0)/, "");
  const cleanedInput = input.phone.replace(/^(\+964|00964|0)/, "");
  if (cleanedPreAuth !== cleanedInput) {
    throw Errors.badRequest("رقم الهاتف غير مطابق.");
  }

  const result = await AuthService.registerByPhone(input, {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  const response = apiCreated({ user: result.user }, result.message);

  const isSecure = process.env.NODE_ENV === "production" && process.env.HTTPS_ENABLED === "true";

  response.cookies.set("accessToken", result.accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  response.cookies.set("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });

  return response;
}, "auth");
