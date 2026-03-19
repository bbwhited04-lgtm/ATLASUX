# KB Eval + Self-Healing System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-healing KB system that detects problems (orphans, stale docs, retrieval regressions, misleading content), auto-heals low-risk issues, queues decision memos for high-risk ones, and reports via Slack + Obsidian.

**Architecture:** Three-phase eval loop (detect → evaluate → act) triggered by cron and reactive brain errors. Golden dataset auto-generated from existing KB docs, RAGAS-style scoring via judge LLM, cost-tracked healing with guardrails.

**Tech Stack:** Fastify 5, Prisma, Pinecone (tiered namespaces), OpenAI (embeddings + judge), Slack API, Obsidian Local REST API

---

## File Structure

```
backend/src/
├── core/kb/
│   ├── kbEval.ts              — Eval engine (detect orphans/stale/regressions/duplicates, score issues)
│   ├── kbHealer.ts            — Heal dispatcher (execute auto-heals, create decision memos)
│   ├── kbGoldenDataset.ts     — Golden query generation + CRUD
│   └── kbHealthScorer.ts      — Composite health score calculator (0-100)
├── workers/
│   └── kbEvalWorker.ts        — Cron-scheduled eval loop + Slack/Obsidian reporting
├── scripts/
│   └── generateGoldenQueries.ts  — Bootstrap golden dataset CLI
├── lib/
│   └── kbHealEmitter.ts       — EventEmitter for reactive heal triggers
└── prisma/
    └── schema.prisma          — 4 new models (KbEvalQuery, KbEvalRun, KbEvalResult, KbHealAction)
```

---

## Chunk 1: Schema + Foundation

### Task 1: Prisma Schema — Eval Tables

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1:** Add KbEvalQuery, KbEvalRun, KbEvalResult, KbHealAction models to schema.prisma with all fields from spec section 7.1. Add relations to tenant model.
- [ ] **Step 2:** Run `npx prisma db push` to sync schema to prod DB
- [ ] **Step 3:** Run `npx prisma generate` (or `npx tsc` if DLL locked on Windows)
- [ ] **Step 4:** Commit

### Task 2: Env Vars

**Files:**
- Modify: `backend/src/env.ts`

- [ ] **Step 1:** Add 7 new env vars: KB_EVAL_CRON, KB_EVAL_ENABLED, KB_HEAL_MAX_PER_HOUR, KB_HEAL_COST_CEILING, KB_HEALTH_ALERT_THRESHOLD, KB_EVAL_JUDGE_MODEL, KB_EVAL_GOLDEN_MIN_COVERAGE
- [ ] **Step 2:** Build to verify
- [ ] **Step 3:** Commit

### Task 3: Heal Event Emitter

**Files:**
- Create: `backend/src/lib/kbHealEmitter.ts`

- [ ] **Step 1:** Create typed EventEmitter for `kb:heal` events with payload `{ trigger, query, agentId, tenantId, errorType, context }`
- [ ] **Step 2:** Export `emitHealEvent()` and `onHealEvent()` functions
- [ ] **Step 3:** Build to verify
- [ ] **Step 4:** Commit

---

## Chunk 2: Golden Dataset

### Task 4: Golden Dataset Manager

**Files:**
- Create: `backend/src/core/kb/kbGoldenDataset.ts`

- [ ] **Step 1:** Create functions: `generateCandidateQueries(tenantId)` — loads all KB docs, groups by category/tier, calls LLM to generate 3-5 queries per doc
- [ ] **Step 2:** Create `approveQuery(id)`, `retireQuery(id)`, `getApprovedQueries(tenantId)` CRUD functions
- [ ] **Step 3:** Create `checkCoverage(tenantId)` — returns categories/tiers with fewer than min golden queries
- [ ] **Step 4:** Build to verify
- [ ] **Step 5:** Commit

### Task 5: Golden Dataset Bootstrap Script

**Files:**
- Create: `backend/src/scripts/generateGoldenQueries.ts`

- [ ] **Step 1:** CLI script that calls `generateCandidateQueries()`, reports count per category/tier, auto-approves if `--auto-approve` flag set
- [ ] **Step 2:** Add `"kb:generate-golden": "npx tsx src/scripts/generateGoldenQueries.ts"` to package.json
- [ ] **Step 3:** Build to verify
- [ ] **Step 4:** Commit

---

## Chunk 3: Eval Engine

### Task 6: Health Scorer

**Files:**
- Create: `backend/src/core/kb/kbHealthScorer.ts`

- [ ] **Step 1:** Create `computeHealthScore()` that takes eval metrics (retrieval recall, orphan count, stale count, duplicate count, coverage gaps) and returns 0-100 composite score
- [ ] **Step 2:** Weights: retrieval accuracy 40%, orphan-free 20%, freshness 15%, no-duplicates 10%, coverage 15%
- [ ] **Step 3:** Build to verify
- [ ] **Step 4:** Commit

### Task 7: Eval Engine — Detection

**Files:**
- Create: `backend/src/core/kb/kbEval.ts`

- [ ] **Step 1:** Create `detectOrphans(tenantId)` — query each namespace, find docs with zero similarity matches above 0.3
- [ ] **Step 2:** Create `detectStaleDocs(tenantId)` — find published docs not in any golden query's retrievedDocumentIds from last 7 days of eval results
- [ ] **Step 3:** Create `detectRetrievalRegressions(tenantId, goldenQueries)` — run each golden query through queryTiered, compare to expectedDocumentIds, compute recall@5/precision@5/MRR
- [ ] **Step 4:** Create `detectDuplicates(tenantId)` — for each namespace, sample chunks and flag pairs with cosine > 0.95
- [ ] **Step 5:** Create `detectMisleading(tenantId, goldenQueries)` — run LLM judge on retrieved docs vs expected answers, flag contradictions
- [ ] **Step 6:** Create `runFullEval(tenantId)` — orchestrates all detections, returns typed issue list with risk/confidence/cost
- [ ] **Step 7:** Build to verify
- [ ] **Step 8:** Commit

---

## Chunk 4: Healer + Worker

### Task 8: Heal Dispatcher

**Files:**
- Create: `backend/src/core/kb/kbHealer.ts`

- [ ] **Step 1:** Create `healOrphan(doc)` — re-embed with context headers, link to nearest category peers (reuse reindexKb logic)
- [ ] **Step 2:** Create `healStaleChunk(doc)` — re-embed chunk with fresh context header
- [ ] **Step 3:** Create `reclassifyDoc(doc, newCategory)` — update category + re-embed
- [ ] **Step 4:** Create `dispatchHeal(issue)` — risk/confidence matrix: auto-heal vs decision memo. Cost gate check. Rate limit check.
- [ ] **Step 5:** Create `handleReactiveHeal(event)` — listener for kbHealEmitter events, calls dispatchHeal with rate limiting
- [ ] **Step 6:** Build to verify
- [ ] **Step 7:** Commit

### Task 9: Eval Worker

**Files:**
- Create: `backend/src/workers/kbEvalWorker.ts`

- [ ] **Step 1:** Worker with cron schedule (parse KB_EVAL_CRON). Main loop: sleep until next cron tick, run eval, report, heal.
- [ ] **Step 2:** Eval run flow: load golden queries → runFullEval → dispatchHeal for each issue → compute health score → write KbEvalRun + KbEvalResults to DB
- [ ] **Step 3:** Slack report: format health score, retrieval stats, orphans, stale, duplicates, auto-healed count, decision memos count, cost
- [ ] **Step 4:** Obsidian sync: push report as dated markdown to vault via REST API
- [ ] **Step 5:** Add `"worker:kb-eval": "node dist/workers/kbEvalWorker.js"` to package.json
- [ ] **Step 6:** Build to verify
- [ ] **Step 7:** Commit

---

## Chunk 5: Reactive Triggers + Integration

### Task 10: Wire Reactive Heal Triggers

**Files:**
- Modify: `backend/src/core/kb/getKbContext.ts`
- Modify: `backend/src/core/agent/orgMemory.ts`

- [ ] **Step 1:** In getKbContext — after queryTiered returns, if zero results and query length > 10 chars, emit `kb:heal` event with errorType `coverage_gap`
- [ ] **Step 2:** In getKbContext — if all results below minScore, emit `kb:heal` event with errorType `embedding_drift`
- [ ] **Step 3:** In orgMemory.recall — if duplicate memories detected (>0.95 similarity between top results), emit `kb:heal` event with errorType `memory_corruption`
- [ ] **Step 4:** Register reactive heal listener on worker startup
- [ ] **Step 5:** Build to verify
- [ ] **Step 6:** Commit

### Task 11: Build, Deploy, Run Golden Generation

- [ ] **Step 1:** Full build: `cd backend && npx tsc -p tsconfig.json`
- [ ] **Step 2:** SCP all new/modified files to prod
- [ ] **Step 3:** Push schema: `npx prisma db push`
- [ ] **Step 4:** Run golden query generation: `node dist/scripts/generateGoldenQueries.js --auto-approve`
- [ ] **Step 5:** Start eval worker: `pm2 start dist/workers/kbEvalWorker.js --name kb-eval-worker && pm2 save`
- [ ] **Step 6:** Trigger manual eval run to verify everything works
- [ ] **Step 7:** Verify Slack report arrives
- [ ] **Step 8:** Verify Obsidian report synced
- [ ] **Step 9:** Commit final package.json changes
- [ ] **Step 10:** Write KDR
