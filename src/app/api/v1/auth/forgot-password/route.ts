import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, forgotPasswordSchema);
  const result = await AuthService.forgotPassword(input.identifier);
  return apiSuccess(result);
}, "strict");
