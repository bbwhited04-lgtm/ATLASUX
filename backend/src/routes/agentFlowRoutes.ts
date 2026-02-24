/**
 * agentFlowRoutes.ts
 *
 * Implements the Atlas → M365 → Binky research flow per AGENTS.md / ATLAS_POLICY.md.
 *
 * Constitutional contract:
 *   - Atlas dispatches tasks to M365 agents (PETRA, PORTER, CLAIRE, VICTOR, FRANK, SANDY)
 *   - M365 agents return structured output
 *   - Atlas forwards output to Binky's research queue
 *   - Binky reads queue and incorporates into daily master summary
 *   - Every step writes an AuditLog (Audit Is Mandatory)
 *
 * Routes:
 *   POST /v1/agent-flow/atlas/forward-to-binky   Atlas queues M365 result for Binky
 *   GET  /v1/agent-flow/binky/research-queue      Binky pulls pending M365 research items
 *   POST /v1/agent-flow/binky/research-queue/:id/ack   Binky acknowledges (marks processed)
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

// M365 agents that may source data into Binky's research queue
const M365_AGENTS = new Set(["petra", "porter", "claire", "victor", "frank", "sandy"]);

export const agentFlowRoutes: FastifyPluginAsync = async (app) => {

  /**
   * POST /v1/agent-flow/atlas/forward-to-binky
   *
   * Atlas calls this after receiving an M365 tool result it wants Binky to
   * use as a research input. The item is queued in agent_inbox_events with
   * agent_key = "binky" and provider = "m365_research".
   *
   * Body: {
   *   tenantId: string
   *   sourceAgent: "petra" | "porter" | "claire" | "victor" | "frank" | "sandy"
   *   toolId: string         e.g. "m365.planner.tasks.list"
   *   subject: string        human-readable summary
   *   bodyText: string       structured text content for Binky
   *   metadata?: object      any extra context (graph response, etc.)
   * }
   */
  app.post("/atlas/forward-to-binky", async (req, reply) => {
    const body  = (req.body as any) ?? {};
    const tid   = String((req as any).tenantId ?? body.tenantId ?? "").trim();

    if (!tid) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const sourceAgent = String(body.sourceAgent ?? "").toLowerCase();
    if (!M365_AGENTS.has(sourceAgent)) {
      return reply.code(400).send({
        ok: false,
        error: "invalid_source_agent",
        allowed: [...M365_AGENTS],
      });
    }

    const subject  = String(body.subject  ?? "M365 research input").trim();
    const bodyText = String(body.bodyText ?? "").trim();
    const toolId   = String(body.toolId   ?? "").trim();

    // Queue the item for Binky using agent_inbox_events
    const event = await prisma.agent_inbox_events.create({
      data: {
        tenant_id:  tid,
        agent_key:  "binky",
        inbox_email: "binky.cro@deadapp.info",
        provider:   "m365_research",
        from_email: `${sourceAgent}@atlas-internal`,
        from_name:  sourceAgent.toUpperCase(),
        subject,
        body_text:  bodyText,
        status:     "new",
        metadata:   {
          sourceAgent,
          toolId,
          queuedBy: "atlas",
          ...(body.metadata ?? {}),
        },
      },
    });

    // Audit (mandatory per ATLAS_POLICY.md §I.1)
    try {
      await (prisma.auditLog as any).create({
        data: {
          actorType:      "system",
          actorUserId:    null,
          actorExternalId: null,
          level:          "info" as any,
          action:         "agent_flow.atlas.forward_to_binky",
          status:         "SUCCESS",
          metadata: {
            source:      "agent_flow",
            sourceAgent,
            toolId,
            eventId:     event.id,
            tenantId:    tid,
          },
        } as any,
      });
    } catch {
      // Non-fatal per ATLAS_POLICY.md §III (audit must not abort transaction)
    }

    return reply.send({
      ok:      true,
      eventId: event.id,
      queue:   "binky.m365_research",
      message: `Queued ${sourceAgent.toUpperCase()} output for Binky`,
    });
  });

  /**
   * GET /v1/agent-flow/binky/research-queue
   *
   * Binky polls for pending M365 research items.
   * Returns items with status = "new" ordered by oldest first.
   * Query: { tenantId, limit? }
   */
  app.get("/binky/research-queue", async (req, reply) => {
    const q   = (req.query as any) ?? {};
    const tid = String((req as any).tenantId ?? q.tenantId ?? "").trim();

    if (!tid) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const limit = Math.min(Number(q.limit ?? 50), 100);

    const items = await prisma.agent_inbox_events.findMany({
      where: {
        tenant_id: tid,
        agent_key: "binky",
        provider:  "m365_research",
        status:    "new",
      },
      orderBy: { created_at: "asc" },
      take:    limit,
    });

    return reply.send({
      ok:    true,
      queue: "binky.m365_research",
      count: items.length,
      items: items.map((e) => ({
        id:          e.id,
        sourceAgent: (e.metadata as any)?.sourceAgent ?? "unknown",
        toolId:      (e.metadata as any)?.toolId      ?? "",
        subject:     e.subject,
        bodyText:    e.body_text,
        receivedAt:  e.received_at,
        metadata:    e.metadata,
      })),
    });
  });

  /**
   * POST /v1/agent-flow/binky/research-queue/:id/ack
   *
   * Binky acknowledges a research item after incorporating it into
   * its daily master summary. Marks status = "processed".
   */
  app.post("/binky/research-queue/:id/ack", async (req, reply) => {
    const { id } = req.params as { id: string };
    const tid    = String((req as any).tenantId ?? (req.body as any)?.tenantId ?? "").trim();

    if (!tid) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const updated = await prisma.agent_inbox_events.updateMany({
      where:  { id, tenant_id: tid, agent_key: "binky" },
      data:   { status: "processed" },
    });

    if (updated.count === 0) {
      return reply.code(404).send({ ok: false, error: "event_not_found" });
    }

    return reply.send({ ok: true, id, status: "processed" });
  });
};
