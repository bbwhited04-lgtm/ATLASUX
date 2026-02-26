import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { LedgerCategory } from "@prisma/client";

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

/**
 * Compute how much has been spent against a budget in the last `periodDays` days.
 * Returns spentCents as a plain number.
 */
async function computeSpend(
  tenantId: string,
  periodDays: number,
  category: LedgerCategory | null,
): Promise<number> {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const ledger = await prisma.ledgerEntry.findMany({
    where: {
      tenantId,
      entryType: "debit",
      occurredAt: { gte: since },
      ...(category ? { category } : {}),
    },
    select: { amountCents: true },
  });
  return ledger.reduce((sum, l) => sum + Number(l.amountCents), 0);
}

/**
 * Serialize a budget row with spend metrics.
 * limitCents is returned as a string to avoid BigInt JSON precision loss.
 */
function serializeBudget(
  budget: {
    id: string;
    tenantId: string;
    name: string;
    category: LedgerCategory | null;
    limitCents: bigint;
    periodDays: number;
    alertAt: number;
    createdAt: Date;
    updatedAt: Date;
  },
  spentCents: number,
) {
  const limitNum = Number(budget.limitCents);
  const remainingCents = limitNum - spentCents;
  const pctUsed = limitNum > 0 ? spentCents / limitNum : 0;
  const isOverAlert = pctUsed >= budget.alertAt;

  return {
    id: budget.id,
    tenantId: budget.tenantId,
    name: budget.name,
    category: budget.category,
    limitCents: budget.limitCents.toString(),
    periodDays: budget.periodDays,
    alertAt: budget.alertAt,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
    spentCents,
    remainingCents,
    pctUsed: Math.round(pctUsed * 10000) / 10000,
    isOverAlert,
  };
}

export const budgetRoutes: FastifyPluginAsync = async (app) => {
  // GET / — list budgets with current spend
  app.get("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const budgets = await prisma.budget.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const spentCents = await computeSpend(tenantId, b.periodDays, b.category);
        return serializeBudget(b, spentCents);
      }),
    );

    return reply.send({ ok: true, budgets: enriched, total: enriched.length });
  });

  // POST / — create a budget
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;

    if (!s(body.name)) return reply.code(400).send({ ok: false, error: "name required" });
    if (body.limitCents === undefined || body.limitCents === null) {
      return reply.code(400).send({ ok: false, error: "limitCents required" });
    }

    const categoryRaw = s(body.category);
    const category: LedgerCategory | null =
      categoryRaw && Object.values(LedgerCategory).includes(categoryRaw as LedgerCategory)
        ? (categoryRaw as LedgerCategory)
        : null;

    const budget = await prisma.budget.create({
      data: {
        tenantId,
        name: s(body.name)!,
        category: category ?? undefined,
        limitCents: BigInt(Math.round(Number(body.limitCents))),
        periodDays: body.periodDays !== undefined ? Number(body.periodDays) : 30,
        alertAt: body.alertAt !== undefined ? Number(body.alertAt) : 0.8,
      },
    });

    const spentCents = await computeSpend(tenantId, budget.periodDays, budget.category);
    return reply.code(201).send({ ok: true, budget: serializeBudget(budget, spentCents) });
  });

  // PATCH /:id — update a budget
  app.patch("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const body = (req.body ?? {}) as any;

    const existing = await prisma.budget.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    let categoryUpdate: { category?: LedgerCategory | null } = {};
    if (body.category !== undefined) {
      const categoryRaw = s(body.category);
      categoryUpdate.category =
        categoryRaw && Object.values(LedgerCategory).includes(categoryRaw as LedgerCategory)
          ? (categoryRaw as LedgerCategory)
          : null;
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: s(body.name) ?? existing.name } : {}),
        ...categoryUpdate,
        ...(body.limitCents !== undefined
          ? { limitCents: BigInt(Math.round(Number(body.limitCents))) }
          : {}),
        ...(body.periodDays !== undefined ? { periodDays: Number(body.periodDays) } : {}),
        ...(body.alertAt !== undefined ? { alertAt: Number(body.alertAt) } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "BUDGET_UPDATED",
        entityType: "budget",
        entityId: id,
        message: `Budget updated: ${budget.name}`,
        meta: {},
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    const spentCents = await computeSpend(tenantId, budget.periodDays, budget.category);
    return reply.send({ ok: true, budget: serializeBudget(budget, spentCents) });
  });

  // DELETE /:id — delete a budget
  app.delete("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;

    const existing = await prisma.budget.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.budget.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "BUDGET_DELETED",
        entityType: "budget",
        entityId: id,
        message: `Budget deleted: ${existing.name}`,
        meta: {},
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true });
  });

  // GET /status — quick summary of budget alerts
  app.get("/status", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const budgets = await prisma.budget.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const spentCents = await computeSpend(tenantId, b.periodDays, b.category);
        return serializeBudget(b, spentCents);
      }),
    );

    const alerting = enriched.filter((b) => b.isOverAlert).length;

    return reply.send({
      ok: true,
      total: enriched.length,
      alerting,
      budgets: enriched,
    });
  });
};
