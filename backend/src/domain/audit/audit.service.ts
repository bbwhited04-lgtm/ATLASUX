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

import { auditLog } from "../domain/audit/audit.service";
import { writeLedgerEvent } from "../domain/ledger/ledger.service";

export async function trackedVendorCall<T>(args: {
  actorType: "user" | "atlas" | "system";
  actorId?: string | null;

  provider: string;          // "OpenAI" | "Vidu" | etc
  action: string;            // "OPENAI_CHAT" | "VIDU_RENDER"
  relatedId?: string;

  estAmountUsd?: number;
  run: () => Promise<T>;

  requestMeta?: Record<string, any>;
}) {
  const startedAt = Date.now();
  let status: "SUCCESS" | "FAILED" = "SUCCESS";

  try {
    const result = await args.run();
    return result;
  } catch (e: any) {
    status = "FAILED";
    throw e;
  } finally {
    const latencyMs = Date.now() - startedAt;

    await auditLog({
      actorType: args.actorType,
      actorId: args.actorId ?? null,
      action: args.action,
      entityType: "vendor_call",
      entityId: args.relatedId ?? null,
      status,
      metadata: {
        provider: args.provider,
        latencyMs,
        ...args.requestMeta,
      },
    });

    // Optional: if spend known (e.g., Vidu render charge)
    if (args.estAmountUsd != null) {
      await writeLedgerEvent({
        eventType: "API_SPEND",
        provider: args.provider,
        status,
        amountUsd: args.estAmountUsd,
        relatedId: args.relatedId,
        metadata: { latencyMs },
      });
    }
  }
}
