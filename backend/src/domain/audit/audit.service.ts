import { prisma } from "../../prisma";

export type AuditStatus = "SUCCESS" | "FAILED" | "PENDING";

export async function auditLog(args: {
  actorType: "user" | "atlas" | "system";
  actorId?: string | null;

  action: string;
  entityType?: string | null;
  entityId?: string | null;

  status: AuditStatus;

  ipAddress?: string | null;
  userAgent?: string | null;

  metadata?: Record<string, any>;
}) {
  return prisma.auditLog.create({
    data: {
      actorType: args.actorType,
      actorId: args.actorId ?? null,
      action: args.action,
      entityType: args.entityType ?? null,
      entityId: args.entityId ?? null,
      status: args.status,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
      metadata: args.metadata ?? {},
    },
  });
}
