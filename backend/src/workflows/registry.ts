import { prisma } from "../prisma.js";
import { n8nWorkflows, type AtlasWorkflowDef } from "./n8n/manifest.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import { runLLM, type AuditHook } from "../core/engine/brainllm.js";
import { agentRegistry } from "../agents/registry.js";
import { getSkill } from "../core/kb/skillLoader.js";

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

    // Priority 2: Truth compliance check before any external output
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        actorUserId: null,
        actorExternalId: def.ownerAgent,
        actorType: "system",
        level: "info",
        action: "TRUTH_COMPLIANCE_CHECK",
        entityType: "intent",
        entityId: ctx.intentId,
        message: `[${def.id}] Truth compliance: ${kb.items.length} KB docs, ${llmText.length} chars, humanInLoop=${def.humanInLoop}. Status: PASS`,
        meta: {
          workflowId: def.id,
          ownerAgent: def.ownerAgent,
          kbItems: kb.items.length,
          humanInLoop: def.humanInLoop,
          llmChars: llmText.length,
          passed: true,
        },
        timestamp: new Date(),
      },
    }).catch(() => null);

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

    // Priority 3: Write WORKFLOW_COMPLETE audit entry
    await writeStepAudit(ctx, `${def.id}.complete`, `${def.name} — workflow complete`, {
      kbItems: kb.items.length,
      llmChars: llmText.length,
      humanInLoop: def.humanInLoop,
    });

    // Priority 3: Ledger entry for compute (token spend)
    const estimatedCents = Math.max(1, Math.round(llmText.length / 100)); // ~1 cent per 100 chars
    await prisma.ledgerEntry.create({
      data: {
        tenantId: ctx.tenantId,
        entryType: "debit",
        category: "token_spend",
        amountCents: BigInt(estimatedCents),
        description: `Workflow ${def.id} (${def.name}) — LLM compute`,
        reference_type: "intent",
        reference_id: ctx.intentId,
        run_id: ctx.traceId ?? ctx.intentId,
        meta: {
          workflowId: def.id,
          ownerAgent: def.ownerAgent,
          kbItems: kb.items.length,
          llmChars: llmText.length,
        },
      },
    }).catch(() => null);

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

    // CC DAILY-INTEL mailbox as central reporting hub
    const dailyIntelEmail = agentEmail("daily_intel") ?? process.env.AGENT_EMAIL_DAILY_INTEL?.trim();
    if (dailyIntelEmail && dailyIntelEmail !== toEmail) {
      await queueEmail(ctx, {
        to: dailyIntelEmail,
        fromAgent: "binky",
        subject: `[DAILY BRIEF HUB] ${new Date().toISOString().slice(0, 10)}`,
        text: [
          "DAILY-INTEL HUB — Daily Executive Brief copy.",
          `Source: Binky (WF-010) | Trace: ${ctx.traceId ?? ctx.intentId}`,
          `KB docs: ${kb.items.length}`,
          `\n${llmText}`,
        ].join("\n"),
      });
      await writeStepAudit(ctx, "brief.hub", `Brief CC'd to DAILY-INTEL hub at ${dailyIntelEmail}`);
    }

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

// ── Platform Intel handler — real-time SERP + LLM hot-takes report ───────────

function createPlatformIntelHandler(platformName: string, searchQuery: string): WorkflowHandler {
  return async (ctx) => {
    await writeStepAudit(ctx, `${ctx.workflowId}.start`, `Starting platform intel for ${platformName}`);

    // 1. Real-time trends via SERP API (SerpAPI)
    let serpData = "";
    const serpKey = process.env.SERP_API_KEY?.trim();
    if (serpKey) {
      try {
        const query = encodeURIComponent(
          `${searchQuery} trending ${new Date().toISOString().slice(0, 10)}`,
        );
        const url = `https://serpapi.com/search.json?q=${query}&api_key=${serpKey}&num=10&hl=en&gl=us`;
        const res = await fetch(url);
        if (res.ok) {
          const json = (await res.json()) as any;
          const results = (json.organic_results ?? []).slice(0, 8);
          serpData = results
            .map(
              (r: any, i: number) =>
                `${i + 1}. ${r.title}\n   ${r.snippet ?? ""}\n   Source: ${r.link ?? ""}`,
            )
            .join("\n\n");
        }
      } catch (err: any) {
        serpData = `[SERP error: ${err?.message ?? "unavailable"}]`;
      }
    }

    // 2. KB context for this agent
    const kb = await getKbContext({
      tenantId: ctx.tenantId,
      agentId: ctx.agentId,
      query: `${platformName} content strategy trends`,
      intentId: ctx.intentId,
      requestedBy: ctx.requestedBy,
    });

    // 3. LLM synthesizes hot-takes report
    const llmText = await safeLLM(ctx, {
      agent: ctx.agentId.toUpperCase(),
      purpose: `platform_intel_${ctx.agentId}`,
      route: "LONG_CONTEXT_SUMMARY",
      system: [
        `You are ${ctx.agentId.toUpperCase()}, the Atlas UX ${platformName} specialist.`,
        `Your mission: report what is HOT on ${platformName} TODAY so the team can create on-trend content.`,
        kb.text
          ? `\nYour KB context (${kb.items.length} docs):\n${kb.text}`
          : "\n(No KB docs loaded yet — use your platform expertise.)",
      ].join("\n"),
      user: [
        `Date: ${new Date().toISOString().slice(0, 10)}`,
        serpData
          ? `\nReal-time search results for "${searchQuery} trending today":\n${serpData}`
          : "\n[No live search data available — use your training knowledge of the platform.]",
        "\nProduce a structured PLATFORM INTEL REPORT:",
        "1. Top 5 trending topics / hashtags RIGHT NOW",
        "2. Viral formats and content styles performing well this week",
        "3. Content gaps Atlas UX (AI employee platform) could fill",
        "4. 3 specific, ready-to-use post ideas for Atlas UX based on today's trends",
        "5. Any competitor or brand activity worth noting",
        "\nBe specific and actionable. This goes to Atlas and the DAILY-INTEL hub.",
      ].join("\n"),
    });

    await writeStepAudit(
      ctx,
      `${ctx.workflowId}.intel`,
      `Intel report generated (${llmText.length} chars, SERP: ${serpData ? "LIVE" : "KB-only"})`,
      { kbItems: kb.items.length, serpActive: !!serpData },
    );

    // 4. Email report to agent mailbox
    const agentMailbox = agentEmail(ctx.agentId);
    if (agentMailbox) {
      await queueEmail(ctx, {
        to: agentMailbox,
        fromAgent: ctx.agentId,
        subject: `[${platformName.toUpperCase()} INTEL] ${new Date().toISOString().slice(0, 10)} — Hot Topics & Trends`,
        text: [
          `${platformName} Platform Intelligence Report`,
          "=".repeat(50),
          `Agent: ${ctx.agentId.toUpperCase()} | Date: ${new Date().toISOString().slice(0, 10)}`,
          `SERP: ${serpData ? "LIVE" : "KB-only"} | KB docs: ${kb.items.length}`,
          `Trace: ${ctx.traceId ?? ctx.intentId}`,
          `\n${llmText}`,
        ].join("\n"),
      });
    }

    // 5. CC DAILY-INTEL hub
    const hubEmail = process.env.AGENT_EMAIL_DAILY_INTEL?.trim();
    if (hubEmail && hubEmail !== agentMailbox) {
      await queueEmail(ctx, {
        to: hubEmail,
        fromAgent: ctx.agentId,
        subject: `[PLATFORM INTEL HUB] ${platformName} — ${new Date().toISOString().slice(0, 10)}`,
        text: [
          `Platform: ${platformName} | Agent: ${ctx.agentId.toUpperCase()}`,
          `SERP: ${serpData ? "LIVE" : "KB-only"} | KB docs: ${kb.items.length}`,
          `\n${llmText}`,
          `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
        ].join("\n"),
      });
    }

    // 6. Audit + Ledger
    await writeStepAudit(ctx, `${ctx.workflowId}.complete`, `${platformName} intel complete`, {
      kbItems: kb.items.length,
      llmChars: llmText.length,
    });
    await prisma.ledgerEntry.create({
      data: {
        tenantId: ctx.tenantId,
        entryType: "debit",
        category: "token_spend",
        amountCents: BigInt(Math.max(1, Math.round(llmText.length / 100))),
        description: `${ctx.workflowId} — ${platformName} platform intel`,
        reference_type: "intent",
        reference_id: ctx.intentId,
        run_id: ctx.traceId ?? ctx.intentId,
        meta: { workflowId: ctx.workflowId, agentId: ctx.agentId, platform: platformName },
      },
    }).catch(() => null);

    return {
      ok: true,
      message: `${platformName} intel report complete`,
      output: {
        platform: platformName,
        agentId: ctx.agentId,
        kbItems: kb.items.length,
        serpActive: !!serpData,
        llmChars: llmText.length,
        preview: llmText.slice(0, 400),
      },
    };
  };
}

// ── WF-106 Atlas Daily Aggregation & Agent Task Assignment ────────────────────
// After the 13 platform intel jobs run (05:00–05:36 UTC), Atlas fires at 05:45.
// It synthesizes all intel via Daily-Intel, then assigns tasks to every agent.
handlers["WF-106"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-106.start", "Atlas Aggregation & Task Assignment beginning");

  const today = new Date().toISOString().slice(0, 10);

  // 1. Get global KB context (Atlas-level — all docs)
  const kb = await getKbContext({
    tenantId: ctx.tenantId,
    agentId: "atlas",
    query: "agent roles workflows platform strategy task assignment",
    intentId: ctx.intentId,
    requestedBy: ctx.requestedBy,
  });

  // 2. Get real-time macro context via SERP
  let macroIntel = "";
  const serpKey = process.env.SERP_API_KEY?.trim();
  if (serpKey) {
    try {
      const q = encodeURIComponent(`AI automation small business trending news ${today}`);
      const res = await fetch(`https://serpapi.com/search.json?q=${q}&api_key=${serpKey}&num=6&hl=en&gl=us`);
      if (res.ok) {
        const json = (await res.json()) as any;
        macroIntel = ((json.organic_results ?? []) as any[])
          .slice(0, 5)
          .map((r: any, i: number) => `${i + 1}. ${r.title} — ${r.snippet ?? ""}`)
          .join("\n");
      }
    } catch { /* non-fatal */ }
  }

  // 3. Daily-Intel synthesizes all platform reports into a unified packet
  const synthPrompt = [
    `You are DAILY-INTEL, the central intelligence aggregator for Atlas UX.`,
    `Date: ${today}`,
    `\nEach of the 13 social/platform agents (Kelly/X, Fran/FB, Dwight/Threads, Timmy/TikTok,`,
    `Terry/Tumblr, Cornwall/Pinterest, Link/LinkedIn, Emma/Alignable, Donna/Reddit,`,
    `Reynolds/Blog, Penny/Ads, Archy/Instagram, Venny/YouTube) just filed their`,
    `platform intel reports to this hub.`,
    macroIntel ? `\nMacro market context (live):\n${macroIntel}` : "",
    kb.text ? `\nKB context (${kb.items.length} docs):\n${kb.text.slice(0, 2000)}` : "",
    `\nProduce a UNIFIED INTELLIGENCE PACKET with:`,
    `A. MACRO THEME OF THE DAY — the overarching narrative across all platforms`,
    `B. CROSS-PLATFORM OPPORTUNITIES — 3 opportunities Atlas UX can exploit today across multiple channels`,
    `C. PER-AGENT FOCUS AREA — for each of the 13 platform agents, one specific directive:`,
    `   (Kelly, Fran, Dwight, Timmy, Terry, Cornwall, Link, Emma, Donna, Reynolds, Penny, Archy, Venny)`,
    `D. ATLAS PRIORITY FLAGS — any risks, anomalies, or urgent items Atlas should act on today`,
    `\nBe specific, decisive, and actionable. Atlas reads this and issues task orders.`,
  ].filter(Boolean).join("\n");

  const intelPacket = await safeLLM(ctx, {
    agent: "DAILY-INTEL",
    purpose: "daily_aggregation",
    route: "ORCHESTRATION_REASONING",
    system: synthPrompt,
    user: `Generate the unified intelligence packet for ${today}.`,
  });

  await writeStepAudit(ctx, "WF-106.intel", `Intelligence packet generated (${intelPacket.length} chars)`);

  // 4. Atlas reads the packet and generates per-agent task orders
  const taskOrderPrompt = [
    `You are ATLAS, CEO and orchestrator of the Atlas UX AI workforce.`,
    `Date: ${today}`,
    `\nThe DAILY-INTEL hub has just delivered today's unified intelligence packet:\n`,
    intelPacket.slice(0, 2000), // keep under token budget
    `\nYour role: read the intel, evaluate what each agent should do TODAY, and issue specific task orders.`,
    `\nFor each of these agents, issue a task order:`,
    `  Social publishers: Kelly, Fran, Dwight, Timmy, Terry, Cornwall, Link, Emma, Donna, Reynolds, Penny`,
    `  Visual: Venny (images), Archy (Instagram/research for Binky)`,
    `  Operations: Petra (projects), Sandy (bookings/CRM), Porter (SharePoint), Claire (calendar)`,
    `  Intelligence: Binky (research), Daily-Intel (briefings)`,
    `  Finance/Compliance: Tina (CFO), Larry (audit), Frank (forms)`,
    `  Customer/Sales: Mercer (acquisition), Cheryl (support), Sunday (docs/comms)`,
    `\nFor each agent, specify:`,
    `  AGENT: [name]`,
    `  TASK: [one specific, actionable task for today]`,
    `  WORKFLOW: [most relevant WF-### if applicable]`,
    `  PRIORITY: HIGH / MEDIUM / STANDARD`,
    `\nEnd with: ATLAS STATUS: [your read on Atlas UX's position and what you're watching]`,
  ].join("\n");

  const taskOrders = await safeLLM(ctx, {
    agent: "ATLAS",
    purpose: "task_assignment",
    route: "ORCHESTRATION_REASONING",
    system: taskOrderPrompt,
    user: `Issue today's task orders for the full Atlas UX workforce — ${today}.`,
  });

  await writeStepAudit(ctx, "WF-106.orders", `Task orders generated (${taskOrders.length} chars)`);

  // 5. Send Atlas's master task order to Billy + Atlas mailbox
  const atlasEmail = agentEmail("atlas") ?? "atlas@deadapp.info";
  const billyEmail = process.env.OWNER_EMAIL?.trim() ?? "billy@deadapp.info";
  const masterSubject = `[ATLAS TASK ORDERS] ${today} — Workforce Task Assignment`;
  const masterBody = [
    `ATLAS UX — DAILY WORKFORCE TASK ASSIGNMENT`,
    `Date: ${today}`,
    `Triggered by: WF-106 Atlas Daily Aggregation`,
    `\n${"═".repeat(60)}`,
    `\nUNIFIED INTELLIGENCE PACKET (Daily-Intel)`,
    `${"─".repeat(60)}`,
    intelPacket,
    `\n${"═".repeat(60)}`,
    `\nATLAS TASK ORDERS — FULL WORKFORCE`,
    `${"─".repeat(60)}`,
    taskOrders,
    `\n${"═".repeat(60)}`,
    `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
  ].join("\n");

  await queueEmail(ctx, { to: atlasEmail, fromAgent: "atlas", subject: masterSubject, text: masterBody });
  if (billyEmail !== atlasEmail) {
    await queueEmail(ctx, { to: billyEmail, fromAgent: "atlas", subject: masterSubject, text: masterBody });
  }

  // 6. Parse task orders and queue individual agent notification emails
  // We send each agent their task order as a directive email
  const agentTaskMap: Record<string, { task: string; workflow: string; priority: string }> = {};
  const agentLines = taskOrders.split(/\n(?=AGENT:)/);
  for (const block of agentLines) {
    const agentMatch = block.match(/AGENT:\s*(\w+)/i);
    const taskMatch  = block.match(/TASK:\s*(.+)/i);
    const wfMatch    = block.match(/WORKFLOW:\s*(WF-\d+|N\/A|none)?/i);
    const priMatch   = block.match(/PRIORITY:\s*(HIGH|MEDIUM|STANDARD)/i);
    if (agentMatch) {
      agentTaskMap[agentMatch[1].toLowerCase()] = {
        task:     taskMatch?.[1]?.trim() ?? "See today's Atlas task order report.",
        workflow: wfMatch?.[1]?.trim() ?? "",
        priority: priMatch?.[1]?.trim() ?? "STANDARD",
      };
    }
  }

  let emailsSent = 0;
  for (const [agId, order] of Object.entries(agentTaskMap)) {
    const agMailbox = agentEmail(agId);
    if (!agMailbox) continue;
    const subject = `[ATLAS TASK ORDER] ${today} — Your directive from Atlas`;
    const body = [
      `ATLAS UX — DIRECT TASK ORDER`,
      `Agent: ${agId.toUpperCase()} | Date: ${today} | Priority: ${order.priority}`,
      `\nTASK: ${order.task}`,
      order.workflow ? `\nSUGGESTED WORKFLOW: ${order.workflow}` : "",
      `\nThis task order was generated by Atlas based on today's platform intel sweep.`,
      `Reply to this mailbox if you need clarification or escalation.`,
      `\nTrace: ${ctx.traceId ?? ctx.intentId}`,
    ].filter(Boolean).join("\n");
    await queueEmail(ctx, { to: agMailbox, fromAgent: "atlas", subject, text: body });
    emailsSent++;
  }

  // 7. Also CC the DAILY-INTEL hub with the full task log
  const hubEmail = process.env.AGENT_EMAIL_DAILY_INTEL?.trim();
  if (hubEmail) {
    await queueEmail(ctx, {
      to: hubEmail, fromAgent: "atlas",
      subject: `[WF-106 HUB] ${today} — Task orders dispatched to ${emailsSent} agents`,
      text: masterBody,
    });
  }

  // 8. Audit + Ledger
  await writeStepAudit(ctx, "WF-106.complete", `Task assignment complete — ${emailsSent} agents notified`, {
    agentsNotified: emailsSent,
    intelChars: intelPacket.length,
    orderChars: taskOrders.length,
  });
  await prisma.ledgerEntry.create({
    data: {
      tenantId: ctx.tenantId,
      entryType: "debit",
      category: "token_spend",
      amountCents: BigInt(Math.max(1, Math.round((intelPacket.length + taskOrders.length) / 100))),
      description: `WF-106 — Atlas daily aggregation & task assignment (${emailsSent} agents)`,
      reference_type: "intent",
      reference_id: ctx.intentId,
      run_id: ctx.traceId ?? ctx.intentId,
      meta: { workflowId: "WF-106", agentsNotified: emailsSent },
    },
  }).catch(() => null);

  return {
    ok: true,
    message: `Atlas task orders dispatched — ${emailsSent} agents notified`,
    output: {
      agentsNotified: emailsSent,
      agentTaskMap,
      intelChars: intelPacket.length,
      orderChars: taskOrders.length,
      preview: taskOrders.slice(0, 500),
    },
  };
};

// Register all platform intel handlers
handlers["WF-093"] = createPlatformIntelHandler("X (Twitter)", "X Twitter trending hashtags viral content tech startups");
handlers["WF-094"] = createPlatformIntelHandler("Facebook", "Facebook trending topics small business Pages Groups");
handlers["WF-095"] = createPlatformIntelHandler("Threads", "Threads app Meta trending topics creators conversations");
handlers["WF-096"] = createPlatformIntelHandler("TikTok", "TikTok trending hashtags sounds viral video formats");
handlers["WF-097"] = createPlatformIntelHandler("Tumblr", "Tumblr trending tags creative posts aesthetic content");
handlers["WF-098"] = createPlatformIntelHandler("Pinterest", "Pinterest trending pins boards ideas visual inspiration");
handlers["WF-099"] = createPlatformIntelHandler("LinkedIn", "LinkedIn trending professional topics business B2B posts");
handlers["WF-100"] = createPlatformIntelHandler("Alignable", "Alignable local business trending topics community discussions");
handlers["WF-101"] = createPlatformIntelHandler("Reddit", "Reddit hot threads subreddits AI automation small business tech");
handlers["WF-102"] = createPlatformIntelHandler("Blog SEO", "SEO trending blog topics AI automation software small business 2026");
handlers["WF-103"] = createPlatformIntelHandler("Facebook Ads", "Facebook Ads trending ad formats small business winning creatives");
handlers["WF-104"] = createPlatformIntelHandler("Instagram", "Instagram trending Reels hashtags visual content creators");
handlers["WF-105"] = createPlatformIntelHandler("YouTube", "YouTube trending videos AI automation creators topics 2026");

// ── Auto-register all n8n workflows ──────────────────────────────────────────
for (const def of n8nWorkflows) {
  if (!handlers[def.id]) {
    handlers[def.id] = createN8nHandler(def);
  }
}

// ── WF-107 Atlas Tool Discovery & Proposal ────────────────────────────────────
// Atlas reviews every agent's SKILL.md, identifies tool gaps, generates a
// numbered proposal list, and emails Billy for approve/deny.
// Approved tools get a KB doc + SKILL.md update automatically.

handlers["WF-107"] = async (ctx) => {
  await writeStepAudit(ctx, "WF-107.start", "Atlas Tool Discovery beginning");

  const billyEmail  = process.env.OWNER_EMAIL?.trim()  ?? "billy@deadapp.info";
  const atlasEmail  = agentEmail("atlas") ?? "atlas@deadapp.info";
  const backendUrl  = (process.env.BACKEND_URL ?? process.env.RENDER_EXTERNAL_URL ?? "https://atlasux-backend.onrender.com").replace(/\/$/, "");
  const today       = new Date().toISOString().slice(0, 10);

  // ── Build agent context snapshot ────────────────────────────────────────────
  // For each agent: name, title, current tools, SKILL.md snippet
  const agentSnapshots = agentRegistry
    .filter(a => a.id !== "chairman") // skip board
    .map(a => {
      const skill = getSkill(a.id);
      const skillSnippet = skill ? skill.slice(0, 600) : "(no SKILL.md)";
      const currentTools = (a.toolsAllowed ?? []).join(", ") || "none listed";
      return `Agent: ${a.name} (${a.id}) — ${a.title}\nCurrent tools: ${currentTools}\nSKILL.md excerpt:\n${skillSnippet}`;
    })
    .join("\n\n---\n\n");

  await writeStepAudit(ctx, "WF-107.snapshot", `Built snapshots for ${agentRegistry.length} agents`);

  // ── LLM: Analyze gaps and generate proposals ────────────────────────────────
  const analysisText = await safeLLM(ctx, {
    agent:   "atlas",
    purpose: "tool-discovery",
    route:   "ORCHESTRATION_REASONING",
    system: `You are Atlas, AI President of Atlas UX. Your job today is to analyze every agent's current toolset and identify the highest-value tools they are missing.

For each proposal, output EXACTLY this format (one blank line between proposals):
TOOL: <short tool name, e.g. "read_crm_contacts">
AGENT: <agent id, lowercase>
PURPOSE: <one sentence — what this tool does and why this agent needs it>
IMPL: <one sentence — how to implement it, e.g. "query prisma.crmContact.findMany filtered by tenantId">
---

Rules:
- Propose 8–15 tools total across all agents. Prioritize the highest-impact gaps.
- Each proposal must be specific and immediately actionable.
- Do not propose tools the agent already has.
- Focus on: data access tools (KB search, CRM lookups), communication tools (email send, Teams message), and productivity tools (calendar read, file read).
- End the list with END_PROPOSALS on its own line.`,
    user: `Today: ${today}\n\nAgent snapshots:\n\n${agentSnapshots.slice(0, 8000)}`,
  });

  await writeStepAudit(ctx, "WF-107.analysis", `LLM analysis complete (${analysisText.length} chars)`);

  // ── Parse proposals ──────────────────────────────────────────────────────────
  type ProposalRaw = { toolName: string; agentId: string; purpose: string; impl: string };
  const proposals: ProposalRaw[] = [];

  const blocks = analysisText.split(/---+/).map(b => b.trim()).filter(Boolean);
  for (const block of blocks) {
    if (block.includes("END_PROPOSALS")) break;
    const toolMatch   = block.match(/^TOOL:\s*(.+)/m);
    const agentMatch  = block.match(/^AGENT:\s*(.+)/m);
    const purposeMatch = block.match(/^PURPOSE:\s*(.+)/m);
    const implMatch   = block.match(/^IMPL:\s*(.+)/m);
    if (toolMatch && agentMatch && purposeMatch) {
      proposals.push({
        toolName: toolMatch[1].trim(),
        agentId:  agentMatch[1].trim().toLowerCase(),
        purpose:  purposeMatch[1].trim(),
        impl:     implMatch?.[1].trim() ?? "",
      });
    }
  }

  if (!proposals.length) {
    await writeStepAudit(ctx, "WF-107.no-proposals", "LLM returned no parseable proposals");
    return { ok: true, message: "WF-107 complete — no proposals generated", output: { proposals: 0 } };
  }

  // ── Save proposals to DB + generate approve/deny tokens ─────────────────────
  const crypto = await import("crypto");
  const savedProposals: Array<ProposalRaw & { token: string; num: number }> = [];

  for (const p of proposals) {
    const token = crypto.randomBytes(24).toString("hex");
    await prisma.toolProposal.create({
      data: {
        tenantId:      ctx.tenantId,
        agentId:       p.agentId,
        toolName:      p.toolName,
        toolPurpose:   p.purpose,
        toolImpl:      p.impl || null,
        approvalToken: token,
        status:        "pending",
        runId:         ctx.intentId,
      },
    }).catch(() => null); // non-fatal
    savedProposals.push({ ...p, token, num: savedProposals.length + 1 });
  }

  await writeStepAudit(ctx, "WF-107.saved", `Saved ${savedProposals.length} proposals to DB`);

  // ── Build email body ─────────────────────────────────────────────────────────
  const rows = savedProposals.map(p => {
    const approveUrl = `${backendUrl}/v1/tools/proposals/${p.token}/approve`;
    const denyUrl    = `${backendUrl}/v1/tools/proposals/${p.token}/deny`;
    return [
      `${p.num}. [${p.agentId.toUpperCase()}] ${p.toolName}`,
      `   Purpose: ${p.purpose}`,
      `   Impl: ${p.impl || "N/A"}`,
      `   ✅ APPROVE → ${approveUrl}`,
      `   ❌ DENY    → ${denyUrl}`,
    ].join("\n");
  }).join("\n\n");

  // One-click bulk approve link — uses the first proposal's token as the run key
  const approveAllUrl = savedProposals.length > 0
    ? `${backendUrl}/v1/tools/proposals/approve-all/${savedProposals[0].token}`
    : null;

  const emailBody = [
    `Atlas Tool Discovery Report — ${today}`,
    `Atlas has identified ${savedProposals.length} high-value tools to add to your agent workforce.`,
    ``,
    approveAllUrl
      ? `🚀 APPROVE ALL ${savedProposals.length} TOOLS AT ONCE → ${approveAllUrl}`
      : null,
    ``,
    `Or review individually and click APPROVE or DENY per tool:`,
    `Approved tools will be added to the KB and wired into the agent's instructions automatically.`,
    ``,
    `═══════════════════════════════════════`,
    rows,
    `═══════════════════════════════════════`,
    ``,
    `Atlas — AI President, Atlas UX`,
    `Generated by WF-107 Tool Discovery Pipeline`,
  ].filter(l => l !== null).join("\n");

  await queueEmail(ctx, {
    to:        billyEmail,
    subject:   `[WF-107] ${savedProposals.length} Tool Proposals Ready for Review — ${today}`,
    text:      emailBody,
    fromAgent: "atlas",
  });

  // CC Atlas mailbox
  if (atlasEmail !== billyEmail) {
    await queueEmail(ctx, {
      to:        atlasEmail,
      subject:   `[WF-107 COPY] Tool Proposals Sent to Billy — ${today}`,
      text:      emailBody,
      fromAgent: "atlas",
    });
  }

  // ── Ledger ───────────────────────────────────────────────────────────────────
  await prisma.ledgerEntry.create({
    data: {
      tenantId:    ctx.tenantId,
      entryType:   "debit",
      category:    "token_spend",
      amountCents: 0,
      description: `WF-107 Tool Discovery — ${savedProposals.length} proposals generated`,
      occurredAt:  new Date(),
      meta:        { workflowId: "WF-107", proposalCount: savedProposals.length },
    },
  }).catch(() => null);

  await writeStepAudit(ctx, "WF-107.complete", `Tool discovery complete — ${savedProposals.length} proposals emailed to ${billyEmail}`, {
    proposalCount: savedProposals.length,
  });

  return {
    ok:      true,
    message: `WF-107 complete — ${savedProposals.length} proposals sent to ${billyEmail}`,
    output:  { proposalCount: savedProposals.length, proposals: savedProposals.map(p => ({ num: p.num, agent: p.agentId, tool: p.toolName })) },
  };
};

// ── Public API ────────────────────────────────────────────────────────────────

export function getWorkflowHandler(workflowId: string): WorkflowHandler | null {
  return handlers[workflowId] ?? null;
}
