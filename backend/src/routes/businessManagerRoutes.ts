import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";

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
    | "deepseek"
    | "supabase";
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

  { key: "supabase", label: "Supabase", kind: "internal", defaultScopes: [] },
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

export const businessManagerRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/integrations/status?org_id=demo_org
   */
  app.get("/status", async (req, reply) => {
    const orgSlug = getOrgSlug(req);
    if (!orgSlug) return reply.code(400).send({ ok: false, error: "org_id is required" });

    const tenant = await ensureTenant(orgSlug);

    const connectedCount = await prisma.integration.count({
      where: { tenantId: tenant.id, connected: true },
    });

    return reply.send({
      ok: true,
      org_id: orgSlug,
      tenant_id: tenant.id,
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
    const orgSlug = getOrgSlug(req);
    const userId = getUserId(req);
    if (!orgSlug) return reply.code(400).send({ ok: false, error: "org_id is required" });

    const tenant = await ensureTenant(orgSlug);

    const rows = await prisma.integration.findMany({
      where: { tenantId: tenant.id },
    });

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
        // Optional: include lightweight status/config (safe for UI)
        status: row?.status ?? {},
        config: row?.config ?? {},
      };
    });

    return reply.send({
      ok: true,
      org_id: orgSlug,
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
    const orgSlug = getOrgSlug(req);
    if (!orgSlug) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const tenant = await ensureTenant(orgSlug);

    const items = await prisma.integration.findMany({
      where: { tenantId: tenant.id },
      orderBy: { updated_at: "desc" },
    });

    return reply.send({
      ok: true,
      org_id: orgSlug,
      tenant_id: tenant.id,
      items,
      ts: new Date().toISOString(),
    });
  });

  /**
   * GET /v1/integrations/summary?org_id=demo_org
   * Lightweight summary panel. (Accounting lives in /v1/accounting/summary)
   */
  app.get("/summary", async (req, reply) => {
    const orgSlug = getOrgSlug(req);
    if (!orgSlug) return reply.code(400).send({ ok: false, error: "org_id is required" });
    const tenant = await ensureTenant(orgSlug);

    const total = await prisma.integration.count({ where: { tenantId: tenant.id } });
    const connected = await prisma.integration.count({ where: { tenantId: tenant.id, connected: true } });

    return reply.send({
      ok: true,
      org_id: orgSlug,
      tenant_id: tenant.id,
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
    const orgSlug = parsed.data.org_id;
    const provider = parsed.data.provider;

    const tenant = await ensureTenant(orgSlug);

    await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId: tenant.id, provider: provider as any } },
      update: {
        connected: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        status: {},
      },
      create: {
        tenantId: tenant.id,
        provider: provider as any,
        connected: false,
        scopes: [],
        config: {},
        status: {},
      },
    });

    return reply.send({ ok: true, org_id: orgSlug, provider, connected: false });
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

    const tenant = await ensureTenant(orgSlug);

    const updated = await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId: tenant.id, provider: provider as any } },
      update: {
        connected: true,
        scopes: scopes ?? undefined,
        status: (status ?? undefined) as any,
        config: (config ?? undefined) as any,
      },
      create: {
        tenantId: tenant.id,
        provider: provider as any,
        connected: true,
        scopes: scopes ?? [],
        status: (status ?? {}) as any,
        config: (config ?? {}) as any,
      },
    });

    return reply.send({
      ok: true,
      org_id: orgSlug,
      provider,
      connected: updated.connected,
      updated_at: updated.updated_at,
    });
  });
};
