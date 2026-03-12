/**
 * Social Image Generator — resolves image/video URLs for social media posts.
 *
 * Priority: explicit URLs from workflow input → Flux1 generation → empty.
 * Used by postizPublish, broadcastDelivery, and workflow posting steps.
 */

import { generateImage, isAvailable } from "./flux1.js";

export type MediaUrls = {
  imageUrls: string[];
  videoUrls: string[];
};

/**
 * Resolve media URLs for a social post.
 * Uses explicitly provided URLs first; falls back to Flux1 generation.
 */
export async function resolveMediaUrls(
  tenantId: string,
  postContent: string,
  provided?: { imageUrl?: string | string[]; videoUrl?: string | string[] },
): Promise<MediaUrls> {
  const imageUrls: string[] = [];
  const videoUrls: string[] = [];

  // Use provided URLs first
  if (provided?.imageUrl) {
    const urls = Array.isArray(provided.imageUrl) ? provided.imageUrl : [provided.imageUrl];
    imageUrls.push(...urls.filter(Boolean));
  }
  if (provided?.videoUrl) {
    const urls = Array.isArray(provided.videoUrl) ? provided.videoUrl : [provided.videoUrl];
    videoUrls.push(...urls.filter(Boolean));
  }

  // If we already have media, skip generation
  if (imageUrls.length > 0 || videoUrls.length > 0) {
    return { imageUrls, videoUrls };
  }

  // Fall back to Flux1 generation
  const generated = await generateSocialImage(tenantId, postContent);
  imageUrls.push(...generated);

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

    // Build a simple image prompt from the post content
    const truncated = postContent.slice(0, 200).replace(/[#@]\S+/g, "").trim();
    const prompt = `Professional, modern social media graphic for a tech company post about: ${truncated}. Clean design, blue and cyan color palette, minimalist style.`;

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
