# GraphRAG Entity-Content Hybrid Infrastructure — Design Spec

## Goal
Add a knowledge graph layer (Neo4j) alongside existing Pinecone vector search, implementing Billy's entity-content hybrid topology where entities AND content chunks are first-class graph nodes. Hybrid retrieval combines vector similarity with graph traversal for grounded, hallucination-resistant responses.

## Architecture

```
KB Articles (508+ .md files)
    ↓
[Entity Extractor] → entities + relationships per chunk
    ↓
[Graph Builder] → Neo4j (entity nodes + chunk nodes + edges)
    ↓
[Hybrid Query Engine] → Pinecone (vector) + Neo4j (graph) combined
    ↓
[getKbContext()] → agents get graph-grounded context
```

## Components

### 1. Neo4j Connection (`lib/neo4j.ts`)
- Neo4j driver singleton, configurable via `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- Works with Neo4j Aura Free (cloud) or local Docker
- Connection pool, health check, graceful shutdown

### 2. Entity Extractor (`core/kb/graphrag/entityExtractor.ts`)
- Reads KB article, splits into chunks (reuse existing chunking)
- LLM-powered NER: extract entities (CONCEPT, TOOL, COMPANY, PERSON, PROTOCOL) + relationships
- Uses DeepSeek for cost efficiency (bulk extraction across 500+ articles)
- Output: `{ entities: [{name, type, description}], relationships: [{source, target, type, description}] }` per chunk

### 3. Graph Builder (`core/kb/graphrag/graphBuilder.ts`)
- Entity resolution (deduplicate: "Neo4j" = "neo4j" = "Neo4J")
- Creates entity nodes with properties (name, type, description, aliases)
- Creates chunk nodes with properties (text, source_article, position, section)
- Creates edges: entity→chunk (DESCRIBED_IN), chunk→entity (MENTIONS), entity→entity (RELATES_TO with grounding_chunk)
- Idempotent: can re-run without duplicating

### 4. Hybrid Query Engine (`core/kb/graphrag/hybridQuery.ts`)
- Input: user query string
- Step 1: Extract query entities via LLM
- Step 2: Pinecone vector search (existing, top 10)
- Step 3: Neo4j graph traversal from query entities (entity→chunk→entity, depth 2-3)
- Step 4: Merge + deduplicate + rank results (vector score + graph proximity)
- Output: ranked chunks with source attribution and traversal path

### 5. Indexing Pipeline (`core/kb/graphrag/indexPipeline.ts`)
- Orchestrates: scan KB → chunk → extract entities → resolve → build graph
- Incremental: only processes files changed since last run
- Tracks state in `system_state` table (last indexed file hashes)

### 6. Integration (`core/kb/getKbContext.ts` modification)
- Add `GRAPHRAG_ENABLED` env flag
- When enabled: hybrid query replaces pure vector query
- Fallback: if Neo4j is down, fall back to Pinecone-only

## Data Model (Neo4j)

```cypher
// Entity node
(:Entity {name, type, description, aliases, first_seen, article_count})

// Chunk node
(:Chunk {id, text, source_article, section, position, word_count})

// Edges
(:Entity)-[:DESCRIBED_IN {confidence}]->(:Chunk)
(:Chunk)-[:MENTIONS {confidence}]->(:Entity)
(:Entity)-[:RELATES_TO {type, description, grounding_chunk, weight}]->(:Entity)
(:Chunk)-[:NEXT_IN_ARTICLE]->(:Chunk)
(:Chunk)-[:SHARES_ENTITY]->(:Chunk)
```

## Env Vars
```
NEO4J_URI=neo4j+s://xxx.databases.neo4j.io (or bolt://localhost:7687)
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxx
GRAPHRAG_ENABLED=true
GRAPHRAG_EXTRACTION_MODEL=deepseek (cheap bulk extraction)
GRAPHRAG_QUERY_MODEL=deepseek (query entity extraction)
```

## Cost Estimate
- Entity extraction: ~500 articles × ~$0.01/article (DeepSeek) = ~$5 one-time
- Neo4j Aura Free: $0/mo (up to 200K nodes, 400K relationships)
- Query overhead: +1 DeepSeek call per query for entity extraction (~$0.0003)
- Total incremental: ~$0.50/day on top of existing costs

## Safety
- Neo4j failure → automatic fallback to Pinecone-only
- Extraction errors → skip article, log, continue
- Graph builder is idempotent (MERGE not CREATE)
- Incremental indexing via file hash tracking
