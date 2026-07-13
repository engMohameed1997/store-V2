import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { sanitizeString } from "@/lib/api/sanitize";
import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { z } from "zod";

const updateShippingZoneSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  governorates: z.array(z.string().min(1)).min(1).optional(),
  baseCost: z.number().min(0).optional(),
  freeAbove: z.number().min(0).optional().nullable(),
  estimatedDays: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const GET = warehouseRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const zone = await db.shippingZone.findUnique({ where: { id } });
  if (!zone) throw Errors.notFound("ShippingZone");
  return apiSuccess(zone);
});

export const PUT = warehouseRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateShippingZoneSchema);
  const existing = await db.shippingZone.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("ShippingZone");
  const sanitized = { ...input, name: input.name ? sanitizeString(input.name) : undefined };
  const zone = await db.shippingZone.update({ where: { id }, data: sanitized });
  return apiSuccess(zone);
});

export const DELETE = warehouseRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const existing = await db.shippingZone.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("ShippingZone");
  await db.shippingZone.delete({ where: { id } });
  return apiNoContent();
});
