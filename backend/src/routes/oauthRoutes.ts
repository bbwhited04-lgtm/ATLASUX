import type { FastifyPluginAsync } from "fastify";

// Local OAuth stubs.
// In real deployments this redirects to provider consent; for local alpha we simply mark connected
// and bounce back to the frontend Integrations page with a query flag.

export const oauthRoutes: FastifyPluginAsync = async (app) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

  async function stubConnect(req: any, provider: "google" | "meta") {
    const q = (req.query ?? {}) as any;
    const org_id = q.org_id ?? q.orgId ?? null;
    const user_id = q.user_id ?? q.userId ?? null;

    // integrationsRoutes decorates this helper.
    const setter = (app as any).__setIntegrationConnected as
      | ((org: string | null, user: string | null, p: string, v: boolean) => void)
      | undefined;
    if (setter) setter(org_id, user_id, provider, true);

    const url = new URL(FRONTEND_URL);
    // hash-router friendly bounce-back
    url.hash = "#/app/integrations";
    url.searchParams.set("stub_connected", provider);
    if (org_id) url.searchParams.set("org_id", String(org_id));
    if (user_id) url.searchParams.set("user_id", String(user_id));

    return url.toString();
  }

  app.get("/google/start", async (req, reply) => {
    const dest = await stubConnect(req, "google");
    reply.redirect(dest);
  });

  app.get("/meta/start", async (req, reply) => {
    const dest = await stubConnect(req, "meta");
    reply.redirect(dest);
  });
};
