/**
 * Social Image Generator — generates images for social media posts via Flux1.
 *
 * Best-effort: returns empty array if Flux1 is unavailable or generation fails.
 * Used by postizPublish, broadcastDelivery, and workflow posting steps.
 */

import { generateImage, isAvailable } from "./flux1.js";

/**
 * Generate a social media image from post content.
 * Returns an array of image URLs (0 or 1 element).
 */
export async function generateSocialImage(postContent: string): Promise<string[]> {
  try {
    if (!(await isAvailable())) return [];

    // Build a simple image prompt from the post content
    const truncated = postContent.slice(0, 200).replace(/[#@]\S+/g, "").trim();
    const prompt = `Professional, modern social media graphic for a tech company post about: ${truncated}. Clean design, blue and cyan color palette, minimalist style.`;

    const result = await generateImage({ prompt, width: 1024, height: 1024 });
    if (result.ok && result.imageUrl) {
      return [result.imageUrl];
    }
  } catch { /* best-effort */ }

  return [];
}
