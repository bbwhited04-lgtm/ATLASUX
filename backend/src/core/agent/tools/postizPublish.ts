/**
 * Postiz Publish — generic social media posting via Postiz API.
 *
 * Supports all 31 platforms Postiz covers. Auto-detects the target
 * platform from the agent ID (each social agent maps to one platform)
 * or from the query text. Posts as draft by default where supported.
 *
 * Requires: POSTIZ_API_KEY env var + the relevant integration connected in Postiz.
 */

import type { ToolDefinition } from "./_types.js";
import { makeResult, makeError } from "./_types.js";
import { resolveMediaUrls } from "../../../services/socialImage.js";
import { resolveCredential } from "../../../services/credentialResolver.js";

const POSTIZ_API = "https://api.postiz.com/public/v1";

// ── Agent → Postiz platform mapping ──────────────────────────────────────────

const AGENT_PLATFORM: Record<string, string> = {
  timmy:    "tiktok",
  fran:     "facebook",
  dwight:   "threads",
  kelly:    "x",
  terry:    "tumblr",
  cornwall: "pinterest",
  link:     "linkedin",
  donna:    "reddit",
  emma:     "mastodon",   // Alignable doesn't have a Postiz provider; fallback
  venny:    "youtube",
  victor:   "youtube",
  sunday:   "x",          // Comms lead, can cross-post
  archy:    "medium",     // Content, can publish articles
};

// Platform-specific default settings keyed by Postiz __type
const PLATFORM_SETTINGS: Record<string, Record<string, unknown>> = {
  tiktok: {
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
  facebook:  { __type: "facebook" },
  threads:   { __type: "threads" },
  x:         { __type: "x", who_can_reply_post: "everyone" },
  instagram: { __type: "instagram", post_type: "post", collaborators: [] },
  linkedin:  { __type: "linkedin", post_as_images_carousel: false },
  reddit:    { __type: "reddit", subreddit: [] },
  pinterest: { __type: "pinterest", title: "", link: "https://atlasux.com", dominant_color: "#000000", board: "Atlas UX" },
  tumblr:    { __type: "tumblr" },
  youtube:   { __type: "youtube", title: "", type: "public", tags: [] },
  mastodon:  { __type: "mastodon" },
  bluesky:   { __type: "bluesky" },
  discord:   { __type: "discord", channel: "" },
  telegram:  { __type: "telegram" },
  medium:    { __type: "medium", title: "", subtitle: "", tags: [] },
  devto:     { __type: "devto", title: "", tags: [] },
  wordpress: { __type: "wordpress", title: "", type: "post" },
  slack:     { __type: "slack", channel: "" },
};

// ── Postiz API helpers ───────────────────────────────────────────────────────

async function postizGet(endpoint: string, tenantId: string): Promise<unknown> {
  const key = await resolveCredential(tenantId, "postiz");
  if (!key) throw new Error("Postiz API key not configured. Add your Postiz API key in Settings > Integrations.");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    headers: { Authorization: key, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Postiz API ${res.status}`);
  return res.json();
}

async function postizPost(endpoint: string, body: unknown, tenantId: string): Promise<unknown> {
  const key = await resolveCredential(tenantId, "postiz");
  if (!key) throw new Error("Postiz API key not configured. Add your Postiz API key in Settings > Integrations.");
  const res = await fetch(`${POSTIZ_API}${endpoint}`, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Postiz API ${res.status}: ${await res.text().catch(() => "")}`);
  return res.json();
}

type PostizIntegration = {
  id: string; name: string;
  providerIdentifier?: string; identifier?: string;
};

/** Cache integrations list for 5 min to avoid repeated API calls. */
let _integrationsCache: { ts: number; list: PostizIntegration[] } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

async function getIntegrations(tenantId: string): Promise<PostizIntegration[]> {
  if (_integrationsCache && Date.now() - _integrationsCache.ts < CACHE_TTL) {
    return _integrationsCache.list;
  }
  const list = (await postizGet("/integrations", tenantId)) as PostizIntegration[];
  _integrationsCache = { ts: Date.now(), list };
  return list;
}

/** Find the Postiz integration for a given platform identifier. */
async function findIntegration(platform: string, tenantId: string): Promise<PostizIntegration | null> {
  const integrations = await getIntegrations(tenantId);
  return integrations.find(
    (i) =>
      i.providerIdentifier === platform ||
      i.identifier === platform ||
      (i.name ?? "").toLowerCase().includes(platform),
  ) ?? null;
}

// ── Tool definition ──────────────────────────────────────────────────────────

export const postizPublishTool: ToolDefinition = {
  key:  "postizPublish",
  name: "Postiz Social Publish",
  patterns: [
    /\bpost\s+(?:to|on)\s+\w+/i,
    /\bpublish\s+(?:to|on)\s+\w+/i,
    /\bschedule\s+(?:a\s+)?(?:post|tweet|reel|video|story|thread)/i,
    /\b(?:tiktok|facebook|instagram|twitter|threads|tumblr|pinterest|linkedin|reddit|youtube|mastodon|bluesky|discord|medium)\b/i,
    /\bpostiz\b/i,
    /\bcreate\s+(?:a\s+)?(?:post|tweet|reel|video|story|thread|pin|slideshow|draft)/i,
    /\bsocial\s+media\s+post/i,
    /\bcross[\s-]?post/i,
  ],

  async execute(ctx) {
    try {
      const postizKey = await resolveCredential(ctx.tenantId, "postiz");
      if (!postizKey) {
        return makeResult("postiz_publish", "Postiz API key is not configured. Add your Postiz API key in Settings > Integrations.");
      }

      // Determine target platform from agent ID or query
      const platform = AGENT_PLATFORM[ctx.agentId] ?? detectPlatformFromQuery(ctx.query);
      if (!platform) {
        // List all available integrations
        const integrations = await getIntegrations(ctx.tenantId);
        const available = integrations.map((i) => `  - ${i.name} (${i.providerIdentifier ?? i.identifier ?? "?"})`);
        return makeResult("postiz_publish", [
          `Postiz publishing is ready. Connected integrations:`,
          ...available,
          ``,
          `Specify the target platform: "post to facebook: Your content here"`,
        ].join("\n"));
      }

      const integration = await findIntegration(platform, ctx.tenantId);
      if (!integration) {
        return makeResult("postiz_publish", `No ${platform} integration found in Postiz. Connect it at https://app.postiz.com first.`);
      }

      // Extract caption/content from the query
      const captionMatch = ctx.query.match(
        /(?:caption|text|content|post|say(?:ing)?|message)[:\s]+["']?(.+?)["']?\s*$/i,
      );
      const caption = captionMatch?.[1]?.trim();

      if (!caption) {
        const settings = PLATFORM_SETTINGS[platform];
        const settingsInfo = settings
          ? Object.entries(settings)
              .filter(([k]) => k !== "__type")
              .map(([k, v]) => `  - ${k}: ${JSON.stringify(v)}`)
              .join("\n")
          : "  (standard defaults)";

        return makeResult("postiz_publish", [
          `${platform} publishing is ready via Postiz.`,
          `Connected integration: ${integration.name} (${integration.id})`,
          ``,
          `To create a post, provide content:`,
          `  "post to ${platform} caption: Your content here #hashtags"`,
          ``,
          `Default settings:`,
          settingsInfo,
        ].join("\n"));
      }

      // Resolve media: use explicit URLs from query if present, else generate via Flux1
      const urlMatch = ctx.query.match(/(?:image|img|photo)[\s_-]*(?:url)?[:\s]+["']?(https?:\/\/\S+?)["']?(?:\s|$)/i);
      const vidMatch = ctx.query.match(/(?:video|vid|clip)[\s_-]*(?:url)?[:\s]+["']?(https?:\/\/\S+?)["']?(?:\s|$)/i);
      const media = await resolveMediaUrls(ctx.tenantId, caption, {
        imageUrl: urlMatch?.[1],
        videoUrl: vidMatch?.[1],
      });

      // Build post body with platform-specific settings
      const baseSettings = PLATFORM_SETTINGS[platform] ?? { __type: platform };
      const settings = { ...baseSettings };
      const shortTitle = caption.slice(0, 80).replace(/\n.*/s, "").trim() || "Atlas UX Update";
      if (platform === "youtube" && !settings.title) settings.title = shortTitle;
      if (platform === "pinterest" && !settings.title) settings.title = shortTitle;
      if (platform === "medium" && !settings.title) settings.title = shortTitle;
      if (platform === "devto" && !settings.title) settings.title = shortTitle;
      const postBody = {
        type: "now",
        date: new Date().toISOString(),
        shortLink: false,
        tags: [],
        posts: [{
          integration: { id: integration.id },
          value: [{ content: caption, image: media.imageUrls }],
          settings,
        }],
      };

      const result = (await postizPost("/posts", postBody, ctx.tenantId)) as Array<{ postId?: string }>;
      const postId = result?.[0]?.postId ?? "unknown";

      const draftNote = platform === "tiktok"
        ? "\nThe post is SELF_ONLY (draft). Open TikTok to add trending audio and publish."
        : "";

      return makeResult("postiz_publish", [
        `${platform} post created via Postiz.`,
        `Post ID: ${postId}`,
        `Integration: ${integration.name}`,
        `Content: ${caption.substring(0, 120)}${caption.length > 120 ? "..." : ""}`,
        draftNote,
      ].join("\n"));
    } catch (err) {
      return makeError("postiz_publish", err);
    }
  },
};

/** Detect platform from query text when agent has no default mapping. */
function detectPlatformFromQuery(query: string): string | null {
  const platforms: [RegExp, string][] = [
    [/\btiktok\b/i, "tiktok"],
    [/\bfacebook\b/i, "facebook"],
    [/\binstagram\b|\breels?\b|\bstory\b/i, "instagram"],
    [/\bthreads\b/i, "threads"],
    [/\btwitter\b|\btweet\b|\b(?:^|\s)x\s+post\b/i, "x"],
    [/\btumblr\b/i, "tumblr"],
    [/\bpinterest\b|\bpin\b/i, "pinterest"],
    [/\blinkedin\b/i, "linkedin"],
    [/\breddit\b/i, "reddit"],
    [/\byoutube\b|\byt\b/i, "youtube"],
    [/\bmastodon\b/i, "mastodon"],
    [/\bbluesky\b/i, "bluesky"],
    [/\bdiscord\b/i, "discord"],
    [/\bmedium\b/i, "medium"],
    [/\btelegram\b/i, "telegram"],
    [/\bdev\.to\b/i, "devto"],
    [/\bwordpress\b/i, "wordpress"],
    [/\bslack\b/i, "slack"],
  ];
  for (const [rx, name] of platforms) {
    if (rx.test(query)) return name;
  }
  return null;
}
