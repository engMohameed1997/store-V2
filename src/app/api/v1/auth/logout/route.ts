import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { AuthService } from "@/lib/services/auth.service";

export const POST = protectedRoute(async (request: NextRequest) => {
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (refreshToken) {
    await AuthService.logout(refreshToken);
  }

  const response = apiSuccess(null, "Logged out successfully");

  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");

  return response;
});
