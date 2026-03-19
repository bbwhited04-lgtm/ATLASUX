/**
 * KB Eval Worker — scheduled self-healing knowledge base monitor.
 *
 * Runs on cron (KB_EVAL_CRON, default daily 2 AM).
 * Detects orphans, stale docs, retrieval regressions, duplicates.
 * Auto-heals low-risk issues, queues decision memos for the rest.
 * Reports via Slack + Obsidian vault.
 *
 * Run: node dist/workers/kbEvalWorker.js
 */

import { prisma } from "../db/prisma.js";
import { loadEnv } from "../env.js";
import { runFullEval } from "../core/kb/kbEval.js";
import { dispatchHeals, handleReactiveHeal } from "../core/kb/kbHealer.js";
import { getApprovedQueries, checkCoverage } from "../core/kb/kbGoldenDataset.js";
import { computeHealthScore, scoreBreakdown } from "../core/kb/kbHealthScorer.js";
import { onHealEvent } from "../lib/kbHealEmitter.js";
import type { HealthMetrics } from "../core/kb/kbHealthScorer.js";

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

// ── Cron parsing (simple: "0 2 * * *" = daily at 2 AM) ─────────────────────

function parseCron(cron: string): { hour: number; minute: number } {
  const parts = cron.trim().split(/\s+/);
  return {
    minute: parts[0] === "*" ? 0 : Number(parts[0]),
    hour: parts[1] === "*" ? -1 : Number(parts[1]),
  };
}

function msUntilNextRun(cron: string): number {
  const { hour, minute } = parseCron(cron);
  const now = new Date();

  const next = new Date(now);
  next.setHours(hour >= 0 ? hour : now.getHours(), minute, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next.getTime() - now.getTime();
}

// ── Slack report ────────────────────────────────────────────────────────────

async function sendSlackReport(report: {
  healthScore: number;
  prevScore: number | null;
  avgRecall: number;
  queriesRun: number;
  orphanCount: number;
  orphansHealed: number;
  staleCount: number;
  duplicateCount: number;
  misleadingCount: number;
  coverageGaps: string[];
  autoHealed: number;
  decisionMemos: number;
  costUsd: number;
  durationMs: number;
  breakdown: Record<string, { score: number; weight: number; detail: string }>;
}): Promise<void> {
  try {
    const { postAsAgent, getChannelByName } = await import("../services/slack.js");

    const channel = await getChannelByName("atlas-kb-health", true);
    if (!channel) {
      console.log("[kb-eval] No Slack channel found for report");
      return;
    }

    const trend = report.prevScore !== null
      ? (report.healthScore >= report.prevScore ? `↑${report.healthScore - report.prevScore}` : `↓${report.prevScore - report.healthScore}`)
      : "new";

    const lines = [
      `*KB Health Report — ${new Date().toISOString().slice(0, 10)}*`,
      `Score: *${report.healthScore}/100* (${trend} from yesterday)`,
      ``,
      `Retrieval: ${(report.avgRecall * 100).toFixed(1)}% recall@5 across ${report.queriesRun} golden queries`,
      `Orphans: ${report.orphanCount} found, ${report.orphansHealed} auto-healed`,
      `Stale: ${report.staleCount} docs never retrieved`,
      `Duplicates: ${report.duplicateCount} pairs found`,
      `Misleading: ${report.misleadingCount}`,
      report.coverageGaps.length > 0
        ? `Coverage gaps: ${report.coverageGaps.join(", ")}`
        : `Coverage: all dimensions covered`,
      ``,
      `Auto-healed: ${report.autoHealed} actions ($${report.costUsd.toFixed(4)})`,
      `Awaiting approval: ${report.decisionMemos} decision memos`,
      `Run time: ${(report.durationMs / 1000).toFixed(1)}s`,
    ];

    await postAsAgent(channel.id, "atlas", lines.join("\n"));
    console.log("[kb-eval] Slack report sent");
  } catch (err: any) {
    console.error("[kb-eval] Slack report failed:", err?.message);
  }
}

// ── Obsidian sync ───────────────────────────────────────────────────────────

async function syncToObsidian(report: {
  healthScore: number;
  breakdown: Record<string, { score: number; weight: number; detail: string }>;
  issues: any[];
  healResult: any;
  durationMs: number;
}): Promise<void> {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const OBSIDIAN_KEY = "17ec226241d4a9059442e2f30c9199715b6a936dfd40900cf5e030aac608486a";

    const breakdownLines = Object.entries(report.breakdown)
      .map(([k, v]) => `| ${k} | ${v.score}/100 | ${v.weight}% | ${v.detail} |`)
      .join("\n");

    const note = [
      `---`,
      `tags: [kb, eval, health-report]`,
      `date: ${date}`,
      `health-score: ${report.healthScore}`,
      `---`,
      ``,
      `# KB Health Report — ${date}`,
      ``,
      `## Score: ${report.healthScore}/100`,
      ``,
      `| Metric | Score | Weight | Detail |`,
      `|--------|-------|--------|--------|`,
      breakdownLines,
      ``,
      `## Issues Found: ${report.issues.length}`,
      ``,
      ...report.issues.slice(0, 20).map(i => `- **${i.type}** (risk ${i.riskTier}, confidence ${(i.confidence * 100).toFixed(0)}%): ${i.description}`),
      ``,
      `## Healing`,
      `- Auto-healed: ${report.healResult.autoHealed}`,
      `- Decision memos: ${report.healResult.decisionMemosCreated}`,
      `- Cost: $${report.healResult.totalCostUsd.toFixed(4)}`,
      ``,
      `Run time: ${(report.durationMs / 1000).toFixed(1)}s`,
    ].join("\n");

    const url = `https://127.0.0.1:27124/vault/projects/atlasux/eval/reports/${date}-kb-health.md`;
    await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${OBSIDIAN_KEY}`,
        "Content-Type": "text/markdown",
      },
      body: note,
      // @ts-ignore — Node 20+ supports this for self-signed certs
      dispatcher: undefined,
    }).catch(() => {
      // Obsidian might not be running — non-fatal
      console.log("[kb-eval] Obsidian sync skipped (not reachable)");
    });

    console.log("[kb-eval] Obsidian report synced");
  } catch (err: any) {
    console.error("[kb-eval] Obsidian sync failed:", err?.message);
  }
}

// ── Main eval run ───────────────────────────────────────────────────────────

async function runEvalCycle(): Promise<void> {
  const start = Date.now();
  console.log(`\n[kb-eval] Starting eval cycle at ${new Date().toISOString()}`);

  try {
    // 1. Load golden queries
    const goldenQueries = await getApprovedQueries(TENANT_ID);
    if (goldenQueries.length === 0) {
      console.log("[kb-eval] No approved golden queries — skipping eval");
      return;
    }
    console.log(`[kb-eval] Loaded ${goldenQueries.length} golden queries`);

    // 2. Run full eval
    const evalResult = await runFullEval(TENANT_ID, goldenQueries as any);
    console.log(`[kb-eval] Eval complete: ${evalResult.issues.length} issues found`);

    // 3. Check coverage
    const coverage = await checkCoverage(TENANT_ID);

    // 4. Compute health score
    const healthMetrics: HealthMetrics = {
      avgRecall: evalResult.avgRecall,
      orphanCount: evalResult.orphanCount,
      totalDocs: evalResult.totalDocs,
      staleDocs: evalResult.staleCount,
      duplicatePairs: evalResult.duplicateCount,
      totalChunks: evalResult.totalChunks,
      coverageGaps: coverage.gaps.length,
      totalDimensions: coverage.gaps.length + goldenQueries.length, // rough estimate
    };
    const healthScore = computeHealthScore(healthMetrics);
    const breakdown = scoreBreakdown(healthMetrics);
    console.log(`[kb-eval] Health score: ${healthScore}/100`);

    // 5. Create eval run record
    const run = await prisma.kbEvalRun.create({
      data: {
        tenantId: TENANT_ID,
        trigger: "cron",
        healthScore,
        queriesRun: goldenQueries.length,
        issuesFound: evalResult.issues.length,
        autoHealed: 0, // updated after heals
        decisionMemosCreated: 0,
        costUsd: 0,
        durationMs: 0,
        report: {
          avgRecall: evalResult.avgRecall,
          avgPrecision: evalResult.avgPrecision,
          avgMrr: evalResult.avgMrr,
          orphanCount: evalResult.orphanCount,
          staleCount: evalResult.staleCount,
          duplicateCount: evalResult.duplicateCount,
          coverageGaps: coverage.gaps,
          breakdown,
        },
      },
    });

    // 6. Store individual eval results
    for (const m of evalResult.retrievalMetrics) {
      await prisma.kbEvalResult.create({
        data: {
          runId: run.id,
          evalQueryId: m.queryId,
          retrievedDocumentIds: m.retrievedIds,
          scores: { recall: m.recall, precision: m.precision, mrr: m.mrr },
          latencyMs: m.latencyMs,
        },
      });
    }

    // 7. Dispatch heals
    const healResult = await dispatchHeals(evalResult.issues, run.id, TENANT_ID);
    console.log(`[kb-eval] Heals: ${healResult.autoHealed} auto, ${healResult.decisionMemosCreated} memos`);

    const durationMs = Date.now() - start;

    // 8. Update run record with final stats
    await prisma.kbEvalRun.update({
      where: { id: run.id },
      data: {
        autoHealed: healResult.autoHealed,
        decisionMemosCreated: healResult.decisionMemosCreated,
        costUsd: healResult.totalCostUsd,
        durationMs,
      },
    });

    // 9. Get previous score for trend
    const prevRun = await prisma.kbEvalRun.findFirst({
      where: { tenantId: TENANT_ID, id: { not: run.id } },
      orderBy: { createdAt: "desc" },
      select: { healthScore: true },
    });

    // 10. Check if health score is below alert threshold
    const env = loadEnv(process.env);
    const alertThreshold = Number(env.KB_HEALTH_ALERT_THRESHOLD ?? 70);
    if (healthScore < alertThreshold) {
      console.log(`[kb-eval] ALERT: Health score ${healthScore} below threshold ${alertThreshold}`);
    }

    // 11. Send Slack report
    await sendSlackReport({
      healthScore,
      prevScore: prevRun?.healthScore ?? null,
      avgRecall: evalResult.avgRecall,
      queriesRun: goldenQueries.length,
      orphanCount: evalResult.orphanCount,
      orphansHealed: healResult.actions.filter(a => a.actionType === "relink" && a.status === "auto-executed").length,
      staleCount: evalResult.staleCount,
      duplicateCount: evalResult.duplicateCount,
      misleadingCount: evalResult.issues.filter(i => i.type === "misleading").length,
      coverageGaps: coverage.gaps.map(g => `${g.dimension}/${g.name} (${g.count}/${g.min})`),
      autoHealed: healResult.autoHealed,
      decisionMemos: healResult.decisionMemosCreated,
      costUsd: healResult.totalCostUsd,
      durationMs,
      breakdown,
    });

    // 12. Sync to Obsidian
    await syncToObsidian({
      healthScore,
      breakdown,
      issues: evalResult.issues,
      healResult,
      durationMs,
    });

    console.log(`[kb-eval] Cycle complete in ${(durationMs / 1000).toFixed(1)}s`);
  } catch (err: any) {
    console.error("[kb-eval] Eval cycle failed:", err?.message ?? err);
  }
}

// ── Worker loop ─────────────────────────────────────────────────────────────

let stopping = false;

async function main() {
  const env = loadEnv(process.env);

  if (env.KB_EVAL_ENABLED === "false") {
    console.log("[kb-eval] Disabled via KB_EVAL_ENABLED=false");
    process.exit(0);
  }

  const cron = env.KB_EVAL_CRON ?? "0 2 * * *";
  console.log(`[kb-eval] Worker started. Cron: ${cron}`);
  console.log(`[kb-eval] Tenant: ${TENANT_ID}`);

  // Register reactive heal listener
  onHealEvent(handleReactiveHeal);
  console.log("[kb-eval] Reactive heal listener registered");

  // Check for --now flag (manual trigger)
  if (process.argv.includes("--now")) {
    console.log("[kb-eval] Manual trigger (--now flag)");
    await runEvalCycle();
    process.exit(0);
  }

  // Main cron loop
  while (!stopping) {
    const waitMs = msUntilNextRun(cron);
    console.log(`[kb-eval] Next run in ${(waitMs / 1000 / 60).toFixed(0)} minutes`);

    // Sleep until next run (check every 60s for stop signal)
    const sleepEnd = Date.now() + waitMs;
    while (Date.now() < sleepEnd && !stopping) {
      await new Promise(r => setTimeout(r, Math.min(60_000, sleepEnd - Date.now())));
    }

    if (!stopping) {
      await runEvalCycle();
    }
  }

  console.log("[kb-eval] Worker stopped");
}

function stop() {
  stopping = true;
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

main().catch(err => {
  console.error("[kb-eval] Fatal:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
