import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiNoContent } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { db } from "@/lib/db";

export const DELETE = protectedRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;

  const token = await db.apiToken.findFirst({
    where: { id, userId: context.user!.userId, isRevoked: false },
  });

  if (!token) throw Errors.notFound("Session");

  await db.apiToken.update({
    where: { id },
    data: { isRevoked: true },
  });

  return apiNoContent();
});
