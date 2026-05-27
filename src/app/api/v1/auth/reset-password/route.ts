import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, resetPasswordSchema);
  const result = await AuthService.resetPassword(input.token, input.password);
  return apiSuccess(result);
}, "strict");
