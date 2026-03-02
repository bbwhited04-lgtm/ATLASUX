/**
 * TikTok Post — publish slideshows/videos to TikTok via Postiz API.
 *
 * Uses the Postiz REST API directly (the @postiz/node SDK is installed
 * but has CJS/ESM interop issues with our TypeScript build).
 * Posts as SELF_ONLY (draft) by default so the user can add trending
 * audio before publishing.
 *
 * Requires: POSTIZ_API_KEY env var + a TikTok integration connected in Postiz.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";

const POSTIZ_API = "https://api.postiz.com/public/v1";

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

type PostizIntegration = { id: string; name: string; providerIdentifier?: string; identifier?: string };

/** Find the first TikTok integration from Postiz. */
async function findTikTokIntegration(): Promise<{ id: string; name: string } | null> {
  try {
    const integrations = (await postizGet("/integrations")) as PostizIntegration[];
    const tiktok = integrations.find(
      (i) => i.providerIdentifier === "tiktok" || i.identifier === "tiktok" || (i.name ?? "").toLowerCase().includes("tiktok"),
    );
    return tiktok ? { id: tiktok.id, name: tiktok.name } : null;
  } catch {
    return null;
  }
}

export const tiktokPostTool: ToolDefinition = {
  key:  "tiktokPost",
  name: "TikTok Post via Postiz",
  patterns: [
    /\btiktok\b/i,
    /post\s+(?:to\s+)?tik\s*tok/i,
    /tik\s*tok\s+(?:slide|video|post|content|draft)/i,
    /publish\s+(?:to\s+)?tik\s*tok/i,
    /schedule\s+(?:a\s+)?tik\s*tok/i,
    /create\s+(?:a\s+)?tik\s*tok/i,
    /\bpostiz\b/i,
  ],

  async execute(ctx) {
    try {
      if (!process.env.POSTIZ_API_KEY) {
        return makeResult("tiktok_post", "POSTIZ_API_KEY is not configured. Set it in backend/.env to enable TikTok posting via Postiz.");
      }

      const integration = await findTikTokIntegration();
      if (!integration) {
        return makeResult("tiktok_post", "No TikTok integration found in Postiz. Connect a TikTok account at https://app.postiz.com first.");
      }

      // Extract caption / content from the query
      const captionMatch = ctx.query.match(
        /(?:caption|text|content|post|say(?:ing)?)[:\s]+["']?(.+?)["']?\s*$/i,
      );
      const caption = captionMatch?.[1]?.trim();

      if (!caption) {
        // No caption provided — return instructions for the agent
        return makeResult("tiktok_post", [
          `TikTok posting is ready via Postiz.`,
          `Connected integration: ${integration.name} (${integration.id})`,
          ``,
          `To create a TikTok post, provide:`,
          `  1. Caption text (with hashtags)`,
          `  2. Image/video URLs (optional — for slideshows, provide 3-6 image URLs)`,
          ``,
          `Post settings (defaults):`,
          `  - Privacy: SELF_ONLY (draft — user adds music before publishing)`,
          `  - Duet: disabled`,
          `  - Stitch: disabled`,
          `  - Comments: enabled`,
          `  - AI disclosure: true`,
          ``,
          `Use: "post to tiktok caption: Your text here #hashtag"`,
        ].join("\n"));
      }

      // Create the post via Postiz API
      const postBody = {
        type: "now",
        date: new Date().toISOString(),
        shortLink: false,
        tags: [],
        posts: [{
          integration: { id: integration.id },
          value: [{ content: caption, image: [] }],
          settings: {
            __type: "tiktok",
            privacy_level: "SELF_ONLY",
            duet: false,
            stitch: false,
            comment: true,
            autoAddMusic: "no",
            brand_content_toggle: false,
            brand_organic_toggle: false,
            video_made_with_ai: true,
            content_posting_method: "UPLOAD",
          },
        }],
      };

      const result = (await postizPost("/posts", postBody)) as Array<{ postId?: string }>;
      const postId = result?.[0]?.postId ?? "unknown";

      return makeResult("tiktok_post", [
        `TikTok post created as draft (SELF_ONLY).`,
        `Post ID: ${postId}`,
        `Integration: ${integration.name}`,
        `Caption: ${caption.substring(0, 120)}${caption.length > 120 ? "..." : ""}`,
        ``,
        `The post is visible only to you. Open TikTok to add trending audio and publish.`,
      ].join("\n"));
    } catch (err) {
      return makeError("tiktok_post", err);
    }
  },
};
