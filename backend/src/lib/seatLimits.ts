/**
 * Seat tier configuration — defines limits per seat type.
 *
 * Pricing:
 *   free_beta  — $0/seat   (alpha testers)
 *   starter    — $19/seat/mo
 *   pro        — $49/seat/mo
 *   enterprise — custom
 */

export type SeatTier = "free_beta" | "starter" | "pro" | "enterprise";

export interface SeatLimits {
  /** Max tokens per day */
  tokenBudgetPerDay: number;
  /** Max storage in bytes */
  storageLimitBytes: number;
  /** Max API calls per minute */
  apiRatePerMinute: number;
  /** Max agents this user can interact with */
  agentLimit: number;
  /** Max jobs per day */
  jobsPerDay: number;
  /** Price in cents per month (for display/Stripe) */
  priceCentsMonthly: number;
}

export const SEAT_LIMITS: Record<SeatTier, SeatLimits> = {
  free_beta: {
    tokenBudgetPerDay: 50_000,
    storageLimitBytes: 500 * 1024 * 1024,   // 500 MB
    apiRatePerMinute: 30,
    agentLimit: 5,
    jobsPerDay: 10,
    priceCentsMonthly: 0,
  },
  starter: {
    tokenBudgetPerDay: 200_000,
    storageLimitBytes: 5 * 1024 * 1024 * 1024,  // 5 GB
    apiRatePerMinute: 60,
    agentLimit: 15,
    jobsPerDay: 50,
    priceCentsMonthly: 1900,  // $19
  },
  pro: {
    tokenBudgetPerDay: 1_000_000,
    storageLimitBytes: 25 * 1024 * 1024 * 1024, // 25 GB
    apiRatePerMinute: 120,
    agentLimit: 999,  // all agents
    jobsPerDay: 200,
    priceCentsMonthly: 4900,  // $49
  },
  enterprise: {
    tokenBudgetPerDay: Number.MAX_SAFE_INTEGER,
    storageLimitBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    apiRatePerMinute: 300,
    agentLimit: 999,
    jobsPerDay: Number.MAX_SAFE_INTEGER,
    priceCentsMonthly: 0,  // custom pricing
  },
};

/**
 * Get the seat limits for a user's tier. Defaults to free_beta.
 */
export function getLimits(seatType?: string): SeatLimits {
  return SEAT_LIMITS[(seatType as SeatTier) ?? "free_beta"] ?? SEAT_LIMITS.free_beta;
}

/**
 * Agents restricted to pro / enterprise tiers only.
 * free_beta and starter users cannot chat with or invoke these agents.
 */
export const PRO_ONLY_AGENTS: ReadonlySet<string> = new Set([
  "lucy",
  "claire",
  "sandy",
]);

/**
 * Agents available to free_beta users.
 * If a user is free_beta and the agent is NOT in this set, access is denied.
 * Owner/admin accounts bypass this entirely.
 */
export const FREE_BETA_AGENTS: ReadonlySet<string> = new Set([
  "atlas",       // President — orchestrator
  "cornwall",    // Pinterest
  "terry",       // Tumblr
  "cheryl",      // Customer Support
]);

/**
 * Workflows blocked for free_beta users.
 * ALL 200-series (publishing + analytics), executive workflows.
 */
export const FREE_BETA_BLOCKED_WORKFLOWS: ReadonlySet<string> = new Set([
  // Executive / internal workflows
  "WF-033",  // Daily-Intel Morning Brief
  "WF-106",  // Atlas Aggregation & Task Assign
  // Blog publishing (Reynolds writes to OUR blog)
  "WF-102",  // Blog SEO Platform Intel (Reynolds)
  "WF-108",  // Reynolds Blog Writer & Publisher
  "WF-122",  // SEO Rank Tracker (Reynolds)
  // ALL social publishing — no 200 series at all
  "WF-200",  // TikTok (Timmy)
  "WF-201",  // X/Twitter (Kelly)
  "WF-202",  // Facebook (Fran)
  "WF-203",  // Reddit (Donna)
  "WF-204",  // Threads (Dwight)
  "WF-205",  // LinkedIn (Link)
  "WF-206",  // Pinterest (Cornwall)
  "WF-207",  // Tumblr (Terry)
  "WF-208",  // YouTube (Venny)
  "WF-209",  // Mastodon (Emma)
  "WF-210",  // Instagram (Archy)
  "WF-211",  // Medium (Reynolds)
  "WF-212",  // Cross-Platform (Sunday)
  // ALL social analytics
  "WF-220",  // TikTok Analytics
  "WF-221",  // X Analytics
  "WF-222",  // Facebook Analytics
  "WF-223",  // LinkedIn Analytics
]);

/**
 * Backend features restricted to pro / enterprise tiers.
 */
export const PRO_ONLY_FEATURES: ReadonlySet<string> = new Set([
  "calendar",
  "meetings",
  "premium-screens",
  "browser",
  "local-vision",
]);

/**
 * Returns true if the given tier has access to pro-only features.
 */
export function hasPremiumAccess(tier: SeatTier): boolean {
  return tier === "pro" || tier === "enterprise";
}
