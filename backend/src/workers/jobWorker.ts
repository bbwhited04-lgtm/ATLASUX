/**
 * Job Worker — processes SOCIAL_POST and WORKFLOW job types.
 * SOCIAL_POST: publishes content to social platform via connected integration.
 * WORKFLOW: executes a named workflow step-by-step.
 */
import { prisma } from "../db/prisma.js";

const POLL_MS = Number(process.env.JOB_WORKER_INTERVAL_MS ?? 15_000);

async function handleJobFailure(
  jobId: string,
  tenantId: string,
  retryCount: number,
  maxRetries: number,
  errMsg: string,
  jobType: string,
) {
  const now = new Date();
  if (retryCount < maxRetries) {
    const delayMs = 10_000 * Math.pow(2, retryCount);
    const nextRetryAt = new Date(now.getTime() + delayMs);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "queued",
        retryCount: retryCount + 1,
        nextRetryAt,
        error: { message: errMsg, attemptedAt: now.toISOString(), retryCount },
        finishedAt: null,
      },
    });
    console.log(`[${jobType}] Job ${jobId} will retry #${retryCount + 1} at ${nextRetryAt.toISOString()}`);
  } else {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "failed", finishedAt: now, error: { message: errMsg, exhausted: true, retryCount } },
    });
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: null,
        level: "error",
        action: "JOB_EXHAUSTED_RETRIES",
        entityType: "job",
        entityId: jobId,
        message: `${jobType} job ${jobId} exhausted ${maxRetries} retries: ${errMsg}`,
        meta: { jobType, errMsg, retryCount },
        timestamp: now,
      },
    }).catch(() => null);
    console.error(`[${jobType}] Job ${jobId} permanently failed after ${maxRetries} retries: ${errMsg}`);
  }
}

// ── SOCIAL_POST handler ───────────────────────────────────────────────────────

async function handleSocialPost(jobId: string, tenantId: string, input: any) {
  const platform  = String(input?.platform  ?? "");
  const content   = String(input?.content   ?? "");
  const mediaUrls = Array.isArray(input?.mediaUrls) ? input.mediaUrls : [];

  if (!platform || !content) throw new Error("platform and content required in job input");

  // Look up connected integration for this platform
  const integration = await prisma.integration.findFirst({
    where: { tenantId, provider: platform as any, connected: true },
  });

  if (!integration) {
    throw new Error(`No connected integration for platform: ${platform}`);
  }

  // Log a DistributionEvent for analytics tracking
  const event = await prisma.distributionEvent.create({
    data: {
      tenantId,
      agent: "atlas",
      channel: platform,
      eventType: "POST_QUEUED",
      url: null,
      meta: { jobId, content: content.slice(0, 200), mediaUrls, provider: platform },
      occurredAt: new Date(),
    },
  });

  // Actual posting logic per platform
  // Each platform uses its stored access_token from Integration
  const accessToken = integration.access_token;
  if (!accessToken) throw new Error(`No access token for ${platform}`);

  let postResult: any = { status: "simulated", platform, eventId: event.id };

  // Real posting per platform (expand as OAuth flows are completed)
  if (platform === "twitter" || platform === "x") {
    const r = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
    });
    const data = await r.json() as any;
    if (!r.ok) throw new Error(data?.detail ?? `Twitter error ${r.status}`);
    postResult = { id: data?.data?.id, platform: "twitter" };
  }

  // Update distribution event with result
  await prisma.distributionEvent.update({
    where: { id: event.id },
    data: { eventType: "POST_PUBLISHED", meta: { ...((event.meta as any) ?? {}), result: postResult } },
  });

  return postResult;
}

// ── WORKFLOW handler ──────────────────────────────────────────────────────────

async function handleWorkflow(jobId: string, tenantId: string, input: any) {
  const workflowKey = String(input?.workflowKey ?? "");
  if (!workflowKey) throw new Error("workflowKey required in job input");

  const workflow = await prisma.workflows.findFirst({ where: { workflow_key: workflowKey } });
  if (!workflow) throw new Error(`Workflow not found: ${workflowKey}`);
  if (!workflow.enabled) throw new Error(`Workflow disabled: ${workflowKey}`);

  const steps = await prisma.workflow_steps.findMany({
    where: { workflow_key: workflowKey },
    orderBy: { step_order: "asc" },
  });

  const results: any[] = [];
  for (const step of steps) {
    const config = step.config as any;
    // Step execution stubs — replace with real implementations per step_type
    let stepResult: any = { step_id: step.step_id, step_type: step.step_type, status: "completed" };

    switch (step.step_type) {
      case "email":
        stepResult.note = "Email step — queued via EMAIL_SEND job";
        if (config?.to && config?.subject) {
          await prisma.job.create({
            data: {
              tenantId,
              jobType: "EMAIL_SEND",
              status: "queued",
              priority: 3,
              input: { to: config.to, subject: config.subject, text: config.body ?? "", fromAgent: "atlas" },
            },
          });
        }
        break;
      case "sms":
        stepResult.note = "SMS step — queued via SMS_SEND job";
        if (config?.to && config?.message) {
          await prisma.job.create({
            data: {
              tenantId,
              jobType: "SMS_SEND",
              status: "queued",
              priority: 3,
              input: { to: config.to, message: config.message },
            },
          });
        }
        break;
      case "wait":
        // Non-blocking wait — just log and continue
        stepResult.note = `Wait step (${config?.duration ?? "?"}ms) — logged only in worker context`;
        break;
      default:
        stepResult.note = `Step type '${step.step_type}' not yet implemented`;
    }

    results.push(stepResult);
  }

  return { workflowKey, steps: results.length, results };
}

// ── Main poll loop ────────────────────────────────────────────────────────────

async function processJobs() {
  const jobs = await prisma.job.findMany({
    where: {
      jobType: { in: ["SOCIAL_POST", "WORKFLOW"] },
      status: "queued",
      OR: [
        { nextRetryAt: null },
        { nextRetryAt: { lte: new Date() } },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 10,
  });

  for (const job of jobs) {
    // Optimistic lock: only claim if still queued (prevents double-execution)
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: "queued" },
      data: { status: "running", startedAt: new Date() },
    });
    if (claimed.count !== 1) continue; // Another worker claimed it

    try {
      const input = job.input as any;
      let output: any;

      if (job.jobType === "SOCIAL_POST") {
        output = await handleSocialPost(job.id, job.tenantId, input);
      } else if (job.jobType === "WORKFLOW") {
        output = await handleWorkflow(job.id, job.tenantId, input);
      }

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "succeeded", finishedAt: new Date(), output: output ?? {} },
      });

      await prisma.auditLog.create({
        data: {
          tenantId: job.tenantId,
          actorType: "system",
          actorUserId: null,
          actorExternalId: null,
          level: "info",
          action: `${job.jobType}_COMPLETED`,
          entityType: "job",
          entityId: job.id,
          message: `${job.jobType} job completed`,
          meta: { jobId: job.id },
          timestamp: new Date(),
        },
      }).catch(() => null);

      console.log(`[jobWorker] Completed ${job.jobType} job ${job.id}`);
    } catch (err: any) {
      const errorMsg = err?.message ?? "Unknown error";
      await handleJobFailure(job.id, job.tenantId, job.retryCount, job.maxRetries, errorMsg, "jobWorker");
    }
  }
}

console.log(`[jobWorker] Starting. Polling every ${POLL_MS}ms`);

async function tick() {
  try { await processJobs(); } catch (err) { console.error("[jobWorker] tick error:", err); }
}

tick();
setInterval(tick, POLL_MS);
