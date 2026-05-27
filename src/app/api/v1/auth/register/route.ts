import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiCreated } from "@/lib/api/response";
import { registerByPhoneSchema, registerByEmailSchema } from "@/lib/validators/auth";
import { AuthService } from "@/lib/services/auth.service";

export const POST = publicRoute(async (request: NextRequest) => {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const body = await request.clone().json();
  const isPhoneRegistration = "phone" in body;

  if (isPhoneRegistration) {
    const input = await validateBody(request, registerByPhoneSchema);
    const result = await AuthService.registerByPhone(input);
    return apiCreated(result);
  }

  const input = await validateBody(request, registerByEmailSchema);
  const result = await AuthService.registerByEmail(input);
  return apiCreated(result);
}, "auth");
