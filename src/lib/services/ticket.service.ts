import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import { TicketStatus } from "@/lib/types/ticket";
import { TelegramService } from "./telegram.service";

export class TicketService {
  static async list(status?: TicketStatus) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    return db.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async get(id: string) {
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        messages: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) throw Errors.notFound("Support Ticket");
    return ticket;
  }

  static async reply(ticketId: string, userId: string, body: string, isStaff = true) {
    const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw Errors.notFound("Support Ticket");

    // Add the message
    const message = await db.ticketMessage.create({
      data: {
        ticketId,
        userId,
        body,
        isStaff,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    // Update ticket status
    const newStatus = isStaff ? TicketStatus.WAITING_CUSTOMER : TicketStatus.IN_PROGRESS;
    await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Fire-and-forget Telegram notification for customer messages
    if (!isStaff) {
      TelegramService.notifyNewMessage({
        ticketNumber: ticket.ticketNumber,
        customerName: `${message.user.firstName} ${message.user.lastName}`,
        messagePreview: body,
      }).catch(() => {});
    }

    return message;
  }

  static async updateStatus(id: string, status: TicketStatus) {
    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw Errors.notFound("Support Ticket");

    const updateData: Record<string, unknown> = { status };
    if (status === TicketStatus.CLOSED || status === TicketStatus.RESOLVED) {
      updateData.closedAt = new Date();
    }

    return db.supportTicket.update({
      where: { id },
      data: updateData,
    });
  }
}
