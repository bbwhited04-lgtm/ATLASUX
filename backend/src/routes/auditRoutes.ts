import type { FastifyPluginAsync } from "fastify";
import { prisma, withTenant } from "../db/prisma.js";

// Use `any` so missing model names (auditLog vs audit_log) won't break TypeScript compile.
const prismaAny: any = prisma as any;

function pickAuditModel(client?: any): any | null {
  const c = client ?? prismaAny;
  // Try common Prisma model names (depends on your schema.prisma)
  return c.auditLog ?? c.audit_log ?? c.audit ?? null;
}

async function safeFindMany(args: any, client?: any) {
  const model = pickAuditModel(client);
  if (!model?.findMany) return { ok: false, reason: "NO_MODEL" };

  try {
    const items = await model.findMany(args);
    return { ok: true, items };
  } catch (err) {
    return { ok: false, reason: "QUERY_FAILED", err };
  }
}

async function safeFindUnique(args: any, client?: any) {
  const model = pickAuditModel(client);
  if (!model?.findUnique) return { ok: false, reason: "NO_MODEL" };

  try {
    const item = await model.findUnique(args);
    return { ok: true, item };
  } catch (err) {
    return { ok: false, reason: "QUERY_FAILED", err };
  }
}

async function safeCreate(args: any, client?: any) {
  const model = pickAuditModel(client);
  if (!model?.create) return { ok: false, reason: "NO_MODEL" };

  try {
    const item = await model.create(args);
    return { ok: true, item };
  } catch (err) {
    return { ok: false, reason: "CREATE_FAILED", err };
  }
}

export const auditRoutes: FastifyPluginAsync = async (app) => {
const isUuid = (v: any) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  /**
   * GET /v1/audit/health
   */
  app.get("/health", async () => {
    const model = pickAuditModel();
    return {
      ok: true,
      prisma: Boolean(model),
      modelName: model ? (model._dmmfModelName ?? "unknown") : null,
      ts: new Date().toISOString(),
    };
  });

  /**
   * GET /v1/audit/list
   * Query:
   *  - limit (default 50, max 200)
   *  - cursor (optional)
   *  - tenantId/org_id (optional)
   *  - actorId/user_id (optional)
   *  - action, level (optional)
   */
  app.get("/list", async (req, reply) => {
    const q = (req.query ?? {}) as any;

    const limitRaw = Number(q.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

    const cursor = typeof q.cursor === "string" && q.cursor.length ? q.cursor : undefined;

    // Accept both naming styles coming from your UI.
// IMPORTANT: DB expects tenantId as UUID, but UI often sends demo_org.
// So we only apply the tenantId filter if it looks like a UUID.
const tenantIdRaw = q.tenantId ?? q.tenant_id ?? q.org_id ?? q.orgId ?? null;
const actorRaw = q.actorId ?? q.actor_id ?? q.user_id ?? q.userId ?? null;

const where: any = {};

// Prefer tenant from tenantPlugin when present (source of truth)
const tenantFromPlugin = (req as any).tenantId;
if (tenantFromPlugin) where.tenantId = tenantFromPlugin;
else if (isUuid(tenantIdRaw)) where.tenantId = tenantIdRaw;

// Actor filtering: support either a UUID user (actorUserId) or a string external id (actorExternalId)
if (actorRaw) {
  if (isUuid(actorRaw)) where.actorUserId = actorRaw;
  else where.actorExternalId = String(actorRaw);
}

if (q.action) where.action = q.action;
if (q.level) where.level = q.level;

    // Try "createdAt" ordering first, then fallback without orderBy if schema differs
    const baseArgs: any = {
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    };

    const tid = where.tenantId as string | undefined;

    const doQuery = async (client?: any) => {
      let result = await safeFindMany({ ...baseArgs, orderBy: { createdAt: "desc" } }, client);

      if (!result.ok) {
        // Try "timestamp" ordering (common in your earlier error)
        result = await safeFindMany({ ...baseArgs, orderBy: { timestamp: "desc" } }, client);
      }

      if (!result.ok) {
        // Last resort: no orderBy
        result = await safeFindMany(baseArgs, client);
      }

      return result;
    };

    let result: any;
    if (tid) {
      result = await withTenant(tid, async (tx) => doQuery(tx)).catch(() => ({ ok: false, reason: "QUERY_FAILED" }));
    } else {
      result = await doQuery();
    }

    if (!result.ok) {
      // If Prisma isn't ready, return a safe stub instead of breaking UI
      return reply.send({
        ok: true,
        items: [],
        page: { limit, nextCursor: null },
        warning: "AUDIT_STORAGE_NOT_READY",
      });
    }

    const rows = result.items as any[];
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return reply.send({
      ok: true,
      items,
      page: { limit, nextCursor },
    });
  });

  /**
   * GET /v1/audit/:id
   */
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as any;
    const reqTenantId = (req as any).tenantId as string | undefined;

    let result: any;
    if (reqTenantId) {
      result = await withTenant(reqTenantId, async (tx) => safeFindUnique({ where: { id } }, tx)).catch(() => ({ ok: false, reason: "QUERY_FAILED" }));
    } else {
      result = await safeFindUnique({ where: { id } });
    }
    if (!result.ok) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND_OR_STORAGE_NOT_READY" });
    }
    if (!result.item) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND" });
    }

    // Enforce tenant isolation — return 404 for entries from other tenants
    if (reqTenantId && result.item.tenantId && result.item.tenantId !== reqTenantId) {
      return reply.code(404).send({ ok: false, error: "NOT_FOUND" });
    }

    return reply.send({ ok: true, item: result.item });
  });

  /**
   * POST /v1/audit
   * Manual event insert (useful during wiring/testing)
   */
  app.post("/", async (req, reply) => {
    const body = (req.body ?? {}) as any;

    // Keep payload permissive; your plugin can enforce later.
    const data: any = {
      tenantId: body.tenantId ?? body.org_id ?? body.orgId ?? null,
      actorExternalId: String(body.actorId ?? body.actor_id ?? body.user_id ?? body.userId ?? ''),
      actorType: body.actorType ?? null,
      action: body.action ?? "manual_event",
      level: body.level ?? "info",
      entityType: body.entityType ?? null,
      entityId: body.entityId ?? null,
      message: body.message ?? null,
      meta: body.meta ?? null,
      // do NOT force createdAt/timestamp here; let DB defaults handle it
    };

    let result: any;
    if (data.tenantId) {
      result = await withTenant(data.tenantId, async (tx) => safeCreate({ data }, tx)).catch(() => ({ ok: false, reason: "CREATE_FAILED" }));
    } else {
      result = await safeCreate({ data });
    }

    if (!result.ok) {
      // Don’t brick the UI while DB/schema is being wired
      return reply.code(202).send({
        ok: true,
        accepted: true,
        warning: "AUDIT_STORAGE_NOT_READY",
        data,
      });
    }

    return reply.code(201).send({ ok: true, item: result.item });
  });
};
