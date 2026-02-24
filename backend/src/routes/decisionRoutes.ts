import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";
import { approveDecisionMemo, createDecisionMemo, rejectDecisionMemo } from "../services/decisionMemos.js";

export const decisionRoutes: FastifyPluginAsync = async (app) => {
  // Create a decision memo (proposal)
  app.post("/", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const memo = await createDecisionMemo({
      tenantId,
      agent: String(body.agent ?? "unknown"),
      title: String(body.title ?? ""),
      rationale: String(body.rationale ?? ""),
      estimatedCostUsd: body.estimatedCostUsd,
      billingType: body.billingType,
      riskTier: body.riskTier,
      confidence: body.confidence,
      expectedBenefit: body.expectedBenefit,
      payload: body.payload,
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

  // Approve a memo (guardrails enforced)
  app.post("/:id/approve", async (req, reply) => {
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

  // Reject a memo
  app.post("/:id/reject", async (req, reply) => {
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
