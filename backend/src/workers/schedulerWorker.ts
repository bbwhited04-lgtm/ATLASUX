/**
 * Scheduler Worker — fires scheduled intents (cron-style) without an external cron service.
 *
 * Each scheduled job has:
 *   - id          unique key (used to prevent duplicate fires)
 *   - intentType  queued on the engine
 *   - payload     passed to the workflow
 *   - hourUTC     hour (0-23) at which to fire each day
 *   - minuteUTC   minute (0-59) at which to fire (default 0)
 *   - enabled     env-var flag name, truthy string enables
 *
 * De-duplication: stores last-fired date (YYYY-MM-DD) in system_state under
 * the key "scheduler:{id}". Won't fire twice in the same UTC day.
 *
 * Env:
 *   SCHEDULER_POLL_MS             poll interval in ms (default 60 000)
 *   DAILY_BRIEF_HOUR_UTC          hour to send daily brief (default 8)
 *   DAILY_BRIEF_MINUTE_UTC        minute (default 30)
 *   BINKY_RESEARCH_HOUR_UTC       hour for Binky research digest (default 6)
 *   SCHEDULER_ENABLED             set to "false" to disable all scheduled jobs
 */

import { prisma } from "../db/prisma.js";
import { getSystemState, setSystemState } from "../services/systemState.js";

const POLL_MS = Math.max(15_000, Number(process.env.SCHEDULER_POLL_MS ?? 60_000));
const TENANT_ID = process.env.TENANT_ID ?? "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

type ScheduledJob = {
  id: string;
  label: string;
  agentId: string;
  workflowId: string;
  payload: Record<string, unknown>;
  hourUTC: number;
  minuteUTC: number;
};

function buildJobs(): ScheduledJob[] {
  return [
    {
      id: "daily-brief",
      label: "Daily Executive Brief (WF-010)",
      agentId: "binky",
      workflowId: "WF-010",
      payload: { triggeredBy: "scheduler" },
      hourUTC: Number(process.env.DAILY_BRIEF_HOUR_UTC ?? 8),
      minuteUTC: Number(process.env.DAILY_BRIEF_MINUTE_UTC ?? 30),
    },
    {
      id: "binky-research",
      label: "Binky Daily Research Digest (WF-031)",
      agentId: "binky",
      workflowId: "WF-031",
      payload: { triggeredBy: "scheduler" },
      hourUTC: Number(process.env.BINKY_RESEARCH_HOUR_UTC ?? 6),
      minuteUTC: 0,
    },
  ];
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function getLastFired(jobId: string): Promise<string | null> {
  try {
    const row = await getSystemState(`scheduler:${jobId}`);
    const v = row?.value;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return (v as any).lastFiredDate ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

async function markFired(jobId: string, date: string) {
  await setSystemState(`scheduler:${jobId}`, { lastFiredDate: date });
}

async function fireJob(job: ScheduledJob) {
  const intent = await prisma.intent.create({
    data: {
      tenantId: TENANT_ID,
      agentId: null,
      intentType: "ENGINE_RUN",
      payload: JSON.parse(JSON.stringify({
        agentId: job.agentId,
        workflowId: job.workflowId,
        input: job.payload,
        traceId: `scheduler-${job.id}-${todayUTC()}`,
        requestedBy: TENANT_ID,
      })),
      status: "DRAFT",
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: TENANT_ID,
      actorType: "system",
      actorUserId: null,
      actorExternalId: "scheduler",
      level: "info",
      action: "SCHEDULER_JOB_FIRED",
      entityType: "intent",
      entityId: intent.id,
      message: `Scheduler fired ${job.label}`,
      meta: { jobId: job.id, workflowId: job.workflowId, agentId: job.agentId, intentId: intent.id },
      timestamp: new Date(),
    },
  }).catch(() => null);

  console.log(`[schedulerWorker] Fired "${job.label}" → intent ${intent.id}`);
}

async function tick() {
  if (process.env.SCHEDULER_ENABLED === "false") return;

  const now = new Date();
  const hourNow = now.getUTCHours();
  const minuteNow = now.getUTCMinutes();
  const dateNow = todayUTC();

  for (const job of buildJobs()) {
    // Only fire within the target minute window
    if (hourNow !== job.hourUTC) continue;
    if (Math.abs(minuteNow - job.minuteUTC) > 1) continue;

    const lastFired = await getLastFired(job.id);
    if (lastFired === dateNow) continue; // already fired today

    try {
      await fireJob(job);
      await markFired(job.id, dateNow);
    } catch (err: any) {
      console.error(`[schedulerWorker] Failed to fire "${job.label}": ${err?.message ?? err}`);
    }
  }
}

console.log(`[schedulerWorker] Starting. Polling every ${POLL_MS / 1000}s`);
console.log(`[schedulerWorker] Daily Brief fires at ${process.env.DAILY_BRIEF_HOUR_UTC ?? 8}:${String(process.env.DAILY_BRIEF_MINUTE_UTC ?? 30).padStart(2, "0")} UTC`);
console.log(`[schedulerWorker] Binky Research fires at ${process.env.BINKY_RESEARCH_HOUR_UTC ?? 6}:00 UTC`);

async function run() {
  try { await tick(); } catch (err) { console.error("[schedulerWorker] tick error:", err); }
}

run();
setInterval(run, POLL_MS);
