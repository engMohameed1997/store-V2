import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiCreated } from "@/lib/api/response";
import { verifyEmailSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { setAuthCookies } from "@/lib/api/auth-cookies";

/** Sign-up step 2: confirms the emailed code, creates the account and signs in. */
export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, verifyEmailSchema);
  const result = await AuthService.verifyEmailAndCreate(input.registrationToken, input.code, {
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });

  const response = apiCreated({ user: result.user }, result.message);
  setAuthCookies(response, result.accessToken, result.refreshToken);
  return response;
}, "strict");
