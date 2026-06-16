import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { crudUpdate, crudDelete } from "@/lib/api/crud";
import { validateBody } from "@/lib/api/validate";
import { z } from "zod";

const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleAr: z.string().max(200).optional(),
  image: z.string().url().optional(),
  mobileImage: z.string().url().optional(),
  videoUrl: z.string().optional(),
  link: z.string().url().optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateBannerSchema);
  return crudUpdate(id, input as unknown as Record<string, unknown>, { model: "banner" });
});

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  return crudDelete(id, { model: "banner" });
});
