import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { AppError } from "@/lib/api/errors";
import { REFRESH_TOKEN_COOKIE_MAX_AGE, ACCESS_TOKEN_COOKIE_MAX_AGE } from "@/lib/api/jwt";

export const POST = publicRoute(async (request: NextRequest) => {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    const response = apiSuccess(null, "لا يوجد رمز تحديث.", 401);
    response.cookies.delete("refreshToken");
    return response;
  }

  try {
    const result = await AuthService.refreshTokens(refreshToken, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    const response = apiSuccess({ user: result.user });

    // Rotate access token cookie
    const isSecure = process.env.NODE_ENV === "production" && process.env.HTTPS_ENABLED === "true";

    response.cookies.set("accessToken", result.accessToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      path: "/",
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
    });

    // Rotate refresh token cookie
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      const response = apiSuccess(null, error.message, 401);
      response.cookies.delete("refreshToken");
      return response;
    }
    throw error;
  }
}, "refresh");
