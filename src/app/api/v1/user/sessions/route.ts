import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { db } from "@/lib/db";

export const GET = protectedRoute(async (_request: NextRequest, context) => {
  const sessions = await db.apiToken.findMany({
    where: {
      userId: context.user!.userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      deviceName: true,
      deviceId: true,
      ipAddress: true,
      userAgent: true,
      lastUsedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(sessions);
});
