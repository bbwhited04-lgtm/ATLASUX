import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { LedgerEntryType } from "@prisma/client";

export const accountingRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/accounting/summary?tenantId=...
  app.get("/summary", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const tenantId =
      (req.headers as any)["x-tenant-id"] ??
      q.tenantId ??
      q.org_id ??
      null;

    if (!tenantId) {
      return reply.code(400).send({ ok: false, error: "tenantId required" });
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [credits, debits, pendingDecisions] = await Promise.all([
      prisma.ledgerEntry.aggregate({
        where: { tenantId, entryType: LedgerEntryType.credit },
        _sum: { amountCents: true },
      }),
      prisma.ledgerEntry.aggregate({
        where: { tenantId, entryType: LedgerEntryType.debit },
        _sum: { amountCents: true },
      }),
      prisma.decisionMemo.count({
        where: { tenantId, status: "pending" },
      }),
    ]);

    const revenueCents = Number(credits._sum.amountCents ?? 0);
    const expensesCents = Number(debits._sum.amountCents ?? 0);

    return {
      ok: true,
      summary: {
        revenue: revenueCents,
        expenses: expensesCents,
        net: revenueCents - expensesCents,
        approvalsPending: pendingDecisions,
        flags: 0,
      },
      ts: new Date().toISOString(),
    };
  });
};
