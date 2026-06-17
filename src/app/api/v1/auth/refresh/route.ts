import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { AppError } from "@/lib/api/errors";

export const POST = publicRoute(async (request: NextRequest) => {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    const response = apiSuccess(null, "No refresh token provided", 401);
    response.cookies.delete("refreshToken");
    return response;
  }

  try {
    const result = await AuthService.refreshTokens(refreshToken, {
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    });

    const response = apiSuccess({ accessToken: result.accessToken, user: result.user });

    // Set new refresh token in HttpOnly cookie
    response.cookies.set("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
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
