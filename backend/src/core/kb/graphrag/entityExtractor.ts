/**
 * Entity Extractor — LLM-powered NER for KB articles.
 * Extracts entities (CONCEPT, TOOL, COMPANY, PERSON, PROTOCOL)
 * and relationships from article chunks.
 * Uses DeepSeek for cost efficiency.
 */

import { readFile } from "node:fs/promises";
import { runLLM } from "../../engine/brainllm.js";

// ── Entity types ────────────────────────────────────────────────────────────

export const ENTITY_TYPES = [
  "CONCEPT",
  "TOOL",
  "COMPANY",
  "PERSON",
  "PROTOCOL",
  "FRAMEWORK",
  "PLATFORM",
  "METRIC",
  "ALGORITHM",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "USES",
  "COMPETES_WITH",
  "PART_OF",
  "IMPLEMENTS",
  "DESCRIBED_BY",
  "COMPARED_TO",
  "INTEGRATES_WITH",
  "BUILT_ON",
  "ALTERNATIVE_TO",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExtractedEntity {
  name: string;
  type: EntityType;
  description: string;
  aliases: string[];
}

export interface ExtractedRelationship {
  source: string;
  target: string;
  type: RelationshipType;
  description: string;
  /** 1-10 scale of relationship strength */
  strength: number;
}

export interface ExtractionResult {
  chunkId: string;
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

// ── Chunking ────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

interface TextChunk {
  id: string;
  text: string;
}

function splitIntoChunks(text: string, sourceId: string): TextChunk[] {
  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push({
      id: `${sourceId}::chunk-${index}`,
      text: text.slice(start, end),
    });
    start += CHUNK_SIZE - CHUNK_OVERLAP;
    index++;
  }

  return chunks;
}

// ── Extraction prompt ───────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are a knowledge graph entity extractor. Given a text chunk from a technical article, extract named entities and their relationships.

Rules:
- Entity names must be canonical: properly capitalized (e.g., "Neo4j" not "neo4j", "OpenAI" not "openai")
- Entity types must be one of: ${ENTITY_TYPES.join(", ")}
- Relationship types must be one of: ${RELATIONSHIP_TYPES.join(", ")}
- Strength is 1-10 (10 = strongest/most direct relationship)
- Maximum 20 entities per chunk
- Maximum 15 relationships per chunk
- Only extract entities that are clearly named/referenced, not vague concepts
- Aliases should include common alternate spellings or abbreviations

Return ONLY valid JSON matching this schema:
{
  "entities": [
    {"name": "string", "type": "ENTITY_TYPE", "description": "brief description", "aliases": ["alt1", "alt2"]}
  ],
  "relationships": [
    {"source": "Entity Name", "target": "Entity Name", "type": "RELATIONSHIP_TYPE", "description": "brief description", "strength": 8}
  ]
}

If no entities or relationships are found, return {"entities": [], "relationships": []}.`;

// ── Core extraction ─────────────────────────────────────────────────────────

interface RawExtraction {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

function parseExtractionResponse(text: string): RawExtraction {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned) as RawExtraction;

    // Validate and filter entities
    const validEntities = (parsed.entities ?? [])
      .slice(0, 20)
      .filter(
        (e): e is ExtractedEntity =>
          typeof e.name === "string" &&
          e.name.length > 0 &&
          ENTITY_TYPES.includes(e.type as EntityType) &&
          typeof e.description === "string"
      )
      .map((e) => ({
        ...e,
        aliases: Array.isArray(e.aliases) ? e.aliases.filter((a) => typeof a === "string") : [],
      }));

    // Validate and filter relationships
    const validRelationships = (parsed.relationships ?? [])
      .slice(0, 15)
      .filter(
        (r): r is ExtractedRelationship =>
          typeof r.source === "string" &&
          typeof r.target === "string" &&
          RELATIONSHIP_TYPES.includes(r.type as RelationshipType) &&
          typeof r.strength === "number" &&
          r.strength >= 1 &&
          r.strength <= 10
      );

    return { entities: validEntities, relationships: validRelationships };
  } catch {
    return { entities: [], relationships: [] };
  }
}

/**
 * Extract entities and relationships from a single text chunk.
 */
export async function extractEntitiesFromChunk(
  chunkId: string,
  chunkText: string,
  sourceArticle: string
): Promise<ExtractionResult> {
  const response = await runLLM({
    runId: `graphrag-extract-${chunkId}`,
    agent: "ATLAS",
    purpose: "graphrag_entity_extraction",
    route: "CLASSIFY_EXTRACT_VALIDATE",
    preferredProvider: "deepseek",
    preferredModel: "deepseek-chat",
    temperature: 0.1,
    maxOutputTokens: 2000,
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Source article: "${sourceArticle}"\n\nText chunk:\n${chunkText}`,
      },
    ],
  });

  const parsed = parseExtractionResponse(response.text);

  return {
    chunkId,
    entities: parsed.entities,
    relationships: parsed.relationships,
  };
}

/**
 * Extract entities from an entire article file.
 * Reads the file, splits into overlapping chunks, extracts from each.
 */
export async function extractEntitiesFromArticle(
  filePath: string
): Promise<ExtractionResult[]> {
  const content = await readFile(filePath, "utf-8");
  const articleName = filePath.split("/").pop() ?? filePath;
  const sourceId = articleName.replace(/\.[^.]+$/, "");

  const chunks = splitIntoChunks(content, sourceId);
  const results: ExtractionResult[] = [];

  for (const chunk of chunks) {
    const result = await extractEntitiesFromChunk(chunk.id, chunk.text, articleName);
    results.push(result);
  }

  return results;
}
