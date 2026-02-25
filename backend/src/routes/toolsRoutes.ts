/**
 * toolsRoutes.ts
 *
 * /v1/tools/m365/* — M365 tool registry and controlled invocation endpoints.
 *
 * Architecture:
 *  - GET  /v1/tools/m365              → full tool catalog
 *  - GET  /v1/tools/m365/agent/:id    → tools available to a specific agent
 *  - GET  /v1/tools/m365/apps         → grouped by M365 app
 *  - POST /v1/tools/m365/invoke       → controlled invocation (Atlas-only for writes)
 *  - GET  /v1/tools/m365/status       → M365 Graph connection status for tenant
 *
 * Enforcement:
 *  - All invocations are logged to audit trail.
 *  - Write/send/manage tools require agentId = "atlas".
 *  - Human-approval tools create a Decision record before executing.
 *  - Spend = $0 enforced — any non-zero spend throws.
 *  - No outside action executes without Atlas or human-in-loop.
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { getSkill } from "../core/kb/skillLoader.js";
import {
  M365_TOOLS,
  getTool,
  getToolsByApp,
  validateToolInvocation,
  callGraph,
  type M365App,
} from "../lib/m365Tools.js";
import {
  AGENT_M365_PERMISSIONS,
  canAgentUseTool,
  getAgentM365Tools,
} from "../lib/m365ToolRegistry.js";

export const toolsRoutes: FastifyPluginAsync = async (app) => {
  const tenantId = (req: any): string | null =>
    (req as any).tenantId ?? null;

  // ── GET /v1/tools/m365 ──────────────────────────────────────────────────────
  // Full catalog of all defined M365 tools.
  app.get("/m365", async () => {
    return {
      ok: true,
      count: M365_TOOLS.length,
      tools: M365_TOOLS.map((t) => ({
        id: t.id,
        name: t.name,
        app: t.app,
        action: t.action,
        description: t.description,
        atlasOnly: t.atlasOnly,
        requiresHumanApproval: t.requiresHumanApproval,
        spendsUsd: 0,
        scopes: t.scopes,
        graphEndpoint: t.graphEndpoint,
        graphMethod: t.graphMethod,
      })),
    };
  });

  // ── GET /v1/tools/m365/apps ─────────────────────────────────────────────────
  // Tools grouped by M365 application.
  app.get("/m365/apps", async () => {
    const apps: M365App[] = [
      "outlook", "teams", "word", "excel", "powerpoint",
      "onenote", "onedrive", "sharepoint", "clipchamp",
      "admin", "forms", "planner", "bookings",
    ];
    const grouped: Record<string, any[]> = {};
    for (const a of apps) {
      grouped[a] = getToolsByApp(a).map((t) => ({
        id: t.id,
        name: t.name,
        action: t.action,
        atlasOnly: t.atlasOnly,
        requiresHumanApproval: t.requiresHumanApproval,
        description: t.description,
      }));
    }
    return { ok: true, apps: grouped };
  });

  // ── GET /v1/tools/m365/agent/:agentId ──────────────────────────────────────
  // Tools available to a specific agent.
  app.get("/m365/agent/:agentId", async (req) => {
    const { agentId } = (req.params as any);
    const allowed = getAgentM365Tools(String(agentId).toLowerCase());
    if (!allowed.length && !AGENT_M365_PERMISSIONS[String(agentId).toLowerCase()]) {
      return { ok: false, error: "UNKNOWN_AGENT" };
    }
    const tools = allowed.map((id) => {
      const t = getTool(id);
      if (!t) return null;
      return {
        id: t.id,
        name: t.name,
        app: t.app,
        action: t.action,
        atlasOnly: t.atlasOnly,
        requiresHumanApproval: t.requiresHumanApproval,
        description: t.description,
        scopes: t.scopes,
      };
    }).filter(Boolean);
    return { ok: true, agentId, toolCount: tools.length, tools };
  });

  // ── GET /v1/tools/m365/status ───────────────────────────────────────────────
  // Check whether the tenant has a Microsoft token connected.
  app.get("/m365/status", async (req) => {
    const tid = tenantId(req) ?? (req.query as any)?.tenantId;
    if (!tid) return { ok: false, error: "TENANT_REQUIRED" };

    // Check token_vault for a microsoft provider token
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("token_vault")
      .select("provider, expires_at, updated_at")
      .eq("org_id", tid)
      .in("provider", ["microsoft", "m365"])
      .limit(1)
      .single();

    return {
      ok: true,
      tenantId: tid,
      connected: !!data,
      provider: data?.provider ?? null,
      tokenExpiresAt: data?.expires_at ?? null,
      graphBase: "https://graph.microsoft.com/v1.0",
      portalUrl: "https://m365.cloud.microsoft",
      adminUrl: "https://admin.microsoft.com",
    };
  });

  // ── POST /v1/tools/m365/invoke ──────────────────────────────────────────────
  // Controlled M365 tool invocation.
  //
  // Body: { agentId, toolId, params? }
  //  - agentId: the agent requesting execution
  //  - toolId:  e.g. "m365.outlook.read"
  //  - params:  tool-specific parameters (endpoint overrides, body, etc.)
  //
  // Access token is fetched server-side from token_vault — never from the request body.
  // Write/send/admin tools are blocked unless agentId = "atlas".
  // Human-approval tools create a Decision record and return status=pending.
  app.post("/m365/invoke", async (req, reply) => {
    const tid = tenantId(req);
    const body = (req.body as any) ?? {};
    const { agentId, toolId, params } = body;

    if (!tid) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });
    if (!agentId || !toolId) {
      return reply.code(400).send({ ok: false, error: "MISSING_FIELDS", required: ["agentId", "toolId"] });
    }

    // Fetch Microsoft access token server-side from token_vault
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: vaultRow } = await supabase
      .from("token_vault")
      .select("access_token")
      .eq("org_id", tid)
      .in("provider", ["microsoft", "m365"])
      .limit(1)
      .single();

    if (!vaultRow?.access_token) {
      return reply.code(401).send({ ok: false, error: "M365_NOT_CONNECTED", message: "Microsoft not connected for this tenant" });
    }
    const accessToken = vaultRow.access_token;

    const normalizedAgent = String(agentId).toLowerCase();
    const tool = getTool(String(toolId));
    if (!tool) return reply.code(404).send({ ok: false, error: "UNKNOWN_TOOL" });

    // Permission check
    const check = validateToolInvocation(toolId, normalizedAgent, getAgentM365Tools(normalizedAgent));
    if (!check.ok) {
      await writeAudit(tid, normalizedAgent, toolId, "BLOCKED", check.reason);
      return reply.code(403).send({ ok: false, error: "PERMISSION_DENIED", reason: check.reason });
    }

    // Human approval tools → create DecisionMemo record, do not execute yet
    if (tool.requiresHumanApproval) {
      const memo = await prisma.decisionMemo.create({
        data: {
          tenantId: tid,
          summary: `M365 tool invocation: ${toolId} by agent ${normalizedAgent}`,
          decision: "PENDING",
          rationale: `Tool ${toolId} requires human approval before execution.`,
          agentId: normalizedAgent,
          metadata: { toolId, params: params ?? {} },
        } as any,
      }).catch(() => null);

      await writeAudit(tid, normalizedAgent, toolId, "PENDING_HUMAN_APPROVAL", null);
      return reply.code(202).send({
        ok: true,
        status: "pending_human_approval",
        memoId: (memo as any)?.id ?? null,
        message: `Tool ${toolId} requires human approval. A DecisionMemo has been created for Atlas/human review.`,
      });
    }

    // Execute the Graph API call
    try {
      // Build the endpoint — replace {id} placeholders with params if provided
      let endpoint = tool.graphEndpoint;
      if (params?.pathParams && typeof params.pathParams === "object") {
        for (const [k, v] of Object.entries(params.pathParams as Record<string, string>)) {
          endpoint = endpoint.replace(`{${k}}`, v);
        }
      }

      const result = await callGraph(
        String(accessToken),
        tool.graphMethod,
        endpoint,
        params?.body ?? undefined
      );

      await writeAudit(tid, normalizedAgent, toolId, "EXECUTED", null);
      return reply.send({ ok: true, toolId, result });

    } catch (err: any) {
      await writeAudit(tid, normalizedAgent, toolId, "FAILED", err?.message);
      return reply.code(500).send({ ok: false, error: "GRAPH_ERROR", message: err?.message });
    }
  });

  // ── GET /v1/tools/proposals ─────────────────────────────────────────────────
  // List tool proposals for this tenant (requires auth).
  app.get("/proposals", async (req, reply) => {
    const tid = tenantId(req);
    if (!tid) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });

    const status = (req.query as any)?.status ?? "pending";
    const rows = await prisma.toolProposal.findMany({
      where:   { tenantId: tid, ...(status !== "all" ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take:    100,
    });
    return { ok: true, count: rows.length, proposals: rows };
  });

  // ── GET /v1/tools/proposals/:token/approve ──────────────────────────────────
  // Token-based approval — safe to click directly from email.
  // No auth required (token is the secret). Returns HTML.
  app.get("/proposals/:token/approve", async (req, reply) => {
    const { token } = req.params as any;
    const proposal  = await prisma.toolProposal.findUnique({ where: { approvalToken: token } });

    if (!proposal) {
      return reply.code(404).type("text/html").send(htmlPage("Not Found", "This proposal link is invalid or has expired."));
    }
    if (proposal.status !== "pending") {
      return reply.type("text/html").send(htmlPage(
        "Already Decided",
        `This proposal was already <strong>${proposal.status}</strong> on ${proposal.decidedAt?.toLocaleDateString() ?? "unknown date"}.`,
      ));
    }

    // Mark approved
    await prisma.toolProposal.update({
      where: { approvalToken: token },
      data:  { status: "approved", decidedAt: new Date(), decidedBy: "billy" },
    });

    // Add to KB
    await addToolToKb(proposal.tenantId, proposal.agentId, proposal.toolName, proposal.toolPurpose, proposal.toolImpl);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: proposal.tenantId, actorType: "human", actorUserId: null,
        actorExternalId: "billy", level: "info", action: "TOOL_PROPOSAL_APPROVED",
        entityType: "tool_proposal", entityId: proposal.id,
        message: `Approved tool "${proposal.toolName}" for agent ${proposal.agentId}`,
        meta: { toolName: proposal.toolName, agentId: proposal.agentId },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.type("text/html").send(htmlPage(
      "✅ Tool Approved",
      `<strong>${proposal.toolName}</strong> for <strong>${proposal.agentId}</strong> has been approved.<br><br>
       The tool has been added to the Knowledge Base and is now available to ${proposal.agentId}.<br><br>
       <em>${proposal.toolPurpose}</em>`,
    ));
  });

  // ── GET /v1/tools/proposals/:token/deny ─────────────────────────────────────
  app.get("/proposals/:token/deny", async (req, reply) => {
    const { token } = req.params as any;
    const proposal  = await prisma.toolProposal.findUnique({ where: { approvalToken: token } });

    if (!proposal) {
      return reply.code(404).type("text/html").send(htmlPage("Not Found", "This proposal link is invalid or has expired."));
    }
    if (proposal.status !== "pending") {
      return reply.type("text/html").send(htmlPage(
        "Already Decided",
        `This proposal was already <strong>${proposal.status}</strong>.`,
      ));
    }

    await prisma.toolProposal.update({
      where: { approvalToken: token },
      data:  { status: "denied", decidedAt: new Date(), decidedBy: "billy" },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: proposal.tenantId, actorType: "human", actorUserId: null,
        actorExternalId: "billy", level: "info", action: "TOOL_PROPOSAL_DENIED",
        entityType: "tool_proposal", entityId: proposal.id,
        message: `Denied tool "${proposal.toolName}" for agent ${proposal.agentId}`,
        meta: { toolName: proposal.toolName, agentId: proposal.agentId },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.type("text/html").send(htmlPage(
      "❌ Tool Denied",
      `<strong>${proposal.toolName}</strong> for <strong>${proposal.agentId}</strong> has been denied. No changes were made.`,
    ));
  });

  // ── Helper: add approved tool as a KB document ──────────────────────────────
  async function addToolToKb(
    tenantId: string,
    agentId:  string,
    toolName: string,
    purpose:  string,
    impl:     string | null,
  ) {
    const slug  = `tool-${agentId}-${toolName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
    const title = `Tool: ${toolName} (${agentId})`;
    const body  = [
      `# ${toolName}`,
      `**Agent:** ${agentId}`,
      `**Status:** Approved`,
      `**Purpose:** ${purpose}`,
      impl ? `**Implementation:** ${impl}` : "",
      "",
      `## Usage`,
      `This tool was approved via WF-107 Atlas Tool Discovery and is available to ${agentId}.`,
      `When ${agentId} receives a query that requires ${toolName}, this tool should be invoked.`,
      "",
      `## Integration`,
      `Add this tool to the agent's toolsAllowed list in registry.ts and implement the`,
      `server-side function in agentTools.ts following the existing pattern.`,
    ].filter(s => s !== null).join("\n");

    // Upsert KB doc
    const existing = await prisma.kbDocument.findFirst({ where: { tenantId, slug } });
    if (existing) {
      await prisma.kbDocument.update({ where: { id: existing.id }, data: { body, updatedAt: new Date() } });
    } else {
      await prisma.kbDocument.create({
        data: {
          tenantId,
          slug,
          title,
          body,
          category: "tool",
          tags: ["tool", "approved", agentId],
          sourceType: "atlas_generated",
          agentId,
        } as any,
      });
    }
  }

  // ── Helper: HTML response page ──────────────────────────────────────────────
  function htmlPage(title: string, body: string): string {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Atlas UX</title>
<style>
  body{font-family:system-ui,sans-serif;background:#04111f;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#0d1f38;border:1px solid rgba(255,255,255,.12);border-radius:1.5rem;padding:2.5rem;max-width:480px;text-align:center}
  h1{font-size:1.5rem;margin:0 0 1rem}
  p{color:#94a3b8;line-height:1.6}
  .logo{font-size:.75rem;color:#475569;margin-top:2rem}
</style>
</head><body>
<div class="card">
  <h1>${title}</h1>
  <p>${body}</p>
  <div class="logo">Atlas UX · Tool Proposal System · WF-107</div>
</div>
</body></html>`;
  }

  // ── Helper: write audit entry ───────────────────────────────────────────────
  async function writeAudit(
    tid: string,
    agentId: string,
    toolId: string,
    status: string,
    reason: string | null
  ) {
    await prisma.auditLog.create({
      data: {
        tenantId: tid,
        actorType: "system",
        actorUserId: null,
        actorExternalId: agentId,
        level: status === "BLOCKED" || status === "FAILED" ? "warn" : "info",
        action: `M365_TOOL_${status}`,
        entityType: "m365_tool",
        entityId: toolId,
        message: `Agent ${agentId} ${status.toLowerCase()} tool ${toolId}${reason ? `: ${reason}` : ""}`,
        meta: { toolId, agentId, status, reason },
        timestamp: new Date(),
      },
    } as any).catch(() => null); // non-fatal
  }
};
