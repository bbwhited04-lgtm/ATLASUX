# KB Injection Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically detect stale KB articles, fetch fresh content from external sources, patch articles with current information, and validate through the existing health pipeline — keeping 508+ articles evergreen without manual intervention.

**Architecture:** A cron-driven worker (`kbInjectionWorker.ts`) orchestrates three modules: a source registry that maps article prefixes to search queries, an injector that detects staleness + fetches + patches via LLM, and validation through the existing `kbEval`/`kbHealer` pipeline. Uses existing `webSearch.ts` (5-provider rotation) and `fetchUrlContent()` for content retrieval. DeepSeek for cheap patching, Sonnet reserved for critical articles only.

**Tech Stack:** TypeScript, existing `webSearch.ts`, `runLLM()` via `brainllm.ts`, `kbEval.ts`/`kbHealer.ts` for validation, Node.js fs for file operations, cron scheduling pattern from `kbEvalWorker.ts`.

---

## Chunk 1: Source Registry + Staleness Detection

### Task 1: Create KB Source Registry

**Files:**
- Create: `backend/src/core/kb/kbSourceRegistry.ts`

- [ ] **Step 1: Create the source registry module**

```typescript
// backend/src/core/kb/kbSourceRegistry.ts
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
  /** Optional: specific domains to search */
  domains?: string[];
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
      // Directory pattern like "image-gen/*"
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
 * "llm-provider-anthropic" → "anthropic"
 * "kb-vector-databases" → "vector databases"
 */
export function extractTopicFromSlug(slug: string): string {
  // Remove common prefixes
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: Clean, no errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/core/kb/kbSourceRegistry.ts
git commit -m "feat(kb): add source registry mapping articles to freshness queries"
```

---

### Task 2: Create KB Injector Core Module

**Files:**
- Create: `backend/src/core/kb/kbInjector.ts`

- [ ] **Step 1: Create the injector module with staleness detection, content fetching, and LLM patching**

```typescript
// backend/src/core/kb/kbInjector.ts
/**
 * KB Injector — detects stale articles, fetches fresh content,
 * patches via LLM, validates, and publishes.
 *
 * Safety: max patches per run, health score gate, audit log.
 * Never deletes — only updates/appends.
 */

import { readdir, readFile, writeFile, stat } from "fs/promises";
import path from "path";
import { searchWeb, fetchUrlContent } from "../../lib/webSearch.js";
import { runLLM } from "../engine/brainllm.js";
import { prisma } from "../../db/prisma.js";
import {
  findSourceConfig,
  buildQueries,
  type SourceConfig,
} from "./kbSourceRegistry.js";

const KB_ROOT = path.join(process.cwd(), "src", "kb");
const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Types ────────────────────────────────────────────────────────────────────

export type StaleArticle = {
  filePath: string;
  slug: string;
  section: string;
  ageInDays: number;
  maxAgeDays: number;
  config: SourceConfig;
};

export type FreshContent = {
  query: string;
  provider: string;
  sources: Array<{ title: string; url: string; snippet: string }>;
  fullText: string[]; // fetched content from top URLs
};

export type PatchResult = {
  slug: string;
  status: "patched" | "skipped" | "failed";
  reason: string;
  sectionsUpdated: number;
  contentDeltaPct: number; // % of content changed
  newReferences: string[];
  costUsd: number;
};

export type InjectionRunResult = {
  runId: string;
  startedAt: Date;
  durationMs: number;
  articlesScanned: number;
  staleFound: number;
  patchesAttempted: number;
  patchesApplied: number;
  patchesSkipped: number;
  patchesFailed: number;
  totalCostUsd: number;
  patches: PatchResult[];
};

// ── Staleness Detection ──────────────────────────────────────────────────────

/**
 * Scan KB directories and find articles past their maxAge.
 */
export async function detectStaleArticles(
  maxResults = 50,
): Promise<StaleArticle[]> {
  const stale: StaleArticle[] = [];
  const now = Date.now();

  // Scan each KB section
  const sections = ["agents", "image-gen", "video-gen", "support"];

  for (const section of sections) {
    const sectionPath = path.join(KB_ROOT, section);
    try {
      await scanDirectory(sectionPath, section, stale, now);
    } catch {
      // Section may not exist, skip
    }
  }

  // Sort by staleness (most stale first) and cap
  stale.sort((a, b) => (b.ageInDays - b.maxAgeDays) - (a.ageInDays - a.maxAgeDays));
  return stale.slice(0, maxResults);
}

async function scanDirectory(
  dirPath: string,
  section: string,
  stale: StaleArticle[],
  now: number,
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".") || entry.name.startsWith("tripwire-")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories (e.g. image-gen/dall-e-3/)
      await scanDirectory(fullPath, section, stale, now);
      continue;
    }

    if (!entry.name.endsWith(".md")) continue;

    const slug = entry.name.replace(/\.md$/, "");
    const config = findSourceConfig(
      section === "agents" ? slug : `${section}/${slug}`
    );

    if (!config || config.queries.length === 0) continue; // No freshness rule or no queries

    const fileStat = await stat(fullPath);
    const ageMs = now - fileStat.mtimeMs;
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    if (ageDays > config.maxAgeDays) {
      stale.push({
        filePath: fullPath,
        slug,
        section,
        ageInDays: ageDays,
        maxAgeDays: config.maxAgeDays,
        config,
      });
    }
  }
}

// ── Content Fetching ─────────────────────────────────────────────────────────

/**
 * Fetch fresh content for a stale article using web search + URL extraction.
 */
export async function fetchFreshContent(
  article: StaleArticle,
): Promise<FreshContent[]> {
  const queries = buildQueries(article.config, article.slug);
  const results: FreshContent[] = [];

  for (const query of queries.slice(0, 2)) { // Max 2 queries per article
    const searchResult = await searchWeb(query, 5);
    if (!searchResult.ok || searchResult.results.length === 0) continue;

    // Fetch full text from top 3 results
    const fullTexts: string[] = [];
    for (const r of searchResult.results.slice(0, 3)) {
      try {
        const content = await fetchUrlContent(r.url);
        if (content && content.length > 200) {
          fullTexts.push(content.slice(0, 3000)); // Cap per source
        }
      } catch {
        // URL fetch failed, skip
      }
    }

    results.push({
      query,
      provider: searchResult.provider,
      sources: searchResult.results.slice(0, 5).map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      })),
      fullText: fullTexts,
    });
  }

  return results;
}

// ── LLM Patching ─────────────────────────────────────────────────────────────

const PATCH_SYSTEM_PROMPT = `You are a knowledge base editor. Your job is to update a technical article with fresh information.

RULES:
- ONLY update sections that contain outdated information
- PRESERVE the article structure: # Title, ## sections, ### subsections
- PRESERVE the ## Media, ## Videos, and ## References sections exactly as-is unless you have NEW real URLs to add
- ADD new references at the end of ## References for any claims you update (use real URLs only)
- DO NOT remove existing content unless it is factually wrong
- DO NOT change the writing style or tone
- DO NOT add filler text or unnecessary commentary
- If nothing needs updating, respond with exactly: NO_UPDATE_NEEDED
- Return the COMPLETE updated article, not a diff`;

/**
 * Patch a stale article using LLM with fresh content context.
 */
export async function patchArticle(
  article: StaleArticle,
  freshContent: FreshContent[],
): Promise<PatchResult> {
  const currentContent = await readFile(article.filePath, "utf-8");

  // Build context from fresh sources
  const freshContext = freshContent
    .map((fc) => {
      const sources = fc.sources.map((s) => `- ${s.title}: ${s.snippet}`).join("\n");
      const fullText = fc.fullText.join("\n---\n").slice(0, 6000);
      return `### Search: "${fc.query}" (via ${fc.provider})\n\nSources:\n${sources}\n\nFetched content:\n${fullText}`;
    })
    .join("\n\n");

  if (!freshContext.trim()) {
    return {
      slug: article.slug,
      status: "skipped",
      reason: "No fresh content found from any source",
      sectionsUpdated: 0,
      contentDeltaPct: 0,
      newReferences: [],
      costUsd: 0,
    };
  }

  // Choose model based on config
  const isQuality = article.config.patchModel === "quality";
  const provider = isQuality ? "anthropic" : "deepseek";
  const model = isQuality ? "claude-sonnet-4-20250514" : "deepseek-chat";

  try {
    const response = await runLLM({
      runId: `kb-inject-${article.slug}-${Date.now()}`,
      agent: "PORTER",
      purpose: "kb_injection",
      route: "DRAFT_GENERATION_FAST",
      preferredProvider: provider,
      preferredModel: model,
      messages: [
        { role: "system", content: PATCH_SYSTEM_PROMPT },
        {
          role: "user",
          content: `## Current Article (${article.slug}.md, last updated ${article.ageInDays} days ago)\n\n${currentContent}\n\n## Fresh Information From Web Sources\n\n${freshContext}\n\nUpdate the article with any relevant new information. If nothing is outdated, respond with NO_UPDATE_NEEDED.`,
        },
      ],
    });

    const patchedContent = response.text.trim();

    if (patchedContent === "NO_UPDATE_NEEDED" || patchedContent.includes("NO_UPDATE_NEEDED")) {
      return {
        slug: article.slug,
        status: "skipped",
        reason: "Article is still current — no updates needed",
        sectionsUpdated: 0,
        contentDeltaPct: 0,
        newReferences: [],
        costUsd: estimateCost(currentContent, patchedContent, provider),
      };
    }

    // Calculate content delta
    const deltaChars = Math.abs(patchedContent.length - currentContent.length);
    const deltaPct = Math.round((deltaChars / Math.max(currentContent.length, 1)) * 100);

    // Extract new references
    const oldRefs = (currentContent.match(/^##\s+References[\s\S]*$/m)?.[0] ?? "").split("\n");
    const newRefs = (patchedContent.match(/^##\s+References[\s\S]*$/m)?.[0] ?? "").split("\n");
    const addedRefs = newRefs.filter((r) => !oldRefs.includes(r) && r.trim().length > 0);

    // Count sections that changed
    const oldSections = currentContent.split(/^##\s/m);
    const newSections = patchedContent.split(/^##\s/m);
    let sectionsChanged = 0;
    for (let i = 0; i < Math.min(oldSections.length, newSections.length); i++) {
      if (oldSections[i]?.trim() !== newSections[i]?.trim()) sectionsChanged++;
    }

    return {
      slug: article.slug,
      status: "patched",
      reason: `Updated ${sectionsChanged} sections, ${deltaPct}% content change`,
      sectionsUpdated: sectionsChanged,
      contentDeltaPct: deltaPct,
      newReferences: addedRefs,
      costUsd: estimateCost(currentContent, patchedContent, provider),
    };
  } catch (err: any) {
    return {
      slug: article.slug,
      status: "failed",
      reason: err?.message ?? String(err),
      sectionsUpdated: 0,
      contentDeltaPct: 0,
      newReferences: [],
      costUsd: 0,
    };
  }
}

function estimateCost(input: string, output: string, provider: string): number {
  const inputTokens = Math.ceil(input.length / 4);
  const outputTokens = Math.ceil(output.length / 4);

  if (provider === "deepseek") {
    return (inputTokens * 0.27 + outputTokens * 1.10) / 1_000_000;
  }
  // Anthropic Sonnet
  return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
}

// ── Safety Gate ──────────────────────────────────────────────────────────────

const MAX_CONTENT_DELTA_AUTO = 40; // Auto-apply if <40% changed
const MAX_PATCHES_PER_RUN = 10;

/**
 * Run the full injection pipeline: detect → fetch → patch → validate → publish.
 */
export async function runInjectionPipeline(
  dryRun = false,
): Promise<InjectionRunResult> {
  const runId = `kb-inject-${Date.now()}`;
  const startedAt = new Date();
  const patches: PatchResult[] = [];
  let totalCost = 0;

  console.log(`[kb-inject] Starting injection run ${runId}`);

  // Phase 1: Detect stale articles
  const staleArticles = await detectStaleArticles(MAX_PATCHES_PER_RUN * 3);
  console.log(`[kb-inject] Found ${staleArticles.length} stale articles`);

  let patchesApplied = 0;

  // Phase 2: Fetch + Patch (capped at MAX_PATCHES_PER_RUN)
  for (const article of staleArticles) {
    if (patchesApplied >= MAX_PATCHES_PER_RUN) break;

    console.log(`[kb-inject] Processing: ${article.slug} (${article.ageInDays}d old, max ${article.maxAgeDays}d)`);

    // Fetch fresh content
    const freshContent = await fetchFreshContent(article);
    if (freshContent.length === 0 || freshContent.every((fc) => fc.fullText.length === 0)) {
      patches.push({
        slug: article.slug,
        status: "skipped",
        reason: "No fresh content available",
        sectionsUpdated: 0,
        contentDeltaPct: 0,
        newReferences: [],
        costUsd: 0,
      });
      continue;
    }

    // Patch via LLM
    const result = await patchArticle(article, freshContent);
    totalCost += result.costUsd;
    patches.push(result);

    if (result.status !== "patched") continue;

    // Safety gate: auto-apply small changes, decision memo for large ones
    if (result.contentDeltaPct > MAX_CONTENT_DELTA_AUTO) {
      console.log(`[kb-inject] Large change (${result.contentDeltaPct}%) for ${article.slug} — requires approval`);
      // Create decision memo for human review
      if (!dryRun) {
        try {
          const { createDecisionMemo } = await import("../../services/decisionMemos.js");
          await createDecisionMemo({
            tenantId: TENANT_ID,
            title: `KB Injection: Large update to ${article.slug}`,
            body: `Article ${article.slug} has a ${result.contentDeltaPct}% content change from injection pipeline. ${result.sectionsUpdated} sections updated. Review before applying.\n\nNew references: ${result.newReferences.join(", ") || "none"}`,
            riskTier: 2,
            requestedBy: "kb-injector",
            category: "kb_injection",
          });
        } catch (err: any) {
          console.error(`[kb-inject] Failed to create decision memo: ${err?.message}`);
        }
      }
      result.status = "skipped";
      result.reason = `Content delta ${result.contentDeltaPct}% exceeds auto-apply threshold (${MAX_CONTENT_DELTA_AUTO}%) — decision memo created`;
      continue;
    }

    // Apply the patch
    if (!dryRun) {
      try {
        // Re-read and re-patch to get the actual content (patchArticle returns metadata)
        const freshContentAgain = await fetchFreshContent(article);
        const response = await runLLM({
          runId: `kb-inject-apply-${article.slug}-${Date.now()}`,
          agent: "PORTER",
          purpose: "kb_injection",
          route: "DRAFT_GENERATION_FAST",
          preferredProvider: article.config.patchModel === "quality" ? "anthropic" : "deepseek",
          preferredModel: article.config.patchModel === "quality" ? "claude-sonnet-4-20250514" : "deepseek-chat",
          messages: [
            { role: "system", content: PATCH_SYSTEM_PROMPT },
            {
              role: "user",
              content: `## Current Article\n\n${await readFile(article.filePath, "utf-8")}\n\n## Fresh Information\n\n${freshContentAgain.map((fc) => fc.fullText.join("\n")).join("\n\n")}\n\nUpdate the article.`,
            },
          ],
        });

        const patchedContent = response.text.trim();
        if (patchedContent && !patchedContent.includes("NO_UPDATE_NEEDED")) {
          await writeFile(article.filePath, patchedContent, "utf-8");
          patchesApplied++;
          console.log(`[kb-inject] ✓ Applied patch to ${article.slug}`);
        }
      } catch (err: any) {
        console.error(`[kb-inject] ✗ Failed to apply patch to ${article.slug}: ${err?.message}`);
        result.status = "failed";
        result.reason = `Apply failed: ${err?.message}`;
      }
    } else {
      patchesApplied++;
      console.log(`[kb-inject] [DRY RUN] Would patch ${article.slug}`);
    }

    // Rate limit: pause between patches
    await new Promise((r) => setTimeout(r, 2000));
  }

  const durationMs = Date.now() - startedAt.getTime();

  const runResult: InjectionRunResult = {
    runId,
    startedAt,
    durationMs,
    articlesScanned: staleArticles.length,
    staleFound: staleArticles.length,
    patchesAttempted: patches.filter((p) => p.status !== "skipped" || p.costUsd > 0).length,
    patchesApplied,
    patchesSkipped: patches.filter((p) => p.status === "skipped").length,
    patchesFailed: patches.filter((p) => p.status === "failed").length,
    totalCostUsd: totalCost,
    patches,
  };

  console.log(
    `[kb-inject] Run complete: ${patchesApplied} applied, ${runResult.patchesSkipped} skipped, ${runResult.patchesFailed} failed. Cost: $${totalCost.toFixed(4)}. Duration: ${(durationMs / 1000).toFixed(1)}s`,
  );

  return runResult;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: Clean, no errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/core/kb/kbInjector.ts
git commit -m "feat(kb): add injection core — staleness detection, content fetching, LLM patching"
```

---

## Chunk 2: Worker + Env + Audit

### Task 3: Create KB Injection Worker

**Files:**
- Create: `backend/src/workers/kbInjectionWorker.ts`
- Modify: `backend/src/env.ts` (add env vars)

- [ ] **Step 1: Add env vars to env.ts**

Add these to the `EnvSchema` in `backend/src/env.ts`:

```typescript
  // KB Injection Pipeline
  KB_INJECTION_ENABLED: z.string().optional(),
  KB_INJECTION_CRON: z.string().optional(),       // default "0 3 * * *" (3 AM daily)
  KB_INJECTION_DRY_RUN: z.string().optional(),    // "true" to preview without writing
  KB_INJECTION_MAX_PER_RUN: z.string().optional(), // default 10
```

- [ ] **Step 2: Create the worker**

```typescript
// backend/src/workers/kbInjectionWorker.ts
/**
 * KB Injection Worker — scheduled content freshness pipeline.
 *
 * Runs on cron (KB_INJECTION_CRON, default daily 3 AM — after kbEval at 2 AM).
 * Detects stale KB articles, fetches fresh content from web sources,
 * patches via LLM, validates, and publishes.
 *
 * Run: node dist/workers/kbInjectionWorker.js
 * Env: KB_INJECTION_ENABLED=true, KB_INJECTION_CRON="0 3 * * *"
 */

import { loadEnv } from "../env.js";
import { runInjectionPipeline } from "../core/kb/kbInjector.js";
import { prisma } from "../db/prisma.js";

// ── Cron parsing (reuse pattern from kbEvalWorker) ───────────────────────────

function parseCron(cron: string): { hour: number; minute: number } {
  const parts = cron.trim().split(/\s+/);
  return {
    minute: parts[0] === "*" ? 0 : Number(parts[0]),
    hour: parts[1] === "*" ? -1 : Number(parts[1]),
  };
}

function msUntilNextRun(cron: string): number {
  const { hour, minute } = parseCron(cron);
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour >= 0 ? hour : now.getHours(), minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

// ── Slack report ─────────────────────────────────────────────────────────────

async function sendSlackReport(result: Awaited<ReturnType<typeof runInjectionPipeline>>): Promise<void> {
  try {
    const { postAsAgent, getChannelByName } = await import("../services/slack.js");
    const channel = await getChannelByName("atlas-kb-health", true);
    if (!channel) return;

    const lines = [
      `*KB Injection Report* — ${new Date().toISOString().slice(0, 10)}`,
      `Scanned: ${result.articlesScanned} stale articles`,
      `Applied: ${result.patchesApplied} | Skipped: ${result.patchesSkipped} | Failed: ${result.patchesFailed}`,
      `Cost: $${result.totalCostUsd.toFixed(4)} | Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
    ];

    if (result.patches.filter((p) => p.status === "patched").length > 0) {
      lines.push("", "*Updated:*");
      for (const p of result.patches.filter((p) => p.status === "patched")) {
        lines.push(`  • \`${p.slug}\` — ${p.sectionsUpdated} sections, ${p.contentDeltaPct}% delta`);
      }
    }

    await postAsAgent(channel.id, "porter", lines.join("\n"));
  } catch (err: any) {
    console.error(`[kb-inject] Slack report failed: ${err?.message}`);
  }
}

// ── Audit log ────────────────────────────────────────────────────────────────

async function persistRunResult(result: Awaited<ReturnType<typeof runInjectionPipeline>>): Promise<void> {
  try {
    await prisma.system_state.upsert({
      where: { key: "kb_injection_last_run" },
      create: {
        key: "kb_injection_last_run",
        value: JSON.stringify({
          runId: result.runId,
          timestamp: result.startedAt.toISOString(),
          applied: result.patchesApplied,
          skipped: result.patchesSkipped,
          failed: result.patchesFailed,
          costUsd: result.totalCostUsd,
          patches: result.patches.map((p) => ({
            slug: p.slug,
            status: p.status,
            reason: p.reason,
          })),
        }),
      },
      update: {
        value: JSON.stringify({
          runId: result.runId,
          timestamp: result.startedAt.toISOString(),
          applied: result.patchesApplied,
          skipped: result.patchesSkipped,
          failed: result.patchesFailed,
          costUsd: result.totalCostUsd,
          patches: result.patches.map((p) => ({
            slug: p.slug,
            status: p.status,
            reason: p.reason,
          })),
        }),
      },
    });
  } catch (err: any) {
    console.error(`[kb-inject] Failed to persist run result: ${err?.message}`);
  }
}

// ── Main loop ────────────────────────────────────────────────────────────────

async function runOnce(): Promise<void> {
  const env = loadEnv(process.env);

  if (env.KB_INJECTION_ENABLED !== "true") {
    console.log("[kb-inject] Disabled (set KB_INJECTION_ENABLED=true to enable)");
    return;
  }

  const dryRun = (env as any).KB_INJECTION_DRY_RUN === "true";
  if (dryRun) console.log("[kb-inject] DRY RUN MODE — no files will be modified");

  const result = await runInjectionPipeline(dryRun);

  // Persist to DB
  await persistRunResult(result);

  // Report to Slack
  if (result.patchesApplied > 0 || result.patchesFailed > 0) {
    await sendSlackReport(result);
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

const env = loadEnv(process.env);
const cron = (env as any).KB_INJECTION_CRON ?? "0 3 * * *";

console.log(`[kb-inject] Worker started. Cron: ${cron}. Enabled: ${env.KB_INJECTION_ENABLED ?? "false"}`);

// Run immediately if --now flag passed
if (process.argv.includes("--now")) {
  console.log("[kb-inject] --now flag: running immediately");
  runOnce()
    .then(() => {
      console.log("[kb-inject] Immediate run complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[kb-inject] Immediate run failed:", err);
      process.exit(1);
    });
} else {
  // Main cron loop
  (async () => {
    while (true) {
      const waitMs = msUntilNextRun(cron);
      console.log(`[kb-inject] Next run in ${(waitMs / 1000 / 60).toFixed(0)} minutes`);
      await new Promise((r) => setTimeout(r, waitMs));

      try {
        await runOnce();
      } catch (err: any) {
        console.error(`[kb-inject] Run error: ${err?.message ?? err}`);
      }
    }
  })();
}
```

- [ ] **Step 3: Add npm script to package.json**

Add to `backend/package.json` scripts:

```json
"worker:kb-inject": "node dist/workers/kbInjectionWorker.js"
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: Clean, no errors

- [ ] **Step 5: Commit**

```bash
git add backend/src/workers/kbInjectionWorker.ts backend/src/env.ts backend/package.json
git commit -m "feat(kb): add injection worker with cron scheduling, Slack reports, audit persistence"
```

---

## Chunk 3: Build, Test, Ship

### Task 4: Build and Dry Run Test

- [ ] **Step 1: Build the backend**

Run: `cd backend && npx tsc -p tsconfig.json`
Expected: Clean compile

- [ ] **Step 2: Run dry-run test**

Run: `cd backend && KB_INJECTION_ENABLED=true KB_INJECTION_DRY_RUN=true node dist/workers/kbInjectionWorker.js --now`

Expected output:
```
[kb-inject] Worker started. Cron: 0 3 * * *. Enabled: true
[kb-inject] --now flag: running immediately
[kb-inject] DRY RUN MODE — no files will be modified
[kb-inject] Starting injection run kb-inject-...
[kb-inject] Found N stale articles
[kb-inject] Processing: slug-name (Xd old, max Yd)
...
[kb-inject] Run complete: N applied, N skipped, N failed. Cost: $X.XXXX. Duration: Xs
[kb-inject] Immediate run complete
```

- [ ] **Step 3: Review dry run results — verify no crashes, reasonable stale detection**

Check that:
- Stale articles detected match expected age thresholds
- Web search actually returns results
- LLM responses make sense (check console output)
- No unhandled errors

- [ ] **Step 4: Run live test (single article)**

Pick a known stale article and test:

Run: `cd backend && KB_INJECTION_ENABLED=true KB_INJECTION_MAX_PER_RUN=1 node dist/workers/kbInjectionWorker.js --now`

Then check the patched file: `git diff backend/src/kb/agents/`

- [ ] **Step 5: Verify the patch looks correct**

- Content structure preserved (# Title, ## sections, ## Media, ## Videos, ## References)
- Only outdated sections updated
- New references have real URLs
- No hallucinated content

- [ ] **Step 6: Commit all changes and push**

```bash
git add -A backend/src/core/kb/kbSourceRegistry.ts backend/src/core/kb/kbInjector.ts backend/src/workers/kbInjectionWorker.ts backend/src/env.ts backend/package.json
git commit -m "feat: KB injection pipeline — automated staleness detection and content freshness

Adds a cron-driven worker that detects stale KB articles, fetches fresh content
via web search (5-provider rotation), patches articles via LLM (DeepSeek for
cheap, Sonnet for critical), and validates through safety gates. Large changes
(>40% delta) create decision memos for human review. Reports to #atlas-kb-health.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Post-Implementation Notes

### Running locally
```bash
# Dry run (preview what would be updated)
cd backend && KB_INJECTION_ENABLED=true KB_INJECTION_DRY_RUN=true npm run worker:kb-inject -- --now

# Live run (actually patches files)
cd backend && KB_INJECTION_ENABLED=true npm run worker:kb-inject -- --now

# Cron mode (waits for 3 AM daily)
cd backend && KB_INJECTION_ENABLED=true npm run worker:kb-inject
```

### Adding new source mappings
Edit `backend/src/core/kb/kbSourceRegistry.ts` — add a new entry to `SOURCE_REGISTRY` with the article prefix pattern, search queries, max age, and patch model preference.

### Safety guarantees
- Max 10 patches per run (configurable via `KB_INJECTION_MAX_PER_RUN`)
- Changes >40% content delta → decision memo, not auto-applied
- Never deletes content, only updates/appends
- All runs persisted to `system_state` for audit
- Slack reports to `#atlas-kb-health`
- `--now` flag for immediate runs, otherwise cron-only
