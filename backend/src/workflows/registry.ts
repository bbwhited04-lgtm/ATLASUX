import { prisma } from "../prisma.js";
import { n8nWorkflows, type AtlasWorkflowDef } from "./n8n/manifest.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import { runLLM, type AuditHook } from "../core/engine/brainllm.js";

export type WorkflowContext = {
  tenantId: string;
  requestedBy: string;
  agentId: string;
  workflowId: string;
  input: any;
  traceId?: string | null;
  intentId: string;
};

export type WorkflowResult = {
  ok: boolean;
  message?: string;
  output?: any;
};

export type WorkflowHandler = (ctx: WorkflowContext) => Promise<WorkflowResult>;

export const workflowCatalog = [
  { id: "WF-001", name: "Support Intake (Cheryl)",        description: "Create ticket → classify → acknowledge → route → audit.",                      ownerAgent: "cheryl" },
  { id: "WF-002", name: "Support Escalation (Cheryl)",    description: "Package escalation and route to executive owner.",                               ownerAgent: "cheryl" },
  { id: "WF-010", name: "Daily Executive Brief (Binky)",  description: "Daily intel digest with traceability.",                                          ownerAgent: "binky"  },
  { id: "WF-020", name: "Engine Run Smoke Test (Atlas)",  description: "Minimal end-to-end cloud surface verification.",                                  ownerAgent: "atlas"  },
  { id: "WF-021", name: "Bootstrap Atlas (Atlas)",        description: "Boot → discover agents → load KB → seed tasks → queue boot email → await command.", ownerAgent: "atlas"  },
] as const;

export { n8nWorkflows };

export const workflowCatalogAll = [
  ...workflowCatalog,
  ...n8nWorkflows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    ownerAgent: w.ownerAgent as string,
    category: w.category,
    trigger: w.trigger,
    humanInLoop: w.humanInLoop,
  })),
];

// ── Shared helpers ────────────────────────────────────────────────────────────

export async function writeStepAudit(ctx: WorkflowContext, step: string, message: string, meta: any = {}) {
  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      actorUserId: null,
      actorExternalId: String(ctx.requestedBy ?? ""),
      actorType: "system",
      level: "info",
      action: "WORKFLOW_STEP",
      entityType: "intent",
      entityId: ctx.intentId,
      message: `[${ctx.workflowId}] ${step}: ${message}`,
      meta: { ...meta, workflowId: ctx.workflowId, agentId: ctx.agentId, traceId: ctx.traceId ?? null, step },
      timestamp: new Date(),
    },
  });
}

export async function queueEmail(
  ctx: WorkflowContext,
  email: { to: string; subject: string; text: string; fromAgent?: string },
) {
  const job = await prisma.job.create({
    data: {
      tenantId: ctx.tenantId,
      requested_by_user_id: ctx.requestedBy,
      status: "queued",
      jobType: "EMAIL_SEND",
      priority: 5,
      input: {
        to: email.to,
        subject: email.subject,
        text: email.text,
        fromAgent: email.fromAgent ?? ctx.agentId,
        traceId: ctx.traceId ?? null,
        workflowId: ctx.workflowId,
        intentId: ctx.intentId,
      },
    },
  });
  await writeStepAudit(ctx, "email.queue", `Queued email to ${email.to} (${job.id})`, {
    jobId: job.id,
    to: email.to,
    subject: email.subject,
  });
  return job;
}

/** Simple audit hook — LLM events go to console; DB audit is handled by writeStepAudit. */
const dbAuditHook: AuditHook = (evt) => {
  console.log(JSON.stringify({ source: "brainllm", ...evt }));
};

/** Lookup agent email from env (e.g. AGENT_EMAIL_BINKY). */
function agentEmail(agentId: string): string | null {
  const key = `AGENT_EMAIL_${agentId.toUpperCase()}`;
  return process.env[key]?.trim() || null;
}

/**
 * Wrap a runLLM call with graceful fallback.
 * Returns the LLM text on success, or a fallback string on any error.
 */
async function safeLLM(
  ctx: WorkflowContext,
  opts: {
    agent: string;
    purpose: string;
    route: "ORCHESTRATION_REASONING" | "LONG_CONTEXT_SUMMARY" | "DRAFT_GENERATION_FAST" | "CLASSIFY_EXTRACT_VALIDATE";
    system: string;
    user: string;
  },
): Promise<string> {
  try {
    const resp = await runLLM(
      {
        runId: ctx.intentId,
        agent: opts.agent,
        purpose: opts.purpose,
        route: opts.route,
        messages: [
          { role: "system", content: opts.system },
          { role: "user",   content: opts.user   },
        ],
      },
      dbAuditHook,
    );
    return resp.text;
  } catch (err: any) {
    const reason = err?.code === "LLM_DENIED" ? `guardrail denied (${err.message})` : (err?.message ?? String(err));
    await writeStepAudit(ctx, "llm.fallback", `LLM skipped: ${reason}`);
    return `[LLM unavailable: ${reason}]`;
  }
}

// ── n8n generic handler factory ───────────────────────────────────────────────

function createN8nHandler(def: AtlasWorkflowDef): WorkflowHandler {
  return async (ctx) => {
    await writeStepAudit(ctx, `${def.id}.start`, `Starting ${def.name}`);

    // 1. Pull KB for the owner agent + workflow topic
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: def.ownerAgent,
      query: String(ctx.input?.topic ?? ctx.input?.subject ?? def.description).slice(0, 200),
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
    });

    // 2. LLM reasoning
    const route =
      def.category === "research" || def.category === "analytics"
        ? ("LONG_CONTEXT_SUMMARY" as const)
        : ("ORCHESTRATION_REASONING" as const);

    const systemPrompt = [
      `You are ${def.ownerAgent.toUpperCase()}, an Atlas UX AI agent.`,
      `Workflow: ${def.name} (${def.id})`,
      `Description: ${def.description}`,
      `Category: ${def.category} | Trigger: ${def.trigger}`,
      kb.text
        ? `\n\nKnowledge Base (${kb.items.length} docs, ${kb.totalChars} chars):\n${kb.text}`
        : "\n\n(No KB docs loaded for this agent yet — upload docs with slug prefix agent/${def.ownerAgent}/ in the KB hub.)",
    ].join("\n");

    const userPrompt = [
      `Execute "${def.name}".`,
      Object.keys(ctx.input ?? {}).length > 0
        ? `Input:\n${JSON.stringify(ctx.input, null, 2)}`
        : "No specific input. Apply defaults from your KB and role.",
      def.humanInLoop
        ? "\nThis workflow requires human approval before any external action. Draft output only — do not act."
        : "",
      "\nRespond with: (1) what you did, (2) the generated content or decision, (3) next recommended steps.",
    ].join("\n");

    const llmText = await safeLLM(ctx, {
      agent: def.ownerAgent.toUpperCase(),
      purpose: `wf_${def.id}`,
      route,
      system: systemPrompt,
      user: userPrompt,
    });

    await writeStepAudit(ctx, `${def.id}.llm`, `LLM output: ${llmText.slice(0, 120)}…`, {
      chars: llmText.length,
      kbItems: kb.items.length,
    });

    // 3. Queue result email to owner agent (if email configured)
    const toEmail = agentEmail(def.ownerAgent);
    if (toEmail) {
      await queueEmail(ctx, {
        to: toEmail,
        fromAgent: "atlas",
        subject: `[${def.id}] ${def.name} — Run Complete`,
        text: [
          `Workflow: ${def.name}`,
          `Trace: ${ctx.traceId ?? ctx.intentId}`,
          `KB docs used: ${kb.items.length}`,
          def.humanInLoop ? "\n⚠️ HUMAN APPROVAL REQUIRED before external action.\n" : "",
          `\n${llmText}`,
        ].join("\n"),
      });
    }

    return {
      ok: true,
      message: `${def.name} executed`,
      output: {
        workflowId: def.id,
        ownerAgent: def.ownerAgent,
        humanInLoop: def.humanInLoop,
        kbItems: kb.items.length,
        llmChars: llmText.length,
        summary: llmText.slice(0, 400),
      },
    };
  };
}

// ── Core workflow handlers ────────────────────────────────────────────────────

const handlers: Record<string, WorkflowHandler> = {

  // WF-020 — Smoke test (deterministic, no LLM overhead)
  "WF-020": async (ctx) => {
    await writeStepAudit(ctx, "smoke.start", "Starting smoke test");
    await writeStepAudit(ctx, "smoke.ok",    "Smoke test complete");
    return { ok: true, message: "Smoke test executed", output: { traceId: ctx.traceId ?? null } };
  },

  // WF-021 — Bootstrap Atlas: KB discovery + LLM readiness summary
  "WF-021": async (ctx) => {
    await writeStepAudit(ctx, "bootstrap.start", "Bootstrapping Atlas");

    const catalog = workflowCatalogAll.map((w) => ({
      id: w.id, name: w.name, description: w.description, ownerAgent: w.ownerAgent,
    }));

    // Pull atlas governance + agent KB
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: "atlas",
      query: "company overview mission agents capabilities",
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
    });

    const agentList = workflowCatalogAll
      .map((w) => w.ownerAgent)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();

    const llmText = await safeLLM(ctx, {
      agent: "ATLAS",
      purpose: "bootstrap_readiness",
      route: "ORCHESTRATION_REASONING",
      system: [
        "You are Atlas, CEO of the Atlas UX AI workforce.",
        `You have just booted and can see ${catalog.length} workflows across ${agentList.length} agents.`,
        kb.text
          ? `\nKnowledge Base context (${kb.items.length} docs):\n${kb.text}`
          : "\n(KB is empty — no governance or agent docs uploaded yet.)",
      ].join("\n"),
      user: [
        "Generate a structured boot-ready summary. Include:",
        "1. What you know about the company/mission from KB",
        "2. Which agents are active and their roles",
        "3. Top 3 immediate priorities based on KB context",
        "4. Any gaps or missing KB information you need",
        `Agents available: ${agentList.join(", ")}`,
        `Total workflows: ${catalog.length}`,
      ].join("\n"),
    });

    await writeStepAudit(ctx, "bootstrap.kb", `KB loaded: ${kb.items.length} docs, ${kb.totalChars} chars`, {
      kbItems: kb.items.length,
    });

    // Boot email
    const to = String(ctx.input?.emailTo ?? "").trim();
    if (to) {
      await queueEmail(ctx, {
        to,
        fromAgent: "atlas",
        subject: "Atlas is online",
        text: [
          "Atlas bootstrap complete.\n",
          llmText,
          `\n\nWorkflows loaded: ${catalog.length}`,
          `KB documents: ${kb.items.length}`,
          `Trace: ${ctx.traceId ?? ctx.intentId}`,
        ].join("\n"),
      });
    }

    await writeStepAudit(ctx, "bootstrap.ready", "Atlas bootstrap complete", {
      workflowCount: catalog.length,
      agentCount: agentList.length,
      kbItems: kb.items.length,
    });

    return {
      ok: true,
      message: "Bootstrap complete",
      output: {
        workflowCatalog: catalog,
        agentCount: agentList.length,
        kbItems: kb.items.length,
        readinessSummary: llmText.slice(0, 600),
        next: "AWAIT_COMMAND",
        traceId: ctx.traceId ?? null,
      },
    };
  },

  // WF-001 — Support Intake: LLM classifies + drafts acknowledgment
  "WF-001": async (ctx) => {
    const customerEmail = String(ctx.input?.customerEmail ?? "").trim();
    const subject       = String(ctx.input?.subject       ?? "Support Request").trim();
    const message       = String(ctx.input?.message       ?? "").trim();

    if (!customerEmail) return { ok: false, message: "customerEmail required" };

    await writeStepAudit(ctx, "intake.start", `Intake for ${customerEmail}`, { subject });

    // KB for Cheryl + query on the issue topic
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: "cheryl",
      query: `${subject} ${message}`.slice(0, 200),
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
    });

    // LLM: classify + draft ack + recommend routing
    const llmText = await safeLLM(ctx, {
      agent: "CHERYL",
      purpose: "support_intake_classify",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      system: [
        "You are Cheryl, Atlas UX Customer Support Officer.",
        "Classify support tickets and draft professional acknowledgment emails.",
        kb.text ? `\nKB context:\n${kb.text}` : "",
      ].join("\n"),
      user: [
        `Customer: ${customerEmail}`,
        `Subject: ${subject}`,
        `Message: ${message}`,
        "",
        "Respond as JSON with fields:",
        '{ "category": "billing|legal|feature|bug|general", "priority": "low|normal|high|urgent",',
        '  "routeTo": "tina|larry|binky|engineering|binky", "ackEmail": "<full email body to send customer>",',
        '  "internalNote": "<one-line note for the team>" }',
      ].join("\n"),
    });

    // Parse LLM JSON, fallback to heuristics
    let parsed: any = {};
    try { parsed = JSON.parse(llmText.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); } catch { /* fallback */ }

    const category = String(parsed.category ?? (
      message.toLowerCase().includes("bill") ? "billing" :
      message.toLowerCase().includes("bug")  ? "bug"     : "general"
    ));
    const routeTo = String(parsed.routeTo ?? (
      category === "billing" ? "tina" :
      category === "legal"   ? "larry" :
      category === "feature" ? "binky" :
      category === "bug"     ? "engineering" : "binky"
    ));
    const priority  = String(parsed.priority ?? "normal");
    const ackBody   = parsed.ackEmail
      ?? `Hi — we received your request and are reviewing it now.\n\nCategory: ${category}\nTrace: ${ctx.traceId ?? ctx.intentId}\n\nMessage received:\n${message}\n\n— Cheryl (Atlas UX Support)`;

    await writeStepAudit(ctx, "intake.classify", `Category: ${category}, Priority: ${priority}, Route: ${routeTo}`, {
      category, priority, routeTo,
    });

    // Ack email to customer
    await queueEmail(ctx, {
      to: customerEmail,
      subject: `Re: ${subject} (Ticket received)`,
      text: ackBody,
      fromAgent: "cheryl",
    });

    // Internal routing email
    await queueEmail(ctx, {
      to: agentEmail("atlas") ?? "atlas@deadapp.info",
      subject: `[${ctx.traceId ?? ctx.intentId}] Support Intake → ${routeTo.toUpperCase()} [${priority}]`,
      text: [
        `Support intake routed to ${routeTo}.`,
        `Customer: ${customerEmail}`,
        `Subject: ${subject}`,
        `Category: ${category} | Priority: ${priority}`,
        `\nMessage:\n${message}`,
        `\nInternal note: ${parsed.internalNote ?? ""}`,
        `\nIntent: ${ctx.intentId}`,
      ].join("\n"),
      fromAgent: "cheryl",
    });

    return {
      ok: true,
      message: "Support intake processed",
      output: { category, priority, routedTo: routeTo, kbItems: kb.items.length },
    };
  },

  // WF-002 — Support Escalation: LLM drafts formal escalation memo
  "WF-002": async (ctx) => {
    const toRole  = String(ctx.input?.toRole  ?? "").trim().toLowerCase();
    const summary = String(ctx.input?.summary ?? "").trim();
    if (!toRole || !summary) return { ok: false, message: "toRole and summary required" };

    await writeStepAudit(ctx, "escalate.start", `Escalation to ${toRole}`);

    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: toRole,
      query: `escalation protocol ${summary}`.slice(0, 200),
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
    });

    const llmText = await safeLLM(ctx, {
      agent: ctx.agentId.toUpperCase(),
      purpose: "support_escalation_memo",
      route: "ORCHESTRATION_REASONING",
      system: [
        `You are ${ctx.agentId.toUpperCase()}, escalating an issue to ${toRole.toUpperCase()}.`,
        "Write a professional, structured escalation memo.",
        kb.text ? `\nKB context for ${toRole}:\n${kb.text}` : "",
      ].join("\n"),
      user: [
        `Escalation to: ${toRole.toUpperCase()}`,
        `Summary: ${summary}`,
        `Evidence: ${JSON.stringify(ctx.input?.evidence ?? {}, null, 2)}`,
        "",
        "Write a formal escalation memo with: Executive Summary, Evidence, Recommended Action, Urgency level.",
      ].join("\n"),
    });

    await writeStepAudit(ctx, "escalate.drafted", `Memo drafted (${llmText.length} chars)`);

    const toEmail = agentEmail(toRole) ?? agentEmail("atlas") ?? "atlas@deadapp.info";
    await queueEmail(ctx, {
      to: toEmail,
      subject: `[ESCALATION] ${toRole.toUpperCase()} ← ${ctx.agentId.toUpperCase()} (${ctx.traceId ?? ctx.intentId})`,
      text: `${llmText}\n\nIntent: ${ctx.intentId}`,
      fromAgent: ctx.agentId,
    });

    await writeStepAudit(ctx, "escalate.sent", `Escalation memo queued to ${toEmail}`);

    return {
      ok: true,
      message: "Escalation queued",
      output: { toRole, kbItems: kb.items.length, memoChars: llmText.length },
    };
  },

  // WF-010 — Daily Executive Brief: LLM generates real brief from KB
  "WF-010": async (ctx) => {
    await writeStepAudit(ctx, "brief.start", "Collecting KB intel for daily brief");

    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: "binky",
      query: "daily operations report metrics performance summary",
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
    });

    const llmText = await safeLLM(ctx, {
      agent: "BINKY",
      purpose: "daily_executive_brief",
      route: "LONG_CONTEXT_SUMMARY",
      system: [
        "You are Binky, CRO of Atlas UX.",
        "Produce a concise, structured daily executive brief for the leadership team.",
        kb.text
          ? `\nKnowledge Base context (${kb.items.length} docs):\n${kb.text}`
          : "\n(KB empty — brief will be skeletal until docs are uploaded.)",
      ].join("\n"),
      user: [
        `Date: ${new Date().toISOString().slice(0, 10)}`,
        "Produce a daily executive brief with sections:",
        "1. Key Highlights",
        "2. Active Campaigns / Initiatives",
        "3. Risks & Blockers",
        "4. Recommended Actions for Today",
        "5. Metrics (use KB data or note if unavailable)",
        "Keep it actionable and under 400 words.",
      ].join("\n"),
    });

    await writeStepAudit(ctx, "brief.composed", `Brief composed (${llmText.length} chars, ${kb.items.length} KB docs)`);

    const toEmail = agentEmail("binky") ?? "binky@deadapp.info";
    await queueEmail(ctx, {
      to: toEmail,
      subject: `[DAILY BRIEF] ${new Date().toISOString().slice(0, 10)}`,
      text: `Daily Executive Brief\n${"=".repeat(40)}\n\n${llmText}\n\nTrace: ${ctx.traceId ?? ctx.intentId}`,
      fromAgent: "binky",
    });

    await writeStepAudit(ctx, "brief.queued", `Brief queued to ${toEmail}`);

    return {
      ok: true,
      message: "Daily brief queued",
      output: {
        date: new Date().toISOString().slice(0, 10),
        kbItems: kb.items.length,
        briefChars: llmText.length,
        preview: llmText.slice(0, 300),
      },
    };
  },
};

// ── Auto-register all n8n workflows ──────────────────────────────────────────
for (const def of n8nWorkflows) {
  if (!handlers[def.id]) {
    handlers[def.id] = createN8nHandler(def);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getWorkflowHandler(workflowId: string): WorkflowHandler | null {
  return handlers[workflowId] ?? null;
}
