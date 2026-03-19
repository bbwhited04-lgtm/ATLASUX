import { prisma } from "../db/prisma.js";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EvolutionEntry {
  version: number;
  date: string;
  tag: string;
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
        result.set(dirName, dir);
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
  const direct = paths.get(agentName);
  if (direct) return direct;

  for (const [name, dir] of Array.from(paths.entries())) {
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

// ── Evolution History ──────────────────────────────────────────────────────────

/**
 * Parse evolution.md into structured entries.
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
 * Get current version number for an agent.
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

  const headerEnd = content.indexOf("\n\n");
  if (headerEnd >= 0) {
    content = content.slice(0, headerEnd + 2) + newEntry + content.slice(headerEnd + 2);
  } else {
    content = content + "\n" + newEntry;
  }

  fs.writeFileSync(filePath, content, "utf-8");
}

// ── Evolution Application ──────────────────────────────────────────────────────

function hasSoulLock(agentName: string): boolean {
  const dir = getAgentDir(agentName);
  return fs.existsSync(path.join(dir, "SOUL_LOCK.md"));
}

function readAgentFile(agentName: string, fileType: EvolutionFileType): string {
  const dir = getAgentDir(agentName);
  const filePath = path.join(dir, fileType);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function writeAgentFile(agentName: string, fileType: EvolutionFileType, content: string): void {
  const dir = getAgentDir(agentName);
  const filePath = path.join(dir, fileType);
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Check rate limit: max 3 evolution proposals per agent per 24 hours.
 * Scaffolding for Phase 4 when agents can self-propose evolutions.
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
 * Scaffolding for Phase 4 when agents can self-propose evolutions.
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
 * Apply an approved evolution.
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

  if (targetFile === "SOUL.md" && hasSoulLock(agentName)) {
    return { ok: false, error: `SOUL_LOCK.md exists for ${agentName}. SOUL.md evolution blocked.` };
  }

  const beforeContent = readAgentFile(agentName, targetFile);
  const afterContent = payload.afterContent ?? beforeContent;
  if (afterContent !== beforeContent) {
    writeAgentFile(agentName, targetFile, afterContent);
  }

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

  writeAgentFile(agentName, targetFile, beforeContent);

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

  const version = getCurrentVersion(agentName) + 1;
  appendEvolutionEntry(agentName, {
    version,
    tag: reason.includes("auto-revert") ? "REVERTED" : "MANUAL_REVERT",
    file: targetFile,
    change: `Reverted: ${reason}`,
    memoId,
    revertedAt: new Date().toISOString(),
    status: reason.includes("auto-revert") ? "REVERTED" : "MANUAL_REVERT",
  });

  return { ok: true };
}

// ── Trial Tracking ─────────────────────────────────────────────────────────────

/**
 * Record a task score during an active trial.
 */
export async function recordTrialTaskScore(
  tenantId: string,
  agentName: string,
  score: number
): Promise<{ ok: boolean; trialComplete?: boolean }> {
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
  if (ts.tasksCompleted >= ts.tasksRequired) return { ok: false };

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
 * Evaluate a completed trial. Auto-reverts if trial score < baseline.
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
  if (ts.tasksCompleted < ts.tasksRequired) return null;

  const trialScore = ts.scores.length > 0
    ? ts.scores.reduce((a: number, b: number) => a + b, 0) / ts.scores.length
    : 0;

  const baselineScore = ts.baselineScore ?? 0;
  const passed = trialScore >= baselineScore;
  const version = payload.proposedVersion ?? 0;

  if (passed) {
    await prisma.decisionMemo.update({
      where: { id: memo.id },
      data: {
        payload: {
          ...payload,
          trialResult: { passed: true, trialScore, baselineScore, completedAt: new Date().toISOString() },
        },
      },
    });

    appendEvolutionEntry(agentName, {
      version: getCurrentVersion(agentName) + 1,
      tag: "PERMANENT",
      file: payload.targetFile,
      change: `Trial passed: ${trialScore.toFixed(1)} vs ${baselineScore.toFixed(1)} baseline`,
      trialSummary: `${ts.tasksRequired} tasks, score baseline ${baselineScore} → post-change ${trialScore.toFixed(1)}`,
      status: "PERMANENT",
    });
  } else {
    await revertEvolution(
      tenantId,
      agentName,
      memo.id,
      `auto-revert: trial score ${trialScore.toFixed(1)} below baseline ${baselineScore}`
    );

    await prisma.decisionMemo.create({
      data: {
        tenantId,
        agent: agentName,
        title: `[EVOLUTION_REVERTED] v${version} failed trial for ${agentName}`,
        rationale: `Trial score ${trialScore.toFixed(1)} fell below baseline ${baselineScore}. Change to ${payload.targetFile} auto-reverted.`,
        riskTier: 0,
        status: "APPROVED",
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
    if (ts.tasksCompleted >= ts.tasksRequired) continue;

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

// ── Behavior Changes (User-Directed) ──────────────────────────────────────────

/**
 * Apply a user-directed behavior change. No approval required.
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

  content = content.replace(/\n_No user-directed preferences configured yet._\n?/, "\n");
  content = content.trimEnd() + "\n\n" + change.trim() + "\n";

  fs.writeFileSync(behaviorPath, content, "utf-8");

  const version = getCurrentVersion(agentName) + 1;
  appendEvolutionEntry(agentName, {
    version,
    tag: "USER_DIRECTED",
    file: "behavior.md",
    change: change.split("\n")[0].slice(0, 100),
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
 * Get current file contents for an agent (checks DB first, falls back to filesystem).
 */
export async function getAgentFile(
  tenantId: string,
  agentName: string,
  fileType: EvolutionFileType
): Promise<{ content: string; source: "db" | "filesystem"; version?: number }> {
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

  return {
    content: readAgentFile(agentName, fileType),
    source: "filesystem",
  };
}
