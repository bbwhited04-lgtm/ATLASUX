import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { approveDecisionMemo, createDecisionMemo, rejectDecisionMemo } from "../services/decisionMemos.js";

const CreateMemoSchema = z.object({
  agent:            z.string().min(1).max(100),
  title:            z.string().min(1).max(500),
  rationale:        z.string().min(1).max(5000),
  estimatedCostUsd: z.number().nonnegative().optional(),
  billingType:      z.enum(["none", "one_time", "recurring"]).optional(),
  riskTier:         z.number().int().min(0).max(5).optional(),
  confidence:       z.number().min(0).max(1).optional(),
  expectedBenefit:  z.string().max(1000).optional(),
  payload:          z.unknown().optional(),
});

const APPROVE_RATE_LIMIT = { max: 10, timeWindow: "1 minute" };
const REJECT_RATE_LIMIT  = { max: 20, timeWindow: "1 minute" };

export const decisionRoutes: FastifyPluginAsync = async (app) => {
  // Create a decision memo (proposal)
  app.post("/", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    let body: z.infer<typeof CreateMemoSchema>;
    try { body = CreateMemoSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    const memo = await createDecisionMemo({
      tenantId,
      agent:            body.agent,
      title:            body.title,
      rationale:        body.rationale,
      estimatedCostUsd: body.estimatedCostUsd,
      billingType:      body.billingType,
      riskTier:         body.riskTier,
      confidence:       body.confidence,
      expectedBenefit:  body.expectedBenefit,
      payload:          body.payload,
    });

    return reply.send({ ok: true, memo });
  });

  // List decision memos
  app.get("/", async (req, reply) => {
    const q = (req.query as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const status = q.status ? String(q.status) : undefined;
    const rows = await prisma.decisionMemo.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: Number(q.take ?? 50),
    });
    return reply.send({ ok: true, memos: rows });
  });

  // Approve a memo (guardrails enforced) — tighter rate limit
  app.post("/:id/approve", { config: { rateLimit: APPROVE_RATE_LIMIT } }, async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const memoId = String((req.params as any).id);
    const actorUserId = (req as any).auth?.userId ?? null;

    const res = await approveDecisionMemo({ tenantId, memoId });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "human",
        actorUserId,
        actorExternalId: null,
        level: res.ok ? "info" : "warn",
        action: "DECISION_MEMO_APPROVED",
        entityType: "decision_memo",
        entityId: memoId,
        message: res.ok
          ? `Decision memo ${memoId} approved`
          : `Decision memo ${memoId} approval blocked by guardrails`,
        meta: { memoId, guardrail: res.guard ?? null },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    if (!res.ok) return reply.code(409).send({ ok: false, error: "guardrail_block", guard: res.guard, memo: res.memo });
    return reply.send({ ok: true, memo: res.memo, guard: res.guard });
  });

  // Reject a memo — tighter rate limit
  app.post("/:id/reject", { config: { rateLimit: REJECT_RATE_LIMIT } }, async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const memoId = String((req.params as any).id);
    const actorUserId = (req as any).auth?.userId ?? null;
    const reason = String(body.reason ?? "");

    const memo = await rejectDecisionMemo({ tenantId, memoId, reason });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "human",
        actorUserId,
        actorExternalId: null,
        level: "info",
        action: "DECISION_MEMO_REJECTED",
        entityType: "decision_memo",
        entityId: memoId,
        message: `Decision memo ${memoId} rejected${reason ? `: ${reason}` : ""}`,
        meta: { memoId, reason },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, memo });
  });
};
