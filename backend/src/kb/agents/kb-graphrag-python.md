# Python Architecture for GraphRAG Implementation

## Introduction

Building a GraphRAG system from scratch requires integrating multiple components: entity extraction, graph construction, community detection, summarization, and hybrid query pipelines. This article provides a complete Python implementation guide — not a conceptual overview, but working code for each stage of the pipeline. Every function can be copied, adapted, and deployed. The architecture uses networkx for graph operations, neo4j-driver for persistent graph storage, sentence-transformers for embeddings, and LangChain for LLM orchestration. By the end, you will have a functional GraphRAG system that handles both local factual queries and global analytical questions.

## Dependencies and Setup

### Core Dependencies

```bash
pip install networkx neo4j sentence-transformers langchain langchain-openai \
            graspologic numpy pandas pydantic openai chromadb tiktoken
```

### Project Structure

```
graphrag/
├── __init__.py
├── config.py           # Configuration and environment variables
├── extraction.py       # Entity and relationship extraction
├── graph.py            # Graph construction and management
├── community.py        # Community detection and summarization
├── indexing.py         # Full indexing pipeline
├── query.py            # Local and global query engines
├── embeddings.py       # Embedding utilities
├── chunking.py         # Document chunking
└── utils.py            # Shared utilities
```

### Configuration

```python
# config.py
from pydantic import BaseModel
from typing import Optional
import os

class GraphRAGConfig(BaseModel):
    # LLM
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    extraction_model: str = "gpt-4o"
    summarization_model: str = "gpt-4o-mini"

    # Embeddings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimensions: int = 384

    # Chunking
    chunk_size: int = 400
    chunk_overlap: int = 50

    # Graph
    neo4j_uri: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "password")

    # Community Detection
    leiden_resolution: float = 1.0
    min_community_size: int = 3
    max_community_levels: int = 3

    # Query
    local_search_top_k: int = 10
    global_search_community_level: int = 1

config = GraphRAGConfig()
```

## Document Chunking

```python
# chunking.py
from dataclasses import dataclass
import tiktoken
import re

@dataclass
class TextChunk:
    id: str
    text: str
    document_id: str
    chunk_index: int
    token_count: int
    metadata: dict

class DocumentChunker:
    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.tokenizer = tiktoken.encoding_for_model("gpt-4o")

    def chunk_document(self, text: str, document_id: str,
                       metadata: dict = None) -> list[TextChunk]:
        """Split document into overlapping chunks by token count."""
        # First split by paragraphs
        paragraphs = re.split(r'\n\n+', text)

        chunks = []
        current_chunk_tokens = []
        current_chunk_text = []
        chunk_index = 0

        for paragraph in paragraphs:
            para_tokens = self.tokenizer.encode(paragraph)

            if len(current_chunk_tokens) + len(para_tokens) > self.chunk_size:
                if current_chunk_text:
                    chunk_text = "\n\n".join(current_chunk_text)
                    chunks.append(TextChunk(
                        id=f"{document_id}:chunk-{chunk_index}",
                        text=chunk_text,
                        document_id=document_id,
                        chunk_index=chunk_index,
                        token_count=len(current_chunk_tokens),
                        metadata=metadata or {},
                    ))
                    chunk_index += 1

                    # Keep overlap
                    overlap_text = current_chunk_text[-1] if current_chunk_text else ""
                    current_chunk_text = [overlap_text, paragraph] if overlap_text else [paragraph]
                    current_chunk_tokens = self.tokenizer.encode(
                        "\n\n".join(current_chunk_text)
                    )
                else:
                    # Single paragraph exceeds chunk size — include it anyway
                    current_chunk_text = [paragraph]
                    current_chunk_tokens = para_tokens
            else:
                current_chunk_text.append(paragraph)
                current_chunk_tokens.extend(para_tokens)

        # Last chunk
        if current_chunk_text:
            chunk_text = "\n\n".join(current_chunk_text)
            chunks.append(TextChunk(
                id=f"{document_id}:chunk-{chunk_index}",
                text=chunk_text,
                document_id=document_id,
                chunk_index=chunk_index,
                token_count=len(self.tokenizer.encode(chunk_text)),
                metadata=metadata or {},
            ))

        return chunks
```

## Entity Extraction Pipeline

### NER and Relationship Extraction

```python
# extraction.py
from dataclasses import dataclass, field
from openai import OpenAI
import json
from typing import Optional

@dataclass
class ExtractedEntity:
    name: str
    type: str
    description: str
    source_chunk_id: str

@dataclass
class ExtractedRelationship:
    source_entity: str
    target_entity: str
    relationship_type: str
    description: str
    strength: int  # 1-10
    source_chunk_id: str

@dataclass
class ExtractionResult:
    entities: list[ExtractedEntity]
    relationships: list[ExtractedRelationship]
    source_chunk_id: str

EXTRACTION_SYSTEM_PROMPT = """You are an expert at extracting structured knowledge from text.
Given a text passage, extract all entities and the relationships between them.

Entity types: PERSON, ORGANIZATION, CONCEPT, TECHNOLOGY, LOCATION, PROCESS, SERVICE, PRODUCT

For each entity provide:
- name: canonical name (capitalized)
- type: one of the types above
- description: 1-2 sentence description based on the text

For each relationship provide:
- source_entity: name of source entity
- target_entity: name of target entity
- relationship_type: verb phrase (e.g., USES, REQUIRES, PRODUCES, PART_OF, LOCATED_IN)
- description: 1 sentence describing the relationship
- strength: 1-10 indicating importance/certainty

Return valid JSON with keys "entities" and "relationships"."""

EXTRACTION_USER_PROMPT = """Extract entities and relationships from this text:

{text}

Return JSON with "entities" and "relationships" arrays."""

class EntityExtractor:
    def __init__(self, model: str = "gpt-4o", api_key: Optional[str] = None):
        self.client = OpenAI(api_key=api_key)
        self.model = model

    def extract(self, chunk: "TextChunk") -> ExtractionResult:
        """Extract entities and relationships from a text chunk."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": EXTRACTION_USER_PROMPT.format(text=chunk.text)},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )

        data = json.loads(response.choices[0].message.content)

        entities = [
            ExtractedEntity(
                name=e["name"].strip(),
                type=e.get("type", "CONCEPT"),
                description=e.get("description", ""),
                source_chunk_id=chunk.id,
            )
            for e in data.get("entities", [])
        ]

        relationships = [
            ExtractedRelationship(
                source_entity=r["source_entity"].strip(),
                target_entity=r["target_entity"].strip(),
                relationship_type=r.get("relationship_type", "RELATED_TO"),
                description=r.get("description", ""),
                strength=r.get("strength", 5),
                source_chunk_id=chunk.id,
            )
            for r in data.get("relationships", [])
        ]

        return ExtractionResult(
            entities=entities,
            relationships=relationships,
            source_chunk_id=chunk.id,
        )

    def extract_batch(self, chunks: list["TextChunk"],
                      show_progress: bool = True) -> list[ExtractionResult]:
        """Extract from multiple chunks with progress tracking."""
        results = []
        for i, chunk in enumerate(chunks):
            if show_progress and i % 10 == 0:
                print(f"Extracting entities: {i}/{len(chunks)} chunks processed")
            try:
                result = self.extract(chunk)
                results.append(result)
            except Exception as e:
                print(f"Error extracting from chunk {chunk.id}: {e}")
                results.append(ExtractionResult([], [], chunk.id))
        return results
```

### Entity Resolution

```python
# extraction.py (continued)
from sentence_transformers import SentenceTransformer
import numpy as np

class EntityResolver:
    def __init__(self, similarity_threshold: float = 0.85):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.threshold = similarity_threshold

    def resolve(self, entities: list[ExtractedEntity]) -> dict[str, str]:
        """Merge duplicate entity references. Returns mapping: original_name → canonical_name."""
        if not entities:
            return {}

        # Group by normalized name
        name_groups: dict[str, list[ExtractedEntity]] = {}
        for entity in entities:
            normalized = entity.name.lower().strip()
            name_groups.setdefault(normalized, []).append(entity)

        # Get unique entity names and their descriptions
        unique_entities = []
        for normalized, group in name_groups.items():
            # Use the most frequent original casing
            names = [e.name for e in group]
            canonical = max(set(names), key=names.count)
            description = max([e.description for e in group], key=len)
            unique_entities.append({
                "canonical": canonical,
                "description": description,
                "normalized": normalized,
            })

        # Embed descriptions for similarity comparison
        descriptions = [e["description"] for e in unique_entities]
        embeddings = self.model.encode(descriptions) if descriptions else []

        # Find similar entities to merge
        merge_map: dict[str, str] = {}  # original_name → canonical_name

        for i in range(len(unique_entities)):
            if unique_entities[i]["canonical"] in merge_map.values():
                continue  # Already merged into another entity
            for j in range(i + 1, len(unique_entities)):
                if unique_entities[j]["canonical"] in merge_map:
                    continue
                sim = np.dot(embeddings[i], embeddings[j]) / (
                    np.linalg.norm(embeddings[i]) * np.linalg.norm(embeddings[j])
                )
                if sim >= self.threshold:
                    # Merge: keep the one with the longer description as canonical
                    if len(unique_entities[i]["description"]) >= len(unique_entities[j]["description"]):
                        merge_map[unique_entities[j]["canonical"]] = unique_entities[i]["canonical"]
                    else:
                        merge_map[unique_entities[i]["canonical"]] = unique_entities[j]["canonical"]

        # Build full mapping for all original entity names
        full_map = {}
        for entity in entities:
            canonical = entity.name
            # Follow the merge chain
            while canonical in merge_map:
                canonical = merge_map[canonical]
            full_map[entity.name] = canonical

        return full_map
```

## Graph Construction

```python
# graph.py
import networkx as nx
from dataclasses import dataclass
from typing import Optional

@dataclass
class KnowledgeGraphNode:
    name: str
    type: str
    description: str
    source_chunks: list[str]

@dataclass
class KnowledgeGraphEdge:
    source: str
    target: str
    relationship_type: str
    description: str
    weight: float
    source_chunks: list[str]

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.Graph()
        self._node_data: dict[str, KnowledgeGraphNode] = {}
        self._edge_data: dict[tuple, KnowledgeGraphEdge] = {}

    def build_from_extractions(
        self,
        extraction_results: list["ExtractionResult"],
        entity_map: dict[str, str],
    ) -> None:
        """Build graph from extraction results with entity resolution applied."""
        # Add nodes
        for result in extraction_results:
            for entity in result.entities:
                canonical_name = entity_map.get(entity.name, entity.name)

                if canonical_name in self._node_data:
                    # Merge: append source chunk and update description if longer
                    existing = self._node_data[canonical_name]
                    if entity.source_chunk_id not in existing.source_chunks:
                        existing.source_chunks.append(entity.source_chunk_id)
                    if len(entity.description) > len(existing.description):
                        existing.description = entity.description
                else:
                    self._node_data[canonical_name] = KnowledgeGraphNode(
                        name=canonical_name,
                        type=entity.type,
                        description=entity.description,
                        source_chunks=[entity.source_chunk_id],
                    )
                    self.graph.add_node(canonical_name, **{
                        "type": entity.type,
                        "description": entity.description,
                    })

        # Add edges
        for result in extraction_results:
            for rel in result.relationships:
                source = entity_map.get(rel.source_entity, rel.source_entity)
                target = entity_map.get(rel.target_entity, rel.target_entity)

                if source not in self._node_data or target not in self._node_data:
                    continue  # Skip edges to unknown entities

                edge_key = (source, target)
                if edge_key in self._edge_data:
                    existing = self._edge_data[edge_key]
                    existing.weight = max(existing.weight, rel.strength / 10)
                    if rel.source_chunk_id not in existing.source_chunks:
                        existing.source_chunks.append(rel.source_chunk_id)
                else:
                    self._edge_data[edge_key] = KnowledgeGraphEdge(
                        source=source,
                        target=target,
                        relationship_type=rel.relationship_type,
                        description=rel.description,
                        weight=rel.strength / 10,
                        source_chunks=[rel.source_chunk_id],
                    )
                    self.graph.add_edge(source, target, **{
                        "relationship": rel.relationship_type,
                        "description": rel.description,
                        "weight": rel.strength / 10,
                    })

    def get_node_neighborhood(self, node_name: str, depth: int = 2) -> nx.Graph:
        """Get the subgraph within `depth` hops of a node."""
        if node_name not in self.graph:
            return nx.Graph()

        nodes = {node_name}
        frontier = {node_name}
        for _ in range(depth):
            next_frontier = set()
            for n in frontier:
                next_frontier.update(self.graph.neighbors(n))
            nodes.update(next_frontier)
            frontier = next_frontier

        return self.graph.subgraph(nodes)

    def get_statistics(self) -> dict:
        """Return graph statistics."""
        return {
            "nodes": self.graph.number_of_nodes(),
            "edges": self.graph.number_of_edges(),
            "density": nx.density(self.graph),
            "components": nx.number_connected_components(self.graph),
            "avg_degree": sum(dict(self.graph.degree()).values()) / max(self.graph.number_of_nodes(), 1),
        }

    def persist_to_neo4j(self, uri: str, user: str, password: str) -> None:
        """Export graph to Neo4j for persistent storage."""
        from neo4j import GraphDatabase

        driver = GraphDatabase.driver(uri, auth=(user, password))

        with driver.session() as session:
            # Clear existing data
            session.run("MATCH (n) DETACH DELETE n")

            # Create nodes
            for name, data in self._node_data.items():
                session.run(
                    "CREATE (e:Entity {name: $name, type: $type, description: $desc, source_chunks: $chunks})",
                    name=name, type=data.type, desc=data.description, chunks=data.source_chunks,
                )

            # Create edges
            for (source, target), data in self._edge_data.items():
                session.run(
                    """MATCH (a:Entity {name: $source}), (b:Entity {name: $target})
                       CREATE (a)-[r:RELATES_TO {type: $rel_type, description: $desc, weight: $weight}]->(b)""",
                    source=source, target=target, rel_type=data.relationship_type,
                    desc=data.description, weight=data.weight,
                )

        driver.close()
```

## Community Detection with Leiden Algorithm

```python
# community.py
import networkx as nx
from graspologic.partition import leiden
from dataclasses import dataclass
from openai import OpenAI
import json

@dataclass
class Community:
    id: str
    level: int
    entity_names: list[str]
    title: str
    summary: str
    importance: float  # 0-1

class CommunityDetector:
    def __init__(self, config: "GraphRAGConfig"):
        self.config = config
        self.client = OpenAI(api_key=config.openai_api_key)

    def detect_communities(self, graph: nx.Graph) -> dict[int, list[Community]]:
        """Detect hierarchical communities using Leiden algorithm."""
        if graph.number_of_nodes() == 0:
            return {}

        communities_by_level = {}
        resolutions = [2.0, 1.0, 0.5]  # Fine → coarse

        for level, resolution in enumerate(resolutions[:self.config.max_community_levels]):
            partition = leiden(graph, resolution=resolution)

            # Group nodes by community
            community_members: dict[int, list[str]] = {}
            for node, community_id in partition.items():
                community_members.setdefault(community_id, []).append(node)

            # Filter out tiny communities
            communities = []
            for comm_id, members in community_members.items():
                if len(members) >= self.config.min_community_size:
                    communities.append(Community(
                        id=f"comm-L{level}-{comm_id}",
                        level=level,
                        entity_names=members,
                        title="",   # Will be filled by summarization
                        summary="",
                        importance=0,
                    ))

            communities_by_level[level] = communities

        return communities_by_level

    def summarize_communities(
        self,
        communities: dict[int, list[Community]],
        graph: nx.Graph,
    ) -> dict[int, list[Community]]:
        """Generate LLM summaries for each community."""
        for level, comms in communities.items():
            for community in comms:
                # Gather entity descriptions and relationships
                entity_descriptions = []
                relationship_descriptions = []

                for name in community.entity_names:
                    node_data = graph.nodes.get(name, {})
                    entity_descriptions.append(
                        f"- {name} ({node_data.get('type', 'unknown')}): {node_data.get('description', 'No description')}"
                    )

                    for neighbor in graph.neighbors(name):
                        if neighbor in community.entity_names:
                            edge_data = graph.edges[name, neighbor]
                            relationship_descriptions.append(
                                f"- {name} --[{edge_data.get('relationship', 'RELATED_TO')}]--> {neighbor}: {edge_data.get('description', '')}"
                            )

                prompt = f"""Summarize this community of related entities from a knowledge graph.

Entities:
{chr(10).join(entity_descriptions)}

Relationships:
{chr(10).join(relationship_descriptions)}

Provide a JSON response with:
- title: A concise title for this community (5-10 words)
- summary: A 2-3 paragraph summary of the key themes and relationships
- importance: A score from 0 to 1 indicating the importance of this community"""

                try:
                    response = self.client.chat.completions.create(
                        model=self.config.summarization_model,
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        temperature=0,
                    )
                    data = json.loads(response.choices[0].message.content)
                    community.title = data.get("title", "Untitled Community")
                    community.summary = data.get("summary", "")
                    community.importance = data.get("importance", 0.5)
                except Exception as e:
                    print(f"Error summarizing community {community.id}: {e}")
                    community.title = f"Community: {', '.join(community.entity_names[:3])}"
                    community.summary = f"A group of {len(community.entity_names)} related entities."
                    community.importance = 0.5

        return communities
```

## Query Pipeline

### Local Search (Entity-Based)

```python
# query.py
import numpy as np
from sentence_transformers import SentenceTransformer
from openai import OpenAI
from typing import Optional

class LocalSearchEngine:
    def __init__(self, config: "GraphRAGConfig", knowledge_graph: "KnowledgeGraph",
                 chunks: list["TextChunk"], communities: dict):
        self.config = config
        self.kg = knowledge_graph
        self.chunks = {c.id: c for c in chunks}
        self.communities = communities
        self.embedder = SentenceTransformer(config.embedding_model)
        self.llm = OpenAI(api_key=config.openai_api_key)

        # Pre-compute entity name embeddings for matching
        self.entity_names = list(knowledge_graph.graph.nodes())
        if self.entity_names:
            self.entity_embeddings = self.embedder.encode(self.entity_names)
        else:
            self.entity_embeddings = np.array([])

    def search(self, query: str) -> str:
        """Local search: find relevant entities, traverse graph, generate answer."""
        # Step 1: Find relevant entities
        query_embedding = self.embedder.encode(query)
        relevant_entities = self._find_relevant_entities(query_embedding, top_k=5)

        # Step 2: Get graph neighborhoods
        context_parts = []
        source_chunk_ids = set()

        for entity_name, score in relevant_entities:
            subgraph = self.kg.get_node_neighborhood(entity_name, depth=2)

            # Collect entity descriptions
            for node in subgraph.nodes():
                node_data = self.kg.graph.nodes[node]
                context_parts.append(
                    f"Entity: {node} (type: {node_data.get('type', 'unknown')})\n"
                    f"Description: {node_data.get('description', 'N/A')}"
                )

                # Collect source chunks
                if node in self.kg._node_data:
                    source_chunk_ids.update(self.kg._node_data[node].source_chunks)

            # Collect relationship descriptions
            for u, v, data in subgraph.edges(data=True):
                context_parts.append(
                    f"Relationship: {u} --[{data.get('relationship', 'RELATED_TO')}]--> {v}\n"
                    f"Description: {data.get('description', 'N/A')}"
                )

        # Step 3: Include relevant source chunks
        chunk_texts = []
        for chunk_id in list(source_chunk_ids)[:10]:
            if chunk_id in self.chunks:
                chunk_texts.append(self.chunks[chunk_id].text)

        # Step 4: Generate answer
        context = "\n\n---\n\n".join(context_parts)
        source_text = "\n\n---\n\n".join(chunk_texts[:5])

        prompt = f"""Answer the following question based on the provided knowledge graph context and source documents.

Question: {query}

Knowledge Graph Context:
{context}

Source Documents:
{source_text}

Provide a comprehensive answer based on the available information. If the information is insufficient, state what is known and what is missing."""

        response = self.llm.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )

        return response.choices[0].message.content

    def _find_relevant_entities(self, query_embedding: np.ndarray,
                                 top_k: int = 5) -> list[tuple[str, float]]:
        """Find entities most relevant to the query."""
        if len(self.entity_embeddings) == 0:
            return []

        similarities = np.dot(self.entity_embeddings, query_embedding) / (
            np.linalg.norm(self.entity_embeddings, axis=1) * np.linalg.norm(query_embedding)
        )

        top_indices = np.argsort(similarities)[-top_k:][::-1]
        return [(self.entity_names[i], float(similarities[i])) for i in top_indices]
```

### Global Search (Community-Based)

```python
# query.py (continued)
class GlobalSearchEngine:
    def __init__(self, config: "GraphRAGConfig", communities: dict):
        self.config = config
        self.communities = communities
        self.llm = OpenAI(api_key=config.openai_api_key)

    def search(self, query: str) -> str:
        """Global search: use community summaries for broad analytical queries."""
        level = self.config.global_search_community_level
        comms = self.communities.get(level, [])

        if not comms:
            return "No community summaries available for global search."

        # Sort by importance
        sorted_comms = sorted(comms, key=lambda c: c.importance, reverse=True)

        # Map phase: generate partial answers from each community
        partial_answers = []
        for community in sorted_comms[:20]:  # Limit to top 20 communities
            map_prompt = f"""Given the following community summary from a knowledge graph, provide any information relevant to the question. If the community is not relevant, respond with "NOT RELEVANT".

Question: {query}

Community: {community.title}
Summary: {community.summary}
Entities: {', '.join(community.entity_names[:10])}"""

            try:
                response = self.llm.chat.completions.create(
                    model=self.config.summarization_model,
                    messages=[{"role": "user", "content": map_prompt}],
                    temperature=0,
                    max_tokens=300,
                )
                answer = response.choices[0].message.content
                if "NOT RELEVANT" not in answer.upper():
                    partial_answers.append({
                        "community": community.title,
                        "answer": answer,
                        "importance": community.importance,
                    })
            except Exception as e:
                print(f"Error in map phase for {community.id}: {e}")

        if not partial_answers:
            return "No relevant information found across knowledge graph communities."

        # Reduce phase: synthesize partial answers
        partial_text = "\n\n---\n\n".join(
            f"[{pa['community']}]\n{pa['answer']}" for pa in partial_answers
        )

        reduce_prompt = f"""Synthesize the following partial answers into a comprehensive response to the question. Each partial answer comes from a different topic community in the knowledge graph. Combine and organize the information, removing redundancies and resolving any contradictions.

Question: {query}

Partial Answers:
{partial_text}

Provide a well-structured, comprehensive answer."""

        response = self.llm.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": reduce_prompt}],
            temperature=0,
        )

        return response.choices[0].message.content
```

### Query Router

```python
# query.py (continued)
class QueryRouter:
    def __init__(self, config: "GraphRAGConfig", local_engine: LocalSearchEngine,
                 global_engine: GlobalSearchEngine):
        self.config = config
        self.local = local_engine
        self.global_search = global_engine
        self.llm = OpenAI(api_key=config.openai_api_key)

    def query(self, question: str) -> dict:
        """Route query to local or global search based on question type."""
        query_type = self._classify_query(question)

        if query_type == "local":
            answer = self.local.search(question)
        else:
            answer = self.global_search.search(question)

        return {
            "question": question,
            "query_type": query_type,
            "answer": answer,
        }

    def _classify_query(self, question: str) -> str:
        """Classify whether a query needs local or global search."""
        response = self.llm.chat.completions.create(
            model=self.config.summarization_model,
            messages=[{
                "role": "user",
                "content": f"""Classify this question as either "local" or "global".

LOCAL: Questions about specific facts, entities, or relationships.
Examples: "What does Lucy do?", "How does appointment booking work?", "What is the pricing?"

GLOBAL: Questions requiring broad analysis, summarization, or thematic understanding.
Examples: "What are the main features?", "Summarize the platform capabilities", "What themes emerge?"

Question: {question}

Respond with only "local" or "global"."""
            }],
            temperature=0,
            max_tokens=10,
        )
        return response.choices[0].message.content.strip().lower()
```

## Full Indexing Pipeline

```python
# indexing.py
from .config import GraphRAGConfig
from .chunking import DocumentChunker
from .extraction import EntityExtractor, EntityResolver
from .graph import KnowledgeGraph
from .community import CommunityDetector

class GraphRAGIndexer:
    def __init__(self, config: GraphRAGConfig = None):
        self.config = config or GraphRAGConfig()
        self.chunker = DocumentChunker(
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
        )
        self.extractor = EntityExtractor(
            model=self.config.extraction_model,
            api_key=self.config.openai_api_key,
        )
        self.resolver = EntityResolver()
        self.kg = KnowledgeGraph()
        self.community_detector = CommunityDetector(self.config)

    def index(self, documents: list[dict]) -> dict:
        """Full indexing pipeline: chunk → extract → resolve → graph → communities."""
        stats = {"documents": len(documents), "chunks": 0, "entities": 0,
                 "relationships": 0, "communities": 0}

        # Step 1: Chunk documents
        print("Step 1: Chunking documents...")
        all_chunks = []
        for doc in documents:
            chunks = self.chunker.chunk_document(
                doc["text"], doc["id"], doc.get("metadata", {})
            )
            all_chunks.extend(chunks)
        stats["chunks"] = len(all_chunks)
        print(f"  Created {len(all_chunks)} chunks from {len(documents)} documents")

        # Step 2: Extract entities and relationships
        print("Step 2: Extracting entities and relationships...")
        extraction_results = self.extractor.extract_batch(all_chunks)
        all_entities = [e for r in extraction_results for e in r.entities]
        all_rels = [r for res in extraction_results for r in res.relationships]
        stats["entities"] = len(all_entities)
        stats["relationships"] = len(all_rels)
        print(f"  Extracted {len(all_entities)} entities and {len(all_rels)} relationships")

        # Step 3: Entity resolution
        print("Step 3: Resolving entities...")
        entity_map = self.resolver.resolve(all_entities)
        unique_entities = len(set(entity_map.values()))
        print(f"  Resolved to {unique_entities} unique entities")

        # Step 4: Build knowledge graph
        print("Step 4: Building knowledge graph...")
        self.kg.build_from_extractions(extraction_results, entity_map)
        graph_stats = self.kg.get_statistics()
        print(f"  Graph: {graph_stats['nodes']} nodes, {graph_stats['edges']} edges")

        # Step 5: Community detection
        print("Step 5: Detecting communities...")
        communities = self.community_detector.detect_communities(self.kg.graph)
        for level, comms in communities.items():
            print(f"  Level {level}: {len(comms)} communities")
            stats["communities"] += len(comms)

        # Step 6: Community summarization
        print("Step 6: Summarizing communities...")
        communities = self.community_detector.summarize_communities(communities, self.kg.graph)

        # Optional: Persist to Neo4j
        if self.config.neo4j_uri:
            print("Step 7: Persisting to Neo4j...")
            try:
                self.kg.persist_to_neo4j(
                    self.config.neo4j_uri,
                    self.config.neo4j_user,
                    self.config.neo4j_password,
                )
                print("  Persisted to Neo4j")
            except Exception as e:
                print(f"  Neo4j persistence failed (non-fatal): {e}")

        return {
            "stats": stats,
            "chunks": all_chunks,
            "knowledge_graph": self.kg,
            "communities": communities,
        }
```

## Integration with Existing Vector Stores

### Pinecone Integration

```python
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

class PineconeGraphRAGIntegration:
    def __init__(self, pinecone_api_key: str, index_name: str,
                 embedding_model: str = "all-MiniLM-L6-v2"):
        self.pc = Pinecone(api_key=pinecone_api_key)
        self.index = self.pc.Index(index_name)
        self.embedder = SentenceTransformer(embedding_model)

    def index_chunks_with_graph_metadata(
        self, chunks: list["TextChunk"], knowledge_graph: "KnowledgeGraph",
        communities: dict
    ) -> None:
        """Index chunks in Pinecone with graph-derived metadata."""
        vectors = []

        for chunk in chunks:
            embedding = self.embedder.encode(chunk.text).tolist()

            # Find entities mentioned in this chunk
            chunk_entities = []
            chunk_community_ids = []
            for name, node_data in knowledge_graph._node_data.items():
                if chunk.id in node_data.source_chunks:
                    chunk_entities.append(name)
                    # Find community membership
                    for level, comms in communities.items():
                        for comm in comms:
                            if name in comm.entity_names:
                                chunk_community_ids.append(comm.id)

            vectors.append({
                "id": chunk.id,
                "values": embedding,
                "metadata": {
                    "text": chunk.text[:1000],
                    "document_id": chunk.document_id,
                    "entities": chunk_entities[:20],
                    "community_ids": list(set(chunk_community_ids))[:10],
                    **chunk.metadata,
                },
            })

        # Batch upsert
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            self.index.upsert(vectors=vectors[i:i + batch_size])
```

### Chroma Integration

```python
import chromadb

class ChromaGraphRAGIntegration:
    def __init__(self, persist_dir: str = "./chroma_graphrag"):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="graphrag_chunks",
            metadata={"hnsw:space": "cosine"},
        )
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2")

    def index_chunks(self, chunks: list["TextChunk"],
                     knowledge_graph: "KnowledgeGraph") -> None:
        """Index chunks in Chroma with graph metadata."""
        ids = [c.id for c in chunks]
        documents = [c.text for c in chunks]
        embeddings = self.embedder.encode(documents).tolist()

        metadatas = []
        for chunk in chunks:
            entities = []
            for name, node_data in knowledge_graph._node_data.items():
                if chunk.id in node_data.source_chunks:
                    entities.append(name)
            metadatas.append({
                "document_id": chunk.document_id,
                "entities": ",".join(entities[:10]),
                **{k: str(v) for k, v in chunk.metadata.items()},
            })

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )
```

## Performance Tuning and Scaling

### Extraction Optimization

Entity extraction is the most expensive step (one LLM call per chunk). Optimization strategies:

| Strategy | Speed Improvement | Quality Impact |
|----------|------------------|----------------|
| Use GPT-4o-mini for extraction | 3-5x faster, 5x cheaper | Slight quality reduction |
| Batch similar chunks | 2x throughput | Minimal |
| Cache extraction results | Infinite (on cache hit) | None |
| Parallel extraction | Linear with workers | None |
| Use local NER model first | 10x cheaper for simple entities | Miss complex relationships |

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

class ParallelExtractor:
    def __init__(self, extractor: EntityExtractor, max_workers: int = 5):
        self.extractor = extractor
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    async def extract_parallel(self, chunks: list["TextChunk"]) -> list["ExtractionResult"]:
        """Extract entities from multiple chunks in parallel."""
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(self.executor, self.extractor.extract, chunk)
            for chunk in chunks
        ]
        return await asyncio.gather(*tasks, return_exceptions=True)
```

### Graph Size Management

For large corpora (100K+ documents), the knowledge graph can grow unwieldy. Pruning strategies:

```python
def prune_graph(graph: nx.Graph, min_edge_weight: float = 0.3,
                min_degree: int = 2) -> nx.Graph:
    """Remove low-confidence edges and isolated nodes."""
    # Remove weak edges
    edges_to_remove = [
        (u, v) for u, v, d in graph.edges(data=True)
        if d.get("weight", 0) < min_edge_weight
    ]
    graph.remove_edges_from(edges_to_remove)

    # Remove low-degree nodes (likely noise)
    nodes_to_remove = [
        n for n, degree in graph.degree()
        if degree < min_degree
    ]
    graph.remove_nodes_from(nodes_to_remove)

    return graph
```

## Entity-Content Hybrid Topology

Most GraphRAG implementations choose either entity-centric graphs (nodes are entities, edges are relationships) or content-centric graphs (nodes are chunks, edges are co-occurrence or keyword overlap). Both have fundamental limitations. Entity-centric graphs lose the source material — you know Pinecone competes with Weaviate, but not where you learned that or what context surrounded it. Content-centric graphs have no real understanding — two chunks share a keyword, but the system cannot reason about what the keyword means.

The hybrid topology treats **both entities and content chunks as first-class nodes in the same graph**, creating alternating traversal paths:

```
Entity → Chunk → Entity → Chunk → Entity

[Pinecone] --described_in--> [chunk_042] --also_mentions--> [HNSW]
    |                                                          |
    |--compared_to--> [Weaviate] --described_in--> [chunk_089]-+
```

Every entity claim is grounded in a specific chunk. Every chunk connects to the entities it discusses. The graph alternates between **what things are** (entities) and **where we learned about them** (chunks).

### Data Model

```python
# hybrid_graph.py
from dataclasses import dataclass, field
from enum import Enum
import networkx as nx

class NodeType(Enum):
    ENTITY = "entity"
    CHUNK = "chunk"

class EdgeType(Enum):
    DESCRIBED_IN = "described_in"       # entity → chunk (entity is discussed in chunk)
    MENTIONS = "mentions"               # chunk → entity (chunk discusses entity)
    RELATES_TO = "relates_to"           # entity → entity (semantic relationship)
    CITES = "cites"                     # chunk → chunk (citation/reference link)
    SOURCED_FROM = "sourced_from"       # chunk → source (article, URL, document)

@dataclass
class HybridNode:
    id: str
    node_type: NodeType
    name: str
    description: str
    metadata: dict = field(default_factory=dict)
    # For chunks: text content, position, article source
    # For entities: type (PERSON, ORG, CONCEPT, TOOL), aliases

@dataclass
class HybridEdge:
    source_id: str
    target_id: str
    edge_type: EdgeType
    weight: float = 1.0
    description: str = ""
    metadata: dict = field(default_factory=dict)

class HybridKnowledgeGraph:
    """Entity-Content Hybrid Graph — entities AND chunks as first-class nodes."""

    def __init__(self):
        self.graph = nx.DiGraph()  # Directed: described_in has direction
        self._nodes: dict[str, HybridNode] = {}

    def add_entity(self, entity_id: str, name: str, entity_type: str,
                   description: str, **metadata) -> None:
        self._nodes[entity_id] = HybridNode(
            id=entity_id, node_type=NodeType.ENTITY,
            name=name, description=description,
            metadata={"entity_type": entity_type, **metadata},
        )
        self.graph.add_node(entity_id, node_type="entity", name=name,
                            entity_type=entity_type, description=description)

    def add_chunk(self, chunk_id: str, text: str, source_article: str,
                  position: int, **metadata) -> None:
        self._nodes[chunk_id] = HybridNode(
            id=chunk_id, node_type=NodeType.CHUNK,
            name=f"chunk:{source_article}:{position}",
            description=text[:200],
            metadata={"full_text": text, "source": source_article,
                       "position": position, **metadata},
        )
        self.graph.add_node(chunk_id, node_type="chunk",
                            source=source_article, position=position)

    def link_entity_to_chunk(self, entity_id: str, chunk_id: str,
                              confidence: float = 1.0) -> None:
        """Entity is described in this chunk (grounding link)."""
        self.graph.add_edge(entity_id, chunk_id,
                            edge_type="described_in", weight=confidence)
        self.graph.add_edge(chunk_id, entity_id,
                            edge_type="mentions", weight=confidence)

    def link_entities(self, source_id: str, target_id: str,
                      relationship: str, weight: float = 1.0,
                      grounding_chunk: str = None) -> None:
        """Semantic relationship between entities, optionally grounded in a chunk."""
        self.graph.add_edge(source_id, target_id,
                            edge_type="relates_to",
                            relationship=relationship, weight=weight,
                            grounding_chunk=grounding_chunk)

    def link_chunks(self, source_chunk: str, target_chunk: str,
                    link_type: str = "cites") -> None:
        """Citation or reference link between chunks."""
        self.graph.add_edge(source_chunk, target_chunk,
                            edge_type=link_type, weight=0.5)
```

### Building the Hybrid Graph from Extraction Results

```python
def build_hybrid_graph(
    chunks: list[dict],
    extraction_results: list["ExtractionResult"],
    entity_map: dict[str, str],
) -> HybridKnowledgeGraph:
    """Build entity-content hybrid graph from chunks and extractions."""
    hg = HybridKnowledgeGraph()

    # Phase 1: Add all chunks as nodes
    for i, chunk in enumerate(chunks):
        hg.add_chunk(
            chunk_id=chunk["id"],
            text=chunk["text"],
            source_article=chunk.get("source", "unknown"),
            position=i,
            citations=chunk.get("citations", []),
            images=chunk.get("images", []),
            videos=chunk.get("videos", []),
        )

    # Phase 2: Add entities and link to their source chunks
    seen_entities: dict[str, str] = {}  # canonical_name → entity_id

    for result in extraction_results:
        for entity in result.entities:
            canonical = entity_map.get(entity.name, entity.name)
            entity_id = f"entity:{canonical.lower().replace(' ', '_')}"

            if entity_id not in seen_entities:
                hg.add_entity(
                    entity_id=entity_id,
                    name=canonical,
                    entity_type=entity.type,
                    description=entity.description,
                )
                seen_entities[canonical] = entity_id

            # Ground entity in its source chunk
            hg.link_entity_to_chunk(entity_id, result.chunk_id, confidence=0.9)

    # Phase 3: Add entity-entity relationships with chunk grounding
    for result in extraction_results:
        for rel in result.relationships:
            source_canonical = entity_map.get(rel.source_entity, rel.source_entity)
            target_canonical = entity_map.get(rel.target_entity, rel.target_entity)
            source_id = f"entity:{source_canonical.lower().replace(' ', '_')}"
            target_id = f"entity:{target_canonical.lower().replace(' ', '_')}"

            if source_id in seen_entities and target_id in seen_entities:
                hg.link_entities(
                    source_id=source_id,
                    target_id=target_id,
                    relationship=rel.relationship_type,
                    weight=rel.strength / 10,
                    grounding_chunk=result.chunk_id,  # Always grounded
                )

    # Phase 4: Link chunks via shared entities (implicit citation paths)
    for entity_id in seen_entities.values():
        connected_chunks = [
            n for n in hg.graph.neighbors(entity_id)
            if hg.graph.nodes[n].get("node_type") == "chunk"
        ]
        # Create chunk-to-chunk citation links through shared entities
        for i, c1 in enumerate(connected_chunks):
            for c2 in connected_chunks[i+1:]:
                hg.link_chunks(c1, c2, link_type="shares_entity")

    return hg
```

### Hybrid Query: Entity-Content Traversal

The key advantage of the hybrid topology is the query traversal pattern. Instead of retrieving entities OR chunks, you traverse the alternating path:

```python
def hybrid_query(
    hg: HybridKnowledgeGraph,
    query_entities: list[str],
    max_depth: int = 3,
    max_chunks: int = 10,
) -> dict:
    """Traverse entity→chunk→entity paths to build grounded context."""
    visited_entities = set()
    visited_chunks = set()
    context_chunks = []
    traversal_path = []

    # Start from query entities
    frontier = set()
    for name in query_entities:
        entity_id = f"entity:{name.lower().replace(' ', '_')}"
        if entity_id in hg.graph:
            frontier.add(entity_id)
            visited_entities.add(entity_id)

    for depth in range(max_depth):
        next_frontier = set()

        for node_id in frontier:
            node_type = hg.graph.nodes[node_id].get("node_type")

            if node_type == "entity":
                # Entity → find chunks that describe it
                for neighbor in hg.graph.neighbors(node_id):
                    edge_data = hg.graph.edges[node_id, neighbor]
                    if edge_data.get("edge_type") == "described_in":
                        if neighbor not in visited_chunks:
                            visited_chunks.add(neighbor)
                            chunk_data = hg._nodes.get(neighbor)
                            if chunk_data:
                                context_chunks.append({
                                    "chunk_id": neighbor,
                                    "text": chunk_data.metadata.get("full_text", ""),
                                    "source": chunk_data.metadata.get("source", ""),
                                    "reached_via": node_id,
                                    "depth": depth,
                                })
                                traversal_path.append(
                                    f"entity:{hg.graph.nodes[node_id]['name']} → chunk:{neighbor}"
                                )
                            next_frontier.add(neighbor)

            elif node_type == "chunk":
                # Chunk → find entities mentioned in it
                for neighbor in hg.graph.neighbors(node_id):
                    edge_data = hg.graph.edges[node_id, neighbor]
                    if edge_data.get("edge_type") == "mentions":
                        if neighbor not in visited_entities:
                            visited_entities.add(neighbor)
                            next_frontier.add(neighbor)
                            traversal_path.append(
                                f"chunk:{node_id} → entity:{hg.graph.nodes[neighbor]['name']}"
                            )

        frontier = next_frontier
        if len(context_chunks) >= max_chunks:
            break

    # Rank chunks by depth (closer = more relevant) and entity overlap
    context_chunks.sort(key=lambda c: c["depth"])

    return {
        "chunks": context_chunks[:max_chunks],
        "entities_visited": len(visited_entities),
        "chunks_visited": len(visited_chunks),
        "traversal_path": traversal_path,
        "traversal_depth": min(max_depth, depth + 1),
    }
```

### Neo4j Cypher for Hybrid Traversal

```cypher
// Find all chunks grounding a specific entity, then discover connected entities
MATCH path = (e:Entity {name: "Pinecone"})-[:DESCRIBED_IN]->(c:Chunk)
             -[:MENTIONS]->(e2:Entity)
             -[:DESCRIBED_IN]->(c2:Chunk)
RETURN e.name AS source_entity,
       c.source AS source_article,
       e2.name AS connected_entity,
       c2.source AS connected_article,
       length(path) AS path_length
ORDER BY path_length ASC
LIMIT 20

// Grounded relationship verification — does a chunk actually support this claim?
MATCH (a:Entity)-[r:RELATES_TO]->(b:Entity)
WHERE r.grounding_chunk IS NOT NULL
MATCH (gc:Chunk {id: r.grounding_chunk})
RETURN a.name, r.relationship, b.name, gc.source AS evidence_source,
       substring(gc.text, 0, 200) AS evidence_snippet
```

### Why Hybrid Topology Wins

| Dimension | Entity-Only | Content-Only | Entity-Content Hybrid |
|-----------|------------|-------------|----------------------|
| Source attribution | Lost after extraction | Preserved but no structure | Preserved AND structured |
| Relationship reasoning | Strong entities, no evidence | No real relationships | Relationships grounded in evidence |
| Hallucination risk | Medium (claims without source) | Low (but shallow) | Lowest (every claim traceable) |
| Traversal richness | Entity → entity only | Chunk → chunk only | Entity → chunk → entity (context accumulates) |
| Query context | Entities without surrounding text | Text without entity structure | Both — structured AND contextual |
| Graph size | Smaller (entities only) | Larger (all chunks) | Largest (both) — use pruning |
| Metadata integration | Limited to entity properties | Rich chunk metadata | Full — entity props + chunk metadata + edge attributes |

The hybrid topology is what enables source attribution to become a graph-traversable property rather than just a footnote. Every citation, image source, and video reference in your KB articles becomes an edge that the graph can follow — answering not just "what do we know about X" but "where did we learn it, what evidence supports it, and what else did that source discuss."

## Conclusion

This implementation guide provides a complete, working Python architecture for GraphRAG. The pipeline flows from document chunking through entity extraction, entity resolution, graph construction, community detection, community summarization, and dual-mode querying (local and global). Each component is modular and can be swapped — use a different LLM for extraction, a different graph database for persistence, or a different vector store for hybrid retrieval. The key performance bottleneck is entity extraction (one LLM call per chunk), which can be parallelized and optimized with cheaper models. For production deployments, persist the graph to Neo4j, integrate with an existing vector store (Pinecone, Chroma) for hybrid retrieval, and implement incremental updates to avoid full re-indexing on every document change.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/400px-Python-logo-notext.svg.png — Python logo representing the implementation language for the GraphRAG pipeline
2. https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Social_Network_Analysis_Visualization.png/400px-Social_Network_Analysis_Visualization.png — Network graph visualization showing community structure in extracted knowledge graphs
3. https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Pipeline_software.svg/400px-Pipeline_software.svg.png — Software pipeline architecture representing the multi-stage GraphRAG indexing flow
4. https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Community_structure2.jpg/400px-Community_structure2.jpg — Community detection result showing clustered entity groups
5. https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/MapReduce_Overview.svg/400px-MapReduce_Overview.svg.png — Map-reduce pattern used in GraphRAG's global search query pipeline

## Videos

1. https://www.youtube.com/watch?v=r09tJfON6kE — "GraphRAG: Unlocking LLM Discovery on Narrative Private Data" by Microsoft Research covering the architecture that this implementation follows
2. https://www.youtube.com/watch?v=knDDGYHnnSY — "Knowledge Graph RAG with Neo4j and LangChain" demonstrating practical graph-based retrieval patterns

## References

1. Edge, D., Trinh, H., Cheng, N., et al. (2024). "From Local to Global: A Graph RAG Approach to Query-Focused Summarization." arXiv:2404.16130. https://arxiv.org/abs/2404.16130
2. Microsoft GraphRAG Reference Implementation. GitHub. https://github.com/microsoft/graphrag
3. Traag, V. A., Waltman, L., & van Eck, N. J. (2019). "From Louvain to Leiden: Guaranteeing Well-Connected Communities." Scientific Reports. https://www.nature.com/articles/s41598-019-41695-z
4. NetworkX Documentation. "Graph Algorithms." https://networkx.org/documentation/stable/reference/algorithms/
5. Neo4j Python Driver Documentation. https://neo4j.com/docs/python-manual/current/
