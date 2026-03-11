import "dotenv/config";
/**
 * SMS Worker — processes SMS_SEND jobs using Twilio.
 * Resolves Twilio credentials per-tenant via credentialResolver.
 */
import { prisma } from "../db/prisma.js";
import { handleJobFailure } from "../lib/jobFailureHandler.js";
import { resolveCredential } from "../services/credentialResolver.js";

const POLL_MS = Number(process.env.SMS_WORKER_INTERVAL_MS ?? 10_000);

async function sendViaTwilio(tenantId: string, to: string, message: string): Promise<{ sid: string }> {
  const accountSid = await resolveCredential(tenantId, "twilio_sid");
  const authToken  = await resolveCredential(tenantId, "twilio_token");
  const fromNumber = await resolveCredential(tenantId, "twilio_from");

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio not configured for this tenant. Add Twilio credentials in Settings > Integrations.");
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
    // Optimistic lock: only claim if still queued (prevents double-execution)
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: "queued" },
      data: { status: "running", startedAt: new Date() },
    });
    if (claimed.count !== 1) continue; // Another worker claimed it

    const input = job.input as any;
    const to      = String(input?.to      ?? "");
    const message = String(input?.message ?? "");

    try {
      if (!to || !message) throw new Error("Missing to or message in job input");

      const result = await sendViaTwilio(job.tenantId, to, message);

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
