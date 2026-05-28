import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { verifyEmailSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const POST = publicRoute(async (request: NextRequest) => {
  const { token } = await validateBody(request, verifyEmailSchema);
  const result = await AuthService.verifyEmail(token);
  return apiSuccess(result);
}, "auth");
