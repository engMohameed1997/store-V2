import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { loginSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { REFRESH_TOKEN_COOKIE_MAX_AGE, ACCESS_TOKEN_COOKIE_MAX_AGE } from "@/lib/api/jwt";

export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, loginSchema);

  const result = await AuthService.login(input, {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  const response = apiSuccess({ user: result.user }, "Login successful");

  // Access token: HttpOnly cookie — never exposed to JavaScript
  const isSecure = process.env.NODE_ENV === "production" && process.env.HTTPS_ENABLED === "true";

  response.cookies.set("accessToken", result.accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  // Refresh token: HttpOnly cookie — used to rotate access tokens
  response.cookies.set("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });

  return response;
}, "auth");
