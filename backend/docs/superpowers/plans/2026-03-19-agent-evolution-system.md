# Agent Self-Evolution System — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable 30+ Atlas UX agents to propose, test, trial, and adopt self-improvements through a versioned evolution system with human approval, auto-revert, and failure logging.

**Architecture:** DB-over-filesystem persistence — git agent files are the baseline, evolved content stored in DecisionMemo payload JSON. Evolution service reads DB first, falls back to filesystem. Trial state tracked in DB payload, not in-memory. Engine loop sweeps for completed trials every ~5 minutes.

**Tech Stack:** Fastify 5, TypeScript, Prisma (existing DecisionMemo model), Node.js fs for evolution.md audit logs, Zod for route validation.

**Spec:** `backend/docs/superpowers/specs/2026-03-19-agent-evolution-system-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|----------------|
| `backend/src/services/evolutionService.ts` | Core evolution logic: agent directory resolution, evolution history parsing, apply/revert/trial tracking, behavior changes, failure log parsing |
| `backend/src/routes/evolutionRoutes.ts` | REST API for evolution system: list agents, history, behavior changes, manual revert, trial status |

### Modified Files
| File | Change |
|------|--------|
| `backend/src/services/decisionMemos.ts` | Add post-approval hook for `payload.type === "EVOLUTION"` |
| `backend/src/routes/decisionRoutes.ts` | Wire evolution execution on approval (fire-and-forget, mirrors broadcast pattern) |
| `backend/src/workers/engineLoop.ts` | Add tick counter + trial monitoring sweep every ~5 minutes |
| `backend/src/server.ts` | Register `evolutionRoutes` at `/v1/evolution` |

### Generated Files (by Task 1 script)
| File | Count |
|------|-------|
| `Agents/**/behavior.md` | ~30 files (one per agent with SOUL.md) |
| `Agents/**/evolution.md` | ~30 files (one per agent with SOUL.md) |

---

## Chunk 1: Evolution Service Core

### Task 1: Create behavior.md and evolution.md for all agents

**Files:**
- Create: `Agents/**/behavior.md` (one per agent directory containing SOUL.md)
- Create: `Agents/**/evolution.md` (one per agent directory containing SOUL.md)

- [ ] **Step 1: Identify all agent directories**

List all directories under `Agents/` containing a SOUL.md file. There are ~30 agents across:
- `Agents/executives/Atlas/` — Atlas
- `Agents/executives/Atlas/Executive-Staff/IP_COUNSEL_BENNY/` — Benny
- `Agents/executives/Atlas/Executive-Staff/LEGAL_COUNSEL_JENNY/` — Jenny
- `Agents/executives/Atlas/Executive-Staff/SECRETARY_LARRY/` — Larry
- `Agents/executives/Atlas/Executive-Staff/TREASURER_TINA/` — Tina
- `Agents/executives/Binky/` — Binky
- `Agents/executives/Binky/Direct-Reports/ARCHY/` — Archy
- `Agents/executives/Binky/Direct-Reports/CHERYL/` — Cheryl
- `Agents/executives/Binky/Direct-Reports/DAILY-INTEL/` — Daily-Intel
- `Agents/executives/Binky/Direct-Reports/FRANK/` — Frank
- `Agents/executives/Binky/Direct-Reports/SUNDAY/` — Sunday
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/CORNWALL/` — Cornwall
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/DONNA/` — Donna
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/DWIGHT/` — Dwight
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/EMMA/` — Emma
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/EMMA/CLAIRE/` — Claire
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/EMMA/SANDY/` — Sandy
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/FRAN/` — Fran
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/KELLY/` — Kelly
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/LINK/` — Link
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/PENNY/` — Penny
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/REYNOLDS/` — Reynolds
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/TERRY/` — Terry
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/TIMMY/` — Timmy
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/VENNY/` — Venny
- `Agents/executives/Binky/Direct-Reports/SUNDAY/Social-Media-Team/VENNY/VICTOR/` — Victor
- `Agents/Sub-Agents/LUCY/` — Lucy
- `Agents/Sub-Agents/MERCER/` — Mercer
- `Agents/Sub-Agents/PETRA/` — Petra
- `Agents/Sub-Agents/PORTER/` — Porter

Note: `Agents/Sub-Agents/SOUL.md` is a shared root file, NOT an individual agent — skip it.

- [ ] **Step 2: Create behavior.md for each agent**

For each agent directory, create `behavior.md` with this template (replace `{AgentName}` with the directory name):

```markdown
# Behavior — {AgentName}

_No user-directed preferences configured yet._
```

- [ ] **Step 3: Create evolution.md for each agent**

For each agent directory, create `evolution.md` with this template:

```markdown
# Evolution Log — {AgentName}

## v1 — 2026-03-19 [INITIAL]
- **Status:** Agent initialized with base configuration
```

- [ ] **Step 4: Verify file creation**

Run: `find Agents/ -name "behavior.md" | wc -l` — expect ~30
Run: `find Agents/ -name "evolution.md" | wc -l` — expect ~30

- [ ] **Step 5: Commit**

```bash
git add Agents/**/behavior.md Agents/**/evolution.md
git commit -m "feat(evolution): initialize behavior.md and evolution.md for all 30 agents"
```

---

### Task 2: Build evolutionService.ts — Types and Agent Directory Resolution

**Files:**
- Create: `backend/src/services/evolutionService.ts`

- [ ] **Step 1: Create the service file with types and agent resolution**

```typescript
import { prisma } from "../db/prisma.js";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EvolutionEntry {
  version: number;
  date: string;
  tag: string; // APPROVED, REVERTED, USER_DIRECTED, REJECTED, REJECTED_SELF, INITIAL, etc.
  file: string;
  change: string;
  diff?: string;
  memoId?: string;
  evalSummary?: string;
  trialSummary?: string;
  status: string;
}

export interface ActiveTrial {
  agentName: string;
  version: number;
  memoId: string;
  tasksCompleted: number;
  tasksRequired: number;
  scores: number[];
  baselineScore: number;
  startedAt: string;
}

export interface TrialResult {
  passed: boolean;
  agentName: string;
  version: number;
  trialScore: number;
  baselineScore: number;
}

export interface AgentEvolutionStatus {
  name: string;
  directory: string;
  currentVersion: number;
  activeTrial: ActiveTrial | null;
  hasBehavior: boolean;
}

export type EvolutionFileType = "SOUL.md" | "SKILL.md" | "POLICY.md" | "behavior.md";

// ── Agent Directory Resolution ─────────────────────────────────────────────────

const AGENTS_ROOT = path.join(process.cwd(), "Agents");

let agentPathCache: Map<string, string> | null = null;

/**
 * Scan Agents/ for directories containing SOUL.md.
 * Returns a map of agent name → absolute directory path.
 * Cached after first call. Call clearAgentPathCache() to refresh.
 */
export function resolveAgentPaths(): Map<string, string> {
  if (agentPathCache) return agentPathCache;

  const result = new Map<string, string>();

  function scan(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    const hasSoul = entries.some(e => e.isFile() && e.name === "SOUL.md");
    if (hasSoul) {
      const dirName = path.basename(dir);
      // Skip the shared Sub-Agents/SOUL.md (parent dir is "Sub-Agents", not an agent name)
      if (dirName !== "Sub-Agents") {
        // Use directory name as agent name, normalized to title case
        const name = dirName.charAt(0).toUpperCase() + dirName.slice(1).toLowerCase();
        // For hyphenated names like DAILY-INTEL, keep as-is
        const agentName = dirName.includes("-") || dirName.includes("_")
          ? dirName
          : name;
        result.set(agentName, dir);
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
        scan(path.join(dir, entry.name));
      }
    }
  }

  scan(AGENTS_ROOT);
  agentPathCache = result;
  return result;
}

export function clearAgentPathCache(): void {
  agentPathCache = null;
}

/**
 * Get the absolute directory path for a named agent.
 * Throws if agent not found.
 */
export function getAgentDir(agentName: string): string {
  const paths = resolveAgentPaths();
  // Try exact match first, then case-insensitive
  const direct = paths.get(agentName);
  if (direct) return direct;

  for (const [name, dir] of paths) {
    if (name.toLowerCase() === agentName.toLowerCase()) return dir;
  }

  throw new Error(`Agent not found: ${agentName}`);
}

/**
 * List all known agent names.
 */
export function listAgentNames(): string[] {
  return Array.from(resolveAgentPaths().keys()).sort();
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd backend && npx tsc --noEmit src/services/evolutionService.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/evolutionService.ts
git commit -m "feat(evolution): add types and agent directory resolution"
```

---

### Task 3: Evolution History — Read and Write

**Files:**
- Modify: `backend/src/services/evolutionService.ts`

- [ ] **Step 1: Add evolution.md parsing and writing functions**

Append to `evolutionService.ts`:

```typescript
// ── Evolution History ──────────────────────────────────────────────────────────

/**
 * Parse evolution.md into structured entries.
 * Format: ## vN — YYYY-MM-DD [TAG] followed by key-value lines.
 */
export function parseEvolutionLog(content: string): EvolutionEntry[] {
  const entries: EvolutionEntry[] = [];
  const sections = content.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const headerMatch = section.match(/^v(\d+)\s*—\s*(\S+)\s*\[([^\]]+)\]/);
    if (!headerMatch) continue;

    const version = parseInt(headerMatch[1], 10);
    const date = headerMatch[2];
    const tag = headerMatch[3];

    const lines = section.split("\n");
    const fields: Record<string, string> = {};
    for (const line of lines) {
      const m = line.match(/^-\s*\*\*([^*]+)\*\*:\s*(.+)/);
      if (m) fields[m[1].trim()] = m[2].trim();
    }

    entries.push({
      version,
      date,
      tag,
      file: fields["File"] ?? "",
      change: fields["Change"] ?? "",
      diff: fields["Diff"],
      memoId: fields["Memo"],
      evalSummary: fields["Eval"],
      trialSummary: fields["Trial"],
      status: fields["Status"] ?? tag,
    });
  }

  return entries;
}

/**
 * Read and parse an agent's evolution.md.
 */
export function getEvolutionHistory(agentName: string): EvolutionEntry[] {
  const dir = getAgentDir(agentName);
  const filePath = path.join(dir, "evolution.md");
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return parseEvolutionLog(content);
  } catch {
    return [];
  }
}

/**
 * Get current version number for an agent (highest version in evolution.md).
 */
export function getCurrentVersion(agentName: string): number {
  const entries = getEvolutionHistory(agentName);
  if (entries.length === 0) return 1;
  return Math.max(...entries.map(e => e.version));
}

/**
 * Append a new version entry to evolution.md (prepended after header, newest first).
 */
export function appendEvolutionEntry(agentName: string, entry: {
  version: number;
  tag: string;
  file: string;
  change: string;
  diff?: string;
  memoId?: string;
  evalSummary?: string;
  trialSummary?: string;
  status: string;
  source?: string;
  revertedAt?: string;
  rejectionReason?: string;
}): void {
  const dir = getAgentDir(agentName);
  const filePath = path.join(dir, "evolution.md");

  const date = new Date().toISOString().split("T")[0];
  const lines: string[] = [];
  lines.push(`## v${entry.version} — ${date} [${entry.tag}]`);
  if (entry.file) lines.push(`- **File:** ${entry.file}`);
  if (entry.change) lines.push(`- **Change:** ${entry.change}`);
  if (entry.diff) lines.push(`- **Diff:** ${entry.diff}`);
  if (entry.memoId) lines.push(`- **Memo:** ${entry.memoId}`);
  if (entry.evalSummary) lines.push(`- **Eval:** ${entry.evalSummary}`);
  if (entry.trialSummary) lines.push(`- **Trial:** ${entry.trialSummary}`);
  if (entry.source) lines.push(`- **Source:** ${entry.source}`);
  if (entry.revertedAt) lines.push(`- **Reverted at:** ${entry.revertedAt}`);
  if (entry.rejectionReason) lines.push(`- **Rejection reason:** ${entry.rejectionReason}`);
  lines.push(`- **Status:** ${entry.status}`);
  lines.push("");

  const newEntry = lines.join("\n");

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    content = `# Evolution Log — ${agentName}\n\n`;
  }

  // Insert new entry after the header line (# Evolution Log — ...)
  const headerEnd = content.indexOf("\n\n");
  if (headerEnd >= 0) {
    content = content.slice(0, headerEnd + 2) + newEntry + content.slice(headerEnd + 2);
  } else {
    content = content + "\n" + newEntry;
  }

  fs.writeFileSync(filePath, content, "utf-8");
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit src/services/evolutionService.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/evolutionService.ts
git commit -m "feat(evolution): add evolution.md parsing and writing"
```

---

### Task 4: Apply Evolution and Revert

**Files:**
- Modify: `backend/src/services/evolutionService.ts`

- [ ] **Step 1: Add apply evolution function**

Append to `evolutionService.ts`:

```typescript
// ── Evolution Application ──────────────────────────────────────────────────────

/**
 * Check if an agent has a SOUL_LOCK.md (blocks SOUL.md evolution).
 */
function hasSoulLock(agentName: string): boolean {
  const dir = getAgentDir(agentName);
  return fs.existsSync(path.join(dir, "SOUL_LOCK.md"));
}

/**
 * Read an agent file's current content from filesystem.
 */
function readAgentFile(agentName: string, fileType: EvolutionFileType): string {
  const dir = getAgentDir(agentName);
  const filePath = path.join(dir, fileType);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

/**
 * Write content to an agent file on filesystem.
 */
function writeAgentFile(agentName: string, fileType: EvolutionFileType, content: string): void {
  const dir = getAgentDir(agentName);
  const filePath = path.join(dir, fileType);
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Check rate limit: max 3 evolution proposals per agent per 24 hours.
 * NOTE: Scaffolding for Phase 4 when agents can self-propose evolutions.
 * Not called in Phase 1 — agents cannot yet create their own memos.
 */
export async function checkEvolutionRateLimit(tenantId: string, agentName: string): Promise<{ ok: boolean; error?: string }> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const count = await prisma.decisionMemo.count({
    where: {
      tenantId,
      agent: agentName,
      title: { startsWith: "[EVOLUTION_APPROVAL]" },
      createdAt: { gte: since },
    },
  });
  if (count >= 3) {
    return { ok: false, error: `Evolution rate limit: max 3 proposals per 24 hours for ${agentName}` };
  }
  return { ok: true };
}

/**
 * Check concurrency: only one active trial per agent.
 * NOTE: Scaffolding for Phase 4 when agents can self-propose evolutions.
 * Not called in Phase 1 — agents cannot yet create their own memos.
 */
export async function checkTrialConcurrency(tenantId: string, agentName: string): Promise<{ ok: boolean; error?: string }> {
  const active = await prisma.decisionMemo.findFirst({
    where: {
      tenantId,
      agent: agentName,
      status: "APPROVED",
      title: { startsWith: "[EVOLUTION_APPROVAL]" },
    },
  });

  if (active) {
    const payload = active.payload as any;
    if (payload?.type === "EVOLUTION" && payload?.trialState) {
      const ts = payload.trialState;
      if (ts.tasksCompleted < ts.tasksRequired) {
        return { ok: false, error: `Agent ${agentName} has an active trial (v${payload.proposedVersion}). New proposals queued until trial completes.` };
      }
    }
  }
  return { ok: true };
}

/**
 * Apply an approved evolution. Called when a [EVOLUTION_APPROVAL] memo is approved.
 *
 * 1. Validates safety constraints (SOUL_LOCK, rate limit, concurrency)
 * 2. Reads current file content (beforeContent)
 * 3. Applies the change (writes afterContent)
 * 4. Updates memo payload with trialState, beforeContent, afterContent
 * 5. Appends entry to evolution.md
 */
export async function applyEvolution(
  tenantId: string,
  memo: { id: string; agent: string; payload: any }
): Promise<{ ok: boolean; error?: string }> {
  const payload = memo.payload as {
    type: string;
    targetFile: EvolutionFileType;
    targetAgent: string;
    currentVersion: number;
    proposedVersion: number;
    diff: string;
    afterContent?: string;
    evalResults?: any;
    trialTaskCount?: number;
    revertCondition?: string;
    baselineScore?: number;
  };

  if (payload?.type !== "EVOLUTION") {
    return { ok: false, error: "Not an evolution memo" };
  }

  const agentName = payload.targetAgent ?? memo.agent;
  const targetFile = payload.targetFile;

  // Safety: SOUL_LOCK blocks SOUL.md changes
  if (targetFile === "SOUL.md" && hasSoulLock(agentName)) {
    return { ok: false, error: `SOUL_LOCK.md exists for ${agentName}. SOUL.md evolution blocked.` };
  }

  // Read current content before applying
  const beforeContent = readAgentFile(agentName, targetFile);

  // Apply the change
  const afterContent = payload.afterContent ?? beforeContent; // If afterContent not provided, no-op
  if (afterContent !== beforeContent) {
    writeAgentFile(agentName, targetFile, afterContent);
  }

  // Update memo payload with trial state and file snapshots
  const trialTaskCount = payload.trialTaskCount ?? 10;
  const baselineScore = payload.baselineScore ?? payload.evalResults?.baselineScore ?? 0;

  await prisma.decisionMemo.update({
    where: { id: memo.id },
    data: {
      payload: {
        ...payload,
        beforeContent,
        afterContent,
        trialState: {
          tasksCompleted: 0,
          tasksRequired: trialTaskCount,
          scores: [],
          baselineScore,
          startedAt: new Date().toISOString(),
        },
      },
    },
  });

  // Append evolution.md entry
  const version = payload.proposedVersion ?? getCurrentVersion(agentName) + 1;
  appendEvolutionEntry(agentName, {
    version,
    tag: "APPROVED",
    file: targetFile,
    change: payload.diff ?? "Applied evolution",
    diff: payload.diff,
    memoId: `${memo.id} [EVOLUTION_APPROVAL]`,
    evalSummary: payload.evalResults
      ? `${payload.evalResults.improved}/${payload.evalResults.testCases} improved, ${payload.evalResults.regressed} regressions`
      : undefined,
    status: `TRIAL (${trialTaskCount} tasks remaining)`,
  });

  return { ok: true };
}

/**
 * Revert an evolution to the before state.
 */
export async function revertEvolution(
  tenantId: string,
  agentName: string,
  memoId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const memo = await prisma.decisionMemo.findFirst({
    where: { id: memoId, tenantId },
  });
  if (!memo) return { ok: false, error: "Memo not found" };

  const payload = memo.payload as any;
  if (payload?.type !== "EVOLUTION") {
    return { ok: false, error: "Not an evolution memo" };
  }

  const targetFile = payload.targetFile as EvolutionFileType;
  const beforeContent = payload.beforeContent;
  if (!beforeContent) {
    return { ok: false, error: "No beforeContent stored — cannot revert" };
  }

  // Restore file
  writeAgentFile(agentName, targetFile, beforeContent);

  // Update memo status
  await prisma.decisionMemo.update({
    where: { id: memoId },
    data: {
      status: "REJECTED",
      payload: {
        ...payload,
        revertedAt: new Date().toISOString(),
        revertReason: reason,
      },
    },
  });

  // Append revert entry to evolution.md
  const version = getCurrentVersion(agentName) + 1;
  appendEvolutionEntry(agentName, {
    version,
    tag: reason.includes("auto-revert") ? "REVERTED" : "MANUAL_REVERT",
    file: targetFile,
    change: `Reverted: ${reason}`,
    memoId: `${memoId}`,
    revertedAt: new Date().toISOString(),
    status: reason.includes("auto-revert") ? "REVERTED" : "MANUAL_REVERT",
  });

  return { ok: true };
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit src/services/evolutionService.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/evolutionService.ts
git commit -m "feat(evolution): add apply/revert evolution with safety constraints"
```

---

### Task 5: Trial Tracking and Evaluation

**Files:**
- Modify: `backend/src/services/evolutionService.ts`

- [ ] **Step 1: Add trial scoring and evaluation functions**

Append to `evolutionService.ts`:

```typescript
// ── Trial Tracking ─────────────────────────────────────────────────────────────

/**
 * Record a task score during an active trial.
 * Updates the trialState in the memo's payload.
 */
export async function recordTrialTaskScore(
  tenantId: string,
  agentName: string,
  score: number
): Promise<{ ok: boolean; trialComplete?: boolean }> {
  // Find active evolution trial for this agent
  const memos = await prisma.decisionMemo.findMany({
    where: {
      tenantId,
      agent: agentName,
      status: "APPROVED",
      title: { startsWith: "[EVOLUTION_APPROVAL]" },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (memos.length === 0) return { ok: false };

  const memo = memos[0];
  const payload = memo.payload as any;
  if (payload?.type !== "EVOLUTION" || !payload.trialState) return { ok: false };

  const ts = payload.trialState;
  if (ts.tasksCompleted >= ts.tasksRequired) return { ok: false }; // Trial already done

  // Record score
  ts.scores.push(score);
  ts.tasksCompleted += 1;

  await prisma.decisionMemo.update({
    where: { id: memo.id },
    data: {
      payload: { ...payload, trialState: ts },
    },
  });

  const trialComplete = ts.tasksCompleted >= ts.tasksRequired;
  return { ok: true, trialComplete };
}

/**
 * Evaluate a completed trial. Compares trial score to baseline.
 * Auto-reverts if trial score < baseline.
 */
export async function evaluateTrialCompletion(
  tenantId: string,
  agentName: string
): Promise<TrialResult | null> {
  const memos = await prisma.decisionMemo.findMany({
    where: {
      tenantId,
      agent: agentName,
      status: "APPROVED",
      title: { startsWith: "[EVOLUTION_APPROVAL]" },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  if (memos.length === 0) return null;

  const memo = memos[0];
  const payload = memo.payload as any;
  if (payload?.type !== "EVOLUTION" || !payload.trialState) return null;

  const ts = payload.trialState;
  if (ts.tasksCompleted < ts.tasksRequired) return null; // Not done yet

  const trialScore = ts.scores.length > 0
    ? ts.scores.reduce((a: number, b: number) => a + b, 0) / ts.scores.length
    : 0;

  const baselineScore = ts.baselineScore ?? 0;
  const passed = trialScore >= baselineScore;

  const version = payload.proposedVersion ?? 0;

  if (passed) {
    // Mark as permanent
    await prisma.decisionMemo.update({
      where: { id: memo.id },
      data: {
        payload: {
          ...payload,
          trialResult: { passed: true, trialScore, baselineScore, completedAt: new Date().toISOString() },
        },
      },
    });

    // Update evolution.md
    appendEvolutionEntry(agentName, {
      version: getCurrentVersion(agentName) + 1,
      tag: "PERMANENT",
      file: payload.targetFile,
      change: `Trial passed: ${trialScore.toFixed(1)} vs ${baselineScore.toFixed(1)} baseline`,
      trialSummary: `${ts.tasksRequired} tasks, score baseline ${baselineScore} → post-change ${trialScore.toFixed(1)}`,
      status: "PERMANENT",
    });
  } else {
    // Auto-revert
    await revertEvolution(
      tenantId,
      agentName,
      memo.id,
      `auto-revert: trial score ${trialScore.toFixed(1)} below baseline ${baselineScore}`
    );

    // Create notification memo
    await prisma.decisionMemo.create({
      data: {
        tenantId,
        agent: agentName,
        title: `[EVOLUTION_REVERTED] v${version} failed trial for ${agentName}`,
        rationale: `Trial score ${trialScore.toFixed(1)} fell below baseline ${baselineScore}. Change to ${payload.targetFile} auto-reverted.`,
        riskTier: 0,
        status: "APPROVED", // notification, not a decision
        payload: {
          type: "EVOLUTION_NOTIFICATION",
          originalMemoId: memo.id,
          trialScore,
          baselineScore,
          revertedAt: new Date().toISOString(),
        },
      },
    });
  }

  return { passed, agentName, version, trialScore, baselineScore };
}

/**
 * Get all active trials across all agents.
 * Queries DecisionMemo for APPROVED evolution memos with incomplete trials.
 */
export async function getActiveTrials(tenantId: string): Promise<ActiveTrial[]> {
  const memos = await prisma.decisionMemo.findMany({
    where: {
      tenantId,
      status: "APPROVED",
      title: { startsWith: "[EVOLUTION_APPROVAL]" },
    },
  });

  const trials: ActiveTrial[] = [];
  for (const memo of memos) {
    const payload = memo.payload as any;
    if (payload?.type !== "EVOLUTION" || !payload.trialState) continue;

    const ts = payload.trialState;
    if (ts.tasksCompleted >= ts.tasksRequired) continue; // Already done

    trials.push({
      agentName: payload.targetAgent ?? memo.agent,
      version: payload.proposedVersion ?? 0,
      memoId: memo.id,
      tasksCompleted: ts.tasksCompleted,
      tasksRequired: ts.tasksRequired,
      scores: ts.scores,
      baselineScore: ts.baselineScore,
      startedAt: ts.startedAt,
    });
  }

  return trials;
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit src/services/evolutionService.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/evolutionService.ts
git commit -m "feat(evolution): add trial tracking, scoring, and auto-revert"
```

---

### Task 6: Behavior Changes and Agent Status

**Files:**
- Modify: `backend/src/services/evolutionService.ts`

- [ ] **Step 1: Add behavior change and status listing functions**

Append to `evolutionService.ts`:

```typescript
// ── Behavior Changes (User-Directed) ──────────────────────────────────────────

/**
 * Apply a user-directed behavior change. No approval required.
 * Writes to behavior.md and logs to evolution.md.
 */
export function applyBehaviorChange(agentName: string, change: string, source: string): void {
  const dir = getAgentDir(agentName);
  const behaviorPath = path.join(dir, "behavior.md");

  let content: string;
  try {
    content = fs.readFileSync(behaviorPath, "utf-8");
  } catch {
    content = `# Behavior — ${agentName}\n\n`;
  }

  // Remove placeholder text if present
  content = content.replace(/\n_No user-directed preferences configured yet._\n?/, "\n");

  // Append the new behavior
  content = content.trimEnd() + "\n\n" + change.trim() + "\n";

  fs.writeFileSync(behaviorPath, content, "utf-8");

  // Log in evolution.md
  const version = getCurrentVersion(agentName) + 1;
  appendEvolutionEntry(agentName, {
    version,
    tag: "USER_DIRECTED",
    file: "behavior.md",
    change: change.split("\n")[0].slice(0, 100), // First line, truncated
    source: `${source} (no approval required)`,
    status: "ACTIVE",
  });
}

/**
 * Read an agent's current behavior.md content.
 */
export function getBehavior(agentName: string): string {
  const dir = getAgentDir(agentName);
  try {
    return fs.readFileSync(path.join(dir, "behavior.md"), "utf-8");
  } catch {
    return "";
  }
}

// ── Agent Status ───────────────────────────────────────────────────────────────

/**
 * Get evolution status for all agents.
 */
export async function getAllAgentStatus(tenantId: string): Promise<AgentEvolutionStatus[]> {
  const names = listAgentNames();
  const trials = await getActiveTrials(tenantId);
  const trialMap = new Map(trials.map(t => [t.agentName.toLowerCase(), t]));

  return names.map(name => ({
    name,
    directory: getAgentDir(name),
    currentVersion: getCurrentVersion(name),
    activeTrial: trialMap.get(name.toLowerCase()) ?? null,
    hasBehavior: getBehavior(name).length > 0,
  }));
}

/**
 * Get current file contents for an agent (checks DB for evolved content first, falls back to filesystem).
 */
export async function getAgentFile(
  tenantId: string,
  agentName: string,
  fileType: EvolutionFileType
): Promise<{ content: string; source: "db" | "filesystem"; version?: number }> {
  // Check DB for latest PERMANENT or TRIAL evolution for this file
  const memos = await prisma.decisionMemo.findMany({
    where: {
      tenantId,
      agent: agentName,
      status: "APPROVED",
      title: { startsWith: "[EVOLUTION_APPROVAL]" },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const memo of memos) {
    const payload = memo.payload as any;
    if (payload?.type !== "EVOLUTION") continue;
    if (payload.targetFile !== fileType) continue;

    // Check if trial passed (has trialResult.passed) or is still in trial
    if (payload.trialResult?.passed || payload.trialState) {
      if (payload.afterContent) {
        return {
          content: payload.afterContent,
          source: "db",
          version: payload.proposedVersion,
        };
      }
    }
  }

  // Fall back to filesystem
  return {
    content: readAgentFile(agentName, fileType),
    source: "filesystem",
  };
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit src/services/evolutionService.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/evolutionService.ts
git commit -m "feat(evolution): add behavior changes, agent status, and DB-filesystem fallback"
```

---

## Chunk 2: Routes, Integration, and Wiring

### Task 7: Build evolutionRoutes.ts

**Files:**
- Create: `backend/src/routes/evolutionRoutes.ts`

- [ ] **Step 1: Create the routes file**

```typescript
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { withTenant } from "../db/prisma.js";
import {
  listAgentNames,
  getEvolutionHistory,
  getCurrentVersion,
  getBehavior,
  applyBehaviorChange,
  revertEvolution,
  getActiveTrials,
  getAllAgentStatus,
  getAgentFile,
  type EvolutionFileType,
} from "../services/evolutionService.js";

const BehaviorChangeSchema = z.object({
  change: z.string().min(1).max(5000),
  source: z.string().min(1).max(200).default("Billy directive"),
});

const VALID_FILE_TYPES = ["SOUL.md", "SKILL.md", "POLICY.md", "behavior.md"] as const;

export const evolutionRoutes: FastifyPluginAsync = async (app) => {

  // List all agents with evolution status
  app.get("/agents", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const agents = await getAllAgentStatus(tenantId);
    return reply.send({ ok: true, agents });
  });

  // Full evolution history for an agent
  app.get("/agents/:name/history", async (req, reply) => {
    const name = String((req.params as any).name ?? "");
    try {
      const history = getEvolutionHistory(name);
      return reply.send({ ok: true, agent: name, version: getCurrentVersion(name), history });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // Current file contents + version for an agent
  app.get("/agents/:name/current", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const name = String((req.params as any).name ?? "");
    const fileType = String((req.query as any).file ?? "SKILL.md");

    if (!VALID_FILE_TYPES.includes(fileType as any)) {
      return reply.code(400).send({ ok: false, error: `Invalid file type. Must be one of: ${VALID_FILE_TYPES.join(", ")}` });
    }

    try {
      const result = await getAgentFile(tenantId, name, fileType as EvolutionFileType);
      return reply.send({
        ok: true,
        agent: name,
        file: fileType,
        version: getCurrentVersion(name),
        source: result.source,
        content: result.content,
      });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // Apply user-directed behavior change
  app.post("/agents/:name/behavior", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const role = (req as any).tenantRole as string | undefined;
    if (role !== "owner" && role !== "admin") {
      return reply.code(403).send({ ok: false, error: "INSUFFICIENT_ROLE" });
    }

    const name = String((req.params as any).name ?? "");

    let body: z.infer<typeof BehaviorChangeSchema>;
    try { body = BehaviorChangeSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    try {
      applyBehaviorChange(name, body.change, body.source);

      const actorUserId = (req as any).auth?.userId ?? null;
      await withTenant(tenantId, async (tx) =>
        tx.auditLog.create({
          data: {
            tenantId,
            actorType: "human",
            actorUserId,
            actorExternalId: null,
            level: "info",
            action: "EVOLUTION_BEHAVIOR_CHANGE",
            entityType: "agent",
            entityId: name,
            message: `Behavior change applied to ${name}: ${body.change.split("\n")[0].slice(0, 100)}`,
            meta: { agent: name, source: body.source },
            timestamp: new Date(),
          },
        } as any)
      ).catch(() => null);

      return reply.send({ ok: true, agent: name, version: getCurrentVersion(name) });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // Manual revert to a specific version
  app.post("/agents/:name/revert/:memoId", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const role = (req as any).tenantRole as string | undefined;
    if (role !== "owner" && role !== "admin") {
      return reply.code(403).send({ ok: false, error: "INSUFFICIENT_ROLE" });
    }

    const name = String((req.params as any).name ?? "");
    const memoId = String((req.params as any).memoId ?? "");
    const reason = String((req.body as any)?.reason ?? "Manual revert by admin");

    try {
      const result = await revertEvolution(tenantId, name, memoId, reason);
      if (!result.ok) return reply.code(400).send(result);

      const actorUserId = (req as any).auth?.userId ?? null;
      await withTenant(tenantId, async (tx) =>
        tx.auditLog.create({
          data: {
            tenantId,
            actorType: "human",
            actorUserId,
            actorExternalId: null,
            level: "warn",
            action: "EVOLUTION_MANUAL_REVERT",
            entityType: "agent",
            entityId: name,
            message: `Manual revert for ${name}: ${reason}`,
            meta: { agent: name, memoId, reason },
            timestamp: new Date(),
          },
        } as any)
      ).catch(() => null);

      return reply.send({ ok: true, agent: name, version: getCurrentVersion(name) });
    } catch (e: any) {
      return reply.code(404).send({ ok: false, error: e.message });
    }
  });

  // List all active trials
  app.get("/trials", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const trials = await getActiveTrials(tenantId);
    return reply.send({ ok: true, trials });
  });

  // Get active trial status for specific agent
  app.get("/trials/:name", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const name = String((req.params as any).name ?? "");
    const trials = await getActiveTrials(tenantId);
    const trial = trials.find(t => t.agentName.toLowerCase() === name.toLowerCase());

    if (!trial) return reply.send({ ok: true, agent: name, trial: null });
    return reply.send({ ok: true, agent: name, trial });
  });
};
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npx tsc --noEmit src/routes/evolutionRoutes.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/evolutionRoutes.ts
git commit -m "feat(evolution): add REST API routes for evolution system"
```

---

### Task 8: Wire Evolution into DecisionMemo Approval

**Files:**
- Modify: `backend/src/services/decisionMemos.ts` (add import + export for evolution hook)
- Modify: `backend/src/routes/decisionRoutes.ts` (wire fire-and-forget evolution on approval)

- [ ] **Step 1: Add evolution execution function to decisionMemos.ts**

At the top of `backend/src/services/decisionMemos.ts`, add the import:

```typescript
import { applyEvolution } from "./evolutionService.js";
```

At the bottom of the file, add:

```typescript
/**
 * Execute an approved evolution decision memo.
 * Called after approveDecisionMemo() succeeds for memos with payload.type === "EVOLUTION".
 * Applies the evolution change and starts the trial period.
 */
export async function executeApprovedEvolution(memo: {
  id: string;
  tenantId: string;
  agent: string;
  payload: any;
}) {
  const payload = memo.payload as { type?: string };
  if (payload?.type !== "EVOLUTION") return;

  const result = await applyEvolution(memo.tenantId, memo);

  if (!result.ok) {
    // Log failure but don't throw — this is fire-and-forget
    await prisma.auditLog.create({
      data: {
        tenantId: memo.tenantId,
        actorType: "system",
        actorExternalId: "evolution_service",
        level: "error",
        action: "EVOLUTION_APPLY_FAILED",
        entityType: "decision_memo",
        entityId: memo.id,
        message: `Evolution apply failed for ${memo.agent}: ${result.error}`,
        meta: { memoId: memo.id, agent: memo.agent, error: result.error },
        timestamp: new Date(),
      },
    } as any).catch(() => null);
  }

  return result;
}
```

- [ ] **Step 2: Wire evolution hook in decisionRoutes.ts**

In `backend/src/routes/decisionRoutes.ts`, update the import on line 4:

Change:
```typescript
import { approveDecisionMemo, createDecisionMemo, rejectDecisionMemo, executeApprovedBroadcast } from "../services/decisionMemos.js";
```
To:
```typescript
import { approveDecisionMemo, createDecisionMemo, rejectDecisionMemo, executeApprovedBroadcast, executeApprovedEvolution } from "../services/decisionMemos.js";
```

Then in the `/:id/approve` handler, after the broadcast block (after line 221), add:

```typescript
    // If this is an evolution memo, trigger evolution (fire-and-forget)
    if (res.ok && (res.memo.payload as any)?.type === "EVOLUTION") {
      executeApprovedEvolution(res.memo).catch(err => {
        app.log.error({ err }, "Evolution apply failed after approval");
      });
    }
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/services/decisionMemos.ts backend/src/routes/decisionRoutes.ts
git commit -m "feat(evolution): wire evolution execution into decision memo approval flow"
```

---

### Task 9: Register Routes in server.ts

**Files:**
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Add import**

Add the import near the other route imports in `server.ts`:

```typescript
import { evolutionRoutes } from "./routes/evolutionRoutes.js";
```

- [ ] **Step 2: Register the route**

Add the route registration after the other route registrations (near line 455):

```typescript
await app.register(evolutionRoutes, { prefix: "/v1/evolution" });
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat(evolution): register evolution routes at /v1/evolution"
```

---

### Task 10: Engine Loop Trial Monitoring

**Files:**
- Modify: `backend/src/workers/engineLoop.ts`

- [ ] **Step 1: Add import and trial sweep to engine loop**

At the top of `engineLoop.ts`, add:

```typescript
import { getActiveTrials, evaluateTrialCompletion } from "../services/evolutionService.js";
```

Inside the `main()` function, after line 42 (after `maxTicksPerCycle` definition), add:

```typescript
  let loopCount = 0;
```

Inside the main `while(true)` loop, after the moltbook heartbeat block (after line 101) and before the "Drain a batch" comment, add:

```typescript
    // Evolution trial monitoring (every ~400 loops ≈ 5 minutes at 750ms idle)
    loopCount++;
    if (loopCount % 400 === 0) {
      try {
        // Use the platform owner tenant for trial monitoring
        const ownerTenantId = process.env.TENANT_ID ?? "";
        if (ownerTenantId) {
          const trials = await getActiveTrials(ownerTenantId);
          for (const trial of trials) {
            if (trial.tasksCompleted >= trial.tasksRequired) {
              const result = await evaluateTrialCompletion(ownerTenantId, trial.agentName);
              if (result) {
                process.stdout.write(
                  `[engineLoop] evolution trial ${result.passed ? "PASSED" : "REVERTED"}: ` +
                  `${result.agentName} v${result.version} (${result.trialScore.toFixed(1)} vs ${result.baselineScore} baseline)\n`
                );
              }
            }
          }
        }
      } catch (e: any) {
        process.stderr.write(`[engineLoop] trial monitor error: ${e?.message ?? e}\n`);
      }
    }
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add backend/src/workers/engineLoop.ts
git commit -m "feat(evolution): add trial monitoring sweep to engine loop"
```

---

### Task 11: Full Build Verification and Smoke Test

**Files:** None (verification only)

- [ ] **Step 1: Full backend build**

Run: `cd backend && npm run build`
Expected: Clean build, no errors

- [ ] **Step 2: Verify agent files exist**

Run: `find Agents/ -name "evolution.md" | head -5`
Expected: Shows paths to evolution.md files

Run: `find Agents/ -name "behavior.md" | head -5`
Expected: Shows paths to behavior.md files

- [ ] **Step 3: Verify evolution.md content**

Read one evolution.md file and verify it has the v1 INITIAL entry:
```bash
cat Agents/executives/Atlas/evolution.md
```
Expected:
```markdown
# Evolution Log — Atlas

## v1 — 2026-03-19 [INITIAL]
- **Status:** Agent initialized with base configuration
```

- [ ] **Step 4: Final commit with build artifacts**

If any build artifacts or fixes were needed, stage only the specific changed files:
```bash
git add backend/src/services/evolutionService.ts backend/src/routes/evolutionRoutes.ts
git commit -m "feat(evolution): agent evolution system Phase 1 complete"
```

---

## Summary

### What this plan builds (Phase 1):
1. **30+ behavior.md files** — Empty templates ready for user-directed preferences
2. **30+ evolution.md files** — Initialized at v1 with INITIAL status
3. **evolutionService.ts** — Core service with:
   - Agent directory resolution (dynamic scanning of Agents/)
   - Evolution.md parsing and writing
   - Apply/revert evolution with SOUL_LOCK safety
   - Trial scoring and auto-revert evaluation
   - Behavior change application
   - DB-over-filesystem file resolution
4. **evolutionRoutes.ts** — 7 REST endpoints at `/v1/evolution`
5. **DecisionMemo integration** — Fire-and-forget evolution execution on approval
6. **Engine loop integration** — Trial monitoring sweep every ~5 minutes

### What Phase 2-4 will add later (not in this plan):
- **Phase 2:** Memo type display in decision memo UI, eval result rendering
- **Phase 3:** Full trial monitoring with notifications
- **Phase 4:** Agent tooling to propose their own evolutions
