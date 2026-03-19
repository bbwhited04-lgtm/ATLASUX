# KB Eval + Self-Healing System — Design Spec

**Date:** 2026-03-19
**Status:** Approved
**Author:** Claude (brainstorming with Billy)
**Sub-project:** 2+3 of 4 (Enterprise KB Infrastructure — Eval Loops + Self-Healing KB merged)

---

## 1. Problem Statement

Atlas UX has a sophisticated three-tier KB with 2,652 documents across public/internal/tenant namespaces, but zero evaluation infrastructure. There's no way to know if:
- RAG retrieval is returning the right documents
- KB content is accurate, current, and non-contradictory
- Documents are properly interlinked or orphaned
- Agent answers are faithful to KB context
- The KB is degrading over time due to drift, staleness, or corruption

The existing `llmEvalBenchmark.ts` benchmarks LLM provider quality but doesn't evaluate KB retrieval, content quality, or heal problems when found.

## 2. Goals

1. **Detect** KB problems across 6 dimensions: orphans, stale docs, retrieval regressions, misleading content, coverage gaps, duplicates
2. **Score** each issue with risk tier + confidence + cost estimate
3. **Heal** automatically when safe (low-risk, high-confidence, low-cost) or queue decision memos when not
4. **React** in real-time when agents hit KB errors, not just on cron schedule
5. **Report** via Slack + Obsidian vault + DB for trending
6. **Feed** the agent self-evolution system with KB health signals

## 3. Non-Goals

- Frontend eval dashboard (Slack + Obsidian reports are sufficient for now)
- Multi-tenant eval (eval runs for platform owner tenant only initially)
- Continuous ingestion pipelines (Sub-project 4, separate)
- Changing the embedding model or Pinecone index configuration

## 4. Architecture

### 4.1 Three-Phase Loop

**Phase 1 — Detect:** Scan KB for problems across 6 dimensions:
- **Orphan docs**: zero related links in vector space
- **Stale docs**: published but never retrieved by any golden query
- **Retrieval regressions**: golden queries returning wrong/missing docs
- **Misleading content**: retrieved docs contradict expected answers
- **Coverage gaps**: categories/tiers with no golden query representation
- **Duplicate/redundant chunks**: cosine similarity > 0.95 within same namespace

**Phase 2 — Evaluate:** Score each issue:
- Risk tier (0-3, mirrors existing `decision_memo` system)
- Confidence score (0-1, how certain the diagnosis is)
- Estimated healing cost (OpenAI embedding tokens + Pinecone upsert ops)
- Impact assessment (how many golden queries / agents affected)

**Phase 3 — Act:** Based on risk + confidence matrix:
- **Auto-heal** (risk 0-1, confidence >= `CONFIDENCE_AUTO_THRESHOLD`): re-link orphans, re-embed stale chunks, fix categories. Execute immediately.
- **Decision memo** (risk 0-1, confidence < threshold OR risk 2+): queue for approval
- **Destructive/costly restructures** (any risk, cost > `KB_HEAL_COST_CEILING`): always create decision memo + auto-upsert issue summary to Atlas's attention queue

### 4.2 Cost Tracking

Every healing action logs its cost:
- OpenAI embedding tokens consumed
- Pinecone upsert/query operation count
- Wall-clock time

The eval report includes cost-benefit analysis: "fixing these 12 orphans costs ~$0.03 in embeddings and improved retrieval for 8 golden queries."

### 4.3 Trigger Modes

| Mode | When | Rate Limit |
|------|------|------------|
| **Cron** | Daily at 2 AM EST (configurable via `KB_EVAL_CRON`) | 1 per day |
| **Reactive** | Brain/engine hits KB error in real-time | `KB_HEAL_MAX_PER_HOUR` (default 10) |
| **Manual** | CLI script or future API endpoint | None |

## 5. Golden Dataset

### 5.1 Auto-Generation Pipeline

1. LLM scans all KB docs grouped by tier/category
2. Generates 3-5 canonical queries per document (factual, conceptual, cross-reference)
3. Each query gets: expected document IDs, expected answer snippet, query source, difficulty tier
4. Stored in `kb_eval_queries` with status `candidate`
5. User reviews → status becomes `approved` (golden)

### 5.2 Live Feedback Loop

- Production queries where user signals dissatisfaction → auto-create eval candidate
- Bad retrievals become golden queries with "this was wrong" annotations
- Over time the golden set grows organically from real usage

### 5.3 Coverage Targets

- At least 5 golden queries per category
- At least 3 per tier (public, internal, tenant)
- At least 2 per query source (voice, chat, engine, admin)
- Coverage gaps flagged in the eval report

### 5.4 Storage

Golden dataset lives in DB (queryable, versionable) and syncs to Obsidian vault as markdown at `projects/atlasux/eval/golden/` for easy review.

## 6. Reactive Self-Healing (Brain Error Trigger)

### 6.1 Trigger Points

| Location | Error Condition | Error Type |
|----------|----------------|------------|
| `getKbContext()` | Zero results for a query that should have hits | coverage_gap |
| `queryTiered()` | All results below `minScore` threshold | embedding_drift |
| Agent tool call | KB doc referenced in playbook is missing/archived | broken_reference |
| Confidence check | Low-confidence response where KB was primary source | misleading_content |
| `orgMemory.recall()` | Duplicates or contradictory memories | memory_corruption |

### 6.2 Reactive Flow

1. Engine/brain detects KB error condition
2. Emits `kb:heal` event: `{ trigger, query, agentId, tenantId, errorType, context }`
3. Heal dispatcher evaluates risk + confidence immediately
4. Low-risk + high-confidence → auto-heal inline, log to eval results
5. Anything else → decision memo + Atlas queue + Slack alert

### 6.3 Safety Guardrails

- Rate-limited: `KB_HEAL_MAX_PER_HOUR` (default 10) prevents cascade failures
- Cost ceiling: `KB_HEAL_COST_CEILING` (default $0.50) — exceeding queues decision memo regardless
- Escalation: same error repeated after first auto-heal → escalates to decision memo
- All heals logged to `kb_heal_actions` audit trail

## 7. Database Schema

### 7.1 New Tables

```prisma
model KbEvalQuery {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId            String    @map("tenant_id") @db.Uuid
  query               String
  querySource         String    @map("query_source")  // voice, chat, engine, admin
  expectedDocumentIds String[]  @map("expected_document_ids")
  expectedAnswer      String?   @map("expected_answer")
  difficulty          String    @default("medium")  // easy, medium, hard
  category            String?
  tier                String?   // public, internal, tenant
  status              String    @default("candidate")  // candidate, approved, retired
  createdAt           DateTime  @default(now()) @map("created_at")
  approvedAt          DateTime? @map("approved_at")
  retiredAt           DateTime? @map("retired_at")
  results             KbEvalResult[]

  tenant              tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId, status])
  @@index([category])
  @@map("kb_eval_queries")
}

model KbEvalRun {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId            String    @map("tenant_id") @db.Uuid
  trigger             String    // cron, reactive, manual
  healthScore         Int       @map("health_score")  // 0-100
  queriesRun          Int       @map("queries_run")
  issuesFound         Int       @map("issues_found")
  autoHealed          Int       @map("auto_healed")
  decisionMemosCreated Int      @map("decision_memos_created")
  costUsd             Float     @map("cost_usd")
  durationMs          Int       @map("duration_ms")
  report              Json      // full breakdown
  createdAt           DateTime  @default(now()) @map("created_at")
  results             KbEvalResult[]
  healActions         KbHealAction[]

  tenant              tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId, createdAt])
  @@map("kb_eval_runs")
}

model KbEvalResult {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  runId               String    @map("run_id") @db.Uuid
  evalQueryId         String    @map("eval_query_id") @db.Uuid
  retrievedDocumentIds String[] @map("retrieved_document_ids")
  answer              String?
  scores              Json      // { recall, precision, mrr, faithfulness, relevance }
  latencyMs           Int       @map("latency_ms")
  model               String?
  createdAt           DateTime  @default(now()) @map("created_at")

  run                 KbEvalRun   @relation(fields: [runId], references: [id])
  query               KbEvalQuery @relation(fields: [evalQueryId], references: [id])

  @@index([runId])
  @@index([evalQueryId])
  @@map("kb_eval_results")
}

model KbHealAction {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  runId               String?   @map("run_id") @db.Uuid
  tenantId            String    @map("tenant_id") @db.Uuid
  actionType          String    @map("action_type")  // relink, re-embed, reclassify, archive, merge
  targetDocumentId    String?   @map("target_document_id") @db.Uuid
  targetChunkId       String?   @map("target_chunk_id") @db.Uuid
  riskTier            Int       @map("risk_tier")  // 0-3
  confidenceScore     Float     @map("confidence_score")  // 0-1
  estimatedCostUsd    Float     @map("estimated_cost_usd")
  actualCostUsd       Float?    @map("actual_cost_usd")
  status              String    @default("pending")  // auto-executed, pending-approval, approved, rejected
  decisionMemoId      String?   @map("decision_memo_id") @db.Uuid
  trigger             String    // cron, reactive, manual
  description         String?
  createdAt           DateTime  @default(now()) @map("created_at")
  executedAt          DateTime? @map("executed_at")

  run                 KbEvalRun? @relation(fields: [runId], references: [id])
  tenant              tenant     @relation(fields: [tenantId], references: [id])

  @@index([tenantId, status])
  @@index([runId])
  @@map("kb_heal_actions")
}
```

## 8. Scheduled Worker

### 8.1 Worker: `workers/kbEvalWorker.ts`

Runs on cron (default: daily 2 AM EST via `KB_EVAL_CRON`).

**Eval run flow:**
1. Load golden dataset (approved queries only)
2. Run each query through `queryTiered()` — capture retrieved docs, scores, latency
3. Compare retrieved docs against expected docs → compute recall@K, precision@K, MRR
4. Run answer quality check via judge LLM (reuse RAGAS scoring pattern from `llmEvalBenchmark.ts`)
5. Scan for orphans: query each namespace, find docs with zero inbound similarity links
6. Scan for duplicates: pairwise cosine similarity within namespace, flag > 0.95
7. Cost analysis: tally estimated healing costs for all detected issues
8. Score each issue (risk tier + confidence)
9. Execute auto-heals, create decision memos, upsert attention items to Atlas
10. Write results to DB tables
11. Push Slack report
12. Sync report to Obsidian vault

### 8.2 Slack Report Format

```
KB Health Report — 2026-03-20
Score: 87/100 (↑3 from yesterday)

Retrieval: 94% recall@5 across 120 golden queries
Orphans: 2 found, 2 auto-healed (re-linked)
Stale: 4 docs never retrieved (flagged for review)
Duplicates: 1 pair found (decision memo created)
Misleading: 0
Coverage gaps: hle-linguistics (0 golden queries)

Auto-healed: 3 actions ($0.02)
Awaiting approval: 2 decision memos
Cost this run: $0.18 (embeddings) + 47 Pinecone ops
```

### 8.3 Obsidian Sync

After each run, push the report as a dated note to `projects/atlasux/eval/reports/YYYY-MM-DD-kb-health.md` via the Local REST API.

## 9. Environment Variables

```
KB_EVAL_CRON=0 2 * * *                    # Daily at 2 AM EST
KB_EVAL_ENABLED=true                       # Master switch
KB_HEAL_MAX_PER_HOUR=10                    # Rate limit for reactive heals
KB_HEAL_COST_CEILING=0.50                  # Max cost before requiring approval ($)
KB_HEALTH_ALERT_THRESHOLD=70               # Below this, Atlas escalates to owner
KB_EVAL_JUDGE_MODEL=gpt-4o-mini            # LLM for quality scoring
KB_EVAL_GOLDEN_MIN_COVERAGE=5              # Min golden queries per category
```

## 10. Agent Evolution Integration

### 10.1 Feedback to Evolution System

- Agent consistently triggering KB errors → agent's playbook flagged as outdated
- Golden query tied to agent's domain regresses → agent's `skill.md` queued for re-evaluation
- Reactive heal fires from brain error → triggering agent's performance score adjusts downward

### 10.2 Atlas as Orchestrator

- Atlas receives all decision memos from eval loop
- Atlas sees cost-benefit analysis, can prioritize which heals to approve
- Atlas can trigger a full re-eval after approving a batch of heals to verify improvement
- Health score below `KB_HEALTH_ALERT_THRESHOLD` → Atlas escalates to Billy via Slack

### 10.3 Self-Healing Flywheel

```
Agent hits error → KB eval detects → auto-heal or decision memo
→ heal executes → re-eval confirms fix → agent performance improves
→ evolution system notes improvement → adjusts agent behavior
→ fewer errors → healthier KB → better retrievals → smarter agents
```

## 11. File Structure

```
backend/src/
├── core/kb/
│   ├── kbEval.ts              — Eval engine (detect, score, report)
│   ├── kbHealer.ts            — Heal dispatcher (auto-heal + decision memo creation)
│   ├── kbGoldenDataset.ts     — Golden query generation + management
│   └── kbHealthScorer.ts      — Composite health score calculator
├── workers/
│   └── kbEvalWorker.ts        — Cron-scheduled eval loop
├── scripts/
│   ├── generateGoldenQueries.ts  — Bootstrap golden dataset from existing KB
│   └── runKbEval.ts              — Manual eval CLI
└── lib/
    └── kbHealEmitter.ts       — Event emitter for reactive heal triggers
```

## 12. Rollback Plan

- `KB_EVAL_ENABLED=false` disables the entire system
- All auto-heals are logged with before/after state in `kb_heal_actions`
- Heal actions that modify Pinecone can be reversed by re-running `reindexKb.ts`
- Decision memos provide manual review checkpoint for anything risky

## 13. Success Criteria

- Golden dataset bootstrapped with 100+ approved queries across all tiers/categories
- Nightly eval runs with < 60s execution time
- Health score trending upward over first 2 weeks
- Zero orphan docs maintained (auto-heal catches any new ones)
- Reactive heals resolve brain errors within 5 seconds
- All healing actions auditable via `kb_heal_actions` table
- Slack reports delivered daily, Obsidian vault synced
