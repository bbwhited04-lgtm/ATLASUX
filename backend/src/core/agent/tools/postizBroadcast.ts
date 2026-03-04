/**
 * Postiz Broadcast — Post to ALL connected platforms in one shot.
 *
 * User says: "post about API setup nightmare to all platforms"
 * Tool does:
 *   1. Extracts the topic from the query
 *   2. Calls OpenAI to generate a well-written social media post
 *   3. Fetches every connected Postiz integration
 *   4. Skips media-only platforms (YouTube, Pinterest, TikTok)
 *   5. Posts to every text-compatible channel with correct platform settings
 *   6. Returns a summary of successes + failures
 *
 * Requires: POSTIZ_API_KEY + OPENAI_API_KEY env vars.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import OpenAI from "openai";

const POSTIZ_API = "https://api.postiz.com/public/v1";

// Platforms that require media (video/image) — skip for text broadcast
const MEDIA_ONLY_PLATFORMS = new Set([
  "youtube",
  "pinterest",
  "tiktok",
]);

// Platform-specific post settings
const PLATFORM_SETTINGS: Record<string, Record<string, unknown>> = {
  x:                  { __type: "x", who_can_reply_post: "everyone" },
  facebook:           { __type: "facebook" },
  threads:            { __type: "threads" },
  instagram:          { __type: "instagram", post_type: "post", collaborators: [] },
  "instagram-standalone": { __type: "instagram", post_type: "post", collaborators: [] },
  linkedin:           { __type: "linkedin", post_as_images_carousel: false },
  "linkedin-page":    { __type: "linkedin-page", post_as_images_carousel: false },
  reddit:             { __type: "reddit", subreddit: [] },
  tumblr:             { __type: "tumblr" },
  mastodon:           { __type: "mastodon" },
  bluesky:            { __type: "bluesky" },
  discord:            { __type: "discord", channel: "" },
  telegram:           { __type: "telegram" },
  medium:             { __type: "medium", title: "", subtitle: "", tags: [] },
  devto:              { __type: "devto", title: "", tags: [] },
  slack:              { __type: "slack", channel: "" },
};

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

async function postizPost(endpoint: string, body: unknown): Promise<unknown> {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY not configured");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Postiz API ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

type PostizIntegration = {
  id: string;
  name: string;
  providerIdentifier?: string;
  identifier?: string;
};

// ── AI content generation ────────────────────────────────────────────────────

async function generatePostContent(topic: string): Promise<string> {
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

function extractTopic(query: string): string {
  // Try various patterns to pull the topic out of the query
  const patterns = [
    // "broadcast about X to all platforms"
    /(?:broadcast|cross[\s-]?post|post|blast)\s+(?:about|on|regarding)\s+(.+?)(?:\s+(?:to|on|across)\s+(?:all|every)\s+(?:platforms?|channels?|social))/i,
    // "post about X everywhere"
    /(?:broadcast|cross[\s-]?post|post|blast)\s+(?:about|on|regarding)\s+(.+?)(?:\s+everywhere)/i,
    // "post to all platforms about X"
    /(?:to|on|across)\s+(?:all|every)\s+(?:platforms?|channels?)\s+(?:about|on|regarding)\s+(.+)/i,
    // "broadcast about X" (no target specified — assume all)
    /(?:broadcast|cross[\s-]?post|blast)\s+(?:about|on|regarding)\s+(.+)/i,
    // "post about X to all platforms" (greedy capture)
    /(?:post)\s+(?:about|on|regarding)\s+(.+?)(?:\s+(?:to|on|across)\s+(?:all|every))/i,
    // Fallback: "make a post about X"
    /(?:make|create|write)\s+(?:a\s+)?(?:post|message|announcement)\s+(?:about|on|regarding)\s+(.+)/i,
  ];

  for (const p of patterns) {
    const m = query.match(p);
    if (m?.[1]) return m[1].trim();
  }

  // Last resort: strip trigger words and use what's left
  return query
    .replace(/\b(?:broadcast|cross[\s-]?post|blast|post|to all|all platforms|all channels|everywhere|every platform)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
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
      if (!process.env.POSTIZ_API_KEY) {
        return makeResult("postiz_broadcast", "POSTIZ_API_KEY is not configured.");
      }

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

      // 3. Fetch all integrations
      const integrations = (await postizGet("/integrations")) as PostizIntegration[];
      if (!integrations.length) {
        return makeResult("postiz_broadcast", "No social media integrations connected in Postiz.");
      }

      // 4. Filter to text-compatible platforms
      const textChannels = integrations.filter((i) => {
        const platform = (i.identifier ?? "").toLowerCase();
        return !MEDIA_ONLY_PLATFORMS.has(platform);
      });

      if (!textChannels.length) {
        return makeResult("postiz_broadcast", "No text-compatible channels found. All connected platforms require media.");
      }

      // 5. Post to each channel
      const results: Array<{ name: string; platform: string; ok: boolean; id?: string; error?: string }> = [];

      for (const integration of textChannels) {
        const platform = (integration.identifier ?? "").toLowerCase();
        const settings = PLATFORM_SETTINGS[platform] ?? { __type: platform };

        try {
          const postBody = {
            type: "now",
            date: new Date().toISOString(),
            shortLink: false,
            tags: [],
            posts: [{
              integration: { id: integration.id },
              value: [{ content, image: [] }],
              settings,
            }],
          };

          const response = (await postizPost("/posts", postBody)) as Array<{ postId?: string }>;
          results.push({
            name: integration.name,
            platform,
            ok: true,
            id: response?.[0]?.postId ?? "unknown",
          });
        } catch (err: any) {
          results.push({
            name: integration.name,
            platform,
            ok: false,
            error: err?.message ?? String(err),
          });
        }

        // Rate limit between API calls
        await new Promise((r) => setTimeout(r, 200));
      }

      // 6. Build summary
      const ok = results.filter((r) => r.ok);
      const fail = results.filter((r) => !r.ok);

      const lines: string[] = [
        `BROADCAST COMPLETE: ${ok.length}/${textChannels.length} channels`,
        ``,
        `Topic: ${topic}`,
        ``,
        `Generated content:`,
        content,
        ``,
        `Posted to:`,
        ...ok.map((r) => `  ${r.name} (${r.platform})`),
      ];

      if (fail.length) {
        lines.push(``, `Failed:`);
        for (const r of fail) lines.push(`  ${r.name} (${r.platform}): ${r.error}`);
      }

      return makeResult("postiz_broadcast", lines.join("\n"));
    } catch (err) {
      return makeError("postiz_broadcast", err);
    }
  },
};
