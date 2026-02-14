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
   * { tenantId, type, name, url, platform?, metrics? }
   */
  app.post("/", async (req, reply) => {
    const body = (req.body ?? {}) as AnyObj;

    const tenantId = typeof body.tenantId === "string" ? body.tenantId : null;
    const type = String(body.type ?? "").trim();
    const name = String(body.name ?? "").trim();
    const url = String(body.url ?? "").trim();
    const platform = typeof body.platform === "string" && body.platform.trim().length ? body.platform.trim() : null;
    const metrics = body.metrics ?? null;

    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });
    if (!type) return reply.code(400).send({ ok: false, error: "type_required" });
    if (!name) return reply.code(400).send({ ok: false, error: "name_required" });
    if (!url) return reply.code(400).send({ ok: false, error: "url_required" });

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return reply.code(404).send({ ok: false, error: "tenant_not_found" });

    const asset = await prisma.asset.create({
      data: {
        tenantId,
        type,
        name,
        url,
        platform,
        metrics,
      },
    });

    return reply.send({ ok: true, asset });
  });


  /**
   * PATCH /v1/assets/:id
   * { type?, name?, url?, platform?, metrics? }
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

    try {
      const result = await prisma.$transaction(async (tx) => {
        const before = await tx.asset.findUnique({ where: { id } });
        if (!before) {
          return { before: null, asset: null };
        }
        const asset = await tx.asset.update({ where: { id }, data });
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
        return { before, asset };
      });

      if (!result.asset) return reply.code(404).send({ ok: false, error: "asset_not_found" });
      return reply.send({ ok: true, asset: result.asset });
    } catch (err) {
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });

  /**
   * DELETE /v1/assets/:id
   */

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
