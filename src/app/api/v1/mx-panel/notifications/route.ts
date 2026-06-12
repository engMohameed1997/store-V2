import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { db } from "@/lib/db";
import { z } from "zod";

const sendNotificationSchema = z.object({
  title: z.string().min(2).max(100),
  body: z.string().min(2).max(1000),
  type: z.enum(["PROMOTION", "SYSTEM"]).default("SYSTEM"),
  target: z.enum(["ALL", "CUSTOMERS", "ADMINS"]).default("ALL"),
});

export const POST = adminRoute(async (request: NextRequest) => {
  const input = await validateBody(request, sendNotificationSchema);

  // Find target users
  const where: Record<string, any> = { deletedAt: null };
  if (input.target === "CUSTOMERS") {
    where.role = "CUSTOMER";
  } else if (input.target === "ADMINS") {
    where.role = "ADMIN";
  }

  const users = await db.user.findMany({
    where,
    select: { id: true },
  });

  if (users.length > 0) {
    // Create notification entries in bulk
    await db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title: input.title,
        body: input.body,
        type: input.type,
      })),
    });
  }

  return apiSuccess({ count: users.length }, "تم إرسال الإشعارات بنجاح");
});
