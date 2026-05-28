import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { db } from "@/lib/db";

export const POST = protectedRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;

  const product = await db.product.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, stock: true, name: true },
  });

  if (!product) throw Errors.notFound("Product");

  if (product.stock > 0) {
    throw Errors.badRequest("Product is already in stock");
  }

  // Create a notification subscription (using Notification model with BACK_IN_STOCK type)
  await db.notification.upsert({
    where: {
      id: `stock_${context.user!.userId}_${id}`,
    },
    create: {
      id: `stock_${context.user!.userId}_${id}`,
      userId: context.user!.userId,
      type: "BACK_IN_STOCK",
      title: "Back in Stock",
      body: `You will be notified when "${product.name}" is back in stock.`,
      data: { productId: id },
    },
    update: {
      isRead: false,
      readAt: null,
    },
  });

  return apiSuccess({ message: "You will be notified when this product is back in stock" });
});
