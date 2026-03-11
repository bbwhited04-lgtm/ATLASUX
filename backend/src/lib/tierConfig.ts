/**
 * Tier-based agent and workflow entitlements.
 * Used by both onboarding (seedTenantDefaults) and upgrade flows.
 */

export const TIER_AGENTS: Record<string, string[]> = {
  free_beta: ["atlas", "cheryl", "cornwall", "terry"],
  starter: [
    "atlas", "cheryl", "cornwall", "terry",
    "binky", "archy", "donna", "fran", "kelly",
    "link", "dwight", "emma", "timmy", "petra", "sunday",
  ],
  pro: [
    "atlas", "cheryl", "cornwall", "terry",
    "binky", "archy", "donna", "fran", "kelly",
    "link", "dwight", "emma", "timmy", "petra", "sunday",
    "reynolds", "venny", "victor", "mercer", "tina",
    "larry", "jenny", "benny", "lucy", "claire", "sandy",
    "porter", "frank", "daily-intel", "vision",
  ],
  enterprise: [], // handled by owner bypass
};

export const TIER_WORKFLOWS: Record<string, string[]> = {
  free_beta: [
    "WF-020", // Health Patrol
  ],
  starter: [
    "WF-020", "WF-093", "WF-094", "WF-095", "WF-096", "WF-097",
    "WF-098", "WF-099", "WF-100", "WF-101", "WF-103", "WF-104", "WF-105",
    "WF-200", "WF-201", "WF-202", "WF-203", "WF-204", "WF-205",
    "WF-206", "WF-207", "WF-208", "WF-209", "WF-210", "WF-212",
  ],
  pro: [
    "WF-020", "WF-031", "WF-033",
    "WF-093", "WF-094", "WF-095", "WF-096", "WF-097",
    "WF-098", "WF-099", "WF-100", "WF-101", "WF-102", "WF-103", "WF-104", "WF-105",
    "WF-106", "WF-107", "WF-108", "WF-111", "WF-122",
    "WF-200", "WF-201", "WF-202", "WF-203", "WF-204", "WF-205",
    "WF-206", "WF-207", "WF-208", "WF-209", "WF-210", "WF-211", "WF-212",
    "WF-220", "WF-221", "WF-222", "WF-223",
    "WF-300",
  ],
  enterprise: [], // handled by owner bypass
};
