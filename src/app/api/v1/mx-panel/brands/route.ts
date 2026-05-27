import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BrandService } from "@/lib/services/brand.service";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().min(2).max(100).optional(),
  logo: z.string().url().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const GET = adminRoute(async () => {
  const brands = await BrandService.list(false);
  return apiSuccess(brands);
});

export const POST = adminRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createBrandSchema);
  const brand = await BrandService.create(input);
  return apiCreated(brand);
});
