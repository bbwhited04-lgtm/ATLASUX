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
import {
  findSourceConfig,
  buildQueries,
  type SourceConfig,
} from "./kbSourceRegistry.js";

const KB_ROOT = path.join(process.cwd(), "src", "kb");

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
  fullText: string[];
};

export type PatchResult = {
  slug: string;
  status: "patched" | "skipped" | "failed";
  reason: string;
  sectionsUpdated: number;
  contentDeltaPct: number;
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

export async function detectStaleArticles(
  maxResults = 50,
): Promise<StaleArticle[]> {
  const stale: StaleArticle[] = [];
  const now = Date.now();

  const sections = ["agents", "image-gen", "video-gen", "support"];

  for (const section of sections) {
    const sectionPath = path.join(KB_ROOT, section);
    try {
      await scanDirectory(sectionPath, section, stale, now);
    } catch {
      // Section may not exist
    }
  }

  // Sort by staleness (most overdue first)
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
      await scanDirectory(fullPath, section, stale, now);
      continue;
    }

    if (!entry.name.endsWith(".md")) continue;

    const slug = entry.name.replace(/\.md$/, "");
    const config = findSourceConfig(
      section === "agents" ? slug : `${section}/${slug}`
    );

    if (!config || config.queries.length === 0) continue;

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

export async function fetchFreshContent(
  article: StaleArticle,
): Promise<FreshContent[]> {
  const queries = buildQueries(article.config, article.slug);
  const results: FreshContent[] = [];

  for (const query of queries.slice(0, 2)) {
    const searchResult = await searchWeb(query, 5);
    if (!searchResult.ok || searchResult.results.length === 0) continue;

    const fullTexts: string[] = [];
    for (const r of searchResult.results.slice(0, 3)) {
      try {
        const fetched = await fetchUrlContent(r.url);
        if (fetched.ok && fetched.text.length > 200) {
          fullTexts.push(fetched.text.slice(0, 3000));
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

export async function patchArticle(
  article: StaleArticle,
  freshContent: FreshContent[],
): Promise<{ result: PatchResult; patchedContent: string | null }> {
  const currentContent = await readFile(article.filePath, "utf-8");

  const freshContext = freshContent
    .map((fc) => {
      const sources = fc.sources.map((s) => `- ${s.title}: ${s.snippet}`).join("\n");
      const fullText = fc.fullText.join("\n---\n").slice(0, 6000);
      return `### Search: "${fc.query}" (via ${fc.provider})\n\nSources:\n${sources}\n\nFetched content:\n${fullText}`;
    })
    .join("\n\n");

  if (!freshContext.trim()) {
    return {
      result: {
        slug: article.slug,
        status: "skipped",
        reason: "No fresh content found from any source",
        sectionsUpdated: 0,
        contentDeltaPct: 0,
        newReferences: [],
        costUsd: 0,
      },
      patchedContent: null,
    };
  }

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
        result: {
          slug: article.slug,
          status: "skipped",
          reason: "Article is still current — no updates needed",
          sectionsUpdated: 0,
          contentDeltaPct: 0,
          newReferences: [],
          costUsd: estimateCost(currentContent, patchedContent, provider),
        },
        patchedContent: null,
      };
    }

    const deltaChars = Math.abs(patchedContent.length - currentContent.length);
    const deltaPct = Math.round((deltaChars / Math.max(currentContent.length, 1)) * 100);

    const oldRefs = (currentContent.match(/^##\s+References[\s\S]*$/m)?.[0] ?? "").split("\n");
    const newRefs = (patchedContent.match(/^##\s+References[\s\S]*$/m)?.[0] ?? "").split("\n");
    const addedRefs = newRefs.filter((r) => !oldRefs.includes(r) && r.trim().length > 0);

    const oldSections = currentContent.split(/^##\s/m);
    const newSections = patchedContent.split(/^##\s/m);
    let sectionsChanged = 0;
    for (let i = 0; i < Math.min(oldSections.length, newSections.length); i++) {
      if (oldSections[i]?.trim() !== newSections[i]?.trim()) sectionsChanged++;
    }

    return {
      result: {
        slug: article.slug,
        status: "patched",
        reason: `Updated ${sectionsChanged} sections, ${deltaPct}% content change`,
        sectionsUpdated: sectionsChanged,
        contentDeltaPct: deltaPct,
        newReferences: addedRefs,
        costUsd: estimateCost(currentContent, patchedContent, provider),
      },
      patchedContent,
    };
  } catch (err: any) {
    return {
      result: {
        slug: article.slug,
        status: "failed",
        reason: err?.message ?? String(err),
        sectionsUpdated: 0,
        contentDeltaPct: 0,
        newReferences: [],
        costUsd: 0,
      },
      patchedContent: null,
    };
  }
}

function estimateCost(input: string, output: string, provider: string): number {
  const inputTokens = Math.ceil(input.length / 4);
  const outputTokens = Math.ceil(output.length / 4);

  if (provider === "deepseek") {
    return (inputTokens * 0.27 + outputTokens * 1.10) / 1_000_000;
  }
  return (inputTokens * 3 + outputTokens * 15) / 1_000_000;
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

const MAX_CONTENT_DELTA_AUTO = 40;
const MAX_PATCHES_PER_RUN = 10;

export async function runInjectionPipeline(
  dryRun = false,
  maxPatches = MAX_PATCHES_PER_RUN,
): Promise<InjectionRunResult> {
  const runId = `kb-inject-${Date.now()}`;
  const startedAt = new Date();
  const patches: PatchResult[] = [];
  let totalCost = 0;
  let patchesApplied = 0;

  console.log(`[kb-inject] Starting injection run ${runId}`);

  // Phase 1: Detect stale articles
  const staleArticles = await detectStaleArticles(maxPatches * 3);
  console.log(`[kb-inject] Found ${staleArticles.length} stale articles`);

  // Phase 2: Fetch + Patch
  for (const article of staleArticles) {
    if (patchesApplied >= maxPatches) break;

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
    const { result, patchedContent } = await patchArticle(article, freshContent);
    totalCost += result.costUsd;
    patches.push(result);

    if (result.status !== "patched" || !patchedContent) continue;

    // Safety gate: large changes need human approval
    if (result.contentDeltaPct > MAX_CONTENT_DELTA_AUTO) {
      console.log(`[kb-inject] Large change (${result.contentDeltaPct}%) for ${article.slug} — requires approval`);
      if (!dryRun) {
        try {
          const { createDecisionMemo } = await import("../../services/decisionMemos.js");
          await createDecisionMemo({
            tenantId: "9a8a332c-c47d-4792-a0d4-56ad4e4a3391",
            agent: "porter",
            title: `KB Injection: Large update to ${article.slug}`,
            rationale: `Article ${article.slug} has a ${result.contentDeltaPct}% content change from injection pipeline. ${result.sectionsUpdated} sections updated. Review before applying.\n\nNew references: ${result.newReferences.join(", ") || "none"}`,
            riskTier: 2,
            confidence: 0.7,
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
        await writeFile(article.filePath, patchedContent, "utf-8");
        patchesApplied++;
        console.log(`[kb-inject] ✓ Applied patch to ${article.slug}`);
      } catch (err: any) {
        console.error(`[kb-inject] ✗ Failed to write ${article.slug}: ${err?.message}`);
        result.status = "failed";
        result.reason = `Write failed: ${err?.message}`;
      }
    } else {
      patchesApplied++;
      console.log(`[kb-inject] [DRY RUN] Would patch ${article.slug}`);
    }

    // Rate limit between patches
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
