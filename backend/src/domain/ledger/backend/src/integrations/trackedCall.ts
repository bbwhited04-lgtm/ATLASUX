import { auditLog } from "../domain/audit/audit.service";
import { writeLedgerEvent } from "../domain/ledger/ledger.service";

export async function trackedCall<T>(args: {
  actorType: "user" | "atlas" | "system";
  actorId?: string | null;

  provider: string;
  action: string;

  relatedId?: string;

  estAmountUsd?: number;

  metadata?: Record<string, any>;

  run: () => Promise<T>;
}) {
  const start = Date.now();
  let status: "SUCCESS" | "FAILED" = "SUCCESS";

  try {
    const result = await args.run();
    return result;
  } catch (e) {
    status = "FAILED";
    throw e;
  } finally {
    const latencyMs = Date.now() - start;

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
        ...args.metadata,
      },
    });

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
