import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { createAddressSchema } from "@/lib/validators/address";
import { AddressService } from "@/lib/services/address.service";

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const addresses = await AddressService.list(context.user!.userId);
  return apiSuccess(addresses);
});

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, createAddressSchema);
  const address = await AddressService.create(context.user!.userId, input);
  return apiCreated(address);
});
