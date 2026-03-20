# Metadata Orchestration

## Introduction

Modern data architectures are distributed by design. A single business fact might originate in a transactional database, flow through an ETL pipeline, land in a data warehouse, get embedded into a vector store, surface in a knowledge graph, and finally appear in a search index. Each system maintains its own metadata about that fact — schema, lineage, quality scores, access controls, freshness timestamps. Without orchestration, these metadata silos fragment the truth about data: the warehouse thinks the table was updated an hour ago, but the vector store is still serving yesterday's embeddings, and the search index has not re-indexed at all. Metadata orchestration is the discipline of coordinating metadata flows across these systems to maintain a consistent, unified view of what data exists, where it lives, how fresh it is, and who can access it.

## Why Orchestration Matters

### The Multi-System Reality

No modern data stack runs on a single system. A typical architecture includes:

- **Source systems**: PostgreSQL, MySQL, APIs, SaaS tools
- **Transformation layer**: dbt, Airflow, custom ETL
- **Warehouse/Lakehouse**: Snowflake, BigQuery, Databricks
- **Vector stores**: Pinecone, Weaviate, pgvector
- **Knowledge graphs**: Neo4j, Amazon Neptune
- **Search indexes**: Elasticsearch, Meilisearch
- **BI tools**: Metabase, Looker, Tableau
- **AI applications**: LLM-powered assistants, RAG systems

Each system has its own metadata:

| System | Metadata It Maintains |
|--------|----------------------|
| PostgreSQL | Schema, constraints, statistics, query plans |
| dbt | Model definitions, lineage DAG, test results |
| Pinecone | Index stats, embedding dimensions, namespace metadata |
| Neo4j | Node labels, relationship types, property keys |
| Elasticsearch | Mappings, index health, query analytics |
| AI application | Retrieval logs, quality scores, usage patterns |

Without orchestration, metadata exists in silos. The dbt model description says "last updated 2 hours ago" but the Pinecone index still contains embeddings from the previous version. A schema change in PostgreSQL propagates to dbt models but not to Elasticsearch mappings.

### Consistency Challenges

Metadata inconsistency creates operational problems:

- **Stale retrievals**: The AI retrieves outdated embeddings because the vector store was not notified of the content update
- **Broken queries**: A schema change in the source breaks downstream consumers that were not updated
- **Access violations**: Access controls updated in the warehouse but not propagated to the search index
- **Lineage gaps**: The data catalog shows lineage up to the warehouse but not into the vector store or AI application
- **Quality blind spots**: Quality checks pass in the warehouse but the AI serves a cached version that failed quality

## Orchestration Patterns

### Event-Driven Orchestration

Metadata changes trigger events that propagate to all subscribing systems:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PostgreSQL  │     │  Metadata    │     │  Vector Store│
│  schema      │────>│  Event Bus   │────>│  re-index    │
│  change      │     │              │     │              │
└──────────────┘     │              │     └──────────────┘
                     │              │
┌──────────────┐     │              │     ┌──────────────┐
│  Content     │────>│              │────>│  Search      │
│  update      │     │              │     │  re-index    │
└──────────────┘     │              │     └──────────────┘
                     │              │
┌──────────────┐     │              │     ┌──────────────┐
│  Access      │────>│              │────>│  All systems │
│  policy      │     │              │     │  ACL update  │
│  change      │     └──────────────┘     └──────────────┘
```

**Advantages**: Real-time propagation, loose coupling, scalable
**Challenges**: Event ordering, exactly-once delivery, error handling

```python
class MetadataEventOrchestrator:
    def __init__(self, event_bus, subscribers):
        self.event_bus = event_bus
        self.subscribers = subscribers

    def publish_metadata_change(self, event: MetadataEvent):
        # Validate the event
        self.validate(event)

        # Publish to event bus
        self.event_bus.publish(
            topic=f"metadata.{event.source_system}.{event.change_type}",
            payload={
                "event_id": str(uuid4()),
                "source_system": event.source_system,
                "change_type": event.change_type,
                "entity_id": event.entity_id,
                "old_value": event.old_value,
                "new_value": event.new_value,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

    def handle_event(self, event: dict):
        # Route to appropriate subscribers
        for subscriber in self.subscribers:
            if subscriber.interested_in(event):
                try:
                    subscriber.process(event)
                except Exception as e:
                    self.dead_letter_queue.enqueue(event, error=str(e))
```

### Batch Sync Orchestration

Periodically reconcile metadata across systems:

```python
class BatchMetadataSync:
    def sync(self, schedule="daily"):
        # 1. Collect metadata from all systems
        sources = {
            "postgres": self.collect_postgres_metadata(),
            "pinecone": self.collect_pinecone_metadata(),
            "elasticsearch": self.collect_es_metadata(),
            "neo4j": self.collect_neo4j_metadata()
        }

        # 2. Detect inconsistencies
        inconsistencies = self.compare(sources)

        # 3. Resolve inconsistencies
        for issue in inconsistencies:
            if issue.type == "stale_embedding":
                self.trigger_re_embedding(issue.entity_id)
            elif issue.type == "missing_index":
                self.trigger_indexing(issue.entity_id, issue.target_system)
            elif issue.type == "schema_mismatch":
                self.alert_human(issue)  # Schema changes need review

        # 4. Update unified metadata catalog
        self.catalog.update(sources)
```

**Advantages**: Simpler implementation, catches cumulative drift, lower infrastructure requirements
**Challenges**: Delayed propagation, resource-intensive full scans, potential for temporary inconsistency

### Streaming Orchestration

Continuous metadata sync using change data capture (CDC):

```
Source DB ──CDC──> Debezium ──> Kafka ──> Metadata
                                          Orchestrator
                                              │
                    ┌─────────────┬───────────┼──────────┐
                    │             │           │          │
              Vector Store    Search     Graph DB    Catalog
              (re-embed)     (re-index)  (update)   (update)
```

**Advantages**: Near-real-time consistency, minimal lag, proven patterns (CDC)
**Challenges**: Infrastructure complexity, operational overhead, cost

## Tools for Metadata Orchestration

### Apache Atlas

Apache Atlas is an open-source metadata management and governance framework for Hadoop ecosystems. It provides:

- **Type system**: Extensible type definitions for metadata entities
- **Lineage**: Automatic lineage capture from Hive, Spark, Kafka, Storm
- **Classification**: Tag-based data classification with propagation
- **Search and discovery**: Full-text and attribute-based metadata search
- **REST API**: Programmatic access to all metadata operations

Atlas excels in Hadoop-centric environments but can be extended to other systems through custom hooks.

### OpenMetadata

OpenMetadata is an open-source metadata platform with orchestration capabilities:

- **Ingestion framework**: Connectors for 50+ data systems
- **Metadata versioning**: Full change history for all metadata entities
- **Lineage visualization**: Cross-system lineage from source to consumption
- **Data quality**: Built-in quality testing framework
- **Alerting**: Event-driven notifications for metadata changes

```yaml
# OpenMetadata ingestion configuration
source:
  type: postgres
  serviceName: atlas_db
  serviceConnection:
    config:
      type: Postgres
      hostPort: "localhost:5432"
      database: atlasux
      username: ${POSTGRES_USER}
      password: ${POSTGRES_PASS}

sink:
  type: metadata-rest
  config:
    api_endpoint: "http://openmetadata:8585/api"
```

### Marquez (Lineage)

Marquez, created by WeWork and now an LF AI & Data project, focuses specifically on metadata lineage:

- **OpenLineage integration**: Standard API for lineage event collection
- **Cross-system lineage**: Tracks data from source through transformation to consumption
- **Job metadata**: Captures pipeline runs, durations, outcomes
- **Dataset versioning**: Tracks schema changes over time

```python
# Marquez client example
from marquez_client import MarquezClient

client = MarquezClient(url="http://marquez:5000")

# Record a dataset update event
client.create_dataset(
    namespace="atlas-kb",
    dataset_name="kb-articles",
    dataset_type="DB_TABLE",
    physical_name="kb_articles",
    source_name="postgres",
    fields=[
        {"name": "id", "type": "VARCHAR"},
        {"name": "content", "type": "TEXT"},
        {"name": "updated_at", "type": "TIMESTAMP"}
    ]
)
```

### Custom Orchestration Pipelines

For specific requirements, custom orchestration is often necessary:

```python
class KBMetadataOrchestrator:
    """Orchestrate metadata across KB storage, vector store, and search index."""

    def __init__(self, postgres, pinecone, search_index, metadata_catalog):
        self.postgres = postgres
        self.pinecone = pinecone
        self.search = search_index
        self.catalog = metadata_catalog

    async def on_article_updated(self, article_id: str):
        """Handle article content update across all systems."""
        # 1. Get updated content from source of truth
        article = await self.postgres.get_article(article_id)

        # 2. Update vector embeddings
        embedding = await self.embed(article.content)
        await self.pinecone.upsert(article_id, embedding, article.metadata)

        # 3. Update search index
        await self.search.index(article_id, article.content, article.metadata)

        # 4. Update metadata catalog
        await self.catalog.update(article_id, {
            "updated_at": datetime.utcnow(),
            "embedding_version": self.embedding_model_version,
            "indexed_at": datetime.utcnow(),
            "content_hash": hash(article.content)
        })

        # 5. Update lineage
        await self.catalog.record_lineage(
            source=f"postgres:{article_id}",
            targets=[
                f"pinecone:{article_id}",
                f"search:{article_id}"
            ],
            operation="content_update"
        )
```

## Metadata Lineage

### What is Metadata Lineage?

Metadata lineage tracks the origin, transformation, and flow of data through systems. It answers: "Where did this data come from? What transformations were applied? What downstream systems depend on it?"

### Lineage Levels

**Column-level lineage**: Tracks which source columns contribute to each target column.

```
source.customers.email → transform.hash_email → warehouse.customers.email_hash
```

**Table-level lineage**: Tracks which source tables feed into which target tables.

```
source.orders + source.products → transform.enriched_orders → warehouse.order_facts
```

**Pipeline-level lineage**: Tracks which pipelines transform which datasets.

```
Pipeline: daily_kb_refresh
  Input: kb_articles (PostgreSQL)
  Transform: chunk + embed + index
  Output: kb_embeddings (Pinecone), kb_search (Elasticsearch)
```

### Lineage for Knowledge Bases

For a KB system, lineage tracking answers critical operational questions:

- "This article is showing wrong information — where does the source data come from?"
- "We updated the embedding model — which articles need re-embedding?"
- "A vector store index was corrupted — which articles are affected?"
- "We changed a category schema — which downstream systems need updating?"

## Cross-System Metadata Sync

### The KB Synchronization Challenge

A typical KB system maintains data in multiple stores:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PostgreSQL  │     │  Vector DB   │     │  Search      │
│  (source of  │     │  (embeddings │     │  Index       │
│   truth)     │     │   for RAG)   │     │  (full-text) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                     ┌──────▼───────┐
                     │  Metadata    │
                     │  Orchestrator│
                     └──────────────┘
```

The orchestrator ensures:
1. **Content consistency**: All stores have the same version of the content
2. **Schema consistency**: Metadata schemas are aligned across stores
3. **Freshness consistency**: All stores are updated within an acceptable time window
4. **Quality consistency**: Quality scores are computed and propagated uniformly

### Sync Strategies

**Full sync**: Periodically rebuild all downstream stores from the source of truth. Simple but resource-intensive.

**Incremental sync**: Track changes since last sync and propagate only deltas. Efficient but requires reliable change tracking.

**Reconciliation**: Periodically compare checksums across stores and fix any discrepancies. Catches drift that incremental sync might miss.

```python
class MetadataReconciler:
    def reconcile(self):
        # Get content hashes from all stores
        pg_hashes = self.postgres.get_all_hashes()
        pinecone_hashes = self.pinecone.get_all_hashes()
        search_hashes = self.search.get_all_hashes()

        # Find discrepancies
        for article_id in pg_hashes:
            pg_hash = pg_hashes[article_id]

            if article_id not in pinecone_hashes:
                self.repair_queue.add(article_id, "missing_from_vector_store")
            elif pinecone_hashes[article_id] != pg_hash:
                self.repair_queue.add(article_id, "stale_embedding")

            if article_id not in search_hashes:
                self.repair_queue.add(article_id, "missing_from_search_index")
            elif search_hashes[article_id] != pg_hash:
                self.repair_queue.add(article_id, "stale_search_index")
```

## Design Patterns for Metadata Consistency

### Saga Pattern for Metadata Updates

When updating metadata across multiple systems, use the saga pattern to handle partial failures:

```python
class MetadataUpdateSaga:
    def execute(self, article_id: str, update: dict):
        compensations = []

        try:
            # Step 1: Update source
            old_content = self.postgres.get(article_id)
            self.postgres.update(article_id, update)
            compensations.append(
                lambda: self.postgres.update(article_id, old_content)
            )

            # Step 2: Update embeddings
            old_embedding = self.pinecone.get(article_id)
            new_embedding = self.embed(update["content"])
            self.pinecone.upsert(article_id, new_embedding)
            compensations.append(
                lambda: self.pinecone.upsert(article_id, old_embedding)
            )

            # Step 3: Update search index
            self.search.index(article_id, update["content"])
            # If this fails, compensate previous steps

        except Exception as e:
            # Compensate in reverse order
            for compensate in reversed(compensations):
                try:
                    compensate()
                except Exception:
                    self.alert_manual_intervention(article_id)
            raise
```

### Outbox Pattern

Use the transactional outbox pattern to ensure metadata events are reliably published:

```sql
-- When updating an article, also insert a metadata event in the same transaction
BEGIN;
    UPDATE kb_articles SET content = $1, updated_at = NOW() WHERE id = $2;
    INSERT INTO metadata_outbox (event_type, entity_id, payload, created_at)
    VALUES ('article_updated', $2, $3, NOW());
COMMIT;

-- A separate process polls the outbox and publishes events
-- After successful publication, marks events as processed
```

### Idempotent Operations

Design all metadata operations to be idempotent — safe to retry:

```python
def update_embedding(self, article_id: str, content_hash: str):
    # Check if already up to date (idempotent guard)
    current = self.pinecone.get_metadata(article_id)
    if current and current.get("content_hash") == content_hash:
        return  # Already up to date, skip

    # Perform update
    embedding = self.embed(content)
    self.pinecone.upsert(article_id, embedding, {"content_hash": content_hash})
```

## Conclusion

Metadata orchestration is the operational backbone of any multi-system data architecture. Without it, metadata fragments across silos, consistency degrades silently, and data consumers — especially AI systems — serve stale or contradictory information. The three orchestration patterns (event-driven, batch sync, streaming) serve different latency and complexity requirements, and most production systems use a combination. For knowledge bases serving AI applications, metadata orchestration ensures that when an article is updated in the source database, its embeddings, search index entries, quality scores, and lineage records are all updated in a coordinated, reliable manner. The investment in orchestration infrastructure pays for itself in operational reliability and reduced data quality incidents.

## Media

1. ![ETL pipeline architecture](https://upload.wikimedia.org/wikipedia/commons/c/c3/ETL_process_in_data_warehousing.png) — ETL pipeline showing metadata flow through transformation stages
2. ![Distributed systems architecture](https://upload.wikimedia.org/wikipedia/commons/3/3a/GraphDatabase_PropertyGraph.png) — Graph model showing metadata entity relationships across systems
3. ![Apache Kafka streaming architecture](https://upload.wikimedia.org/wikipedia/commons/6/64/Apache_Kafka.png) — Apache Kafka logo representing event streaming for metadata orchestration
4. ![Data warehouse overview](https://upload.wikimedia.org/wikipedia/commons/8/8b/Data_warehouse_overview.JPG) — Data warehouse architecture with metadata management layers
5. ![Feedback control system](https://upload.wikimedia.org/wikipedia/commons/2/24/Feedback_loop_with_descriptions.svg) — Control loop diagram illustrating continuous metadata synchronization

## Videos

1. https://www.youtube.com/watch?v=YaGlx_WE0x0 — "What is a Data Catalog?" by Atlan covering cross-system metadata management
2. https://www.youtube.com/watch?v=To1rAiIkFiY — "OpenLineage: Open Standard for Lineage" by Julien Le Dem on cross-system lineage tracking

## References

1. Apache Atlas Documentation — https://atlas.apache.org/#/
2. OpenMetadata Documentation — https://docs.open-metadata.org/
3. Marquez (OpenLineage) Documentation — https://marquezproject.ai/docs
4. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly Media. https://dataintensive.net/
