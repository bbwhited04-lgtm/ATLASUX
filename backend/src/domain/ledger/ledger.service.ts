import { prisma } from "../../prisma.js";
import { Prisma, LedgerCategory, LedgerEntryType } from "@prisma/client";


function normalizeLedgerCategory(input: unknown): LedgerCategory {
  const v = String(input ?? "").trim().toLowerCase();
  switch (v) {
    case "hosting":
      return LedgerCategory.hosting;
    case "saas":
      return LedgerCategory.saas;
    case "domain":
      return LedgerCategory.domain;
    case "email":
      return LedgerCategory.email;
    case "social":
      return LedgerCategory.social;
    case "infra":
      return LedgerCategory.infra;
    case "ads":
      return LedgerCategory.ads;
    case "other":
      return LedgerCategory.other;
    case "subscription":
      return LedgerCategory.subscription;
    case "ai_spend":
    case "token_spend":
    case "api_spend":
    case "tokens":
    case "api":
      return LedgerCategory.ai_spend;
    case "misc":
    default:
      return LedgerCategory.misc;
  }
}

function normalizeLedgerEntryType(input: unknown): LedgerEntryType {
  const v = String(input ?? "").trim().toLowerCase();
  return v === "credit" ? LedgerEntryType.credit : LedgerEntryType.debit;
}

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

  const entryType: LedgerEntryType = amountUsd < 0 ? LedgerEntryType.credit : LedgerEntryType.debit;
  const category: LedgerCategory = normalizeLedgerCategory(/token/i.test(args.eventType) ? LedgerCategory.ai_spend : LedgerCategory.ai_spend);

  // Tenant is required by schema; fall back to a demo tenant id.
  const tenantId = args.orgId ?? null;
  if (!tenantId) {
    throw new Error("tenantId/orgId is required to write a ledger entry");
  }

  return prisma.ledgerEntry.create({
    data: {
      tenantId,
      entryType,
      category,
      amountCents,
      occurredAt: new Date(),
      createdAt: new Date(),
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
