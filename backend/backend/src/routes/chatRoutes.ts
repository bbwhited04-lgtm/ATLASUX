import type { FastifyPluginAsync } from "fastify";
import { runChat } from "../ai.js";
import { sglEvaluate } from "../core/sgl.js";
import { prisma } from "../db/prisma.js";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;

    const body = req.body as any;

    const intent = {
      tenantId,
      actor: "ATLAS" as const,
      type: "CHAT_CALL",
      payload: { provider: body?.provider, model: body?.model },
      dataClass: "NONE" as const,
      spendUsd: 0,
    };

    const sgl = sglEvaluate(intent);

    // Audit the decision immediately (cause → effect)
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        actorType: "user",
        level: sgl.decision === "BLOCK" ? "security" : sgl.decision === "REVIEW" ? "warn" : "info",
        action: "SGL_EVALUATED",
        entityType: "intent",
        entityId: null,
        message: `SGL ${sgl.decision} for CHAT_CALL`,
        meta: { sgl, intentType: intent.type },
        timestamp: new Date(),
      },
    });

    if (sgl.decision === "BLOCK") {
      return reply.code(403).send({ ok: false, error: "sgl_block", reasons: sgl.reasons });
    }

    if (sgl.decision === "REVIEW") {
      return reply.code(428).send({ ok: false, error: "human_approval_required", reasons: sgl.reasons });
    }

    const result = await runChat(body, process.env as any);
    return reply.send(result);
  });
};
