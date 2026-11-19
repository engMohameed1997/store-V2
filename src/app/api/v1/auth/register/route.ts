import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { registerSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

/** Sign-up step 1: emails a confirmation code. The account is created in /verify-email. */
export const POST = publicRoute(async (request: NextRequest) => {
  const input = await validateBody(request, registerSchema);
  const result = await AuthService.register(input);
  return apiSuccess({ registrationToken: result.registrationToken, email: result.email }, result.message);
}, "auth");
