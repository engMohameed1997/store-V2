import { NextRequest } from "next/server";
import { warehouseRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BrandService } from "@/lib/services/brand.service";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().min(2).max(100).optional(),
  logo: z.string().regex(
    /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp))$/i,
    "يجب رفع الصورة أولاً عبر نقطة الرفع الموحدة"
  ).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const GET = warehouseRoute(async () => {
  const brands = await BrandService.list(false);
  return apiSuccess(brands);
});

export const POST = warehouseRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createBrandSchema);
  const brand = await BrandService.create(input);
  return apiCreated(brand);
});
