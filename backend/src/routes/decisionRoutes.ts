import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
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

  // List decision memos (capped at 200 to prevent DoS)
  app.get("/", async (req, reply) => {
    const q = (req.query as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const status = q.status ? String(q.status) : undefined;
    const take = Math.min(Number(q.take ?? 50), 200);
    const rows = await prisma.decisionMemo.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take,
    });
    return reply.send({ ok: true, memos: rows });
  });

  // ── Templates ──────────────────────────────────────────────────────────────

  const TemplateCreateSchema = z.object({
    name:             z.string().min(1).max(200),
    description:      z.string().max(2000).optional(),
    defaultTitle:     z.string().max(500).optional(),
    defaultRationale: z.string().max(5000).optional(),
    billingType:      z.enum(["none", "one_time", "recurring"]).optional(),
    riskTier:         z.number().int().min(0).max(5).optional(),
  });

  // List templates for tenant
  app.get("/templates", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const templates = await prisma.decisionTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
    });

    return reply.send({ ok: true, templates });
  });

  // Create template
  app.post("/templates", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    let body: z.infer<typeof TemplateCreateSchema>;
    try { body = TemplateCreateSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    const template = await prisma.decisionTemplate.create({
      data: {
        tenantId,
        name:             body.name,
        ...(body.description      != null ? { description:      body.description      } : {}),
        ...(body.defaultTitle     != null ? { defaultTitle:     body.defaultTitle     } : {}),
        ...(body.defaultRationale != null ? { defaultRationale: body.defaultRationale } : {}),
        ...(body.billingType      != null ? { billingType:      body.billingType      } : {}),
        ...(body.riskTier         != null ? { riskTier:         body.riskTier         } : {}),
      },
    });

    return reply.code(201).send({ ok: true, template });
  });

  // Delete template
  app.delete("/templates/:id", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const id = String((req.params as any).id ?? "");

    const deleted = await prisma.decisionTemplate.deleteMany({ where: { id, tenantId } });
    if (deleted.count === 0) return reply.code(404).send({ ok: false, error: "not_found" });

    return reply.send({ ok: true });
  });

  // ── Approval analytics ─────────────────────────────────────────────────────

  app.get("/analytics", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const memos = await prisma.decisionMemo.findMany({
      where: { tenantId },
      select: { status: true, estimatedCostUsd: true, agent: true },
    });

    const total    = memos.length;
    const approved = memos.filter(m => m.status === "APPROVED").length;
    const rejected = memos.filter(m => m.status === "REJECTED").length;
    const pending  = memos.filter(m => m.status === "PROPOSED").length;

    const approvalRate = total > 0 ? `${Math.round((approved / total) * 100)}%` : "0%";

    const approvedMemos   = memos.filter(m => m.status === "APPROVED");
    const totalApprovedCostUsd = approvedMemos.reduce((s, m) => s + (m.estimatedCostUsd ?? 0), 0);
    const avgCostUsd      = approved > 0 ? totalApprovedCostUsd / approved : 0;

    const byAgent: Record<string, { total: number; approved: number; rejected: number }> = {};
    for (const m of memos) {
      const a = m.agent ?? "unknown";
      if (!byAgent[a]) byAgent[a] = { total: 0, approved: 0, rejected: 0 };
      byAgent[a].total    += 1;
      if (m.status === "APPROVED") byAgent[a].approved += 1;
      if (m.status === "REJECTED") byAgent[a].rejected += 1;
    }

    return reply.send({
      ok: true,
      total,
      approved,
      rejected,
      pending,
      approvalRate,
      avgCostUsd:            parseFloat(avgCostUsd.toFixed(2)),
      totalApprovedCostUsd:  parseFloat(totalApprovedCostUsd.toFixed(2)),
      byAgent,
    });
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
