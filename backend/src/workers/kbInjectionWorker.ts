/**
 * KB Injection Worker — scheduled content freshness pipeline.
 *
 * Runs on cron (KB_INJECTION_CRON, default daily 3 AM — after kbEval at 2 AM).
 * Detects stale KB articles, fetches fresh content from web sources,
 * patches via LLM, validates, and publishes.
 *
 * Run: node dist/workers/kbInjectionWorker.js
 * Run now: node dist/workers/kbInjectionWorker.js --now
 * Env: KB_INJECTION_ENABLED=true, KB_INJECTION_CRON="0 3 * * *"
 */

import { loadEnv } from "../env.js";
import { runInjectionPipeline } from "../core/kb/kbInjector.js";
import { prisma } from "../db/prisma.js";

// ── Cron parsing ─────────────────────────────────────────────────────────────

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
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

// ── Slack report ─────────────────────────────────────────────────────────────

async function sendSlackReport(result: Awaited<ReturnType<typeof runInjectionPipeline>>): Promise<void> {
  try {
    const { postAsAgent, getChannelByName } = await import("../services/slack.js");
    const channel = await getChannelByName("atlas-kb-health", true);
    if (!channel) return;

    const lines = [
      `*KB Injection Report* — ${new Date().toISOString().slice(0, 10)}`,
      `Scanned: ${result.articlesScanned} stale articles`,
      `Applied: ${result.patchesApplied} | Skipped: ${result.patchesSkipped} | Failed: ${result.patchesFailed}`,
      `Cost: $${result.totalCostUsd.toFixed(4)} | Duration: ${(result.durationMs / 1000).toFixed(1)}s`,
    ];

    if (result.patches.filter((p) => p.status === "patched").length > 0) {
      lines.push("", "*Updated:*");
      for (const p of result.patches.filter((p) => p.status === "patched")) {
        lines.push(`  • \`${p.slug}\` — ${p.sectionsUpdated} sections, ${p.contentDeltaPct}% delta`);
      }
    }

    await postAsAgent(channel.id, "porter", lines.join("\n"));
  } catch (err: any) {
    console.error(`[kb-inject] Slack report failed: ${err?.message}`);
  }
}

// ── Audit persistence ────────────────────────────────────────────────────────

async function persistRunResult(result: Awaited<ReturnType<typeof runInjectionPipeline>>): Promise<void> {
  try {
    await prisma.system_state.upsert({
      where: { key: "kb_injection_last_run" },
      create: {
        key: "kb_injection_last_run",
        value: JSON.stringify({
          runId: result.runId,
          timestamp: result.startedAt.toISOString(),
          applied: result.patchesApplied,
          skipped: result.patchesSkipped,
          failed: result.patchesFailed,
          costUsd: result.totalCostUsd,
          patches: result.patches.map((p) => ({
            slug: p.slug,
            status: p.status,
            reason: p.reason,
          })),
        }),
      },
      update: {
        value: JSON.stringify({
          runId: result.runId,
          timestamp: result.startedAt.toISOString(),
          applied: result.patchesApplied,
          skipped: result.patchesSkipped,
          failed: result.patchesFailed,
          costUsd: result.totalCostUsd,
          patches: result.patches.map((p) => ({
            slug: p.slug,
            status: p.status,
            reason: p.reason,
          })),
        }),
      },
    });
  } catch (err: any) {
    console.error(`[kb-inject] Failed to persist run result: ${err?.message}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function runOnce(): Promise<void> {
  const env = loadEnv(process.env);

  if (env.KB_INJECTION_ENABLED !== "true") {
    console.log("[kb-inject] Disabled (set KB_INJECTION_ENABLED=true to enable)");
    return;
  }

  const dryRun = (env as any).KB_INJECTION_DRY_RUN === "true";
  const maxPerRun = Number((env as any).KB_INJECTION_MAX_PER_RUN ?? 10);
  if (dryRun) console.log("[kb-inject] DRY RUN MODE — no files will be modified");

  const result = await runInjectionPipeline(dryRun, maxPerRun);

  await persistRunResult(result);

  if (result.patchesApplied > 0 || result.patchesFailed > 0) {
    await sendSlackReport(result);
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

const env = loadEnv(process.env);
const cron = (env as any).KB_INJECTION_CRON ?? "0 3 * * *";

console.log(`[kb-inject] Worker started. Cron: ${cron}. Enabled: ${env.KB_INJECTION_ENABLED ?? "false"}`);

if (process.argv.includes("--now")) {
  console.log("[kb-inject] --now flag: running immediately");
  runOnce()
    .then(() => {
      console.log("[kb-inject] Immediate run complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[kb-inject] Immediate run failed:", err);
      process.exit(1);
    });
} else {
  (async () => {
    while (true) {
      const waitMs = msUntilNextRun(cron);
      console.log(`[kb-inject] Next run in ${(waitMs / 1000 / 60).toFixed(0)} minutes`);
      await new Promise((r) => setTimeout(r, waitMs));

      try {
        await runOnce();
      } catch (err: any) {
        console.error(`[kb-inject] Run error: ${err?.message ?? err}`);
      }
    }
  })();
}
