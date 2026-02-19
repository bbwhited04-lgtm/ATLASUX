import type { FastifyPluginAsync } from "fastify";

// Simple in-memory connection state for local alpha testing.
// Keyed by org_id:user_id:provider
const connected = new Map<string, boolean>();

function key(org_id: string | null, user_id: string | null, provider: string) {
  return `${org_id ?? ""}:${user_id ?? ""}:${provider}`;
}

export const integrationsRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/integrations/status?org_id=...&user_id=...
  // Returns [{provider, connected}] for google/meta.
  app.get("/status", async (req) => {
    const q = (req.query ?? {}) as any;
    const org_id = q.org_id ?? q.orgId ?? null;
    const user_id = q.user_id ?? q.userId ?? null;

    return [
      { provider: "google", connected: connected.get(key(org_id, user_id, "google")) ?? false },
      { provider: "meta", connected: connected.get(key(org_id, user_id, "meta")) ?? false },
    ];
  });

  // POST /v1/integrations/:provider/disconnect?org_id=...&user_id=...
  app.post("/:provider/disconnect", async (req) => {
    const q = (req.query ?? {}) as any;
    const params = (req.params ?? {}) as any;
    const provider = String(params.provider ?? "").toLowerCase();
    const org_id = q.org_id ?? q.orgId ?? null;
    const user_id = q.user_id ?? q.userId ?? null;

    if (provider !== "google" && provider !== "meta") {
      return { ok: false, error: "unsupported_provider" };
    }

    connected.set(key(org_id, user_id, provider), false);
    return { ok: true, provider, connected: false };
  });

  // Internal helper used by oauth stubs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app as any).decorate("__setIntegrationConnected", (org_id: string | null, user_id: string | null, provider: string, value: boolean) => {
    connected.set(key(org_id, user_id, provider), value);
  });
};
