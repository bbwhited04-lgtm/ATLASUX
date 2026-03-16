import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma, withTenant } from "../db/prisma.js";

const DisconnectBody = z.object({
  org_id: z.string().min(1, "org_id is required").max(200),
  provider: z.string().min(1, "provider is required").max(100),
});

const MarkConnectedBody = z.object({
  org_id: z.string().min(1, "org_id is required").max(200),
  provider: z.string().min(1, "provider is required").max(100),
  scopes: z.array(z.string()).optional(),
  status: z.record(z.unknown()).optional(),
  config: z.record(z.unknown()).optional(),
});

/**
 * Providers we want Business Manager to show.
 * These keys must match your Prisma enum IntegrationProvider values.
 */
const PROVIDERS: Array<{
  key:
    | "google"
    | "microsoft"
    | "icloud"
    | "facebook"
    | "instagram"
    | "tiktok"
    | "youtube"
    | "twilio"
    | "stripe"
    | "openai"
    | "deepseek";
  label: string;
  kind: "oauth" | "apikey" | "internal";
  defaultScopes: string[];
}> = [
  { key: "google", label: "Google", kind: "oauth", defaultScopes: ["gmail.readonly", "calendar.readonly", "contacts.readonly"] },
  { key: "microsoft", label: "Microsoft", kind: "oauth", defaultScopes: [] },
  { key: "icloud", label: "iCloud", kind: "oauth", defaultScopes: [] },

  { key: "facebook", label: "Facebook", kind: "oauth", defaultScopes: [] },
  { key: "instagram", label: "Instagram", kind: "oauth", defaultScopes: [] },
  { key: "tiktok", label: "TikTok", kind: "oauth", defaultScopes: [] },
  { key: "youtube", label: "YouTube", kind: "oauth", defaultScopes: [] },

  { key: "openai", label: "OpenAI", kind: "apikey", defaultScopes: [] },
  { key: "deepseek", label: "DeepSeek", kind: "apikey", defaultScopes: [] },
  { key: "stripe", label: "Stripe", kind: "apikey", defaultScopes: [] },
  { key: "twilio", label: "Twilio", kind: "apikey", defaultScopes: [] },
];

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

/**
 * Resolve tenant slug from query. Returns null if not provided.
 */
function getOrgSlug(req: any): string | null {
  const q = req.query ?? {};
  return s(q.org_id) || s(q.orgId) || null;
}

function getUserId(req: any): string | null {
  const q = req.query ?? {};
  return s(q.user_id) || s(q.userId) || null;
}

async function ensureTenant(slug: string) {
  return prisma.tenant.upsert({
    where: { slug },
    update: {},
    create: { slug, name: slug },
  });
}

/**
 * Resolve tenantId from either the auth plugin (UUID) or the legacy slug query param.
 * Prefers the plugin-injected UUID for authenticated paths.
 */
async function resolveTenantId(req: any): Promise<{ tenantId: string; slug: string } | null> {
  // Prefer UUID from plugin (authenticated path)
  const pluginTid = (req as any).tenantId as string | undefined;
  if (pluginTid) {
    const tenant = await prisma.tenant.findUnique({ where: { id: pluginTid }, select: { id: true, slug: true } });
    if (tenant) return { tenantId: tenant.id, slug: tenant.slug };
  }
  // Fallback: slug from query param (legacy path)
  const slug = getOrgSlug(req);
  if (slug) {
    const tenant = await ensureTenant(slug);
    return { tenantId: tenant.id, slug: tenant.slug };
  }
  return null;
}

export const businessManagerRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/integrations/status?org_id=demo_org
   */
  app.get("/status", async (req, reply) => {
    const resolved = await resolveTenantId(req);
    if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const { tenantId, slug } = resolved;

    const connectedCount = await withTenant(tenantId, (tx) =>
      tx.integration.count({ where: { tenantId, connected: true } })
    );

    return reply.send({
      ok: true,
      org_id: slug,
      tenant_id: tenantId,
      integrations_connected: connectedCount,
      status: "online",
      ts: new Date().toISOString(),
    });
  });

  /**
   * GET /v1/integrations/site_integration?org_id=demo_org&user_id=demo_user
   * This is what your Business Manager UI should call to show provider cards.
   */
  app.get("/site_integration", async (req, reply) => {
    const userId = getUserId(req);
    const resolved = await resolveTenantId(req);
    if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const { tenantId, slug } = resolved;

    const rows = await withTenant(tenantId, (tx) =>
      tx.integration.findMany({ where: { tenantId } })
    );

    const byProvider = new Map(rows.map((r) => [r.provider, r]));

    const providers = PROVIDERS.map((p) => {
      const row = byProvider.get(p.key);
      const scopes = (row?.scopes ?? p.defaultScopes) as any;

      return {
        key: p.key,
        label: p.label,
        kind: p.kind,
        connected: row?.connected ?? false,
        scopes: Array.isArray(scopes) ? scopes : p.defaultScopes,
        last_sync_at: row?.last_sync_at ?? null,
        updated_at: row?.updated_at ?? null,
        status: row?.status ?? {},
        config: row?.config ?? {},
      };
    });

    return reply.send({
      ok: true,
      org_id: slug,
      user_id: userId,
      providers,
      ts: new Date().toISOString(),
    });
  });

  /**
   * GET /v1/integrations/list?org_id=demo_org
   * Returns raw integration rows for a table view if your UI needs it.
   */
  app.get("/list", async (req, reply) => {
    const resolved = await resolveTenantId(req);
    if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const { tenantId, slug } = resolved;

    const items = await withTenant(tenantId, (tx) =>
      tx.integration.findMany({
        where: { tenantId },
        orderBy: { updated_at: "desc" },
      })
    );

    return reply.send({
      ok: true,
      org_id: slug,
      tenant_id: tenantId,
      items,
      ts: new Date().toISOString(),
    });
  });

  /**
   * GET /v1/integrations/summary?org_id=demo_org
   * Lightweight summary panel. (Accounting lives in /v1/accounting/summary)
   */
  app.get("/summary", async (req, reply) => {
    const resolved = await resolveTenantId(req);
    if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const { tenantId, slug } = resolved;

    const { total, connected } = await withTenant(tenantId, async (tx) => {
      const total = await tx.integration.count({ where: { tenantId } });
      const connected = await tx.integration.count({ where: { tenantId, connected: true } });
      return { total, connected };
    });

    return reply.send({
      ok: true,
      org_id: slug,
      tenant_id: tenantId,
      integrations: { total, connected, disconnected: Math.max(total - connected, 0) },
      ts: new Date().toISOString(),
    });
  });

  /**
   * POST /v1/integrations/disconnect
   * Body: { org_id, provider }
   */
  app.post("/disconnect", async (req, reply) => {
    const parsed = DisconnectBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: "Validation failed", details: parsed.error.errors });
    const provider = parsed.data.provider;

    // Resolve tenant from plugin UUID or legacy org_id in body
    const resolved = await resolveTenantId({ ...req, query: { ...(req.query as any), org_id: parsed.data.org_id } });
    if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const { tenantId, slug } = resolved;

    await withTenant(tenantId, (tx) =>
      tx.integration.upsert({
        where: { tenantId_provider: { tenantId, provider: provider as any } },
        update: {
          connected: false,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          status: {},
        },
        create: {
          tenantId,
          provider: provider as any,
          connected: false,
          scopes: [],
          config: {},
          status: {},
        },
      })
    );

    return reply.send({ ok: true, org_id: slug, provider, connected: false });
  });

  /**
   * POST /v1/integrations/mark_connected
   * Body: { org_id, provider, scopes?, status?, config? }
   * (Use this today to flip a provider on without OAuth while you wire flows.)
   */
  app.post("/mark_connected", async (req, reply) => {
    const parsed = MarkConnectedBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ ok: false, error: "Validation failed", details: parsed.error.errors });
    const { org_id: orgSlug, provider, scopes, status, config } = parsed.data;

    // Resolve tenant from plugin UUID or legacy org_id in body
    const resolved = await resolveTenantId({ ...req, query: { ...(req.query as any), org_id: orgSlug } });
    if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const { tenantId, slug } = resolved;

    const updated = await withTenant(tenantId, (tx) =>
      tx.integration.upsert({
        where: { tenantId_provider: { tenantId, provider: provider as any } },
        update: {
          connected: true,
          scopes: scopes ?? undefined,
          status: (status ?? undefined) as any,
          config: (config ?? undefined) as any,
        },
        create: {
          tenantId,
          provider: provider as any,
          connected: true,
          scopes: scopes ?? [],
          status: (status ?? {}) as any,
          config: (config ?? {}) as any,
        },
      })
    );

    return reply.send({
      ok: true,
      org_id: slug,
      provider,
      connected: updated.connected,
      updated_at: updated.updated_at,
    });
  });
};
