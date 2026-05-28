import { NextRequest } from "next/server";
import { publicRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { Errors } from "@/lib/api/errors";
import { db } from "@/lib/db";

export const GET = publicRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber");
  const phone = searchParams.get("phone");

  if (!orderNumber || !phone) {
    throw Errors.badRequest("orderNumber and phone are required");
  }

  // Normalize phone
  const cleaned = phone.replace(/^(\+964|00964|0)/, "");
  const normalizedPhone = /^7[3-9]\d{8}$/.test(cleaned) ? `+964${cleaned}` : phone;

  const order = await db.order.findFirst({
    where: {
      orderNumber,
      user: { phone: normalizedPhone },
    },
    select: {
      orderNumber: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      shippedAt: true,
      deliveredAt: true,
      estimatedDelivery: true,
      tracking: {
        orderBy: { createdAt: "desc" },
        select: { status: true, note: true, location: true, createdAt: true },
      },
    },
  });

  if (!order) throw Errors.notFound("Order");

  return apiSuccess(order);
}, "search");
