import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

export const POST = publicRoute(async (request: NextRequest) => {
  const { email } = await validateBody(request, subscribeSchema);

  // Use StoreSetting as a simple newsletter store
  const key = `newsletter:${email.toLowerCase()}`;

  await db.storeSetting.upsert({
    where: { key },
    create: {
      key,
      value: { email: email.toLowerCase(), subscribedAt: new Date().toISOString() },
      group: "newsletter",
    },
    update: {
      value: { email: email.toLowerCase(), subscribedAt: new Date().toISOString(), resubscribed: true },
    },
  });

  return apiSuccess({ message: "Subscribed successfully" });
}, "strict");
