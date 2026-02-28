/**
 * Token refresh and revocation lifecycle.
 *
 * Provides two main functions:
 *   - refreshTokenIfNeeded(env, tenantId, provider) — refreshes if within 10min of expiry
 *   - revokeToken(env, tenantId, provider)          — revokes at provider + clears storage
 */
import type { Env } from "../env.js";
import { prisma } from "../db/prisma.js";
import { readTokenVault, updateTokenVaultAccessToken, clearTokenVault } from "./tokenStore.js";
import { refreshRedditToken } from "../oauth.js";

type Provider = "google" | "meta" | "x" | "microsoft" | "reddit" | "pinterest" | "linkedin";

const REFRESH_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ── Refresh ──────────────────────────────────────────────────────────────────

async function refreshGoogle(env: Env, refreshToken: string) {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    client_secret: env.GOOGLE_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as any;
  if (!r.ok) throw new Error(`Google refresh failed: ${data?.error_description ?? JSON.stringify(data)}`);
  return { access_token: data.access_token as string, expires_in: data.expires_in as number };
}

async function refreshX(env: Env, refreshToken: string) {
  const basic = Buffer.from(`${env.X_CLIENT_ID!}:${env.X_CLIENT_SECRET!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.X_CLIENT_ID!,
  });
  const r = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const data = (await r.json()) as any;
  if (!r.ok) throw new Error(`X refresh failed: ${data?.error_description ?? JSON.stringify(data)}`);
  return { access_token: data.access_token as string, expires_in: data.expires_in as number };
}

async function refreshLinkedIn(env: Env, refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.LINKEDIN_CLIENT_ID!,
    client_secret: env.LINKEDIN_CLIENT_SECRET!,
  });
  const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as any;
  if (!r.ok) throw new Error(`LinkedIn refresh failed: ${data?.error_description ?? data?.error ?? JSON.stringify(data)}`);
  return { access_token: data.access_token as string, expires_in: data.expires_in as number };
}

async function refreshPinterest(env: Env, refreshToken: string) {
  const basic = Buffer.from(`${env.PINTEREST_APP_ID!}:${env.PINTEREST_SECRET_KEY!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const r = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = (await r.json()) as any;
  if (!r.ok) throw new Error(`Pinterest refresh failed: ${data?.message ?? data?.error ?? JSON.stringify(data)}`);
  return { access_token: data.access_token as string, expires_in: data.expires_in as number };
}

async function refreshMeta(env: Env, currentToken: string) {
  // Meta uses token exchange (long-lived token from short-lived)
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: env.META_APP_ID!,
    client_secret: env.META_APP_SECRET!,
    fb_exchange_token: currentToken,
  });
  const r = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`);
  const data = (await r.json()) as any;
  if (!r.ok) throw new Error(`Meta token exchange failed: ${data?.error?.message ?? JSON.stringify(data)}`);
  return { access_token: data.access_token as string, expires_in: data.expires_in as number };
}

async function refreshMicrosoft(env: Env, refreshToken: string) {
  const tenant = env.MICROSOFT_TENANT_ID ?? "common";
  const body = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID!,
    client_secret: env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as any;
  if (!r.ok) throw new Error(`Microsoft refresh failed: ${data?.error_description ?? JSON.stringify(data)}`);
  return { access_token: data.access_token as string, expires_in: data.expires_in as number };
}

/**
 * Check token expiry and refresh if within REFRESH_WINDOW_MS.
 * Returns the current (or refreshed) access_token, or null if unavailable.
 */
export async function refreshTokenIfNeeded(
  env: Env,
  tenantId: string,
  provider: Provider,
): Promise<string | null> {
  const vault = await readTokenVault(env, tenantId, provider);
  if (!vault) return null;

  const needsRefresh =
    vault.expires_at &&
    new Date(vault.expires_at).getTime() < Date.now() + REFRESH_WINDOW_MS;

  if (!needsRefresh) return vault.access_token;

  try {
    let result: { access_token: string; expires_in: number };

    switch (provider) {
      case "google":
        if (!vault.refresh_token) return vault.access_token;
        result = await refreshGoogle(env, vault.refresh_token);
        break;
      case "x":
        if (!vault.refresh_token) return vault.access_token;
        result = await refreshX(env, vault.refresh_token);
        break;
      case "reddit":
        if (!vault.refresh_token) return vault.access_token;
        result = await refreshRedditToken(env, vault.refresh_token);
        break;
      case "linkedin":
        if (!vault.refresh_token) return vault.access_token;
        result = await refreshLinkedIn(env, vault.refresh_token);
        break;
      case "pinterest":
        if (!vault.refresh_token) return vault.access_token;
        result = await refreshPinterest(env, vault.refresh_token);
        break;
      case "meta":
        // Meta uses token exchange instead of refresh_token
        result = await refreshMeta(env, vault.access_token);
        break;
      case "microsoft":
        if (!vault.refresh_token) return vault.access_token;
        result = await refreshMicrosoft(env, vault.refresh_token);
        break;
      default:
        return vault.access_token;
    }

    const expiresAt = new Date(Date.now() + result.expires_in * 1000).toISOString();
    await updateTokenVaultAccessToken(env, tenantId, provider, result.access_token, expiresAt);
    return result.access_token;
  } catch {
    // Refresh failed — return current token (may still work)
    return vault.access_token;
  }
}

// ── Revocation ───────────────────────────────────────────────────────────────

async function revokeGoogle(token: string) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

async function revokeX(env: Env, token: string) {
  const basic = Buffer.from(`${env.X_CLIENT_ID!}:${env.X_CLIENT_SECRET!}`).toString("base64");
  await fetch("https://api.twitter.com/2/oauth2/revoke", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ token, token_type_hint: "access_token" }),
  });
}

async function revokeReddit(env: Env, token: string) {
  const basic = Buffer.from(`${env.REDDIT_CLIENT_ID!}:${env.REDDIT_CLIENT_SECRET!}`).toString("base64");
  await fetch("https://www.reddit.com/api/v1/revoke_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
      "User-Agent": "AtlasUX/1.0 (by u/AtlasUXBot)",
    },
    body: new URLSearchParams({ token, token_type_hint: "access_token" }),
  });
}

async function revokeMeta(token: string) {
  await fetch(`https://graph.facebook.com/v19.0/me/permissions`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function revokeMicrosoft(env: Env, _token: string) {
  // Microsoft Graph doesn't have a public token revocation endpoint.
  // Best practice: delete the token from storage (done below).
  // For enterprise, admin consent can be revoked via Azure AD portal.
  void env;
}

async function revokeLinkedIn(_token: string) {
  // LinkedIn doesn't support programmatic token revocation.
  // Tokens expire naturally.
}

async function revokePinterest(_token: string) {
  // Pinterest doesn't have a public revocation endpoint.
  // Tokens expire naturally.
}

/**
 * Revoke a provider token (best-effort), then clear from both
 * token_vault and integration table.
 */
export async function revokeToken(
  env: Env,
  tenantId: string,
  provider: Provider,
): Promise<void> {
  // Read current token for revocation call
  const vault = await readTokenVault(env, tenantId, provider);
  const token = vault?.access_token;

  // Best-effort provider revocation — never throw
  if (token) {
    try {
      switch (provider) {
        case "google":
          await revokeGoogle(token);
          break;
        case "x":
          await revokeX(env, token);
          break;
        case "reddit":
          await revokeReddit(env, token);
          break;
        case "meta":
          await revokeMeta(token);
          break;
        case "microsoft":
          await revokeMicrosoft(env, token);
          break;
        case "linkedin":
          await revokeLinkedIn(token);
          break;
        case "pinterest":
          await revokePinterest(token);
          break;
      }
    } catch {
      // Revocation is best-effort — we still clear storage below
    }
  }

  // Clear token_vault (Supabase)
  await clearTokenVault(env, tenantId, provider).catch(() => null);

  // Clear integration table tokens (Prisma)
  await prisma.integration
    .updateMany({
      where: { tenantId, provider: provider as any },
      data: { access_token: null, refresh_token: null, token_expires_at: null },
    })
    .catch(() => null);
}
