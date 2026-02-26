import { prisma } from "../db/prisma.js";
import { getSystemState } from "../services/systemState.js";

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

function isAtlasOnline(value: unknown): boolean {
  const o = asObj(value);
  return Boolean(o.engine_enabled ?? o.online ?? false);
}

type EmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string | null;
  fromAgent?: string | null;
  traceId?: string | null;
};

async function getMsAccessToken(): Promise<string> {
  const tenantId = String(process.env.MS_TENANT_ID ?? "").trim();
  const clientId = String(process.env.MS_CLIENT_ID ?? "").trim();
  const clientSecret = String(process.env.MS_CLIENT_SECRET ?? "").trim();
  if (!tenantId || !clientId || !clientSecret) throw new Error("MS_TENANT_ID / MS_CLIENT_ID / MS_CLIENT_SECRET missing");

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    }),
  });
  const data = await res.json() as any;
  if (!res.ok || !data.access_token) throw new Error(`ms_token_failed: ${data.error_description ?? res.status}`);
  return data.access_token as string;
}

async function sendViaMicrosoft(args: {
  senderUpn: string;
  to: string;
  subject: string;
  text: string;
  html?: string | null;
}) {
  const token = await getMsAccessToken();
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(args.senderUpn)}/sendMail`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject: args.subject,
          body: {
            contentType: args.html ? "HTML" : "Text",
            content: args.html ?? args.text,
          },
          toRecipients: [{ emailAddress: { address: args.to } }],
        },
        saveToSentItems: true,
      }),
    }
  );
  if (res.status === 202) return { ok: true };
  const body = await res.text();
  throw new Error(`ms_send_failed (${res.status}): ${body.slice(0, 500)}`);
}

async function sendViaResend(args: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string | null;
}) {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey || apiKey === "re_YOUR_API_KEY_HERE") throw new Error("RESEND_API_KEY not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      html: args.html ?? undefined,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`resend_failed (${res.status}): ${text.slice(0, 500)}`);
  try {
    return JSON.parse(text);
  } catch {
    return { ok: true, raw: text };
  }
}

/**
 * Background worker #2: Email sender
 *
 * Drains queued EMAIL_SEND jobs (jobs table) and delivers them via provider.
 *
 * Env:
 *  OUTBOUND_EMAIL_PROVIDER: resend|microsoft|none (default resend)
 *  OUTBOUND_EMAIL_FROM: required for resend (ex: "Atlas UX <noreply@atlasux.cloud>")
 *  RESEND_API_KEY: required if provider=resend
 *  EMAIL_WORKER_POLL_MS (default 2000)
 *  EMAIL_WORKER_BATCH (default 10)
 */
async function main() {
  const provider = String(process.env.OUTBOUND_EMAIL_PROVIDER ?? "resend").trim().toLowerCase();
  const from = String(process.env.OUTBOUND_EMAIL_FROM ?? "").trim();
  const pollMs = Math.max(250, Number(process.env.EMAIL_WORKER_POLL_MS ?? 2000));
  const batch = Math.max(1, Math.min(50, Number(process.env.EMAIL_WORKER_BATCH ?? 10)));

  let stopping = false;
  const stop = () => {
    stopping = true;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (stopping) {
      process.stdout.write("[emailSender] stopping\n");
      process.exit(0);
    }

    // Respect Atlas online switch (guardrail-friendly)
    try {
      const row = await getSystemState("atlas_online");
      if (!isAtlasOnline(row?.value)) {
        await sleep(pollMs);
        continue;
      }
    } catch {
      await sleep(pollMs);
      continue;
    }

    // Accept both naming conventions that have been used in the codebase.
    const jobs = await prisma.job.findMany({
      where: {
        status: "queued",
        jobType: { in: ["EMAIL_SEND", "EMAILSEND", "email_send"] },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: batch,
    });

    if (!jobs.length) {
      await sleep(pollMs);
      continue;
    }

    for (const job of jobs) {
      // Claim job (best-effort optimistic lock)
      const claimed = await prisma.job.updateMany({
        where: { id: job.id, status: "queued" },
        data: { status: "running", startedAt: new Date() },
      });
      if (claimed.count !== 1) continue;

      const input = asObj(job.input) as EmailInput;
      const to = String(input.to ?? "").trim();
      const subject = String(input.subject ?? "").trim();
      const text = String(input.text ?? "").trim();
      const html = input.html ? String(input.html) : null;

      try {
        if (!to || !subject || !text) throw new Error("email job missing to/subject/text");

        let output: any = null;
        if (provider === "none") {
          throw new Error("OUTBOUND_EMAIL_PROVIDER=none (email sending disabled)");
        } else if (provider === "microsoft") {
          const senderUpn = String(process.env.MS_SENDER_UPN ?? "").trim();
          if (!senderUpn) throw new Error("MS_SENDER_UPN missing");
          output = await sendViaMicrosoft({ senderUpn, to, subject, text, html });
        } else if (provider === "resend") {
          if (!from) throw new Error("OUTBOUND_EMAIL_FROM missing");
          output = await sendViaResend({ from, to, subject, text, html });
        } else {
          throw new Error(`unknown OUTBOUND_EMAIL_PROVIDER: ${provider}`);
        }

        await prisma.$transaction([
          prisma.job.update({
            where: { id: job.id },
            data: {
              status: "succeeded",
              output: output ?? {},
              error: {},
              finishedAt: new Date(),
            },
          }),
          prisma.auditLog.create({
            data: {
              tenantId: job.tenantId,
              actorUserId: null,
              actorExternalId: "email_worker",
              actorType: "system",
              level: "info",
              action: "EMAIL_SENT",
              entityType: "job",
              entityId: job.id,
              message: `Email sent to ${to}`,
              meta: { to, subject, provider },
              timestamp: new Date(),
            },
          }),
        ]);
      } catch (e: any) {
        const errMsg = e?.message ?? String(e);
        await handleJobFailure(job.id, job.tenantId, job.retryCount, job.maxRetries, errMsg, "emailSender");
      }
    }
  }
}

main().catch((e) => {
  process.stderr.write(`[emailSender] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
