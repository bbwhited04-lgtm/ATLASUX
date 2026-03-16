import { FastifyPluginAsync } from "fastify";
import { prisma, withTenant } from "../db/prisma.js";
import { randomBytes } from "node:crypto";
import { hasPremiumAccess, type SeatTier } from "../lib/seatLimits.js";
import { getSystemState, setSystemState } from "../services/systemState.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sanitizeError } from "../lib/sanitizeError.js";

const s3 = new S3Client({ region: "us-east-1" });
const S3_BUCKET = process.env.S3_BUCKET ?? "atlasux-files";

/**
 * Local Vision Agent API — endpoints for a locally-running vision agent
 * that polls for LOCAL_VISION_TASK jobs and executes them via Playwright CDP.
 *
 * Auth model:
 *   POST /register — normal JWT (user must be pro/enterprise)
 *   All others   — Bearer local:{tenantId}:{key}
 */

const SYSTEM_STATE_KEY_PREFIX = "local_agent_";
const SCREENSHOT_BUCKET = "browser-screenshots";

// ── Helpers ──────────────────────────────────────────────────────────────────

function localAgentStateKey(tenantId: string) {
  return `${SYSTEM_STATE_KEY_PREFIX}${tenantId}`;
}

async function validateLocalAgentAuth(
  authHeader: string | undefined,
): Promise<{ tenantId: string; valid: boolean; reason?: string }> {
  if (!authHeader) return { tenantId: "", valid: false, reason: "Missing Authorization header" };

  const match = authHeader.match(/^Bearer\s+local:([^:]+):(.+)$/i);
  if (!match) return { tenantId: "", valid: false, reason: "Invalid local agent token format" };

  const [, tenantId, key] = match;

  const row = await getSystemState(localAgentStateKey(tenantId));
  if (!row?.value) return { tenantId, valid: false, reason: "No local agent registered for this tenant" };

  const stored = row.value as Record<string, any>;
  if (stored.api_key !== key) return { tenantId, valid: false, reason: "Invalid API key" };

  return { tenantId, valid: true };
}

async function enforceFeatureAccess(
  userId: string,
  tenantId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const member = await withTenant(tenantId, async (tx) => {
      return tx.tenantMember.findFirst({
        where: { tenantId, userId },
        select: { seatType: true },
      });
    });
    if (!member) return { allowed: false, reason: "Not a member of this tenant" };
    const tier = (member.seatType ?? "free_beta") as SeatTier;
    if (!hasPremiumAccess(tier)) {
      return { allowed: false, reason: "Local Vision Agent requires a Pro or Enterprise subscription" };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, reason: "Could not verify subscription tier" };
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

export const localAgentRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /register — Generate tenant-scoped API key ────────────────────
  app.post("/register", async (request, reply) => {
    const tenantId = (request.headers["x-tenant-id"] as string ?? "").trim();
    const userId = (request as any).auth?.userId ?? "";

    if (!tenantId) return reply.code(400).send({ ok: false, error: "x-tenant-id header required" });
    if (!userId) return reply.code(401).send({ ok: false, error: "Authentication required" });

    const access = await enforceFeatureAccess(userId, tenantId);
    if (!access.allowed) {
      return reply.code(403).send({ ok: false, error: access.reason });
    }

    const apiKey = randomBytes(32).toString("hex");

    await setSystemState(localAgentStateKey(tenantId), {
      api_key: apiKey,
      registered_at: new Date().toISOString(),
      registered_by: userId,
      online: false,
      last_heartbeat: null,
    });

    await withTenant(tenantId, async (tx) => {
      await tx.auditLog.create({
        data: {
          tenantId,
          actorType: "user",
          actorUserId: userId,
          actorExternalId: null,
          level: "info",
          action: "LOCAL_AGENT_REGISTERED",
          entityType: "system_state",
          entityId: localAgentStateKey(tenantId),
          message: "Local vision agent API key generated",
          meta: {},
          timestamp: new Date(),
        },
      } as any).catch(() => null);
    }).catch(() => null);

    return reply.send({
      ok: true,
      apiKey,
      tenantId,
      instructions: "Use Authorization: Bearer local:{tenantId}:{apiKey} for all subsequent requests.",
    });
  });

  // ── GET /claim — Claim next LOCAL_VISION_TASK job ──────────────────────
  app.get("/claim", async (request, reply) => {
    const auth = await validateLocalAgentAuth(request.headers.authorization);
    if (!auth.valid) return reply.code(401).send({ ok: false, error: auth.reason });

    const { tenantId } = auth;

    const result = await withTenant(tenantId, async (tx) => {
      const jobs = await tx.job.findMany({
        where: {
          tenantId,
          status: "queued",
          jobType: "LOCAL_VISION_TASK",
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: new Date() } },
          ],
        },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        take: 1,
      });

      if (!jobs.length) {
        return { job: null } as const;
      }

      const job = jobs[0];

      // Optimistic lock — claim the job
      const claimed = await tx.job.updateMany({
        where: { id: job.id, status: "queued" },
        data: { status: "running", startedAt: new Date() },
      });

      if (claimed.count !== 1) {
        return { job: null } as const;
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          actorType: "system",
          actorUserId: null,
          actorExternalId: "local_vision_agent",
          level: "info",
          action: "LOCAL_VISION_TASK_CLAIMED",
          entityType: "job",
          entityId: job.id,
          message: `Local vision agent claimed job ${job.id}`,
          meta: { jobType: job.jobType },
          timestamp: new Date(),
        },
      } as any).catch(() => null);

      return {
        job: {
          id: job.id,
          jobType: job.jobType,
          input: job.input,
          priority: job.priority,
          createdAt: job.createdAt,
        },
      } as const;
    });

    return reply.send({ ok: true, job: result.job });
  });

  // ── POST /heartbeat — Update online status ─────────────────────────────
  app.post("/heartbeat", async (request, reply) => {
    const auth = await validateLocalAgentAuth(request.headers.authorization);
    if (!auth.valid) return reply.code(401).send({ ok: false, error: auth.reason });

    const { tenantId } = auth;
    const row = await getSystemState(localAgentStateKey(tenantId));
    const existing = (row?.value ?? {}) as Record<string, any>;

    await setSystemState(localAgentStateKey(tenantId), {
      ...existing,
      online: true,
      last_heartbeat: new Date().toISOString(),
    });

    return reply.send({ ok: true, timestamp: new Date().toISOString() });
  });

  // ── POST /result/:jobId — Report job result ────────────────────────────
  app.post<{ Params: { jobId: string } }>("/result/:jobId", async (request, reply) => {
    const auth = await validateLocalAgentAuth(request.headers.authorization);
    if (!auth.valid) return reply.code(401).send({ ok: false, error: auth.reason });

    const { tenantId } = auth;
    const { jobId } = request.params;
    const body = request.body as Record<string, any> ?? {};

    const status = body.success ? "succeeded" : "failed";

    await withTenant(tenantId, async (tx) => {
      await tx.job.update({
        where: { id: jobId },
        data: {
          status,
          output: body.output ?? {},
          error: body.error ? { message: String(body.error) } : {},
          finishedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          actorType: "system",
          actorUserId: null,
          actorExternalId: "local_vision_agent",
          level: status === "succeeded" ? "info" : "error",
          action: `LOCAL_VISION_TASK_${status.toUpperCase()}`,
          entityType: "job",
          entityId: jobId,
          message: `Local vision task ${status}: ${String(body.summary ?? "").slice(0, 200)}`,
          meta: {
            jobId,
            status,
            actionsExecuted: body.actionsExecuted ?? 0,
            screenshotCount: body.screenshotCount ?? 0,
          },
          timestamp: new Date(),
        },
      });
    });

    return reply.send({ ok: true, status });
  });

  // ── POST /screenshot — Upload screenshot to S3 ─────────────────────────
  app.post("/screenshot", async (request, reply) => {
    const auth = await validateLocalAgentAuth(request.headers.authorization);
    if (!auth.valid) return reply.code(401).send({ ok: false, error: auth.reason });

    const { tenantId } = auth;
    const body = request.body as Record<string, any> ?? {};
    const { jobId, screenshot, filename } = body;

    if (!screenshot || !jobId) {
      return reply.code(400).send({ ok: false, error: "jobId and screenshot (base64) required" });
    }

    const buf = Buffer.from(screenshot, "base64");
    const fname = filename ?? `${jobId}_${Date.now()}.png`;
    const path = `${SCREENSHOT_BUCKET}/tenants/${tenantId}/${fname}`;

    try {
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: path,
        Body: buf,
        ContentType: "image/png",
      }));
    } catch (err: any) {
      app.log.error({ err }, "Local agent screenshot upload failed");
      return reply.code(500).send({ ok: false, error: `Upload failed: ${sanitizeError(err)}` });
    }

    let signedUrl: string | null = null;
    try {
      const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: path });
      signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    } catch { /* non-fatal */ }

    return reply.send({
      ok: true,
      path,
      signedUrl,
    });
  });

  // ── GET /status — Is local agent online? ───────────────────────────────
  app.get("/status", async (request, reply) => {
    const tenantId = (request.headers["x-tenant-id"] as string ?? "").trim();
    if (!tenantId) return reply.code(400).send({ ok: false, error: "x-tenant-id required" });

    const row = await getSystemState(localAgentStateKey(tenantId));
    if (!row?.value) {
      return reply.send({ ok: true, registered: false, online: false });
    }

    const state = row.value as Record<string, any>;
    const lastBeat = state.last_heartbeat ? new Date(state.last_heartbeat) : null;
    // Consider offline if no heartbeat in 60 seconds
    const online = lastBeat ? (Date.now() - lastBeat.getTime() < 60_000) : false;

    return reply.send({
      ok: true,
      registered: true,
      online,
      lastHeartbeat: state.last_heartbeat ?? null,
    });
  });
};
