/**
 * SMS Worker — processes SMS_SEND jobs using Twilio.
 * Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER from env.
 */
import { prisma } from "../db/prisma.js";

const POLL_MS = Number(process.env.SMS_WORKER_INTERVAL_MS ?? 10_000);

async function handleJobFailure(
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

async function sendViaTwilio(to: string, message: string): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const body = new URLSearchParams({ To: to, From: fromNumber, Body: message });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.message ?? `Twilio error ${res.status}`);
  return { sid: data.sid };
}

async function processSmsJobs() {
  const jobs = await prisma.job.findMany({
    where: {
      jobType: "SMS_SEND",
      status: "queued",
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  for (const job of jobs) {
    // Mark running
    await prisma.job.update({ where: { id: job.id }, data: { status: "running", startedAt: new Date() } });

    const input = job.input as any;
    const to      = String(input?.to      ?? "");
    const message = String(input?.message ?? "");

    try {
      if (!to || !message) throw new Error("Missing to or message in job input");

      const result = await sendViaTwilio(to, message);

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "succeeded", finishedAt: new Date(), output: { sid: result.sid } },
      });

      await prisma.auditLog.create({
        data: {
          tenantId: job.tenantId,
          actorType: "system",
          actorUserId: null,
          actorExternalId: null,
          level: "info",
          action: "SMS_SENT",
          entityType: "job",
          entityId: job.id,
          message: `SMS sent to ${to} (SID: ${result.sid})`,
          meta: { to, sid: result.sid },
          timestamp: new Date(),
        },
      }).catch(() => null);

      console.log(`[smsWorker] Sent SMS to ${to} — SID ${result.sid}`);
    } catch (err: any) {
      const errorMsg = err?.message ?? "Unknown SMS error";
      await handleJobFailure(job.id, job.tenantId, job.retryCount, job.maxRetries, errorMsg, "smsWorker");
    }
  }
}

console.log(`[smsWorker] Starting. Polling every ${POLL_MS}ms`);

async function tick() {
  try {
    await processSmsJobs();
  } catch (err) {
    console.error("[smsWorker] tick error:", err);
  }
}

tick();
setInterval(tick, POLL_MS);
