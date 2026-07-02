import { db } from "@/lib/db";
import type { AuditAction } from "@/generated/prisma/client";
import { toAuditLogDTO, toAuditLogDTOList } from "@/lib/dto/audit.dto";

export class AuditService {
  static async log(data: {
    userId?: string;
    action: AuditAction;
    entity: string;
    entityId?: string;
    oldData?: unknown;
    newData?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return toAuditLogDTO(await db.auditLog.create({
      data: {
        ...data,
        oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : undefined,
        newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : undefined,
      },
    }));
  }

  static async list(filters: {
    userId?: string;
    action?: string;
    entity?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entity) where.entity = filters.entity;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ]);

    return { logs: toAuditLogDTOList(logs), total, page, limit };
  }
}
