# Metadata Enrichment for Knowledge Base Retrieval

## Introduction

Embeddings capture semantic meaning, but they cannot filter by date, boost results by authority, or distinguish between a Tier 1 product guide and a Tier 3 general reference article. Metadata fills this gap. When a customer asks "how do I cancel my subscription," the retrieval system should prioritize the current cancellation policy (not the archived 2023 version), filter to product documentation (not blog posts), and boost official support articles over community discussions. Metadata-aware retrieval combines vector similarity with structured filtering and scoring to deliver precise, contextually appropriate results. This article covers metadata extraction, schema design, enrichment pipelines, and the hybrid search patterns that make metadata-enriched retrieval work in production.

## Why Metadata Matters

### The Limitations of Embedding-Only Retrieval

Consider a knowledge base with 50,000 chunks from diverse sources: product documentation, blog posts, API references, internal policies, customer support transcripts, and community forum posts. A query about "appointment booking" returns the top-10 most semantically similar chunks — but half come from outdated blog posts, one is from an internal draft policy, and only three are from the current product documentation.

Without metadata, the retrieval system has no way to distinguish between these sources. Embeddings encode what the text means, not when it was written, who wrote it, what authority level it carries, or what category it belongs to.

### Metadata Functions in Retrieval

Metadata serves four distinct functions:

1. **Filtering:** Remove irrelevant results before ranking. "Show me only product documentation from the last 6 months."
2. **Boosting:** Increase scores for higher-authority or more relevant sources. "Tier 1 articles should rank higher than Tier 3."
3. **Context injection:** Add information to retrieved chunks that helps the LLM generate better answers. "This chunk is from the API Reference > Authentication section."
4. **Faceted navigation:** Enable users or agents to explore the knowledge base by category, date, source, or topic.

## Automated Metadata Extraction

### Entity Extraction

Named entity recognition (NER) identifies mentions of people, organizations, locations, dates, products, and domain-specific entities in text:

```python
from openai import OpenAI
import json

client = OpenAI()

ENTITY_EXTRACTION_PROMPT = """Extract structured metadata from the following text.
Return JSON with:
- entities: [{name, type}] where type is one of: PERSON, ORG, PRODUCT, LOCATION, DATE, TECHNOLOGY
- topics: [string] — 3-5 main topics covered
- document_type: one of: guide, reference, tutorial, policy, faq, blog, changelog
- technical_level: one of: beginner, intermediate, advanced
- sentiment: one of: positive, neutral, negative, instructional

Text: {text}"""

def extract_metadata(text: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": ENTITY_EXTRACTION_PROMPT.format(text=text)}],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

For cost-sensitive pipelines, local NER models provide entity extraction without API calls:

```python
import spacy

nlp = spacy.load("en_core_web_trf")

def extract_entities_local(text: str) -> list[dict]:
    doc = nlp(text)
    return [
        {"name": ent.text, "type": ent.label_, "start": ent.start_char, "end": ent.end_char}
        for ent in doc.ents
    ]
```

### Category Classification

Automatic categorization assigns chunks to predefined taxonomy nodes:

```python
CATEGORIES = [
    "product/features",
    "product/pricing",
    "product/setup",
    "support/troubleshooting",
    "support/billing",
    "support/account",
    "api/authentication",
    "api/endpoints",
    "api/webhooks",
    "internal/policy",
    "internal/process",
]

def classify_chunk(text: str, categories: list[str] = CATEGORIES) -> str:
    """Classify a text chunk into the most relevant category."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"Classify this text into exactly one category from: {categories}\n\nText: {text}\n\nReturn only the category string."
        }],
    )
    return response.choices[0].message.content.strip()
```

### Sentiment and Intent Detection

Understanding the sentiment and intent of source material helps the retrieval system match user intent:

```python
def detect_intent(text: str) -> dict:
    """Detect the communicative intent of a text chunk."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""Analyze the intent of this text. Return JSON with:
- primary_intent: one of [inform, instruct, warn, compare, troubleshoot, announce, persuade]
- audience: who this is written for
- actionable: boolean — does this text contain steps the reader should follow?

Text: {text}"""
        }],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

### Date Extraction and Temporal Metadata

Temporal metadata enables freshness-aware retrieval:

```python
import re
from datetime import datetime

def extract_temporal_metadata(text: str, file_metadata: dict) -> dict:
    """Extract temporal information from text and file metadata."""
    # Explicit dates in text
    date_patterns = [
        r'(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}',
        r'\d{4}-\d{2}-\d{2}',
        r'(?:Q[1-4])\s+\d{4}',
    ]

    dates_found = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text)
        dates_found.extend(matches)

    # Recency signals
    recency_keywords = {
        "current": 1.0,
        "latest": 1.0,
        "updated": 0.9,
        "new": 0.8,
        "recent": 0.8,
        "deprecated": 0.3,
        "legacy": 0.2,
        "archived": 0.1,
        "obsolete": 0.1,
    }

    recency_score = 0.5  # Default
    for keyword, score in recency_keywords.items():
        if keyword.lower() in text.lower():
            recency_score = max(recency_score, score)

    return {
        "dates_mentioned": dates_found,
        "created_at": file_metadata.get("created_at"),
        "modified_at": file_metadata.get("modified_at"),
        "recency_score": recency_score,
    }
```

## Schema Design for KB Metadata

### Core Metadata Schema

Every chunk in a production knowledge base should carry these metadata fields:

```typescript
interface ChunkMetadata {
  // Identity
  chunk_id: string;          // Unique identifier
  document_id: string;       // Parent document ID
  document_title: string;    // Parent document title

  // Classification
  tier: 1 | 2 | 3;          // Authority level (1=core, 2=context, 3=reference)
  category: string;          // Taxonomy category
  subcategory: string;       // Taxonomy subcategory
  tags: string[];            // Free-form tags

  // Content type
  content_type: "prose" | "code" | "table" | "list" | "mixed";
  document_type: "guide" | "reference" | "tutorial" | "policy" | "faq" | "api";
  technical_level: "beginner" | "intermediate" | "advanced";

  // Temporal
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
  recency_score: number;     // 0-1 freshness score

  // Source
  source: string;            // Origin system (kb, wiki, slack, email)
  author: string;            // Author or system that produced this
  authority_score: number;   // 0-1 source reliability

  // Structural
  position_in_document: number;  // Chunk order within document
  total_chunks_in_document: number;
  header_path: string;       // "Section > Subsection > Sub-subsection"
  parent_chunk_id?: string;  // For hierarchical chunking

  // Entities
  entities: string[];        // Named entities mentioned
  topics: string[];          // Topic labels

  // Quality
  embedding_model: string;   // Model used for embedding
  chunk_token_count: number; // Token count
}
```

### Metadata Storage Strategies

| Storage Approach | Pros | Cons | Best For |
|-----------------|------|------|----------|
| Vector DB metadata | Co-located with embeddings, filtered during search | Limited query capabilities, size limits | Simple filtering |
| Separate relational DB | Full SQL query power, joins, aggregations | Extra hop during retrieval | Complex metadata queries |
| Document store (Elastic) | Full-text + structured + vector search | Operational complexity | Large-scale mixed search |
| Embedded in chunk text | No extra storage, metadata in embedding | Pollutes embedding signal | Lightweight systems |

For most RAG systems, storing metadata in the vector database's built-in metadata fields (Pinecone's metadata, Qdrant's payload, Weaviate's properties) provides the best balance of simplicity and filtering capability.

## Metadata-Aware Retrieval

### Hybrid Search: Vector + Metadata Filters

The most common pattern: use metadata filters to narrow the search space before vector similarity ranking.

```python
from pinecone import Pinecone

pc = Pinecone(api_key="YOUR_KEY")
index = pc.Index("knowledge-base")

def metadata_aware_search(
    query: str,
    query_embedding: list[float],
    filters: dict = None,
    top_k: int = 10,
    boost_tier_1: bool = True,
) -> list[dict]:
    """Search with metadata filtering and tier-based boosting."""

    # Build Pinecone filter
    pinecone_filter = {}
    if filters:
        if filters.get("tier"):
            pinecone_filter["tier"] = {"$eq": filters["tier"]}
        if filters.get("category"):
            pinecone_filter["category"] = {"$eq": filters["category"]}
        if filters.get("min_recency"):
            pinecone_filter["recency_score"] = {"$gte": filters["min_recency"]}
        if filters.get("content_type"):
            pinecone_filter["content_type"] = {"$eq": filters["content_type"]}

    # Query with filters
    results = index.query(
        vector=query_embedding,
        top_k=top_k * 2,  # Over-fetch for re-ranking
        filter=pinecone_filter if pinecone_filter else None,
        include_metadata=True,
    )

    # Post-retrieval boosting
    scored_results = []
    for match in results.matches:
        score = match.score

        if boost_tier_1:
            tier = match.metadata.get("tier", 3)
            tier_boost = {1: 1.2, 2: 1.0, 3: 0.8}.get(tier, 1.0)
            score *= tier_boost

        # Recency boost
        recency = match.metadata.get("recency_score", 0.5)
        score *= (0.8 + 0.4 * recency)  # Range: 0.8 to 1.2

        scored_results.append({
            "id": match.id,
            "score": score,
            "text": match.metadata.get("text", ""),
            "metadata": match.metadata,
        })

    # Re-sort by boosted scores
    scored_results.sort(key=lambda x: x["score"], reverse=True)
    return scored_results[:top_k]
```

### Intent-Aware Filter Selection

Advanced systems detect the query intent and automatically apply appropriate metadata filters:

```python
def intent_to_filters(query: str) -> dict:
    """Map query intent to metadata filters."""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": f"""Given this query, determine the appropriate metadata filters.
Return JSON with optional fields: tier (1/2/3), category, content_type, min_recency (0-1).

Query: {query}"""
        }],
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)

# Usage
query = "How do I set up the Twilio integration?"
filters = intent_to_filters(query)
# Result: {"tier": 1, "category": "product/setup", "content_type": "prose", "min_recency": 0.7}
```

## Enrichment Pipeline Architecture

### The Full Pipeline

```
Document Ingestion
       │
       ▼
┌──────────────┐
│  Parse/Chunk  │  Split into chunks respecting structure
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Extract     │  Entities, categories, dates, intent
│   Metadata    │  (LLM-based or rule-based)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Validate    │  Schema validation, required fields check
│   & Clean     │  Deduplication, normalization
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Embed       │  Generate vector embeddings
│   & Index     │  Store with metadata in vector DB
└──────────────┘
```

### Production Implementation

```python
from dataclasses import dataclass, field
from typing import Optional
import hashlib

@dataclass
class EnrichmentResult:
    chunk_id: str
    text: str
    embedding: list[float]
    metadata: dict
    errors: list[str] = field(default_factory=list)

class MetadataEnrichmentPipeline:
    def __init__(self, embedding_client, llm_client, vector_index):
        self.embedder = embedding_client
        self.llm = llm_client
        self.index = vector_index

    async def process_document(self, document: dict) -> list[EnrichmentResult]:
        """Full enrichment pipeline for a single document."""
        results = []

        # Step 1: Chunk
        chunks = self._chunk_document(document)

        for i, chunk_text in enumerate(chunks):
            chunk_id = hashlib.sha256(
                f"{document['id']}:{i}".encode()
            ).hexdigest()[:16]

            # Step 2: Extract metadata
            try:
                extracted = extract_metadata(chunk_text)
            except Exception as e:
                extracted = {"entities": [], "topics": [], "document_type": "unknown"}

            # Step 3: Merge with document-level metadata
            metadata = {
                "chunk_id": chunk_id,
                "document_id": document["id"],
                "document_title": document.get("title", "Untitled"),
                "tier": document.get("tier", 3),
                "source": document.get("source", "unknown"),
                "created_at": document.get("created_at", ""),
                "updated_at": document.get("updated_at", ""),
                "position_in_document": i,
                "total_chunks_in_document": len(chunks),
                "chunk_token_count": len(chunk_text.split()),
                **extracted,
            }

            # Step 4: Validate
            errors = self._validate_metadata(metadata)

            # Step 5: Embed
            embedding = self.embedder.encode(chunk_text)

            results.append(EnrichmentResult(
                chunk_id=chunk_id,
                text=chunk_text,
                embedding=embedding,
                metadata=metadata,
                errors=errors,
            ))

        return results

    def _validate_metadata(self, metadata: dict) -> list[str]:
        """Validate required metadata fields."""
        errors = []
        required_fields = ["chunk_id", "document_id", "tier", "source"]
        for field_name in required_fields:
            if not metadata.get(field_name):
                errors.append(f"Missing required field: {field_name}")

        if metadata.get("tier") not in [1, 2, 3]:
            errors.append(f"Invalid tier value: {metadata.get('tier')}")

        return errors
```

## Atlas UX's Approach: Tier-Weighted Scoring

Atlas UX's knowledge base uses a tiered metadata system that combines namespace isolation with weighted scoring:

### Tier System

- **Tier 1 (Core):** Product documentation, API references, official policies. Highest retrieval priority.
- **Tier 2 (Context):** Industry knowledge, comparison guides, best practices. Standard retrieval weight.
- **Tier 3 (Reference):** General reference material, background reading, supplementary content. Lowest retrieval priority.

### Context-Enriched Headers

Every KB document starts with a metadata header that gets embedded alongside the content:

```
[Tier 1][Product][voice, telephony, ElevenLabs]
# Lucy Voice Agent Setup Guide

Lucy uses ElevenLabs Conversational AI to answer phone calls...
```

The `[Tier][Category][Tags]` prefix becomes part of the embedding, biasing retrieval toward correctly categorized chunks without requiring post-hoc metadata filtering.

### Weighted Scoring

Retrieval scores are adjusted by tier weight before ranking:

```
final_score = vector_similarity * tier_weight * recency_factor
```

Where `tier_weight` is 1.3 for Tier 1, 1.0 for Tier 2, and 0.7 for Tier 3. This ensures that core product documentation outranks general reference material even when both are semantically relevant.

## Conclusion

Metadata enrichment transforms a flat collection of text chunks into a structured, queryable knowledge base where authority, recency, category, and content type inform retrieval decisions alongside semantic similarity. The investment in building an enrichment pipeline — entity extraction, categorization, temporal analysis, and schema-validated metadata — pays dividends on every retrieval operation. For AI agent knowledge bases, metadata is not optional: it is the mechanism that ensures agents retrieve authoritative, current, correctly categorized knowledge rather than the most semantically similar text regardless of source quality or recency.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Metadata_model_general.svg/400px-Metadata_model_general.svg.png — General metadata model showing relationships between metadata elements
2. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Precision_and_recall.svg/400px-Precision_and_recall.svg.png — Precision and recall diagram showing the impact of metadata filtering on search quality
3. https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Pipeline_software.svg/400px-Pipeline_software.svg.png — Software pipeline architecture diagram representing the enrichment pipeline stages
4. https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopology-Star.svg/400px-NetworkTopology-Star.svg.png — Star topology diagram illustrating metadata hub connecting to multiple chunk attributes
5. https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Vector_space_model.png/400px-Vector_space_model.png — Vector space model showing how metadata filtering narrows the search space

## Videos

1. https://www.youtube.com/watch?v=bjb_EMsTDKI — "Advanced RAG Techniques: Metadata Filtering and Hybrid Search" by LlamaIndex demonstrating metadata-enhanced retrieval
2. https://www.youtube.com/watch?v=J_tCD_J6w1s — "Building Production RAG Systems" by Pinecone covering metadata schema design and filtering strategies

## References

1. Pinecone Documentation. "Metadata Filtering." https://docs.pinecone.io/guides/data/filter-with-metadata
2. Weaviate Documentation. "Filtered Vector Search." https://weaviate.io/developers/weaviate/search/filters
3. LlamaIndex Documentation. "Metadata Extraction and Usage." https://docs.llamaindex.ai/en/stable/module_guides/loading/documents_and_nodes/usage_metadata_extractor/
4. Qdrant Documentation. "Payload Filtering." https://qdrant.tech/documentation/concepts/filtering/
