/**
 * Watchdog Worker — periodic health checks for self-healing.
 *
 * Runs every WATCHDOG_POLL_MS (default 120s) and performs:
 *   A. Stuck running jobs → requeue or fail
 *   B. Stuck validating intents → reset to DRAFT
 *   C. Engine liveness → alert if stale
 *   D. Failed job spike detection → alert if systemic
 *   E. LLM provider health → alert on open circuits
 *   F. OAuth token expiry sweep → proactive refresh
 *
 * Env:
 *   WATCHDOG_POLL_MS          (default 120000 = 2 min)
 *   TELEGRAM_ADMIN_CHAT_ID    (required for alerts)
 *   WATCHDOG_STUCK_JOB_MIN    (default 15)
 *   WATCHDOG_STUCK_INTENT_MIN (default 10)
 *   WATCHDOG_ENGINE_STALE_MIN (default 5)
 *   WATCHDOG_FAILURE_THRESHOLD (default 10)
 */
import { prisma } from "../db/prisma.js";
import { getSystemState } from "../services/systemState.js";
import { sendTelegramDirect } from "../lib/telegramNotify.js";
import { handleJobFailure } from "../lib/jobFailureHandler.js";
import * as circuitBreaker from "../lib/circuitBreaker.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function asObj(v: unknown): Record<string, any> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as any) : {};
}

// ── Config ────────────────────────────────────────────────────────────────────

const POLL_MS = Math.max(10_000, Number(process.env.WATCHDOG_POLL_MS ?? 120_000));
const STUCK_JOB_MINUTES = Number(process.env.WATCHDOG_STUCK_JOB_MIN ?? 15);
const STUCK_INTENT_MINUTES = Number(process.env.WATCHDOG_STUCK_INTENT_MIN ?? 10);
const ENGINE_STALE_MINUTES = Number(process.env.WATCHDOG_ENGINE_STALE_MIN ?? 5);
const FAILURE_SPIKE_THRESHOLD = Number(process.env.WATCHDOG_FAILURE_THRESHOLD ?? 10);
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes between repeated alerts

const adminChatId = String(process.env.TELEGRAM_ADMIN_CHAT_ID ?? "").trim();

// ── Alert throttling ──────────────────────────────────────────────────────────

const lastAlertAt = new Map<string, number>();

function shouldAlert(checkName: string): boolean {
  const last = lastAlertAt.get(checkName) ?? 0;
  return Date.now() - last >= ALERT_COOLDOWN_MS;
}

function markAlerted(checkName: string): void {
  lastAlertAt.set(checkName, Date.now());
}

async function alert(checkName: string, message: string, level: "WARN" | "CRITICAL" = "WARN"): Promise<void> {
  if (!shouldAlert(checkName)) return;
  markAlerted(checkName);

  const prefix = level === "CRITICAL" ? "🚨 CRITICAL" : "⚠️ WARN";
  const text = `[WATCHDOG] ${prefix}: ${message}`;

  // Always log
  process.stderr.write(`${text}\n`);

  // Send Telegram if configured
  if (adminChatId) {
    await sendTelegramDirect(adminChatId, text, "").catch(() => null);
  }
}

async function writeAudit(action: string, message: string, meta?: Record<string, any>): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorType: "system",
      actorUserId: null,
      actorExternalId: "watchdog",
      level: "info",
      action,
      entityType: "system",
      entityId: null,
      message,
      meta: meta ?? {},
      timestamp: new Date(),
    },
  }).catch(() => null);
}

// ── Check A: Stuck Running Jobs ───────────────────────────────────────────────

async function checkStuckJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STUCK_JOB_MINUTES * 60 * 1000);

  const stuckJobs = await prisma.job.findMany({
    where: {
      status: "running",
      startedAt: { lt: cutoff },
    },
    select: { id: true, tenantId: true, jobType: true, retryCount: true, maxRetries: true, startedAt: true },
    take: 50,
  });

  for (const job of stuckJobs) {
    if (job.retryCount < job.maxRetries) {
      // Requeue with retry
      await handleJobFailure(
        job.id,
        job.tenantId,
        job.retryCount,
        job.maxRetries,
        `Watchdog: job stuck in running for >${STUCK_JOB_MINUTES}min`,
        job.jobType,
      );
      await writeAudit("WATCHDOG_REQUEUED_STUCK_JOB", `Requeued stuck ${job.jobType} job ${job.id}`, {
        jobId: job.id,
        jobType: job.jobType,
        stuckSince: job.startedAt?.toISOString(),
      });
    } else {
      // Exhausted — mark failed
      await handleJobFailure(
        job.id,
        job.tenantId,
        job.retryCount,
        job.maxRetries,
        `Watchdog: job stuck + retries exhausted`,
        job.jobType,
      );
      await alert("stuck_job_exhausted", `${job.jobType} job ${job.id.slice(0, 8)} stuck and retries exhausted`);
    }
  }

  if (stuckJobs.length > 0) {
    console.log(`[watchdog] Recovered ${stuckJobs.length} stuck job(s)`);
  }
}

// ── Check B: Stuck Validating Intents ─────────────────────────────────────────

async function checkStuckIntents(): Promise<void> {
  const cutoff = new Date(Date.now() - STUCK_INTENT_MINUTES * 60 * 1000);

  const stuck = await prisma.$queryRaw<{ id: string; updated_at: Date }[]>`
    UPDATE intents
    SET status = 'DRAFT'
    WHERE status = 'VALIDATING'
      AND updated_at < ${cutoff}
    RETURNING id, updated_at
  `;

  for (const intent of stuck) {
    await writeAudit("WATCHDOG_RESET_STUCK_INTENT", `Reset stuck intent ${intent.id} from VALIDATING to DRAFT`, {
      intentId: intent.id,
      stuckSince: intent.updated_at?.toISOString(),
    });
  }

  if (stuck.length > 0) {
    console.log(`[watchdog] Reset ${stuck.length} stuck intent(s) to DRAFT`);
  }
}

// ── Check C: Engine Liveness ──────────────────────────────────────────────────

async function checkEngineLiveness(): Promise<void> {
  const row = await getSystemState("atlas_online");
  const val = asObj(row?.value);

  const engineEnabled = Boolean(val.engine_enabled ?? val.online ?? false);
  if (!engineEnabled) return; // engine is intentionally off

  const lastTickAt = val.last_tick_at ? new Date(val.last_tick_at) : null;
  if (!lastTickAt) return; // never ticked — probably first boot

  const staleMins = (Date.now() - lastTickAt.getTime()) / 60_000;
  if (staleMins > ENGINE_STALE_MINUTES) {
    await writeAudit("WATCHDOG_ENGINE_STALE", `Engine last ticked ${staleMins.toFixed(1)} min ago (threshold: ${ENGINE_STALE_MINUTES}min)`, {
      lastTickAt: lastTickAt.toISOString(),
      staleMinutes: Math.round(staleMins),
    });
    await alert("engine_stale", `Engine loop stale — last tick ${staleMins.toFixed(0)}min ago. May need restart.`);
  }
}

// ── Check D: Failed Job Spike ─────────────────────────────────────────────────

async function checkFailureSpike(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.job.count({
    where: {
      status: "failed",
      finishedAt: { gt: oneHourAgo },
    },
  });

  if (result >= FAILURE_SPIKE_THRESHOLD) {
    await writeAudit("WATCHDOG_FAILURE_SPIKE", `${result} failed jobs in the last hour (threshold: ${FAILURE_SPIKE_THRESHOLD})`, {
      failedCount: result,
      threshold: FAILURE_SPIKE_THRESHOLD,
    });
    await alert("failure_spike", `${result} jobs failed in the last hour — possible systemic issue`);
  }
}

// ── Check E: LLM Provider Health ──────────────────────────────────────────────

async function checkProviderHealth(): Promise<void> {
  const state = circuitBreaker.getState();
  const openProviders: string[] = [];

  for (const [provider, info] of Object.entries(state)) {
    if (info.state === "OPEN") {
      openProviders.push(provider);

      // Alert if open for > 30 min
      if (info.openedAt) {
        const openMins = (Date.now() - new Date(info.openedAt).getTime()) / 60_000;
        if (openMins > 30) {
          await alert(`provider_open_${provider}`, `LLM provider ${provider} circuit OPEN for ${openMins.toFixed(0)}min (${info.consecutiveFailures} failures)`);
        }
      }
    }
  }

  if (openProviders.length > 0 && openProviders.length === Object.keys(state).length && Object.keys(state).length > 0) {
    await writeAudit("WATCHDOG_ALL_PROVIDERS_DOWN", `All ${openProviders.length} LLM providers are circuit-open`, {
      providers: openProviders,
    });
    await alert("all_providers_down", `ALL LLM providers are down: ${openProviders.join(", ")}`, "CRITICAL");
  }
}

// ── Check F: OAuth Token Expiry Sweep ─────────────────────────────────────────

async function checkExpiringTokens(): Promise<void> {
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
  const now = new Date();

  // Find tokens expiring within 1 hour that haven't expired yet
  const expiring = await prisma.$queryRaw<{ id: string; tenant_id: string; provider: string; expires_at: Date }[]>`
    SELECT id, tenant_id, provider, expires_at
    FROM token_vault
    WHERE expires_at IS NOT NULL
      AND expires_at > ${now}
      AND expires_at < ${oneHourFromNow}
    LIMIT 20
  `;

  for (const token of expiring) {
    try {
      // Dynamic import to avoid circular dependency
      const { refreshTokenIfNeeded } = await import("../lib/tokenLifecycle.js");
      await refreshTokenIfNeeded(process.env as any, token.tenant_id, token.provider as any);
      console.log(`[watchdog] Proactively refreshed ${token.provider} token for tenant ${token.tenant_id.slice(0, 8)}`);
    } catch (err: any) {
      await writeAudit("WATCHDOG_TOKEN_REFRESH_FAILED", `Failed to refresh ${token.provider} token: ${err?.message}`, {
        tokenId: token.id,
        tenantId: token.tenant_id,
        provider: token.provider,
      });
      await alert(`token_refresh_${token.provider}`, `Failed to refresh ${token.provider} OAuth token for tenant ${token.tenant_id.slice(0, 8)}`);
    }
  }
}

// ── Main Loop ─────────────────────────────────────────────────────────────────

async function tick(): Promise<void> {
  try { await checkStuckJobs(); } catch (e: any) { console.error("[watchdog] checkStuckJobs error:", e?.message); }
  try { await checkStuckIntents(); } catch (e: any) { console.error("[watchdog] checkStuckIntents error:", e?.message); }
  try { await checkEngineLiveness(); } catch (e: any) { console.error("[watchdog] checkEngineLiveness error:", e?.message); }
  try { await checkFailureSpike(); } catch (e: any) { console.error("[watchdog] checkFailureSpike error:", e?.message); }
  try { await checkProviderHealth(); } catch (e: any) { console.error("[watchdog] checkProviderHealth error:", e?.message); }
  try { await checkExpiringTokens(); } catch (e: any) { console.error("[watchdog] checkExpiringTokens error:", e?.message); }
}

async function main() {
  let stopping = false;
  const stop = () => { stopping = true; };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  console.log(`[watchdog] Starting. Polling every ${POLL_MS / 1000}s`);
  if (!adminChatId) {
    console.log("[watchdog] TELEGRAM_ADMIN_CHAT_ID not set — alerts will only log to stderr");
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (stopping) {
      process.stdout.write("[watchdog] stopping\n");
      process.exit(0);
    }

    await tick();
    await sleep(POLL_MS);
  }
}

main().catch((e) => {
  process.stderr.write(`[watchdog] fatal: ${e?.message ?? e}\n`);
  process.exit(1);
});
