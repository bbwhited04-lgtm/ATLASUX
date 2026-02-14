import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { Prisma } from "@prisma/client";

type AnyObj = Record<string, any>;

const LEDGER_CATEGORIES = new Set(["subscription","token_spend","api_spend","refund","chargeback","payout","misc"]);
function toLedgerCategory(input: any): any {
  const v = typeof input === "string" ? input : String(input ?? "");
  if (LEDGER_CATEGORIES.has(v)) return v;
  return "misc";
}

export async function ledgerRoutes(app: FastifyInstance) {
  /**
   * GET /v1/ledger/entries?tenantId=...&limit=100&offset=0
   */
  app.get("/entries", async (req, reply) => {
    const q = (req.query ?? {}) as AnyObj;
    const tenantId = typeof q.tenantId === "string" ? q.tenantId : null;
    const limit = Math.min(Number(q.limit ?? 100) || 100, 200);
    const offset = Math.max(Number(q.offset ?? 0) || 0, 0);

    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const [entries, total] = await prisma.$transaction([
      prisma.ledgerEntry.findMany({
        where: { tenantId },
        orderBy: { occurredAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.ledgerEntry.count({ where: { tenantId } }),
    ]);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthDebits = await prisma.ledgerEntry.aggregate({
      where: { tenantId, occurredAt: { gte: monthStart }, entryType: "debit" },
      _sum: { amountCents: true },
    });

    return reply.send({
      ok: true,
      total,
      entries,
      monthDebitCents: Number(monthDebits._sum.amountCents ?? 0),
    });
  });

  /**
   * POST /v1/ledger/entries
   */
  app.post("/entries", async (req, reply) => {
    const body = (req.body ?? {}) as AnyObj;

    const tenantId = typeof body.tenantId === "string" ? body.tenantId : null;
    const entryType = String(body.entryType ?? "debit").trim();
    const category = toLedgerCategory(body.category ?? "misc");
    const currency = String(body.currency ?? "USD").trim();
    const description = String(body.description ?? "").trim();

    const amountCents = BigInt(Math.round(Number(body.amountCents ?? 0) || 0));

    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });
    if (!description) return reply.code(400).send({ ok: false, error: "description_required" });
    if (entryType !== "debit" && entryType !== "credit") {
      return reply.code(400).send({ ok: false, error: "entryType_invalid" });
    }

    const entry = await prisma.ledgerEntry.create({
      data: {
        tenantId,
        entryType,
        category,
        amountCents,
        currency,
        description,
        externalRef: typeof body.externalRef === "string" ? body.externalRef : null,
        meta: body.meta ?? Prisma.DbNull,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      },
    });

    return reply.send({ ok: true, entry });
  });
}
