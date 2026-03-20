# Metadata Lakehouse

## Introduction

The data lakehouse architecture — combining the flexibility of data lakes with the reliability of data warehouses — has transformed how organizations store and process operational data. But metadata has not received the same architectural attention. In most organizations, metadata is scattered: document metadata in a catalog, embedding metadata in the vector store, usage metadata in application logs, and quality metadata in a separate monitoring tool. A metadata lakehouse applies the lakehouse pattern to metadata itself — creating a unified metadata store that houses structured metadata (schemas, lineage), semi-structured metadata (quality scores, freshness timestamps), and unstructured metadata (usage narratives, review notes) in a single, queryable repository. This unified view enables cross-cutting analytics that are impossible when metadata lives in silos: "Find all documents with quality score below 0.7 that were accessed more than 100 times in the last 30 days and have not been updated in 90 days."

## Inspiration: Data Lakehouse Architecture

### The Original Lakehouse Pattern

The data lakehouse emerged as a response to the limitations of both data lakes and data warehouses:

**Data lakes** (HDFS, S3) provided cheap, scalable storage for any data format but lacked schema enforcement, ACID transactions, and query performance. Data quality was unreliable, governance was difficult, and "data swamp" was a common outcome.

**Data warehouses** (Snowflake, BigQuery, Redshift) provided structured storage with strong schema enforcement, fast queries, and governance — but at higher cost, with limited support for unstructured data, and requiring expensive ETL to load data.

**Data lakehouses** (Delta Lake, Apache Iceberg, Apache Hudi) combine both: store data in open file formats on object storage (cheap, scalable, any format) while adding a metadata layer that provides ACID transactions, schema enforcement, time travel, and query performance.

```
Traditional Architecture:
┌───────────┐     ┌───────────┐
│ Data Lake │     │ Data      │   Separate systems,
│ (raw,     │     │ Warehouse │   data copied between them
│  cheap)   │     │ (curated, │
│           │     │  expensive)│
└───────────┘     └───────────┘

Lakehouse Architecture:
┌─────────────────────────────────┐
│  Metadata Layer (Delta/Iceberg) │  Schema, ACID, versioning
├─────────────────────────────────┤
│  Object Storage (S3/GCS)        │  Cheap, scalable, open format
└─────────────────────────────────┘
```

### Applying the Pattern to Metadata

A metadata lakehouse applies this same insight to metadata management:

**Problem**: Metadata about knowledge base articles, embeddings, usage, quality, and access is scattered across systems.

**Solution**: Store all metadata in a single, unified store with a schema layer that supports structured queries, versioning, and cross-cutting analytics.

```
Traditional Metadata:
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Document │  │ Embedding│  │ Usage    │  │ Quality  │
│ Catalog  │  │ Store    │  │ Logs     │  │ Monitor  │
│ metadata │  │ metadata │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

Metadata Lakehouse:
┌─────────────────────────────────────────────────────┐
│  Unified Metadata Store                             │
│  ┌────────────┬────────────┬──────────┬───────────┐ │
│  │ Document   │ Embedding  │ Usage    │ Quality   │ │
│  │ Metadata   │ Metadata   │ Metadata │ Metadata  │ │
│  └────────────┴────────────┴──────────┴───────────┘ │
│  Schema Layer (typed, versioned, queryable)          │
└─────────────────────────────────────────────────────┘
```

## Schema: Unified Metadata Model

### Document Metadata

Core metadata about knowledge base articles:

```sql
CREATE TABLE document_metadata (
    article_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    namespace TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    author TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    word_count INTEGER,
    content_hash TEXT NOT NULL,
    file_path TEXT,
    format TEXT DEFAULT 'markdown',
    language TEXT DEFAULT 'en',
    version INTEGER DEFAULT 1
);
```

### Embedding Metadata

Metadata about vector embeddings:

```sql
CREATE TABLE embedding_metadata (
    article_id TEXT REFERENCES document_metadata(article_id),
    embedding_model TEXT NOT NULL,
    embedding_dimensions INTEGER NOT NULL,
    chunk_count INTEGER,
    chunk_strategy TEXT,
    embedded_at TIMESTAMPTZ NOT NULL,
    content_hash_at_embed TEXT NOT NULL,  -- Detect drift
    vector_store TEXT NOT NULL,
    namespace TEXT,
    is_current BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (article_id, embedding_model)
);

-- Detect stale embeddings: content changed since embedding
SELECT d.article_id, d.title
FROM document_metadata d
JOIN embedding_metadata e ON d.article_id = e.article_id
WHERE d.content_hash != e.content_hash_at_embed
AND e.is_current = TRUE;
```

### Usage Metadata

How articles are accessed and consumed:

```sql
CREATE TABLE usage_metadata (
    article_id TEXT REFERENCES document_metadata(article_id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    retrieval_count INTEGER DEFAULT 0,
    unique_queries INTEGER DEFAULT 0,
    avg_similarity_score NUMERIC(4,3),
    avg_rank NUMERIC(4,1),
    click_through_rate NUMERIC(4,3),
    avg_dwell_time_seconds INTEGER,
    feedback_positive INTEGER DEFAULT 0,
    feedback_negative INTEGER DEFAULT 0,
    PRIMARY KEY (article_id, period_start)
);
```

### Quality Metadata

Quality assessment results over time:

```sql
CREATE TABLE quality_metadata (
    article_id TEXT REFERENCES document_metadata(article_id),
    assessed_at TIMESTAMPTZ NOT NULL,
    overall_score NUMERIC(3,2) NOT NULL,
    completeness_score NUMERIC(3,2),
    freshness_score NUMERIC(3,2),
    consistency_score NUMERIC(3,2),
    link_health_score NUMERIC(3,2),
    readability_score NUMERIC(3,2),
    issues JSONB DEFAULT '[]',
    auto_heal_actions JSONB DEFAULT '[]',
    PRIMARY KEY (article_id, assessed_at)
);
```

### The Unified View

The power of the metadata lakehouse is in cross-cutting queries:

```sql
-- Find high-traffic, low-quality articles (priority for improvement)
SELECT
    d.article_id,
    d.title,
    d.namespace,
    u.retrieval_count,
    q.overall_score as quality_score,
    d.updated_at,
    AGE(NOW(), d.updated_at) as age
FROM document_metadata d
JOIN usage_metadata u ON d.article_id = u.article_id
    AND u.period_start = DATE_TRUNC('month', CURRENT_DATE)
JOIN quality_metadata q ON d.article_id = q.article_id
    AND q.assessed_at = (
        SELECT MAX(assessed_at) FROM quality_metadata
        WHERE article_id = d.article_id
    )
WHERE u.retrieval_count > 50
    AND q.overall_score < 0.7
ORDER BY u.retrieval_count DESC;

-- Find articles with stale embeddings that are still being actively retrieved
SELECT
    d.article_id,
    d.title,
    e.embedded_at,
    u.retrieval_count as recent_retrievals
FROM document_metadata d
JOIN embedding_metadata e ON d.article_id = e.article_id
JOIN usage_metadata u ON d.article_id = u.article_id
    AND u.period_start >= CURRENT_DATE - INTERVAL '7 days'
WHERE d.content_hash != e.content_hash_at_embed
    AND e.is_current = TRUE
    AND u.retrieval_count > 10
ORDER BY u.retrieval_count DESC;
```

## Benefits of a Unified Metadata Store

### Single Source of Truth

When metadata lives in one place, there is no question about which version is authoritative. The metadata lakehouse is the canonical record — all other systems are derived views.

### Cross-Cutting Analytics

Questions that span metadata categories become trivial:

| Query | Categories Involved |
|-------|-------------------|
| "Which stale articles are still popular?" | Document + Usage |
| "Do high-quality articles get more retrievals?" | Quality + Usage |
| "Which embedding models produce better retrieval scores?" | Embedding + Usage |
| "Are recently updated articles higher quality?" | Document + Quality |
| "Which namespaces have the most quality issues?" | Document + Quality |
| "What is the ROI of updating article X?" | All four categories |

### Unified Governance

Access control, audit trails, and retention policies apply uniformly to all metadata:

```sql
-- Audit: Who accessed what metadata, when
CREATE TABLE metadata_access_log (
    access_id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    accessed_table TEXT NOT NULL,
    accessed_article_id TEXT,
    access_type TEXT NOT NULL,  -- READ, WRITE, DELETE
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retention: Auto-expire old usage metadata
DELETE FROM usage_metadata
WHERE period_end < CURRENT_DATE - INTERVAL '2 years';
```

### Time Travel

With proper versioning, you can query metadata as of any point in time:

```sql
-- What was the quality score of this article 90 days ago?
SELECT overall_score
FROM quality_metadata
WHERE article_id = 'kb-ontology-in-ai'
    AND assessed_at <= CURRENT_DATE - INTERVAL '90 days'
ORDER BY assessed_at DESC
LIMIT 1;

-- How has usage trended over the last year?
SELECT
    period_start,
    retrieval_count,
    avg_similarity_score
FROM usage_metadata
WHERE article_id = 'kb-ontology-in-ai'
    AND period_start >= CURRENT_DATE - INTERVAL '1 year'
ORDER BY period_start;
```

## Implementation Approaches

### PostgreSQL JSONB

For smaller-scale implementations, PostgreSQL with JSONB provides a pragmatic metadata lakehouse:

```sql
-- Single flexible metadata table with JSONB for extensibility
CREATE TABLE metadata_lakehouse (
    article_id TEXT NOT NULL,
    metadata_type TEXT NOT NULL,  -- 'document', 'embedding', 'usage', 'quality'
    metadata JSONB NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to TIMESTAMPTZ,  -- NULL = current
    PRIMARY KEY (article_id, metadata_type, valid_from)
);

-- GIN index for JSONB queries
CREATE INDEX idx_metadata_gin ON metadata_lakehouse USING GIN (metadata);

-- Example: Insert quality metadata
INSERT INTO metadata_lakehouse (article_id, metadata_type, metadata)
VALUES (
    'kb-ontology-in-ai',
    'quality',
    '{
        "overall_score": 0.92,
        "completeness_score": 0.95,
        "freshness_score": 0.88,
        "issues": [],
        "assessed_by": "auto_eval_v2"
    }'
);

-- Cross-cutting query using JSONB
SELECT
    ml_doc.article_id,
    ml_doc.metadata->>'title' as title,
    (ml_quality.metadata->>'overall_score')::numeric as quality,
    (ml_usage.metadata->>'retrieval_count')::integer as retrievals
FROM metadata_lakehouse ml_doc
JOIN metadata_lakehouse ml_quality
    ON ml_doc.article_id = ml_quality.article_id
    AND ml_quality.metadata_type = 'quality'
    AND ml_quality.valid_to IS NULL
JOIN metadata_lakehouse ml_usage
    ON ml_doc.article_id = ml_usage.article_id
    AND ml_usage.metadata_type = 'usage'
    AND ml_usage.valid_to IS NULL
WHERE ml_doc.metadata_type = 'document'
    AND ml_doc.valid_to IS NULL
    AND (ml_quality.metadata->>'overall_score')::numeric < 0.7
    AND (ml_usage.metadata->>'retrieval_count')::integer > 100;
```

### Apache Iceberg

For larger-scale implementations, Apache Iceberg provides lakehouse features on object storage:

- **Schema evolution**: Add metadata columns without rewriting data
- **Partition evolution**: Change partitioning strategies without data reorganization
- **Time travel**: Query metadata as of any snapshot
- **ACID transactions**: Concurrent metadata updates without corruption
- **Hidden partitioning**: Optimize query performance without exposing partition columns

### Custom Lakehouse

For AI-focused knowledge bases, a custom metadata lakehouse can be purpose-built:

```python
class MetadataLakehouse:
    def __init__(self, storage_backend):
        self.storage = storage_backend  # PostgreSQL, Iceberg, etc.

    def upsert(self, article_id: str, metadata_type: str, metadata: dict):
        """Insert or update metadata with version tracking."""
        # Expire current version
        self.storage.execute("""
            UPDATE metadata_lakehouse
            SET valid_to = NOW()
            WHERE article_id = %s AND metadata_type = %s AND valid_to IS NULL
        """, (article_id, metadata_type))

        # Insert new version
        self.storage.execute("""
            INSERT INTO metadata_lakehouse (article_id, metadata_type, metadata)
            VALUES (%s, %s, %s)
        """, (article_id, metadata_type, json.dumps(metadata)))

    def query(self, filters: dict, as_of: datetime = None) -> list:
        """Query metadata with optional time travel."""
        conditions = []
        params = []

        for key, value in filters.items():
            conditions.append(f"metadata->>'{key}' = %s")
            params.append(str(value))

        if as_of:
            conditions.append("valid_from <= %s AND (valid_to IS NULL OR valid_to > %s)")
            params.extend([as_of, as_of])
        else:
            conditions.append("valid_to IS NULL")

        where_clause = " AND ".join(conditions)
        return self.storage.query(
            f"SELECT * FROM metadata_lakehouse WHERE {where_clause}",
            params
        )
```

## Query Patterns

### Operational Queries

Day-to-day operational questions:

```sql
-- Dashboard: KB health overview
SELECT
    d.namespace,
    COUNT(*) as article_count,
    AVG((q.metadata->>'overall_score')::numeric) as avg_quality,
    AVG(EXTRACT(EPOCH FROM AGE(NOW(), (d.metadata->>'updated_at')::timestamptz)) / 86400) as avg_age_days,
    SUM((u.metadata->>'retrieval_count')::integer) as total_retrievals
FROM metadata_lakehouse d
JOIN metadata_lakehouse q ON d.article_id = q.article_id AND q.metadata_type = 'quality'
JOIN metadata_lakehouse u ON d.article_id = u.article_id AND u.metadata_type = 'usage'
WHERE d.metadata_type = 'document'
    AND d.valid_to IS NULL AND q.valid_to IS NULL AND u.valid_to IS NULL
GROUP BY d.namespace
ORDER BY avg_quality ASC;
```

### Diagnostic Queries

Investigating specific issues:

```sql
-- Why did retrieval quality drop last week?
-- Look for articles that were updated or re-embedded in that window
SELECT
    d.article_id,
    d.metadata->>'title' as title,
    e.metadata->>'embedded_at' as last_embedded,
    d.metadata->>'updated_at' as last_updated,
    (q.metadata->>'overall_score')::numeric as quality_score
FROM metadata_lakehouse d
JOIN metadata_lakehouse e ON d.article_id = e.article_id AND e.metadata_type = 'embedding'
JOIN metadata_lakehouse q ON d.article_id = q.article_id AND q.metadata_type = 'quality'
WHERE d.metadata_type = 'document'
    AND d.valid_to IS NULL AND e.valid_to IS NULL AND q.valid_to IS NULL
    AND (e.metadata->>'embedded_at')::timestamptz > NOW() - INTERVAL '7 days'
ORDER BY quality_score ASC;
```

### Strategic Queries

Long-term planning and optimization:

```sql
-- Content ROI: which articles deliver the most value per maintenance cost?
SELECT
    d.article_id,
    d.metadata->>'title' as title,
    (u.metadata->>'retrieval_count')::integer as monthly_retrievals,
    (u.metadata->>'feedback_positive')::integer as positive_feedback,
    EXTRACT(EPOCH FROM AGE(NOW(), (d.metadata->>'updated_at')::timestamptz)) / 86400 as days_since_update,
    (u.metadata->>'retrieval_count')::integer::float /
        NULLIF(EXTRACT(EPOCH FROM AGE(NOW(), (d.metadata->>'updated_at')::timestamptz)) / 86400, 0)
        as retrievals_per_day_since_update
FROM metadata_lakehouse d
JOIN metadata_lakehouse u ON d.article_id = u.article_id AND u.metadata_type = 'usage'
WHERE d.metadata_type = 'document'
    AND d.valid_to IS NULL AND u.valid_to IS NULL
ORDER BY retrievals_per_day_since_update DESC NULLS LAST;
```

## Comparison with Traditional Metadata Catalogs

| Feature | Traditional Catalog | Metadata Lakehouse |
|---------|-------------------|--------------------|
| **Metadata types** | Primarily schema/lineage | All types unified |
| **Temporal** | Current state only | Full version history |
| **Query capability** | Catalog-specific API | SQL/analytics queries |
| **Cross-cutting queries** | Requires custom joins | Native support |
| **Scalability** | Limited by catalog DB | Object storage scale |
| **Schema flexibility** | Fixed schema | Evolving (JSONB/Iceberg) |
| **Cost** | License + infrastructure | Open source + storage |
| **Analytics** | Basic search/filter | Full analytical queries |

## Conclusion

A metadata lakehouse brings the same architectural clarity to metadata that the data lakehouse brought to operational data: a single, unified, queryable store that eliminates silos and enables cross-cutting analytics. For knowledge bases powering AI systems, the metadata lakehouse answers questions that no single metadata system can: which high-traffic articles have stale embeddings? Which namespaces have declining quality but increasing usage? What is the correlation between update frequency and retrieval accuracy? These cross-cutting insights drive better prioritization, automated maintenance, and ultimately better AI responses. The implementation can start simple — a PostgreSQL database with JSONB columns — and scale to Iceberg-based architectures as metadata volume grows.

## Media

1. ![Data lakehouse architecture](https://upload.wikimedia.org/wikipedia/commons/8/8b/Data_warehouse_overview.JPG) — Data warehouse architecture that the lakehouse pattern extends
2. ![Apache Iceberg table format](https://upload.wikimedia.org/wikipedia/commons/6/64/Apache_Kafka.png) — Apache ecosystem logo representing open-source lakehouse foundations
3. ![OLAP cube operations](https://upload.wikimedia.org/wikipedia/commons/4/49/OLAP_drill_up%26down.png) — OLAP drill operations enabled by unified metadata analytics
4. ![Database schema relationships](https://upload.wikimedia.org/wikipedia/commons/d/da/UML_diagram_of_a_Schema.png) — Schema diagram showing metadata entity relationships
5. ![Time series analysis](https://upload.wikimedia.org/wikipedia/commons/7/77/Time_series_of_Sunspot_number.png) — Time series visualization for temporal metadata analysis

## Videos

1. https://www.youtube.com/watch?v=LGrMYvMYozI — "What is a Data Lakehouse?" by Databricks explaining the lakehouse architecture pattern
2. https://www.youtube.com/watch?v=W_oUahwaoiA — "Data Quality Management Explained" by IBM Technology on metadata quality monitoring

## References

1. Armbrust, M., et al. (2021). "Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics." *CIDR 2021*. https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf
2. Apache Iceberg Documentation — https://iceberg.apache.org/docs/latest/
3. Delta Lake Documentation — https://docs.delta.io/latest/index.html
4. Nargesian, F., et al. (2019). "Data Lake Management: Challenges and Opportunities." *PVLDB*, 12(12). https://dl.acm.org/doi/10.14778/3352063.3352116
