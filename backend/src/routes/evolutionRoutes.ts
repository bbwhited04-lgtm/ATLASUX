import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withTenant } from "../db/prisma.js";
import {
  listAgentNames,
  getEvolutionHistory,
  getCurrentVersion,
  getBehavior,
  applyBehaviorChange,
  revertEvolution,
  getActiveTrials,
  getAllAgentStatus,
  getAgentFile,
  type EvolutionFileType,
} from "../services/evolutionService.js";

const BehaviorChangeSchema = z.object({
  change: z.string().min(1).max(5000),
  source: z.string().min(1).max(200).default("Billy directive"),
});

const VALID_FILE_TYPES = ["SOUL.md", "SKILL.md", "POLICY.md", "behavior.md"] as const;

export const evolutionRoutes: FastifyPluginAsync = async (app) => {

  // List all agents with evolution status
  app.get("/agents", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const agents = await getAllAgentStatus(tenantId);
    return reply.send({ ok: true, agents });
  });

  // Full evolution history for an agent
  app.get("/agents/:name/history", async (req, reply) => {
    const name = String((req.params as any).name ?? "");
    try {
      const history = getEvolutionHistory(name);
      return reply.send({ ok: true, agent: name, version: getCurrentVersion(name), history });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // Current file contents + version for an agent
  app.get("/agents/:name/current", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const name = String((req.params as any).name ?? "");
    const fileType = String((req.query as any).file ?? "SKILL.md");

    if (!VALID_FILE_TYPES.includes(fileType as any)) {
      return reply.code(400).send({ ok: false, error: `Invalid file type. Must be one of: ${VALID_FILE_TYPES.join(", ")}` });
    }

    try {
      const result = await getAgentFile(tenantId, name, fileType as EvolutionFileType);
      return reply.send({
        ok: true,
        agent: name,
        file: fileType,
        version: getCurrentVersion(name),
        source: result.source,
        content: result.content,
      });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // Apply user-directed behavior change
  app.post("/agents/:name/behavior", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const role = (req as any).tenantRole as string | undefined;
    if (role !== "owner" && role !== "admin") {
      return reply.code(403).send({ ok: false, error: "INSUFFICIENT_ROLE" });
    }

    const name = String((req.params as any).name ?? "");

    let body: z.infer<typeof BehaviorChangeSchema>;
    try { body = BehaviorChangeSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    try {
      applyBehaviorChange(name, body.change, body.source);

      const actorUserId = (req as any).auth?.userId ?? null;
      await withTenant(tenantId, async (tx) =>
        tx.auditLog.create({
          data: {
            tenantId,
            actorType: "human",
            actorUserId,
            actorExternalId: null,
            level: "info",
            action: "EVOLUTION_BEHAVIOR_CHANGE",
            entityType: "agent",
            entityId: name,
            message: `Behavior change applied to ${name}: ${body.change.split("\n")[0].slice(0, 100)}`,
            meta: { agent: name, source: body.source },
            timestamp: new Date(),
          },
        } as any)
      ).catch(() => null);

      return reply.send({ ok: true, agent: name, version: getCurrentVersion(name) });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // Manual revert to a specific version
  app.post("/agents/:name/revert/:memoId", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const role = (req as any).tenantRole as string | undefined;
    if (role !== "owner" && role !== "admin") {
      return reply.code(403).send({ ok: false, error: "INSUFFICIENT_ROLE" });
    }

    const name = String((req.params as any).name ?? "");
    const memoId = String((req.params as any).memoId ?? "");
    const reason = String((req.body as any)?.reason ?? "Manual revert by admin");

    try {
      const result = await revertEvolution(tenantId, name, memoId, reason);
      if (!result.ok) return reply.code(400).send(result);

      const actorUserId = (req as any).auth?.userId ?? null;
      await withTenant(tenantId, async (tx) =>
        tx.auditLog.create({
          data: {
            tenantId,
            actorType: "human",
            actorUserId,
            actorExternalId: null,
            level: "warn",
            action: "EVOLUTION_MANUAL_REVERT",
            entityType: "agent",
            entityId: name,
            message: `Manual revert for ${name}: ${reason}`,
            meta: { agent: name, memoId, reason },
            timestamp: new Date(),
          },
        } as any)
      ).catch(() => null);

      return reply.send({ ok: true, agent: name, version: getCurrentVersion(name) });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // List all active trials
  app.get("/trials", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const trials = await getActiveTrials(tenantId);
    return reply.send({ ok: true, trials });
  });

  // Get active trial status for specific agent
  app.get("/trials/:name", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const name = String((req.params as any).name ?? "");
    const trials = await getActiveTrials(tenantId);
    const trial = trials.find(t => t.agentName.toLowerCase() === name.toLowerCase());

    if (!trial) return reply.send({ ok: true, agent: name, trial: null });
    return reply.send({ ok: true, agent: name, trial });
  });
};
