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
 * Backend features restricted to pro / enterprise tiers.
 */
export const PRO_ONLY_FEATURES: ReadonlySet<string> = new Set([
  "calendar",
  "premium-screens",
]);

/**
 * Returns true if the given tier has access to pro-only features.
 */
export function hasPremiumAccess(tier: SeatTier): boolean {
  return tier === "pro" || tier === "enterprise";
}
