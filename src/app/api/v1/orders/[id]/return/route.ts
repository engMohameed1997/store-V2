import { NextRequest } from "next/server";
import { protectedRoute } from "@/lib/api/route-handler";
import { validateBody } from "@/lib/api/validate";
import { apiCreated } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { db } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

const createReturnSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500),
  items: z.array(z.object({
    orderItemId: z.string().min(1),
    quantity: z.number().int().min(1),
    reason: z.string().optional(),
  })).min(1, "At least one item required"),
  notes: z.string().max(500).optional(),
});

export const POST = protectedRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, createReturnSchema);

  const order = await db.order.findFirst({
    where: { id, userId: context.user!.userId },
    include: { items: true },
  });

  if (!order) throw Errors.notFound("Order");
  if (order.status !== "DELIVERED") {
    throw Errors.badRequest("Returns can only be requested for delivered orders");
  }

  // Validate items belong to this order
  for (const item of input.items) {
    const orderItem = order.items.find((oi) => oi.id === item.orderItemId);
    if (!orderItem) throw Errors.badRequest(`Item ${item.orderItemId} not found in this order`);
    if (item.quantity > orderItem.quantity) {
      throw Errors.badRequest(`Return quantity exceeds ordered quantity for item ${item.orderItemId}`);
    }
  }

  const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

  const returnRequest = await db.return.create({
    data: {
      orderId: id,
      returnNumber,
      reason: input.reason,
      notes: input.notes,
      items: {
        createMany: {
          data: input.items.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            reason: item.reason,
          })),
        },
      },
    },
    include: { items: true },
  });

  return apiCreated(returnRequest);
});
