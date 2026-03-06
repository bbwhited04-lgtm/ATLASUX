/**
 * Decision Hook — reviews approved decisions and links them to outcomes.
 *
 * Trigger: scheduled weekly via schedulerWorker (WF-401).
 * Cost: ~$0.003/week (one LLM call per batch of up to 10 decisions).
 */

import { prisma } from "../../db/prisma.js";
import { storeOrgMemory } from "../agent/orgMemory.js";
import type { OrgMemoryCategory } from "../agent/orgMemory.js";

const OPENAI_KEY = process.env.OPENAI_API_KEY ?? "";

export async function runDecisionHook(params: {
  tenantId: string;
}): Promise<{ reviewed: number; outcomesStored: number }> {
  const { tenantId } = params;

  if (!OPENAI_KEY) {
    console.log("[org-brain:decision] No OPENAI_API_KEY — skipping");
    return { reviewed: 0, outcomesStored: 0 };
  }

  // Find approved decisions from 7-30 days ago without outcomes
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const decisions = await prisma.decisionMemo.findMany({
    where: {
      tenantId,
      status: "APPROVED",
      createdAt: { gte: thirtyDaysAgo, lte: sevenDaysAgo },
      outcomes: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (!decisions.length) {
    console.log("[org-brain:decision] No unreviewed decisions found");
    return { reviewed: 0, outcomesStored: 0 };
  }

  // For each decision, gather any related audit entries since approval
  const decisionContexts = await Promise.all(
    decisions.map(async (d) => {
      const relatedAudits = await prisma.auditLog.findMany({
        where: {
          tenantId,
          createdAt: { gte: d.updatedAt },
          actorExternalId: d.agent,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { action: true, message: true, createdAt: true },
      });

      return {
        id: d.id,
        agent: d.agent,
        title: d.title,
        rationale: d.rationale.slice(0, 300),
        expectedBenefit: d.expectedBenefit?.slice(0, 200) ?? "none specified",
        estimatedCostUsd: d.estimatedCostUsd,
        riskTier: d.riskTier,
        approvedAt: d.updatedAt.toISOString().split("T")[0],
        recentActivity: relatedAudits.map(a =>
          `${a.action}: ${a.message?.slice(0, 100) ?? ""}`,
        ).join("; "),
      };
    }),
  );

  // Single LLM call for the batch
  const prompt = `You are reviewing ${decisionContexts.length} approved business decisions to determine their outcomes. For each decision, based on the expected benefit and any subsequent activity, rate the outcome.

Return ONLY valid JSON: {"outcomes": [{"decisionId": "...", "outcome": "positive|negative|neutral|mixed", "evidence": "...", "impactScore": 0.0-1.0}]}

If you cannot determine the outcome for a decision, use "neutral" with evidence "insufficient data".

DECISIONS:
${decisionContexts.map((d, i) => `${i + 1}. [${d.id}] Agent: ${d.agent}, Title: ${d.title}
   Rationale: ${d.rationale}
   Expected: ${d.expectedBenefit}
   Cost: $${d.estimatedCostUsd}, Risk: ${d.riskTier}
   Approved: ${d.approvedAt}
   Recent activity: ${d.recentActivity || "none observed"}`).join("\n\n")}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 1000,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      console.error("[org-brain:decision] LLM call failed:", data?.error?.message);
      return { reviewed: 0, outcomesStored: 0 };
    }

    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let outcomes: Array<{
      decisionId: string;
      outcome: string;
      evidence: string;
      impactScore?: number;
    }>;

    try {
      const parsed = JSON.parse(raw);
      outcomes = Array.isArray(parsed.outcomes) ? parsed.outcomes : [];
    } catch {
      return { reviewed: decisions.length, outcomesStored: 0 };
    }

    let outcomesStored = 0;
    const validOutcomes = ["positive", "negative", "neutral", "mixed"];

    for (const o of outcomes) {
      const decision = decisions.find(d => d.id === o.decisionId);
      if (!decision) continue;
      if (!validOutcomes.includes(o.outcome)) continue;

      // Store DecisionOutcome record
      await prisma.decisionOutcome.create({
        data: {
          tenantId,
          decisionId: decision.id,
          outcome: o.outcome,
          evidence: (o.evidence ?? "auto-reviewed").slice(0, 2000),
          impactScore: typeof o.impactScore === "number" ? Math.min(1, Math.max(0, o.impactScore)) : null,
          detectedBy: "hook:auto",
        },
      });

      // Store as org memory if the outcome is notable (not neutral)
      if (o.outcome !== "neutral") {
        await storeOrgMemory({
          tenantId,
          category: "outcome",
          content: `Decision by ${decision.agent}: "${decision.title}" — outcome: ${o.outcome}. ${o.evidence?.slice(0, 300) ?? ""}`,
          source: "hook:decision",
          sourceId: decision.id,
          tags: [decision.agent, "decision-outcome", o.outcome],
        });
      }

      outcomesStored++;
    }

    if (outcomesStored > 0) {
      console.log(`[org-brain:decision] Stored ${outcomesStored} outcomes for ${decisions.length} decisions`);
    }

    return { reviewed: decisions.length, outcomesStored };
  } catch (err) {
    console.error("[org-brain:decision] Hook failed:", err);
    return { reviewed: 0, outcomesStored: 0 };
  }
}
