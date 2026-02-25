/**
 * SMS Worker — processes SMS_SEND jobs using Twilio.
 * Reads TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER from env.
 */
import { prisma } from "../db/prisma.js";

const POLL_MS = Number(process.env.SMS_WORKER_INTERVAL_MS ?? 10_000);

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
    where: { jobType: "SMS_SEND", status: "queued" },
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
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "failed", finishedAt: new Date(), error: { message: errorMsg } },
      });
      console.error(`[smsWorker] Failed SMS job ${job.id}: ${errorMsg}`);
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
