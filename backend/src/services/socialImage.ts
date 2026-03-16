/**
 * Social Image Generator — resolves image/video URLs for social media posts.
 *
 * Priority: explicit URLs → asset library match → Flux1 generation → empty.
 * Used by postizPublish, broadcastDelivery, and workflow posting steps.
 */

import { generateImage, isAvailable } from "./flux1.js";
import { prisma } from "../db/prisma.js";

export type MediaUrls = {
  imageUrls: string[];
  videoUrls: string[];
};

/**
 * Resolve media URLs for a social post.
 * Priority: explicit URLs → asset library → Flux1 generation.
 */
export async function resolveMediaUrls(
  tenantId: string,
  postContent: string,
  provided?: { imageUrl?: string | string[]; videoUrl?: string | string[]; platform?: string },
): Promise<MediaUrls> {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  // 1. Use provided URLs first
  if (provided?.imageUrl) {
    const urls = Array.isArray(provided.imageUrl) ? provided.imageUrl : [provided.imageUrl];
    imageUrls.push(...urls.filter(Boolean));
  }
  if (provided?.videoUrl) {
    const urls = Array.isArray(provided.videoUrl) ? provided.videoUrl : [provided.videoUrl];
    videoUrls.push(...urls.filter(Boolean));
  }

  // If we already have media, done
  if (imageUrls.length > 0 || videoUrls.length > 0) {
    return { imageUrls, videoUrls };
  }

  // 2. Try asset library — pick a relevant video or image from our curated library
  const libraryMedia = await pickFromAssetLibrary(tenantId, postContent, provided?.platform);
  if (libraryMedia.imageUrls.length > 0 || libraryMedia.videoUrls.length > 0) {
    return libraryMedia;
  }

  // 3. Fall back to Flux1 generation
  const generated = await generateSocialImage(tenantId, postContent);
  imageUrls.push(...generated);

  return { imageUrls, videoUrls };
}

/**
 * Pick the best matching media from the asset library based on post content.
 * Prefers video for video-first platforms (TikTok, YouTube, Instagram).
 * Uses keyword matching against asset descriptions and names.
 */
async function pickFromAssetLibrary(
  tenantId: string,
  postContent: string,
  platform?: string,
): Promise<MediaUrls> {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  try {
    // Get all media assets for this tenant
    const assets = await prisma.asset.findMany({
      where: {
        tenantId,
        type: { in: ["video", "image"] },
      },
    });

    if (assets.length === 0) return { imageUrls, videoUrls };

    const content = postContent.toLowerCase();
    const videoFirstPlatforms = ["tiktok", "youtube", "instagram", "pinterest"];
    const preferVideo = platform && videoFirstPlatforms.includes(platform.toLowerCase());

    // Score each asset based on content relevance
    const scored = assets.map((asset) => {
      let score = 0;
      const name = (asset.name ?? "").toLowerCase();
      const desc = ((asset.metrics as any)?.description ?? "").toLowerCase();
      const use = ((asset.metrics as any)?.use ?? "").toLowerCase();
      const assetPlatform = (asset.platform ?? "").toLowerCase();

      // Platform match
      if (assetPlatform === "all" || (platform && assetPlatform.includes(platform.toLowerCase()))) {
        score += 2;
      }

      // Keyword matching against post content
      const keywords = [
        ["call", "phone", "answer", "missed", "ring"], // Lucy inbound
        ["book", "appointment", "calendar", "schedule"], // Booking
        ["sms", "text", "confirm", "message"], // SMS
        ["slack", "notify", "notification", "alert"], // Slack
        ["email", "send", "inbox"], // Email
        ["sales", "outbound", "cold", "lead", "prospect"], // Mercer
        ["language", "spanish", "french", "multilingual", "espanol"], // Multi-language
        ["zoom", "meeting", "transcript", "note"], // Zoom
        ["plumb", "hvac", "salon", "barber", "electrician", "trade"], // Trade verticals
        ["emergency", "urgent", "burst", "pipe"], // Emergency scenario
      ];

      for (const group of keywords) {
        const contentMatch = group.some((kw) => content.includes(kw));
        const assetMatch = group.some((kw) => name.includes(kw) || desc.includes(kw));
        if (contentMatch && assetMatch) score += 3;
      }

      // Prefer short clips for short-form platforms
      if (preferVideo && use === "short-clip") score += 2;
      if (!preferVideo && use === "brand-hero") score += 2;

      // Prefer videos on video-first platforms
      if (preferVideo && asset.type === "video") score += 1;
      if (!preferVideo && asset.type === "image") score += 1;

      return { asset, score };
    });

    // Sort by score descending, pick the best
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    if (best && best.score >= 2) {
      if (best.asset.type === "video") {
        videoUrls.push(best.asset.url);
      } else {
        imageUrls.push(best.asset.url);
      }
      console.log(`[socialImage] Picked from library: ${best.asset.name} (score: ${best.score})`);
    }
  } catch (err) {
    console.log(`[socialImage] Asset library lookup failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return { imageUrls, videoUrls };
}

/**
 * Generate a social media image from post content via Flux1.
 * Returns an array of image URLs (0 or 1 element).
 */
export async function generateSocialImage(tenantId: string, postContent: string): Promise<string[]> {
  try {
    if (!(await isAvailable(tenantId))) {
      console.log(`[socialImage] Flux1 not available for tenant ${tenantId} — no image generated`);
      return [];
    }

    // Build a brand-aware image prompt from the post content
    const truncated = postContent.slice(0, 200).replace(/[#@]\S+/g, "").trim();
    const prompt = [
      `Cinematic social media graphic for Atlas UX, an AI receptionist for trade businesses (plumbers, salons, HVAC).`,
      `Theme: dark navy background (#0a0f1e), glowing cyan (#06b6d4) and emerald (#10b981) accents, futuristic holographic UI elements.`,
      `Feature a sleek blue wireframe robot figure at a modern desk with holographic screens showing phone calls, appointment calendars, and SMS messages.`,
      `Context: ${truncated}.`,
      `Style: cinematic lighting, depth of field, professional, high contrast, no text overlays, no watermarks.`,
    ].join(" ");

    const result = await generateImage(tenantId, { prompt, width: 1024, height: 1024 });
    if (result.ok && result.imageUrl) {
      return [result.imageUrl];
    }
    console.log(`[socialImage] Flux1 returned no image for tenant ${tenantId}`);
  } catch (err) {
    console.log(`[socialImage] Flux1 generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  return [];
}
