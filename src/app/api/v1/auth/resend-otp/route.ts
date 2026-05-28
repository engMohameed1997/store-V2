import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { resendOtpSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const POST = publicRoute(async (request: NextRequest) => {
  const { phone } = await validateBody(request, resendOtpSchema);
  const result = await AuthService.resendOtp(phone);
  return apiSuccess(result);
}, "strict");
