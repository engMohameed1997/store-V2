import { NextRequest } from "next/server";
import { adminRoute } from "@/lib/api/route-handler";
import { apiSuccess } from "@/lib/api/response";
import { TicketService } from "@/lib/services/ticket.service";
import { TicketStatus } from "@/lib/types/ticket";

export const GET = adminRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") as TicketStatus | null;
  
  // Validate status filter if passed
  const status = statusParam && Object.values(TicketStatus).includes(statusParam)
    ? statusParam
    : undefined;

  const tickets = await TicketService.list(status);
  return apiSuccess(tickets);
});
