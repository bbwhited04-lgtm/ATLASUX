# Automated Knowledge Base Syncing

## Introduction

A knowledge base that is not current is a knowledge base that lies. When the product documentation says "click the blue button" but the UI redesign changed it to a green icon three weeks ago, every agent using that knowledge confidently gives wrong instructions. Automated syncing ensures that knowledge bases stay current with their source-of-truth documents — detecting changes, re-indexing incrementally, resolving conflicts between sources, and doing all of this without human intervention. This article covers the architecture patterns for keeping AI agent knowledge bases synchronized with upstream sources: git-based workflows, database-backed change detection, webhook-driven pipelines, multi-source aggregation, and the conflict resolution strategies needed when multiple sources disagree.

## Source-of-Truth Patterns

### Git-Based Knowledge Management

Treating the knowledge base as a git repository provides version control, change tracking, and collaboration workflows out of the box:

```
knowledge-base/
├── tier-1/           # Core product docs
│   ├── features/
│   ├── pricing/
│   └── api/
├── tier-2/           # Industry context
│   ├── plumbing/
│   ├── hvac/
│   └── salon/
├── tier-3/           # General reference
│   ├── ai-fundamentals/
│   └── business/
└── sync-config.yaml  # Sync rules and mappings
```

**Sync pipeline:**

```python
import subprocess
import hashlib
from pathlib import Path

class GitBasedSync:
    def __init__(self, repo_path: str, vector_store, embedder):
        self.repo_path = Path(repo_path)
        self.vector_store = vector_store
        self.embedder = embedder

    def detect_changes(self, since_commit: str) -> dict:
        """Detect files changed since the last sync."""
        result = subprocess.run(
            ["git", "diff", "--name-status", since_commit, "HEAD"],
            cwd=self.repo_path,
            capture_output=True, text=True,
        )

        changes = {"added": [], "modified": [], "deleted": []}
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            status, filepath = line.split("\t", 1)
            if status == "A":
                changes["added"].append(filepath)
            elif status == "M":
                changes["modified"].append(filepath)
            elif status == "D":
                changes["deleted"].append(filepath)

        return changes

    async def sync(self, since_commit: str) -> dict:
        """Incrementally sync changes to vector store."""
        changes = self.detect_changes(since_commit)
        stats = {"added": 0, "updated": 0, "deleted": 0, "errors": 0}

        # Process additions and modifications
        for filepath in changes["added"] + changes["modified"]:
            try:
                content = (self.repo_path / filepath).read_text(encoding="utf-8")
                chunks = self.chunk_document(content, filepath)
                embeddings = self.embedder.encode([c["text"] for c in chunks])

                for chunk, embedding in zip(chunks, embeddings):
                    await self.vector_store.upsert(
                        id=chunk["id"],
                        vector=embedding,
                        metadata=chunk["metadata"],
                    )

                stats["added" if filepath in changes["added"] else "updated"] += 1
            except Exception as e:
                stats["errors"] += 1
                print(f"Error syncing {filepath}: {e}")

        # Process deletions
        for filepath in changes["deleted"]:
            chunk_ids = self.get_chunk_ids_for_file(filepath)
            for chunk_id in chunk_ids:
                await self.vector_store.delete(id=chunk_id)
            stats["deleted"] += 1

        return stats

    def chunk_document(self, content: str, filepath: str) -> list[dict]:
        """Chunk a document and generate metadata."""
        # Implementation depends on chunking strategy
        file_hash = hashlib.sha256(content.encode()).hexdigest()[:12]
        # ... chunking logic ...
        return chunks
```

**Advantages:** Full version history, branch-based review workflows, familiar tooling.
**Disadvantages:** Not suitable for dynamic content (database records, live API data), requires technical users.

### Database-Backed Knowledge Management

For knowledge that originates in databases (customer support tickets, product configurations, CRM records), the database is the source of truth:

```typescript
interface SyncCheckpoint {
  sourceId: string;
  lastSyncedAt: Date;
  lastSyncedVersion: number;
  status: "synced" | "syncing" | "error";
}

class DatabaseSync {
  async detectChanges(source: string, checkpoint: SyncCheckpoint): Promise<ChangeSet> {
    // Query for records changed since last sync
    const changes = await prisma.kbDocument.findMany({
      where: {
        source,
        updatedAt: { gt: checkpoint.lastSyncedAt },
      },
      orderBy: { updatedAt: "asc" },
    });

    return {
      upserts: changes.filter(c => c.status !== "deleted"),
      deletions: changes.filter(c => c.status === "deleted"),
      checkpoint: {
        lastSyncedAt: changes.length > 0
          ? changes[changes.length - 1].updatedAt
          : checkpoint.lastSyncedAt,
      },
    };
  }

  async syncBatch(changes: ChangeSet): Promise<SyncResult> {
    const results = { processed: 0, errors: 0 };

    for (const doc of changes.upserts) {
      try {
        const chunks = await this.chunkAndEmbed(doc);
        await this.upsertToVectorStore(chunks);
        results.processed++;
      } catch (err) {
        results.errors++;
        await this.logSyncError(doc.id, err);
      }
    }

    for (const doc of changes.deletions) {
      await this.deleteFromVectorStore(doc.id);
      results.processed++;
    }

    return results;
  }
}
```

### Hybrid: Git for Docs, DB for Records

Production systems typically combine both:
- **Git:** Product documentation, API references, policies, KB articles
- **Database:** Customer records, appointment history, agent configurations, dynamic content
- **Sync coordinator:** Orchestrates both sources, resolves conflicts, maintains a unified index

## Change Detection and Incremental Re-Indexing

### Content Hashing for Change Detection

Compare content hashes to detect actual changes (not just timestamp updates):

```python
import hashlib

class ContentHashTracker:
    def __init__(self, db):
        self.db = db

    async def has_changed(self, document_id: str, content: str) -> bool:
        """Check if document content has actually changed."""
        new_hash = hashlib.sha256(content.encode()).hexdigest()

        existing = await self.db.sync_hashes.find_one({"document_id": document_id})

        if not existing:
            return True  # New document

        return existing["content_hash"] != new_hash

    async def update_hash(self, document_id: str, content: str) -> None:
        new_hash = hashlib.sha256(content.encode()).hexdigest()
        await self.db.sync_hashes.upsert(
            {"document_id": document_id},
            {"content_hash": new_hash, "updated_at": datetime.utcnow()},
        )
```

### Incremental Embedding Updates

Re-embedding the entire knowledge base on every change is wasteful. Incremental updates process only changed chunks:

```python
class IncrementalIndexer:
    def __init__(self, vector_store, embedder, hash_tracker):
        self.vector_store = vector_store
        self.embedder = embedder
        self.hash_tracker = hash_tracker

    async def process_document(self, doc_id: str, content: str) -> dict:
        """Process a document, re-embedding only changed chunks."""
        stats = {"new": 0, "updated": 0, "unchanged": 0, "deleted": 0}

        # Chunk the current version
        new_chunks = self.chunk(content, doc_id)
        new_chunk_ids = {c["id"] for c in new_chunks}

        # Get existing chunk IDs for this document
        existing_chunk_ids = await self.vector_store.get_ids_by_metadata(
            filter={"document_id": doc_id}
        )

        # Delete chunks that no longer exist
        for old_id in existing_chunk_ids - new_chunk_ids:
            await self.vector_store.delete(id=old_id)
            stats["deleted"] += 1

        # Upsert new and changed chunks
        for chunk in new_chunks:
            if await self.hash_tracker.has_changed(chunk["id"], chunk["text"]):
                embedding = self.embedder.encode(chunk["text"])
                await self.vector_store.upsert(
                    id=chunk["id"],
                    vector=embedding,
                    metadata=chunk["metadata"],
                )
                await self.hash_tracker.update_hash(chunk["id"], chunk["text"])
                stats["new" if chunk["id"] not in existing_chunk_ids else "updated"] += 1
            else:
                stats["unchanged"] += 1

        return stats
```

## Webhook-Driven Sync vs Polling

### Webhook-Driven Sync

Sources push notifications when content changes. The sync system processes changes in near-real-time:

```typescript
import Fastify from "fastify";

const app = Fastify();

// GitHub webhook: triggered on push to docs repo
app.post("/v1/sync/webhooks/github", async (request, reply) => {
  const payload = request.body as GitHubWebhookPayload;

  // Verify webhook signature
  const signature = request.headers["x-hub-signature-256"];
  if (!verifyGitHubSignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET!)) {
    return reply.code(401).send({ error: "Invalid signature" });
  }

  // Extract changed files
  const changedFiles = payload.commits.flatMap(c => [
    ...c.added,
    ...c.modified,
  ]).filter(f => f.endsWith(".md"));

  const deletedFiles = payload.commits.flatMap(c => c.removed)
    .filter(f => f.endsWith(".md"));

  // Queue sync job
  await prisma.jobs.create({
    data: {
      type: "kb_sync",
      payload: { changedFiles, deletedFiles, commitSha: payload.after },
      status: "queued",
    },
  });

  return reply.code(200).send({ status: "queued" });
});

// Notion webhook: triggered on page update
app.post("/v1/sync/webhooks/notion", async (request, reply) => {
  const payload = request.body as NotionWebhookPayload;

  if (payload.type === "page.updated" || payload.type === "page.created") {
    await prisma.jobs.create({
      data: {
        type: "kb_sync_notion",
        payload: { pageId: payload.page_id, action: payload.type },
        status: "queued",
      },
    });
  }

  return reply.code(200).send({ status: "queued" });
});
```

**Advantages:** Near-real-time updates, no wasted polling cycles, event-driven architecture.
**Disadvantages:** Requires webhook support from source systems, webhook delivery is not guaranteed (needs retry logic), complex setup per source.

### Polling-Based Sync

A scheduled worker periodically checks sources for changes:

```typescript
class PollingSyncWorker {
  private intervalMs: number;
  private sources: SyncSource[];

  async start(): Promise<void> {
    while (true) {
      for (const source of this.sources) {
        try {
          const checkpoint = await this.getCheckpoint(source.id);
          const changes = await source.detectChanges(checkpoint);

          if (changes.length > 0) {
            await this.processChanges(source, changes);
            await this.updateCheckpoint(source.id, changes);
          }
        } catch (err) {
          console.error(`Sync error for ${source.id}:`, err);
        }
      }

      await sleep(this.intervalMs);
    }
  }
}

// Configuration
const syncSources: SyncSource[] = [
  {
    id: "github-docs",
    type: "git",
    pollIntervalMs: 60_000,      // Check every minute
    config: { repo: "atlasux/docs", branch: "main" },
  },
  {
    id: "notion-wiki",
    type: "notion",
    pollIntervalMs: 300_000,     // Check every 5 minutes
    config: { databaseId: "abc123" },
  },
  {
    id: "confluence-internal",
    type: "confluence",
    pollIntervalMs: 600_000,     // Check every 10 minutes
    config: { spaceKey: "ATLAS" },
  },
];
```

**Advantages:** Simple implementation, works with any source (no webhook support required), predictable load.
**Disadvantages:** Delay between change and sync (up to poll interval), wasted cycles when nothing changes.

### Comparison

| Factor | Webhook-Driven | Polling |
|--------|---------------|---------|
| Latency | Seconds | Minutes |
| Wasted work | None | Polling when unchanged |
| Setup complexity | High (per source) | Low |
| Reliability | Needs DLQ/retry | Inherently retry-safe |
| Source requirements | Must support webhooks | Any readable source |

**Recommendation:** Use webhooks for primary sources (git, CMS) and polling as a fallback and for sources without webhook support.

## Multi-Source Aggregation

### Source Registry

A production knowledge base aggregates content from multiple sources. A source registry tracks each source's configuration, sync state, and priority:

```typescript
interface KBSource {
  id: string;
  name: string;
  type: "git" | "notion" | "confluence" | "slack" | "email" | "api";
  priority: number;          // Higher priority wins in conflicts
  tier: 1 | 2 | 3;          // Default tier for content from this source
  syncMethod: "webhook" | "polling";
  config: Record<string, unknown>;
  lastSyncedAt: Date;
  status: "active" | "paused" | "error";
}

const sources: KBSource[] = [
  {
    id: "product-docs",
    name: "Product Documentation (GitHub)",
    type: "git",
    priority: 10,
    tier: 1,
    syncMethod: "webhook",
    config: { repo: "atlasux/docs", branch: "main", path: "docs/" },
    lastSyncedAt: new Date(),
    status: "active",
  },
  {
    id: "support-wiki",
    name: "Support Wiki (Notion)",
    type: "notion",
    priority: 8,
    tier: 1,
    syncMethod: "webhook",
    config: { databaseId: "notion-db-id" },
    lastSyncedAt: new Date(),
    status: "active",
  },
  {
    id: "slack-discussions",
    name: "Slack Technical Discussions",
    type: "slack",
    priority: 3,
    tier: 3,
    syncMethod: "polling",
    config: { channels: ["#engineering", "#product"], minReactions: 3 },
    lastSyncedAt: new Date(),
    status: "active",
  },
];
```

### Deduplication Across Sources

The same information may appear in multiple sources. A product feature described in the docs, discussed in Slack, and referenced in Notion should not appear three times in the KB:

```python
class CrossSourceDeduplicator:
    def __init__(self, embedder, threshold: float = 0.92):
        self.embedder = embedder
        self.threshold = threshold

    async def check_duplicate(self, new_chunk: dict, existing_chunks: list[dict]) -> dict:
        """Check if a new chunk duplicates existing content."""
        new_embedding = self.embedder.encode(new_chunk["text"])

        for existing in existing_chunks:
            similarity = cosine_similarity(new_embedding, existing["embedding"])

            if similarity >= self.threshold:
                # Duplicate found — keep the higher-priority source
                if new_chunk["source_priority"] > existing["source_priority"]:
                    return {"action": "replace", "replace_id": existing["id"]}
                else:
                    return {"action": "skip", "duplicate_of": existing["id"]}

        return {"action": "insert"}
```

## Conflict Resolution When Sources Disagree

### Detection

Conflicts arise when two sources provide contradictory information about the same topic. Detection requires tracking which chunks cover which topics:

```python
class ConflictDetector:
    async def detect_conflicts(self, topic: str) -> list[dict]:
        """Find chunks from different sources that may contradict on a topic."""
        # Retrieve all chunks related to the topic
        chunks = await self.vector_store.query(
            query_text=topic,
            top_k=20,
        )

        # Group by source
        by_source = {}
        for chunk in chunks:
            source = chunk["metadata"]["source"]
            by_source.setdefault(source, []).append(chunk)

        # Check for contradictions using LLM
        conflicts = []
        sources = list(by_source.keys())
        for i in range(len(sources)):
            for j in range(i + 1, len(sources)):
                contradiction = await self.check_contradiction(
                    by_source[sources[i]],
                    by_source[sources[j]],
                )
                if contradiction["is_contradictory"]:
                    conflicts.append({
                        "source_a": sources[i],
                        "source_b": sources[j],
                        "topic": topic,
                        "description": contradiction["description"],
                    })

        return conflicts
```

### Resolution Strategies

| Strategy | Rule | Best For |
|----------|------|----------|
| Source priority | Higher-priority source always wins | Clear authority hierarchy |
| Recency | Most recently updated source wins | Rapidly changing content |
| Majority vote | When 3+ sources exist, majority wins | Community knowledge |
| Manual review | Flag for human review | High-stakes content |
| Merge | Combine non-contradictory parts from both | Complementary sources |

## Atlas UX Pattern: KB Eval Worker + Auto-Heal Pipeline

Atlas UX implements automated syncing through a KB eval and auto-heal pipeline:

1. **KB eval worker** runs periodically against a golden dataset of 409 test queries
2. **Health scoring** measures retrieval quality: hit rate, MRR, NDCG
3. **Gap detection** identifies queries that fail to retrieve relevant chunks
4. **Auto-heal actions** are classified by risk:
   - **Safe (auto-execute):** Re-embed stale chunks, relink broken references, reclassify miscategorized content
   - **Risky (human approval):** Merge duplicate articles, delete outdated content, modify tier assignments
5. **The reactive trigger** watches for incoming KB changes (new articles, edits) and schedules re-evaluation of affected queries

This architecture ensures the knowledge base self-corrects without human intervention for safe operations while escalating risky changes through the decision memo approval workflow.

## Conclusion

Automated knowledge base syncing is the difference between a knowledge base that degrades over time and one that improves. Git-based workflows provide version control for documentation. Database change detection enables dynamic content synchronization. Webhook-driven pipelines minimize latency while polling provides reliable fallback coverage. Multi-source aggregation with deduplication and conflict resolution ensures that agents receive consistent, authoritative knowledge regardless of which upstream source changed. The key architectural decision is not whether to automate syncing but how to handle conflicts when sources disagree — and for that, a clear source priority hierarchy combined with automated conflict detection provides the most practical production pattern.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Git-logo.svg/400px-Git-logo.svg.png — Git logo representing version-controlled knowledge base management
2. https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Pipeline_software.svg/400px-Pipeline_software.svg.png — Software pipeline architecture showing the sync pipeline stages
3. https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Merge_sort_algorithm_diagram.svg/400px-Merge_sort_algorithm_diagram.svg.png — Merge diagram illustrating multi-source knowledge aggregation
4. https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Webhook_vs_Polling.svg/400px-Webhook_vs_Polling.svg.png — Webhook vs polling comparison for change notification patterns
5. https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Event_store.svg/400px-Event_store.svg.png — Event store pattern for tracking sync history and change events

## Videos

1. https://www.youtube.com/watch?v=bjb_EMsTDKI — "Building Production RAG Pipelines" by LlamaIndex covering document syncing and incremental indexing strategies
2. https://www.youtube.com/watch?v=TRjq7t2Ms5I — "RAG Data Ingestion at Scale" by Pinecone demonstrating automated ingestion and sync pipelines

## References

1. LlamaIndex Documentation. "Ingestion Pipeline." https://docs.llamaindex.ai/en/stable/module_guides/loading/ingestion_pipeline/
2. Pinecone Documentation. "Upsert and Update Operations." https://docs.pinecone.io/guides/data/upsert-data
3. GitHub Documentation. "Webhooks." https://docs.github.com/en/webhooks
4. Notion API Documentation. "Working with Databases." https://developers.notion.com/docs/working-with-databases
