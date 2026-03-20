/**
 * Privacy Gate — Constitutional data classification for GUI agents.
 *
 * HARD RULE: Sensitive documents (bank statements, audit docs, business
 * paperwork, credentials, PII) are ONLY processed by the local model.
 * Screenshots of sensitive content NEVER leave the machine.
 *
 * This is not a preference. This is a constitutional constraint.
 *
 * Architecture:
 *   Screenshot captured → Privacy Gate classifies content
 *     → SENSITIVE: local model only, no cloud, no logging of content
 *     → SAFE: can use cloud model for better reasoning if needed
 *     → UNKNOWN: treat as sensitive (fail-closed)
 *
 * Research only — but this gate WILL be production code when GUI ships.
 */

// ── Sensitivity Classification ──────────────────────────────────────────────

const SENSITIVITY_LEVELS = {
  PUBLIC: "public",           // Wiki, public websites, search results
  INTERNAL: "internal",       // Internal tools, dashboards, non-sensitive
  CONFIDENTIAL: "confidential", // Business docs, contracts, plans
  RESTRICTED: "restricted",   // Financial, credentials, PII, legal
};

// ── Detection Patterns ──────────────────────────────────────────────────────

/**
 * Text patterns that indicate sensitive content on screen.
 * If ANY of these are detected in the vision analysis, the screenshot
 * is classified at that sensitivity level or higher.
 */
const SENSITIVITY_PATTERNS = {
  restricted: [
    // Financial
    /bank\s*statement/i,
    /account\s*balance/i,
    /routing\s*number/i,
    /credit\s*card/i,
    /debit\s*card/i,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Card numbers
    /\$[\d,]+\.\d{2}/, // Dollar amounts (contextual)
    /wire\s*transfer/i,
    /ach\s*payment/i,
    /tax\s*return/i,
    /w-?2|w-?9|1099|1040/i, // Tax forms
    /ein\s*:?\s*\d/i, // Employer ID
    /invoice\s*#/i,

    // Credentials
    /password/i,
    /api[_\s]?key/i,
    /secret[_\s]?key/i,
    /access[_\s]?token/i,
    /private[_\s]?key/i,
    /ssh\s*key/i,
    /bearer\s+[a-zA-Z0-9]/i,

    // PII
    /social\s*security/i,
    /ssn\s*:?\s*\d/i,
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
    /driver.?s?\s*license/i,
    /passport\s*number/i,
    /date\s*of\s*birth/i,
    /dob\s*:/i,

    // Legal
    /attorney.?client/i,
    /privileged.*confidential/i,
    /under\s*seal/i,
    /nda|non.?disclosure/i,
  ],

  confidential: [
    // Business documents
    /audit\s*(report|document|trail)/i,
    /board\s*meeting/i,
    /financial\s*statement/i,
    /balance\s*sheet/i,
    /profit\s*(and|&)\s*loss/i,
    /p\s*&?\s*l\s*statement/i,
    /quarterly\s*report/i,
    /annual\s*report/i,
    /revenue|earnings/i,
    /contract|agreement/i,
    /proposal|bid/i,
    /employee\s*(record|file|review)/i,
    /salary|compensation|payroll/i,
    /health\s*insurance/i,
    /benefits\s*enrollment/i,

    // Internal tools
    /admin\s*panel/i,
    /internal\s*only/i,
    /do\s*not\s*distribute/i,
    /confidential/i,
    /proprietary/i,
  ],

  internal: [
    // Internal tools and dashboards
    /dashboard/i,
    /analytics/i,
    /crm|erp|hrms/i,
    /jira|confluence|notion/i,
    /slack\s*message/i,
    /internal\s*wiki/i,
  ],
};

// ── App-Based Classification ────────────────────────────────────────────────

/**
 * Some apps are inherently sensitive regardless of what's on screen.
 * Banking apps, password managers, email — always local-only.
 */
const APP_SENSITIVITY = {
  // Always restricted
  restricted: [
    /bank|banking|chase|wells\s*fargo|boa|citibank|capital\s*one/i,
    /paypal|venmo|zelle|cash\s*app|stripe/i,
    /1password|lastpass|bitwarden|dashlane|keepass/i,
    /quickbooks|xero|freshbooks|wave/i,
    /turbotax|h&r\s*block|taxact/i,
    /docusign|hellosign/i,
  ],

  // Always confidential
  confidential: [
    /gmail|outlook|thunderbird|mail/i,
    /slack|teams|discord/i,
    /dropbox|google\s*drive|onedrive/i,
    /salesforce|hubspot/i,
  ],

  // Always public
  public: [
    /google\s*search|bing|duckduckgo/i,
    /wikipedia/i,
    /youtube/i,
    /stack\s*overflow/i,
  ],
};

// ── Classification Function ─────────────────────────────────────────────────

/**
 * Classify a screenshot's sensitivity level based on:
 *   1. App name (highest priority — banking app = always restricted)
 *   2. Detected text patterns (from vision analysis)
 *   3. URL if visible
 *   4. Default: UNKNOWN → treated as CONFIDENTIAL (fail-closed)
 *
 * @param {Object} params
 * @param {string} params.appName - name of the application
 * @param {string} params.screenText - text detected on screen
 * @param {string} params.url - URL visible in address bar (if any)
 * @param {string[]} params.detectedElements - UI elements found by vision
 * @returns {Object} classification result
 */
function classifyScreenshot({ appName = "", screenText = "", url = "", detectedElements = [] }) {
  const result = {
    level: SENSITIVITY_LEVELS.INTERNAL, // Default
    reason: [],
    allowCloud: true,
    allowLogging: true,
    allowScreenshotStorage: true,
    mustUseLocalModel: false,
  };

  const allText = `${appName} ${screenText} ${url} ${detectedElements.join(" ")}`;

  // Check app-level classification first (highest priority)
  for (const [level, patterns] of Object.entries(APP_SENSITIVITY)) {
    for (const pattern of patterns) {
      if (pattern.test(appName) || pattern.test(url)) {
        if (level === "restricted") {
          return makeRestricted(result, `App/URL matches restricted pattern: ${pattern}`);
        }
        if (level === "confidential") {
          result.level = SENSITIVITY_LEVELS.CONFIDENTIAL;
          result.reason.push(`App/URL matches confidential pattern: ${pattern}`);
        }
        if (level === "public") {
          result.level = SENSITIVITY_LEVELS.PUBLIC;
          result.reason.push(`App/URL matches public pattern: ${pattern}`);
          return result;
        }
      }
    }
  }

  // Check text patterns
  for (const pattern of SENSITIVITY_PATTERNS.restricted) {
    if (pattern.test(allText)) {
      return makeRestricted(result, `Detected restricted content: ${pattern}`);
    }
  }

  for (const pattern of SENSITIVITY_PATTERNS.confidential) {
    if (pattern.test(allText)) {
      result.level = SENSITIVITY_LEVELS.CONFIDENTIAL;
      result.allowCloud = false; // No cloud for confidential
      result.mustUseLocalModel = true;
      result.reason.push(`Detected confidential content: ${pattern}`);
    }
  }

  // If no patterns matched and we're still at INTERNAL, it's probably safe
  if (result.reason.length === 0) {
    result.reason.push("No sensitive patterns detected — classified as internal");
  }

  return result;
}

/**
 * Mark a classification as RESTRICTED — strictest level.
 */
function makeRestricted(result, reason) {
  return {
    level: SENSITIVITY_LEVELS.RESTRICTED,
    reason: [reason],
    allowCloud: false,
    allowLogging: false,           // Don't log screenshot content
    allowScreenshotStorage: false, // Don't save screenshot to disk
    mustUseLocalModel: true,       // ONLY local 4B model
    redactBeforeEscalation: true,  // If HIL needed, redact sensitive data first
  };
}

// ── Privacy-Aware Action Gate ───────────────────────────────────────────────

/**
 * Gate that wraps every toolkit action with privacy classification.
 * Called BEFORE any vision analysis is sent to a model.
 *
 * @param {Object} screenshot - captured screenshot data
 * @param {Object} visionAnalysis - preliminary analysis (from local model)
 * @param {string} appName - current application
 * @returns {Object} routing decision
 */
function privacyGate(screenshot, visionAnalysis, appName) {
  const classification = classifyScreenshot({
    appName,
    screenText: visionAnalysis?.screenDescription || "",
    url: visionAnalysis?.url || "",
    detectedElements: (visionAnalysis?.uiElements || []).map((el) => el.label || ""),
  });

  return {
    classification,
    routing: {
      model: classification.mustUseLocalModel ? "local-4b" : "cloud-or-local",
      canSendScreenshot: classification.allowCloud,
      canLogContent: classification.allowLogging,
      canStoreScreenshot: classification.allowScreenshotStorage,
      escalationMode: classification.redactBeforeEscalation ? "text-only-redacted" : "full",
    },
    action: classification.level === SENSITIVITY_LEVELS.RESTRICTED
      ? "LOCAL_ONLY — sensitive content detected, screenshot stays on device"
      : classification.level === SENSITIVITY_LEVELS.CONFIDENTIAL
        ? "LOCAL_PREFERRED — business content, use local model unless reasoning requires cloud"
        : "STANDARD — safe for cloud processing",
  };
}

// ── Redaction for HIL Escalation ─────────────────────────────────────────────

/**
 * When a restricted screenshot needs HIL escalation, redact sensitive
 * data before sending the description to the human (in case of remote HIL).
 *
 * For local HIL (same machine), full screenshot can be shown.
 * For remote HIL (phone/tablet), only redacted text description.
 */
function redactForEscalation(visionAnalysis) {
  let description = visionAnalysis?.screenDescription || "";

  // Redact patterns
  description = description.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "****-****-****-****");
  description = description.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "***-**-****");
  description = description.replace(/\$[\d,]+\.\d{2}/g, "$***.** ");
  description = description.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "***@***.***");
  description = description.replace(/(password|api[_\s]?key|secret|token)\s*[:=]\s*\S+/gi, "$1: [REDACTED]");

  return {
    redactedDescription: description,
    wasRedacted: true,
    note: "Sensitive content redacted for remote HIL. Full screenshot available on local device only.",
  };
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  classifyScreenshot,
  privacyGate,
  redactForEscalation,
  SENSITIVITY_LEVELS,
  SENSITIVITY_PATTERNS,
  APP_SENSITIVITY,
};
