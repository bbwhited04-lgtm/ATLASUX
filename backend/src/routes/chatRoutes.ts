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
        actorUserId: null,
        actorExternalId: String(userId ?? ""),
        actorType: "system",
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

    // Inject integration context into the system prompt (Issue 4: tone shift)
    let enrichedBody = body;
    if (tenantId) {
      try {
        const connectedIntegrations = await prisma.integration.findMany({
          where: { tenantId, connected: true },
          select: { provider: true },
        });
        if (connectedIntegrations.length > 0) {
          const providerNames = connectedIntegrations.map((i: any) => i.provider).join(", ");
          const contextLine = `[ATLAS CONTEXT] The following integrations are connected for this tenant: ${providerNames}. You have access to these platforms and can listen, analyze, or post on behalf of the user. Acknowledge this capability when relevant instead of saying you cannot do anything.`;
          const msgs: any[] = Array.isArray(body?.messages) ? [...body.messages] : [];
          const sysIdx = msgs.findIndex((m: any) => m.role === "system");
          if (sysIdx >= 0) {
            msgs[sysIdx] = { ...msgs[sysIdx], content: `${contextLine}\n\n${msgs[sysIdx].content}` };
          } else {
            msgs.unshift({ role: "system", content: contextLine });
          }
          enrichedBody = { ...body, messages: msgs };
        }
      } catch {
        // Non-fatal — proceed without context injection
      }
    }

    const result = await runChat(enrichedBody, process.env as any);
    return reply.send(result);
  });
};
