/**
 * Slack Hook — daily analysis of Slack conversations for recurring themes.
 *
 * Trigger: scheduled daily via schedulerWorker (WF-400).
 * Cost: ~$0.002/day (one small-model LLM call on pre-existing audit data).
 */

import { prisma } from "../../db/prisma.js";
import { storeOrgMemory } from "../agent/orgMemory.js";
import type { OrgMemoryCategory } from "../agent/orgMemory.js";
import { resolveCredential } from "../../services/credentialResolver.js";
const MIN_MESSAGES = 15; // Don't analyze if fewer than this

export async function runSlackHook(params: {
  tenantId: string;
}): Promise<{ stored: number }> {
  const { tenantId } = params;

  const openaiKey = await resolveCredential(tenantId, "openai");
  if (!openaiKey) {
    console.log("[org-brain:slack] No OPENAI_API_KEY — skipping");
    return { stored: 0 };
  }

  // Read last 24h of Slack-related audit entries (no extra Slack API calls)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const entries = await prisma.auditLog.findMany({
    where: {
      tenantId,
      createdAt: { gte: since },
      action: { in: ["SLACK_MESSAGE_SENT", "SLACK_MESSAGE_RECEIVED", "SLACK_THREAD_REPLY"] },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      action: true,
      actorExternalId: true,
      message: true,
      meta: true,
      createdAt: true,
    },
  });

  if (entries.length < MIN_MESSAGES) {
    console.log(`[org-brain:slack] Only ${entries.length} messages in 24h — skipping`);
    return { stored: 0 };
  }

  // Format messages for analysis
  const messages = entries.map(e => {
    const meta = e.meta as any;
    const who = e.actorExternalId ?? "unknown";
    const text = meta?.text?.slice(0, 200) ?? e.message?.slice(0, 200) ?? "";
    const channel = meta?.channel ?? "";
    return `[${who}${channel ? ` in #${channel}` : ""}]: ${text}`;
  }).join("\n");

  const prompt = `Analyze these internal Slack messages from the last 24 hours. Identify recurring themes, frequently discussed topics, or emerging concerns that represent organizational knowledge worth preserving.

Return ONLY valid JSON: {"insights": [{"category": "...", "content": "...", "tags": ["..."]}]}
Categories: preference, pattern, insight, relationship
Return 0-3 insights. Only return genuinely useful organizational insights. If the conversation is routine, return {"insights": []}.

MESSAGES:
${messages.slice(0, 8000)}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 500,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      console.error("[org-brain:slack] LLM call failed:", data?.error?.message);
      return { stored: 0 };
    }

    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let insights: Array<{ category: string; content: string; tags?: string[] }>;

    try {
      const parsed = JSON.parse(raw);
      insights = Array.isArray(parsed.insights) ? parsed.insights : [];
    } catch {
      return { stored: 0 };
    }

    let stored = 0;
    for (const insight of insights.slice(0, 3)) {
      if (!insight.content || insight.content.length < 10) continue;

      const validCategories = ["preference", "insight", "pattern", "outcome", "glossary", "relationship"];
      const category = validCategories.includes(insight.category)
        ? (insight.category as OrgMemoryCategory)
        : "insight";

      await storeOrgMemory({
        tenantId,
        category,
        content: insight.content.slice(0, 2000),
        source: "hook:slack",
        tags: [...(insight.tags ?? []), "slack", "daily-analysis"],
      });
      stored++;
    }

    if (stored > 0) {
      console.log(`[org-brain:slack] Extracted ${stored} insights from ${entries.length} Slack messages`);
    }

    return { stored };
  } catch (err) {
    console.error("[org-brain:slack] Hook failed:", err);
    return { stored: 0 };
  }
}
