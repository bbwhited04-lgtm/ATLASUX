import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";

type AnyObj = Record<string, any>;

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
   * DELETE /v1/assets/:id
   */
  app.delete("/:id", async (req, reply) => {
    const params = (req.params ?? {}) as AnyObj;
    const id = typeof params.id === "string" ? params.id : null;
    if (!id) return reply.code(400).send({ ok: false, error: "id_required" });

    await prisma.asset.delete({ where: { id } });
    return reply.send({ ok: true });
  });
}
