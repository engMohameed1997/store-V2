export interface AuditLogDTO {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string } | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toAuditLogDTO(log: any): AuditLogDTO {
  return {
    id: log.id,
    userId: log.userId ?? null,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId ?? null,
    oldData: log.oldData,
    newData: log.newData,
    ipAddress: log.ipAddress ?? null,
    userAgent: log.userAgent ?? null,
    createdAt: log.createdAt instanceof Date ? log.createdAt.toISOString() : log.createdAt,
    user: log.user
      ? { id: log.user.id, firstName: log.user.firstName, lastName: log.user.lastName }
      : null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toAuditLogDTOList(logs: any[]): AuditLogDTO[] {
  return logs.map(toAuditLogDTO);
}
