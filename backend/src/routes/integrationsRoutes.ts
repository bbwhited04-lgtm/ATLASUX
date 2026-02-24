import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { providerForPlatform, SUPPORTED_PROVIDERS } from "../lib/providerMapping.js";

async function ensureStubIntegration(tenantId: string, provider: any) {
  try {
    await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId, provider } },
      create: { tenantId, provider, connected: false },
      update: {},
    });
  } catch {
    // Provider not in DB enum — skip silently (e.g. meta, x, reddit not yet in integration_provider enum)
  }
}

/** Shared logic: resolve tenantId from plugin-validated header or query fallback. */
function resolveTenant(req: any): string | null {
  const q = (req.query ?? {}) as any;
  return (
    ((req as any).tenantId ?? null) ||
    (q.tenantId ?? q.tenant_id ?? q.org_id ?? q.orgId ?? null) ||
    null
  );
}

async function getIntegrationRows(tenantId: string) {
  // Infer providers from assets and ensure stub rows exist
  const assets = await prisma.asset.findMany({
    where: { tenantId },
    select: { platform: true },
  });
  const inferred = new Set<string>();
  for (const a of assets) {
    const p = providerForPlatform(a.platform);
    if (p) inferred.add(p);
  }
  for (const p of SUPPORTED_PROVIDERS) {
    if (inferred.has(p)) await ensureStubIntegration(tenantId, p as any);
  }

  return prisma.integration.findMany({
    where: { tenantId },
    select: { provider: true, connected: true, updated_at: true, last_sync_at: true, status: true },
    orderBy: { provider: "asc" },
  });
}

export const integrationsRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/integrations/summary   ← canonical single source of truth
   * GET /v1/integrations/status    ← alias (kept for backward compat)
   *
   * Returns:
   * {
   *   ok: true, tenantId,
   *   providers: { meta: false, google: true, x: false, tumblr: false, pinterest: false, linkedin: false },
   *   integrations: [{ provider, connected, updated_at, last_sync_at, status }]
   * }
   */
  async function summaryHandler(req: any) {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const rows = await getIntegrationRows(tenantId);

    // Build flat provider→connected map so every consumer can do a simple lookup
    const providers: Record<string, boolean> = {};
    for (const p of SUPPORTED_PROVIDERS) providers[p] = false;
    for (const r of rows) providers[String(r.provider)] = !!r.connected;

    return {
      ok: true,
      tenantId,
      providers,
      integrations: rows.map(r => ({
        provider: r.provider,
        connected: r.connected,
        updated_at: r.updated_at,
        last_sync_at: r.last_sync_at,
        status: r.status,
      })),
    };
  }

  app.get("/summary", summaryHandler);
  app.get("/status", summaryHandler); // backward-compat alias

  /**
   * POST /v1/integrations/:provider/mark_connected
   * Alpha/testing only — flips connected=true without real OAuth.
   */
  app.post("/:provider/mark_connected", async (req) => {
    const params = (req.params ?? {}) as any;
    const tenantId = resolveTenant(req);
    const provider = String(params.provider ?? "").toLowerCase();
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };
    if (!(SUPPORTED_PROVIDERS as string[]).includes(provider)) return { ok: false, error: "UNSUPPORTED_PROVIDER" };

    const row = await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId, provider: provider as any } },
      create: { tenantId, provider: provider as any, connected: true },
      update: { connected: true, updated_at: new Date() as any },
      select: { provider: true, connected: true, updated_at: true },
    });
    return { ok: true, integration: row };
  });

  /**
   * POST /v1/integrations/:provider/disconnect
   */
  app.post("/:provider/disconnect", async (req) => {
    const params = (req.params ?? {}) as any;
    const tenantId = resolveTenant(req);
    const provider = String(params.provider ?? "").toLowerCase();
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };
    if (!(SUPPORTED_PROVIDERS as string[]).includes(provider)) return { ok: false, error: "UNSUPPORTED_PROVIDER" };

    const row = await prisma.integration.upsert({
      where: { tenantId_provider: { tenantId, provider: provider as any } },
      create: { tenantId, provider: provider as any, connected: false },
      update: { connected: false, access_token: null, refresh_token: null, token_expires_at: null, updated_at: new Date() as any },
      select: { provider: true, connected: true, updated_at: true },
    });
    return { ok: true, integration: row };
  });
};
