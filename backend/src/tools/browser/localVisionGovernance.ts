/**
 * Local Vision Agent governance — extends browserGovernance.ts blocklists
 * with additional safety rules for the local vision agent.
 *
 * The local vision agent runs on the user's machine with their browser
 * sessions. Extra caution is needed because it has access to real
 * authenticated sessions (not headless sandboxed browsers).
 */

import { checkUrlAllowed, type UrlCheckResult } from "./browserGovernance.js";

// ── Extended blocklists for local vision ─────────────────────────────────────

/** Additional domain patterns blocked for local vision (beyond browserGovernance) */
const LOCAL_VISION_BLOCKED_DOMAINS: RegExp[] = [
  // Password managers
  /bitwarden\./i,
  /1password\./i,
  /lastpass\./i,
  /dashlane\./i,
  /keepass/i,
  /nordpass\./i,

  // Crypto wallets & exchanges
  /metamask\./i,
  /coinbase\./i,
  /binance\./i,
  /kraken\./i,
  /phantom\./i,
  /ledger\./i,
  /trezor\./i,
  /opensea\./i,
  /uniswap\./i,

  // Banking (extend from base)
  /chase\./i,
  /wellsfargo\./i,
  /bankofamerica\./i,
  /citibank\./i,
  /capitalone\./i,
  /usbank\./i,

  // Healthcare (extend from base)
  /patient\s*portal/i,
  /myhealth/i,
  /healthrecords/i,

  // Government (extend from base)
  /irs\.gov/i,
  /ssa\.gov/i,
  /dmv\./i,
];

/** Additional path patterns blocked for local vision */
const LOCAL_VISION_BLOCKED_PATHS: RegExp[] = [
  /\/wallet/i,
  /\/vault/i,
  /\/security[\-_]?settings/i,
  /\/two[\-_]?factor/i,
  /\/mfa/i,
  /\/recovery[\-_]?key/i,
  /\/api[\-_]?key/i,
  /\/token/i,
  /\/credentials/i,
];

// ── Session limits ───────────────────────────────────────────────────────────

/** Max duration for a single local vision session (5 minutes) */
export const MAX_SESSION_DURATION_MS = 5 * 60 * 1000;

/** Max actions per session */
export const MAX_ACTIONS_PER_SESSION = 30;

/** Max screenshot size in bytes (5 MB) */
export const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024;

// ── Check functions ──────────────────────────────────────────────────────────

/**
 * Check if a URL is allowed for local vision navigation.
 * Applies both base browserGovernance rules AND local vision-specific blocklists.
 */
export function checkLocalVisionUrlAllowed(url: string): UrlCheckResult {
  // First check base governance rules
  const baseCheck = checkUrlAllowed(url);
  if (!baseCheck.allowed) return baseCheck;

  // Then check local vision-specific rules
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { allowed: false, reason: "Invalid URL format" };
  }

  const hostname = parsed.hostname;
  const fullUrl = parsed.href;

  for (const pattern of LOCAL_VISION_BLOCKED_DOMAINS) {
    if (pattern.test(hostname) || pattern.test(fullUrl)) {
      return { allowed: false, reason: `Domain blocked by local vision governance: ${hostname}` };
    }
  }

  for (const pattern of LOCAL_VISION_BLOCKED_PATHS) {
    if (pattern.test(parsed.pathname)) {
      return {
        allowed: false,
        reason: `URL path blocked by local vision governance: ${parsed.pathname}`,
      };
    }
  }

  return { allowed: true };
}

/** Patterns that indicate visible credentials in screenshot text */
const CREDENTIAL_PATTERNS: RegExp[] = [
  /password[\s:=]/i,
  /secret[\s:=]/i,
  /api[_\s]?key[\s:=]/i,
  /access[_\s]?token[\s:=]/i,
  /private[_\s]?key[\s:=]/i,
  /bearer\s+[a-zA-Z0-9\-_.]+/i,
  /sk[-_][a-zA-Z0-9]{20,}/i,
  /ghp_[a-zA-Z0-9]{36}/i,
];

/**
 * Check OCR/vision text for visible credentials before uploading screenshot.
 * Returns true if credentials are detected (screenshot should be redacted or blocked).
 */
export function hasVisibleCredentials(visionText: string): boolean {
  return CREDENTIAL_PATTERNS.some((p) => p.test(visionText));
}

/**
 * Validate a local vision task configuration.
 */
export function validateLocalVisionTask(input: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const targetUrl = String(input.targetUrl ?? "").trim();
  const task = String(input.task ?? "").trim();

  if (!targetUrl) errors.push("targetUrl is required");
  if (!task) errors.push("task description is required");

  if (targetUrl) {
    const urlCheck = checkLocalVisionUrlAllowed(targetUrl);
    if (!urlCheck.allowed) {
      errors.push(`Target URL blocked: ${urlCheck.reason}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
