import { Prisma, PrismaClient, LedgerCategory, LedgerEntryType } from "@prisma/client";

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

const prisma = new PrismaClient();
type CompleteJobInput = {
  jobId: string;
  status: "completed" | "failed";
  outputUrl?: string | null;
  tokensUsed?: number | null;
  actualCostUsd?: number | null;
  errorMessage?: string | null;
  actorId?: string | null;
};

/**
 * This project previously had a `ContentJob` model and `LedgerEvent` model.
 * The current Prisma schema uses `Job` and `LedgerEntry`.
 *
 * We keep this helper for callers that still think in "content jobs".
 */
export async function completeContentJob(input: CompleteJobInput) {
  const {
    jobId,
    status,
    outputUrl = null,
    tokensUsed = null,
    actualCostUsd = null,
    errorMessage = null,
    actorId = null,
  } = input;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const output =
      outputUrl == null && tokensUsed == null && actualCostUsd == null
        ? undefined
        : {
            ...(outputUrl != null ? { url: outputUrl } : {}),
            ...(tokensUsed != null ? { tokensUsed } : {}),
            ...(actualCostUsd != null ? { actualCostUsd } : {}),
          };

    // Map old statuses -> current enum
    const nextStatus = status === "completed" ? "succeeded" : "failed";

    const job = await tx.job.update({
      where: { id: jobId },
      data: {
        status: nextStatus,
        output: output ?? undefined,
        error:
        status === "failed"
        ? ({ message: errorMessage ?? "Job failed" } as Prisma.InputJsonValue)
        : Prisma.DbNull,
        finishedAt: new Date(),
      },
    });

    // Write a ledger entry if cost is provided
    if (actualCostUsd != null) {
      const amountCents = BigInt(Math.round(actualCostUsd * 100));

      await tx.ledgerEntry.create({
        data: {
          tenantId: job.tenantId,
          entryType: LedgerEntryType.debit,
          category: LedgerCategory.ai_spend,
          amountCents,
          occurredAt: new Date(),
          createdAt: new Date(),
          currency: "USD",
          description: `content_job_cost (${nextStatus})`,
          externalRef: job.id,
          meta: {
            actorId,
            jobId: job.id,
            tokensUsed,
            status: nextStatus,
          },
        },
      });
    }

    return job;
  });
}
