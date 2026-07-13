import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { crudUpdate, crudDelete } from "@/lib/api/crud";
import { validateBody } from "@/lib/api/validate";
import { sanitizeString } from "@/lib/api/sanitize";
import { z } from "zod";

const updateBannerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleAr: z.string().max(200).optional(),
  image: z.string().regex(
    /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp))$/i,
    "يجب رفع الصورة أولاً عبر نقطة الرفع الموحدة"
  ).optional(),
  mobileImage: z.string().regex(
    /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(jpg|jpeg|png|webp))$/i,
    "يجب رفع الصورة أولاً عبر نقطة الرفع الموحدة"
  ).optional(),
  videoUrl: z.string().regex(
    /^(\/uploads\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(mp4|webm)|\/minio\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-f0-9-]{36}\.(mp4|webm))$/i,
    "يجب رفع الفيديو أولاً عبر نقطة الرفع الموحدة"
  ).optional(),
  link: z.string().url().refine(
    (url) => !url.toLowerCase().startsWith("javascript:") && !url.toLowerCase().startsWith("data:"),
    "Invalid URL protocol"
  ).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateBannerSchema);
  const sanitized = { ...input } as Record<string, unknown>;
  if (input.title) sanitized.title = sanitizeString(input.title);
  if (input.titleAr) sanitized.titleAr = sanitizeString(input.titleAr);
  return crudUpdate(id, sanitized, { model: "banner" });
});

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  return crudDelete(id, { model: "banner" });
});
