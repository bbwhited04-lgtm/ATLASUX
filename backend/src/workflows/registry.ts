import { prisma } from "../prisma.js";
import { n8nWorkflows } from "./n8n/manifest.js";

export type WorkflowContext = {
  tenantId: string;
  requestedBy: string; // user id / tenant id fallback
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
  { id: "WF-001", name: "Support Intake (Cheryl)", description: "Create ticket → classify → acknowledge → route → audit.", ownerAgent: "cheryl" },
  { id: "WF-002", name: "Support Escalation (Cheryl)", description: "Package escalation and route to executive owner.", ownerAgent: "cheryl" },
  { id: "WF-010", name: "Daily Executive Brief (Binky)", description: "Daily intel digest with traceability.", ownerAgent: "binky" },
  { id: "WF-020", name: "Engine Run Smoke Test (Atlas)", description: "Minimal end-to-end cloud surface verification.", ownerAgent: "atlas" },
] as const;

// n8n workflow library (JSON templates + webhook paths)
export { n8nWorkflows };

export const workflowCatalogAll = [
  ...workflowCatalog,
  ...n8nWorkflows.map(w => ({ id: w.id, name: w.name, description: `n8n: ${w.category}`, ownerAgent: "atlas" as const })),
] as const;



async function writeStepAudit(ctx: WorkflowContext, step: string, message: string, meta: any = {}) {
  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      actorUserId: ctx.requestedBy,
      actorType: "user",
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

async function queueEmail(ctx: WorkflowContext, email: { to: string; subject: string; text: string; fromAgent?: string }) {
  // We store "emails" as Jobs so they are traceable and can be delivered by a later SMTP worker.
  const job = await prisma.job.create({
    data: {
      tenantId: ctx.tenantId,
      requestedBy: ctx.requestedBy,
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

  await writeStepAudit(ctx, "email.queue", `Queued email to ${email.to} (${job.id})`, { jobId: job.id, to: email.to, subject: email.subject });
  return job;
}

const handlers: Record<string, WorkflowHandler> = {
  "WF-020": async (ctx) => {
    await writeStepAudit(ctx, "smoke.start", "Starting smoke test");
    await writeStepAudit(ctx, "smoke.ok", "Smoke test complete");
    return { ok: true, message: "Smoke test executed", output: { traceId: ctx.traceId ?? null } };
  },

  "WF-001": async (ctx) => {
    // Input expected: { customerEmail, subject, message, category? }
    const customerEmail = String(ctx.input?.customerEmail ?? "").trim();
    const subject = String(ctx.input?.subject ?? "Support Request").trim();
    const message = String(ctx.input?.message ?? "").trim();
    const category = String(ctx.input?.category ?? "general").toLowerCase();

    if (!customerEmail) return { ok: false, message: "customerEmail required" };

    await writeStepAudit(ctx, "intake.create", `Intake created for ${customerEmail}`, { category, subject });

    // Acknowledge receipt (queued email)
    await queueEmail(ctx, {
      to: customerEmail,
      subject: `Re: ${subject} (Ticket received)`,
      text: `Hi — we received your request and are reviewing it now.\n\nCategory: ${category}\nTrace: ${ctx.traceId ?? ctx.intentId}\n\nMessage received:\n${message}\n\n— Cheryl (Atlas UX Support)`,
      fromAgent: "cheryl",
    });

    // Route (by category) – queued internal email to executive owner
    const owner =
      category.includes("bill") ? "tina" :
      category.includes("compliance") || category.includes("legal") ? "larry" :
      category.includes("feature") || category.includes("product") ? "binky" :
      category.includes("bug") || category.includes("error") ? "engineering" :
      "binky";

    await writeStepAudit(ctx, "intake.route", `Routed to ${owner}`, { owner });

    await queueEmail(ctx, {
      to: `atlas@deadappcorp.org`,
      subject: `[${ctx.traceId ?? ctx.intentId}] Support Intake → ${owner.toUpperCase()}`,
      text: `Support intake routed to ${owner}.\nCustomer: ${customerEmail}\nSubject: ${subject}\nCategory: ${category}\n\nMessage:\n${message}\n\nIntent: ${ctx.intentId}`,
      fromAgent: "cheryl",
    });

    return { ok: true, message: "Support intake processed", output: { routedTo: owner } };
  },

  "WF-002": async (ctx) => {
    // Input: { toRole: "tina"|"larry"|"binky"|..., summary, evidence? }
    const toRole = String(ctx.input?.toRole ?? "").trim().toLowerCase();
    const summary = String(ctx.input?.summary ?? "").trim();
    if (!toRole || !summary) return { ok: false, message: "toRole and summary required" };

    await writeStepAudit(ctx, "escalate.pack", `Escalation packet prepared`, { toRole });
    await queueEmail(ctx, {
      to: `atlas@deadappcorp.org`,
      subject: `[ESCALATION] ${toRole.toUpperCase()} ← ${ctx.agentId} (${ctx.traceId ?? ctx.intentId})`,
      text: `Escalation to ${toRole}.\n\nSummary:\n${summary}\n\nEvidence:\n${JSON.stringify(ctx.input?.evidence ?? {}, null, 2)}\n\nIntent: ${ctx.intentId}`,
      fromAgent: ctx.agentId,
    });
    await writeStepAudit(ctx, "escalate.sent", `Escalation queued`, { toRole });
    return { ok: true, message: "Escalation queued" };
  },

  "WF-010": async (ctx) => {
    await writeStepAudit(ctx, "brief.collect", "Collecting reports from agents");
    // For now, a placeholder digest
    const digest = {
      date: new Date().toISOString(),
      highlights: [
        "Support inbox triage summary pending automation",
        "Engine smoke tests available via /v1/engine/run",
      ],
    };
    await writeStepAudit(ctx, "brief.compose", "Composed executive digest");
    await queueEmail(ctx, {
      to: `binky@deadappcorp.org`,
      subject: `[DAILY BRIEF] ${new Date().toISOString().slice(0,10)}`,
      text: `Daily Executive Brief\n\n${JSON.stringify(digest, null, 2)}\n\nTrace: ${ctx.traceId ?? ctx.intentId}`,
      fromAgent: "binky",
    });
    await writeStepAudit(ctx, "brief.queue", "Queued daily brief email");
    return { ok: true, message: "Daily brief queued", output: digest };
  },
};

export function getWorkflowHandler(workflowId: string): WorkflowHandler | null {
  return handlers[workflowId] ?? null;
}

export { writeStepAudit, queueEmail };
