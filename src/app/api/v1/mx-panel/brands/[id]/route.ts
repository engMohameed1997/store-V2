import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
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

export const PUT = warehouseRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateBrandSchema);
  const brand = await BrandService.update(id, input);
  return apiSuccess(brand);
});
