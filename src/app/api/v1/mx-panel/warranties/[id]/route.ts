import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { WarrantyService } from "@/lib/services/warranty.service";
import { z } from "zod";

const updateWarrantySchema = z.object({
  serialNumber: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "VOIDED"]).optional(),
  coverage: z.string().max(1000).optional(),
});

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const warranty = await WarrantyService.getById(id);
  return apiSuccess(warranty);
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateWarrantySchema);
  const warranty = await WarrantyService.update(id, input);
  return apiSuccess(warranty);
});
