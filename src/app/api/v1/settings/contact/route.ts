import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";

// Public endpoint — returns only WhatsApp/Telegram contact info (no auth required)
export const GET = publicRoute(async () => {
  const keys = ["socialWhatsapp", "socialTelegram", "whatsappGreeting", "storePhone"];
  const settings = await db.storeSetting.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value as string;
  }

  return apiSuccess(result);
});
