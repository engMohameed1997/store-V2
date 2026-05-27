import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { NotificationService } from "@/lib/services/notification.service";
import { z } from "zod";

const markReadSchema = z.object({
  notificationId: z.string().cuid().optional(),
});

export const GET = protectedRoute(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));

  const result = await NotificationService.list(context.user!.userId, page, limit);
  return apiSuccess(result);
});

export const PUT = protectedRoute(async (request: NextRequest, context) => {
  const input = await validateBody(request, markReadSchema);
  await NotificationService.markAsRead(context.user!.userId, input.notificationId);
  return apiSuccess(null, "Notifications marked as read");
});
