import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

/**
 * Integrations are stored in Postgres (prisma model Integration).
 * UI should not depend on this table being pre-seeded. If a tenant has assets that imply
 * a provider but there is no Integration row yet, we create a stub row with connected=false.
 *
 * Providers are inferred from assets.platform:
 * - facebook/instagram/threads -> meta
 * - youtube/google -> google
 * - x/twitter -> x
 * - tumblr -> tumblr
 * - pinterest -> pinterest
 * - linkedin -> linkedin
 * Others are ignored.
 */
function normalizeProvider(p: string | null | undefined): string | null {
  if (!p) return null;
  const s = String(p).trim().toLowerCase();
  if (!s) return null;
  if (s.includes("facebook") || s.includes("instagram") || s.includes("threads") || s === "meta") return "meta";
  if (s.includes("youtube") || s.includes("google")) return "google";
  if (s === "x" || s.includes("twitter")) return "x";
  if (s.includes("tumblr")) return "tumblr";
  if (s.includes("pinterest")) return "pinterest";
  if (s.includes("linkedin")) return "linkedin";
  return null;
}

async function ensureStubIntegration(tenantId: string, provider: any) {
  // provider is prisma enum integration_provider
  await prisma.integration.upsert({
    where: { tenantId_provider: { tenantId, provider } },
    create: { tenantId, provider, connected: false },
    update: {}, // no-op
  });
}

export const integrationsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/integrations/status?tenantId=...
   * Returns: { ok:true, tenantId, integrations:[{provider, connected}] }
   * Also infers providers from assets and auto-creates stub Integration rows.
   */
  app.get("/status", async (req) => {
    const q = (req.query ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    // infer providers from assets
    const assets = await prisma.asset.findMany({
      where: { tenantId },
      select: { platform: true },
    });

    const inferred = new Set<string>();
    for (const a of assets) {
      const p = normalizeProvider(a.platform);
      if (p) inferred.add(p);
    }

    // ensure stubs exist for inferred providers
    // (Only for providers we actually support in schema enum)
    const supported = ["meta", "google", "x", "tumblr", "pinterest", "linkedin"] as const;
    for (const p of supported) {
      if (inferred.has(p)) {
        await ensureStubIntegration(tenantId, p as any);
      }
    }

    const rows = await prisma.integration.findMany({
      where: { tenantId },
      select: { provider: true, connected: true, updated_at: true, last_sync_at: true, status: true },
      orderBy: { provider: "asc" },
    });

    return {
      ok: true,
      tenantId,
      integrations: rows.map(r => ({
        provider: r.provider,
        connected: r.connected,
        updated_at: r.updated_at,
        last_sync_at: r.last_sync_at,
        status: r.status,
      })),
    };
  });

  /**
   * POST /v1/integrations/:provider/mark_connected?tenantId=...
   * For alpha/testing only (does NOT perform OAuth). It just flips connected=true.
   */
  app.post("/:provider/mark_connected", async (req) => {
    const q = (req.query ?? {}) as any;
    const params = (req.params ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    const provider = String(params.provider ?? "").toLowerCase();
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const supported = ["meta", "google", "x", "tumblr", "pinterest", "linkedin"];
    if (!supported.includes(provider)) return { ok: false, error: "UNSUPPORTED_PROVIDER" };

    const row = await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId, provider: provider as any } },
      create: { tenantId, provider: provider as any, connected: true },
      update: { connected: true, updated_at: new Date() as any },
      select: { provider: true, connected: true, updated_at: true },
    });
    return { ok: true, integration: row };
  });

  /**
   * POST /v1/integrations/:provider/disconnect?tenantId=...
   */
  app.post("/:provider/disconnect", async (req) => {
    const q = (req.query ?? {}) as any;
    const params = (req.params ?? {}) as any;
    const tenantId = ((req as any).tenantId ?? null) as string | null;
    const provider = String(params.provider ?? "").toLowerCase();
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const supported = ["meta", "google", "x", "tumblr", "pinterest", "linkedin"];
    if (!supported.includes(provider)) return { ok: false, error: "UNSUPPORTED_PROVIDER" };

    const row = await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId, provider: provider as any } },
      create: { tenantId, provider: provider as any, connected: false },
      update: { connected: false, access_token: null, refresh_token: null, token_expires_at: null, updated_at: new Date() as any },
      select: { provider: true, connected: true, updated_at: true },
    });
    return { ok: true, integration: row };
  });
};
