import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "crypto";
import { loadEnv } from "../env.js";
import {
  buildXAuthUrl, exchangeXCode, makePkcePair, storeTokenVault,
  oauthEnabled, buildGoogleAuthUrl, exchangeGoogleCode,
  buildMetaAuthUrl, exchangeMetaCode,
  buildMicrosoftAuthUrl, exchangeMicrosoftCode,
  buildRedditAuthUrl, exchangeRedditCode,
  buildPinterestAuthUrl, exchangePinterestCode,
  buildLinkedInAuthUrl, exchangeLinkedInCode,
  buildZoomAuthUrl, exchangeZoomCode,
  buildNotionAuthUrl, exchangeNotionCode,
  buildAirtableAuthUrl, exchangeAirtableCode,
  buildDropboxAuthUrl, exchangeDropboxCode,
  buildSlackAuthUrl, exchangeSlackCode,
  buildPayPalAuthUrl, exchangePayPalCode,
  buildSquareAuthUrl, exchangeSquareCode,
  buildMeetupAuthUrl, exchangeMeetupCode,
  buildTikTokAuthUrl, exchangeTikTokCode, fetchTikTokUserInfo,
} from "../oauth.js";
import { tumblrAccessToken, tumblrAuthorizeUrl, tumblrRequestToken } from "../integrations/tumblr.client.js";
import { prisma } from "../db/prisma.js";
import { setOAuthState, getOAuthState, deleteOAuthState, pruneExpiredOAuthState } from "../lib/oauthState.js";

export const oauthRoutes: FastifyPluginAsync = async (app) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "https://atlasux.cloud";
  const env = loadEnv(process.env);

  function genNonce() { return randomBytes(16).toString("hex"); }

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

  /**
   * Build the redirect URL back to the integrations tab.
   * Params must be INSIDE the hash so React Router HashRouter's useSearchParams() can read them.
   * Result: https://atlasux.cloud#/app/settings?tab=integrations&connected=meta&...
   */
  function buildReturnUrl(params: Record<string, string>): string {
    const hashParams = new URLSearchParams({ tab: "integrations", ...params });
    const base = new URL(FRONTEND_URL);
    base.hash = `#/app/settings?${hashParams.toString()}`;
    return base.toString();
  }

  /** Bounce-back redirect used when a real OAuth flow isn't configured.
   *  Does NOT mark the integration as connected — returns an error to the frontend. */
  function stubConnectUrl(req: any, provider: string): string {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    return buildReturnUrl({
      error: "oauth_not_configured",
      provider,
      ...(org_id ? { org_id } : {}),
      ...(user_id ? { user_id } : {}),
    });
  }

  // Periodically prune expired oauth_state rows (every 5 minutes)
  const pruneInterval = setInterval(() => {
    pruneExpiredOAuthState().catch(() => null);
  }, 5 * 60 * 1000);
  // Clean up interval when Fastify shuts down
  app.addHook("onClose", async () => clearInterval(pruneInterval));

  // ── Google ────────────────────────────────────────────────────────────────

  const oauthRateLimit = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

  app.get("/google/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (oauthEnabled("google", env)) {
      const nonce = genNonce();
      await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
      const state = b64urlJson({ org_id, user_id, nonce });
      const scopes = [
        "openid", "email", "profile",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.force-ssl",
        "https://www.googleapis.com/auth/business.manage",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/gmail.readonly",
      ];
      return reply.redirect(buildGoogleAuthUrl(env, state, scopes));
    }

    return reply.redirect(stubConnectUrl(req, "google"));
  });

  app.get("/google/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;

    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    // CSRF nonce check — reject if nonce missing or not in our store
    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeGoogleCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, { org_id, user_id, provider: "google", access_token: tok.access_token, refresh_token: tok.refresh_token ?? null, expires_at, scope: tok.scope ?? null, meta: { token_type: tok.token_type } });
      await markConnected(org_id, "google");
      return reply.redirect(buildReturnUrl({ connected: "google", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "google_token_exchange_failed" }));
    }
  });

  // ── Meta ──────────────────────────────────────────────────────────────────

  app.get("/meta/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (oauthEnabled("meta", env)) {
      const nonce = genNonce();
      await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
      const state = b64urlJson({ org_id, user_id, nonce });
      const scopes = [
        "pages_read_engagement", "pages_manage_posts",
        "instagram_basic", "instagram_content_publish",
        "ads_read", "business_management",
      ];
      return reply.redirect(buildMetaAuthUrl(env, state, scopes));
    }

    return reply.redirect(stubConnectUrl(req, "meta"));
  });

  app.get("/meta/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;

    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeMetaCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, { org_id, user_id, provider: "meta", access_token: tok.access_token, refresh_token: null, expires_at, scope: null, meta: { token_type: tok.token_type } });
      await markConnected(org_id, "meta");
      return reply.redirect(buildReturnUrl({ connected: "meta", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "meta_token_exchange_failed" }));
    }
  });

  // ── X (Twitter) OAuth2 PKCE ───────────────────────────────────────────────

  app.get("/x/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    const nonce = randomBytes(32).toString("hex");
    const pair = await makePkcePair();
    await setOAuthState(`pkce:${nonce}`, { code_verifier: pair.code_verifier });

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

    if (error) return reply.redirect(buildReturnUrl({ oauth_error: String(error) }));
    if (!code || !stateRaw) return reply.redirect(buildReturnUrl({ oauth_error: "missing_code_or_state" }));

    let state: any;
    try { state = parseState(String(stateRaw)); } catch { return reply.redirect(buildReturnUrl({ oauth_error: "bad_state" })); }

    const nonce = String(state.nonce || "");
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");
    const pkceData = nonce ? await getOAuthState<{ code_verifier: string }>(`pkce:${nonce}`) : null;
    const verifier = pkceData?.code_verifier;

    if (!verifier) return reply.redirect(buildReturnUrl({ oauth_error: "pkce_expired" }));

    try {
      const tok = await exchangeXCode(env, { code: String(code), code_verifier: verifier });
      await deleteOAuthState(`pkce:${nonce}`);
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, { org_id, user_id, provider: "x", access_token: tok.access_token, refresh_token: tok.refresh_token ?? null, expires_at, scope: tok.scope ?? null, meta: { token_type: tok.token_type } });
      await markConnected(org_id, "x");
      return reply.redirect(buildReturnUrl({ connected: "x", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "token_exchange_failed" }));
    }
  });

  // ── Tumblr OAuth 1.0a ─────────────────────────────────────────────────────

  app.get("/tumblr/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    const tok = await tumblrRequestToken(env);
    await setOAuthState(`tumblr:${tok.oauth_token}`, { tokenSecret: tok.oauth_token_secret, org_id, user_id });

    reply.redirect(tumblrAuthorizeUrl(env, tok.oauth_token));
  });

  app.get("/tumblr/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const oauth_token = String(q.oauth_token ?? "");
    const oauth_verifier = String(q.oauth_verifier ?? "");
    const tmp = oauth_token ? await getOAuthState<{ tokenSecret: string; org_id: string; user_id: string }>(`tumblr:${oauth_token}`) : null;
    if (!oauth_token || !oauth_verifier || !tmp) {
      return reply.redirect(buildReturnUrl({ oauth_error: "tumblr_missing_or_expired" }));
    }

    try {
      const acc = await tumblrAccessToken(env, oauth_token, oauth_verifier, tmp.tokenSecret);
      await deleteOAuthState(`tumblr:${oauth_token}`);
      await storeTokenVault(env, { org_id: tmp.org_id, user_id: tmp.user_id, provider: "tumblr", access_token: acc.oauth_token, refresh_token: null, expires_at: null, scope: null, meta: { oauth_token_secret: acc.oauth_token_secret, raw: acc } });
      await markConnected(tmp.org_id, "tumblr");
      return reply.redirect(buildReturnUrl({ connected: "tumblr", org_id: tmp.org_id, user_id: tmp.user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "tumblr_token_exchange_failed" }));
    }
  });

  // ── Reddit ────────────────────────────────────────────────────────────────

  app.get("/reddit/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.tenantId ?? (req as any).tenantId ?? "");
    const user_id = String(q.user_id ?? "");

    if (!oauthEnabled("reddit", env)) {
      return reply.redirect(buildReturnUrl({ error: "oauth_not_configured", provider: "reddit", org_id, user_id }));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildRedditAuthUrl(env, state));
  });

  app.get("/reddit/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeRedditCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "reddit" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "reddit" as any);
      return reply.redirect(buildReturnUrl({ connected: "reddit", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "reddit_token_exchange_failed" }));
    }
  });

  // ── Pinterest OAuth2 ──────────────────────────────────────────────────────

  app.get("/pinterest/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("pinterest", env)) {
      return reply.redirect(buildReturnUrl({ error: "oauth_not_configured", provider: "pinterest", org_id, user_id }));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildPinterestAuthUrl(env, state));
  });

  app.get("/pinterest/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangePinterestCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "pinterest",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "pinterest");
      return reply.redirect(buildReturnUrl({ connected: "pinterest", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "pinterest_token_exchange_failed" }));
    }
  });

  // ── LinkedIn OAuth2 ────────────────────────────────────────────────────────

  app.get("/linkedin/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("linkedin", env)) {
      // Credentials not configured yet — redirect back with informative error
      return reply.redirect(buildReturnUrl({ error: "oauth_not_configured", provider: "linkedin" }));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildLinkedInAuthUrl(env, state));
  });

  app.get("/linkedin/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeLinkedInCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "linkedin",
        access_token: tok.access_token,
        refresh_token: null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "linkedin");
      return reply.redirect(buildReturnUrl({ connected: "linkedin", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "linkedin_token_exchange_failed" }));
    }
  });

  // ── Zoom OAuth2 ──────────────────────────────────────────────────────────

  app.get("/zoom/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("zoom", env)) {
      return reply.redirect(buildReturnUrl({ error: "oauth_not_configured", provider: "zoom", org_id, user_id }));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildZoomAuthUrl(env, state));
  });

  app.get("/zoom/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeZoomCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "zoom",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "zoom");
      return reply.redirect(buildReturnUrl({ connected: "zoom", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "zoom_token_exchange_failed" }));
    }
  });

  // ── Notion OAuth2 ───────────────────────────────────────────────────────

  app.get("/notion/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("notion", env)) {
      return reply.redirect(stubConnectUrl(req, "notion"));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildNotionAuthUrl(env, state));
  });

  app.get("/notion/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeNotionCode(env, String(q.code || ""));
      // Notion tokens don't expire
      await storeTokenVault(env, {
        org_id, user_id, provider: "notion" as any,
        access_token: tok.access_token,
        refresh_token: null,
        expires_at: null,
        scope: null,
        meta: { token_type: tok.token_type, workspace_id: tok.workspace_id, workspace_name: tok.workspace_name, bot_id: tok.bot_id },
      });
      await markConnected(org_id, "notion");
      return reply.redirect(buildReturnUrl({ connected: "notion", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "notion_token_exchange_failed" }));
    }
  });

  // ── Airtable OAuth2 (PKCE) ─────────────────────────────────────────────

  app.get("/airtable/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("airtable", env)) {
      return reply.redirect(stubConnectUrl(req, "airtable"));
    }

    const nonce = randomBytes(32).toString("hex");
    const pair = await makePkcePair();
    await setOAuthState(`pkce:${nonce}`, { code_verifier: pair.code_verifier, org_id, user_id });

    const state = b64urlJson({ org_id, user_id, nonce });
    const url = buildAirtableAuthUrl(env, { state, code_challenge: pair.code_challenge });
    reply.redirect(url);
  });

  app.get("/airtable/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const code = q.code;
    const stateRaw = q.state;
    const error = q.error;

    if (error) return reply.redirect(buildReturnUrl({ oauth_error: String(error) }));
    if (!code || !stateRaw) return reply.redirect(buildReturnUrl({ oauth_error: "missing_code_or_state" }));

    let state: any;
    try { state = parseState(String(stateRaw)); } catch { return reply.redirect(buildReturnUrl({ oauth_error: "bad_state" })); }

    const nonce = String(state.nonce || "");
    const pkceData = nonce ? await getOAuthState<{ code_verifier: string; org_id: string; user_id: string }>(`pkce:${nonce}`) : null;
    const verifier = pkceData?.code_verifier;
    const org_id = pkceData?.org_id ?? String(state.org_id || "");
    const user_id = pkceData?.user_id ?? String(state.user_id || "");

    if (!verifier) return reply.redirect(buildReturnUrl({ oauth_error: "pkce_expired" }));

    try {
      const tok = await exchangeAirtableCode(env, { code: String(code), code_verifier: verifier });
      await deleteOAuthState(`pkce:${nonce}`);
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "airtable" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "airtable");
      return reply.redirect(buildReturnUrl({ connected: "airtable", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "airtable_token_exchange_failed" }));
    }
  });

  // ── Dropbox OAuth2 ─────────────────────────────────────────────────────

  app.get("/dropbox/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("dropbox", env)) {
      return reply.redirect(stubConnectUrl(req, "dropbox"));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildDropboxAuthUrl(env, state));
  });

  app.get("/dropbox/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeDropboxCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "dropbox" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: null,
        meta: { token_type: tok.token_type, uid: tok.uid, account_id: tok.account_id },
      });
      await markConnected(org_id, "dropbox");
      return reply.redirect(buildReturnUrl({ connected: "dropbox", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "dropbox_token_exchange_failed" }));
    }
  });

  // ── Slack OAuth v2 ─────────────────────────────────────────────────────

  app.get("/slack/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("slack", env)) {
      return reply.redirect(stubConnectUrl(req, "slack"));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildSlackAuthUrl(env, state));
  });

  app.get("/slack/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeSlackCode(env, String(q.code || ""));
      // Slack tokens don't expire
      await storeTokenVault(env, {
        org_id, user_id, provider: "slack" as any,
        access_token: tok.access_token,
        refresh_token: null,
        expires_at: null,
        scope: tok.scope ?? null,
        meta: { token_type: tok.token_type, team_id: tok.team.id, team_name: tok.team.name, bot_user_id: tok.bot_user_id, app_id: tok.app_id },
      });
      await markConnected(org_id, "slack");
      return reply.redirect(buildReturnUrl({ connected: "slack", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "slack_token_exchange_failed" }));
    }
  });

  // ── PayPal OAuth2 ──────────────────────────────────────────────────────

  app.get("/paypal/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("paypal", env)) {
      return reply.redirect(stubConnectUrl(req, "paypal"));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildPayPalAuthUrl(env, state));
  });

  app.get("/paypal/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangePayPalCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "paypal" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "paypal");
      return reply.redirect(buildReturnUrl({ connected: "paypal", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "paypal_token_exchange_failed" }));
    }
  });

  // ── Square OAuth2 ──────────────────────────────────────────────────────

  app.get("/square/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("square", env)) {
      return reply.redirect(stubConnectUrl(req, "square"));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildSquareAuthUrl(env, state));
  });

  app.get("/square/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeSquareCode(env, String(q.code || ""));
      // Square returns expires_at (ISO string) directly
      await storeTokenVault(env, {
        org_id, user_id, provider: "square" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at: tok.expires_at ?? null,
        scope: tok.scope ?? null,
        meta: { token_type: tok.token_type, merchant_id: tok.merchant_id },
      });
      await markConnected(org_id, "square");
      return reply.redirect(buildReturnUrl({ connected: "square", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "square_token_exchange_failed" }));
    }
  });

  // ── Meetup OAuth2 ───────────────────────────────────────────────────────

  app.get("/meetup/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("meetup", env)) {
      return reply.redirect(stubConnectUrl(req, "meetup"));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildMeetupAuthUrl(env, state));
  });

  app.get("/meetup/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeMeetupCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "meetup" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "meetup");
      return reply.redirect(buildReturnUrl({ connected: "meetup", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "meetup_token_exchange_failed" }));
    }
  });

  // ── Microsoft 365 ─────────────────────────────────────────────────────────

  app.get("/microsoft/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.tenantId ?? (req as any).tenantId ?? "");
    const user_id = String(q.user_id ?? "");

    if (!oauthEnabled("microsoft", env)) {
      return reply.redirect(buildReturnUrl({ error: "oauth_not_configured", provider: "microsoft", org_id, user_id }));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = JSON.stringify({ org_id, user_id, nonce });
    const stateB64 = Buffer.from(state).toString("base64url");
    return reply.redirect(buildMicrosoftAuthUrl(env, stateB64));
  });

  app.get("/microsoft/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = JSON.parse(Buffer.from(String(q.state || ""), "base64url").toString()); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeMicrosoftCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;
      await storeTokenVault(env, {
        org_id, user_id, provider: "microsoft" as any,
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: { token_type: tok.token_type },
      });
      await markConnected(org_id, "microsoft" as any);
      return reply.redirect(buildReturnUrl({ connected: "microsoft", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "microsoft_token_exchange_failed" }));
    }
  });

  // ── TikTok OAuth2 ──────────────────────────────────────────────────────────

  app.get("/tiktok/start", oauthRateLimit, async (req, reply) => {
    const q = (req.query ?? {}) as any;
    const org_id = String(q.org_id ?? q.orgId ?? q.tenantId ?? "");
    const user_id = String(q.user_id ?? q.userId ?? "");

    if (!oauthEnabled("tiktok", env)) {
      return reply.redirect(buildReturnUrl({ error: "oauth_not_configured", provider: "tiktok", org_id, user_id }));
    }

    const nonce = genNonce();
    await setOAuthState(`csrf:${nonce}`, { org_id, user_id });
    const state = b64urlJson({ org_id, user_id, nonce });
    return reply.redirect(buildTikTokAuthUrl(env, state));
  });

  app.get("/tiktok/callback", async (req, reply) => {
    const q = (req.query ?? {}) as any;
    if (q.error) return reply.redirect(buildReturnUrl({ oauth_error: String(q.error_description ?? q.error) }));

    let state: any = {};
    try { state = parseState(String(q.state || "")); } catch {}
    const org_id = String(state.org_id || "");
    const user_id = String(state.user_id || "");

    const nonce = String(state.nonce || "");
    const csrfData = nonce ? await getOAuthState(`csrf:${nonce}`) : null;
    if (!nonce || !csrfData) {
      return reply.redirect(buildReturnUrl({ oauth_error: "csrf_invalid" }));
    }
    await deleteOAuthState(`csrf:${nonce}`);

    try {
      const tok = await exchangeTikTokCode(env, String(q.code || ""));
      const expires_at = tok.expires_in ? new Date(Date.now() + tok.expires_in * 1000).toISOString() : null;

      // Fetch user profile info to store with the token
      let userInfo: any = {};
      try {
        userInfo = await fetchTikTokUserInfo(tok.access_token);
      } catch {
        // Non-fatal — we still have the token
      }

      await storeTokenVault(env, {
        org_id, user_id, provider: "tiktok",
        access_token: tok.access_token,
        refresh_token: tok.refresh_token ?? null,
        expires_at, scope: tok.scope ?? null,
        meta: {
          token_type: tok.token_type,
          open_id: tok.open_id,
          display_name: userInfo.display_name,
          avatar_url: userInfo.avatar_url,
          bio: userInfo.bio_description,
          is_verified: userInfo.is_verified,
        },
      });
      await markConnected(org_id, "tiktok");
      return reply.redirect(buildReturnUrl({ connected: "tiktok", org_id, user_id }));
    } catch (e: any) {
      return reply.redirect(buildReturnUrl({ oauth_error: e?.message ? String(e.message) : "tiktok_token_exchange_failed" }));
    }
  });
};
