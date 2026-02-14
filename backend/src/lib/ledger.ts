import { prisma } from "../prisma.js"; // adjust import to your prisma client

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
  const amountCents = BigInt(Math.round(amountUsd * 100));
  // Define union types
    type EntryType = "credit" | "debit";
    type Category = "token_spend" | "api_spend";
  const entryType: EntryType = amountUsd < 0 ? "credit" : "debit";
  const category: Category =
    /token/i.test(args.eventType) ? "token_spend" : "api_spend";
  const tenantId = args.orgId ?? (args.metadata as any)?.orgId ?? "demo_org";

  return prisma.ledgerEntry.create({
    data: {
      tenantId,
      entryType,
      category,
      amountCents,
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
