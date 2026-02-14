import { prisma } from "../../prisma.js";

/**
 * Write a ledger entry aligned to the current Prisma schema.
 *
 * NOTE: The schema defines `LedgerEntry` (not `LedgerEvent`).
 * We map older "event" style inputs into a LedgerEntry record.
 */
export async function writeLedgerEvent(args: {
  eventType: string;
  status: "SUCCESS" | "FAILED";

  /** Dollars */
  amountUsd?: number;

  provider?: string | null;
  relatedId?: string | null;

  /** Maps to Tenant.id */
  orgId?: string | null;
  userId?: string | null;

  metadata?: Record<string, any>;
}) {
  const amountUsd = args.amountUsd ?? 0;
  const amountCents = BigInt(Math.round(amountUsd * 100));

  const entryType = amountUsd < 0 ? "credit" : "debit";
  const category = /token/i.test(args.eventType) ? "token_spend" : "api_spend";

  // Tenant is required by schema; fall back to a demo tenant id.
  const tenantId = args.orgId ?? "demo_org";

  return prisma.ledgerEntry.create({
    data: {
      tenantId,
      entryType,
      category,
      amountCents,
      currency: "USD",
      description: `${args.eventType} (${args.status})`,
      externalRef: args.relatedId ?? null,
      meta: {
        status: args.status,
        provider: args.provider ?? null,
        userId: args.userId ?? null,
        eventType: args.eventType,
        ...(args.metadata ?? {}),
      },
    },
  });
}
