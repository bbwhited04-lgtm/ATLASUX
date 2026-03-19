/**
 * Query Classifier — decides how much context a question needs
 * and which KB tiers to search.
 *
 * Context tiers:
 *   SKILL_ONLY    → Answer from SKILL.md alone. No DB, no LLM overhead.
 *   HOT_CACHE     → Governance + agent docs from memory cache. No full RAG.
 *   FULL_RAG      → Full KB query + relevant search. Novel or complex questions.
 *   DIRECT        → No KB needed at all. Pure task execution.
 *
 * Search tiers (Pinecone namespaces):
 *   public        → Product docs, guides, comparisons (all tenants)
 *   internal      → Governance, policies, agent comms (platform owner only)
 *   tenant        → Customer configs, agent-scoped docs, org memories
 */

export type QueryTier = "SKILL_ONLY" | "HOT_CACHE" | "FULL_RAG" | "DIRECT";

export type QuerySource = "voice" | "chat" | "engine" | "admin";

type ClassifyResult = {
  tier: QueryTier;
  reason: string;
  searchTiers: Array<"public" | "internal" | "tenant">;
};

// Default search tiers by query source
const DEFAULT_SEARCH_TIERS: Record<QuerySource, Array<"public" | "internal" | "tenant">> = {
  voice: ["public", "tenant"],
  chat: ["public", "tenant"],
  engine: ["public", "internal", "tenant"],
  admin: ["public", "internal"],
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

// Patterns that need organizational memory — always route to FULL_RAG
const ORG_MEMORY_PATTERNS: RegExp[] = [
  /\b(what (do|does|did) (we|the company|the org|atlas) (know|prefer|like|want|think|learn))\b/i,
  /\b(past (experience|decision|outcome|result)|lessons?\s+learned)\b/i,
  /\b(what worked|what didn.t work|what failed|how did .+ (go|turn out))\b/i,
  /\b(company (preference|culture|pattern|history))\b/i,
  /\b(org(anizational)?\s+(memory|knowledge|intelligence|insight))\b/i,
  /\b(tribal knowledge|institutional (memory|knowledge))\b/i,
  /\b(recurring (issue|problem|theme|pattern))\b/i,
  /\b(decision (outcome|result|history)|outcome of)\b/i,
];

// Patterns that need playbook strategic content — route to FULL_RAG
const PLAYBOOK_PATTERNS: RegExp[] = [
  /\b(playbook|strategic (review|plan|framework|audit))\b/i,
  /\b(pricing (strategy|model|tier|validation)|unit economics|revenue (model|projection))\b/i,
  /\b(launch (plan|strategy|engine)|first (10 )?customers|go.to.market|gtm)\b/i,
  /\b(lucy.*(edge case|spec|requirement|call script))\b/i,
  /\b(mercer.*(compliance|script|outbound|cold call))\b/i,
  /\b(market sizing|competitive (intel|analysis)|positioning)\b/i,
  /\b(onboarding (flow|strategy)|churn (prevention|rate)|retention strategy)\b/i,
  /\b(mvp (scope|framework)|what (to|should we) build|feature priorit)\b/i,
  /\b(blind spot|stress test|edge case.*(business|product))\b/i,
  /\b(founder.?s? playbook|consulting framework|jtbd|porter.?s?|blue ocean)\b/i,
  /\b(conversion (blind spot|problem|fix)|landing page (strategy|fix|audit))\b/i,
];

// Patterns that indicate a direct task — no KB needed
const DIRECT_PATTERNS: RegExp[] = [
  /^(summarize|translate|proofread|fix|edit|rewrite|format|clean up|improve)\b/i,
  /^(count|calculate|convert|list|sort|rank)\b/i,
  /\b(this text|the following|above|below)\b.{0,30}\b(summarize|rewrite|translate|fix)\b/i,
];

export function classifyQuery(query: string, source?: QuerySource): ClassifyResult {
  const searchTiers = DEFAULT_SEARCH_TIERS[source ?? "engine"];

  if (!query || query.trim().length < 3) {
    return { tier: "HOT_CACHE", reason: "empty or very short query", searchTiers };
  }

  const q = query.trim();

  // Direct tasks — no KB at all
  for (const pattern of DIRECT_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "DIRECT", reason: `matched direct pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  // Org memory queries — need vector search (FULL_RAG)
  for (const pattern of ORG_MEMORY_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "FULL_RAG", reason: `matched org-memory pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  // Playbook strategic queries — need full KB search to find playbook docs
  for (const pattern of PLAYBOOK_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "FULL_RAG", reason: `matched playbook pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  // SKILL.md-resolvable
  for (const pattern of SKILL_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "SKILL_ONLY", reason: `matched skill pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  // Hot cache resolvable
  for (const pattern of HOT_CACHE_PATTERNS) {
    if (pattern.test(q)) {
      return { tier: "HOT_CACHE", reason: `matched cache pattern: ${pattern.source.slice(0, 40)}`, searchTiers };
    }
  }

  // Default: full RAG for novel questions
  return { tier: "FULL_RAG", reason: "no pattern matched — novel question", searchTiers };
}
