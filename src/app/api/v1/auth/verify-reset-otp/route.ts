import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { verifyResetOtpSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, verifyResetOtpSchema);
  const result = await AuthService.verifyResetOtp(input);
  return apiSuccess(result);
}, "strict");
