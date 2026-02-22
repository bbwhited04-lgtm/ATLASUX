import { prisma } from "../../prisma.js";
import { AuditLevel } from "@prisma/client";
export type AuditStatus = "SUCCESS" | "FAILED" | "PENDING";

export async function auditLog(args: {
  tenantId?: string | null;

  actorType: "system" | "user" | "atlas";
  actorId?: string | null; // legacy (uuid OR string)

  level?: AuditLevel;       // if AuditLevel is in scope; otherwise use: any
  action: string;

  entityType?: string | null;
  entityId?: string | null;
  message?: string | null;

  status: AuditStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}) {

  const level: "info" | "warn" | "error" =
    args.status === "FAILED"
      ? "error"
      : args.status === "PENDING"
        ? "warn"
        : "info";
// Prisma schema uses `level` (enum) + `action` + optional entity fields
  const isUuid = (v?: string | null) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

return prisma.auditLog.create({
  data: {
    tenantId: args.tenantId ?? null,
    actorType: args.actorType ?? "system",
    level: (args.level ?? "AuditLevel.info") as any,

    actorUserId: null,
    actorExternalId: String(args.actorId ?? ""),
    actorType: "system",
    actorExternalId: !isUuid(args.actorId) ? args.actorId ?? null : null,
    
    action: args.action,

    entityType: args.entityType ?? null,
    entityId: args.entityId ?? null,
    message: args.message ?? null,

    timestamp: new Date(),

    meta: {
      status: args.status,
      ipAddress: args.ipAddress ?? null,
      userAgent: args.userAgent ?? null,
      ...(args.metadata ?? {}),
    },
  },
});
}
