/**
 * Hybrid Query Engine — combines Pinecone vector search with Neo4j graph traversal.
 * Entity-content traversal: query → extract entities → graph walk → merge with vector results.
 */

import { runLLM } from "../../engine/brainllm.js";
import { queryPinecone } from "../../../lib/pinecone.js";
import { getSession } from "../../../lib/neo4j.js";

// ── Types ──────────────────────────────────────────────────────────────────

export interface HybridChunk {
  id: string;
  text: string;
  source: string;
  score: number;
  vectorScore: number;
  graphScore: number;
  reachedVia?: string;
  traversalDepth?: number;
}

export interface HybridResult {
  chunks: HybridChunk[];
  entities: string[];
  graphTraversal: string[];
  vectorResultCount: number;
  graphResultCount: number;
}

// ── Entity extraction from query ───────────────────────────────────────────

const ENTITY_EXTRACTION_PROMPT = `Extract entity names from this query. Return a JSON array of strings.
Only include specific named things (tools, concepts, companies, protocols), not generic words.
If no specific entities are found, return an empty array.
Return ONLY the JSON array, nothing else.`;

/**
 * Extract entity names from a user query using DeepSeek.
 */
export async function extractQueryEntities(query: string): Promise<string[]> {
  try {
    const response = await runLLM({
      runId: `graphrag-query-extract-${Date.now()}`,
      agent: "ATLAS",
      purpose: "graphrag_query_entity_extraction",
      route: "CLASSIFY_EXTRACT_VALIDATE",
      preferredProvider: "deepseek",
      preferredModel: "deepseek-chat",
      temperature: 0.0,
      maxOutputTokens: 500,
      messages: [
        { role: "system", content: ENTITY_EXTRACTION_PROMPT },
        { role: "user", content: query },
      ],
    });

    let cleaned = response.text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
    return [];
  } catch {
    return [];
  }
}

// ── Graph walk ─────────────────────────────────────────────────────────────

interface GraphWalkResult {
  chunkId: string;
  text: string;
  sourceArticle: string;
  depth: number;
  reachedVia: string;
}

/**
 * Traverse the Neo4j graph starting from named entities.
 * Walks Entity → Chunk → Entity → Chunk paths up to maxDepth.
 */
export async function graphWalk(
  entityNames: string[],
  maxDepth: number = 2,
  maxChunks: number = 15
): Promise<GraphWalkResult[]> {
  if (entityNames.length === 0) return [];

  const session = getSession();
  try {
    const results: GraphWalkResult[] = [];
    const seenChunks = new Set<string>();

    // 1-hop: direct entity → chunk connections
    const directResult = await session.run(
      `MATCH (e:Entity)-[:DESCRIBED_IN]->(c:Chunk)
       WHERE e.name IN $entityNames
       RETURN c.id AS chunkId, c.text AS text, c.source_article AS source,
              1 AS depth, e.name AS reachedVia
       LIMIT $maxChunks`,
      { entityNames, maxChunks }
    );

    for (const record of directResult.records) {
      const chunkId = record.get("chunkId") as string;
      if (!seenChunks.has(chunkId)) {
        seenChunks.add(chunkId);
        results.push({
          chunkId,
          text: record.get("text") as string,
          sourceArticle: record.get("source") as string,
          depth: (record.get("depth") as { toNumber?: () => number })?.toNumber?.() ?? 1,
          reachedVia: record.get("reachedVia") as string,
        });
      }
    }

    // 2-hop: entity → chunk → entity → chunk (if maxDepth >= 2)
    if (maxDepth >= 2) {
      const remaining = maxChunks - results.length;
      if (remaining > 0) {
        const multiHopResult = await session.run(
          `MATCH (e:Entity)-[:DESCRIBED_IN]->(c:Chunk)-[:MENTIONS]->(e2:Entity)-[:DESCRIBED_IN]->(c2:Chunk)
           WHERE e.name IN $entityNames AND c2.id <> c.id
           RETURN c2.id AS chunkId, c2.text AS text, c2.source_article AS source,
                  2 AS depth, e.name AS reachedVia
           LIMIT $remaining`,
          { entityNames, remaining }
        );

        for (const record of multiHopResult.records) {
          const chunkId = record.get("chunkId") as string;
          if (!seenChunks.has(chunkId)) {
            seenChunks.add(chunkId);
            results.push({
              chunkId,
              text: record.get("text") as string,
              sourceArticle: record.get("source") as string,
              depth: (record.get("depth") as { toNumber?: () => number })?.toNumber?.() ?? 2,
              reachedVia: record.get("reachedVia") as string,
            });
          }
        }
      }
    }

    return results;
  } finally {
    await session.close();
  }
}

// ── Hybrid search ──────────────────────────────────────────────────────────

/**
 * Main hybrid search: combines Pinecone vector search with Neo4j graph traversal.
 *
 * 1. Extract entities from query + vector search in parallel
 * 2. Graph walk from extracted entities
 * 3. Merge and deduplicate results
 * 4. Score: 0.6 * vectorScore + 0.4 * graphScore for dual-found chunks
 */
export async function hybridSearch(
  query: string,
  tenantId: string,
  topK: number = 10
): Promise<HybridResult> {
  // Step 1: parallel entity extraction + vector search
  const [entities, vectorHits] = await Promise.all([
    extractQueryEntities(query),
    queryPinecone({ tenantId, query, topK }),
  ]);

  // Step 2: graph walk from extracted entities
  const graphResults = await graphWalk(entities, 2, topK * 2);

  // Step 3: merge results
  const chunkMap = new Map<string, HybridChunk>();

  // Add vector results first
  for (let i = 0; i < vectorHits.length; i++) {
    const hit = vectorHits[i];
    chunkMap.set(hit.chunkId, {
      id: hit.chunkId,
      text: hit.content,
      source: hit.documentId,
      score: hit.score,
      vectorScore: hit.score,
      graphScore: 0,
    });
  }

  // Merge graph results
  for (const gResult of graphResults) {
    // Normalize graph score: depth 1 = 1.0, depth 2 = 0.7, depth 3+ = 0.4
    const graphScore = gResult.depth <= 1 ? 1.0 : gResult.depth <= 2 ? 0.7 : 0.4;

    const existing = chunkMap.get(gResult.chunkId);
    if (existing) {
      // Found in both: combine scores
      existing.graphScore = graphScore;
      existing.score = 0.6 * existing.vectorScore + 0.4 * graphScore;
      existing.reachedVia = gResult.reachedVia;
      existing.traversalDepth = gResult.depth;
    } else {
      // Graph-only result
      chunkMap.set(gResult.chunkId, {
        id: gResult.chunkId,
        text: gResult.text,
        source: gResult.sourceArticle,
        score: graphScore,
        vectorScore: 0,
        graphScore,
        reachedVia: gResult.reachedVia,
        traversalDepth: gResult.depth,
      });
    }
  }

  // Step 4: sort by combined score and take topK
  const chunks = Array.from(chunkMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  // Build traversal path summary
  const graphTraversal = graphResults.map(
    (r) => `${r.reachedVia} → ${r.chunkId} (depth ${r.depth})`
  );

  return {
    chunks,
    entities,
    graphTraversal,
    vectorResultCount: vectorHits.length,
    graphResultCount: graphResults.length,
  };
}
