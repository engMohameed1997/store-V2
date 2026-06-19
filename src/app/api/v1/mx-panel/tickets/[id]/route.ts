import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess, apiCreated, apiError } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { TicketService } from "@/lib/services/ticket.service";
import { TicketStatus } from "@/lib/types/ticket";
import { z } from "zod";

const replySchema = z.object({
  body: z.string().min(1).max(2000),
});

const statusSchema = z.object({
  status: z.nativeEnum(TicketStatus),
});

export const GET = adminRoute(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const ticket = await TicketService.get(id);
  return apiSuccess(ticket);
});

// Post reply to ticket
export const POST = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, replySchema);
  const userId = context.user?.userId;

  if (!userId) {
    return apiError("UNAUTHORIZED", "Unauthorized", 401);
  }

  const message = await TicketService.reply(id, userId, input.body, true);
  return apiCreated(message);
});

// Update ticket status
export const PUT = adminRoute(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const input = await validateBody(request, statusSchema);
  
  const ticket = await TicketService.updateStatus(id, input.status);
  return apiSuccess(ticket);
});
