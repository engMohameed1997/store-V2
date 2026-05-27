import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { loginSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";

export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, loginSchema);

  const result = await AuthService.login(input, {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  const response = apiSuccess(
    {
      accessToken: result.accessToken,
      user: result.user,
    },
    "Login successful"
  );

  // Set refresh token in HttpOnly cookie
  response.cookies.set("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return response;
}, "auth");
