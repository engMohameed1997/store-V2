import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { sanitizeString } from "@/lib/api/sanitize";
import { db } from "@/lib/db";
import { z } from "zod";

const shippingZoneSchema = z.object({
  name: z.string().min(2).max(100),
  governorates: z.array(z.string().min(1)).min(1),
  baseCost: z.number().min(0),
  freeAbove: z.number().min(0).optional().nullable(),
  estimatedDays: z.number().int().min(1),
  isActive: z.boolean().default(true),
});

export const GET = warehouseRoute(async () => {
  const zones = await db.shippingZone.findMany({
    orderBy: { createdAt: "desc" },
  });
  return apiSuccess(zones);
});

export const POST = warehouseRoute(async (request: NextRequest) => {
  const input = await validateBody(request, shippingZoneSchema);
  const sanitized = { ...input, name: sanitizeString(input.name) };
  const zone = await db.shippingZone.create({ data: sanitized });
  return apiCreated(zone);
});
