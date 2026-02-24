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
    const q = (req.query as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const memoId = String((req.params as any).id);

    const res = await approveDecisionMemo({ tenantId, memoId });
    if (!res.ok) return reply.code(409).send({ ok: false, error: "guardrail_block", guard: res.guard, memo: res.memo });
    return reply.send({ ok: true, memo: res.memo, guard: res.guard });
  });

  // Reject a memo
  app.post("/:id/reject", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const memoId = String((req.params as any).id);

    const memo = await rejectDecisionMemo({ tenantId, memoId, reason: String(body.reason ?? "") });
    return reply.send({ ok: true, memo });
  });
};
