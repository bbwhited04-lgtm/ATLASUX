/**
 * Graph Builder — constructs entity-content hybrid knowledge graph in Neo4j.
 * Both entities AND chunks are first-class nodes.
 * Traversal: Entity → Chunk → Entity → Chunk (alternating with source grounding)
 */

import type { Session } from "neo4j-driver";
import { getSession } from "../../../lib/neo4j.js";
import type { ExtractionResult } from "./entityExtractor.js";

// ── Schema initialization ──────────────────────────────────────────────────

/**
 * Create Neo4j constraints and indexes for the knowledge graph.
 * Safe to call multiple times (all operations are IF NOT EXISTS).
 */
export async function initGraphSchema(): Promise<void> {
  const session = getSession();
  try {
    // Unique constraints
    await session.run(
      "CREATE CONSTRAINT IF NOT EXISTS FOR (e:Entity) REQUIRE e.name IS UNIQUE"
    );
    await session.run(
      "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE"
    );

    // Indexes for common lookups
    await session.run(
      "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.type)"
    );
    await session.run(
      "CREATE INDEX IF NOT EXISTS FOR (c:Chunk) ON (c.source_article)"
    );
  } finally {
    await session.close();
  }
}

// ── Node upserts ───────────────────────────────────────────────────────────

export interface EntityNode {
  name: string;
  type: string;
  description: string;
  aliases?: string[];
  articleCount?: number;
}

export interface ChunkNode {
  id: string;
  text: string;
  sourceArticle: string;
  section: string;
  position: number;
  wordCount: number;
}

/**
 * MERGE an Entity node by name, setting/updating its properties.
 */
export async function upsertEntity(
  session: Session,
  entity: EntityNode
): Promise<void> {
  await session.run(
    `MERGE (e:Entity {name: $name})
     SET e.type = $type,
         e.description = $description,
         e.aliases = $aliases,
         e.article_count = $articleCount,
         e.updated_at = datetime()`,
    {
      name: entity.name,
      type: entity.type,
      description: entity.description,
      aliases: entity.aliases ?? [],
      articleCount: entity.articleCount ?? 1,
    }
  );
}

/**
 * MERGE a Chunk node by id, setting/updating its properties.
 */
export async function upsertChunk(
  session: Session,
  chunk: ChunkNode
): Promise<void> {
  await session.run(
    `MERGE (c:Chunk {id: $id})
     SET c.text = $text,
         c.source_article = $sourceArticle,
         c.section = $section,
         c.position = $position,
         c.word_count = $wordCount,
         c.updated_at = datetime()`,
    {
      id: chunk.id,
      text: chunk.text,
      sourceArticle: chunk.sourceArticle,
      section: chunk.section,
      position: chunk.position,
      wordCount: chunk.wordCount,
    }
  );
}

// ── Edge creation ──────────────────────────────────────────────────────────

/**
 * Create DESCRIBED_IN and MENTIONS edges between an Entity and a Chunk.
 * DESCRIBED_IN: Entity → Chunk (entity is described in this chunk)
 * MENTIONS: Chunk → Entity (chunk mentions this entity)
 */
export async function linkEntityToChunk(
  session: Session,
  entityName: string,
  chunkId: string,
  confidence: number
): Promise<void> {
  await session.run(
    `MATCH (e:Entity {name: $entityName})
     MATCH (c:Chunk {id: $chunkId})
     MERGE (e)-[d:DESCRIBED_IN]->(c)
     SET d.confidence = $confidence, d.updated_at = datetime()
     MERGE (c)-[m:MENTIONS]->(e)
     SET m.confidence = $confidence, m.updated_at = datetime()`,
    { entityName, chunkId, confidence }
  );
}

/**
 * Create a RELATES_TO edge between two entities.
 * Optionally grounded by a specific chunk.
 */
export async function linkEntities(
  session: Session,
  source: string,
  target: string,
  relType: string,
  description: string,
  weight: number,
  groundingChunkId?: string
): Promise<void> {
  await session.run(
    `MATCH (s:Entity {name: $source})
     MATCH (t:Entity {name: $target})
     MERGE (s)-[r:RELATES_TO]->(t)
     SET r.rel_type = $relType,
         r.description = $description,
         r.weight = $weight,
         r.grounding_chunk_id = $groundingChunkId,
         r.updated_at = datetime()`,
    {
      source,
      target,
      relType,
      description,
      weight,
      groundingChunkId: groundingChunkId ?? null,
    }
  );
}

/**
 * Create a NEXT_IN_ARTICLE edge between sequential chunks.
 */
export async function linkChunkSequence(
  session: Session,
  chunkId1: string,
  chunkId2: string
): Promise<void> {
  await session.run(
    `MATCH (c1:Chunk {id: $chunkId1})
     MATCH (c2:Chunk {id: $chunkId2})
     MERGE (c1)-[r:NEXT_IN_ARTICLE]->(c2)
     SET r.updated_at = datetime()`,
    { chunkId1, chunkId2 }
  );
}

// ── Full graph build ───────────────────────────────────────────────────────

export interface GraphBuildStats {
  entitiesUpserted: number;
  chunksUpserted: number;
  entityChunkEdges: number;
  entityEntityEdges: number;
  chunkSequenceEdges: number;
}

/**
 * Orchestrate full graph construction from extraction results.
 *
 * 1. Init schema
 * 2. Upsert all chunks
 * 3. Upsert all entities (using canonical names from entityMap)
 * 4. Create entity→chunk edges (DESCRIBED_IN / MENTIONS)
 * 5. Create entity→entity edges (RELATES_TO with grounding)
 * 6. Create chunk sequence edges (NEXT_IN_ARTICLE)
 * 7. Log stats
 */
export async function buildGraphFromExtractions(
  extractionResults: ExtractionResult[],
  entityMap: Map<string, string>
): Promise<GraphBuildStats> {
  await initGraphSchema();

  const stats: GraphBuildStats = {
    entitiesUpserted: 0,
    chunksUpserted: 0,
    entityChunkEdges: 0,
    entityEntityEdges: 0,
    chunkSequenceEdges: 0,
  };

  const session = getSession();
  try {
    // Track which canonical entities we've already upserted
    const upsertedEntities = new Set<string>();
    // Group chunks by source article for sequencing
    const chunksByArticle = new Map<string, string[]>();

    for (const result of extractionResults) {
      // 2. Upsert chunk
      const chunkParts = result.chunkId.split("::");
      const sourceArticle = chunkParts[0] ?? result.chunkId;
      const chunkIndex = chunkParts[1] ?? "chunk-0";
      const position = parseInt(chunkIndex.replace("chunk-", ""), 10) || 0;

      // Combine entity texts to build chunk text representation
      const chunkText = result.entities
        .map((e) => `${e.name}: ${e.description}`)
        .join("; ");

      await upsertChunk(session, {
        id: result.chunkId,
        text: chunkText,
        sourceArticle,
        section: sourceArticle,
        position,
        wordCount: chunkText.split(/\s+/).length,
      });
      stats.chunksUpserted++;

      // Track chunks per article for sequencing
      const articleChunks = chunksByArticle.get(sourceArticle) ?? [];
      articleChunks.push(result.chunkId);
      chunksByArticle.set(sourceArticle, articleChunks);

      // 3. Upsert entities with canonical names
      for (const entity of result.entities) {
        const canonical = entityMap.get(entity.name) ?? entity.name;
        if (!upsertedEntities.has(canonical)) {
          await upsertEntity(session, {
            name: canonical,
            type: entity.type,
            description: entity.description,
            aliases: entity.aliases,
          });
          upsertedEntities.add(canonical);
          stats.entitiesUpserted++;
        }

        // 4. Entity → Chunk edges
        await linkEntityToChunk(session, canonical, result.chunkId, 1.0);
        stats.entityChunkEdges++;
      }

      // 5. Entity → Entity edges (RELATES_TO with grounding)
      for (const rel of result.relationships) {
        const canonicalSource = entityMap.get(rel.source) ?? rel.source;
        const canonicalTarget = entityMap.get(rel.target) ?? rel.target;

        // Only create edges between entities that exist
        if (
          upsertedEntities.has(canonicalSource) &&
          upsertedEntities.has(canonicalTarget)
        ) {
          await linkEntities(
            session,
            canonicalSource,
            canonicalTarget,
            rel.type,
            rel.description,
            rel.strength,
            result.chunkId
          );
          stats.entityEntityEdges++;
        }
      }
    }

    // 6. Create chunk sequence edges (NEXT_IN_ARTICLE)
    for (const [, chunkIds] of chunksByArticle) {
      // Sort by position (chunk IDs contain the index)
      chunkIds.sort((a, b) => {
        const posA = parseInt(a.split("::")[1]?.replace("chunk-", "") ?? "0", 10);
        const posB = parseInt(b.split("::")[1]?.replace("chunk-", "") ?? "0", 10);
        return posA - posB;
      });

      for (let i = 0; i < chunkIds.length - 1; i++) {
        await linkChunkSequence(session, chunkIds[i], chunkIds[i + 1]);
        stats.chunkSequenceEdges++;
      }
    }
  } finally {
    await session.close();
  }

  // 7. Log stats
  console.log(
    `[GraphBuilder] Built graph: ${stats.entitiesUpserted} entities, ` +
    `${stats.chunksUpserted} chunks, ${stats.entityChunkEdges} entity→chunk edges, ` +
    `${stats.entityEntityEdges} entity→entity edges, ${stats.chunkSequenceEdges} sequence edges`
  );

  return stats;
}

// ── Graph stats ────────────────────────────────────────────────────────────

export interface GraphStatsResult {
  entityCount: number;
  chunkCount: number;
  edgeCount: number;
  topEntityTypes: Array<{ type: string; count: number }>;
  avgDegree: number;
}

/**
 * Returns aggregate statistics about the knowledge graph.
 */
export async function getGraphStats(): Promise<GraphStatsResult> {
  const session = getSession();
  try {
    const entityResult = await session.run(
      "MATCH (e:Entity) RETURN count(e) AS cnt"
    );
    const entityCount = (entityResult.records[0]?.get("cnt") as { toNumber(): number }).toNumber();

    const chunkResult = await session.run(
      "MATCH (c:Chunk) RETURN count(c) AS cnt"
    );
    const chunkCount = (chunkResult.records[0]?.get("cnt") as { toNumber(): number }).toNumber();

    const edgeResult = await session.run(
      "MATCH ()-[r]->() RETURN count(r) AS cnt"
    );
    const edgeCount = (edgeResult.records[0]?.get("cnt") as { toNumber(): number }).toNumber();

    const typeResult = await session.run(
      `MATCH (e:Entity)
       RETURN e.type AS type, count(e) AS cnt
       ORDER BY cnt DESC
       LIMIT 10`
    );
    const topEntityTypes = typeResult.records.map((r) => ({
      type: r.get("type") as string,
      count: (r.get("cnt") as { toNumber(): number }).toNumber(),
    }));

    const totalNodes = entityCount + chunkCount;
    const avgDegree = totalNodes > 0 ? (edgeCount * 2) / totalNodes : 0;

    return { entityCount, chunkCount, edgeCount, topEntityTypes, avgDegree };
  } finally {
    await session.close();
  }
}
