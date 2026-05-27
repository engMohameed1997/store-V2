import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { BannerService } from "@/lib/services/banner.service";
import { crudCreate } from "@/lib/api/crud";
import { z } from "zod";

const createBannerSchema = z.object({
  title: z.string().min(1).max(200),
  titleAr: z.string().max(200).optional(),
  image: z.string().url(),
  mobileImage: z.string().url().optional(),
  link: z.string().url().optional(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const GET = adminRoute(async () => {
  const banners = await BannerService.listAll();
  return apiSuccess(banners);
});

export const POST = adminRoute(async (request: NextRequest) => {
  const input = await validateBody(request, createBannerSchema);
  return crudCreate(input as unknown as Record<string, unknown>, { model: "banner" });
});
