import type { FastifyPluginAsync } from "fastify";
import { runChat } from "../ai.js";
import { sglEvaluate } from "../core/sgl.js";
import { prisma } from "../db/prisma.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import { agentRegistry } from "../agents/registry.js";

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

    // Build enriched system prompt from: KB context + agent registry + integrations
    let enrichedBody = body;
    if (tenantId) {
      try {
        const msgs: any[] = Array.isArray(body?.messages) ? [...body.messages] : [];

        // Extract last user message as KB query
        const lastUser = [...msgs].reverse().find((m: any) => m.role === "user");
        const query = typeof lastUser?.content === "string" ? lastUser.content.slice(0, 200) : undefined;

        // Determine active agent (default: atlas)
        const agentId = String(body?.agentId || "atlas").toLowerCase();

        // 1) KB context (governance docs + agent docs + relevant docs for query)
        const kb = await getKbContext({ tenantId, agentId, query }).catch(() => null);

        // 2) Agent registry — compact org chart Atlas uses to route tasks
        const registrySummary = agentRegistry
          .map(a => `  ${a.name} (${a.id}) — ${a.title}: ${a.summary}`)
          .join("\n");

        // 3) Connected integrations
        const connectedIntegrations = await prisma.integration.findMany({
          where: { tenantId, connected: true },
          select: { provider: true },
        });
        const providerNames = connectedIntegrations.map((i: any) => i.provider).join(", ");

        const contextParts: string[] = [];

        contextParts.push(
          `[ATLAS CONTEXT] You are Atlas, the AI President of this company. ` +
          `You operate within a structured agent hierarchy and execute only after governance gates approve.`
        );

        if (providerNames) {
          contextParts.push(
            `[INTEGRATIONS] Connected platforms: ${providerNames}. ` +
            `You have access to these and can listen, analyze, or post on behalf of the user.`
          );
        }

        contextParts.push(
          `[AGENT REGISTRY]\n${registrySummary}`
        );

        if (kb && kb.text) {
          contextParts.push(`[KNOWLEDGE BASE — ${kb.items.length} docs, ${kb.totalChars} chars]\n${kb.text}`);
        }

        const systemBlock = contextParts.join("\n\n");

        const sysIdx = msgs.findIndex((m: any) => m.role === "system");
        if (sysIdx >= 0) {
          msgs[sysIdx] = { ...msgs[sysIdx], content: `${systemBlock}\n\n${msgs[sysIdx].content}` };
        } else {
          msgs.unshift({ role: "system", content: systemBlock });
        }

        enrichedBody = { ...body, messages: msgs };
      } catch {
        // Non-fatal — proceed without context injection
      }
    }

    const result = await runChat(enrichedBody, process.env as any);
    return reply.send(result);
  });
};
