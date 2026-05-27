import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiNoContent } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BrandService } from "@/lib/services/brand.service";
import { z } from "zod";

const updateBrandSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nameAr: z.string().min(2).max(100).optional(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateBrandSchema);
  const brand = await BrandService.update(id, input);
  return apiSuccess(brand);
});

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  await BrandService.delete(id);
  return apiNoContent();
});
