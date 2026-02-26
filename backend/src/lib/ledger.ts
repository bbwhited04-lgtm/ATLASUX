import { prisma } from "../db/prisma.js";
import { Prisma, LedgerCategory, LedgerEntryType } from "@prisma/client";


function normalizeLedgerCategory(input: unknown): LedgerCategory {
  const v = String(input ?? "").trim().toLowerCase();
  switch (v) {
    case "hosting":
      return LedgerCategory.api_spend;
    case "saas":
      return LedgerCategory.api_spend;
    case "domain":
      return LedgerCategory.api_spend;
    case "email":
      return LedgerCategory.api_spend;
    case "social":
      return LedgerCategory.api_spend;
    case "infra":
      return LedgerCategory.api_spend;
    case "ads":
      return LedgerCategory.api_spend;
    case "other":
      return LedgerCategory.misc;
    case "subscription":
      return LedgerCategory.subscription;
    case "ai_spend":
    case "token_spend":
    case "api_spend":
    case "tokens":
    case "api":
      // Schema supports token_spend + api_spend
      return v.includes("token") || v === "tokens" ? LedgerCategory.token_spend : LedgerCategory.api_spend;
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
    const category: LedgerCategory = /token/i.test(args.eventType) ? LedgerCategory.token_spend : LedgerCategory.api_spend;
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
