import { prisma } from "../prisma"; // adjust import to your prisma client

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

  relatedId?: string;             // jobId/workflowId/requestId
  metadata?: Record<string, any>; // tokens, model, endpoint, latency, etc
}) {
  return prisma.ledgerEvent.create({
    data: {
      eventType: args.eventType,
      amount: args.amount ?? 0,
      currency: args.currency ?? "USD",
      provider: args.provider ?? null,
      relatedId: args.relatedId ?? null,
      status: args.status,
      metadata: args.metadata ?? {},
    },
  });
}
