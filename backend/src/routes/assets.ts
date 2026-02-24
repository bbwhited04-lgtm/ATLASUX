import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { Prisma, LedgerCategory, LedgerEntryType } from "@prisma/client";
import { randomUUID } from "crypto";


function normalizeLedgerCategory(input: unknown): LedgerCategory {
  const v = String(input ?? "").trim().toLowerCase();
  switch (v) {
    case "hosting":
      return LedgerCategory.api_spend;
    case "saas":
      return LedgerCategory.api_spend;
    case "domain":
      return LedgerCategory.api_spend;
    case "email":
      return LedgerCategory.api_spend;
    case "social":
      return LedgerCategory.api_spend;
    case "infra":
      return LedgerCategory.api_spend;
    case "ads":
      return LedgerCategory.api_spend;
    case "other":
      return LedgerCategory.misc;
    case "subscription":
      return LedgerCategory.subscription;
    case "ai_spend":
    case "token_spend":
    case "api_spend":
    case "tokens":
    case "api":
      return LedgerCategory.token_spend;
    case "misc":
    default:
      return LedgerCategory.misc;
  }
}

function normalizeLedgerEntryType(input: unknown): LedgerEntryType {
  const v = String(input ?? "").trim().toLowerCase();
  return v === "credit" ? LedgerEntryType.credit : LedgerEntryType.debit;
}

type AnyObj = Record<string, any>;

type Actor = {
  actorUserId?: string | null;
  actorExternalId?: string | null;
  actorType?: string | null;
};

function getActor(req: any): Actor {
  const userId = (req as any).user?.id ?? null;
  return {
    actorUserId: userId,
    actorExternalId: null,
    actorType: userId ? "user" : "system",
  };
}

function safeNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toCostFromBody(body: AnyObj) {
  // Supports both flat fields and nested cost object.
  const nested = (body.cost ?? null) as AnyObj | null;

  const monthlyCents =
    safeNumber(nested?.monthlyCents ?? body.costMonthlyCents) ??
    safeNumber(nested?.amountCents ?? body.costAmountCents);

  const vendor = (nested?.vendor ?? body.costVendor) as any;
  const cadence = (nested?.cadence ?? body.costCadence) as any;
  const category = (nested?.category ?? body.costCategory) as any;
  const currency = (nested?.currency ?? body.costCurrency ?? "USD") as any;

  // Clearing cost should be explicit.
  // We treat `body.cost === null` (or nested cost.monthlyCents/amountCents === null) as an explicit clear.
  // Flat `cost*` fields being null are treated as "not provided" because many UIs send null by default.
  const wantsClear =
    body.cost === null ||
    (nested && (nested.monthlyCents === null || nested.amountCents === null)) ||
    body.clearCost === true;

  if (wantsClear) return { clear: true } as const;

  // No cost fields provided
  const anyProvided =
    monthlyCents !== null ||
    typeof vendor === "string" ||
    typeof cadence === "string" ||
    typeof category === "string";

  if (!anyProvided) return null;

  return {
    clear: false as const,
    monthlyCents: monthlyCents !== null ? Math.max(0, Math.round(monthlyCents)) : undefined,
    vendor: typeof vendor === "string" ? vendor.trim() : undefined,
    cadence: typeof cadence === "string" ? cadence.trim() : undefined,
    category: typeof category === "string" ? category.trim() : undefined,
    currency: typeof currency === "string" ? currency.trim() : "USD",
  };
}

function auditMeta(before: any, after: any, extra?: Record<string, any>) {
  return {
    before: before ?? null,
    after: after ?? null,
    ...((extra ?? {}) as Record<string, any>),
  };
}

const LEDGER_CATEGORIES = new Set([
  "subscription",
  "token_spend",
  "api_spend",
  "refund",
  "chargeback",
  "payout",
  "misc",
]);

function toLedgerCategory(input: unknown): LedgerCategory {
  return normalizeLedgerCategory(input);
}

export async function assetsRoutes(app: FastifyInstance) {
  /**
   * GET /v1/assets?tenantId=...  (uuid)
   */
  app.get("/", async (req, reply) => {
    const q = (req.query ?? {}) as AnyObj;
    const tenantId = ((req as any).tenantId ?? null) as string | null;

    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const assets = await prisma.asset.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return reply.send({ ok: true, assets });
  });

  /**
   * POST /v1/assets
   * { tenantId, type, name, url, platform?, metrics?, costMonthlyCents?, costVendor?, costCadence?, costCategory?, costCurrency? }
   */
  app.post("/", async (req, reply) => {
    const body = (req.body ?? {}) as AnyObj;

    const tenantId = ((req as any).tenantId ?? null) as string | null;
    const type = typeof body.type === "string" ? body.type.trim() : null;
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const url = typeof body.url === "string" ? body.url.trim() : null;
    const platform = typeof body.platform === "string" ? body.platform.trim() : null;

    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });
    if (!type) return reply.code(400).send({ ok: false, error: "type_required" });
    if (!name) return reply.code(400).send({ ok: false, error: "name_required" });
    if (!url) return reply.code(400).send({ ok: false, error: "url_required" });

    const actor = getActor(req);
    const requestId = randomUUID();

    const incomingMetrics = (body.metrics ?? null) as AnyObj | null;
    const metricsObj: AnyObj = incomingMetrics && typeof incomingMetrics === "object" ? { ...incomingMetrics } : {};

    const cost = toCostFromBody(body);
    if (cost && cost.clear === false) {
      metricsObj.cost = {
        monthlyCents: cost.monthlyCents ?? metricsObj?.cost?.monthlyCents,
        vendor: cost.vendor ?? metricsObj?.cost?.vendor,
        cadence: cost.cadence ?? metricsObj?.cost?.cadence ?? "monthly",
        category: cost.category ?? metricsObj?.cost?.category ?? "hosting",
        currency: cost.currency ?? metricsObj?.cost?.currency ?? "USD",
      };
    }
    // on create, "clear" just means don't set cost.

    try {
      const asset = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const created = await tx.asset.create({
          data: {
            tenantId,
            type,
            name,
            url,
            platform,
            metrics: Object.keys(metricsObj).length ? metricsObj : Prisma.DbNull,
          },
        });

        try {
          await tx.auditLog.create({
                    data: {
                      tenantId,
                      actorUserId: null,
                      actorExternalId: actor.actorExternalId,
                      actorType: actor.actorType,
                      level: "info",
                      action: "ASSET_CREATED",
                      entityType: "asset",
                      entityId: created.id,
                      message: `Asset created: ${created.name}`,
                      meta: auditMeta(null, created, { requestId }),
                      timestamp: new Date(),
                    },
                  });
        } catch (err) {
          req.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");
        }

        await tx.ledgerEntry.create({
          data: {
            tenantId,
            entryType: LedgerEntryType.debit,
            category: LedgerCategory.misc,
            amountCents: BigInt(0),
            currency: "USD",
            description: `Asset created: ${created.name}`,
            externalRef: requestId,
            meta: { action: "ASSET_CREATED", entityType: "asset", entityId: created.id },
            occurredAt: new Date(),
            createdAt: new Date(),
          },
        });

        // If cost provided on create, emit cost event + ledger debit estimate
        if ((created as any)?.metrics?.cost?.monthlyCents) {
          const mc = Number((created as any).metrics.cost.monthlyCents) || 0;
          const vendor = (created as any).metrics.cost.vendor ?? null;
          const cadence = (created as any).metrics.cost.cadence ?? "monthly";
          const category = (created as any).metrics.cost.category ?? "hosting";
          const currency = (created as any).metrics.cost.currency ?? "USD";

          try {
            await tx.auditLog.create({
                        data: {
                          tenantId,
                          actorUserId: null,
                          actorExternalId: actor.actorExternalId,
                          actorType: actor.actorType,
                          level: "info",
                          action: "ASSET_COST_ADDED",
                          entityType: "asset",
                          entityId: created.id,
                          message: `Asset cost added: ${created.name}`,
                          meta: auditMeta(null, (created as any).metrics.cost, { requestId }),
                          timestamp: new Date(),
                        },
                      });
          } catch (err) {
            req.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");
          }

          await tx.ledgerEntry.create({
            data: {
              tenantId,
              entryType: LedgerEntryType.debit,
              category: toLedgerCategory(category),
              amountCents: BigInt(mc),
              currency: String(currency),
              description: `Estimated ${cadence} cost: ${created.name}${vendor ? ` (${vendor})` : ""}`,
              externalRef: requestId,
              meta: { action: "ASSET_COST_ADDED", cadence, vendor, category, assetId: created.id },
              occurredAt: new Date(),
            createdAt: new Date(),
            },
          });
        }

        return created;
      });

      return reply.send({ ok: true, asset });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });

  /**
   * PATCH /v1/assets/:id
   */
  app.patch("/:id", async (req, reply) => {
    const params = (req.params ?? {}) as AnyObj;
    const id = typeof params.id === "string" ? params.id : null;
    if (!id) return reply.code(400).send({ ok: false, error: "id_required" });

    const body = (req.body ?? {}) as AnyObj;
    const data: AnyObj = {};
    if (typeof body.type === "string") data.type = body.type.trim();
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.url === "string") data.url = body.url.trim();
    if (typeof body.platform === "string") data.platform = body.platform.trim() || null;

    const actor = getActor(req);
    const requestId = randomUUID();

    const reqTenantId = ((req as any).tenantId ?? null) as string | null;

    try {
      const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const before = await tx.asset.findUnique({ where: { id } });
        if (!before) return { before: null as any, after: null as any };
        if (reqTenantId && before.tenantId !== reqTenantId) return { before: null as any, after: null as any, forbidden: true };

        // merge metrics
        const beforeMetrics = (before as any).metrics;
        const nextMetrics: AnyObj = beforeMetrics && typeof beforeMetrics === "object" ? { ...beforeMetrics } : {};

        // explicit metrics replacement if provided
        if (body.metrics !== undefined) {
          const mIn = body.metrics;
          if (mIn === null) {
            // clear metrics
            data.metrics = Prisma.DbNull;
          } else if (typeof mIn === "object") {
            data.metrics = mIn;
          }
        }

        const cost = toCostFromBody(body);
        if (cost) {
          if (cost.clear) {
            if (nextMetrics.cost !== undefined) delete nextMetrics.cost;
          } else {
            nextMetrics.cost = {
              ...(typeof nextMetrics.cost === "object" ? nextMetrics.cost : {}),
              ...(cost.monthlyCents !== undefined ? { monthlyCents: cost.monthlyCents } : {}),
              ...(cost.vendor !== undefined ? { vendor: cost.vendor } : {}),
              ...(cost.cadence !== undefined ? { cadence: cost.cadence } : {}),
              ...(cost.category !== undefined ? { category: cost.category } : {}),
              currency: cost.currency ?? (nextMetrics.cost?.currency ?? "USD"),
            };
          }
          // apply merged metrics unless caller provided explicit data.metrics
          if (data.metrics === undefined) {
            data.metrics = Object.keys(nextMetrics).length ? nextMetrics : Prisma.DbNull;
          }
        }

        // if data.metrics is still unset, but we mutated nextMetrics cost removal/addition
        if (data.metrics === undefined && (cost !== null)) {
          data.metrics = Object.keys(nextMetrics).length ? nextMetrics : Prisma.DbNull;
        }

        const after = await tx.asset.update({ where: { id }, data });

        try {
          await tx.auditLog.create({
                    data: {
                      tenantId: after.tenantId,
                      actorUserId: null,
                      actorExternalId: actor.actorExternalId,
                      actorType: actor.actorType,
                      level: "info",
                      action: "ASSET_UPDATED",
                      entityType: "asset",
                      entityId: after.id,
                      message: `Asset updated: ${after.name}`,
                      meta: auditMeta(before, after, { requestId }),
                      timestamp: new Date(),
                    },
                  });
        } catch (err) {
          req.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");
        }

        await tx.ledgerEntry.create({
          data: {
            tenantId: after.tenantId,
            entryType: LedgerEntryType.debit,
            category: LedgerCategory.misc,
            amountCents: BigInt(0),
            currency: "USD",
            description: `Asset updated: ${after.name}`,
            externalRef: requestId,
            meta: { action: "ASSET_UPDATED", entityType: "asset", entityId: after.id },
            occurredAt: new Date(),
            createdAt: new Date(),
          },
        });

        // cost audit/ledger if changed
        const beforeCost = (before as any)?.metrics?.cost ?? null;
        const afterCost = (after as any)?.metrics?.cost ?? null;

        const beforeMc = beforeCost?.monthlyCents ?? null;
        const afterMc = afterCost?.monthlyCents ?? null;

        const costAction =
          beforeCost && !afterCost ? "ASSET_COST_REMOVED" :
          !beforeCost && afterCost ? "ASSET_COST_ADDED" :
          JSON.stringify(beforeCost) !== JSON.stringify(afterCost) ? "ASSET_COST_UPDATED" :
          null;

        if (costAction) {
          try {
            await tx.auditLog.create({
                        data: {
                          tenantId: after.tenantId,
                          actorUserId: null,
                          actorExternalId: actor.actorExternalId,
                          actorType: actor.actorType,
                          level: "info",
                          action: costAction,
                          entityType: "asset",
                          entityId: after.id,
                          message: `Asset cost event: ${after.name}`,
                          meta: auditMeta(beforeCost, afterCost, { requestId }),
                          timestamp: new Date(),
                        },
                      });
          } catch (err) {
            req.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");
          }

          // Write ledger debit for added/updated; for removed, write $0 marker.
          const cents = afterCost?.monthlyCents ? Number(afterCost.monthlyCents) : 0;
          const vendor = afterCost?.vendor ?? null;
          const cadence = afterCost?.cadence ?? "monthly";
          const category = afterCost?.category ?? "hosting";
          const currency = afterCost?.currency ?? "USD";

          await tx.ledgerEntry.create({
            data: {
              tenantId: after.tenantId,
              entryType: LedgerEntryType.debit,
              category: toLedgerCategory(category),
              amountCents: BigInt(Math.max(0, Math.round(Number(cents) || 0))),
              currency: String(currency),
              description:
                costAction === "ASSET_COST_REMOVED"
                  ? `Estimated cost removed: ${after.name}`
                  : `Estimated ${cadence} cost: ${after.name}${vendor ? ` (${vendor})` : ""}`,
              externalRef: requestId,
              meta: { action: costAction, cadence, vendor, category, assetId: after.id, beforeMonthlyCents: beforeMc, afterMonthlyCents: afterMc },
              occurredAt: new Date(),
            createdAt: new Date(),
            },
          });
        }

        return { before, after };
      });

      if ((updated as any).forbidden) return reply.code(403).send({ ok: false, error: "forbidden" });
      if (!updated.after) return reply.code(404).send({ ok: false, error: "asset_not_found" });
      return reply.send({ ok: true, asset: updated.after });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });

  /**
   * DELETE /v1/assets/:id
   */
  app.delete("/:id", async (req, reply) => {
    const params = (req.params ?? {}) as AnyObj;
    const id = typeof params.id === "string" ? params.id : null;
    if (!id) return reply.code(400).send({ ok: false, error: "id_required" });

    const actor = getActor(req);
    const requestId = randomUUID();
    const delTenantId = ((req as any).tenantId ?? null) as string | null;

    try {
      const deleted = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const before = await tx.asset.findUnique({ where: { id } });
        if (!before) return null;
        if (delTenantId && before.tenantId !== delTenantId) return "forbidden";

        await tx.asset.delete({ where: { id } });

        try {
          await tx.auditLog.create({
                    data: {
                      tenantId: before.tenantId,
                      actorUserId: null,
                      actorExternalId: actor.actorExternalId,
                      actorType: actor.actorType,
                      level: "info",
                      action: "ASSET_DELETED",
                      entityType: "asset",
                      entityId: before.id,
                      message: `Asset deleted: ${before.name}`,
                      meta: auditMeta(before, null, { requestId }),
                      timestamp: new Date(),
                    },
                  });
        } catch (err) {
          req.log.error({ err }, "AUDIT DB WRITE FAILED (non-fatal)");
        }

        await tx.ledgerEntry.create({
          data: {
            tenantId: before.tenantId,
            entryType: LedgerEntryType.debit,
            category: LedgerCategory.misc,
            amountCents: BigInt(0),
            currency: "USD",
            description: `Asset deleted: ${before.name}`,
            externalRef: requestId,
            meta: { action: "ASSET_DELETED", entityType: "asset", entityId: before.id },
            occurredAt: new Date(),
            createdAt: new Date(),
          },
        });

        return before;
      });

      if (deleted === "forbidden") return reply.code(403).send({ ok: false, error: "forbidden" });
      if (!deleted) return reply.code(404).send({ ok: false, error: "asset_not_found" });
      return reply.send({ ok: true });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });
}
