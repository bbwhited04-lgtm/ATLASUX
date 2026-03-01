/**
 * browserRoutes.ts — Browser automation REST API (governed by SGL).
 *
 * Routes:
 *   GET  /v1/browser/sessions              — list sessions (tenant-scoped)
 *   GET  /v1/browser/sessions/:id          — session detail with actions + screenshots
 *   POST /v1/browser/sessions              — create a browser task (creates intent + decision memo)
 *   POST /v1/browser/sessions/:id/approve  — approve paused session's pending action
 *   POST /v1/browser/sessions/:id/cancel   — cancel running/paused session
 *
 * All endpoints gated with enforceFeatureAccess(userId, tenantId, "Browser") — pro/enterprise only.
 */

import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { enforceFeatureAccess } from "../lib/seatEnforcement.js";
import {
  evaluateBrowserIntent,
  validateSessionConfig,
  createBrowserSessionMemo,
} from "../tools/browser/browserGovernance.js";
import {
  calculateSessionRiskTier,
  BROWSER_LIMITS,
  type BrowserActionStep,
  type BrowserSessionConfig,
} from "../tools/browser/browserActions.js";
import { executeBrowserSession, resumeBrowserSession } from "../tools/browser/browserService.js";

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const ActionStepSchema = z.object({
  type: z.enum(["navigate", "click", "type", "extract", "screenshot", "submit", "scroll"]),
  target: z.string().optional(),
  value: z.string().optional(),
  description: z.string().min(1).max(500),
});

const CreateSessionBody = z.object({
  targetUrl: z.string().url(),
  purpose: z.string().min(1).max(1000),
  agentId: z.string().min(1).max(50),
  actions: z.array(ActionStepSchema).min(1).max(BROWSER_LIMITS.MAX_ACTIONS_PER_SESSION),
});

// ── Routes ───────────────────────────────────────────────────────────────────

export const browserRoutes: FastifyPluginAsync = async (app) => {

  // GET /sessions — list browser sessions for tenant
  app.get("/sessions", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId   = (req as any).auth?.userId as string;
    if (!tenantId || !userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const access = await enforceFeatureAccess(userId, tenantId, "Browser");
    if (!access.allowed) return reply.code(403).send({ ok: false, error: access.reason });

    const sessions = await prisma.browserSession.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        agentId: true,
        targetUrl: true,
        purpose: true,
        status: true,
        riskTier: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        _count: { select: { actions: true } },
      },
    });

    return reply.send({ ok: true, sessions });
  });

  // GET /sessions/:id — session detail with actions
  app.get("/sessions/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId   = (req as any).auth?.userId as string;
    if (!tenantId || !userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const access = await enforceFeatureAccess(userId, tenantId, "Browser");
    if (!access.allowed) return reply.code(403).send({ ok: false, error: access.reason });

    const { id } = req.params as { id: string };

    const session = await prisma.browserSession.findFirst({
      where: { id, tenantId },
      include: { actions: { orderBy: { executedAt: "asc" } } },
    });

    if (!session) return reply.code(404).send({ ok: false, error: "Session not found" });
    return reply.send({ ok: true, session });
  });

  // POST /sessions — create a browser task
  app.post("/sessions", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId   = (req as any).auth?.userId as string;
    if (!tenantId || !userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const access = await enforceFeatureAccess(userId, tenantId, "Browser");
    if (!access.allowed) return reply.code(403).send({ ok: false, error: access.reason });

    // Parse body
    let body: z.infer<typeof CreateSessionBody>;
    try {
      body = CreateSessionBody.parse(req.body);
    } catch (e: any) {
      return reply.code(400).send({ ok: false, error: "Invalid request body", details: e.errors });
    }

    const config: BrowserSessionConfig = {
      tenantId,
      agentId: body.agentId,
      intentId: "", // will be set after intent creation
      targetUrl: body.targetUrl,
      purpose: body.purpose,
      actions: body.actions as BrowserActionStep[],
    };

    // Validate session config (URL blocklist, action limits, blocked actions)
    const validation = validateSessionConfig(config);
    if (!validation.valid) {
      return reply.code(400).send({ ok: false, error: "Validation failed", details: validation.errors });
    }

    // SGL evaluation — browser tasks always require REVIEW
    const sglResult = evaluateBrowserIntent(config);
    if (sglResult.decision === "BLOCK") {
      return reply.code(403).send({ ok: false, error: "Blocked by SGL", reasons: sglResult.reasons });
    }

    // Create intent record for audit trail
    const riskTier = calculateSessionRiskTier(body.actions as BrowserActionStep[]);
    const intent = await prisma.intent.create({
      data: {
        tenantId,
        intentType: "BROWSER_TASK",
        sglResult: sglResult.decision,
        status: "PROPOSED",
        payload: {
          targetUrl: body.targetUrl,
          purpose: body.purpose,
          agentId: body.agentId,
          actions: body.actions,
          riskTier,
        },
      },
    });

    config.intentId = intent.id;

    // Create decision memo for human approval
    const session = await prisma.browserSession.create({
      data: {
        tenantId,
        intentId: intent.id,
        agentId: body.agentId,
        targetUrl: body.targetUrl,
        purpose: body.purpose,
        status: "pending",
        riskTier,
      },
    });

    const memoId = await createBrowserSessionMemo(tenantId, session.id, config);

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        actorExternalId: body.agentId,
        actorType: "user",
        level: "info",
        action: "BROWSER_SESSION_REQUESTED",
        entityType: "browser_session",
        entityId: session.id,
        message: `Browser session requested: ${body.purpose} on ${body.targetUrl}`,
        meta: {
          intentId: intent.id,
          memoId,
          riskTier,
          actionCount: body.actions.length,
        },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return reply.code(202).send({
      ok: true,
      status: "pending_approval",
      sessionId: session.id,
      intentId: intent.id,
      memoId,
      message: "Browser session created. Decision memo requires human approval before execution.",
    });
  });

  // POST /sessions/:id/approve — approve and execute a pending session
  app.post("/sessions/:id/approve", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId   = (req as any).auth?.userId as string;
    if (!tenantId || !userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const access = await enforceFeatureAccess(userId, tenantId, "Browser");
    if (!access.allowed) return reply.code(403).send({ ok: false, error: access.reason });

    const { id } = req.params as { id: string };

    const session = await prisma.browserSession.findFirst({
      where: { id, tenantId },
    });

    if (!session) return reply.code(404).send({ ok: false, error: "Session not found" });

    if (session.status === "pending") {
      // Full session approval — execute the session
      const sessionResult = session.result as any;

      // Reconstruct config from the intent
      const intent = session.intentId
        ? await prisma.intent.findUnique({ where: { id: session.intentId } })
        : null;

      if (!intent) return reply.code(400).send({ ok: false, error: "Associated intent not found" });

      const payload = intent.payload as any;
      const config: BrowserSessionConfig = {
        tenantId,
        agentId: session.agentId,
        intentId: intent.id,
        targetUrl: session.targetUrl,
        purpose: session.purpose,
        actions: payload.actions ?? [],
      };

      // Audit the approval
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: userId,
          actorExternalId: "human",
          actorType: "user",
          level: "info",
          action: "BROWSER_SESSION_APPROVED",
          entityType: "browser_session",
          entityId: id,
          message: `Browser session approved by ${userId}`,
          meta: { sessionId: id, intentId: intent.id },
          timestamp: new Date(),
        },
      }).catch(() => null);

      // Delete the pending record and execute fresh
      await prisma.browserSession.delete({ where: { id } });

      // Execute asynchronously — return immediately
      executeBrowserSession(config).catch((err) => {
        console.error("Browser session execution failed:", err);
      });

      return reply.send({
        ok: true,
        status: "executing",
        message: "Browser session approved and execution started.",
      });
    }

    if (session.status === "paused_approval") {
      // Resume paused session after action approval
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: userId,
          actorExternalId: "human",
          actorType: "user",
          level: "info",
          action: "BROWSER_ACTION_APPROVED",
          entityType: "browser_session",
          entityId: id,
          message: `Browser action approved by ${userId} — resuming session`,
          meta: { sessionId: id },
          timestamp: new Date(),
        },
      }).catch(() => null);

      resumeBrowserSession(id).catch((err) => {
        console.error("Browser session resume failed:", err);
      });

      return reply.send({
        ok: true,
        status: "resuming",
        message: "Browser action approved. Session resuming.",
      });
    }

    return reply.code(400).send({
      ok: false,
      error: `Session is ${session.status}. Only pending or paused_approval sessions can be approved.`,
    });
  });

  // POST /sessions/:id/cancel — cancel a running/paused session
  app.post("/sessions/:id/cancel", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId   = (req as any).auth?.userId as string;
    if (!tenantId || !userId) return reply.code(401).send({ ok: false, error: "Unauthorized" });

    const access = await enforceFeatureAccess(userId, tenantId, "Browser");
    if (!access.allowed) return reply.code(403).send({ ok: false, error: access.reason });

    const { id } = req.params as { id: string };

    const session = await prisma.browserSession.findFirst({
      where: { id, tenantId },
    });

    if (!session) return reply.code(404).send({ ok: false, error: "Session not found" });

    if (session.status === "completed" || session.status === "failed") {
      return reply.code(400).send({ ok: false, error: `Session already ${session.status}` });
    }

    await prisma.browserSession.update({
      where: { id },
      data: {
        status: "failed",
        result: { ...(session.result as any), cancelled: true, cancelledBy: userId },
        finishedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        actorExternalId: "human",
        actorType: "user",
        level: "info",
        action: "BROWSER_SESSION_CANCELLED",
        entityType: "browser_session",
        entityId: id,
        message: `Browser session cancelled by ${userId}`,
        meta: { sessionId: id },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return reply.send({ ok: true, status: "cancelled", message: "Browser session cancelled." });
  });
};
