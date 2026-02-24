import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "crypto";
import { loadEnv } from "../env.js";
import {
  buildXAuthUrl, exchangeXCode, makePkcePair, storeTokenVault,
  oauthEnabled, buildGoogleAuthUrl, exchangeGoogleCode,
  buildMetaAuthUrl, exchangeMetaCode,
} from "../oauth.js";
import { tumblrAccessToken, tumblrAuthorizeUrl, tumblrRequestToken } from "../integrations/tumblr.client.js";
import { prisma } from "../db/prisma.js";

export const oauthRoutes: FastifyPluginAsync = async (app) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  const env = loadEnv(process.env);

  // PKCE verifier store. Keyed by nonce, pruned at 15 min.
  const pkce = new Map<string, { code_verifier: string; createdAt: number }>();

  // Tumblr request-token secret store. Keyed by oauth_token.
  const tumblrTmp = new Map<string, { tokenSecret: string; createdAt: number; org_id: string; user_id: string }>();

  function b64urlJson(obj: any) {
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

  /** Mark the Integration row connected so the status endpoint sees it immediately. */
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

  /** Bounce-back redirect used when a real OAuth flow isn't configured. */
  async function stubConnect(req: any, provider: "google" | "meta") {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (org_id) await markConnected(org_id, provider);

    const url = new URL(FRONTEND_URL);
    url.hash = "#/app/integrations";
    url.searchParams.set("connected", provider);
    if (org_id) url.searchParams.set("org_id", org_id);
    if (user_id) url.searchParams.set("user_id", user_id);
    return url.toString();
  }

  // ── Google ────────────────────────────────────────────────────────────────

  app.get("/google/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (oauthEnabled("google", env)) {
      const state = b64urlJson({ org_id, user_id });
      const scopes = [
        "openid", "email", "profile",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/business.manage",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/gmail.readonly",
      ];
      return reply.redirect(buildGoogleAuthUrl(env, state, scopes));
    }

    return reply.redirect(await stubConnect(req, "google"));
  });

  app.get("/google/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const url = new URL(FRONTEND_URL);
    url.hash = "#/app/integrations";

    if (q.error) {
      url.searchParams.set("oauth_error", String(q.error_description ?? q.error));
      return reply.redirect(url.toString());
    }

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    try {
      const tok = await exchangeGoogleCode(env, String(q.code || ""));
      const expires_at = tok.expires_in
        ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
        : null;

      await storeTokenVault(env, {
        org_id, user_id, provider: "google",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });

      await markConnected(org_id, "google");

      url.searchParams.set("connected", "google");
      url.searchParams.set("org_id", org_id);
      url.searchParams.set("user_id", user_id);
      return reply.redirect(url.toString());
    } catch (e: any) {
      url.searchParams.set("oauth_error", e?.message ? String(e.message) : "google_token_exchange_failed");
      return reply.redirect(url.toString());
    }
  });

  // ── Meta ──────────────────────────────────────────────────────────────────

  app.get("/meta/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (oauthEnabled("meta", env)) {
      const state = b64urlJson({ org_id, user_id });
      const scopes = [
        "pages_read_engagement", "pages_manage_posts",
        "instagram_basic", "instagram_content_publish",
        "ads_read", "business_management",
      ];
      return reply.redirect(buildMetaAuthUrl(env, state, scopes));
    }

    return reply.redirect(await stubConnect(req, "meta"));
  });

  app.get("/meta/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const url = new URL(FRONTEND_URL);
    url.hash = "#/app/integrations";

    if (q.error) {
      url.searchParams.set("oauth_error", String(q.error_description ?? q.error));
      return reply.redirect(url.toString());
    }

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    try {
      const tok = await exchangeMetaCode(env, String(q.code || ""));
      const expires_at = tok.expires_in
        ? new Date(Date.now() + tok.expires_in * 1000).toISOString()
        : null;

      await storeTokenVault(env, {
        org_id, user_id, provider: "meta",
        access_token: tok.access_token,
        refresh_token: null,
        expires_at, scope: null,
        meta: { token_type: tok.token_type },
      });

      await markConnected(org_id, "meta");

      url.searchParams.set("connected", "meta");
      url.searchParams.set("org_id", org_id);
      url.searchParams.set("user_id", user_id);
      return reply.redirect(url.toString());
    } catch (e: any) {
      url.searchParams.set("oauth_error", e?.message ? String(e.message) : "meta_token_exchange_failed");
      return reply.redirect(url.toString());
    }
  });

  // ── X (Twitter) OAuth2 PKCE ───────────────────────────────────────────────

  app.get("/x/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    const nonce = randomBytes(32).toString("hex");
    const pair = await makePkcePair();
    pkce.set(nonce, { code_verifier: pair.code_verifier, createdAt: Date.now() });

    for (const [k, v] of pkce.entries()) {
      if (Date.now() - v.createdAt > 15 * 60 * 1000) pkce.delete(k);
    }

    const state = b64urlJson({ org_id, user_id, nonce });
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
        org_id, user_id, provider: "x",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });

      await markConnected(org_id, "x");

      url.searchParams.set("connected", "x");
      url.searchParams.set("org_id", org_id);
      url.searchParams.set("user_id", user_id);
      return reply.redirect(url.toString());
    } catch (e: any) {
      url.searchParams.set("oauth_error", e?.message ? String(e.message) : "token_exchange_failed");
      return reply.redirect(url.toString());
    }
  });

  // ── Tumblr OAuth 1.0a ─────────────────────────────────────────────────────

  app.get("/tumblr/start", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    const tok = await tumblrRequestToken(env);
    tumblrTmp.set(tok.oauth_token, { tokenSecret: tok.oauth_token_secret, createdAt: Date.now(), org_id, user_id });

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
        meta: { oauth_token_secret: acc.oauth_token_secret, raw: acc },
      });

      await markConnected(tmp.org_id, "tumblr");

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
