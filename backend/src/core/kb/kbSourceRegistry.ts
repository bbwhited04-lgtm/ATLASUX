/**
 * KB Source Registry — maps article prefixes to external search queries
 * for automated freshness checking and content injection.
 */

export type SourceConfig = {
  /** Glob-like prefix to match article filenames (e.g. "llm-provider-*") */
  pattern: string;
  /** Search queries to find fresh content. {slug} replaced with article slug. */
  queries: string[];
  /** Max age in days before article is considered stale */
  maxAgeDays: number;
  /** Which LLM to use for patching: "cheap" (DeepSeek) or "quality" (Sonnet) */
  patchModel: "cheap" | "quality";
};

/**
 * Source registry — defines freshness rules per article category.
 * Add new entries as KB grows. Pattern matching is prefix-based.
 */
export const SOURCE_REGISTRY: SourceConfig[] = [
  // ── LLM Providers (change frequently — pricing, models, features) ──
  {
    pattern: "llm-provider-*",
    queries: [
      "{provider} AI model updates pricing 2026",
      "{provider} new model release announcement",
    ],
    maxAgeDays: 14,
    patchModel: "cheap",
  },
  {
    pattern: "llm-cost-*",
    queries: [
      "LLM API pricing comparison 2026",
      "AI model cost per token latest",
    ],
    maxAgeDays: 14,
    patchModel: "cheap",
  },
  {
    pattern: "llm-*",
    queries: [
      "{topic} large language model latest developments",
    ],
    maxAgeDays: 30,
    patchModel: "cheap",
  },

  // ── KB Architecture (evolves with research) ──
  {
    pattern: "kb-*",
    queries: [
      "{topic} knowledge base architecture 2026",
      "{topic} RAG best practices latest",
    ],
    maxAgeDays: 30,
    patchModel: "cheap",
  },

  // ── Image Gen (platforms update features/pricing frequently) ──
  {
    pattern: "image-gen/*",
    queries: [
      "{platform} AI image generation updates features 2026",
      "{platform} pricing changes new features",
    ],
    maxAgeDays: 21,
    patchModel: "cheap",
  },

  // ── Video Gen ──
  {
    pattern: "video-gen/*",
    queries: [
      "{platform} AI video generation updates 2026",
      "{platform} new features capabilities",
    ],
    maxAgeDays: 21,
    patchModel: "cheap",
  },

  // ── API Cost articles (prices change constantly) ──
  {
    pattern: "api-cost-*",
    queries: [
      "{topic} API pricing comparison 2026",
      "AI API cost analysis latest",
    ],
    maxAgeDays: 14,
    patchModel: "quality",
  },

  // ── Tools & MCP ──
  {
    pattern: "tools-*",
    queries: ["{topic} AI developer tools updates 2026"],
    maxAgeDays: 30,
    patchModel: "cheap",
  },
  {
    pattern: "mcp-*",
    queries: [
      "Model Context Protocol MCP updates 2026",
      "MCP server ecosystem latest",
    ],
    maxAgeDays: 21,
    patchModel: "cheap",
  },

  // ── Workflows ──
  {
    pattern: "workflows-*",
    queries: ["{topic} AI workflow automation latest"],
    maxAgeDays: 30,
    patchModel: "cheap",
  },

  // ── Support articles (stable, rarely change) ──
  {
    pattern: "support/*",
    queries: [],
    maxAgeDays: 90,
    patchModel: "cheap",
  },

  // ── Legal/compliance (change with regulation) ──
  {
    pattern: "law-*",
    queries: ["{topic} AI regulation law update 2026"],
    maxAgeDays: 60,
    patchModel: "quality",
  },

  // ── MBA/Education (stable reference material) ──
  {
    pattern: "mba-*",
    queries: [],
    maxAgeDays: 180,
    patchModel: "cheap",
  },
  {
    pattern: "edu-*",
    queries: [],
    maxAgeDays: 180,
    patchModel: "cheap",
  },
];

/**
 * Find the source config that matches an article filename.
 * Returns first match (most specific patterns should be listed first).
 */
export function findSourceConfig(filename: string): SourceConfig | null {
  for (const config of SOURCE_REGISTRY) {
    const pattern = config.pattern;
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      if (filename.startsWith(prefix)) return config;
    } else if (pattern.includes("/*")) {
      const dir = pattern.split("/")[0];
      if (filename.includes(dir)) return config;
    } else if (filename === pattern) {
      return config;
    }
  }
  return null;
}

/**
 * Extract topic/provider/platform name from article slug for query interpolation.
 */
export function extractTopicFromSlug(slug: string): string {
  const cleaned = slug
    .replace(/^llm-provider-/, "")
    .replace(/^llm-/, "")
    .replace(/^kb-/, "")
    .replace(/^api-cost-/, "")
    .replace(/^tools-/, "")
    .replace(/^mcp-/, "")
    .replace(/^workflows-/, "")
    .replace(/^law-/, "")
    .replace(/^ai-/, "");
  return cleaned.replace(/-/g, " ");
}

/**
 * Build search queries for an article by interpolating topic into templates.
 */
export function buildQueries(config: SourceConfig, slug: string): string[] {
  const topic = extractTopicFromSlug(slug);
  return config.queries.map((q) =>
    q.replace("{provider}", topic)
      .replace("{platform}", topic)
      .replace("{topic}", topic)
  );
}
