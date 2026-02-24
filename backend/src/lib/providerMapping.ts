/**
 * Single source of truth for platform → OAuth provider mapping.
 * Used by integrationsRoutes, listeningRoutes, and chatRoutes.
 *
 * Providers match the integration_provider enum:
 *   meta | google | x | tumblr | pinterest | linkedin
 */
export type OAuthProvider = "meta" | "google" | "x" | "tumblr" | "pinterest" | "linkedin" | "microsoft";

export const SUPPORTED_PROVIDERS: OAuthProvider[] = [
  "meta", "google", "x", "tumblr", "pinterest", "linkedin", "microsoft",
];

const EXACT: Record<string, OAuthProvider> = {
  // Meta
  facebook_page:          "meta",
  facebook_pages:         "meta",
  facebook_group:         "meta",
  facebook_ads:           "meta",
  instagram_business:     "meta",
  instagram:              "meta",
  threads_profile:        "meta",
  threads:                "meta",
  meta:                   "meta",

  // Google
  youtube_channel:        "google",
  youtube:                "google",
  youtube_studio:         "google",
  ga4_property:           "google",
  ga4:                    "google",
  google_analytics:       "google",
  google_business:        "google",
  google_ads:             "google",
  google_drive:           "google",
  google_docs:            "google",
  google_sheets:          "google",
  google_calendar:        "google",
  google_meet:            "google",
  google_search_console:  "google",
  gmail:                  "google",
  google:                 "google",

  // X / Twitter
  x_profile:              "x",
  twitter_profile:        "x",
  x:                      "x",
  twitter:                "x",

  // Tumblr
  tumblr_blog:            "tumblr",
  tumblr:                 "tumblr",

  // Pinterest
  pinterest_board:        "pinterest",
  pinterest:              "pinterest",

  // LinkedIn
  linkedin_page:          "linkedin",
  linkedin_profile:       "linkedin",
  linkedin:               "linkedin",

  // Microsoft
  microsoft:              "microsoft",
  outlook:                "microsoft",
  ms_calendar:            "microsoft",
  onedrive:               "microsoft",
  sharepoint:             "microsoft",
  teams:                  "microsoft",
};

/** Maps an asset platform string to the canonical OAuth provider, or null. */
export function providerForPlatform(p: string | null | undefined): OAuthProvider | null {
  if (!p) return null;
  const s = String(p).trim().toLowerCase().replace(/[\s-]/g, "_");
  if (!s) return null;

  // Try exact match first
  const exact = EXACT[s];
  if (exact) return exact;

  // Substring fallbacks for free-form values entered by users
  if (s.includes("facebook") || s.includes("instagram") || s.includes("threads")) return "meta";
  if (s.includes("youtube") || s.includes("google") || s.includes("gmail")) return "google";
  if (s === "x" || s.includes("twitter")) return "x";
  if (s.includes("tumblr")) return "tumblr";
  if (s.includes("pinterest")) return "pinterest";
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("microsoft") || s.includes("outlook") || s.includes("onedrive") || s.includes("sharepoint") || s === "teams") return "microsoft";

  return null;
}
