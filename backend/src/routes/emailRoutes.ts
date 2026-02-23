import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { engineTick } from "../core/engine/engine.js";

// Minimal alpha inbound email pipeline.
//
// POST /v1/email/inbound
// Headers:
//   x-inbound-secret: <INBOUND_EMAIL_SECRET> (optional but recommended)
// Body (JSON):
//   {
//     "tenantId": "<uuid>",
//     "to": "support@deadapp.info",
//     "from": "customer@example.com",
//     "fromName": "Customer Name",
//     "subject": "Help installing",
//     "text": "plain body",
//     "html": "<p>html</p>",
//     "messageId": "provider-message-id",
//     "provider": "mailgun|sendgrid|postmark|manual"
//   }
//
// Behavior:
// 1) Stores the message in agent_inbox_events (if table exists)
// 2) Triggers Cheryl WF-001 (Support Intake) using engine/run intent.

type InboundEmailBody = {
  tenantId?: string;
  to?: string;
  recipient?: string;
  from?: string;
  sender?: string;
  fromName?: string;
  subject?: string;
  text?: string;
  body?: string;
  html?: string;
  messageId?: string;
  provider?: string;
};

function pickEmail(v?: string | null): string {
  const s = String(v ?? "").trim();
  // handle formats like: "Name <email@domain>"
  const m = s.match(/<([^>]+)>/);
  return (m?.[1] ?? s).trim();
}

export const emailRoutes: FastifyPluginAsync = async (app) => {
  app.post("/inbound", async (req, reply) => {
    const secret = String(req.headers["x-inbound-secret"] ?? "").trim();
    const expected = String(process.env.INBOUND_EMAIL_SECRET ?? "").trim();
    if (expected && secret !== expected) {
      return reply.code(401).send({ ok: false, error: "invalid_inbound_secret" });
    }

    const body = (req.body ?? {}) as InboundEmailBody;
    const tenantId = String(body.tenantId ?? "").trim();
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const to = pickEmail(body.to ?? body.recipient);
    const from = pickEmail(body.from ?? body.sender);
    const subject = String(body.subject ?? "").trim();
    const text = String(body.text ?? body.body ?? "").trim();
    const html = body.html ? String(body.html) : null;
    const provider = String(body.provider ?? "manual").trim();
    const messageId = String(body.messageId ?? "").trim() || null;

    // Determine agent by inbox email (fallback to Cheryl for support@)
    let agentKey: string | null = null;
    if (to) {
      const rows = (await prisma.$queryRaw`
        select agent_key
        from agent_inboxes
        where lower(inbox_email) = lower(${to})
        limit 1
      `) as any[];
      agentKey = rows?.[0]?.agent_key ? String(rows[0].agent_key) : null;
    }
    if (!agentKey && to.toLowerCase() === "support@deadapp.info") agentKey = "cheryl";
    if (!agentKey) agentKey = "cheryl"; // alpha-safe default

    // 1) Store event (best-effort; table may not exist yet)
    try {
      await prisma.$queryRaw`
        insert into agent_inbox_events (
          tenant_id,
          agent_key,
          inbox_email,
          provider,
          provider_message_id,
          from_email,
          from_name,
          subject,
          body_text,
          body_html,
          received_at,
          status,
          metadata
        )
        values (
          ${tenantId}::uuid,
          ${agentKey},
          ${to},
          ${provider},
          ${messageId},
          ${from},
          ${String(body.fromName ?? "").trim() || null},
          ${subject || null},
          ${text || null},
          ${html},
          now(),
          'new',
          ${JSON.stringify({ raw: body })}::jsonb
        )
        on conflict (provider, provider_message_id) do nothing
      `;
    } catch {
      // If the table doesn't exist yet, still continue to trigger the workflow.
    }

    // 2) Trigger Cheryl's Support Intake workflow
    const workflowId = process.env.SUPPORT_INTAKE_WORKFLOW_ID ?? "WF-001";
    const intent = await prisma.intent.create({
      data: {
        tenantId,
        agentId: null,
        intentType: "ENGINE_RUN",
        payload: {
          agentId: agentKey,
          workflowId,
          input: {
            customerEmail: from,
            subject,
            message: text,
            to,
            messageId,
            provider,
          },
          traceId: null,
          requestedBy: "email_inbound",
        },
        status: "DRAFT",
      },
    });

    // Optional: run one tick immediately for alpha
    const runTickNow = String((req.query as any)?.runTickNow ?? "true").toLowerCase() !== "false";
    const tickResult = runTickNow ? await engineTick() : null;

    return reply.send({ ok: true, intentId: intent.id, agentKey, workflowId, tickResult });
  });
};
