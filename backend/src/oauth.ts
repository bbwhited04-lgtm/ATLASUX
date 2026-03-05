import type { Env } from "./env.js";
import { makeSupabase } from "./supabase.js";
import { webcrypto } from "node:crypto";
import { writeTokenVault } from "./lib/tokenStore.js";

export type Provider = "google" | "meta" | "x" | "tumblr" | "microsoft" | "reddit" | "pinterest" | "linkedin" | "zoom" | "notion" | "airtable" | "dropbox" | "slack" | "paypal" | "square" | "meetup" | "tiktok";

export function oauthEnabled(provider: Provider, env: Env): boolean {
  if (provider === "google") return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
  if (provider === "meta") return !!(env.META_APP_ID && env.META_APP_SECRET && env.META_REDIRECT_URI);
  if (provider === "x") return !!(env.X_CLIENT_ID && env.X_CLIENT_SECRET && env.X_REDIRECT_URI);
  if (provider === "tumblr") {
    return !!(
      env.TUMBLR_AUTH_KEY &&
      env.TUMBLR_OAUTH_SECRET &&
      env.TUMBLR_REQUEST_TOKEN_URL &&
      env.TUMBLR_AUTHORIZE_URL &&
      env.TUMBLR_ACCESS_TOKEN_URL &&
      env.TUMBLR_REDIRECT_URI
    );
  }
  if (provider === "microsoft") {
    return !!(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET && env.MICROSOFT_REDIRECT_URI);
  }
  if (provider === "reddit") {
    return !!(env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET && env.REDDIT_REDIRECT_URI);
  }
  if (provider === "pinterest") {
    return !!(env.PINTEREST_APP_ID && env.PINTEREST_SECRET_KEY && env.PINTEREST_REDIRECT_URI);
  }
  if (provider === "linkedin") {
    return !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET && env.LINKEDIN_REDIRECT_URI);
  }
  if (provider === "zoom") {
    return !!(env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET && env.ZOOM_REDIRECT_URI);
  }
  if (provider === "notion") {
    return !!(env.NOTION_CLIENT_ID && env.NOTION_CLIENT_SECRET && env.NOTION_REDIRECT_URI);
  }
  if (provider === "airtable") {
    return !!(env.AIRTABLE_CLIENT_ID && env.AIRTABLE_CLIENT_SECRET && env.AIRTABLE_REDIRECT_URI);
  }
  if (provider === "dropbox") {
    return !!(env.DROPBOX_APP_KEY && env.DROPBOX_APP_SECRET && env.DROPBOX_REDIRECT_URI);
  }
  if (provider === "slack") {
    return !!(env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET && env.APP_URL);
  }
  if (provider === "paypal") {
    return !!(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET && env.PAYPAL_REDIRECT_URI);
  }
  if (provider === "square") {
    return !!(env.SQUARE_APP_ID && env.SQUARE_APP_SECRET && env.SQUARE_REDIRECT_URI);
  }
  if (provider === "meetup") {
    return !!(env.MEETUP_CLIENT_ID && env.MEETUP_CLIENT_SECRET && env.MEETUP_REDIRECT_URI);
  }
  if (provider === "tiktok") {
    return !!(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET && env.TIKTOK_REDIRECT_URI);
  }
  return false;
}

// ── Reddit OAuth2 ─────────────────────────────────────────────────────────────

const REDDIT_SCOPES = ["identity", "submit", "read", "history", "privatemessages", "save"].join(" ");
const REDDIT_UA = "AtlasUX/1.0 (by u/AtlasUXBot)";

export function buildRedditAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.REDDIT_CLIENT_ID!,
    response_type: "code",
    state,
    redirect_uri: env.REDDIT_REDIRECT_URI!,
    duration: "permanent",
    scope: REDDIT_SCOPES,
  });
  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}

export async function exchangeRedditCode(env: Env, code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}> {
  const basic = Buffer.from(`${env.REDDIT_CLIENT_ID!}:${env.REDDIT_CLIENT_SECRET!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.REDDIT_REDIRECT_URI!,
  });
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Reddit token exchange failed: ${data.error ?? JSON.stringify(data)}`);
  return data;
}

export async function refreshRedditToken(env: Env, refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  scope: string;
}> {
  const basic = Buffer.from(`${env.REDDIT_CLIENT_ID!}:${env.REDDIT_CLIENT_SECRET!}`).toString("base64");
  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": REDDIT_UA,
    },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Reddit token refresh failed: ${data.error ?? JSON.stringify(data)}`);
  return data;
}

// ── Microsoft 365 / Graph API OAuth2 ─────────────────────────────────────────

const M365_SCOPES = [
  "offline_access",
  "Mail.Read", "Mail.ReadWrite", "Mail.Send",
  "Calendars.Read", "Calendars.ReadWrite",
  "Team.ReadBasic.All", "ChannelMessage.Read.All", "ChannelMessage.Send",
  "OnlineMeetings.Read", "OnlineMeetings.ReadWrite",
  "Files.Read.All", "Files.ReadWrite.All",
  "Sites.Read.All", "Sites.ReadWrite.All",
  "Notes.Read.All", "Notes.ReadWrite.All",
  "Tasks.Read", "Tasks.ReadWrite",
  "Bookings.Read.All", "BookingsAppointment.ReadWrite.All",
  "User.Read",
].join(" ");

export function buildMicrosoftAuthUrl(env: Env, state: string, scopes?: string) {
  const tenant = env.MICROSOFT_TENANT_ID ?? "common";
  const params = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: env.MICROSOFT_REDIRECT_URI!,
    response_mode: "query",
    scope: scopes ?? M365_SCOPES,
    state,
    prompt: "consent",
  });
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftCode(env: Env, code: string) {
  const tenant = env.MICROSOFT_TENANT_ID ?? "common";
  const body = new URLSearchParams({
    client_id: env.MICROSOFT_CLIENT_ID!,
    client_secret: env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: env.MICROSOFT_REDIRECT_URI!,
    grant_type: "authorization_code",
    scope: M365_SCOPES,
  });
  const r = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Microsoft token exchange failed: ${(data as any)?.error_description ?? JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
    id_token?: string;
  };
}

function base64Url(buf: Uint8Array) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function makePkcePair() {
  const verifier = base64Url(webcrypto.getRandomValues(new Uint8Array(32)));
  const data = new TextEncoder().encode(verifier);
  return webcrypto.subtle.digest("SHA-256", data).then((hash: ArrayBuffer) => ({
    code_verifier: verifier,
    code_challenge: base64Url(new Uint8Array(hash)),
    code_challenge_method: "S256" as const,
  }));
}

export function buildGoogleAuthUrl(env: Env, state: string, scopes: string[]) {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: env.GOOGLE_REDIRECT_URI!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: scopes.join(" "),
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(env: Env, code: string) {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CLIENT_ID!,
    client_secret: env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: env.GOOGLE_REDIRECT_URI!,
    grant_type: "authorization_code"
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Google token exchange failed: ${data?.error_description || JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
    id_token?: string;
  };
}

export function buildMetaAuthUrl(env: Env, state: string, scopes: string[]) {
  const params = new URLSearchParams({
    client_id: env.META_APP_ID!,
    redirect_uri: env.META_REDIRECT_URI!,
    response_type: "code",
    scope: scopes.join(","),
    state
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function exchangeMetaCode(env: Env, code: string) {
  const params = new URLSearchParams({
    client_id: env.META_APP_ID!,
    client_secret: env.META_APP_SECRET!,
    redirect_uri: env.META_REDIRECT_URI!,
    code
  });
  const r = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`, {
    method: "GET"
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Meta token exchange failed: ${data?.error?.message || JSON.stringify(data)}`);
  return data as { access_token: string; token_type?: string; expires_in?: number };
}

export function buildXAuthUrl(env: Env, args: {
  state: string;
  code_challenge: string;
  scopes: string[];
}) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.X_CLIENT_ID!,
    redirect_uri: env.X_REDIRECT_URI!,
    scope: args.scopes.join(" "),
    state: args.state,
    code_challenge: args.code_challenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

export async function exchangeXCode(env: Env, args: {
  code: string;
  code_verifier: string;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: args.code,
    client_id: env.X_CLIENT_ID!,
    redirect_uri: env.X_REDIRECT_URI!,
    code_verifier: args.code_verifier,
  });

  const basic = Buffer.from(`${env.X_CLIENT_ID!}:${env.X_CLIENT_SECRET!}`).toString("base64");
  const r = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`X token exchange failed: ${data?.error_description || JSON.stringify(data)}`);
  return data as {
    token_type: string;
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
}

// ── Pinterest OAuth 2.0 ───────────────────────────────────────────────────────

const PINTEREST_SCOPES = ["boards:read", "pins:read", "pins:write", "user_accounts:read"].join(",");

export function buildPinterestAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.PINTEREST_APP_ID!,
    redirect_uri: env.PINTEREST_REDIRECT_URI!,
    response_type: "code",
    scope: PINTEREST_SCOPES,
    state,
  });
  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

export async function exchangePinterestCode(env: Env, code: string) {
  const basic = Buffer.from(`${env.PINTEREST_APP_ID!}:${env.PINTEREST_SECRET_KEY!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.PINTEREST_REDIRECT_URI!,
  });
  const r = await fetch("https://api.pinterest.com/v5/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Pinterest token exchange failed: ${data.message ?? data.error ?? JSON.stringify(data)}`);
  return data as { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string };
}

// ── LinkedIn OAuth 2.0 ───────────────────────────────────────────────────────

const LINKEDIN_SCOPES = ["r_liteprofile", "r_emailaddress", "w_member_social", "rw_organization_social"].join(" ");

export function buildLinkedInAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.LINKEDIN_CLIENT_ID!,
    redirect_uri: env.LINKEDIN_REDIRECT_URI!,
    state,
    scope: LINKEDIN_SCOPES,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeLinkedInCode(env: Env, code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.LINKEDIN_CLIENT_ID!,
    client_secret: env.LINKEDIN_CLIENT_SECRET!,
    redirect_uri: env.LINKEDIN_REDIRECT_URI!,
  });
  const r = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`LinkedIn token exchange failed: ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
  return data as { access_token: string; expires_in?: number; scope?: string; token_type?: string };
}

// ── Zoom OAuth 2.0 ─────────────────────────────────────────────────────────────

const ZOOM_SCOPES = ["meeting:read", "meeting:write", "webinar:read", "recording:read", "user:read"].join(" ");

export function buildZoomAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.ZOOM_CLIENT_ID!,
    redirect_uri: env.ZOOM_REDIRECT_URI!,
    state,
  });
  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}

export async function exchangeZoomCode(env: Env, code: string) {
  const basic = Buffer.from(`${env.ZOOM_CLIENT_ID!}:${env.ZOOM_CLIENT_SECRET!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.ZOOM_REDIRECT_URI!,
  });
  const r = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Zoom token exchange failed: ${data.reason ?? data.error ?? JSON.stringify(data)}`);
  return data as { access_token: string; refresh_token?: string; expires_in?: number; token_type?: string; scope?: string };
}

// ── Notion OAuth 2.0 ──────────────────────────────────────────────────────────

const NOTION_SCOPES = ""; // Notion uses integration capabilities, no explicit scope param

export function buildNotionAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.NOTION_CLIENT_ID!,
    redirect_uri: env.NOTION_REDIRECT_URI!,
    response_type: "code",
    owner: "user",
    state,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

export async function exchangeNotionCode(env: Env, code: string) {
  const basic = Buffer.from(`${env.NOTION_CLIENT_ID!}:${env.NOTION_CLIENT_SECRET!}`).toString("base64");
  const r = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.NOTION_REDIRECT_URI!,
    }),
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Notion token exchange failed: ${data.error ?? JSON.stringify(data)}`);
  return data as {
    access_token: string;
    token_type: string;
    bot_id: string;
    workspace_id: string;
    workspace_name?: string;
    workspace_icon?: string;
    owner?: any;
  };
}

// ── Airtable OAuth 2.0 (PKCE) ───────────────────────────────────────────────

const AIRTABLE_SCOPES = [
  "data.records:read", "data.records:write",
  "data.recordComments:read", "data.recordComments:write",
  "schema.bases:read", "schema.bases:write",
].join(" ");

export function buildAirtableAuthUrl(env: Env, args: {
  state: string;
  code_challenge: string;
}) {
  const params = new URLSearchParams({
    client_id: env.AIRTABLE_CLIENT_ID!,
    redirect_uri: env.AIRTABLE_REDIRECT_URI!,
    response_type: "code",
    scope: AIRTABLE_SCOPES,
    state: args.state,
    code_challenge: args.code_challenge,
    code_challenge_method: "S256",
  });
  return `https://airtable.com/oauth2/v1/authorize?${params.toString()}`;
}

export async function exchangeAirtableCode(env: Env, args: {
  code: string;
  code_verifier: string;
}) {
  const basic = Buffer.from(`${env.AIRTABLE_CLIENT_ID!}:${env.AIRTABLE_CLIENT_SECRET!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: env.AIRTABLE_REDIRECT_URI!,
    code_verifier: args.code_verifier,
  });
  const r = await fetch("https://airtable.com/oauth2/v1/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Airtable token exchange failed: ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
  };
}

// ── Dropbox OAuth 2.0 ────────────────────────────────────────────────────────

export function buildDropboxAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.DROPBOX_APP_KEY!,
    redirect_uri: env.DROPBOX_REDIRECT_URI!,
    response_type: "code",
    token_access_type: "offline",
    state,
  });
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDropboxCode(env: Env, code: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.DROPBOX_APP_KEY!,
    client_secret: env.DROPBOX_APP_SECRET!,
    redirect_uri: env.DROPBOX_REDIRECT_URI!,
  });
  const r = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Dropbox token exchange failed: ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    uid: string;
    account_id?: string;
  };
}

// ── Slack OAuth v2 ───────────────────────────────────────────────────────────

const SLACK_SCOPES = [
  "channels:read", "channels:history", "chat:write",
  "groups:read", "groups:history", "im:read", "im:history",
  "users:read", "files:read", "files:write",
].join(",");

export function buildSlackAuthUrl(env: Env, state: string) {
  const redirectUri = `${env.APP_URL}/v1/oauth/slack/callback`;
  const params = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID!,
    scope: SLACK_SCOPES,
    redirect_uri: redirectUri,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackCode(env: Env, code: string) {
  const redirectUri = `${env.APP_URL}/v1/oauth/slack/callback`;
  const body = new URLSearchParams({
    client_id: env.SLACK_CLIENT_ID!,
    client_secret: env.SLACK_CLIENT_SECRET!,
    code,
    redirect_uri: redirectUri,
  });
  const r = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  // Slack returns { ok: true/false } not HTTP status codes
  if (!data.ok) throw new Error(`Slack token exchange failed: ${data.error ?? JSON.stringify(data)}`);
  return data as {
    ok: boolean;
    access_token: string;
    token_type: string;
    scope: string;
    bot_user_id?: string;
    app_id?: string;
    team: { id: string; name: string };
    authed_user?: { id: string; scope?: string; access_token?: string; token_type?: string };
  };
}

// ── PayPal OAuth 2.0 ─────────────────────────────────────────────────────────

export function buildPayPalAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.PAYPAL_CLIENT_ID!,
    response_type: "code",
    redirect_uri: env.PAYPAL_REDIRECT_URI!,
    scope: "openid email https://uri.paypal.com/services/invoicing https://uri.paypal.com/services/payments/payment",
    state,
  });
  return `https://www.paypal.com/signin/authorize?${params.toString()}`;
}

export async function exchangePayPalCode(env: Env, code: string) {
  const basic = Buffer.from(`${env.PAYPAL_CLIENT_ID!}:${env.PAYPAL_CLIENT_SECRET!}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.PAYPAL_REDIRECT_URI!,
  });
  const r = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`PayPal token exchange failed: ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
    nonce?: string;
  };
}

// ── Square OAuth 2.0 ─────────────────────────────────────────────────────────

const SQUARE_SCOPES = [
  "PAYMENTS_READ", "PAYMENTS_WRITE",
  "ORDERS_READ", "ORDERS_WRITE",
  "CUSTOMERS_READ", "CUSTOMERS_WRITE",
  "INVOICES_READ", "INVOICES_WRITE",
  "ITEMS_READ", "ITEMS_WRITE",
  "MERCHANT_PROFILE_READ",
].join(" ");

export function buildSquareAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.SQUARE_APP_ID!,
    scope: SQUARE_SCOPES,
    session: "false",
    state,
  });
  return `https://connect.squareup.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeSquareCode(env: Env, code: string) {
  const r = await fetch("https://connect.squareup.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.SQUARE_APP_ID!,
      client_secret: env.SQUARE_APP_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.SQUARE_REDIRECT_URI!,
    }),
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.errors) throw new Error(`Square token exchange failed: ${data.errors?.[0]?.detail ?? JSON.stringify(data)}`);
  // Square returns expires_at (ISO string) instead of expires_in
  return data as {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_at: string;
    merchant_id?: string;
    scope?: string;
  };
}

// ── Meetup OAuth 2.0 ──────────────────────────────────────────────────────────

const MEETUP_SCOPES = "ageless basic event_management group_edit group_content rsvp reporting";

export function buildMeetupAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_id: env.MEETUP_CLIENT_ID!,
    redirect_uri: env.MEETUP_REDIRECT_URI!,
    response_type: "code",
    scope: MEETUP_SCOPES,
    state,
  });
  return `https://secure.meetup.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeMeetupCode(env: Env, code: string) {
  const body = new URLSearchParams({
    client_id: env.MEETUP_CLIENT_ID!,
    client_secret: env.MEETUP_CLIENT_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: env.MEETUP_REDIRECT_URI!,
    code,
  });
  const r = await fetch("https://secure.meetup.com/oauth2/access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`Meetup token exchange failed: ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
  return data as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };
}

// ── TikTok OAuth 2.0 ──────────────────────────────────────────────────────────

const TIKTOK_SCOPES = ["user.info.basic", "user.info.profile", "video.upload", "video.publish"].join(",");

export function buildTikTokAuthUrl(env: Env, state: string) {
  const params = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: TIKTOK_SCOPES,
    redirect_uri: env.TIKTOK_REDIRECT_URI!,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeTikTokCode(env: Env, code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  open_id: string;
  scope: string;
  token_type: string;
}> {
  const r = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY!,
      client_secret: env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.TIKTOK_REDIRECT_URI!,
    }),
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error) throw new Error(`TikTok token exchange failed: ${data.error_description ?? data.error ?? JSON.stringify(data)}`);
  return data;
}

export async function fetchTikTokUserInfo(accessToken: string): Promise<{
  open_id: string;
  display_name: string;
  avatar_url: string;
  profile_deep_link?: string;
  bio_description?: string;
  is_verified?: boolean;
}> {
  const r = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,profile_deep_link,bio_description,is_verified", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await r.json().catch(() => ({})) as any;
  if (!r.ok || data.error?.code) throw new Error(`TikTok user info failed: ${data.error?.message ?? JSON.stringify(data)}`);
  return data.data?.user ?? data;
}

// Token vault storage (Supabase table: token_vault)
// Delegates to tokenStore for transparent encryption at rest.
export async function storeTokenVault(env: Env, args: {
  org_id: string;
  user_id?: string | null;
  provider: Provider;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  meta?: any;
}) {
  await writeTokenVault(env, args);
}
