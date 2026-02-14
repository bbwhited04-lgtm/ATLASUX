import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { randomUUID } from "crypto";

type AnyObj = Record<string, any>;

type Actor = {
  actorUserId?: string | null;
  actorExternalId?: string | null;
  actorType?: string | null;
};

function getActor(req: any): Actor {
  const h = (req.headers ?? {}) as Record<string, any>;
  const actorUserId =
    (typeof h["x-actor-user-id"] === "string" && h["x-actor-user-id"]) ||
    (typeof h["x-user-id"] === "string" && h["x-user-id"]) ||
    null;

  const actorExternalId =
    (typeof h["x-actor-external-id"] === "string" && h["x-actor-external-id"]) ||
    (typeof h["x-external-id"] === "string" && h["x-external-id"]) ||
    null;

  const actorType =
    (typeof h["x-actor-type"] === "string" && h["x-actor-type"]) ||
    (actorUserId ? "user" : "system");

  return { actorUserId, actorExternalId, actorType };
}

function auditMeta(before: any, after: any, extra?: Record<string, any>) {
  return {
    before: before ?? null,
    after: after ?? null,
    ...((extra ?? {}) as Record<string, any>),
  };
}

function normalizeCostFromBody(body: AnyObj) {
  // Supports either flat fields or nested body.cost
  const src = (body.cost && typeof body.cost === "object") ? (body.cost as AnyObj) : body;

  const centsRaw = src.costMonthlyCents ?? src.monthlyCents ?? src.amountCents ?? null;
  const vendorRaw = src.costVendor ?? src.vendor ?? null;
  const cadenceRaw = src.costCadence ?? src.cadence ?? "monthly";
  const categoryRaw = src.costCategory ?? src.category ?? "hosting";
  const currencyRaw = src.costCurrency ?? src.currency ?? "USD";

  const monthlyCents =
    typeof centsRaw === "number" ? Math.round(centsRaw) :
    (typeof centsRaw === "string" && centsRaw.trim().length ? Math.round(Number(centsRaw)) : null);

  const vendor = typeof vendorRaw === "string" ? vendorRaw.trim() : null;
  const cadence = typeof cadenceRaw === "string" ? cadenceRaw.trim() : "monthly";
  const category = typeof categoryRaw === "string" ? categoryRaw.trim() : "hosting";
  const currency = typeof currencyRaw === "string" ? currencyRaw.trim() : "USD";

  // if user explicitly sends null/0/empty -> treat as removal
  const provided = ("cost" in body) || ("costMonthlyCents" in body) || ("monthlyCents" in body) || ("amountCents" in body);
  const hasCost = monthlyCents !== null && !Number.isNaN(monthlyCents) && monthlyCents > 0;

  return {
    provided,
    hasCost,
    cost: hasCost ? { monthlyCents, vendor, cadence, category, currency } : null,
  };
}

function ledgerCategoryForCost(category: string) {
  // Prisma enum LedgerCategory: subscription, token_spend, api_spend, refund, chargeback, payout, misc
  const c = (category || "").toLowerCase();
  if (["hosting", "saas", "subscription", "domain", "email", "social", "infra", "platform"].includes(c)) return "subscription";
  return "misc";
}

export async function assetsRoutes(app: FastifyInstance) {
  /**
   * GET /v1/assets?tenantId=...  (uuid)
   * Optional: ?tenantSlug=...
   */
  app.get("/", async (req, reply) => {
    const q = (req.query ?? {}) as AnyObj;
    const tenantId = typeof q.tenantId === "string" ? q.tenantId : null;
    const tenantSlug = typeof q.tenantSlug === "string" ? q.tenantSlug : null;

    if (!tenantId && !tenantSlug) {
      return reply.code(400).send({ ok: false, error: "tenant_required" });
    }

    const tenant =
      tenantId
        ? await prisma.tenant.findUnique({ where: { id: tenantId } })
        : await prisma.tenant.findUnique({ where: { slug: tenantSlug! } });

    if (!tenant) {
      return reply.code(404).send({ ok: false, error: "tenant_not_found" });
    }

    const assets = await prisma.asset.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ ok: true, tenantId: tenant.id, assets });
  });

  /**
   * POST /v1/assets
   * { tenantId, type, name, url, platform?, metrics?, costMonthlyCents?, costVendor?, costCadence?, costCategory?, costCurrency? }
   */
  app.post("/", async (req, reply) => {
    const body = (req.body ?? {}) as AnyObj;

    const tenantId = typeof body.tenantId === "string" ? body.tenantId : null;
    const type = String(body.type ?? "").trim();
    const name = String(body.name ?? "").trim();
    const url = String(body.url ?? "").trim();
    const platform = typeof body.platform === "string" && body.platform.trim().length ? body.platform.trim() : null;
    const metrics = (body.metrics && typeof body.metrics === "object") ? body.metrics : null;

    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });
    if (!type) return reply.code(400).send({ ok: false, error: "type_required" });
    if (!name) return reply.code(400).send({ ok: false, error: "name_required" });
    if (!url) return reply.code(400).send({ ok: false, error: "url_required" });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return reply.code(404).send({ ok: false, error: "tenant_not_found" });

    const actor = getActor(req);
    const requestId = randomUUID();

    const costParsed = normalizeCostFromBody(body);
    const nextMetrics: AnyObj | null = metrics ? { ...metrics } : {};
    if (costParsed.provided) {
      nextMetrics.cost = costParsed.cost; // store cost profile on asset
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const asset = await tx.asset.create({
          data: {
            tenantId,
            type,
            name,
            url,
            platform,
            metrics: nextMetrics,
          },
        });

        // Asset created audit + $0 ledger
        await tx.auditLog.create({
          data: {
            tenantId,
            actorUserId: actor.actorUserId,
            actorExternalId: actor.actorExternalId,
            actorType: actor.actorType,
            level: "info",
            action: "ASSET_CREATED",
            entityType: "asset",
            entityId: asset.id,
            message: `Asset created: ${asset.name}`,
            meta: auditMeta(null, asset, { requestId }),
            timestamp: new Date(),
          },
        });

        await tx.ledgerEntry.create({
          data: {
            tenantId,
            entryType: "debit",
            category: "misc",
            amountCents: BigInt(0),
            currency: "USD",
            description: `Asset created: ${asset.name}`,
            externalRef: requestId,
            meta: { action: "ASSET_CREATED", entityType: "asset", entityId: asset.id },
            occurredAt: new Date(),
          },
        });

        // Optional: cost profile -> audit + ledger (estimated recurring)
        if (costParsed.hasCost && costParsed.cost) {
          const costId = randomUUID();
          const costMeta = {
            costId,
            cadence: costParsed.cost.cadence,
            vendor: costParsed.cost.vendor,
            category: costParsed.cost.category,
            currency: costParsed.cost.currency,
            monthlyCents: costParsed.cost.monthlyCents,
            note: "estimated_recurring_cost",
          };

          await tx.auditLog.create({
            data: {
              tenantId,
              actorUserId: actor.actorUserId,
              actorExternalId: actor.actorExternalId,
              actorType: actor.actorType,
              level: "info",
              action: "ASSET_COST_ADDED",
              entityType: "asset",
              entityId: asset.id,
              message: `Cost added: ${asset.name}`,
              meta: auditMeta(null, costParsed.cost, { requestId, ...costMeta }),
              timestamp: new Date(),
            },
          });

          await tx.ledgerEntry.create({
            data: {
              tenantId,
              entryType: "debit",
              category: ledgerCategoryForCost(costParsed.cost.category) as any,
              amountCents: BigInt(costParsed.cost.monthlyCents),
              currency: costParsed.cost.currency || "USD",
              description: `Estimated ${costParsed.cost.cadence} cost: ${asset.name}${costParsed.cost.vendor ? ` (${costParsed.cost.vendor})` : ""}`,
              externalRef: requestId,
              meta: { action: "ASSET_COST_ADDED", entityType: "asset", entityId: asset.id, ...costMeta },
              occurredAt: new Date(),
            },
          });
        }

        return asset;
      });

      return reply.send({ ok: true, asset: created });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });

  /**
   * PATCH /v1/assets/:id
   * Supports: type, name, url, platform, metrics, and optional cost fields:
   * - costMonthlyCents / costVendor / costCadence / costCategory / costCurrency  (or body.cost.*)
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
    if (body.metrics !== undefined) data.metrics = body.metrics;

    const actor = getActor(req);
    const requestId = randomUUID();
    const costParsed = normalizeCostFromBody(body);

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const before = await tx.asset.findUnique({ where: { id } });
        if (!before) return { asset: null as any, before: null as any };

        // Merge metrics if cost provided
        if (costParsed.provided) {
          const base = (before.metrics && typeof before.metrics === "object") ? (before.metrics as AnyObj) : {};
          const merged = { ...base, ...(typeof data.metrics === "object" ? data.metrics : {}) };
          merged.cost = costParsed.cost; // null removes
          data.metrics = merged;
        }

        const asset = await tx.asset.update({ where: { id }, data });

        // base audit + $0 ledger for update
        await tx.auditLog.create({
          data: {
            tenantId: asset.tenantId,
            actorUserId: actor.actorUserId,
            actorExternalId: actor.actorExternalId,
            actorType: actor.actorType,
            level: "info",
            action: "ASSET_UPDATED",
            entityType: "asset",
            entityId: asset.id,
            message: `Asset updated: ${asset.name}`,
            meta: auditMeta(before, asset, { requestId }),
            timestamp: new Date(),
          },
        });

        await tx.ledgerEntry.create({
          data: {
            tenantId: asset.tenantId,
            entryType: "debit",
            category: "misc",
            amountCents: BigInt(0),
            currency: "USD",
            description: `Asset updated: ${asset.name}`,
            externalRef: requestId,
            meta: { action: "ASSET_UPDATED", entityType: "asset", entityId: asset.id },
            occurredAt: new Date(),
          },
        });

        // If cost provided: write cost-specific audit + ledger
        if (costParsed.provided) {
          const beforeCost = (before.metrics && (before.metrics as AnyObj)?.cost) ? (before.metrics as AnyObj).cost : null;
          const afterCost = costParsed.cost;

          const action =
            (!beforeCost && afterCost) ? "ASSET_COST_ADDED" :
            (beforeCost && !afterCost) ? "ASSET_COST_REMOVED" :
            "ASSET_COST_UPDATED";

          await tx.auditLog.create({
            data: {
              tenantId: asset.tenantId,
              actorUserId: actor.actorUserId,
              actorExternalId: actor.actorExternalId,
              actorType: actor.actorType,
              level: "info",
              action,
              entityType: "asset",
              entityId: asset.id,
              message: `${action.replaceAll("_", " ")}: ${asset.name}`,
              meta: auditMeta(beforeCost, afterCost, { requestId }),
              timestamp: new Date(),
            },
          });

          // ledger entry only when adding/updating with positive cost
          if (afterCost && typeof afterCost.monthlyCents === "number" && afterCost.monthlyCents > 0) {
            await tx.ledgerEntry.create({
              data: {
                tenantId: asset.tenantId,
                entryType: "debit",
                category: ledgerCategoryForCost(afterCost.category) as any,
                amountCents: BigInt(afterCost.monthlyCents),
                currency: afterCost.currency || "USD",
                description: `Estimated ${afterCost.cadence} cost: ${asset.name}${afterCost.vendor ? ` (${afterCost.vendor})` : ""}`,
                externalRef: requestId,
                meta: { action, entityType: "asset", entityId: asset.id, cadence: afterCost.cadence, vendor: afterCost.vendor, category: afterCost.category },
                occurredAt: new Date(),
              },
            });
          } else {
            // still record a $0 ledger marker for removal
            await tx.ledgerEntry.create({
              data: {
                tenantId: asset.tenantId,
                entryType: "debit",
                category: "misc",
                amountCents: BigInt(0),
                currency: "USD",
                description: `Cost removed/cleared: ${asset.name}`,
                externalRef: requestId,
                meta: { action, entityType: "asset", entityId: asset.id },
                occurredAt: new Date(),
              },
            });
          }
        }

        return { asset, before };
      });

      if (!updated.asset) return reply.code(404).send({ ok: false, error: "asset_not_found" });
      return reply.send({ ok: true, asset: updated.asset });
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

    try {
      const deleted = await prisma.$transaction(async (tx) => {
        const before = await tx.asset.findUnique({ where: { id } });
        if (!before) return null;

        await tx.asset.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            tenantId: before.tenantId,
            actorUserId: actor.actorUserId,
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

        await tx.ledgerEntry.create({
          data: {
            tenantId: before.tenantId,
            entryType: "debit",
            category: "misc",
            amountCents: BigInt(0),
            currency: "USD",
            description: `Asset deleted: ${before.name}`,
            externalRef: requestId,
            meta: { action: "ASSET_DELETED", entityType: "asset", entityId: before.id },
            occurredAt: new Date(),
          },
        });

        return before;
      });

      if (!deleted) return reply.code(404).send({ ok: false, error: "asset_not_found" });
      return reply.send({ ok: true });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });
}
