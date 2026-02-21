import type { FastifyPluginAsync } from "fastify";
import { loadEnv } from "../env.js";
import { makeSupabase } from "../supabase.js";

// Simple in-memory connection state for local alpha testing.
// Keyed by org_id:user_id:provider
const connected = new Map<string, boolean>();

function key(org_id: string | null, user_id: string | null, provider: string) {
  return `${org_id ?? ""}:${user_id ?? ""}:${provider}`;
}

export const integrationsRoutes: FastifyPluginAsync = async (app) => {
  const env = loadEnv(process.env);
  const supabase = makeSupabase(env);

  async function isConnectedVault(org_id: string | null, user_id: string | null, provider: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("token_vault")
        .select("provider")
        .eq("org_id", org_id ?? "")
        .eq("user_id", user_id ?? "")
        .eq("provider", provider)
        .limit(1);
      if (error) return connected.get(key(org_id, user_id, provider)) ?? false;
      return (data?.length ?? 0) > 0;
    } catch {
      return connected.get(key(org_id, user_id, provider)) ?? false;
    }
  }

  async function disconnectVault(org_id: string | null, user_id: string | null, provider: string): Promise<void> {
    try {
      await supabase
        .from("token_vault")
        .delete()
        .eq("org_id", org_id ?? "")
        .eq("user_id", user_id ?? "")
        .eq("provider", provider);
    } catch {
      // ignore
    }
  }

  // GET /v1/integrations/status?org_id=...&user_id=...
  // Returns [{provider, connected}] for providers that are wired.
  app.get("/status", async (req) => {
    const q = (req.query ?? {}) as any;
    const org_id = q.org_id ?? q.orgId ?? null;
    const user_id = q.user_id ?? q.userId ?? null;

    return [
      { provider: "google", connected: await isConnectedVault(org_id, user_id, "google") },
      { provider: "meta", connected: await isConnectedVault(org_id, user_id, "meta") },
      { provider: "x", connected: await isConnectedVault(org_id, user_id, "x") },
      { provider: "tumblr", connected: await isConnectedVault(org_id, user_id, "tumblr") },
    ];
  });

  // POST /v1/integrations/:provider/disconnect?org_id=...&user_id=...
  app.post("/:provider/disconnect", async (req) => {
    const q = (req.query ?? {}) as any;
    const params = (req.params ?? {}) as any;
    const provider = String(params.provider ?? "").toLowerCase();
    const org_id = q.org_id ?? q.orgId ?? null;
    const user_id = q.user_id ?? q.userId ?? null;

    if (provider !== "google" && provider !== "meta" && provider !== "x" && provider !== "tumblr") {
      return { ok: false, error: "unsupported_provider" };
    }

    connected.set(key(org_id, user_id, provider), false);
    await disconnectVault(org_id, user_id, provider);
    return { ok: true, provider, connected: false };
  });

  // Internal helper used by oauth stubs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (app as any).decorate("__setIntegrationConnected", (org_id: string | null, user_id: string | null, provider: string, value: boolean) => {
    connected.set(key(org_id, user_id, provider), value);
  });
};
