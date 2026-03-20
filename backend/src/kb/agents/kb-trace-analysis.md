# Trace Analysis for Knowledge Base Quality

## Introduction

A knowledge base is only as good as what it retrieves. You can have thousands of perfectly written articles, but if the retrieval system returns the wrong ones — or misses the right ones — the AI agent produces hallucinated, irrelevant, or incomplete answers. Trace analysis is the systematic examination of retrieval behavior: which chunks were retrieved for which queries, how relevant they were, where the system succeeded, and where it failed. By instrumenting the retrieval pipeline and analyzing its traces, teams can identify quality gaps, measure improvement over time, and build feedback loops that continuously improve retrieval accuracy. This article covers retrieval metrics, golden dataset evaluation methodology, A/B testing strategies, and feedback loop architectures.

## What Retrieval Traces Tell You

### Anatomy of a Retrieval Trace

Every retrieval operation produces a trace — a record of what happened:

```typescript
interface RetrievalTrace {
  traceId: string;
  timestamp: Date;
  tenantId: string;

  // Query
  query: string;
  queryEmbedding?: number[];    // Optional: store for analysis
  queryIntent?: string;         // Classified intent

  // Retrieval
  retrievalMethod: "vector" | "hybrid" | "graphrag";
  filters: Record<string, unknown>;
  topK: number;

  // Results
  results: RetrievalResult[];

  // Performance
  latencyMs: number;
  embeddingLatencyMs: number;
  searchLatencyMs: number;

  // Context
  agentName: string;
  sessionId: string;
}

interface RetrievalResult {
  chunkId: string;
  documentId: string;
  score: number;
  rank: number;
  metadata: Record<string, unknown>;
  textPreview: string;           // First 200 chars
  wasUsedInAnswer: boolean;      // Did the LLM actually use this chunk?
  userRating?: "relevant" | "irrelevant" | "partially_relevant";
}
```

### Instrumenting the Retrieval Pipeline

```typescript
class InstrumentedRetriever {
  private baseRetriever: VectorRetriever;
  private traceStore: TraceStore;

  async retrieve(query: string, options: RetrievalOptions): Promise<RetrievalTrace> {
    const traceId = crypto.randomUUID();
    const startTime = Date.now();

    // Embed query
    const embedStart = Date.now();
    const queryEmbedding = await this.embedder.encode(query);
    const embedLatency = Date.now() - embedStart;

    // Search
    const searchStart = Date.now();
    const rawResults = await this.baseRetriever.search(queryEmbedding, options);
    const searchLatency = Date.now() - searchStart;

    // Build trace
    const trace: RetrievalTrace = {
      traceId,
      timestamp: new Date(),
      tenantId: options.tenantId,
      query,
      queryIntent: await this.classifyIntent(query),
      retrievalMethod: options.method ?? "vector",
      filters: options.filters ?? {},
      topK: options.topK,
      results: rawResults.map((r, i) => ({
        chunkId: r.id,
        documentId: r.metadata.documentId,
        score: r.score,
        rank: i + 1,
        metadata: r.metadata,
        textPreview: r.text.substring(0, 200),
        wasUsedInAnswer: false,  // Updated after LLM generation
      })),
      latencyMs: Date.now() - startTime,
      embeddingLatencyMs: embedLatency,
      searchLatencyMs: searchLatency,
      agentName: options.agentName,
      sessionId: options.sessionId,
    };

    // Store trace asynchronously (don't block retrieval)
    this.traceStore.save(trace).catch(err =>
      console.error("Failed to save trace:", err)
    );

    return trace;
  }
}
```

## Metrics: Measuring Retrieval Quality

### Hit Rate (Recall@k)

The most basic metric: for what percentage of queries does the correct answer appear anywhere in the top-k retrieved chunks?

```python
def hit_rate(traces: list[dict], golden_answers: dict[str, str]) -> float:
    """Calculate hit rate: fraction of queries where the answer was retrieved."""
    hits = 0
    total = 0

    for trace in traces:
        query = trace["query"]
        if query not in golden_answers:
            continue

        expected_chunk_id = golden_answers[query]
        retrieved_ids = [r["chunkId"] for r in trace["results"]]

        if expected_chunk_id in retrieved_ids:
            hits += 1
        total += 1

    return hits / total if total > 0 else 0
```

**Target:** 90%+ for production knowledge bases. Below 85% indicates systematic retrieval failures.

### Mean Reciprocal Rank (MRR)

MRR measures not just whether the correct chunk was retrieved, but how high it ranked. If the correct chunk is always at position 1, MRR is 1.0. If it is always at position 3, MRR is 0.33.

```python
def mean_reciprocal_rank(traces: list[dict], golden_answers: dict[str, str]) -> float:
    """Calculate MRR: average of 1/rank of first relevant result."""
    reciprocal_ranks = []

    for trace in traces:
        query = trace["query"]
        if query not in golden_answers:
            continue

        expected_chunk_id = golden_answers[query]
        retrieved_ids = [r["chunkId"] for r in trace["results"]]

        if expected_chunk_id in retrieved_ids:
            rank = retrieved_ids.index(expected_chunk_id) + 1
            reciprocal_ranks.append(1.0 / rank)
        else:
            reciprocal_ranks.append(0.0)

    return sum(reciprocal_ranks) / len(reciprocal_ranks) if reciprocal_ranks else 0
```

**Target:** 0.7+ for production systems. MRR below 0.5 means the correct chunk is typically buried below position 2.

### NDCG (Normalized Discounted Cumulative Gain)

NDCG accounts for graded relevance (not just binary relevant/not-relevant) and position bias (higher-ranked results matter more):

```python
import numpy as np

def dcg(relevance_scores: list[float]) -> float:
    """Discounted Cumulative Gain."""
    return sum(
        rel / np.log2(i + 2)  # +2 because log2(1) = 0
        for i, rel in enumerate(relevance_scores)
    )

def ndcg(retrieved_relevances: list[float], ideal_relevances: list[float]) -> float:
    """Normalized DCG: actual DCG / ideal DCG."""
    ideal = dcg(sorted(ideal_relevances, reverse=True))
    if ideal == 0:
        return 0
    return dcg(retrieved_relevances) / ideal

# Example: 3-point relevance scale (0=irrelevant, 1=partial, 2=perfect)
retrieved = [2, 0, 1, 0, 1]  # Relevance scores in retrieval order
ideal = [2, 1, 1, 0, 0]      # Best possible ordering
print(f"NDCG: {ndcg(retrieved, ideal):.3f}")
```

**Target:** 0.75+ for production systems.

### Retrieval Latency

Latency directly affects user experience and agent response time:

| Percentile | Target | Red Flag |
|-----------|--------|----------|
| p50 | <100ms | >500ms |
| p95 | <300ms | >1000ms |
| p99 | <500ms | >2000ms |

```python
def latency_percentiles(traces: list[dict]) -> dict:
    """Calculate latency percentiles from traces."""
    latencies = [t["latencyMs"] for t in traces]
    return {
        "p50": np.percentile(latencies, 50),
        "p75": np.percentile(latencies, 75),
        "p95": np.percentile(latencies, 95),
        "p99": np.percentile(latencies, 99),
        "max": max(latencies),
    }
```

## Golden Dataset Evaluation Methodology

### What Is a Golden Dataset?

A golden dataset is a curated set of query-answer pairs where the correct retrieval result is known. It serves as the ground truth for measuring retrieval quality. Without a golden dataset, you are measuring retrieval performance against unknown targets — you cannot distinguish between a system that retrieves correctly and one that confidently retrieves the wrong chunks.

### Building a Golden Dataset

```python
@dataclass
class GoldenQuery:
    query_id: str
    query: str
    expected_chunk_ids: list[str]    # Chunks that should be retrieved
    relevance_grades: dict[str, int]  # chunk_id → relevance score (0-2)
    category: str                     # Query category for stratified analysis
    difficulty: str                   # "easy" | "medium" | "hard"
    notes: str                        # Why this query is in the golden set

# Example golden queries for a trade business KB
golden_queries = [
    GoldenQuery(
        query_id="gq-001",
        query="How do I cancel my subscription?",
        expected_chunk_ids=["chunk-billing-cancel-01"],
        relevance_grades={"chunk-billing-cancel-01": 2, "chunk-billing-faq-03": 1},
        category="billing",
        difficulty="easy",
        notes="Direct factual query — should hit the cancellation guide",
    ),
    GoldenQuery(
        query_id="gq-002",
        query="What happens if Lucy can't reach the business owner?",
        expected_chunk_ids=["chunk-escalation-01", "chunk-voicemail-fallback-01"],
        relevance_grades={
            "chunk-escalation-01": 2,
            "chunk-voicemail-fallback-01": 2,
            "chunk-agent-config-01": 1,
        },
        category="product/behavior",
        difficulty="medium",
        notes="Multi-chunk answer — requires retrieving escalation policy AND fallback behavior",
    ),
    GoldenQuery(
        query_id="gq-003",
        query="Compare the cost of using ElevenLabs vs a custom voice model",
        expected_chunk_ids=["chunk-voice-cost-comparison-01"],
        relevance_grades={"chunk-voice-cost-comparison-01": 2, "chunk-elevenlabs-pricing-01": 1},
        category="voice/cost",
        difficulty="hard",
        notes="Requires synthesizing pricing from multiple sources",
    ),
]
```

### Golden Dataset Best Practices

1. **Size:** Minimum 100 queries for meaningful statistics, 300-500 for robust evaluation. Atlas UX uses 409 golden queries.
2. **Coverage:** Distribute queries across all knowledge domains and difficulty levels.
3. **Diversity:** Include factual queries, how-to queries, comparison queries, and edge cases.
4. **Versioning:** The golden dataset should be version-controlled and updated when the KB structure changes.
5. **Regular review:** Re-validate golden answers quarterly — what was correct 3 months ago may no longer be.

### Running Evaluations

```python
class GoldenDatasetEvaluator:
    def __init__(self, retriever, golden_queries: list[GoldenQuery]):
        self.retriever = retriever
        self.golden_queries = golden_queries

    async def evaluate(self) -> EvaluationReport:
        results = []

        for gq in self.golden_queries:
            trace = await self.retriever.retrieve(gq.query, top_k=10)
            retrieved_ids = [r["chunkId"] for r in trace["results"]]

            # Hit rate
            hit = any(eid in retrieved_ids for eid in gq.expected_chunk_ids)

            # MRR
            mrr = 0
            for eid in gq.expected_chunk_ids:
                if eid in retrieved_ids:
                    rank = retrieved_ids.index(eid) + 1
                    mrr = max(mrr, 1.0 / rank)

            # NDCG
            retrieved_relevances = [
                gq.relevance_grades.get(rid, 0) for rid in retrieved_ids
            ]
            ideal_relevances = sorted(gq.relevance_grades.values(), reverse=True)
            ndcg_score = ndcg(retrieved_relevances, ideal_relevances)

            results.append({
                "query_id": gq.query_id,
                "query": gq.query,
                "hit": hit,
                "mrr": mrr,
                "ndcg": ndcg_score,
                "category": gq.category,
                "difficulty": gq.difficulty,
                "latency_ms": trace["latencyMs"],
            })

        return self._compile_report(results)

    def _compile_report(self, results: list[dict]) -> EvaluationReport:
        return {
            "overall": {
                "hit_rate": np.mean([r["hit"] for r in results]),
                "mrr": np.mean([r["mrr"] for r in results]),
                "ndcg": np.mean([r["ndcg"] for r in results]),
                "p95_latency": np.percentile([r["latency_ms"] for r in results], 95),
            },
            "by_category": self._group_metrics(results, "category"),
            "by_difficulty": self._group_metrics(results, "difficulty"),
            "failures": [r for r in results if not r["hit"]],
        }
```

## A/B Testing Retrieval Strategies

### Experiment Design

A/B testing retrieval strategies requires splitting traffic between two (or more) retrieval configurations and comparing metrics:

```python
class RetrievalExperiment:
    def __init__(self, name: str, control: Retriever, treatment: Retriever, split_ratio: float = 0.5):
        self.name = name
        self.control = control
        self.treatment = treatment
        self.split_ratio = split_ratio
        self.traces = {"control": [], "treatment": []}

    async def retrieve(self, query: str, options: dict) -> dict:
        """Route query to control or treatment based on split."""
        import random
        group = "treatment" if random.random() < self.split_ratio else "control"
        retriever = self.treatment if group == "treatment" else self.control

        trace = await retriever.retrieve(query, options)
        trace["experiment_group"] = group
        self.traces[group].append(trace)

        return trace

    def analyze(self) -> dict:
        """Compare control vs treatment metrics."""
        control_metrics = compute_metrics(self.traces["control"])
        treatment_metrics = compute_metrics(self.traces["treatment"])

        return {
            "control": control_metrics,
            "treatment": treatment_metrics,
            "improvement": {
                "hit_rate": treatment_metrics["hit_rate"] - control_metrics["hit_rate"],
                "mrr": treatment_metrics["mrr"] - control_metrics["mrr"],
                "ndcg": treatment_metrics["ndcg"] - control_metrics["ndcg"],
                "latency_change_pct": (
                    (treatment_metrics["p95_latency"] - control_metrics["p95_latency"])
                    / control_metrics["p95_latency"] * 100
                ),
            },
            "statistical_significance": self._compute_significance(),
        }
```

### What to A/B Test

| Variable | Control | Treatment | Expected Impact |
|----------|---------|-----------|-----------------|
| Chunk size | 500 tokens | 300 tokens | Higher precision, lower context |
| Embedding model | text-embedding-3-small | text-embedding-3-large | Better quality, higher cost |
| Top-k | 5 | 10 | Higher recall, more noise |
| Reranking | None | Cohere Rerank | Better ranking, added latency |
| Hybrid search | Vector only | Vector + BM25 | Better keyword coverage |
| Metadata boost | No tier boost | Tier 1 = 1.3x | Better authority weighting |

## Feedback Loops: User Corrections to KB Improvements

### Implicit Feedback Signals

```typescript
interface ImplicitFeedback {
  traceId: string;
  signal: "positive" | "negative";
  source: string;
  confidence: number;
}

function detectImplicitFeedback(interaction: UserInteraction): ImplicitFeedback[] {
  const signals: ImplicitFeedback[] = [];

  // Positive signals
  if (interaction.followUpQuery === null) {
    // User did not need to ask again — answer was likely good
    signals.push({ traceId: interaction.traceId, signal: "positive", source: "no_followup", confidence: 0.6 });
  }

  if (interaction.timeOnAnswer > 5000) {
    // User spent time reading — answer was likely relevant
    signals.push({ traceId: interaction.traceId, signal: "positive", source: "read_time", confidence: 0.5 });
  }

  // Negative signals
  if (interaction.reformulatedQuery) {
    // User rephrased the question — first retrieval likely failed
    signals.push({ traceId: interaction.traceId, signal: "negative", source: "reformulation", confidence: 0.7 });
  }

  if (interaction.abandonedWithin < 3000) {
    // User left quickly — answer was likely wrong
    signals.push({ traceId: interaction.traceId, signal: "negative", source: "quick_abandon", confidence: 0.6 });
  }

  return signals;
}
```

### Explicit Feedback Collection

```typescript
// Thumbs up/down on retrieval quality
app.post("/v1/feedback/retrieval", async (request, reply) => {
  const { traceId, rating, comment } = request.body;

  await prisma.retrievalFeedback.create({
    data: {
      traceId,
      rating,  // "relevant" | "partially_relevant" | "irrelevant"
      comment,
      submittedAt: new Date(),
    },
  });

  // If consistently negative feedback for a topic, trigger KB review
  const recentNegative = await prisma.retrievalFeedback.count({
    where: {
      rating: "irrelevant",
      submittedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  if (recentNegative > 10) {
    await triggerKBReview("high_negative_feedback");
  }
});
```

### Feedback-Driven KB Improvement Loop

```
User Query → Retrieval → LLM Answer → User Feedback
                                            │
                                            ▼
                                    Feedback Aggregation
                                            │
                                            ▼
                              ┌─────────────┴─────────────┐
                              │  Frequently Failed Queries │
                              │  (negative feedback > 3x)  │
                              └─────────────┬─────────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │     Root Cause Analysis    │
                              │  - Missing content?        │
                              │  - Wrong chunking?         │
                              │  - Bad embeddings?         │
                              │  - Metadata mismatch?      │
                              └─────────────┬─────────────┘
                                            │
                              ┌─────────────┴─────────────┐
                              │       Auto-Heal Action     │
                              │  - Re-embed stale chunks   │
                              │  - Add missing content     │
                              │  - Reclassify metadata     │
                              │  - Update golden dataset   │
                              └────────────────────────────┘
```

## Atlas UX: 409 Golden Queries, Health Scoring, Auto-Heal

Atlas UX implements trace analysis through a comprehensive evaluation and self-healing pipeline:

### Golden Dataset

409 curated queries spanning all knowledge domains (product, voice, billing, API, industry verticals). Each query has expected retrieval targets and graded relevance scores. The dataset is version-controlled and updated when the KB structure changes.

### Health Scoring

The KB eval worker runs periodically, scoring overall KB health:

```
Health Score = (0.4 * hit_rate) + (0.3 * mrr) + (0.2 * ndcg) + (0.1 * (1 - p95_latency/1000))
```

Scores above 85 indicate healthy retrieval. Scores below 75 trigger automatic investigation.

### Auto-Heal Pipeline

When health scores drop or specific queries consistently fail:
1. **Safe auto-heal actions** execute without approval: re-embedding stale chunks, relinking broken references, reclassifying miscategorized content
2. **Risky actions** create decision memos for human approval: merging duplicate articles, deleting outdated content, modifying tier assignments
3. **Results are tracked:** Every heal action is logged with before/after metrics to measure its impact

This closed-loop system ensures the knowledge base continuously improves based on actual retrieval performance, not just intuition about what "should" work.

## Conclusion

Trace analysis transforms knowledge base management from guesswork into engineering. By instrumenting every retrieval operation, measuring against golden datasets, and building feedback loops from user interactions back into KB improvements, teams can systematically improve retrieval quality over time. The key metrics — hit rate, MRR, NDCG, and latency — provide actionable signals about where the system succeeds and where it fails. A/B testing enables data-driven decisions about chunking strategies, embedding models, and search configurations. And feedback loops — both implicit and explicit — ensure that the knowledge base learns from every interaction rather than degrading silently.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Precision_and_recall.svg/400px-Precision_and_recall.svg.png — Precision and recall diagram illustrating retrieval quality measurement
2. https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Receiver_operating_characteristic.svg/400px-Receiver_operating_characteristic.svg.png — ROC curve showing the trade-off between true positive and false positive rates in retrieval
3. https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/AB_Testing.svg/400px-AB_Testing.svg.png — A/B testing diagram showing traffic splitting between control and treatment groups
4. https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Feedback_loop.svg/400px-Feedback_loop.svg.png — Feedback loop diagram showing the cycle from measurement to improvement
5. https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Pipeline_software.svg/400px-Pipeline_software.svg.png — Pipeline architecture for the trace analysis and evaluation workflow

## Videos

1. https://www.youtube.com/watch?v=J_tCD_J6w1s — "Evaluating RAG Systems" by Pinecone covering retrieval metrics and golden dataset methodology
2. https://www.youtube.com/watch?v=ahnGLM-RC1Y — "RAG Evaluation: How to Measure Quality" by LlamaIndex demonstrating evaluation frameworks and metrics

## References

1. Manning, C. D., Raghavan, P., & Schutze, H. (2008). "Introduction to Information Retrieval." Cambridge University Press. Chapter 8: Evaluation. https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-ranked-retrieval-results-1.html
2. Jarvelin, K. & Kekalainen, J. (2002). "Cumulated Gain-Based Evaluation of IR Techniques." ACM Transactions on Information Systems, 20(4), 422-446. https://dl.acm.org/doi/10.1145/582415.582418
3. LlamaIndex Documentation. "Evaluation Module." https://docs.llamaindex.ai/en/stable/module_guides/evaluating/
4. RAGAS Documentation. "Metrics for RAG Evaluation." https://docs.ragas.io/en/stable/concepts/metrics/
