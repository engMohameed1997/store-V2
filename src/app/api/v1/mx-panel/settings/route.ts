import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSettingsSchema = z.record(z.string(), z.unknown());

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
    await db.storeSetting.upsert({
      where: { key },
      create: { key, value: value as any, group: "general" },
      update: { value: value as any },
    });
  }

  return apiSuccess({ message: "Settings updated" });
});
