/**
 * Shared job failure handler — used by emailSender, jobWorker, and smsWorker.
 *
 * Retry strategy: exponential backoff (10s × 2^retryCount).
 * After maxRetries exhausted: mark job as permanently failed + audit log.
 */
import { prisma } from "../db/prisma.js";

export async function handleJobFailure(
  jobId: string,
  tenantId: string,
  retryCount: number,
  maxRetries: number,
  errMsg: string,
  jobType: string,
) {
  const now = new Date();
  if (retryCount < maxRetries) {
    const delayMs = 10_000 * Math.pow(2, retryCount);
    const nextRetryAt = new Date(now.getTime() + delayMs);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "queued",
        retryCount: retryCount + 1,
        nextRetryAt,
        error: { message: errMsg, attemptedAt: now.toISOString(), retryCount },
        finishedAt: null,
      },
    });
    console.log(`[${jobType}] Job ${jobId} will retry #${retryCount + 1} at ${nextRetryAt.toISOString()}`);
  } else {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", finishedAt: now, error: { message: errMsg, exhausted: true, retryCount } },
    });
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: null,
        level: "error",
        action: "JOB_EXHAUSTED_RETRIES",
        entityType: "job",
        entityId: jobId,
        message: `${jobType} job ${jobId} exhausted ${maxRetries} retries: ${errMsg}`,
        meta: { jobType, errMsg, retryCount },
        timestamp: now,
      },
    }).catch(() => null);
    console.error(`[${jobType}] Job ${jobId} permanently failed after ${maxRetries} retries: ${errMsg}`);
  }
}
