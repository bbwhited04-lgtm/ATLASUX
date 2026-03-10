import type { FastifyPluginAsync } from "fastify";
import { randomBytes, createHmac } from "crypto";
import { loadEnv } from "../env.js";
import { prisma } from "../db/prisma.js";
import { writeTokenVault, readTokenVault, clearTokenVault } from "../lib/tokenStore.js";
import { setOAuthState, getOAuthState, deleteOAuthState } from "../lib/oauthState.js";

const QB_SANDBOX_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_SANDBOX_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_PROD_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_PROD_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

const REDIRECT_URI = "https://atlas-ux.onrender.com/v1/quickbooks/callback";

function getQBCredentials(env: ReturnType<typeof loadEnv>) {
  const isSandbox = (env.QUICKBOOKS_ENVIRONMENT ?? "sandbox") === "sandbox";
  const clientId = isSandbox
    ? env.QUICKBOOKS_CLIENT_ID
    : env.QUICKBOOKS_PROD_CLIENT_ID;
  const clientSecret = isSandbox
    ? env.QUICKBOOKS_CLIENT_SECRET
    : env.QUICKBOOKS_PROD_CLIENT_SECRET;
  return { clientId, clientSecret, isSandbox };
}

function b64urlJson(obj: any): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function parseState(state: string): any {
  const s = state.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? s : s + "=".repeat(4 - (s.length % 4));
  return JSON.parse(Buffer.from(pad, "base64").toString("utf8"));
}

export const quickbooksRoutes: FastifyPluginAsync = async (app) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  const env = loadEnv(process.env);

  function buildReturnUrl(params: Record<string, string>): string {
    const hashParams = new URLSearchParams({ tab: "integrations", ...params });
    const base = new URL(FRONTEND_URL);
    base.hash = `#/app/settings?${hashParams.toString()}`;
    return base.toString();
  }

  async function markConnected(tenantId: string, provider: string) {
    if (!tenantId) return;
    try {
      await prisma.integration.upsert({
        where: { tenantId_provider: { tenantId, provider: provider as any } },
        create: { tenantId, provider: provider as any, connected: true },
        update: { connected: true, updated_at: new Date() as any },
      });
    } catch (e: any) {
      app.log.warn({ err: e }, `mark_connected failed for ${provider}`);
    }
  }

  async function markDisconnected(tenantId: string, provider: string) {
    if (!tenantId) return;
    try {
      await prisma.integration.updateMany({
        where: { tenantId, provider: provider as any },
        data: { connected: false, updated_at: new Date() as any },
      });
    } catch (e: any) {
      app.log.warn({ err: e }, `mark_disconnected failed for ${provider}`);
    }
  }

  // ── GET /connect — redirect to Intuit OAuth2 authorization ────────────────

  app.get("/connect", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    const { clientId } = getQBCredentials(env);
    if (!clientId) {
      return reply.redirect(buildReturnUrl({
        error: "oauth_not_configured",
        provider: "quickbooks",
        ...(org_id ? { org_id } : {}),
        ...(user_id ? { user_id } : {}),
      }));
    }

    const nonce = randomBytes(16).toString("hex");
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "com.intuit.quickbooks.accounting",
      redirect_uri: REDIRECT_URI,
      state,
    });

    return reply.redirect(`${QB_SANDBOX_AUTH_URL}?${params.toString()}`);
  });

  // ── GET /callback — exchange code for tokens ──────────────────────────────

  app.get("/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;

    if (q.error) {
      return reply.redirect(buildReturnUrl({
        oauth_error: String(q.error_description ?? q.error),
      }));
    }

    const code = String(q.code ?? "");
    const realmId = String(q.realmId ?? "");

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch { /* ignore */ }
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    // CSRF nonce check
    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    if (!code) {
      return reply.redirect(buildReturnUrl({ oauth_error: "missing_code" }));
    }

    const { clientId, clientSecret } = getQBCredentials(env);
    if (!clientId || !clientSecret) {
      return reply.redirect(buildReturnUrl({ oauth_error: "quickbooks_not_configured" }));
    }

    try {
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch(QB_SANDBOX_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        app.log.error({ err: new Error(errBody) }, "QuickBooks token exchange failed");
        return reply.redirect(buildReturnUrl({ oauth_error: "quickbooks_token_exchange_failed" }));
      }

      const tok = (await tokenRes.json()) as {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        x_refresh_token_expires_in: number;
      };

      const expires_at = tok.expires_in
        ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
        : null;

      await writeTokenVault(env, {
        org_id,
        user_id,
        provider: "quickbooks",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at,
        scope: "com.intuit.quickbooks.accounting",
        meta: {
          token_type: tok.token_type,
          realm_id: realmId,
          x_refresh_token_expires_in: tok.x_refresh_token_expires_in,
        },
      });

      await markConnected(org_id, "quickbooks");

      return reply.redirect(buildReturnUrl({
        connected: "quickbooks",
        org_id,
        user_id,
      }));
    } catch (e: any) {
      app.log.error({ err: e }, "QuickBooks callback error");
      return reply.redirect(buildReturnUrl({
        oauth_error: e?.message ? String(e.message) : "quickbooks_token_exchange_failed",
      }));
    }
  });

  // ── GET /disconnect — revoke token and remove from vault ──────────────────

  app.get("/disconnect", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? (req as any).tenantId ?? "");

    if (!org_id) {
      return reply.code(400).send({ ok: false, error: "org_id required" });
    }

    const { clientId, clientSecret } = getQBCredentials(env);

    try {
      // Read existing token to revoke it
      const vault = await readTokenVault(env, org_id, "quickbooks");
      const tokenToRevoke = vault?.refresh_token ?? vault?.access_token;

      if (tokenToRevoke && clientId && clientSecret) {
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
        const revokeRes = await fetch(QB_REVOKE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Basic ${basicAuth}`,
          },
          body: JSON.stringify({ token: tokenToRevoke }),
        });

        if (!revokeRes.ok) {
          const errBody = await revokeRes.text();
          app.log.warn({ err: new Error(errBody) }, "QuickBooks token revocation failed (continuing with local cleanup)");
        }
      }

      // Remove from token vault regardless of revocation result
      await clearTokenVault(env, org_id, "quickbooks");
      await markDisconnected(org_id, "quickbooks");

      return reply.send({ ok: true, disconnected: true });
    } catch (e: any) {
      app.log.error({ err: e }, "QuickBooks disconnect error");
      return reply.code(500).send({ ok: false, error: "disconnect_failed" });
    }
  });

  // ── GET /status — connection status for tenant ────────────────────────────

  app.get("/status", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? (req as any).tenantId ?? "");

    if (!org_id) {
      return reply.code(400).send({ ok: false, error: "org_id required" });
    }

    try {
      const vault = await readTokenVault(env, org_id, "quickbooks");
      const integration = await prisma.integration.findFirst({
        where: { tenantId: org_id, provider: "quickbooks" },
        select: { connected: true, last_sync_at: true, updated_at: true },
      });

      const connected = !!(vault?.access_token && integration?.connected);
      const tokenExpired = vault?.expires_at
        ? new Date(vault.expires_at) < new Date()
        : false;

      return reply.send({
        ok: true,
        connected,
        token_expired: tokenExpired,
        has_refresh_token: !!vault?.refresh_token,
        last_sync_at: integration?.last_sync_at ?? null,
      });
    } catch (e: any) {
      app.log.error({ err: e }, "QuickBooks status check error");
      return reply.code(500).send({ ok: false, error: "status_check_failed" });
    }
  });

  // ── POST /webhook — receive Intuit webhook notifications ──────────────────

  app.post("/webhook", async (req, reply) => {
    const signature = String(req.headers["intuit-signature"] ?? "");

    // Intuit webhooks are signed with the OAuth client secret (verifier token)
    const { clientSecret } = getQBCredentials(env);
    if (!clientSecret) {
      app.log.warn({ err: new Error("QUICKBOOKS_CLIENT_SECRET not set") }, "Cannot verify QuickBooks webhook");
      return reply.code(503).send({ ok: false, error: "QUICKBOOKS_NOT_CONFIGURED" });
    }

    // Verify HMAC-SHA256 signature
    const rawBody = typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body);

    const expectedSig = createHmac("sha256", clientSecret)
      .update(rawBody)
      .digest("base64");

    if (signature !== expectedSig) {
      app.log.warn({ err: new Error("Invalid webhook signature") }, "QuickBooks webhook signature mismatch");
      return reply.code(401).send({ ok: false, error: "INVALID_SIGNATURE" });
    }

    // Parse the webhook payload
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    app.log.info(
      { eventNotifications: (payload as any)?.eventNotifications?.length ?? 0 },
      "QuickBooks webhook received",
    );

    // Process event notifications
    const notifications = (payload as any)?.eventNotifications ?? [];
    for (const notification of notifications) {
      const realmId = notification?.realmId;
      const entities = notification?.dataChangeEvent?.entities ?? [];

      for (const entity of entities) {
        app.log.info(
          {
            realmId,
            entityName: entity.name,
            entityId: entity.id,
            operation: entity.operation,
          },
          "QuickBooks entity change",
        );
      }
    }

    // Intuit expects 200 OK response
    return reply.code(200).send({ ok: true });
  });
};
