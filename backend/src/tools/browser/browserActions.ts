/**
 * Browser action type definitions and risk classification.
 *
 * Every browser action is typed, risk-scored, and auditable.
 * HIGH-risk actions (submit, destructive clicks) require decision memo approval.
 * BLOCKED actions (password/payment fields) are never executed.
 */

// ── Action Types ─────────────────────────────────────────────────────────────

export type BrowserActionType =
  | "navigate"
  | "click"
  | "type"
  | "extract"
  | "screenshot"
  | "submit"
  | "scroll";

export type RiskLevel = "low" | "medium" | "high" | "blocked";

export interface BrowserActionStep {
  type: BrowserActionType;
  target?: string;      // CSS selector or URL
  value?: string;       // text to type or extraction prompt
  description: string;  // human-readable for audit
}

export interface BrowserActionResult {
  type: BrowserActionType;
  target?: string;
  result: any;
  screenshotPath?: string;
  domSnapshot?: string;
  approved: boolean;
  riskLevel: RiskLevel;
  error?: string;
}

export interface BrowserSessionConfig {
  tenantId: string;
  agentId: string;
  intentId: string;
  targetUrl: string;
  purpose: string;
  actions: BrowserActionStep[];
}

export interface BrowserSessionResult {
  sessionId: string;
  status: "completed" | "failed" | "paused_approval";
  actions: BrowserActionResult[];
  extractedData: any;
  error?: string;
}

// ── Risk Classification ──────────────────────────────────────────────────────

/** Patterns that indicate a destructive or state-changing click */
const DESTRUCTIVE_CLICK_PATTERNS = [
  /delete/i, /remove/i, /purchase/i, /buy/i, /confirm/i,
  /submit/i, /checkout/i, /pay/i, /approve/i, /cancel.*subscription/i,
];

/** Patterns that indicate a search-only type action (low risk) */
const SEARCH_TYPE_PATTERNS = [
  /search/i, /filter/i, /find/i, /query/i, /look.*up/i,
];

/** Patterns indicating password or payment input (always blocked) */
const BLOCKED_FIELD_PATTERNS = [
  /password/i, /passwd/i, /secret/i, /pin/i,
  /card.*number/i, /cvv/i, /cvc/i, /expir/i,
  /credit.*card/i, /debit.*card/i, /routing/i, /account.*number/i,
  /ssn/i, /social.*security/i,
];

/**
 * Classify the risk level of a browser action.
 */
export function classifyActionRisk(action: BrowserActionStep): RiskLevel {
  const { type, target, value, description } = action;
  const combined = `${target ?? ""} ${value ?? ""} ${description}`;

  switch (type) {
    case "navigate":
    case "screenshot":
    case "scroll":
    case "extract":
      return "low";

    case "click": {
      if (DESTRUCTIVE_CLICK_PATTERNS.some((p) => p.test(combined))) return "high";
      return "low";
    }

    case "type": {
      if (BLOCKED_FIELD_PATTERNS.some((p) => p.test(combined))) return "blocked";
      if (SEARCH_TYPE_PATTERNS.some((p) => p.test(description))) return "low";
      return "medium";
    }

    case "submit":
      return "high";

    default:
      return "medium";
  }
}

/**
 * Calculate the overall risk tier (1–3) for a session based on its planned actions.
 * Tier 1 = all low, Tier 2 = any medium, Tier 3 = any high.
 */
export function calculateSessionRiskTier(actions: BrowserActionStep[]): number {
  let maxRisk = 0;
  for (const action of actions) {
    const level = classifyActionRisk(action);
    if (level === "blocked") return 3;
    if (level === "high")    maxRisk = Math.max(maxRisk, 3);
    if (level === "medium")  maxRisk = Math.max(maxRisk, 2);
    if (level === "low")     maxRisk = Math.max(maxRisk, 1);
  }
  return maxRisk || 1;
}

/**
 * Returns true if the action requires decision memo approval before execution.
 */
export function requiresApproval(action: BrowserActionStep): boolean {
  const risk = classifyActionRisk(action);
  return risk === "high";
}

/**
 * Returns true if the action is permanently blocked (password/payment).
 */
export function isBlocked(action: BrowserActionStep): boolean {
  return classifyActionRisk(action) === "blocked";
}

// ── Hard Limits ──────────────────────────────────────────────────────────────

export const BROWSER_LIMITS = {
  /** Max session duration in milliseconds (5 minutes) */
  MAX_SESSION_DURATION_MS: 5 * 60 * 1000,
  /** Max actions per session */
  MAX_ACTIONS_PER_SESSION: 30,
  /** Max concurrent sessions per tenant */
  MAX_CONCURRENT_SESSIONS: 2,
  /** Screenshot storage path template */
  SCREENSHOT_PATH_TEMPLATE: "browser-sessions/{tenantId}/{sessionId}/{actionIndex}.png",
} as const;
