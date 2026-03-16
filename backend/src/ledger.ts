import type { Env } from "./env.js";
import { prisma } from "./db/prisma.js";

export type LedgerRow = {
  tenant_id: string;
  entry_type: "debit" | "credit";
  category: string;
  amount_cents: number;
  currency?: string;
  description?: string | null;
  external_ref?: string | null;
  meta?: Record<string, any> | null;
  occurred_at?: string | null; // ISO
};

// Legacy callers (paidFetch/content jobs) used this shape.
export type LegacySpendEvent = {
  event_type: "spend";
  amount: number; // USD
  currency?: string | null;
  status?: string | null;
  related_job_id?: string | null;
  provider?: string | null;
  metadata?: Record<string, any> | null;
  org_id?: string | null;   // maps to tenant_id
  user_id?: string | null;
  action?: string | null;
};

export type LedgerEvent = LedgerRow | LegacySpendEvent;

/**
 * Writes a ledger entry via Prisma.
 */
export async function writeLedgerEvent(env: any, event: LedgerEvent) {
  // Normalize legacy events into ledger_entries rows
  const row: LedgerRow =
    (event as any).event_type === "spend"
      ? {
          tenant_id: (event as LegacySpendEvent).org_id ?? "",
          entry_type: "debit",
          category: "ai_spend",
          amount_cents: Math.round(Number((event as LegacySpendEvent).amount ?? 0) * 100),
          currency: (event as LegacySpendEvent).currency ?? "USD",
          description: `${(event as LegacySpendEvent).provider ?? "provider"} spend`,
          external_ref: (event as LegacySpendEvent).related_job_id ?? null,
          meta: {
            ...(event as LegacySpendEvent).metadata,
            status: (event as LegacySpendEvent).status ?? undefined,
            provider: (event as LegacySpendEvent).provider ?? undefined,
            user_id: (event as LegacySpendEvent).user_id ?? undefined,
            action: (event as LegacySpendEvent).action ?? undefined,
          },
          occurred_at: new Date().toISOString(),
        }
      : (event as LedgerRow);

  if (!row.tenant_id) {
    return { ok: false, error: "tenant_id_required" as const };
  }

  try {
    await prisma.ledgerEntry.create({
      data: {
        tenantId: row.tenant_id,
        entryType: row.entry_type as any,
        category: row.category as any,
        amountCents: row.amount_cents,
        currency: row.currency ?? "USD",
        description: row.description ?? null,
        externalRef: row.external_ref ?? null,
        meta: row.meta ?? {},
        occurredAt: row.occurred_at ? new Date(row.occurred_at) : new Date(),
      },
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
