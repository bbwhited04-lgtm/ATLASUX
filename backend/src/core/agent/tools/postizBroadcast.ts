/**
 * Postiz Broadcast — Post to ALL connected platforms in one shot.
 *
 * Two modes:
 *   1. DIRECT (user-initiated): User says "post about X to all platforms" →
 *      generate content → deliver immediately via 3-tier pipeline → return results.
 *      No approval gate — user already approved by saying it.
 *
 *   2. HIL (autonomous agent): Agent autonomously decides to post →
 *      generate content → create decision memo → user approves in Decisions tab →
 *      approval callback triggers delivery.
 *
 * 3-tier delivery pipeline:
 *   Tier 1: Direct platform API (if OAuth token in vault)
 *   Tier 2: Postiz API (if integration connected)
 *   Tier 3: Vision/browser automation (LOCAL_VISION_TASK)
 *
 * Requires: POSTIZ_API_KEY + OPENAI_API_KEY env vars.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { deliverBroadcast, type BroadcastChannel } from "./broadcastDelivery.js";
import { createDecisionMemo } from "../../../services/decisionMemos.js";
import OpenAI from "openai";

const POSTIZ_API = "https://api.postiz.com/public/v1";

// Platforms that require media (video/image) — skip for text broadcast
const MEDIA_ONLY_PLATFORMS = new Set([
  "youtube",
  "pinterest",
  "tiktok",
]);

// ── Postiz API helpers ───────────────────────────────────────────────────────

async function postizGet(endpoint: string): Promise<unknown> {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY not configured");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    headers: { Authorization: key, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Postiz API ${res.status}`);
  return res.json();
}

type PostizIntegration = {
  id: string;
  name: string;
  providerIdentifier?: string;
  identifier?: string;
};

// ── AI content generation ────────────────────────────────────────────────────

export async function generatePostContent(topic: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");

  const openai = new OpenAI({ apiKey });

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: [
          "You are a social media content writer for Atlas UX, an AI-powered business automation platform.",
          "Write a single social media post based on the topic provided.",
          "Rules:",
          "- Authentic, conversational tone. Not corporate.",
          "- 150-300 words. Long enough to be substantive, short enough for every platform.",
          "- Include relevant hashtags at the end (5-8).",
          "- No emojis unless they add genuine value.",
          "- Write from the founder/builder perspective — someone actually building and shipping.",
          "- If the topic is a frustration or complaint, be honest and specific. Don't sugarcoat.",
          "- If the topic is a win or announcement, be genuine, not hype-y.",
          "- Return ONLY the post text, nothing else. No labels, no 'Here is your post:', just the content.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `Write a social media post about: ${topic}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.8,
  });

  const content = res.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI returned empty content");
  return content;
}

// ── Topic extraction ─────────────────────────────────────────────────────────

export function extractTopic(query: string): string {
  const patterns = [
    /(?:broadcast|cross[\s-]?post|post|blast)\s+(?:about|on|regarding)\s+(.+?)(?:\s+(?:to|on|across)\s+(?:all|every)\s+(?:platforms?|channels?|social))/i,
    /(?:broadcast|cross[\s-]?post|post|blast)\s+(?:about|on|regarding)\s+(.+?)(?:\s+everywhere)/i,
    /(?:to|on|across)\s+(?:all|every)\s+(?:platforms?|channels?)\s+(?:about|on|regarding)\s+(.+)/i,
    /(?:broadcast|cross[\s-]?post|blast)\s+(?:about|on|regarding)\s+(.+)/i,
    /(?:post)\s+(?:about|on|regarding)\s+(.+?)(?:\s+(?:to|on|across)\s+(?:all|every))/i,
    /(?:make|create|write)\s+(?:a\s+)?(?:post|message|announcement)\s+(?:about|on|regarding)\s+(.+)/i,
  ];

  for (const p of patterns) {
    const m = query.match(p);
    if (m?.[1]) return m[1].trim();
  }

  return query
    .replace(/\b(?:broadcast|cross[\s-]?post|blast|post|to all|all platforms|all channels|everywhere|every platform)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Fetch channels helper ────────────────────────────────────────────────────

async function fetchTextChannels(): Promise<BroadcastChannel[]> {
  const integrations = (await postizGet("/integrations")) as PostizIntegration[];
  return integrations
    .filter(i => !MEDIA_ONLY_PLATFORMS.has((i.identifier ?? "").toLowerCase()))
    .map(i => ({
      id: i.id,
      name: i.name,
      platform: (i.identifier ?? "").toLowerCase(),
      identifier: i.identifier,
    }));
}

// ── Mode detection ───────────────────────────────────────────────────────────

/**
 * Detect if this is a direct user command (no gate needed) or an autonomous
 * agent action (needs decision memo approval).
 *
 * Direct mode: query explicitly contains broadcast/post-all-platforms patterns.
 * This means a human typed the command and approved it by saying so.
 *
 * HIL mode: tool was triggered programmatically (e.g., scheduled task,
 * strategy execution) — no explicit user broadcast command detected.
 */
function isDirectUserCommand(query: string): boolean {
  const directPatterns = [
    /\b(?:broadcast|blast)\b/i,
    /\bpost\s+(?:about|on|regarding)\s+.+?\s+(?:to|on|across)\s+(?:all|every)/i,
    /\bcross[\s-]?post/i,
    /\bpost\s+(?:to|on|across)\s+(?:all|every)/i,
    /\bpost\b.*\beverywhere\b/i,
  ];
  return directPatterns.some(p => p.test(query));
}

// ── Tool definition ──────────────────────────────────────────────────────────

export const postizBroadcastTool: ToolDefinition = {
  key: "postizBroadcast",
  name: "Postiz Broadcast to All Platforms",
  patterns: [
    /\b(?:broadcast|blast)\b/i,
    /\bpost\s+(?:about|on|regarding)\s+.+?\s+(?:to|on|across)\s+(?:all|every)\s+(?:platforms?|channels?)/i,
    /\bcross[\s-]?post\s+(?:to\s+)?(?:all|every|everywhere)/i,
    /\bpost\s+(?:to|on|across)\s+(?:all|every)\s+(?:platforms?|channels?|social)/i,
    /\b(?:all|every)\s+(?:platforms?|channels?)\b.*\bpost\b/i,
    /\bpost\b.*\beverywhere\b/i,
  ],

  async execute(ctx) {
    try {
      // 1. Extract topic
      const topic = extractTopic(ctx.query);
      if (!topic || topic.length < 3) {
        return makeResult("postiz_broadcast",
          "Could not determine the broadcast topic. Try: \"broadcast about [your topic] to all platforms\"");
      }

      // 2. Generate content via AI
      let content: string;
      try {
        content = await generatePostContent(topic);
      } catch (err: any) {
        return makeResult("postiz_broadcast",
          `Failed to generate post content: ${err?.message ?? String(err)}`);
      }

      // 3. Fetch all text-compatible channels
      const channels = await fetchTextChannels();
      if (!channels.length) {
        return makeResult("postiz_broadcast", "No text-compatible channels found.");
      }

      // 4. Route based on mode
      if (isDirectUserCommand(ctx.query)) {
        // ── DIRECT MODE: User said it, user approved it. Deliver now. ──
        const result = await deliverBroadcast({
          tenantId: ctx.tenantId,
          content,
          channels,
        });

        const lines = [
          `BROADCAST COMPLETE`,
          ``,
          `Topic: ${topic}`,
          ``,
          `Generated content:`,
          content,
          ``,
          result.summary,
        ];

        return makeResult("postiz_broadcast", lines.join("\n"));
      } else {
        // ── HIL MODE: Autonomous agent action. Create decision memo. ──
        const memo = await createDecisionMemo({
          tenantId: ctx.tenantId,
          agent: ctx.agentId,
          title: `Broadcast: ${topic}`,
          rationale: `Post about "${topic}" to ${channels.length} platforms`,
          riskTier: 1,
          confidence: 0.85,
          expectedBenefit: `Brand visibility across ${channels.length} social channels`,
          payload: {
            type: "broadcast",
            topic,
            content,
            channels,
          },
        });

        return makeResult("postiz_broadcast", [
          `BROADCAST PENDING APPROVAL`,
          ``,
          `Decision memo created: ${memo.id}`,
          `Status: ${memo.status}`,
          ``,
          `Topic: ${topic}`,
          `Channels: ${channels.length} platforms`,
          ``,
          `Generated content:`,
          content,
          ``,
          `Visit the Decisions tab to approve, rewrite, or deny.`,
        ].join("\n"));
      }
    } catch (err) {
      return makeError("postiz_broadcast", err);
    }
  },
};
