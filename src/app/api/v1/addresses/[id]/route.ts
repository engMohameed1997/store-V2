import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateAddressSchema } from "@/lib/validators/address";
import { AddressService } from "@/lib/services/address.service";

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const address = await AddressService.getById(id, context.user!.userId);
  return apiSuccess(address);
});

export const PUT = protectedRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateAddressSchema);
  const address = await AddressService.update(id, context.user!.userId, input);
  return apiSuccess(address);
});

export const DELETE = protectedRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  await AddressService.delete(id, context.user!.userId);
  return apiNoContent();
});
