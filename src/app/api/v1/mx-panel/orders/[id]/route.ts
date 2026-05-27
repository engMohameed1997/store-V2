import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateOrderStatusSchema } from "@/lib/validators/order";
import { OrderService } from "@/lib/services/order.service";
import { AuditService } from "@/lib/services/audit.service";
import { getClientIp, getUserAgent } from "@/lib/api/auth-guard";
import { z } from "zod";

const confirmPaymentSchema = z.object({
  transactionId: z.string().optional(),
});

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const order = await OrderService.getById(id);
  return apiSuccess(order);
});

export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, updateOrderStatusSchema);
  const order = await OrderService.updateStatus(id, input);
  await AuditService.log({
    userId: context.user!.userId,
    action: "STATUS_CHANGE",
    entity: "Order",
    entityId: id,
    newData: input,
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  return apiSuccess(order);
});

export const POST = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, confirmPaymentSchema);
  const order = await OrderService.confirmPayment(id, input.transactionId);
  await AuditService.log({
    userId: context.user!.userId,
    action: "STATUS_CHANGE",
    entity: "Order",
    entityId: id,
    newData: { paymentStatus: "PAID", transactionId: input.transactionId },
    ipAddress: getClientIp(request),
    userAgent: getUserAgent(request),
  });
  return apiSuccess(order);
});
