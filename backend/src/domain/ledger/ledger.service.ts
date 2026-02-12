import { prisma } from "../../prisma";

export async function writeLedgerEvent(args: {
  eventType: string;
  status: "SUCCESS" | "FAILED";

  amountUsd?: number;

  provider?: string | null;
  relatedId?: string | null;

  metadata?: Record<string, any>;
}) {
  return prisma.ledgerEvent.create({
    data: {
      eventType: args.eventType,
      status: args.status,
      amountUsd: args.amountUsd ?? 0,
      currencyUsd: "USD",
      provider: args.provider ?? null,
      relatedId: args.relatedId ?? null,
      metadata: args.metadata ?? {},
    },
  });
}
