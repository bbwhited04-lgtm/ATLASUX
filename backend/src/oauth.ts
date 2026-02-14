import type { Env } from "./env.js";
import { makeSupabase } from "./supabase.js";

export type Provider = "google" | "meta";

export function oauthEnabled(provider: Provider, env: Env): boolean {
  if (provider === "google") return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI);
  if (provider === "meta") return !!(env.META_APP_ID && env.META_APP_SECRET && env.META_REDIRECT_URI);
  return false;
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

// Token vault storage (Supabase table: token_vault)
export async function storeTokenVault(env: Env, args: {
  org_id: string;
  user_id: string;
  provider: Provider;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  meta?: any;
}) {
  const supabase = makeSupabase(env);
  const { error } = await supabase.from("token_vault").upsert({
    org_id: args.org_id,
    user_id: args.user_id,
    provider: args.provider,
    access_token: args.access_token,
    refresh_token: args.refresh_token ?? null,
    expires_at: args.expires_at ?? null,
    scope: args.scope ?? null,
    meta: args.meta ?? null,
    updated_at: new Date().toISOString()
  }, { onConflict: "org_id,user_id,provider" });
  if (error) throw new Error(`token_vault upsert failed: ${error.message}`);
}
