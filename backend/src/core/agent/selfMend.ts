/**
 * Self-Mending LLM — Pre-delivery validation layer for agent outputs.
 *
 * Sits between LLM generation and Slack/action delivery. Catches:
 *   1. Echo chamber — agent parrots what others already said
 *   2. Duplicate intel — same news story posted multiple times
 *   3. Phantom capabilities — claims about features that don't exist
 *   4. Invalid WF references — citing workflow numbers that don't exist
 *   5. Invented concepts — pseudo-academic language with no grounding
 *
 * Every check returns a MendVerdict. If any check fails, the message is
 * either BLOCKED (don't post), REWRITTEN (fix inline), or FLAGGED (post
 * with warning). The mending decision is logged to audit_log.
 */

import { prisma } from "../../db/prisma.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type MendAction = "PASS" | "BLOCK" | "REWRITE" | "FLAG";

export interface MendVerdict {
  action: MendAction;
  reasons: MendReason[];
  originalText: string;
  mendedText?: string; // Only set if action is REWRITE
  score: number;       // 0-100, lower = more problematic
}

export interface MendReason {
  check: string;
  severity: "critical" | "warning" | "info";
  detail: string;
  evidence?: string;
}

// ── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  /** Jaccard similarity threshold for echo detection (0-1) */
  ECHO_SIMILARITY_THRESHOLD: 0.55,
  /** How many recent messages to compare against */
  ECHO_LOOKBACK_COUNT: 30,
  /** Minimum message length to check (skip short messages) */
  MIN_CHECK_LENGTH: 80,
  /** Hours to look back for duplicate intel */
  INTEL_DEDUP_HOURS: 24,
  /** Max times same topic can appear before blocking */
  INTEL_MAX_REPEATS: 2,
  /** WF numbers that exist on disk (defined in /workflows/) */
  DEFINED_WF_NUMBERS: new Set(["001", "002", "010", "020", "033", "035"]),
  /** WF numbers agents are allowed to reference (subset — only workflows they can trigger) */
  AGENT_ACCESSIBLE_WF: new Set(["001", "002", "033", "035"]),
  /** Score thresholds */
  BLOCK_THRESHOLD: 30,
  FLAG_THRESHOLD: 60,
};

// ── Tokenizer helpers ────────────────────────────────────────────────────────

/** Extract significant tokens (3+ chars, lowercased, no stop words) */
function tokenize(text: string): Set<string> {
  const STOP_WORDS = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "has",
    "her", "was", "one", "our", "out", "its", "his", "how", "did", "get",
    "let", "say", "she", "too", "use", "way", "who", "did", "got", "had",
    "may", "new", "now", "old", "see", "few", "also", "back", "been",
    "call", "come", "each", "find", "from", "give", "good", "have", "help",
    "here", "high", "just", "keep", "know", "last", "long", "look", "made",
    "make", "many", "more", "most", "much", "must", "name", "need", "next",
    "only", "over", "part", "plan", "play", "same", "show", "side", "some",
    "such", "sure", "take", "tell", "than", "that", "them", "then", "they",
    "this", "time", "turn", "very", "want", "well", "what", "when", "will",
    "with", "work", "year", "your", "been", "being", "could", "every",
    "first", "about", "after", "again", "which", "their", "there", "these",
    "those", "through", "would", "other", "should", "think", "think",
    "really", "actually", "pretty", "something", "thinking", "noticed",
    "getting", "making", "feels", "like", "into", "were", "have", "just",
  ]);

  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP_WORDS.has(t))
  );
}

/** Jaccard similarity between two token sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ── Check 1: Echo Chamber Detection ──────────────────────────────────────────

async function checkEchoChamber(
  text: string,
  channelName: string,
  agentId: string,
  tenantId: string,
): Promise<MendReason[]> {
  const reasons: MendReason[] = [];

  // Fetch recent messages from the same channel (excluding this agent)
  const recentMessages = await prisma.slackMessage.findMany({
    where: {
      tenantId,
      channelName,
      isAgent: true,
      createdAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // last 4 hours
    },
    orderBy: { createdAt: "desc" },
    take: CONFIG.ECHO_LOOKBACK_COUNT,
    select: { text: true, username: true, createdAt: true },
  });

  if (recentMessages.length === 0) return reasons;

  const myTokens = tokenize(text);
  let echoCount = 0;
  let highestSimilarity = 0;
  let echoSource = "";

  for (const msg of recentMessages) {
    const msgTokens = tokenize(msg.text);
    const similarity = jaccardSimilarity(myTokens, msgTokens);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      echoSource = msg.username ?? "unknown";
    }

    if (similarity >= CONFIG.ECHO_SIMILARITY_THRESHOLD) {
      echoCount++;
    }
  }

  if (echoCount >= 3) {
    reasons.push({
      check: "echo_chamber",
      severity: "critical",
      detail: `Message is ${Math.round(highestSimilarity * 100)}% similar to ${echoCount} recent messages in #${channelName}. Echo chamber detected.`,
      evidence: `Highest match: @${echoSource} (${Math.round(highestSimilarity * 100)}%)`,
    });
  } else if (echoCount >= 1) {
    reasons.push({
      check: "echo_chamber",
      severity: "warning",
      detail: `Message is ${Math.round(highestSimilarity * 100)}% similar to ${echoCount} recent message(s) by @${echoSource}. Possible echo.`,
    });
  }

  return reasons;
}

// ── Check 2: Duplicate Intel Detection ───────────────────────────────────────

async function checkDuplicateIntel(
  text: string,
  channelName: string,
  tenantId: string,
): Promise<MendReason[]> {
  const reasons: MendReason[] = [];

  // Only check intel-style channels
  if (!channelName.includes("intel")) return reasons;

  // Extract headline-like phrases (quoted text or text after SIGNAL:)
  const signalMatch = text.match(/SIGNAL[:\s]+(.+?)(?:\n|$)/i);
  const headline = signalMatch?.[1]?.trim();
  if (!headline || headline.length < 10) return reasons;

  // Search for same headline in recent messages
  const headlineTokens = tokenize(headline);
  const recentIntel = await prisma.slackMessage.findMany({
    where: {
      tenantId,
      channelName,
      isAgent: true,
      createdAt: { gte: new Date(Date.now() - CONFIG.INTEL_DEDUP_HOURS * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { text: true, createdAt: true },
  });

  let duplicateCount = 0;
  for (const msg of recentIntel) {
    const msgSignal = msg.text.match(/SIGNAL[:\s]+(.+?)(?:\n|$)/i);
    if (!msgSignal) continue;
    const msgTokens = tokenize(msgSignal[1]);
    if (jaccardSimilarity(headlineTokens, msgTokens) > 0.6) {
      duplicateCount++;
    }
  }

  if (duplicateCount >= CONFIG.INTEL_MAX_REPEATS) {
    reasons.push({
      check: "duplicate_intel",
      severity: "critical",
      detail: `Intel signal "${headline.slice(0, 60)}..." has been posted ${duplicateCount} times in the last ${CONFIG.INTEL_DEDUP_HOURS}h. Duplicate blocked.`,
      evidence: `${duplicateCount} prior occurrences`,
    });
  }

  return reasons;
}

// ── Check 3: Phantom Capability Detection ────────────────────────────────────

const REAL_CAPABILITIES = new Set([
  "answer calls", "book appointments", "send sms", "slack notifications",
  "voice agent", "appointment booking", "call routing", "take messages",
  "send confirmations", "calendar integration", "stripe billing",
  "elevenlabs voice", "twilio sms", "audit trail", "audit log",
  "decision memo", "job queue", "engine loop", "kb search",
  "web search", "email sending", "credential vault",
  "social posting", "content drafting",
]);

const PHANTOM_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bwe (can|could) (literally )?show\b.*\breal[- ]?time\b/i, label: "real-time demo claims" },
  { pattern: /\bclients? (are|have been) (getting|seeing|receiving|asking|requesting)\b/i, label: "fabricated client interactions" },
  { pattern: /\bprospects? (are|seem to|always|have been) (asking|requesting|demanding|getting|seeing|receiving)\b/i, label: "fabricated prospect behavior" },
  { pattern: /\bI'?ve been (seeing|noticing|watching|thinking)\b.*\b(trend|pattern|more)\b/i, label: "fabricated trend observation" },
  { pattern: /\b(enterprise|compliance|legal) (teams?|officers?|clients?) (are|have been) (actually )?ask/i, label: "fabricated enterprise demand" },
  { pattern: /\bcould (actually |be )?(a |the )?massive\b/i, label: "speculative revenue claims" },
  { pattern: /\baccidentally building\b/i, label: "false serendipity narrative" },
];

function checkPhantomCapabilities(text: string): MendReason[] {
  const reasons: MendReason[] = [];

  for (const { pattern, label } of PHANTOM_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push({
        check: "phantom_capability",
        severity: "warning",
        detail: `Detected ${label} — agent may be fabricating observations or interactions that haven't occurred.`,
        evidence: text.match(pattern)?.[0]?.slice(0, 80),
      });
    }
  }

  return reasons;
}

// ── Check 4: Invalid WF Reference Validation ────────────────────────────────

function checkWfReferences(text: string): MendReason[] {
  const reasons: MendReason[] = [];
  const wfMatches = text.matchAll(/WF-(\d{3})/g);

  for (const match of wfMatches) {
    const wfNum = match[1];
    if (!CONFIG.DEFINED_WF_NUMBERS.has(wfNum)) {
      // WF number doesn't exist at all
      reasons.push({
        check: "invalid_wf_reference",
        severity: "critical",
        detail: `WF-${wfNum} does not exist. Defined workflows: ${[...CONFIG.DEFINED_WF_NUMBERS].map((n) => `WF-${n}`).join(", ")}.`,
        evidence: match[0],
      });
    } else if (!CONFIG.AGENT_ACCESSIBLE_WF.has(wfNum)) {
      // WF exists but agent shouldn't be casually referencing it
      reasons.push({
        check: "unauthorized_wf_reference",
        severity: "warning",
        detail: `WF-${wfNum} exists but agents don't have autonomous access to it. Only Billy can trigger it.`,
        evidence: match[0],
      });
    }
  }

  return reasons;
}

// ── Check 5: Invented Concept Detection ──────────────────────────────────────

const INVENTED_CONCEPT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(infrastructural nostalgia|digital ephemera|recursive transparency)\b/i, label: "pseudo-academic jargon" },
  { pattern: /\b(compliance moat|legal moat|documentation moat)\b/i, label: "invented strategic concept" },
  { pattern: /\b(the concept of|reading about|been studying)\s+"[^"]+"/i, label: "fabricated research reference" },
  { pattern: /\b(natural pipeline segmentation|compliance maturity)\b/i, label: "invented business framework" },
  { pattern: /\bblockchain-style\b.*\bwithout (the )?crypto\b/i, label: "misleading tech analogy" },
];

function checkInventedConcepts(text: string): MendReason[] {
  const reasons: MendReason[] = [];

  for (const { pattern, label } of INVENTED_CONCEPT_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push({
        check: "invented_concept",
        severity: "warning",
        detail: `Detected ${label} — agent is using language that sounds authoritative but has no grounding in real domain knowledge.`,
        evidence: text.match(pattern)?.[0]?.slice(0, 80),
      });
    }
  }

  return reasons;
}

// ── Score Calculator ─────────────────────────────────────────────────────────

function calculateScore(reasons: MendReason[]): number {
  let score = 100;
  for (const r of reasons) {
    switch (r.severity) {
      case "critical": score -= 30; break;
      case "warning":  score -= 15; break;
      case "info":     score -= 5;  break;
    }
  }
  return Math.max(0, Math.min(100, score));
}

// ── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Validate an agent message before delivery. Returns a verdict with
 * action (PASS/BLOCK/REWRITE/FLAG), reasons, and score.
 *
 * Call this BEFORE postAsAgent(). If verdict.action is BLOCK, don't post.
 * If REWRITE, use verdict.mendedText instead of the original.
 * If FLAG, post but log the warning.
 */
export async function mendCheck(
  text: string,
  agentId: string,
  channelName: string,
  tenantId: string,
): Promise<MendVerdict> {
  // Skip very short messages (reactions, ACKs, etc.)
  if (text.length < CONFIG.MIN_CHECK_LENGTH) {
    return { action: "PASS", reasons: [], originalText: text, score: 100 };
  }

  // Run all checks in parallel
  const [echoReasons, intelReasons] = await Promise.all([
    checkEchoChamber(text, channelName, agentId, tenantId),
    checkDuplicateIntel(text, channelName, tenantId),
  ]);

  const phantomReasons = checkPhantomCapabilities(text);
  const wfReasons = checkWfReferences(text);
  const conceptReasons = checkInventedConcepts(text);

  const allReasons = [
    ...echoReasons,
    ...intelReasons,
    ...phantomReasons,
    ...wfReasons,
    ...conceptReasons,
  ];

  const score = calculateScore(allReasons);
  const hasCritical = allReasons.some((r) => r.severity === "critical");

  let action: MendAction;
  let mendedText: string | undefined;

  if (score <= CONFIG.BLOCK_THRESHOLD || (hasCritical && allReasons.filter((r) => r.severity === "critical").length >= 2)) {
    action = "BLOCK";
  } else if (score <= CONFIG.FLAG_THRESHOLD) {
    // Attempt to rewrite — strip invalid WF references
    if (wfReasons.length > 0) {
      mendedText = text.replace(/WF-\d{3}/g, (match) => {
        const num = match.replace("WF-", "");
        return CONFIG.DEFINED_WF_NUMBERS.has(num) ? match : "[invalid-WF]";
      });
      action = "REWRITE";
    } else {
      action = "FLAG";
    }
  } else {
    action = "PASS";
  }

  const verdict: MendVerdict = {
    action,
    reasons: allReasons,
    originalText: text,
    mendedText,
    score,
  };

  // Log mending decisions to audit trail (non-blocking)
  if (action !== "PASS") {
    logMendDecision(verdict, agentId, channelName, tenantId).catch(() => {
      // Fail-open on audit logging — never block message delivery because logging failed
      console.error("[self-mend] Failed to log mending decision to audit trail");
    });
  }

  return verdict;
}

// ── Audit Logging ────────────────────────────────────────────────────────────

async function logMendDecision(
  verdict: MendVerdict,
  agentId: string,
  channelName: string,
  tenantId: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: `SELF_MEND_${verdict.action}`,
      actorType: "system",
      actorExternalId: "self-mend",
      entityType: "slack_message",
      message: `Self-mend ${verdict.action} for @${agentId} in #${channelName} (score: ${verdict.score})`,
      meta: {
        score: verdict.score,
        agentId,
        channelName,
        reasons: verdict.reasons.map((r) => ({
          check: r.check,
          severity: r.severity,
          detail: r.detail,
        })),
        textPreview: verdict.originalText.slice(0, 200),
        mendedPreview: verdict.mendedText?.slice(0, 200),
      },
    },
  });
}

// ── Stats ────────────────────────────────────────────────────────────────────

/**
 * Get self-mending stats for a tenant over a time period.
 */
export async function getMendStats(
  tenantId: string,
  hours: number = 24,
): Promise<{
  total: number;
  blocked: number;
  rewritten: number;
  flagged: number;
  topChecks: Array<{ check: string; count: number }>;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const logs = await prisma.auditLog.findMany({
    where: {
      tenantId,
      action: { startsWith: "SELF_MEND_" },
      createdAt: { gte: since },
    },
    select: { action: true, meta: true },
  });

  const stats = {
    total: logs.length,
    blocked: logs.filter((l) => l.action === "SELF_MEND_BLOCK").length,
    rewritten: logs.filter((l) => l.action === "SELF_MEND_REWRITE").length,
    flagged: logs.filter((l) => l.action === "SELF_MEND_FLAG").length,
    topChecks: [] as Array<{ check: string; count: number }>,
  };

  // Count check types
  const checkCounts = new Map<string, number>();
  for (const log of logs) {
    const meta = log.meta as any;
    if (meta?.reasons) {
      for (const r of meta.reasons) {
        checkCounts.set(r.check, (checkCounts.get(r.check) ?? 0) + 1);
      }
    }
  }
  stats.topChecks = [...checkCounts.entries()]
    .map(([check, count]) => ({ check, count }))
    .sort((a, b) => b.count - a.count);

  return stats;
}
