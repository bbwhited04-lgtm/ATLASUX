import { prisma } from "../prisma.js";
import { getSystemState } from "../services/systemState.js";

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

async function sendViaResend(args: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string | null;
}) {
  const apiKey = String(process.env.RESEND_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("RESEND_API_KEY missing");

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
 *  OUTBOUND_EMAIL_PROVIDER: resend|none (default resend)
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
      where: { status: "queued", jobType: { in: ["EMAIL_SEND", "EMAILSEND", "email_send"] } },
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
        await prisma.$transaction([
          prisma.job.update({
            where: { id: job.id },
            data: {
              status: "failed",
              error: { message: errMsg },
              finishedAt: new Date(),
            },
          }),
          prisma.auditLog.create({
            data: {
              tenantId: job.tenantId,
              actorUserId: null,
              actorExternalId: "email_worker",
              actorType: "system",
              level: "error",
              action: "EMAIL_SEND_FAILED",
              entityType: "job",
              entityId: job.id,
              message: `Email failed: ${errMsg}`,
              meta: { to, subject, provider },
              timestamp: new Date(),
            },
          }),
        ]);
      }
    }
  }
}

main().catch((e) => {
  process.stderr.write(`[emailSender] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
