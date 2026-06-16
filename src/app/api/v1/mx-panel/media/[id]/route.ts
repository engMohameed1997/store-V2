import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { MediaService } from "@/lib/services/media.service";

export const DELETE = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  await MediaService.delete(id);
  return apiSuccess({ message: "تم حذف الملف بنجاح" });
});
