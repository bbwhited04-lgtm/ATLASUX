import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { runGrowthLoop } from "../services/growthLoop.js";

const GrowthRunSchema = z.object({
  agent:          z.string().min(1).max(100).default("atlas"),
  proposedAction: z.unknown().optional(),
});

export const growthRoutes: FastifyPluginAsync = async (app) => {
  // Manually trigger the daily growth loop (cron can hit this)
  app.post("/run", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    let body: z.infer<typeof GrowthRunSchema>;
    try { body = GrowthRunSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: body.agent,
        level: "info",
        action: "GROWTH_LOOP_TRIGGERED",
        entityType: "growth_run",
        entityId: null,
        message: `Growth loop triggered by agent ${body.agent}`,
        meta: { agent: body.agent, hasProposedAction: body.proposedAction != null },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    const res = await runGrowthLoop({ tenantId, agent: body.agent, proposedAction: body.proposedAction as any });
    return reply.send(res);
  });
};
