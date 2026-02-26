import type { FastifyPluginAsync } from "fastify";
import { runChat } from "../ai.js";
import { sglEvaluate } from "../core/sgl.js";
import { prisma } from "../db/prisma.js";
import { getKbContext } from "../core/kb/getKbContext.js";
import { getKbPack } from "../core/kb/kbCache.js";
import { getSkillBlock, loadAllSkills } from "../core/kb/skillLoader.js";
import { classifyQuery } from "../core/kb/queryClassifier.js";
import { resolveAgentTools } from "../core/agent/agentTools.js";
import { agentRegistry } from "../agents/registry.js";
import { meterTokens } from "../lib/usageMeter.js";
import { enforceTokenBudget } from "../lib/seatEnforcement.js";
import { runDeepAgent } from "../core/agent/deepAgentPipeline.js";

// Load all SKILL.md files into memory at module init (runs once at server boot).
loadAllSkills();

const MAX_DOC_CHARS = 12_000;
const BUDGET_CHARS  = 60_000;

/** Trim a string of KB docs to a char budget, preserving doc boundaries. */
function packDocs(
  docs: Array<{ slug: string; title: string; body: string }>,
  source: string,
  budget: number,
): string {
  let used = 0;
  const parts: string[] = [];
  for (const d of docs) {
    if (used >= budget) break;
    const header = `\n\n[KB:${source}] ${d.title}\nslug: ${d.slug}\n---\n`;
    const body   = (d.body ?? "").slice(0, Math.min(MAX_DOC_CHARS, budget - used));
    if (!body.trim()) continue;
    const block = header + body;
    parts.push(block);
    used += block.length;
  }
  return parts.join("");
}

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId   = (req as any).auth?.userId as string;
    const body     = req.body as any;

    // ── Seat limit enforcement ──────────────────────────────────────────────
    if (userId && tenantId) {
      const budget = await enforceTokenBudget(userId, tenantId);
      if (!budget.allowed) {
        return reply.code(429).send({ ok: false, error: budget.reason });
      }
    }

    // ── SGL gate ──────────────────────────────────────────────────────────────
    const intent = {
      tenantId,
      actor:     "ATLAS" as const,
      type:      "CHAT_CALL",
      payload:   { provider: body?.provider, model: body?.model },
      dataClass: "NONE" as const,
      spendUsd:  0,
    };

    const sgl = sglEvaluate(intent);

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId:     null,
        actorExternalId: String(userId ?? ""),
        actorType:       "system",
        level:    sgl.decision === "BLOCK"  ? "security" :
                  sgl.decision === "REVIEW" ? "warn"     : "info",
        action:      "SGL_EVALUATED",
        entityType:  "intent",
        entityId:    null,
        message:     `SGL ${sgl.decision} for CHAT_CALL`,
        meta:        { sgl, intentType: intent.type },
        timestamp:   new Date(),
      },
    });

    if (sgl.decision === "BLOCK") {
      return reply.code(403).send({ ok: false, error: "sgl_block", reasons: sgl.reasons });
    }
    if (sgl.decision === "REVIEW") {
      return reply.code(428).send({ ok: false, error: "human_approval_required", reasons: sgl.reasons });
    }

    // ── Build enriched system prompt (tiered) ────────────────────────────────
    let enrichedBody = body;

    if (tenantId) {
      try {
        const msgs: any[] = Array.isArray(body?.messages) ? [...body.messages] : [];
        const agentId     = String(body?.agentId || "atlas").toLowerCase();

        // Extract last user message for query classification
        const lastUser = [...msgs].reverse().find((m: any) => m.role === "user");
        const rawQuery = typeof lastUser?.content === "string" ? lastUser.content : "";
        const query    = rawQuery.slice(0, 200);

        // ── TIER CLASSIFICATION ───────────────────────────────────────────────
        const { tier, reason } = classifyQuery(query);

        const contextParts: string[] = [];

        // Always: Atlas identity + role
        contextParts.push(
          `[ATLAS CONTEXT] You are Atlas, the AI President of this company. ` +
          `You operate within a structured agent hierarchy and execute only after governance gates approve.`
        );

        // Always: SKILL.md (Tier 1 — filesystem, 0ms, no DB)
        const skillBlock = getSkillBlock(agentId);
        if (skillBlock) {
          contextParts.push(skillBlock);
        }

        // Always: connected integrations (cheap query, one row)
        const connectedIntegrations = await prisma.integration.findMany({
          where:  { tenantId, connected: true },
          select: { provider: true },
        });
        const providerNames = connectedIntegrations.map((i: any) => i.provider).join(", ");
        if (providerNames) {
          contextParts.push(
            `[INTEGRATIONS] Connected: ${providerNames}. ` +
            `You can listen, analyze, and post on behalf of the user on these platforms.`
          );
        }

        // Always: agent registry (compact, in-memory)
        const registrySummary = agentRegistry
          .map(a => `  ${a.name} (${a.id}) — ${a.title}: ${a.summary}`)
          .join("\n");
        contextParts.push(`[AGENT REGISTRY]\n${registrySummary}`);

        // ── Live agent tool results (subscription, team, KB search) ──────────
        // Runs before tier KB loading so account data is always available.
        // Only fires when the query pattern matches — no-op for most requests.
        const toolContext = await resolveAgentTools(tenantId, rawQuery, agentId).catch(() => "");
        if (toolContext) {
          contextParts.push(toolContext);
        }

        // ── KB loading based on tier ──────────────────────────────────────────
        if (tier === "SKILL_ONLY") {
          // SKILL.md already injected above — that's all we need
          // Log for observability
          console.log(`[chat] tier=SKILL_ONLY agent=${agentId} reason="${reason}"`);

        } else if (tier === "DIRECT") {
          // Pure task — no KB context needed at all
          console.log(`[chat] tier=DIRECT agent=${agentId} reason="${reason}"`);

        } else if (tier === "HOT_CACHE") {
          // Governance + agent docs from memory cache (Tier 2 — no full RAG)
          const pack = await getKbPack(tenantId, agentId);
          const budget = BUDGET_CHARS - contextParts.join("").length;
          const kbText = packDocs(
            [...pack.governance, ...pack.agentDocs],
            "CACHE",
            Math.max(budget, 0),
          );
          if (kbText) {
            contextParts.push(
              `[KNOWLEDGE BASE — cached, ${pack.governance.length + pack.agentDocs.length} docs]\n${kbText}`
            );
          }
          console.log(`[chat] tier=HOT_CACHE agent=${agentId} docs=${pack.governance.length + pack.agentDocs.length}`);

        } else {
          // FULL_RAG — novel or complex question, go to DB + relevant search (Tier 3)
          const kb = await getKbContext({ tenantId, agentId, query }).catch(() => null);
          if (kb?.text) {
            contextParts.push(
              `[KNOWLEDGE BASE — ${kb.items.length} docs, ${kb.totalChars} chars]\n${kb.text}`
            );
          }
          console.log(`[chat] tier=FULL_RAG agent=${agentId} kbItems=${kb?.items.length ?? 0} reason="${reason}"`);
        }

        // Assemble system block
        const systemBlock = contextParts.join("\n\n");

        const sysIdx = msgs.findIndex((m: any) => m.role === "system");
        if (sysIdx >= 0) {
          msgs[sysIdx] = { ...msgs[sysIdx], content: `${systemBlock}\n\n${msgs[sysIdx].content}` };
        } else {
          msgs.unshift({ role: "system", content: systemBlock });
        }

        enrichedBody = { ...body, messages: msgs };

        // ── Deep agent pipeline (plan → execute → verify + Postgres memory) ──
        // Activated when the agent has deepMode: true in the registry.
        // Falls back to standard runChat if the pipeline fails.
        const agentDef = agentRegistry.find(a => a.id === agentId);
        if (agentDef?.deepMode) {
          const sessionId = String(
            body?.sessionId ||
            `${tenantId}:${agentId}:${new Date().toISOString().slice(0, 10)}`
          );
          try {
            const deepResponse = await runDeepAgent({
              tenantId,
              agentId,
              agentName:  agentDef.name,
              agentTitle: agentDef.title,
              sessionId,
              rawQuery,
              provider: body?.provider,
              model:    body?.model,
              messages: msgs,
            });
            if (deepResponse) {
              console.log(`[chat] deep-agent ${agentId} pipeline complete (${deepResponse.length} chars)`);
              return reply.send({ provider: "deep-agent", content: deepResponse });
            }
          } catch (err) {
            console.error(`[chat] deep-agent ${agentId} pipeline failed, falling back:`, err);
          }
        }
      } catch {
        // Non-fatal — proceed without context injection
      }
    }

    const result = await runChat(enrichedBody, process.env as any);

    // Phase 2: meter token usage (fire-and-forget)
    if (userId && tenantId) {
      const tokens = (result as any)?.usage?.total_tokens ?? (result as any)?.usage?.prompt_tokens ?? 500;
      meterTokens(userId, tenantId, tokens);
    }

    return reply.send(result);
  });
};
