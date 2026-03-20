# Dynamic Metadata Discovery Explained

## Introduction

As data estates grow into thousands of tables, millions of documents, and hundreds of pipelines, manually cataloging metadata becomes impossible. Traditional metadata discovery relies on schema crawling — connecting to databases, reading table definitions, and recording column names and types. This static discovery captures structural metadata but misses the rich semantic metadata embedded within the data itself: what a column actually represents, how it relates to business concepts, what sensitivity level it carries, and how it should be categorized. Dynamic metadata discovery goes beyond schema crawling to infer, extract, and classify metadata at runtime — using NLP, pattern matching, embedding clustering, and increasingly LLM-powered classification to understand data at a deeper level than its technical schema reveals.

## What is Metadata Discovery?

### Definition

Metadata discovery is the automated process of finding, extracting, and cataloging metadata about data assets. It answers the fundamental inventory question: what data exists, where does it live, what does it contain, and how is it structured?

### Why It Matters

Without metadata discovery, organizations face:
- **Unknown unknowns**: Data exists that nobody knows about — "dark data" that cannot be leveraged
- **Redundant effort**: Teams create datasets that already exist elsewhere because they cannot find them
- **Governance gaps**: Sensitive data goes unprotected because nobody knows it contains PII
- **Integration barriers**: Systems cannot interoperate because nobody has mapped the relationships between their schemas
- **AI quality issues**: Knowledge bases contain content that is not properly categorized, reducing retrieval accuracy

### The Discovery Spectrum

Metadata discovery exists on a spectrum from purely static to fully dynamic:

```
Static ◄────────────────────────────────────────► Dynamic

Schema      Profiling     Classification     Inference
crawling    (statistics)  (patterns + ML)    (LLM + NLP)

"What columns   "What values    "What does this    "What concept
 exist?"         are in them?"   column mean?"      does this data
                                                     represent?"
```

## Static Discovery: Schema Crawling

### How It Works

Static discovery connects to data sources and reads their metadata catalogs:

```python
class StaticDiscovery:
    def discover_postgres(self, connection_string: str) -> list:
        """Discover metadata from PostgreSQL information_schema."""
        conn = psycopg2.connect(connection_string)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                table_schema,
                table_name,
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length
            FROM information_schema.columns
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
            ORDER BY table_schema, table_name, ordinal_position
        """)

        return [
            {
                "schema": row[0],
                "table": row[1],
                "column": row[2],
                "type": row[3],
                "nullable": row[4] == 'YES',
                "default": row[5],
                "max_length": row[6]
            }
            for row in cursor.fetchall()
        ]
```

### Limitations

Static discovery captures only what the database schema explicitly declares:
- Column names may be cryptic (`cust_seg_cd` instead of "Customer Segment Code")
- Data types tell you nothing about semantics (`VARCHAR(255)` could contain anything)
- Relationships beyond explicit foreign keys are invisible
- Business meaning is absent
- Sensitivity classification is absent

## Dynamic Discovery: Runtime Inference

### Data Profiling

The first step beyond static discovery. Data profiling samples actual values to compute statistics:

```python
class DataProfiler:
    def profile_column(self, table: str, column: str, sample_size: int = 10000):
        sample = self.db.query(f"""
            SELECT "{column}" FROM "{table}"
            TABLESAMPLE BERNOULLI(10)
            LIMIT {sample_size}
        """)

        values = [row[0] for row in sample if row[0] is not None]

        return {
            "column": column,
            "total_rows": len(sample),
            "null_count": len(sample) - len(values),
            "null_percentage": (len(sample) - len(values)) / len(sample) * 100,
            "unique_count": len(set(values)),
            "cardinality_ratio": len(set(values)) / max(len(values), 1),
            "sample_values": random.sample(values, min(5, len(values))),
            "min_length": min(len(str(v)) for v in values) if values else 0,
            "max_length": max(len(str(v)) for v in values) if values else 0,
            "patterns": self.detect_patterns(values)
        }

    def detect_patterns(self, values: list) -> list:
        """Detect common patterns in column values."""
        patterns = []
        str_values = [str(v) for v in values[:1000]]

        # Email pattern
        email_matches = sum(1 for v in str_values if re.match(r'^[\w.+-]+@[\w-]+\.[\w.]+$', v))
        if email_matches > len(str_values) * 0.8:
            patterns.append({"type": "email", "confidence": email_matches / len(str_values)})

        # Phone pattern
        phone_matches = sum(1 for v in str_values if re.match(r'^[\d\s\-\+\(\)]{7,15}$', v))
        if phone_matches > len(str_values) * 0.8:
            patterns.append({"type": "phone_number", "confidence": phone_matches / len(str_values)})

        # SSN pattern
        ssn_matches = sum(1 for v in str_values if re.match(r'^\d{3}-\d{2}-\d{4}$', v))
        if ssn_matches > len(str_values) * 0.5:
            patterns.append({"type": "ssn", "confidence": ssn_matches / len(str_values),
                           "sensitivity": "PII_HIGH"})

        # UUID pattern
        uuid_matches = sum(1 for v in str_values if re.match(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', v, re.I))
        if uuid_matches > len(str_values) * 0.8:
            patterns.append({"type": "uuid", "confidence": uuid_matches / len(str_values)})

        return patterns
```

### NLP-Based Extraction

For unstructured documents like knowledge base articles, NLP extracts metadata that does not exist in any schema:

```python
class NLPMetadataExtractor:
    def extract(self, document: str) -> dict:
        """Extract metadata from unstructured document content."""

        # Topic classification
        topics = self.topic_classifier.classify(document)

        # Named entity recognition
        entities = self.ner_model.extract(document)

        # Key phrase extraction
        key_phrases = self.keyphrase_extractor.extract(document, top_k=10)

        # Readability scoring
        readability = self.compute_readability(document)

        # Language detection
        language = self.detect_language(document)

        # Sentiment (for support/feedback content)
        sentiment = self.sentiment_analyzer.analyze(document)

        return {
            "topics": topics,
            "entities": entities,
            "key_phrases": key_phrases,
            "readability_score": readability,
            "language": language,
            "sentiment": sentiment,
            "word_count": len(document.split()),
            "heading_count": document.count("\n#"),
            "code_block_count": document.count("```") // 2,
            "link_count": len(re.findall(r'https?://\S+', document))
        }
```

### Pattern Matching

Rule-based pattern matching identifies known metadata patterns:

| Pattern | Regex/Rule | Metadata Assigned |
|---------|-----------|-------------------|
| Email addresses | `[\w.+-]+@[\w-]+\.[\w.]+` | PII, type: email |
| Phone numbers | `[\d\s\-\+\(\)]{7,15}` | PII, type: phone |
| Credit card numbers | `\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}` | PII_HIGH, type: credit_card |
| IP addresses | `\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}` | Network, type: ip_address |
| Dates | `\d{4}-\d{2}-\d{2}` | Temporal, type: date |
| Currency amounts | `\$[\d,]+\.\d{2}` | Financial, type: currency |
| URLs | `https?://\S+` | Reference, type: url |

### Embedding Clustering

Group similar documents or data fields by their embedding vectors to discover implicit categories:

```python
from sklearn.cluster import HDBSCAN
import numpy as np

class EmbeddingClusterer:
    def discover_categories(self, articles: list, embeddings: np.ndarray):
        """Discover natural content categories from embedding space."""
        # Cluster embeddings
        clusterer = HDBSCAN(min_cluster_size=3, min_samples=2)
        labels = clusterer.fit_predict(embeddings)

        # Analyze each cluster
        categories = {}
        for cluster_id in set(labels):
            if cluster_id == -1:
                continue  # Skip noise

            cluster_articles = [
                articles[i] for i, label in enumerate(labels) if label == cluster_id
            ]

            # Find common themes in cluster
            common_terms = self.extract_common_terms(cluster_articles)
            suggested_name = self.generate_category_name(common_terms)

            categories[cluster_id] = {
                "suggested_name": suggested_name,
                "article_count": len(cluster_articles),
                "common_terms": common_terms,
                "articles": [a["id"] for a in cluster_articles]
            }

        return categories
```

### LLM-Powered Classification

The most powerful dynamic discovery technique. LLMs can infer metadata that requires genuine understanding:

```python
class LLMMetadataDiscovery:
    def classify_article(self, content: str, existing_categories: list) -> dict:
        """Use an LLM to discover metadata about an article."""
        prompt = f"""Analyze this knowledge base article and extract metadata.

Existing categories: {', '.join(existing_categories)}

Article content (first 2000 chars):
{content[:2000]}

Extract the following metadata as JSON:
1. primary_category: Best matching category from the existing list, or suggest a new one
2. secondary_categories: Other relevant categories (max 3)
3. difficulty_level: beginner, intermediate, advanced, expert
4. content_type: tutorial, reference, conceptual, how-to, comparison
5. key_concepts: List of main concepts covered (max 10)
6. prerequisites: What should someone know before reading this
7. related_topics: Topics this article relates to
8. target_audience: Who would benefit most from this article
9. sensitivity: none, internal, confidential, restricted"""

        response = self.llm.generate(prompt, response_format="json")
        return json.loads(response)
```

## Auto-Discovery Pipeline

### Pipeline Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Scan      │───>│   Extract   │───>│   Classify  │───>│   Enrich    │───>│   Index     │
│   (crawl    │    │   (profile, │    │   (ML, LLM, │    │   (link,    │    │   (catalog, │
│    sources) │    │    NLP)     │    │    rules)   │    │    relate)  │    │    search)  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Stage 1: Scan

Discover all data assets across configured sources:

```python
class Scanner:
    def scan(self, sources: list) -> list:
        assets = []
        for source in sources:
            if source.type == "filesystem":
                assets.extend(self.scan_filesystem(source.path, source.patterns))
            elif source.type == "database":
                assets.extend(self.scan_database(source.connection_string))
            elif source.type == "api":
                assets.extend(self.scan_api(source.endpoint, source.auth))
        return assets

    def scan_filesystem(self, path: str, patterns: list) -> list:
        assets = []
        for pattern in patterns:
            for file_path in glob.glob(os.path.join(path, pattern), recursive=True):
                assets.append({
                    "type": "file",
                    "path": file_path,
                    "size": os.path.getsize(file_path),
                    "modified": datetime.fromtimestamp(os.path.getmtime(file_path)),
                    "extension": os.path.splitext(file_path)[1]
                })
        return assets
```

### Stage 2: Extract

Extract raw metadata from discovered assets:
- For structured data: schema, statistics, sample values
- For unstructured data: NLP entities, topics, key phrases
- For code: imports, function signatures, dependencies

### Stage 3: Classify

Apply classification rules and models:
- Pattern matching for known metadata types (PII, dates, identifiers)
- ML models for topic classification and sensitivity detection
- LLM for nuanced classification requiring understanding
- Rule-based classification for domain-specific patterns

### Stage 4: Enrich

Add context to discovered metadata:
- Link related assets (tables referenced by the same pipeline, articles on the same topic)
- Add lineage connections (where this data comes from, where it flows)
- Compute derived metadata (quality scores, freshness, popularity)
- Map to ontological concepts (align with domain ontology)

### Stage 5: Index

Make discovered metadata searchable and queryable:
- Insert into metadata catalog (DataHub, OpenMetadata, custom)
- Update search indexes for metadata search
- Generate embeddings for semantic metadata search
- Publish metadata change events for downstream consumers

## Handling Unstructured Documents

### The Challenge

Unstructured documents (knowledge base articles, PDFs, emails, chat logs) do not have a schema. All metadata must be inferred from content:

```
Structured data:    column "email" → type VARCHAR(255) → obviously an email
Unstructured data:  "Contact us at support@example.com" → NER → email entity → PII classification
```

### Extraction Strategies

**Header-based extraction**: For markdown documents, headings provide structural metadata:

```python
def extract_from_markdown(content: str) -> dict:
    headings = re.findall(r'^(#{1,3})\s+(.+)$', content, re.MULTILINE)
    return {
        "title": headings[0][1] if headings else "Untitled",
        "sections": [h[1] for h in headings if len(h[0]) == 2],
        "subsections": [h[1] for h in headings if len(h[0]) == 3],
        "has_code_blocks": "```" in content,
        "has_tables": "|" in content and "---" in content,
        "has_images": "![" in content,
        "has_links": "](http" in content or "](/" in content
    }
```

**Content-based classification**: Analyze the actual text to determine topic, type, and audience:

```python
def classify_content(content: str, classifier) -> dict:
    # Extract features
    features = {
        "avg_sentence_length": compute_avg_sentence_length(content),
        "technical_term_density": count_technical_terms(content) / len(content.split()),
        "code_ratio": count_code_chars(content) / len(content),
        "question_density": content.count("?") / len(content.split()),
    }

    # Classify content type
    if features["code_ratio"] > 0.3:
        content_type = "tutorial"
    elif features["question_density"] > 0.02:
        content_type = "faq"
    elif features["technical_term_density"] > 0.15:
        content_type = "reference"
    else:
        content_type = "conceptual"

    return {
        "content_type": content_type,
        "difficulty": classifier.predict_difficulty(content),
        "features": features
    }
```

## Tools: Amundsen, DataHub, OpenMetadata

### Amundsen

Created by Lyft, Amundsen is an open-source data discovery platform:

- **Search**: Full-text and faceted search across data assets
- **Lineage**: Upstream and downstream lineage visualization
- **Profiles**: Data profiling statistics for tables and columns
- **Integration**: Connectors for Hive, PostgreSQL, Snowflake, dbt, Airflow
- **Architecture**: Microservice-based (search, metadata, frontend services)

### DataHub

Created by LinkedIn, DataHub is a metadata platform with strong discovery features:

- **Auto-discovery**: Crawl and catalog data assets from 50+ sources
- **Classification**: Auto-classify sensitive data using pattern matching and ML
- **Lineage**: Column-level lineage across SQL transformations
- **Search**: Elasticsearch-powered search with ranking by usage and quality
- **GraphQL API**: Programmatic access to all metadata

### OpenMetadata

An open-source metadata platform with built-in discovery:

- **Auto-discovery**: Schema crawling with data profiling
- **Classification**: Configurable classifiers for PII, sensitivity, and business terms
- **Quality**: Built-in data quality framework with automated test generation
- **Lineage**: Cross-system lineage from ingestion to consumption
- **Collaboration**: Teams, roles, tags, and discussions

## Quality Validation of Discovered Metadata

### The Accuracy Problem

Automatically discovered metadata is not always correct. A column containing "Spring" might be classified as a season, a product name, or a Java framework. Validation ensures discovered metadata meets accuracy standards:

```python
class MetadataValidator:
    def validate_discovery(self, discovered: dict, confidence_threshold: float = 0.8):
        """Validate and filter discovered metadata by confidence."""
        validated = {}
        needs_review = {}

        for key, value in discovered.items():
            if isinstance(value, dict) and "confidence" in value:
                if value["confidence"] >= confidence_threshold:
                    validated[key] = value
                else:
                    needs_review[key] = value
            else:
                validated[key] = value  # No confidence score = assume valid

        return {
            "validated": validated,
            "needs_review": needs_review,
            "auto_accepted": len(validated),
            "needs_human_review": len(needs_review)
        }
```

### Human-in-the-Loop Validation

For metadata below the confidence threshold, queue for human review:

1. Present the discovered metadata alongside the source data
2. Human reviewer confirms, corrects, or rejects each suggestion
3. Confirmed metadata becomes training data for future discovery
4. Patterns from corrections improve the discovery models

### Continuous Improvement

Track discovery accuracy over time and improve:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Classification accuracy | > 90% | Human review agreement rate |
| False positive rate | < 5% | Incorrect classifications / total |
| Coverage | > 80% | Assets with metadata / total assets |
| Freshness | < 24 hours | Time from data change to metadata update |

## Conclusion

Dynamic metadata discovery transforms the metadata problem from a manual documentation task into an automated intelligence system. By combining schema crawling with data profiling, NLP extraction, pattern matching, embedding clustering, and LLM-powered classification, organizations can maintain comprehensive, accurate metadata catalogs without requiring teams of data stewards to manually tag every asset. For knowledge bases powering AI systems, dynamic discovery ensures that every article is properly categorized, classified, and enriched — enabling retrieval systems to find the right content for the right query, even as the knowledge base grows and evolves. The key is building a discovery pipeline that runs continuously, validates its own accuracy, and improves with human feedback.

## Media

1. ![Data discovery pipeline](https://upload.wikimedia.org/wikipedia/commons/c/c3/ETL_process_in_data_warehousing.png) — ETL pipeline architecture analogous to metadata discovery flow
2. ![Machine learning classification](https://upload.wikimedia.org/wikipedia/commons/1/17/Kernel_Machine.svg) — Machine learning kernel methods used in metadata classification
3. ![Clustering visualization](https://upload.wikimedia.org/wikipedia/commons/6/69/Boxplot_vs_PDF.svg) — Statistical distributions used in data profiling and anomaly detection
4. ![Graph database model](https://upload.wikimedia.org/wikipedia/commons/3/3a/GraphDatabase_PropertyGraph.png) — Property graph showing discovered metadata relationships
5. ![NER example](https://upload.wikimedia.org/wikipedia/commons/3/3f/Example_of_a_named_entity_recognition_system.png) — Named entity recognition extracting metadata from unstructured text

## Videos

1. https://www.youtube.com/watch?v=YaGlx_WE0x0 — "What is a Data Catalog?" by Atlan on metadata discovery and cataloging
2. https://www.youtube.com/watch?v=W_oUahwaoiA — "Data Quality Management Explained" by IBM Technology on automated metadata processes

## References

1. DataHub Documentation: Metadata Ingestion — https://datahubproject.io/docs/metadata-ingestion/
2. OpenMetadata Documentation: Auto-Classification — https://docs.open-metadata.org/
3. Amundsen Documentation — https://www.amundsen.io/amundsen/
4. Halevy, A., et al. (2016). "Goods: Organizing Google's Datasets." *SIGMOD 2016*. https://dl.acm.org/doi/10.1145/2882903.2903730
