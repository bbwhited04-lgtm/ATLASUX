/**
 * Per-category gradient backgrounds for blog posts without a featured image.
 * Returns a CSS gradient string and a display label (category initial).
 */

const GRADIENTS: Record<string, string> = {
  updates:       "linear-gradient(135deg, #0ea5e9, #6366f1)",
  "ai":          "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "ai agents":   "linear-gradient(135deg, #8b5cf6, #f43f5e)",
  marketing:     "linear-gradient(135deg, #f59e0b, #ef4444)",
  engineering:   "linear-gradient(135deg, #06b6d4, #3b82f6)",
  strategy:      "linear-gradient(135deg, #10b981, #0ea5e9)",
  security:      "linear-gradient(135deg, #ef4444, #7c3aed)",
  productivity:  "linear-gradient(135deg, #f59e0b, #10b981)",
  data:          "linear-gradient(135deg, #3b82f6, #06b6d4)",
  social:        "linear-gradient(135deg, #ec4899, #f59e0b)",
  crm:           "linear-gradient(135deg, #6366f1, #0ea5e9)",
  operations:    "linear-gradient(135deg, #14b8a6, #6366f1)",
};

const FALLBACK_GRADIENT = "linear-gradient(135deg, #334155, #0f172a)";

const DEFAULT_COVER = "/blog/covers/default.png";

export function isDefaultCover(coverImage: string | undefined): boolean {
  if (!coverImage) return true;
  return coverImage === DEFAULT_COVER || coverImage.endsWith("/default.png");
}

export function categoryGradient(category: string): string {
  const key = category.toLowerCase().trim();
  return GRADIENTS[key] ?? FALLBACK_GRADIENT;
}

export function categoryInitial(category: string): string {
  return (category || "A").charAt(0).toUpperCase();
}
