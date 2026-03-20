/**
 * GraphRAG Index Pipeline — orchestrates entity extraction, resolution, and graph construction.
 * Scans KB articles, extracts entities, builds the hybrid entity-content graph.
 * Supports incremental indexing (only changed files).
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { prisma } from "../../../db/prisma.js";
import { extractEntitiesFromArticle } from "./entityExtractor.js";
import { resolveEntities } from "./entityResolver.js";
import { buildGraphFromExtractions, getGraphStats } from "./graphBuilder.js";
import type { ExtractionResult } from "./entityExtractor.js";
import type { GraphBuildStats, GraphStatsResult } from "./graphBuilder.js";

// ── Types ──────────────────────────────────────────────────────────────────

interface ScannedArticle {
  filePath: string;
  slug: string;
  section: string;
  hash: string;
}

export interface IndexPipelineSummary {
  articlesScanned: number;
  articlesProcessed: number;
  articlesSkipped: number;
  entitiesFound: number;
  relationshipsFound: number;
  graphBuildStats: GraphBuildStats;
  graphStats: GraphStatsResult;
  durationMs: number;
}

// ── KB article scanning ────────────────────────────────────────────────────

/**
 * Recursively find all .md files under kbRoot.
 * Returns metadata for each file including content hash for change detection.
 */
export async function scanKbArticles(kbRoot: string): Promise<ScannedArticle[]> {
  const articles: ScannedArticle[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip hidden directories and _media
        if (!entry.name.startsWith(".") && entry.name !== "_media" && entry.name !== "node_modules") {
          await walk(fullPath);
        }
      } else if (entry.name.endsWith(".md")) {
        const content = await readFile(fullPath, "utf-8");
        const hash = createHash("md5").update(content).digest("hex");
        const relPath = relative(kbRoot, fullPath).replace(/\\/g, "/");
        const section = relPath.includes("/") ? relPath.split("/")[0] : "root";
        const slug = relPath.replace(/\.md$/, "").replace(/\//g, "--");

        articles.push({ filePath: fullPath, slug, section, hash });
      }
    }
  }

  await walk(kbRoot);
  return articles;
}

// ── Hash persistence (system_state) ────────────────────────────────────────

const STATE_KEY = "graphrag_indexed_files";

/**
 * Load previously indexed file hashes from system_state.
 */
export async function getIndexedHashes(): Promise<Map<string, string>> {
  const row = await prisma.system_state.findUnique({ where: { key: STATE_KEY } });
  if (!row || !row.value) return new Map();

  const data = row.value as Record<string, string>;
  return new Map(Object.entries(data));
}

/**
 * Persist indexed file hashes to system_state.
 */
export async function saveIndexedHashes(hashes: Map<string, string>): Promise<void> {
  const data = Object.fromEntries(hashes);
  await prisma.system_state.upsert({
    where: { key: STATE_KEY },
    create: { key: STATE_KEY, value: data },
    update: { value: data, updated_at: new Date() },
  });
}

// ── Concurrency helpers ────────────────────────────────────────────────────

/**
 * Process items in batches with concurrency limit and inter-batch delay.
 */
async function processBatched<T, R>(
  items: T[],
  batchSize: number,
  delayMs: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);

    // Delay between batches (not after the last one)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// ── Main pipeline ──────────────────────────────────────────────────────────

/**
 * Run the full GraphRAG indexing pipeline.
 *
 * 1. Scan KB articles
 * 2. Load previously indexed hashes
 * 3. Filter to only changed/new files (or all if fullReindex)
 * 4. Extract entities from each article
 * 5. Resolve entities across all extractions
 * 6. Build graph from extractions + entity map
 * 7. Save updated hashes
 * 8. Return summary
 */
export async function runIndexPipeline(
  options?: { fullReindex?: boolean; maxArticles?: number; kbRoot?: string }
): Promise<IndexPipelineSummary> {
  const startTime = Date.now();
  const kbRoot = options?.kbRoot ?? join(process.cwd(), "src", "kb");

  console.log(`[IndexPipeline] Scanning KB articles at: ${kbRoot}`);

  // 1. Scan KB articles
  const allArticles = await scanKbArticles(kbRoot);
  console.log(`[IndexPipeline] Found ${allArticles.length} articles`);

  // 2. Load previously indexed hashes
  const previousHashes = options?.fullReindex
    ? new Map<string, string>()
    : await getIndexedHashes();

  // 3. Filter to changed/new files
  let articlesToProcess = allArticles.filter((article) => {
    const previousHash = previousHashes.get(article.slug);
    return !previousHash || previousHash !== article.hash;
  });

  const articlesSkipped = allArticles.length - articlesToProcess.length;

  // Apply maxArticles limit
  if (options?.maxArticles && articlesToProcess.length > options.maxArticles) {
    articlesToProcess = articlesToProcess.slice(0, options.maxArticles);
  }

  console.log(
    `[IndexPipeline] Processing ${articlesToProcess.length} articles ` +
    `(${articlesSkipped} unchanged, skipped)`
  );

  if (articlesToProcess.length === 0) {
    const graphStats = await getGraphStats();
    return {
      articlesScanned: allArticles.length,
      articlesProcessed: 0,
      articlesSkipped,
      entitiesFound: 0,
      relationshipsFound: 0,
      graphBuildStats: {
        entitiesUpserted: 0,
        chunksUpserted: 0,
        entityChunkEdges: 0,
        entityEntityEdges: 0,
        chunkSequenceEdges: 0,
      },
      graphStats,
      durationMs: Date.now() - startTime,
    };
  }

  // 4. Extract entities from each article (max 5 concurrent, 500ms between batches)
  const allExtractions: ExtractionResult[] = [];
  const extractionBatches = await processBatched(
    articlesToProcess,
    5,
    500,
    async (article) => {
      console.log(`[IndexPipeline] Extracting entities from: ${article.slug}`);
      const results = await extractEntitiesFromArticle(article.filePath);
      return results;
    }
  );

  for (const batch of extractionBatches) {
    allExtractions.push(...batch);
  }

  // Count totals
  let totalEntities = 0;
  let totalRelationships = 0;
  for (const result of allExtractions) {
    totalEntities += result.entities.length;
    totalRelationships += result.relationships.length;
  }

  console.log(
    `[IndexPipeline] Extracted ${totalEntities} entities and ` +
    `${totalRelationships} relationships from ${allExtractions.length} chunks`
  );

  // 5. Resolve entities
  const entityMap = resolveEntities(allExtractions);
  console.log(`[IndexPipeline] Resolved to ${new Set(entityMap.values()).size} canonical entities`);

  // 6. Build graph
  const graphBuildStats = await buildGraphFromExtractions(allExtractions, entityMap);

  // 7. Save updated hashes
  const updatedHashes = new Map(previousHashes);
  for (const article of articlesToProcess) {
    updatedHashes.set(article.slug, article.hash);
  }
  await saveIndexedHashes(updatedHashes);

  // 8. Get final graph stats
  const graphStats = await getGraphStats();
  const durationMs = Date.now() - startTime;

  console.log(
    `[IndexPipeline] Complete in ${(durationMs / 1000).toFixed(1)}s. ` +
    `Graph: ${graphStats.entityCount} entities, ${graphStats.chunkCount} chunks, ` +
    `${graphStats.edgeCount} edges (avg degree: ${graphStats.avgDegree.toFixed(1)})`
  );

  return {
    articlesScanned: allArticles.length,
    articlesProcessed: articlesToProcess.length,
    articlesSkipped,
    entitiesFound: totalEntities,
    relationshipsFound: totalRelationships,
    graphBuildStats,
    graphStats,
    durationMs,
  };
}
