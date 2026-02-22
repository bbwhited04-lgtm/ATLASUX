import { prisma } from "../../prisma.js";
import { AuditLevel } from "@prisma/client";

export type AuditStatus = "SUCCESS" | "FAILED" | "PENDING";

const isUuid = (v?: string | null) =>
  !!v &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export async function auditLog(args: {
  tenantId?: string | null;

  actorType?: "system" | "user" | "atlas";
  actorId?: string | null; // legacy (uuid OR string)

  level?: AuditLevel;
  action: string;

  entityType?: string | null;
  entityId?: string | null;
  message?: string | null;

  status: AuditStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}) {
  // Keep the actorId as a string for traceability
  const actorIdStr = args.actorId == null ? "" : String(args.actorId);

  // IMPORTANT: To avoid P2003 until app_users is wired, keep this NULL always.
  // Later, you can look up app_users by external id and set actorUserId to a real row id.
  const actorUserId: string | null = null;

  // Use provided actorType or derive a safe default
  const actorType: "system" | "user" | "atlas" =
    args.actorType ?? (isUuid(args.actorId) ? "user" : "system");

  // If caller passed a Prisma enum, use it; otherwise map from status.
  const level: AuditLevel =
    args.level ??
    (args.status === "FAILED"
      ? AuditLevel.error
      : args.status === "PENDING"
        ? AuditLevel.warn
        : AuditLevel.info);

  return prisma.auditLog.create({
    data: {
      tenantId: args.tenantId ?? null,

      actorUserId,
      actorExternalId: actorIdStr || null,
      actorType,

      level,
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