import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

const isUuid = (v: any) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export const auditRoutes: FastifyPluginAsync = async (app) => {

  /** GET /v1/audit/health */
  app.get("/health", async () => ({
    ok: true,
    prisma: true,
    model: "auditLog",
    ts: new Date().toISOString(),
  }));

  /** GET /v1/audit/list */
  app.get("/list", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const limitRaw = Number(q.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
    const cursor = typeof q.cursor === "string" && q.cursor.length ? q.cursor : undefined;

    const tenantIdRaw = q.tenantId ?? q.tenant_id ?? q.org_id ?? q.orgId ?? null;
    const actorRaw = q.actorId ?? q.actor_id ?? q.user_id ?? q.userId ?? null;

    const where: any = {};

    const tenantFromPlugin = (req as any).tenantId;
    if (tenantFromPlugin) where.tenantId = tenantFromPlugin;
    else if (isUuid(tenantIdRaw)) where.tenantId = tenantIdRaw;

    if (actorRaw) {
      if (isUuid(actorRaw)) where.actorUserId = actorRaw;
      else where.actorExternalId = String(actorRaw);
    }
    if (q.action) where.action = q.action;
    if (q.level) where.level = q.level;

    try {
      const rows = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

      return reply.send({ ok: true, items, page: { limit, nextCursor } });
    } catch (err: any) {
      console.error("[audit] list query failed:", err?.message ?? err);
      return reply.send({
        ok: true,
        items: [],
        page: { limit, nextCursor: null },
        warning: "AUDIT_QUERY_FAILED",
        detail: err?.message ?? "unknown",
      });
    }
  });

  /** GET /v1/audit/:id */
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as any;
    const reqTenantId = (req as any).tenantId as string | undefined;

    try {
      const item = await prisma.auditLog.findUnique({ where: { id } });
      if (!item) return reply.code(404).send({ ok: false, error: "NOT_FOUND" });
      if (reqTenantId && item.tenantId && item.tenantId !== reqTenantId) {
        return reply.code(404).send({ ok: false, error: "NOT_FOUND" });
      }
      return reply.send({ ok: true, item });
    } catch (err: any) {
      console.error("[audit] findUnique failed:", err?.message ?? err);
      return reply.code(500).send({ ok: false, error: "QUERY_FAILED", detail: err?.message });
    }
  });

  /** POST /v1/audit */
  app.post("/", async (req, reply) => {
    const body = (req.body ?? {}) as any;

    const data: any = {
      tenantId: body.tenantId ?? body.org_id ?? body.orgId ?? null,
      actorExternalId: String(body.actorId ?? body.actor_id ?? body.user_id ?? body.userId ?? ""),
      actorType: body.actorType ?? null,
      action: body.action ?? "manual_event",
      level: body.level ?? "info",
      entityType: body.entityType ?? null,
      entityId: body.entityId ?? null,
      message: body.message ?? null,
      meta: body.meta ?? null,
    };

    try {
      const item = await prisma.auditLog.create({ data });
      return reply.code(201).send({ ok: true, item });
    } catch (err: any) {
      console.error("[audit] create failed:", err?.message ?? err);
      return reply.code(202).send({
        ok: true,
        accepted: true,
        warning: "AUDIT_CREATE_FAILED",
        detail: err?.message,
        data,
      });
    }
  });
};
