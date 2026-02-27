/**
 * Deep Agent Pipeline — 3-stage execution matching n8n CSS agent architecture.
 *
 * Stage 1: Planning sub-agent
 *   Fast model call. Given the user query + conversation memory, produces a
 *   3–5 bullet execution plan. Injected into the main execution context.
 *
 * Stage 2: Main execution (standard chat call)
 *   Full context: system block (SKILL.md + KB + tool results) + plan + memory.
 *   Uses the same provider/model the user/agent requested.
 *
 * Stage 3: Verification sub-agent
 *   Reviews the draft for factual accuracy, policy compliance, and completeness.
 *   Returns APPROVED or a REVISED version. Non-fatal if it fails.
 *
 * Stage 4: Memory persistence
 *   Appends the user query + final response to Postgres. Prunes old turns.
 *
 * Activation: set deepMode: true on an agent in registry.ts.
 * Fallback: if any stage fails, the pipeline falls back gracefully to the
 *   draft from Stage 2 (or an empty string if Stage 2 also fails).
 */

import { runLLM }                          from "../engine/brainllm.js";
import { runChat }                         from "../../ai.js";
import { appendMemory, getMemory, pruneMemory } from "./agentMemory.js";

// ── Prompt templates ─────────────────────────────────────────────────────────

const PLAN_SYSTEM = (agentName: string, agentTitle: string) =>
  `You are the Planning sub-agent for ${agentName} (${agentTitle}).
Given the user's query and recent conversation history, produce a concise execution plan for ${agentName} to follow when formulating the response.
Return ONLY 3–5 bullet points. No preamble. No headers.`;

const VERIFY_SYSTEM = (agentName: string) =>
  `You are the Verification sub-agent for ${agentName}.
Review the draft response for:
1. Factual accuracy — no hallucination, no invented data
2. Policy compliance — consistent with the agent's role and guidelines
3. Completeness — fully addresses the original query

If the response passes all checks, reply:
APPROVED
[response unchanged]

If it needs correction, reply:
REVISED
[corrected version only — no commentary outside this block]`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeepAgentParams {
  tenantId:   string;
  agentId:    string;
  agentName:  string;
  agentTitle: string;
  sessionId:  string;
  rawQuery:   string;
  provider?:  string;
  model?:     string;
  messages:   any[]; // already system-enriched messages from chatRoutes
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export async function runDeepAgent(params: DeepAgentParams): Promise<string> {
  const {
    tenantId, agentId, agentName, agentTitle,
    sessionId, rawQuery, provider, model, messages,
  } = params;

  const runId = `deep-${agentId}-${Date.now()}`;

  // ── Stage 1: Retrieve Postgres memory ──────────────────────────────────────
  const memory = await getMemory(tenantId, agentId, sessionId).catch(() => []);

  let memoryBlock = "";
  if (memory.length > 0) {
    const turns = memory
      .map(m => `${m.role === "user" ? "User" : agentName}: ${m.content}`)
      .join("\n");
    memoryBlock = `[CONVERSATION MEMORY — last ${memory.length} turns]\n${turns}`;
  }

  // ── Stage 2: Planning sub-agent ─────────────────────────────────────────────
  let plan = "";
  try {
    const planMsgs: any[] = [
      { role: "system", content: PLAN_SYSTEM(agentName, agentTitle) },
    ];
    if (memoryBlock) planMsgs.push({ role: "user", content: memoryBlock });
    planMsgs.push({ role: "user", content: rawQuery });

    const planResp = await runLLM({
      runId,
      agent:           `${agentId}-planner`,
      purpose:         "execution-planning",
      route:           "CLASSIFY_EXTRACT_VALIDATE",
      messages:        planMsgs,
      maxOutputTokens: 300,
      temperature:     0.3,
    });
    plan = planResp.text.trim();
    console.log(`[deep-agent] ${agentId} plan generated (${plan.length} chars)`);
  } catch (err) {
    console.warn(`[deep-agent] ${agentId} planning failed (non-fatal):`, err);
  }

  // ── Stage 3: Main execution ─────────────────────────────────────────────────
  // Inject memory + plan into the system message of the already-enriched messages.
  const augmentedMsgs = [...messages];
  const extras: string[] = [];
  if (memoryBlock) extras.push(memoryBlock);
  if (plan)        extras.push(`[EXECUTION PLAN — follow this approach]\n${plan}`);

  if (extras.length > 0) {
    const extra   = extras.join("\n\n");
    const sysIdx  = augmentedMsgs.findIndex((m: any) => m.role === "system");
    if (sysIdx >= 0) {
      augmentedMsgs[sysIdx] = {
        ...augmentedMsgs[sysIdx],
        content: `${augmentedMsgs[sysIdx].content}\n\n${extra}`,
      };
    }
  }

  let draft = "";
  try {
    const chatResult = await runChat(
      { provider: provider || "openai", model, messages: augmentedMsgs },
      process.env,
    );
    draft = chatResult?.content ?? "";
  } catch (err) {
    console.error(`[deep-agent] ${agentId} main execution failed:`, err);
    return ""; // pipeline failure — caller falls back to standard runChat
  }

  // ── Stage 4: Verification sub-agent ────────────────────────────────────────
  let finalResponse = draft;
  try {
    const verifyResp = await runLLM({
      runId,
      agent:           `${agentId}-verifier`,
      purpose:         "response-verification",
      route:           "CLASSIFY_EXTRACT_VALIDATE",
      messages: [
        { role: "system", content: VERIFY_SYSTEM(agentName) },
        {
          role:    "user",
          content: `[Original Query]: ${rawQuery}\n\n[Plan]:\n${plan || "N/A"}\n\n[Draft Response]:\n${draft}`,
        },
      ],
      maxOutputTokens: 1_500,
      temperature:     0.1,
    });

    const verifyText = verifyResp.text.trim();
    if (verifyText.startsWith("APPROVED")) {
      const stripped = verifyText.replace(/^APPROVED\s*\n?/, "").trim();
      // The verifier echoes "[response unchanged]" literally — that means use the draft
      finalResponse = (!stripped || /^\[response unchanged\]$/i.test(stripped)) ? draft : stripped;
      console.log(`[deep-agent] ${agentId} verification: APPROVED`);
    } else if (verifyText.startsWith("REVISED")) {
      finalResponse = verifyText.replace(/^REVISED\s*\n?/, "").trim() || draft;
      console.log(`[deep-agent] ${agentId} verification: REVISED`);
    }
  } catch (err) {
    console.warn(`[deep-agent] ${agentId} verification failed (non-fatal):`, err);
  }

  // ── Stage 5: Persist memory + prune ────────────────────────────────────────
  await Promise.allSettled([
    appendMemory(tenantId, agentId, sessionId, "user",      rawQuery),
    appendMemory(tenantId, agentId, sessionId, "assistant", finalResponse),
  ]);
  pruneMemory(tenantId, agentId, sessionId).catch(() => {}); // fire-and-forget

  return finalResponse;
}
