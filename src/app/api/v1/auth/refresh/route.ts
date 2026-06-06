import { NextRequest, NextResponse } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";

export const POST = publicRoute(async (request: NextRequest) => {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    return apiSuccess(null, "No refresh token provided", 401);
  }

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
}, "auth");
