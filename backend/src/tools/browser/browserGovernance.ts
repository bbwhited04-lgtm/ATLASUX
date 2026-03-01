/**
 * Browser governance — SGL integration, URL blocklist, decision memo creation.
 *
 * Every browser session goes through SGL evaluation before execution.
 * HIGH-risk actions create decision memos requiring human approval.
 * Blocked URLs are never navigated to.
 */

import { prisma } from "../../db/prisma.js";
import { sglEvaluate, type Intent } from "../../core/sgl.js";
import {
  classifyActionRisk,
  calculateSessionRiskTier,
  type BrowserActionStep,
  type BrowserSessionConfig,
} from "./browserActions.js";

// ── URL Blocklist ────────────────────────────────────────────────────────────

/** Domain patterns that are never allowed for browser navigation */
const BLOCKED_DOMAIN_PATTERNS: RegExp[] = [
  /\.bank\./i,
  /paypal\.com/i,
  /stripe\.com\/dashboard/i,
  /\.gov$/i,
  /\.gov\//i,
  /portal\.healthcare/i,
  /epic\.com/i,
  /mychart\./i,
];

/** URL path patterns blocked unless explicitly approved via ToolProposal */
const BLOCKED_PATH_PATTERNS: RegExp[] = [
  /\/(login|signin|sign-in|auth|oauth|sso)\b/i,
  /\/password/i,
  /\/checkout/i,
  /\/payment/i,
];

export interface UrlCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a URL is allowed for browser navigation.
 * Returns { allowed: false, reason } if blocked.
 */
export function checkUrlAllowed(url: string, hasToolProposalApproval = false): UrlCheckResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: "Invalid URL format" };
  }

  const fullUrl = parsed.href;
  const hostname = parsed.hostname;

  // Check domain blocklist
  for (const pattern of BLOCKED_DOMAIN_PATTERNS) {
    if (pattern.test(hostname) || pattern.test(fullUrl)) {
      return { allowed: false, reason: `Domain blocked by governance policy: ${hostname}` };
    }
  }

  // Check path blocklist (can be overridden by explicit ToolProposal approval)
  if (!hasToolProposalApproval) {
    for (const pattern of BLOCKED_PATH_PATTERNS) {
      if (pattern.test(parsed.pathname)) {
        return {
          allowed: false,
          reason: `URL path contains restricted segment (${parsed.pathname}). Requires explicit ToolProposal approval.`,
        };
      }
    }
  }

  return { allowed: true };
}

// ── SGL Evaluation ───────────────────────────────────────────────────────────

/**
 * Evaluate a browser session request through SGL.
 * All browser tasks require REVIEW-level approval (human in the loop).
 */
export function evaluateBrowserIntent(config: BrowserSessionConfig) {
  const intent: Intent = {
    tenantId: config.tenantId,
    actor: "ATLAS",
    type: "BROWSER_TASK",
    payload: {
      agentId: config.agentId,
      targetUrl: config.targetUrl,
      purpose: config.purpose,
      actionCount: config.actions.length,
      riskTier: calculateSessionRiskTier(config.actions),
    },
    dataClass: "NONE",
    spendUsd: 0,
  };
  return sglEvaluate(intent);
}

// ── Decision Memo Creation ───────────────────────────────────────────────────

/**
 * Create a decision memo for a browser session that needs human approval.
 * Returns the memo ID.
 */
export async function createBrowserSessionMemo(
  tenantId: string,
  sessionId: string,
  config: BrowserSessionConfig,
): Promise<string> {
  const riskTier = calculateSessionRiskTier(config.actions);
  const actionSummary = config.actions
    .map((a, i) => {
      const risk = classifyActionRisk(a);
      return `  ${i + 1}. [${risk.toUpperCase()}] ${a.type}: ${a.description}`;
    })
    .join("\n");

  const memo = await prisma.decisionMemo.create({
    data: {
      tenantId,
      agent: config.agentId,
      title: `Browser Session — ${config.purpose}`,
      rationale: [
        `Agent ${config.agentId} requests a browser session on ${config.targetUrl}`,
        `Purpose: ${config.purpose}`,
        `Risk tier: ${riskTier}`,
        `Actions planned (${config.actions.length}):`,
        actionSummary,
      ].join("\n"),
      riskTier,
      requiresApproval: true,
      status: "PROPOSED",
      payload: JSON.parse(JSON.stringify({
        sessionId,
        targetUrl: config.targetUrl,
        agentId: config.agentId,
        intentId: config.intentId,
        actions: config.actions,
      })),
    },
  });

  return memo.id;
}

/**
 * Create a decision memo for a specific HIGH-risk action within a running session.
 * Used when the session reaches a submit or destructive action.
 */
export async function createActionApprovalMemo(
  tenantId: string,
  sessionId: string,
  action: BrowserActionStep,
  actionIndex: number,
  screenshotPath?: string,
): Promise<string> {
  const risk = classifyActionRisk(action);
  const memo = await prisma.decisionMemo.create({
    data: {
      tenantId,
      agent: "atlas",
      title: `Browser Action Approval — ${action.type}: ${action.description}`,
      rationale: [
        `Action #${actionIndex + 1} in browser session ${sessionId}`,
        `Type: ${action.type}`,
        `Target: ${action.target ?? "(page-level)"}`,
        `Value: ${action.value ?? "(none)"}`,
        `Risk: ${risk.toUpperCase()}`,
        `Description: ${action.description}`,
        screenshotPath ? `\nCurrent page screenshot: ${screenshotPath}` : "",
      ].filter(Boolean).join("\n"),
      riskTier: 3,
      requiresApproval: true,
      status: "PROPOSED",
      payload: JSON.parse(JSON.stringify({
        sessionId,
        actionIndex,
        action,
        screenshotPath: screenshotPath ?? null,
      })),
    },
  });

  return memo.id;
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface SessionValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a browser session configuration before execution.
 * Checks URL allowlist, action limits, blocked actions, etc.
 */
export function validateSessionConfig(config: BrowserSessionConfig): SessionValidation {
  const errors: string[] = [];

  // URL check
  const urlCheck = checkUrlAllowed(config.targetUrl);
  if (!urlCheck.allowed) {
    errors.push(`Target URL blocked: ${urlCheck.reason}`);
  }

  // Action limit
  if (config.actions.length > 30) {
    errors.push(`Too many actions (${config.actions.length}). Maximum is 30 per session.`);
  }

  if (config.actions.length === 0) {
    errors.push("At least one action is required.");
  }

  // Check for blocked actions (password/payment fields)
  for (let i = 0; i < config.actions.length; i++) {
    const action = config.actions[i];
    const risk = classifyActionRisk(action);
    if (risk === "blocked") {
      errors.push(
        `Action #${i + 1} (${action.type}: ${action.description}) is BLOCKED — ` +
        `password/payment field interaction is never allowed.`,
      );
    }

    // Also check navigate targets within the action list
    if (action.type === "navigate" && action.target) {
      const navCheck = checkUrlAllowed(action.target);
      if (!navCheck.allowed) {
        errors.push(`Action #${i + 1} navigate to blocked URL: ${navCheck.reason}`);
      }
    }
  }

  // Purpose required
  if (!config.purpose?.trim()) {
    errors.push("Session purpose is required.");
  }

  return { valid: errors.length === 0, errors };
}
