import { prisma } from "../prisma.js"; // adjust import to your prisma client
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

type LedgerStatus = "SUCCESS" | "FAILED";
type LedgerEventType =
  | "LLM_TOKENS"
  | "API_SPEND"
  | "API_CREDIT"
  | "TELECOM_CALL"
  | "EMAIL_SEND"
  | "JOB_RUN";

export async function writeLedgerEvent(args: {
  eventType: LedgerEventType;
  amount?: number;                // dollars (or cents if you prefer)
  currency?: string;              // "USD"
  provider?: string;              // "OpenAI" | "Twilio" | etc
  status: LedgerStatus;

  /** Tenant/Org id. Required by current Prisma schema. */
  orgId?: string;

  relatedJobId?: string;             // jobId/workflowId/requestId
  metadata?: Record<string, any>; // tokens, model, endpoint, latency, etc
}) {
  const amountUsd = args.amount ?? 0;
  const amountCents = BigInt(Math.round(amountUsd * 100));  const entryType: LedgerEntryType = amountUsd < 0 ? LedgerEntryType.credit : LedgerEntryType.debit;
    const category: LedgerCategory = normalizeLedgerCategory(/token/i.test(args.eventType) ? LedgerCategory.ai_spend : LedgerCategory.ai_spend);
    const tenantId = args.orgId ?? (args.metadata as any)?.orgId ?? (args.metadata as any)?.tenantId ?? null;
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
      currency: args.currency ?? "USD",
      description: `${args.eventType} (${args.status})`,
      externalRef: args.relatedJobId ?? null,
      meta: {
        status: args.status,
        provider: args.provider ?? null,
        relatedJobId: args.relatedJobId ?? null,
        ...(args.metadata ?? {}),
      },
    },
  });
}
