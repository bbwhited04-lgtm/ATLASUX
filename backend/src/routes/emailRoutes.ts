/**
 * emailRoutes.ts — Inbound Email Pipeline
 *
 * Pipeline stages:
 *   Mailbox → Ingest → Normalize → Classify → Dispatch → Audit
 *
 * POST /v1/email/inbound
 *   Headers:
 *     x-inbound-secret: <INBOUND_EMAIL_SECRET>  (required if env set)
 *   Body (JSON): see InboundEmailBody
 *
 * Stage 1 — Ingest:   Store raw event in agent_inbox_events (best-effort)
 * Stage 2 — Normalize: Clean addresses, strip HTML, truncate for classification
 * Stage 3 — Classify:  Determine agentKey + workflowId from inbox routing table,
 *                      named-inbox map, and keyword analysis
 * Stage 4 — Dispatch:  Create Intent record + trigger engine tick
 * Stage 5 — Audit:     Write audit log entry with classification result
 */

import type { FastifyPluginAsync } from "fastify";
import { timingSafeEqual } from "crypto";
import { prisma } from "../db/prisma.js";
import { engineTick } from "../core/engine/engine.js";
import { agentEmails } from "../config/agentEmails.js";

// ── Classification constants ─────────────────────────────────────────────────

/** Keywords that route to Petra (project manager) */
const PROJECT_KEYWORDS = [
  "project", "task", "deliverable", "sprint", "milestone",
  "deadline", "timeline", "scope", "planner", "assignment",
  "workflow request", "new work", "new job",
];

/** Named-inbox → agent map (supplemental to agent_inboxes DB table) */
const INBOX_AGENT_MAP: Array<{ email: string; agentKey: string }> = [
  { email: agentEmails.PETRA.toLowerCase(),   agentKey: "petra"   },
  { email: agentEmails.CLAIRE.toLowerCase(),  agentKey: "claire"  },
  { email: agentEmails.SANDY.toLowerCase(),   agentKey: "sandy"   },
  { email: agentEmails.FRANK.toLowerCase(),   agentKey: "frank"   },
  { email: agentEmails.CHERYL.toLowerCase(),  agentKey: "cheryl"  },
  { email: "support@deadapp.info",            agentKey: "cheryl"  },
];

/** Agent → workflow mapping */
const WORKFLOW_MAP: Record<string, string> = {
  petra:  process.env.PROJECT_INTAKE_WORKFLOW_ID  ?? "WF-002",
  claire: process.env.CALENDAR_INTAKE_WORKFLOW_ID ?? "WF-003",
  sandy:  process.env.BOOKING_INTAKE_WORKFLOW_ID  ?? "WF-004",
  frank:  process.env.FORMS_INTAKE_WORKFLOW_ID    ?? "WF-005",
  cheryl: process.env.SUPPORT_INTAKE_WORKFLOW_ID  ?? "WF-001",
};

// ── One-time workflow seeding ─────────────────────────────────────────────────

async function seedWorkflows() {
  const seeds = [
    { key: "WF-001", agent: "cheryl", name: "Support Intake"   },
    { key: "WF-002", agent: "petra",  name: "Project Intake"   },
    { key: "WF-003", agent: "claire", name: "Calendar Intake"  },
    { key: "WF-004", agent: "sandy",  name: "Booking Intake"   },
    { key: "WF-005", agent: "frank",  name: "Forms Intake"     },
  ];
  for (const s of seeds) {
    try {
      await prisma.$queryRaw`
        insert into workflows (workflow_key, agent_key, name, status, version)
        values (${s.key}, ${s.agent}, ${s.name}, 'active', '1')
        on conflict (workflow_key) do nothing
      `;
    } catch { /* table may not exist yet */ }
  }
}

// ── Input types ───────────────────────────────────────────────────────────────

type InboundEmailBody = {
  tenantId?: string;
  to?: string;       recipient?: string;
  from?: string;     sender?: string;
  fromName?: string;
  subject?: string;
  text?: string;     body?: string;
  html?: string;
  messageId?: string;
  provider?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickEmail(v?: string | null): string {
  const s = String(v ?? "").trim();
  const m = s.match(/<([^>]+)>/);
  return (m?.[1] ?? s).trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

/** Stage 2 — Normalize */
function normalize(body: InboundEmailBody) {
  const to       = pickEmail(body.to ?? body.recipient);
  const from     = pickEmail(body.from ?? body.sender);
  const fromName = String(body.fromName ?? "").trim() || null;
  const subject  = String(body.subject ?? "").trim();
  const rawText  = String(body.text ?? body.body ?? "").trim();
  const html     = body.html ? String(body.html) : null;
  // Prefer plain text; fall back to stripped HTML
  const text     = rawText || (html ? stripHtml(html) : "");
  const provider = String(body.provider ?? "manual").trim();
  const messageId = String(body.messageId ?? "").trim() || null;
  return { to, from, fromName, subject, text, html, provider, messageId };
}

/** Stage 3 — Classify */
async function classify(to: string, subject: string, text: string): Promise<{ agentKey: string; workflowId: string; reason: string }> {
  // 3a. DB inbox-table lookup
  if (to) {
    try {
      const rows = (await prisma.$queryRaw`
        select agent_key from agent_inboxes
        where lower(inbox_email) = lower(${to}) limit 1
      `) as any[];
      if (rows?.[0]?.agent_key) {
        const agentKey = String(rows[0].agent_key);
        return { agentKey, workflowId: WORKFLOW_MAP[agentKey] ?? "WF-001", reason: "inbox_table" };
      }
    } catch { /* table may not exist */ }
  }

  // 3b. Named-inbox map
  const toLower = to.toLowerCase();
  for (const entry of INBOX_AGENT_MAP) {
    if (toLower === entry.email) {
      return { agentKey: entry.agentKey, workflowId: WORKFLOW_MAP[entry.agentKey] ?? "WF-001", reason: "named_inbox" };
    }
  }

  // 3c. Keyword classification → Petra
  const haystack = `${subject} ${text}`.toLowerCase();
  if (PROJECT_KEYWORDS.some((kw) => haystack.includes(kw))) {
    return { agentKey: "petra", workflowId: WORKFLOW_MAP["petra"], reason: "keyword_match" };
  }

  // 3d. Default → Cheryl
  return { agentKey: "cheryl", workflowId: WORKFLOW_MAP["cheryl"], reason: "default" };
}

/** Stage 1 — Ingest (best-effort; never fails the pipeline) */
async function ingest(tenantId: string, agentKey: string, normalized: ReturnType<typeof normalize>) {
  try {
    await prisma.$queryRaw`
      insert into agent_inbox_events (
        tenant_id, agent_key, inbox_email, provider, provider_message_id,
        from_email, from_name, subject, body_text, body_html,
        received_at, status, metadata
      )
      values (
        ${tenantId}::uuid, ${agentKey}, ${normalized.to}, ${normalized.provider},
        ${normalized.messageId}, ${normalized.from}, ${normalized.fromName},
        ${normalized.subject || null}, ${normalized.text || null}, ${normalized.html},
        now(), 'new', ${JSON.stringify({ normalizedAt: new Date().toISOString() })}::jsonb
      )
      on conflict (provider, provider_message_id) do nothing
    `;
  } catch { /* non-fatal */ }
}

/** Stage 4 — Dispatch */
async function dispatch(tenantId: string, agentKey: string, workflowId: string, normalized: ReturnType<typeof normalize>) {
  const intent = await prisma.intent.create({
    data: {
      tenantId,
      agentId: null,
      intentType: "ENGINE_RUN",
      payload: {
        agentId: agentKey,
        workflowId,
        input: {
          customerEmail: normalized.from,
          subject: normalized.subject,
          message: normalized.text,
          to: normalized.to,
          messageId: normalized.messageId,
          provider: normalized.provider,
        },
        traceId: null,
        requestedBy: "email_inbound",
      },
      status: "DRAFT",
    },
  });
  return intent;
}

/** Stage 5 — Audit */
async function audit(tenantId: string, intentId: string, agentKey: string, workflowId: string, reason: string, normalized: ReturnType<typeof normalize>) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: "email_inbound",
        level: "info",
        action: "EMAIL_INBOUND_DISPATCHED",
        entityType: "intent",
        entityId: intentId,
        message: `Email from ${normalized.from} routed to ${agentKey} (${reason}) → ${workflowId}`,
        meta: {
          agentKey,
          workflowId,
          classifyReason: reason,
          subject: normalized.subject,
          from: normalized.from,
          to: normalized.to,
          provider: normalized.provider,
          messageId: normalized.messageId,
        },
        timestamp: new Date(),
      },
    } as any);
  } catch { /* non-fatal */ }
}

// ── Route registration ────────────────────────────────────────────────────────

export const emailRoutes: FastifyPluginAsync = async (app) => {
  // Seed all intake workflows on startup (best-effort)
  await seedWorkflows();

  /**
   * POST /v1/email/smtp-config
   * Store SMTP credentials server-side in token_vault.
   * Password is never stored in the client browser.
   */
  app.post("/smtp-config", async (req, reply) => {
    const body = (req.body ?? {}) as {
      org_id?: string; host?: string; port?: string;
      username?: string; password?: string;
      fromName?: string; fromEmail?: string; tls?: boolean;
    };
    const org_id = String(body.org_id ?? (req as any).tenantId ?? "").trim();
    if (!org_id) return reply.code(400).send({ ok: false, error: "org_id required" });
    if (!body.password) return reply.code(400).send({ ok: false, error: "password required" });

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("token_vault").upsert(
      {
        org_id,
        user_id: org_id,
        provider: "smtp",
        access_token: String(body.password),
        meta: {
          host: String(body.host ?? ""),
          port: String(body.port ?? "587"),
          username: String(body.username ?? ""),
          fromName: String(body.fromName ?? ""),
          fromEmail: String(body.fromEmail ?? ""),
          tls: body.tls !== false,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id,user_id,provider" }
    );

    if (error) return reply.code(500).send({ ok: false, error: "STORE_FAILED" });
    return reply.send({ ok: true });
  });

  /**
   * POST /v1/email/inbound
   * Pipeline: Mailbox → Ingest → Normalize → Classify → Dispatch → Audit
   */
  app.post("/inbound", async (req, reply) => {
    // Secret validation — fail closed: if INBOUND_EMAIL_SECRET is not set, reject all requests
    const secret   = String(req.headers["x-inbound-secret"] ?? "").trim();
    const expected = String(process.env.INBOUND_EMAIL_SECRET ?? "").trim();
    if (!expected) {
      return reply.code(401).send({ ok: false, error: "invalid_inbound_secret" });
    }
    const secretBuf = Buffer.from(secret);
    const expectedBuf = Buffer.from(expected);
    if (secretBuf.length !== expectedBuf.length || !timingSafeEqual(secretBuf, expectedBuf)) {
      return reply.code(401).send({ ok: false, error: "invalid_inbound_secret" });
    }

    const body = (req.body ?? {}) as InboundEmailBody;
    const tenantId = String(body.tenantId ?? "").trim();
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    // Stage 2: Normalize
    const normalized = normalize(body);

    // Stage 3: Classify
    const { agentKey, workflowId, reason } = await classify(normalized.to, normalized.subject, normalized.text);

    // Stage 1: Ingest (after classify so we know agentKey)
    await ingest(tenantId, agentKey, normalized);

    // Stage 4: Dispatch
    const intent = await dispatch(tenantId, agentKey, workflowId, normalized);

    // Optional immediate tick (alpha mode)
    const runTickNow = String((req.query as any)?.runTickNow ?? "true").toLowerCase() !== "false";
    const tickResult = runTickNow ? await engineTick() : null;

    // Stage 5: Audit
    await audit(tenantId, intent.id, agentKey, workflowId, reason, normalized);

    return reply.send({
      ok: true,
      pipeline: "mailbox→ingest→normalize→classify→dispatch→audit",
      intentId: intent.id,
      agentKey,
      workflowId,
      classifyReason: reason,
      tickResult,
    });
  });
};
