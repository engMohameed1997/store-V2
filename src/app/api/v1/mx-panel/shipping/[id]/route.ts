import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
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

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const zone = await db.shippingZone.findUnique({ where: { id } });
  if (!zone) throw Errors.notFound("ShippingZone");
  return apiSuccess(zone);
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateShippingZoneSchema);
  const existing = await db.shippingZone.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("ShippingZone");
  const zone = await db.shippingZone.update({ where: { id }, data: input });
  return apiSuccess(zone);
});

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const existing = await db.shippingZone.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("ShippingZone");
  await db.shippingZone.delete({ where: { id } });
  return apiNoContent();
});
