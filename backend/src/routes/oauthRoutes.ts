import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "crypto";
import { loadEnv } from "../env.js";
import { buildXAuthUrl, exchangeXCode, makePkcePair, storeTokenVault } from "../oauth.js";
import { tumblrAccessToken, tumblrAuthorizeUrl, tumblrRequestToken } from "../integrations/tumblr.client.js";

// Local OAuth stubs.
// In real deployments this redirects to provider consent; for local alpha we simply mark connected
// and bounce back to the frontend Integrations page with a query flag.

export const oauthRoutes: FastifyPluginAsync = async (app) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  const env = loadEnv(process.env);

  // PKCE verifier store (alpha-grade). Keyed by nonce.
  const pkce = new Map<string, { code_verifier: string; createdAt: number }>();

  // Tumblr request-token secret store (alpha-grade). Keyed by oauth_token.
  const tumblrTmp = new Map<string, { tokenSecret: string; createdAt: number; org_id: string; user_id: string }>();

  function b64urlJson(obj: any) {
    const json = JSON.stringify(obj);
    return Buffer.from(json)
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

  // X (Twitter) OAuth2 user-context (real)
  app.get("/x/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = q.org_id ?? q.orgId ?? null;
    const user_id = q.user_id ?? q.userId ?? null;

    const nonce = randomBytes(32).toString("hex");
    const pair = await makePkcePair();
    pkce.set(nonce, { code_verifier: pair.code_verifier, createdAt: Date.now() });

    // prune old entries
    for (const [k, v] of pkce.entries()) {
      if (Date.now() - v.createdAt > 15 * 60 * 1000) pkce.delete(k);
    }

    const state = b64urlJson({ org_id: org_id ?? "", user_id: user_id ?? "", nonce });
    const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];
    const url = buildXAuthUrl(env, { state, code_challenge: pair.code_challenge, scopes });
    reply.redirect(url);
  });

  app.get("/x/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const code = q.code;
    const stateRaw = q.state;
    const error = q.error;

    const url = new URL(FRONTEND_URL);
    url.hash = "#/app/integrations";

    if (error) {
      url.searchParams.set("oauth_error", String(error));
      return reply.redirect(url.toString());
    }
    if (!code || !stateRaw) {
      url.searchParams.set("oauth_error", "missing_code_or_state");
      return reply.redirect(url.toString());
    }

    let state: any;
    try {
      state = parseState(String(stateRaw));
    } catch {
      url.searchParams.set("oauth_error", "bad_state");
      return reply.redirect(url.toString());
    }

    const nonce = String(state.nonce || "");
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");
    const verifier = pkce.get(nonce)?.code_verifier;

    if (!verifier) {
      url.searchParams.set("oauth_error", "pkce_expired");
      return reply.redirect(url.toString());
    }

    try {
      const tok = await exchangeXCode(env, { code: String(code), code_verifier: verifier });
      pkce.delete(nonce);

      const expires_at = tok.expires_in
        ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
        : null;

      await storeTokenVault(env, {
        org_id,
        user_id,
        provider: "x",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at,
        scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });

      url.searchParams.set("connected", "x");
      url.searchParams.set("org_id", org_id);
      url.searchParams.set("user_id", user_id);
      return reply.redirect(url.toString());
    } catch (e: any) {
      url.searchParams.set("oauth_error", e?.message ? String(e.message) : "token_exchange_failed");
      return reply.redirect(url.toString());
    }
  });

  // Tumblr OAuth 1.0a (real)
  app.get("/tumblr/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    const tok = await tumblrRequestToken(env);
    tumblrTmp.set(tok.oauth_token, { tokenSecret: tok.oauth_token_secret, createdAt: Date.now(), org_id, user_id });

    // prune old entries
    for (const [k, v] of tumblrTmp.entries()) {
      if (Date.now() - v.createdAt > 15 * 60 * 1000) tumblrTmp.delete(k);
    }

    reply.redirect(tumblrAuthorizeUrl(env, tok.oauth_token));
  });

  app.get("/tumblr/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const oauth_token = String(q.oauth_token ?? "");
    const oauth_verifier = String(q.oauth_verifier ?? "");

    const url = new URL(FRONTEND_URL);
    url.hash = "#/app/integrations";

    const tmp = tumblrTmp.get(oauth_token);
    if (!oauth_token || !oauth_verifier || !tmp) {
      url.searchParams.set("oauth_error", "tumblr_missing_or_expired");
      return reply.redirect(url.toString());
    }

    try {
      const acc = await tumblrAccessToken(env, oauth_token, oauth_verifier, tmp.tokenSecret);
      tumblrTmp.delete(oauth_token);

      await storeTokenVault(env, {
        org_id: tmp.org_id,
        user_id: tmp.user_id,
        provider: "tumblr",
        access_token: acc.oauth_token,
        refresh_token: null,
        expires_at: null,
        scope: null,
        meta: {
          oauth_token_secret: acc.oauth_token_secret,
          raw: acc,
        },
      });

      url.searchParams.set("connected", "tumblr");
      url.searchParams.set("org_id", tmp.org_id);
      url.searchParams.set("user_id", tmp.user_id);
      return reply.redirect(url.toString());
    } catch (e: any) {
      url.searchParams.set("oauth_error", e?.message ? String(e.message) : "tumblr_token_exchange_failed");
      return reply.redirect(url.toString());
    }
  });
};
