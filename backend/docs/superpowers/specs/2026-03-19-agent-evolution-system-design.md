# Agent Self-Evolution System — Design Spec

**Date:** 2026-03-19
**Version:** v1.1 (post-review fixes)
**Status:** Approved
**Author:** Billy + Claude
**Scope:** All named agents in `Agents/`

---

## 1. Problem

Atlas UX agents have static configuration files (SOUL.md, SKILL.md, POLICY.md, MEMORY.md). When an agent learns something valuable — a better prompting strategy, a new tool, a more effective communication style — there's no mechanism for the agent to propose, test, and adopt that improvement. Changes require manual editing by Billy with no audit trail, no eval testing, and no rollback capability.

Additionally, when Billy directs behavioral preferences (e.g., "use anime style on Instagram"), there's no persistent file to store these preferences or track when they were set.

## 2. Solution

Add two new files to every agent's directory:

- **`behavior.md`** — User-directed persistent preferences that override defaults
- **`evolution.md`** — Versioned audit trail of all changes to any agent file

Agents propose self-improvements via `[EVOLUTION_APPROVAL]` decision memos with tiered eval testing. Approved changes run a trial period measured by task completions (not clock time). If performance drops below baseline during trial, the system auto-reverts and notifies Billy.

## 3. File Structure

Each agent folder gains two files:

```
Agents/executives/Atlas/
  SOUL.md          # identity — highest approval tier
  SKILL.md         # capabilities and tools
  POLICY.md        # rules and constraints
  MEMORY.md        # context (existing)
  behavior.md      # user-directed preferences (NEW)
  evolution.md     # versioned change log (NEW)
```

### 3.1 behavior.md

Stores user-directed behavioral configuration. Not self-learned — only written when Billy (or an authorized human) directs a change. Examples:

```markdown
# Behavior — Venny

## Response Style
- Use bullet points, not paragraphs
- Keep responses under 3 sentences unless asked for detail

## Image Generation Defaults
- Instagram: always use anime/illustration style
- LinkedIn: professional photorealistic style
- Twitter/X: bold graphic design with text overlay

## Posting Preferences
- Always include a CTA in social posts
- Never post between 11pm-6am EST
```

No approval memo required for behavior.md changes — they come from the human owner. However, all changes are logged in evolution.md with `[USER_DIRECTED]` tag for audit trail.

### 3.2 evolution.md Format

Append-only log (newest entries first). Each entry is a version with:

```markdown
# Evolution Log — {Agent Name}

## v5 — 2026-03-19 [APPROVED]
- **File:** SKILL.md
- **Change:** Added Ideogram API to tool registry
- **Diff:** +| Ideogram API | Generate text-heavy images via ideogram.ai |
- **Memo:** DM-00347 [EVOLUTION_APPROVAL]
- **Eval:** 8/10 test prompts improved (logo gen speed +40%), 0 regressions
- **Trial:** 10 tasks, score baseline 7.2 → post-change 8.1
- **Status:** PERMANENT

## v4 — 2026-03-17 [REVERTED]
- **File:** POLICY.md
- **Change:** Removed mandatory citation check on research briefs
- **Diff:** -All research must include 3+ citations per claim
- **Memo:** DM-00331 [EVOLUTION_APPROVAL]
- **Eval:** 5/10 test cases faster, but accuracy dropped 22%
- **Trial:** 10 tasks, score baseline 8.4 → post-change 6.5
- **Reverted at:** 2026-03-18T14:32Z — auto-revert, eval score below baseline
- **Status:** REVERTED → v3 restored

## v3 — 2026-03-15 [USER_DIRECTED]
- **File:** behavior.md
- **Change:** Switch response style from formal paragraphs to bullet points
- **Source:** Billy directive (no approval required)
- **Status:** ACTIVE

## v2 — 2026-03-10 [REJECTED]
- **File:** SOUL.md
- **Change:** Proposed shift from formal to casual tone
- **Memo:** DM-00298 [EVOLUTION_APPROVAL]
- **Eval:** 12/20 test cases preferred casual, but 6/20 lost professionalism
- **Rejection reason:** Net regression on trust metrics
- **Status:** REJECTED

## v1 — 2026-03-01 [INITIAL]
- **Status:** Agent initialized with base configuration
```

### 3.3 Version Statuses

| Status | Meaning |
|--------|---------|
| `INITIAL` | Agent's starting state |
| `APPROVED` | Memo approved, change applied, entering trial |
| `TRIAL` | Currently in trial period (N tasks remaining) |
| `PERMANENT` | Trial passed, change is permanent |
| `REVERTED` | Trial failed, auto-reverted to previous version |
| `REJECTED` | Memo rejected by Billy, change never applied |
| `REJECTED_SELF` | Agent's own eval showed regression, never proposed |
| `USER_DIRECTED` | Billy directed the change, no approval needed |
| `ACTIVE` | User-directed change currently in effect |
| `MANUAL_REVERT` | Billy manually reverted via API |
| `PAUSED` | Trial halted for investigation (not reverted) |
| `QUEUED` | Proposal waiting for another trial to complete on same agent |

## 4. Decision Memo for Evolution

### 4.1 Memo Structure

Agent creates a `DecisionMemo` with title prefix `[EVOLUTION_APPROVAL]`:

```
title:            "[EVOLUTION_APPROVAL] Add Ideogram API to Venny SKILL.md"
agent:            "Venny"
rationale:        "Ideogram produces superior text-in-image output for social
                   posts. Currently using DALL-E 3 for all text-overlay images —
                   Ideogram scores 9/10 vs DALL-E's 7/10 on typography benchmarks."
riskTier:         1
estimatedCostUsd: 0
billingType:      "none"
confidence:       0.85
expectedBenefit:  "40% improvement in text-overlay image quality for social posts"
requiresApproval: true
status:           "PROPOSED"
payload: {
  type:           "EVOLUTION",
  targetFile:     "SKILL.md",
  targetAgent:    "Venny",
  currentVersion: 4,
  proposedVersion: 5,
  diff:           "+| Ideogram API | Generate text-heavy images via ideogram.ai |",
  evalResults: {
    testCases:      10,
    improved:       8,
    regressed:      0,
    neutral:        2,
    baselineScore:  6.8,
    proposedScore:  8.9,
    winRate:        0.80,
    regressionRate: 0.00
  },
  trialTaskCount:   10,
  revertCondition:  "score drops below 6.8 baseline"
}
```

### 4.2 Required Justification

Every evolution memo MUST answer:

1. **What changes?** — Exact diff to the target file
2. **Why?** — How does this directly benefit Atlas UX (not the agent's ego)
3. **Cost impact?** — Any new API spend, compute cost, or resource usage
4. **Eval proof?** — Test results comparing current vs proposed behavior
5. **Revert plan?** — What baseline score triggers auto-revert

Memos without all five elements are auto-rejected by the system.

## 5. Risk Tiers and Eval Requirements

| Tier | File Type | Eval Size | Approval | Example |
|------|-----------|-----------|----------|---------|
| 0 | behavior.md (user-directed) | None | None — from Billy | "Use anime style on IG" |
| 1 | SKILL.md (add tool) | 5-10 test cases | Standard memo | Add Ideogram API |
| 2 | POLICY.md (add/modify rule) | 5-10 test cases | Standard memo | Add citation requirement |
| 3 | POLICY.md (remove/relax rule) | 20+ test cases | Standard memo + rationale | Remove spend check |
| 4 | SOUL.md (identity change) | 20+ test cases | Standard memo + Billy review | Change communication style |

### 5.1 Eval Process

1. Agent identifies improvement opportunity (from task performance, user feedback, or KB research)
2. Agent creates test prompt/task set sized by risk tier
3. Runs test set against **current** configuration → baseline scores
4. Runs test set against **proposed** configuration → candidate scores
5. Scores each test case on a 1-10 scale for task completion quality
6. Computes: win rate, regression rate, net score delta
7. **If net positive and regression rate < 20%** → creates `[EVOLUTION_APPROVAL]` memo
8. **If net negative or regression rate >= 20%** → logs in evolution.md as `REJECTED_SELF`, does not propose

### 5.2 Eval Scoring Criteria

Each test case scored on:

- **Task completion** (0-3): Did it accomplish the goal?
- **Quality** (0-3): How good was the output?
- **Efficiency** (0-2): Token usage, time, API calls
- **Safety** (0-2): Any policy violations, hallucinations, or harmful outputs?

Total: 0-10 per test case. Baseline and proposed scores are averaged across all test cases.

### 5.3 Eval Limitations

Self-eval scores (agent grading its own output) are **directional indicators, not absolute measures**. Known biases:

- LLMs tend to rate their own output higher than independent evaluators
- Agents may unconsciously optimize for eval-friendly outputs rather than real-world quality

Mitigations:
- Eval results are presented to Billy for human judgment — they are evidence, not verdicts
- The 20% regression gate is the only automated decision based on eval scores
- **Future (Phase 5):** Cross-agent eval where one agent evaluates another's output for independence

### 5.4 Concurrency Rules

**One active trial per agent at a time.** If Agent X has a SKILL.md evolution in TRIAL status:

- New proposals for ANY file type on Agent X are **queued** (status: `QUEUED`)
- Queued proposals are evaluated when the current trial completes (PERMANENT or REVERTED)
- If a queued proposal conflicts with the trial result (e.g., modifying the same file), it must be re-evaluated against the new baseline

This prevents compounding changes that make it impossible to attribute performance shifts to a specific evolution.

## 6. Trial Period and Auto-Revert

### 6.1 Trial by Task Completion

Trials are measured by completed tasks, not clock time. This ensures:
- Frequently-firing agents (social media team) get evaluated quickly
- Infrequent agents (legal counsel) aren't auto-reverted due to insufficient data

Default trial size: **10 task completions** post-evolution.

### 6.2 Trial Flow

```
Memo APPROVED
  → Change applied to target file
  → evolution.md entry: status = TRIAL, tasksRemaining = 10
  → Agent executes normally with new configuration
  → After each task: score task, decrement tasksRemaining
  → After 10 tasks: compute trialScore (average of 10 task scores)

  IF trialScore >= baselineScore:
    → evolution.md: status = PERMANENT
    → Log: "[EVOLUTION_CONFIRMED] v5 passed trial (8.1 vs 7.2 baseline)"

  IF trialScore < baselineScore:
    → Restore previous file version from diff
    → evolution.md: status = REVERTED
    → Create DecisionMemo: "[EVOLUTION_REVERTED] v5 failed trial"
    → Notify Billy via existing notification system
```

### 6.3 Manual Revert

Billy can revert any evolution at any time via API:

```
POST /v1/evolution/agents/:name/revert/:version
```

This restores the file to the state before that version's change, logs a new entry in evolution.md with status `MANUAL_REVERT`, and creates a notification.

## 7. Backend Implementation

### 7.1 New Service: `evolutionService.ts`

Location: `backend/src/services/evolutionService.ts`

Responsibilities:
- Read/write evolution.md files for any agent
- Parse evolution log entries
- Apply diffs to agent files (SOUL, SKILL, POLICY, behavior)
- Revert changes by reversing diffs
- Track active trials (agent name, version, tasks remaining, scores)
- Compute trial results and trigger auto-revert

Key functions:
```typescript
// Read agent's evolution history
getEvolutionHistory(agentName: string): EvolutionEntry[]

// Apply an approved evolution
applyEvolution(agentName: string, memo: DecisionMemo): EvolutionEntry

// Record a task score during trial
recordTrialTaskScore(agentName: string, version: number, score: number): void

// Check if trial is complete and handle result
evaluateTrialCompletion(agentName: string, version: number): TrialResult

// Revert to a previous version
revertEvolution(agentName: string, version: number, reason: string): void

// Apply user-directed behavior change (no approval needed)
applyBehaviorChange(agentName: string, change: string, source: string): void

// Get current version number for an agent
getCurrentVersion(agentName: string): number

// List all agents with active trials
getActiveTrials(): ActiveTrial[]
```

### 7.2 Agent Directory Resolution

The service needs to map agent names to file paths. Agent directories follow this structure:

```typescript
const AGENT_PATHS: Record<string, string> = {
  "Atlas":    "Agents/executives/Atlas",
  "Binky":    "Agents/executives/Binky",
  "Lucy":     "Agents/Sub-Agents/LUCY",
  "Venny":    "Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/VENNY",
  "Victor":   "Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/VENNY/VICTOR",
  // ... all 30+ agents
};
```

Build this map dynamically by scanning `Agents/` for directories containing SOUL.md.

### 7.3 Engine Loop Integration

The engine loop (`workers/engineLoop.ts`) is a `while(true)` loop that drains intent batches with a 750ms idle interval. Add a trial monitoring check gated by a tick counter:

```typescript
// Add tick counter to engine loop
let tickCount = 0;

// Inside the main loop body, after intent processing:
tickCount++;
// Check trials every ~400 ticks (~5 minutes at 750ms interval)
if (tickCount % 400 === 0) {
  const activeTrials = await evolutionService.getActiveTrials();
  for (const trial of activeTrials) {
    if (trial.tasksCompleted >= trial.trialTaskCount) {
      await evolutionService.evaluateTrialCompletion(trial.agentName, trial.version);
    }
  }
}
```

Note: Trial task scores are recorded in real-time (via `recordTrialTaskScore()`) when agents complete tasks. The engine loop check is a fallback sweep to catch any trials that reached completion between score recordings.

### 7.4 API Routes

New route file: `backend/src/routes/evolutionRoutes.ts`
Mounted at: `/v1/evolution`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/agents` | List all agents with evolution status, current version, active trials |
| `GET` | `/agents/:name/history` | Full evolution history for an agent |
| `GET` | `/agents/:name/current` | Current file contents + version for an agent |
| `POST` | `/agents/:name/behavior` | Apply user-directed behavior change |
| `POST` | `/agents/:name/revert/:version` | Manual revert to specific version |
| `GET` | `/trials` | List all active trials across all agents |
| `GET` | `/trials/:name` | Get active trial status for specific agent |

All routes require auth (JWT via `authPlugin`). All mutations logged to audit trail.

### 7.5 DecisionMemo Integration

When a memo with title prefix `[EVOLUTION_APPROVAL]` is approved:

1. `evolutionService.applyEvolution()` is called automatically
2. The target file is updated with the diff from `payload`
3. A new entry is appended to the agent's evolution.md
4. Trial tracking begins

**Integration point:** The `approveDecisionMemo()` function in `services/decisionMemos.ts` must be extended with a post-approval hook:

```typescript
// In approveDecisionMemo() — after status flip to APPROVED
if (memo.payload?.type === "EVOLUTION") {
  await evolutionService.applyEvolution(memo.payload.targetAgent, memo);
}
```

Similarly, the route handler in `decisionRoutes.ts` for `POST /v1/decisions/:id/approve` should call this hook. This mirrors the existing pattern for `payload.type === "broadcast"`.

When a memo with title `[EVOLUTION_REVERTED]` is created:

1. The revert has already happened (auto-revert triggered it)
2. The memo serves as notification and audit record
3. Billy sees it in the decision memo dashboard

### 7.6 Data Persistence

**Trial state** is stored in the database, NOT in-memory. The approved `DecisionMemo`'s `payload` JSON field is extended with a `trialState` sub-object:

```typescript
payload: {
  type: "EVOLUTION",
  // ... existing fields ...
  trialState: {
    tasksCompleted: 3,
    tasksRequired: 10,
    scores: [8.2, 7.5, 9.0],  // one per completed task
    baselineScore: 7.2,
    startedAt: "2026-03-19T14:00Z"
  }
}
```

Updated on every task score via `prisma.decisionMemo.update()`. One extra DB write per task completion during a trial — negligible load. On server restart, active trials are recovered by querying `DecisionMemo` where `payload.type = "EVOLUTION"` and `status = "APPROVED"` with `trialState.tasksCompleted < trialState.tasksRequired`.

**Agent file persistence** follows a DB-over-filesystem strategy:

1. **Git files are the baseline** — `Agents/*/SOUL.md`, `SKILL.md`, `POLICY.md` checked into the repo are the starting defaults
2. **Evolved content stored in DB** — When an evolution is applied, the full updated file content is stored in the `DecisionMemo.payload.evolvedContent` field
3. **Runtime reads check DB first** — `evolutionService.getAgentFile(agentName, fileType)` reads from DB (latest PERMANENT or TRIAL evolution for that file), falling back to filesystem baseline
4. **evolution.md remains filesystem** — The human-readable audit log is still written to `Agents/*/evolution.md` for easy browsing. This is a log, not a source of truth for active state.
5. **Deploy safety** — Since evolved content lives in DB, redeploys from git don't overwrite runtime changes. The git baseline only applies when no DB evolution exists for that file.

**Diff storage:** The `payload` stores both the diff summary (for evolution.md readability) and the full `beforeContent` and `afterContent` (for reliable revert). Single-line diff summaries in evolution.md are for human scanning only.

No new Prisma tables required. All state fits in the existing `DecisionMemo.payload` JSON field.

## 8. Frontend Integration

No new pages required for MVP. Evolution data surfaces in existing UI:

- **Decision Memo dashboard** — `[EVOLUTION_APPROVAL]` and `[EVOLUTION_REVERTED]` memos appear alongside tool approvals and treatment approvals
- **Agent Watcher** — Show current evolution version and active trial status per agent
- **Notifications** — Auto-revert events trigger standard notification flow

Future: Dedicated evolution history view per agent with diff visualization.

## 9. Two Evolution Paths

### 9.1 Agent-Initiated (requires approval)

```
Agent identifies improvement
  → Runs eval (sized by risk tier)
  → If eval positive: creates [EVOLUTION_APPROVAL] memo
  → Billy reviews memo (sees eval results, diff, cost impact)
  → Approved → change applied → trial begins
  → Trial passes → PERMANENT
  → Trial fails → auto-revert → [EVOLUTION_REVERTED] notification
```

### 9.2 User-Directed (no approval needed)

```
Billy tells agent: "use anime style on Instagram"
  → Agent writes to behavior.md
  → Logs in evolution.md as [USER_DIRECTED]
  → No trial period (Billy said so, it's permanent)
  → Can be manually reverted anytime
```

## 10. Failure Logging in MEMORY.md

### 10.1 Purpose

When agents encounter failures during task execution, they MUST log the failure in their MEMORY.md file. Failure logs serve two purposes:

1. **Immediate context** — The agent remembers what went wrong and avoids repeating the same mistake
2. **Evolution evidence** — Failure patterns become justification for proposing behavioral or skill changes via `[EVOLUTION_APPROVAL]` memos

### 10.2 Failure Log Format

Agents append structured failure entries to MEMORY.md:

```markdown
## Failure Log

### F-0012 — 2026-03-19T14:22Z
- **Task:** Generate Instagram carousel for HVAC client
- **Error:** Ideogram API returned 429 (rate limit exceeded)
- **Root Cause:** Burst of 8 concurrent image requests exceeded tier-1 rate limit (10/min)
- **Impact:** Task delayed 2 minutes, completed on retry
- **Lesson:** Batch image requests with 1s delay between calls when generating 5+ images
- **Evolution Signal:** Consider proposing SKILL.md update to add rate-limit-aware batching

### F-0011 — 2026-03-18T09:15Z
- **Task:** Post LinkedIn article for Atlas UX
- **Error:** Post rejected — exceeded 3000 character limit
- **Root Cause:** Summary generation prompt didn't enforce character constraint
- **Impact:** Required manual trim and re-post
- **Lesson:** Always include `max_characters: 2800` in LinkedIn content prompts (200 char buffer)
- **Evolution Signal:** None — added to prompt template directly
```

### 10.3 Required Fields

Every failure entry MUST include:

| Field | Description |
|-------|-------------|
| `Task` | What the agent was trying to do |
| `Error` | The error message or failure condition |
| `Root Cause` | Why it happened (not just what happened) |
| `Impact` | How it affected the task outcome (delay, failure, degraded quality) |
| `Lesson` | What the agent should do differently next time |
| `Evolution Signal` | Whether this failure suggests a SKILL/POLICY/behavior change, or "None" |

### 10.4 Evolution Pipeline Integration

The evolution service scans MEMORY.md failure logs when an agent proposes a change:

- **Pattern detection** — If 3+ failures share the same root cause category, the agent SHOULD propose an evolution to address it
- **Evidence in memos** — `[EVOLUTION_APPROVAL]` memos can reference failure IDs (e.g., "See F-0008, F-0010, F-0012") as justification
- **Eval test cases** — Failure scenarios become test cases in the eval set. A proposed evolution must show the failure scenario now succeeds

### 10.5 Failure Severity

| Severity | Criteria | Action |
|----------|----------|--------|
| `LOW` | Task completed with minor delay or workaround | Log only |
| `MEDIUM` | Task required retry or produced degraded output | Log + flag for review |
| `HIGH` | Task failed entirely or produced incorrect output | Log + notify Billy + auto-create evolution signal |
| `CRITICAL` | Policy violation, data loss, or safety issue | Log + notify Billy immediately + block similar tasks |

HIGH and CRITICAL failures automatically surface in the Agent Watcher dashboard alongside active trials.

## 11. Safety Constraints

- **SOUL_LOCK.md** — Atlas already has a SOUL_LOCK. No evolution can bypass soul locks. If SOUL_LOCK.md exists, SOUL.md changes are blocked entirely regardless of approval.
- **No cascading evolutions** — An agent cannot propose changes to another agent's files. Only self-evolution.
- **Rate limit** — Max 3 evolution proposals per agent per 24 hours. Enforced in `evolutionService.proposeEvolution()` — queries `DecisionMemo` for memos with `payload.type = "EVOLUTION"` and `payload.targetAgent = agentName` created in the last 24 hours. If count >= 3, returns an error: `"Evolution rate limit: max 3 proposals per 24 hours for {agentName}"`. The proposal is NOT created.
- **Regression gate** — No evolution with regression rate >= 20% can be proposed (auto-rejected before memo creation).
- **SOUL changes require Billy** — Risk tier 4. Even if eval passes, Billy must explicitly approve SOUL.md changes. No auto-approval.

## 12. Initial Rollout

### Phase 1: Files + Service
- Create behavior.md and evolution.md (v1 INITIAL) for all 30+ agents
- Build evolutionService.ts
- Build evolutionRoutes.ts
- Register routes in server.ts

### Phase 2: Memo Integration
- Wire [EVOLUTION_APPROVAL] memo type into existing approval flow
- Add eval result display to decision memo UI
- Wire auto-apply on approval

### Phase 3: Trial Monitoring
- Add trial tracking to engine loop
- Build auto-revert logic
- Wire [EVOLUTION_REVERTED] notifications

### Phase 4: Agent Capability
- Update agent tool registry to include "propose evolution" capability
- Add eval runner to agent toolset
- Update SKILL.md for agents that should be able to self-evolve
