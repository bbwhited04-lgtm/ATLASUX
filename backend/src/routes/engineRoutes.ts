import type { FastifyPluginAsync } from "fastify";
import { engineTick } from "../core/engine/engine.js";
import { prisma } from "../prisma.js";

type EngineRunRequest = {
  tenantId: string;
  agentId: string;
  workflowId: string;
  input?: unknown;
  traceId?: string;
  // dev helper: run one tick immediately (not for production scheduling)
  runTickNow?: boolean;
};

export const engineRoutes: FastifyPluginAsync = async (app) => {
  // Manual tick (dev/ops)
  app.post("/tick", async (_req, reply) => {
    const result = await engineTick();
    return reply.send(result);
  });

  // Cloud-surface: request an engine run (creates an Intent)
  app.post("/run", async (req, reply) => {
    const body = (req.body ?? {}) as Partial<EngineRunRequest>;
    if (!body.tenantId || !body.agentId || !body.workflowId) {
      return reply.code(400).send({ ok: false, error: "tenantId, agentId, workflowId are required" });
    }

    const intent = await prisma.intent.create({
      data: {
        tenantId: body.tenantId,
        // NOTE: schema/table has no createdBy. We store requestor in agentId + payload.
        agentId: (req as any).user?.id ?? null,
        intentType: "ENGINE_RUN",
        payload: {
          agentId: body.agentId,
          workflowId: body.workflowId,
          input: body.input ?? {},
          traceId: body.traceId ?? null,
          requestedBy: (req as any).user?.id ?? body.tenantId,
        },
        status: "DRAFT",
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: body.tenantId,
        actorUserId: (req as any).user?.id ?? body.tenantId,
        actorType: "user",
        level: "info",
        action: "ENGINE_RUN_REQUESTED",
        entityType: "intent",
        entityId: intent.id,
        message: `Engine run requested (${body.workflowId}) by ${body.agentId}`,
        meta: { workflowId: body.workflowId, agentId: body.agentId, traceId: body.traceId ?? null },
        timestamp: new Date(),
      },
    });

    // Optional: run one tick immediately (useful for smoke testing)
    let tickResult: any = null;
    if (body.runTickNow) {
      tickResult = await engineTick();
    }

    return reply.send({ ok: true, intentId: intent.id, tickResult });
  });

  // Fetch run status + related audit events
  app.get("/runs/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const intent = await prisma.intent.findUnique({ where: { id } });
    if (!intent) return reply.code(404).send({ ok: false, error: "not found" });

    const audits = await prisma.auditLog.findMany({
      where: { entityType: "intent", entityId: id },
      orderBy: { timestamp: "asc" },
      take: 200,
    });

    return reply.send({ ok: true, intent, audits });
  });
};
