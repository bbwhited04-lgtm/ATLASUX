# Data Quality Alerts for Knowledge Bases

## Introduction

A knowledge base is only as valuable as the quality of the knowledge it contains. When an AI system retrieves information from a KB to ground its responses, every inaccuracy, inconsistency, or gap in the data propagates directly into the AI's output — the classic "garbage in, garbage out" problem, amplified by the confidence with which LLMs present incorrect information. Data quality alerts are automated monitoring systems that continuously evaluate KB health across multiple dimensions and trigger notifications when quality degrades below acceptable thresholds. For AI platforms that serve real customers — booking appointments, quoting prices, answering policy questions — a silent data quality failure can mean wrong prices quoted, wrong technicians dispatched, or wrong policies cited. Proactive alerting catches these problems before they reach customers.

## Why Data Quality Matters for AI/KB Systems

### Garbage In, Hallucinations Out

When an LLM retrieves stale, incomplete, or contradictory information from a knowledge base, three things happen:

1. **Direct propagation**: The LLM presents the bad data as fact ("Our drain cleaning service costs $75" when it was updated to $125 six months ago)
2. **Compounding errors**: The LLM combines bad data with its own reasoning, producing plausible but wrong conclusions ("Since drain cleaning costs $75 and you need two drains, that will be $150" — now the error has multiplied)
3. **Confidence masking**: The LLM presents the information with the same confidence as correct information, making errors harder for customers to detect

### The Cost of Bad KB Data

For trade businesses using an AI receptionist:
- **Wrong pricing** leads to customer disputes and lost revenue
- **Outdated availability** leads to double bookings and customer frustration
- **Incorrect service descriptions** lead to wrong expectations and bad reviews
- **Missing information** leads to the AI saying "I don't know" when it should know
- **Contradictory information** leads to inconsistent answers across calls

### The Scale Problem

As knowledge bases grow — Atlas UX's KB spans 141+ articles across 15+ domains — manual quality review becomes impractical. A human reviewer reading every article quarterly would spend days on the task. Automated quality alerts make continuous monitoring feasible at any scale.

## Alert Dimensions

### Completeness

Completeness measures whether the KB contains all the information it should. Alerts fire when:

- **Missing required fields**: An article about a service lacks pricing information
- **Incomplete sections**: An article has a "## Pricing" header but no content below it
- **Coverage gaps**: A topic that should be covered has no corresponding article
- **Thin content**: Articles below a minimum word count threshold (e.g., < 500 words)

```python
def check_completeness(article: dict, schema: dict) -> list:
    alerts = []
    for required_field in schema["required_fields"]:
        if required_field not in article or not article[required_field]:
            alerts.append({
                "type": "missing_field",
                "severity": "high",
                "field": required_field,
                "article": article["id"]
            })

    if article.get("word_count", 0) < schema["min_word_count"]:
        alerts.append({
            "type": "thin_content",
            "severity": "medium",
            "word_count": article["word_count"],
            "minimum": schema["min_word_count"]
        })

    return alerts
```

### Accuracy

Accuracy measures whether the KB content is factually correct. This is the hardest dimension to automate:

- **Cross-reference validation**: Compare KB facts against authoritative sources (API responses, database records, official documentation)
- **Internal consistency**: Check that the same fact stated in multiple places is consistent
- **Temporal accuracy**: Verify that time-sensitive information (prices, hours, availability) is current
- **Link validation**: Check that all URLs in articles resolve (no 404s)

### Consistency

Consistency measures whether the KB presents a unified view:

- **Terminology consistency**: The same concept should use the same term everywhere ("drain cleaning" not sometimes "drain clearing" and sometimes "drain cleaning")
- **Formatting consistency**: All articles should follow the same structure and formatting conventions
- **Cross-reference consistency**: When Article A references a fact from Article B, those facts should match
- **Version consistency**: When a fact is updated in one place, it should be updated everywhere it appears

### Timeliness

Timeliness measures whether content is current:

- **Stale content detection**: Articles not updated within a defined window (e.g., 90 days for pricing, 30 days for availability)
- **Temporal reference checking**: Articles referencing specific dates that have passed ("our 2024 spring promotion")
- **Source freshness**: Whether the sources cited in articles are still current
- **Event-triggered staleness**: External events (price changes, policy updates, personnel changes) that make content stale

```python
def check_timeliness(article: dict, staleness_rules: dict) -> list:
    alerts = []
    category = article.get("category", "general")
    max_age_days = staleness_rules.get(category, 90)

    last_updated = parse_date(article["updated_at"])
    age_days = (datetime.now() - last_updated).days

    if age_days > max_age_days:
        alerts.append({
            "type": "stale_content",
            "severity": "high" if age_days > max_age_days * 2 else "medium",
            "article": article["id"],
            "age_days": age_days,
            "max_age_days": max_age_days
        })

    return alerts
```

### Uniqueness

Uniqueness measures whether the KB avoids redundant content:

- **Duplicate detection**: Near-identical articles or sections that contain the same information
- **Overlap analysis**: Articles with significant content overlap that should be consolidated
- **Canonical source identification**: When information exists in multiple places, which is the authoritative source?

## Automated Quality Checks

### Schema Validation

Every KB article should conform to a defined schema. Automated validation catches structural violations:

```json
{
  "article_schema": {
    "required_sections": ["Introduction", "Media", "Videos", "References"],
    "min_word_count": 2000,
    "max_word_count": 5000,
    "required_media_count": 5,
    "required_video_count": 2,
    "required_reference_count": 2,
    "allowed_heading_levels": [1, 2, 3],
    "file_prefix": "kb-"
  }
}
```

### Embedding Drift Detection

When KB content is embedded into a vector store for retrieval, the embeddings should remain stable. If re-embedding an article produces a significantly different vector, the content may have drifted:

```python
def detect_embedding_drift(article_id: str, new_embedding: list,
                           stored_embedding: list, threshold: float = 0.15):
    similarity = cosine_similarity(new_embedding, stored_embedding)
    drift = 1.0 - similarity

    if drift > threshold:
        return {
            "type": "embedding_drift",
            "severity": "medium",
            "article": article_id,
            "drift_score": drift,
            "threshold": threshold
        }
    return None
```

Embedding drift can indicate:
- Content was significantly rewritten (intentional — update the stored embedding)
- Content was corrupted or accidentally modified (unintentional — investigate)
- The embedding model was updated (all embeddings need re-generation)

### Stale Content Flags

Automated freshness checking based on content type:

| Content Type | Freshness Window | Alert Severity |
|-------------|-----------------|----------------|
| Pricing information | 30 days | Critical |
| Business hours | 7 days | High |
| Service descriptions | 90 days | Medium |
| Technical documentation | 180 days | Low |
| Historical/reference content | 365 days | Low |
| Contact information | 30 days | High |

### Link Validation

All URLs referenced in KB articles should be checked periodically:

```python
import requests
from concurrent.futures import ThreadPoolExecutor

def validate_links(articles: list) -> list:
    alerts = []
    urls = extract_all_urls(articles)

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = executor.map(check_url, urls)

    for url, status in results:
        if status == "broken":
            alerts.append({
                "type": "broken_link",
                "severity": "medium",
                "url": url,
                "articles": find_articles_containing(url, articles)
            })

    return alerts
```

## Alert Patterns

### Threshold-Based Alerts

The simplest pattern: alert when a metric crosses a predefined threshold.

```python
THRESHOLDS = {
    "overall_quality_score": {"warning": 0.8, "critical": 0.6},
    "stale_article_percentage": {"warning": 0.1, "critical": 0.25},
    "broken_link_count": {"warning": 5, "critical": 15},
    "average_completeness": {"warning": 0.85, "critical": 0.7}
}

def evaluate_thresholds(metrics: dict, thresholds: dict) -> list:
    alerts = []
    for metric, value in metrics.items():
        if metric in thresholds:
            if value < thresholds[metric]["critical"]:
                alerts.append({"metric": metric, "value": value, "severity": "critical"})
            elif value < thresholds[metric]["warning"]:
                alerts.append({"metric": metric, "value": value, "severity": "warning"})
    return alerts
```

### Anomaly Detection

More sophisticated: detect unusual patterns that deviate from historical norms.

- **Sudden quality drops**: Quality score drops more than 10% week-over-week
- **Unusual edit patterns**: Many articles edited in a short window (possible bulk corruption)
- **Retrieval anomalies**: Articles that were frequently retrieved suddenly getting zero hits (possible categorization error)
- **Embedding cluster shifts**: Articles shifting between embedding clusters (possible topic drift)

### Trend Analysis

Track quality metrics over time to identify gradual degradation:

- **Aging trend**: Average article age increasing steadily (content is not being refreshed)
- **Coverage trend**: New topics emerging in queries that have no KB coverage
- **Accuracy trend**: User corrections or feedback indicating increasing inaccuracy
- **Engagement trend**: Declining retrieval rates for specific content areas

## Designing an Alert Pipeline

### Pipeline Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Quality     │───>│  Alert       │───>│  Routing     │
│  Checks      │    │  Classification│   │  Engine      │
│  (scheduled) │    │  (severity)  │    │  (who/how)   │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                               │
                         ┌─────────────────────┼─────────────────┐
                         │                     │                 │
                  ┌──────▼───┐          ┌──────▼───┐     ┌──────▼───┐
                  │  Slack   │          │  Email   │     │  Auto-   │
                  │  Alert   │          │  Digest  │     │  Heal    │
                  └──────────┘          └──────────┘     └──────────┘
```

### Stage 1: Detect

Run quality checks on a schedule:
- **Continuous**: Link validation, schema validation (low cost, high impact)
- **Hourly**: Freshness checks for time-sensitive content
- **Daily**: Completeness scans, consistency checks, embedding drift detection
- **Weekly**: Full quality audit with trend analysis

### Stage 2: Classify Severity

Not all quality issues are equally urgent:

| Severity | Response Time | Examples |
|----------|--------------|---------|
| Critical | < 1 hour | Wrong pricing live in KB, broken critical functionality |
| High | < 4 hours | Stale business hours, missing service description |
| Medium | < 24 hours | Broken external link, formatting inconsistency |
| Low | Next review cycle | Minor grammar issues, suboptimal wording |

### Stage 3: Route

Different severities route to different channels:
- **Critical**: Immediate Slack alert + SMS to KB maintainer
- **High**: Slack alert in ops channel
- **Medium**: Daily digest email
- **Low**: Weekly quality report

### Stage 4: Resolve

Tracked resolution with audit trail:
1. Alert created with unique ID
2. Assigned to owner (auto-assigned based on content area)
3. Resolution action taken (edit, delete, update, re-embed)
4. Alert closed with resolution notes
5. Validation re-run to confirm fix

## Tools for Data Quality

### Great Expectations

An open-source Python framework for data quality validation. Define "expectations" (assertions about data) and run them against data batches:

```python
import great_expectations as gx

context = gx.get_context()

# Define expectations for KB articles
suite = context.add_expectation_suite("kb_article_quality")
suite.add_expectation(
    gx.expectations.ExpectColumnValuesToNotBeNull(column="title")
)
suite.add_expectation(
    gx.expectations.ExpectColumnValueLengthsToBeBetween(
        column="content", min_value=2000, max_value=10000
    )
)
```

### Monte Carlo

A commercial data observability platform that provides automated anomaly detection, root cause analysis, and impact assessment for data quality issues. Monte Carlo monitors data freshness, volume, schema changes, and distribution shifts.

### Soda

An open-source data quality platform with a YAML-based check definition language:

```yaml
checks for kb_articles:
  - row_count > 100
  - missing_count(title) = 0
  - missing_count(content) = 0
  - avg(word_count) between 2000 and 4000
  - max(days_since_update) < 180
  - duplicate_count(title) = 0
```

### Custom Validators

For KB-specific quality checks, custom validators are often necessary:

```python
class KBQualityValidator:
    def validate_article(self, article: dict) -> QualityReport:
        checks = [
            self.check_completeness(article),
            self.check_freshness(article),
            self.check_links(article),
            self.check_consistency(article),
            self.check_schema(article),
            self.check_embedding_quality(article)
        ]
        return QualityReport(
            article_id=article["id"],
            score=self.compute_score(checks),
            alerts=[a for check in checks for a in check.alerts],
            timestamp=datetime.utcnow()
        )
```

## Atlas UX Pattern: KB Eval Health Scoring with Auto-Heal Triggers

Atlas UX implements a KB health scoring system that combines multiple quality dimensions into a single health score per article and per KB section:

**Health score formula:**
```
article_health = (
    completeness_score * 0.25 +
    freshness_score * 0.25 +
    consistency_score * 0.20 +
    retrieval_score * 0.15 +
    link_health_score * 0.15
)
```

**Auto-heal triggers:**
When an article's health score drops below threshold, the system triggers automatic remediation:

- **Score < 0.7**: Flag for manual review
- **Score < 0.5**: Auto-heal actions triggered:
  - Re-embed: Regenerate embeddings with current content
  - Relink: Update broken internal cross-references
  - Reclassify: Re-run topic classification to ensure correct namespace placement
  - Stale flag: Mark article as stale in metadata, reducing its retrieval weight

These auto-heal actions are non-destructive (they never delete content) and zero-cost (they use existing infrastructure), so they execute automatically without requiring approval workflows.

## Conclusion

Data quality alerts are the immune system of a knowledge base. They detect problems early, classify their severity, route them to the right responders, and in some cases heal automatically. For AI systems that serve real customers, silent quality degradation is unacceptable — a wrong price or outdated schedule quoted by an AI receptionist damages trust that took months to build. The investment in automated quality monitoring pays for itself the first time it catches a critical error before a customer encounters it.

## Media

1. ![Data quality dimensions diagram](https://upload.wikimedia.org/wikipedia/commons/8/8b/Data_warehouse_overview.JPG) — Data warehouse architecture showing quality checkpoints at each layer
2. ![Anomaly detection visualization](https://upload.wikimedia.org/wikipedia/commons/6/69/Boxplot_vs_PDF.svg) — Box plot showing how anomaly detection identifies outliers in data distributions
3. ![ETL pipeline architecture](https://upload.wikimedia.org/wikipedia/commons/c/c3/ETL_process_in_data_warehousing.png) — ETL pipeline with quality validation stages
4. ![Statistical process control chart](https://upload.wikimedia.org/wikipedia/commons/1/18/Barcontrol.svg) — Control chart used in quality monitoring to detect trends and anomalies
5. ![Database schema diagram](https://upload.wikimedia.org/wikipedia/commons/d/da/UML_diagram_of_a_Schema.png) — Schema diagram showing how quality metadata relates to content

## Videos

1. https://www.youtube.com/watch?v=W_oUahwaoiA — "Data Quality Management Explained" by IBM Technology
2. https://www.youtube.com/watch?v=jHHMVFY9pck — "Great Expectations: Data Quality for Data Engineering" by Seattle Data Engineering

## References

1. Great Expectations Documentation — https://docs.greatexpectations.io/docs/
2. Soda Documentation — https://docs.soda.io/
3. Batini, C. & Scannapieco, M. (2016). "Data and Information Quality: Dimensions, Principles and Techniques." Springer. https://link.springer.com/book/10.1007/978-3-319-24106-7
4. DAMA International. "DAMA-DMBOK: Data Management Body of Knowledge." https://www.dama.org/cpages/body-of-knowledge
