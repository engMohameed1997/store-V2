import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { sanitizeString } from "@/lib/api/sanitize";
import { db } from "@/lib/db";
import { z } from "zod";

const ALLOWED_SETTING_KEYS = [
  "storeName",
  "storeNameAr",
  "storeDescription",
  "storeEmail",
  "storePhone",
  "storePhone2",
  "storeAddress",
  "storeLogo",
  "storeFavicon",
  "socialFacebook",
  "socialInstagram",
  "socialTiktok",
  "socialWhatsapp",
  "socialTelegram",
  "whatsappNumber",
  "whatsappGreeting",
  "whatsappGreetingAr",
  "facebookUrl",
  "instagramUrl",
  "twitterUrl",
  "tiktokUrl",
  "termsAndConditions",
  "privacyPolicy",
  "returnPolicy",
  "telegramBotToken",
  "telegramChatId",
  "searchKeywords",
  "metaTitle",
  "metaDescription",
  "maintenanceMode",
  "allowGuestCheckout",
  "defaultCurrency",
  "defaultLanguage",
  "orderMinAmount",
  "freeShippingThreshold",
] as const;

const allowedKeysSet = new Set<string>(ALLOWED_SETTING_KEYS);

const updateSettingsSchema = z
  .record(z.string(), z.union([z.string().max(2000), z.number(), z.boolean()]))
  .refine(
    (obj) => Object.keys(obj).every((k) => allowedKeysSet.has(k)),
    { message: "One or more keys are not allowed" }
  );

export const GET = adminRoute(async () => {
  const settings = await db.storeSetting.findMany({
    where: { group: "general" },
  });
  const result: Record<string, unknown> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return apiSuccess(result);
});

export const PUT = adminRoute(async (request: NextRequest) => {
  const input = await validateBody(request, updateSettingsSchema);

  for (const [key, value] of Object.entries(input)) {
    const sanitized = typeof value === "string" ? sanitizeString(value) : value;
    await db.storeSetting.upsert({
      where: { key },
      create: { key, value: sanitized as string | number | boolean, group: "general" },
      update: { value: sanitized as string | number | boolean },
    });
  }

  return apiSuccess({ message: "Settings updated" });
});
