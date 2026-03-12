/**
 * Broadcast Delivery Engine — 3-tier fallback delivery for social media posts.
 *
 * Tier 1: Direct platform API (if OAuth token exists in token_vault)
 * Tier 2: Postiz API (if integration connected)
 * Tier 3: Vision/browser automation (LOCAL_VISION_TASK via Playwright)
 *
 * Each tier is tried in order. On failure, the next tier is attempted.
 * Every attempt is recorded with a fault code for audit trail.
 */

import { prisma } from "../../../db/prisma.js";
import { loadEnv } from "../../../env.js";
import { getProviderToken } from "../../../lib/tokenStore.js";
import { postTweet } from "../../../services/x.js";
import { publishVideo } from "../../../services/tiktok.js";
import { resolveMediaUrls } from "../../../services/socialImage.js";
import { resolveCredential } from "../../../services/credentialResolver.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type BroadcastChannel = {
  id: string;
  name: string;
  platform: string;
  identifier?: string;
};

export type DeliveryResult = {
  channel: string;
  platform: string;
  tier: 1 | 2 | 3 | 0;
  success: boolean;
  postId?: string;
  error?: string;
  faultCode?: string;
  attempts: TierAttempt[];
};

type TierAttempt = {
  tier: 1 | 2 | 3;
  success: boolean;
  error?: string;
  faultCode?: string;
};

export type BroadcastContext = {
  tenantId: string;
  content: string;
  channels: BroadcastChannel[];
  imageUrl?: string | string[];
  videoUrl?: string | string[];
};

export type BroadcastResult = {
  results: DeliveryResult[];
  summary: string;
};

// ── Fault codes ──────────────────────────────────────────────────────────────

const FAULT = {
  TIER1_NO_TOKEN:        "TIER1_NO_TOKEN",
  TIER1_API_ERROR:       "TIER1_API_ERROR",
  TIER1_NOT_SUPPORTED:   "TIER1_NOT_SUPPORTED",
  TIER2_NO_KEY:          "TIER2_NO_KEY",
  TIER2_NO_INTEGRATION:  "TIER2_NO_INTEGRATION",
  TIER2_API_ERROR:       "TIER2_API_ERROR",
  TIER3_VISION_QUEUED:   "TIER3_VISION_QUEUED",
  ALL_TIERS_FAILED:      "ALL_TIERS_FAILED",
} as const;

// ── Postiz helpers (reused from postizPublish.ts pattern) ────────────────────

const POSTIZ_API = "https://api.postiz.com/public/v1";

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

// Platform-specific Postiz post settings
const PLATFORM_SETTINGS: Record<string, Record<string, unknown>> = {
  x:         { __type: "x", who_can_reply_post: "everyone" },
  facebook:  { __type: "facebook" },
  threads:   { __type: "threads" },
  instagram: { __type: "instagram", post_type: "post", collaborators: [] },
  "instagram-standalone": { __type: "instagram", post_type: "post", collaborators: [] },
  linkedin:  { __type: "linkedin", post_as_images_carousel: false },
  "linkedin-page": { __type: "linkedin-page", post_as_images_carousel: false },
  reddit:    { __type: "reddit", subreddit: [] },
  tumblr:    { __type: "tumblr" },
  mastodon:  { __type: "mastodon" },
  bluesky:   { __type: "bluesky" },
  discord:   { __type: "discord", channel: "" },
  telegram:  { __type: "telegram" },
  medium:    { __type: "medium", title: "", subtitle: "", tags: [] },
  devto:     { __type: "devto", title: "", tags: [] },
  slack:     { __type: "slack", channel: "" },
};

// Platforms with media-only requirements — skip for text broadcast
const MEDIA_ONLY = new Set(["youtube", "pinterest", "tiktok"]);

// Platforms where Tier 1 (direct API) is supported
const TIER1_PLATFORMS = new Set(["x", "tiktok"]);

// Platform → vision target URL for Tier 3
const PLATFORM_URLS: Record<string, string> = {
  x:         "https://x.com/compose/post",
  facebook:  "https://www.facebook.com",
  linkedin:  "https://www.linkedin.com/feed/",
  threads:   "https://www.threads.net",
  instagram: "https://www.instagram.com",
  reddit:    "https://www.reddit.com/submit",
  tumblr:    "https://www.tumblr.com/new",
  mastodon:  "https://mastodon.social/publish",
  bluesky:   "https://bsky.app",
  tiktok:    "https://www.tiktok.com/creator#/upload",
};

// ── Tier 1: Direct API ──────────────────────────────────────────────────────

async function tryTier1(
  tenantId: string,
  platform: string,
  content: string,
): Promise<TierAttempt> {
  if (!TIER1_PLATFORMS.has(platform)) {
    return { tier: 1, success: false, faultCode: FAULT.TIER1_NOT_SUPPORTED };
  }

  try {
    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, platform);
    if (!token) {
      return { tier: 1, success: false, faultCode: FAULT.TIER1_NO_TOKEN };
    }

    if (platform === "x") {
      const result = await postTweet(token, content);
      if (result.ok) {
        return { tier: 1, success: true };
      }
      return { tier: 1, success: false, error: result.error, faultCode: FAULT.TIER1_API_ERROR };
    }

    if (platform === "tiktok") {
      // TikTok requires a video URL — content alone isn't enough for direct API
      // For now, skip to Tier 2/3 unless a videoUrl is provided in the content
      return { tier: 1, success: false, faultCode: FAULT.TIER1_NOT_SUPPORTED };
    }

    return { tier: 1, success: false, faultCode: FAULT.TIER1_NOT_SUPPORTED };
  } catch (err: any) {
    return { tier: 1, success: false, error: err?.message, faultCode: FAULT.TIER1_API_ERROR };
  }
}

// ── Tier 2: Postiz API ──────────────────────────────────────────────────────

async function tryTier2(
  tenantId: string,
  channel: BroadcastChannel,
  content: string,
  imageUrls: string[] = [],
): Promise<TierAttempt> {
  const postizKey = await resolveCredential(tenantId, "postiz");
  if (!postizKey) {
    return { tier: 2, success: false, faultCode: FAULT.TIER2_NO_KEY };
  }

  const platform = (channel.identifier ?? channel.platform ?? "").toLowerCase();
  const settings = PLATFORM_SETTINGS[platform] ?? { __type: platform };

  try {
    const postBody = {
      type: "now",
      date: new Date().toISOString(),
      shortLink: false,
      tags: [],
      posts: [{
        integration: { id: channel.id },
        value: [{ content, image: imageUrls }],
        settings,
      }],
    };

    await postizPost("/posts", postBody, tenantId);
    return { tier: 2, success: true };
  } catch (err: any) {
    return { tier: 2, success: false, error: err?.message, faultCode: FAULT.TIER2_API_ERROR };
  }
}

// ── Tier 3: Vision/Browser Automation ───────────────────────────────────────

async function tryTier3(
  tenantId: string,
  platform: string,
  content: string,
): Promise<TierAttempt> {
  const targetUrl = PLATFORM_URLS[platform];
  if (!targetUrl) {
    return { tier: 3, success: false, faultCode: "TIER3_NO_URL" };
  }

  try {
    // Create a LOCAL_VISION_TASK job for the local vision agent
    await prisma.job.create({
      data: {
        tenantId,
        jobType: "LOCAL_VISION_TASK",
        status: "queued",
        priority: 50,
        input: {
          task: `Post this content to ${platform}: ${content}`,
          targetUrl,
          platform,
        },
      },
    });

    // Vision tasks are async — we can't wait for the result here
    return { tier: 3, success: true, faultCode: FAULT.TIER3_VISION_QUEUED };
  } catch (err: any) {
    return { tier: 3, success: false, error: err?.message, faultCode: "TIER3_JOB_CREATE_FAILED" };
  }
}

// ── Main delivery function ──────────────────────────────────────────────────

/**
 * Deliver content to a single channel using the 3-tier fallback strategy.
 */
async function deliverToChannel(
  tenantId: string,
  channel: BroadcastChannel,
  content: string,
  imageUrls: string[] = [],
): Promise<DeliveryResult> {
  const platform = (channel.identifier ?? channel.platform ?? "").toLowerCase();
  const attempts: TierAttempt[] = [];

  // Tier 1: Direct API
  const t1 = await tryTier1(tenantId, platform, content);
  attempts.push(t1);
  if (t1.success) {
    return { channel: channel.name, platform, tier: 1, success: true, attempts };
  }

  // Tier 2: Postiz API
  const t2 = await tryTier2(tenantId, channel, content, imageUrls);
  attempts.push(t2);
  if (t2.success) {
    return { channel: channel.name, platform, tier: 2, success: true, attempts };
  }

  // Tier 3: Vision (async — queues job, doesn't confirm delivery)
  const t3 = await tryTier3(tenantId, platform, content);
  attempts.push(t3);
  if (t3.success) {
    return {
      channel: channel.name, platform, tier: 3, success: true,
      faultCode: FAULT.TIER3_VISION_QUEUED,
      attempts,
    };
  }

  // All tiers failed
  return {
    channel: channel.name, platform, tier: 0, success: false,
    faultCode: FAULT.ALL_TIERS_FAILED,
    error: attempts.map(a => `Tier ${a.tier}: ${a.faultCode} ${a.error ?? ""}`).join(" | "),
    attempts,
  };
}

/**
 * Deliver content to all channels with 200ms rate limiting between calls.
 * Skips media-only platforms (YouTube, Pinterest, TikTok) UNLESS media URLs are provided.
 */
export async function deliverBroadcast(ctx: BroadcastContext): Promise<BroadcastResult> {
  // Resolve media: explicit URLs from caller take priority over Flux1 generation
  const media = await resolveMediaUrls(ctx.tenantId, ctx.content, {
    imageUrl: ctx.imageUrl,
    videoUrl: ctx.videoUrl,
  });

  const hasMedia = media.imageUrls.length > 0 || media.videoUrls.length > 0;

  // Only skip media-only platforms when no media is available
  const eligibleChannels = hasMedia
    ? ctx.channels
    : ctx.channels.filter(
        ch => !MEDIA_ONLY.has((ch.identifier ?? ch.platform ?? "").toLowerCase()),
      );

  if (!eligibleChannels.length) {
    return { results: [], summary: "No eligible channels found. Media-only platforms require image or video URLs." };
  }

  const imageUrls = media.imageUrls;

  const results: DeliveryResult[] = [];

  for (const channel of eligibleChannels) {
    const result = await deliverToChannel(ctx.tenantId, channel, ctx.content, imageUrls);
    results.push(result);

    // Rate limit between channels
    await new Promise(r => setTimeout(r, 200));
  }

  // Build summary
  const ok = results.filter(r => r.success);
  const fail = results.filter(r => !r.success);
  const vision = results.filter(r => r.faultCode === FAULT.TIER3_VISION_QUEUED);

  const lines: string[] = [
    `DELIVERY: ${ok.length}/${eligibleChannels.length} channels`,
    hasMedia ? `Media: ${media.imageUrls.length} image(s), ${media.videoUrls.length} video(s)` : `Media: none`,
  ];

  if (ok.length) {
    lines.push("", "Delivered:");
    for (const r of ok) {
      const tierLabel = r.tier === 3 ? "vision (queued)" : `tier ${r.tier}`;
      lines.push(`  ${r.channel} (${r.platform}) — ${tierLabel}`);
    }
  }

  if (fail.length) {
    lines.push("", "Failed:");
    for (const r of fail) {
      lines.push(`  ${r.channel} (${r.platform}): ${r.faultCode}`);
    }
  }

  if (vision.length) {
    lines.push("", `${vision.length} channel(s) queued for vision automation (async).`);
  }

  return { results, summary: lines.join("\n") };
}
