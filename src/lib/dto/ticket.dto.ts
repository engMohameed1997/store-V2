export interface TicketUserDTO {
  id: string;
  firstName: string;
  lastName: string;
}

export interface TicketMessageDTO {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  user: TicketUserDTO & { avatar: string | null };
}

export interface TicketDTO {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  orderId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: TicketUserDTO & { email: string | null; phone: string | null };
  messages?: TicketMessageDTO[];
  _count?: { messages: number };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTicketUserDTO(user: any): TicketUserDTO & { email: string | null; phone: string | null } {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email ?? null,
    phone: user.phone ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTicketMessageDTO(msg: any): TicketMessageDTO {
  return {
    id: msg.id,
    body: msg.body,
    isStaff: msg.isStaff,
    createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
    user: {
      id: msg.user.id,
      firstName: msg.user.firstName,
      lastName: msg.user.lastName,
      avatar: msg.user.avatar ?? null,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTicketDTO(ticket: any): TicketDTO {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    status: ticket.status,
    priority: ticket.priority,
    orderId: ticket.orderId ?? null,
    closedAt: ticket.closedAt instanceof Date ? ticket.closedAt.toISOString() : (ticket.closedAt ?? null),
    createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
    updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
    user: toTicketUserDTO(ticket.user),
    messages: ticket.messages?.map(toTicketMessageDTO),
    _count: ticket._count,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTicketDTOList(tickets: any[]): TicketDTO[] {
  return tickets.map(toTicketDTO);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toTicketMessageDTOExport(msg: any): TicketMessageDTO {
  return toTicketMessageDTO(msg);
}
