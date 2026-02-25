/**
 * Query Classifier — decides how much context a question needs.
 *
 * Before firing a full KB RAG query + LLM call, classify the question.
 * Most agent tasks are routine — they don't need 60,000 chars of context.
 *
 * Tiers:
 *   SKILL_ONLY    → Answer from SKILL.md alone. No DB, no LLM overhead.
 *                   e.g., "draft a tweet", "what hashtags should I use"
 *
 *   HOT_CACHE     → Governance + agent docs from memory cache. No full RAG.
 *                   e.g., "what is Atlas UX?", "who does Kelly report to?"
 *
 *   FULL_RAG      → Full KB query + relevant search. Novel or complex questions.
 *                   e.g., "what's the OpenClaw situation?", "what's our pricing?"
 *
 *   DIRECT        → No KB needed at all. Pure task execution.
 *                   e.g., "summarize this text", "translate this"
 */

export type QueryTier = "SKILL_ONLY" | "HOT_CACHE" | "FULL_RAG" | "DIRECT";

type ClassifyResult = {
  tier: QueryTier;
  reason: string;
};

// Patterns that can be answered from SKILL.md alone (agent knows how to do this)
const SKILL_PATTERNS: RegExp[] = [
  /\b(draft|write|create|generate|make)\b.{0,40}\b(post|tweet|thread|caption|pin|reel|tiktok|video script|description|hashtag|hook)\b/i,
  /\b(what hashtags|which hashtags|suggest hashtags|hashtag strategy)\b/i,
  /\b(best time|optimal time|when (to|should) post)\b/i,
  /\b(content mix|posting frequency|how often)\b/i,
  /\b(format (for|on)|caption (for|on)|post (for|on))\b.{0,30}\b(x|twitter|facebook|linkedin|tiktok|instagram|reddit|tumblr|pinterest|threads)\b/i,
  /\b(hook formula|hook for|opening line|first line)\b/i,
  /\b(what (can|does|should) (i|kelly|fran|timmy|dwight|link|cornwall|donna|reynolds|terry|penny) (do|post|write|create))\b/i,
];

// Patterns that need governance + agent docs (hot cache is enough)
const HOT_CACHE_PATTERNS: RegExp[] = [
  /\b(what is atlas|what does atlas|who is atlas|explain atlas)\b/i,
  /\b(who (is|does|runs|manages|handles))\b.{0,50}\b(kelly|fran|timmy|dwight|link|cornwall|donna|reynolds|terry|penny|archy|venny|emma|binky|atlas|petra|sandy|claire|porter|frank|mercer|tina|larry|cheryl|sunday|victor)\b/i,
  /\b(agent (role|responsibility|job|email|report))\b/i,
  /\b(org chart|team structure|who reports to)\b/i,
  /\b(what (workflow|wf)-?\d+)\b/i,
  /\b(brand voice|tone of voice|how (we|atlas) (sound|talk|write))\b/i,
  /\b(policy|rule|guideline|protocol)\b/i,
  /\b(trust|transparency|disclosure|ai disclosure)\b/i,
  /\b(source verification|freshness|how (old|recent) (is|are))\b/i,
];

// Patterns that indicate a direct task — no KB needed
const DIRECT_PATTERNS: RegExp[] = [
  /^(summarize|translate|proofread|fix|edit|rewrite|format|clean up|improve)\b/i,
  /^(count|calculate|convert|list|sort|rank)\b/i,
  /\b(this text|the following|above|below)\b.{0,30}\b(summarize|rewrite|translate|fix)\b/i,
];

export function classifyQuery(query: string): ClassifyResult {
  if (!query || query.trim().length < 3) {
    return { tier: "HOT_CACHE", reason: "empty or very short query" };
  }

  const q = query.trim();

  // Direct tasks — no KB at all
  for (const pattern of DIRECT_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "DIRECT", reason: `matched direct pattern: ${pattern.source.slice(0, 40)}` };
    }
  }

  // SKILL.md-resolvable
  for (const pattern of SKILL_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "SKILL_ONLY", reason: `matched skill pattern: ${pattern.source.slice(0, 40)}` };
    }
  }

  // Hot cache resolvable
  for (const pattern of HOT_CACHE_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "HOT_CACHE", reason: `matched cache pattern: ${pattern.source.slice(0, 40)}` };
    }
  }

  // Default: full RAG for novel questions
  return { tier: "FULL_RAG", reason: "no pattern matched — novel question" };
}
