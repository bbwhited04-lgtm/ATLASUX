/**
 * Meeting Hook — extracts organizational insights from processed meeting transcripts.
 *
 * Trigger: after a MeetingNote reaches status "processed" (transcript summarized).
 * Cost: ~$0.003 per meeting (one small-model LLM call on already-summarized text).
 */

import { prisma } from "../../db/prisma.js";
import { storeOrgMemory } from "../agent/orgMemory.js";
import type { OrgMemoryCategory } from "../agent/orgMemory.js";
import { resolveCredential } from "../../services/credentialResolver.js";

export async function runMeetingHook(params: {
  tenantId: string;
  meetingNoteId: string;
}): Promise<{ stored: number }> {
  const { tenantId, meetingNoteId } = params;

  const meeting = await prisma.meetingNote.findFirst({
    where: { id: meetingNoteId, tenantId },
  });

  if (!meeting?.summary) return { stored: 0 };

  // Build context from the already-summarized meeting data
  const context = [
    `Meeting: ${meeting.title}`,
    `Date: ${meeting.scheduledAt?.toISOString().split("T")[0] ?? "unknown"}`,
    `Summary: ${meeting.summary}`,
  ];

  const actionItems = meeting.actionItems as any[];
  if (actionItems?.length) {
    context.push(`Action Items: ${actionItems.map((a: any) => a.text).join("; ")}`);
  }

  const keyPoints = meeting.keyPoints as any[];
  if (keyPoints?.length) {
    context.push(`Key Points: ${keyPoints.join("; ")}`);
  }

  const openaiKey = await resolveCredential(tenantId, "openai");
  if (!openaiKey) {
    console.log("[org-brain:meeting] No OPENAI_API_KEY — skipping insight extraction");
    return { stored: 0 };
  }

  // One cheap LLM call to extract org insights
  const prompt = `You are an organizational intelligence analyst. Extract 0-3 organizational insights from this meeting summary. Only extract insights that would be genuinely valuable for future decision-making.

Categories: preference, pattern, relationship, insight, outcome
Return ONLY valid JSON array: [{"category": "...", "content": "...", "tags": ["..."]}]
If no insights worth storing, return [].

MEETING DATA:
${context.join("\n")}`;

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
      console.error("[org-brain:meeting] LLM call failed:", data?.error?.message);
      return { stored: 0 };
    }

    const raw = data.choices?.[0]?.message?.content ?? "[]";
    let insights: Array<{ category: string; content: string; tags?: string[] }>;

    try {
      const parsed = JSON.parse(raw);
      insights = Array.isArray(parsed) ? parsed : (parsed.insights ?? []);
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
        source: "hook:meeting",
        sourceId: meetingNoteId,
        tags: [...(insight.tags ?? []), "meeting", meeting.platform ?? "zoom"],
      });
      stored++;
    }

    if (stored > 0) {
      console.log(`[org-brain:meeting] Extracted ${stored} insights from "${meeting.title}"`);
    }

    return { stored };
  } catch (err) {
    console.error("[org-brain:meeting] Hook failed:", err);
    return { stored: 0 };
  }
}
