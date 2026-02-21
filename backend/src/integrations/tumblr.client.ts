import crypto from "node:crypto";
import type { Env } from "../env.js";

// NOTE: User provided env values may include a leading "POST ". We strip that for fetch().
function stripPostPrefix(u: string) {
  return u.trim().replace(/^POST\s+/i, "");
}

function enc(s: string) {
  // RFC 3986
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function baseString(method: string, url: string, params: Record<string, string>) {
  const keys = Object.keys(params).sort();
  const paramString = keys.map((k) => `${enc(k)}=${enc(params[k]!)}`).join("&");
  return `${method.toUpperCase()}&${enc(url)}&${enc(paramString)}`;
}

function signHmacSha1(base: string, consumerSecret: string, tokenSecret?: string) {
  const key = `${enc(consumerSecret)}&${enc(tokenSecret ?? "")}`;
  return crypto.createHmac("sha1", key).update(base).digest("base64");
}

function oauthHeader(params: Record<string, string>) {
  const parts = Object.keys(params)
    .sort()
    .map((k) => `${enc(k)}="${enc(params[k]!)}"`);
  return `OAuth ${parts.join(", ")}`;
}

function parseQuery(body: string) {
  const out: Record<string, string> = {};
  for (const part of body.split("&")) {
    const [k, v] = part.split("=");
    if (!k) continue;
    out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return out;
}

export async function tumblrRequestToken(env: Env) {
  const url = stripPostPrefix(env.TUMBLR_REQUEST_TOKEN_URL!);

  const oauthParams: Record<string, string> = {
    oauth_callback: env.TUMBLR_REDIRECT_URI!,
    oauth_consumer_key: env.TUMBLR_AUTH_KEY!,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  const base = baseString("POST", url, oauthParams);
  oauthParams.oauth_signature = signHmacSha1(base, env.TUMBLR_OAUTH_SECRET!);

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: oauthHeader(oauthParams) },
  });

  const text = await r.text().catch(() => "");
  if (!r.ok) throw new Error(`Tumblr request_token failed (${r.status}): ${text}`);

  const parsed = parseQuery(text);
  if (!parsed.oauth_token || !parsed.oauth_token_secret) {
    throw new Error(`Tumblr request_token missing token/secret: ${text}`);
  }
  return parsed;
}

export function tumblrAuthorizeUrl(env: Env, oauth_token: string) {
  const base = stripPostPrefix(env.TUMBLR_AUTHORIZE_URL!);
  const u = new URL(base);
  u.searchParams.set("oauth_token", oauth_token);
  return u.toString();
}

export async function tumblrAccessToken(env: Env, oauth_token: string, oauth_verifier: string, tokenSecret: string) {
  const url = stripPostPrefix(env.TUMBLR_ACCESS_TOKEN_URL!);

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: env.TUMBLR_AUTH_KEY!,
    oauth_token,
    oauth_verifier,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };

  const base = baseString("POST", url, oauthParams);
  oauthParams.oauth_signature = signHmacSha1(base, env.TUMBLR_OAUTH_SECRET!, tokenSecret);

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: oauthHeader(oauthParams) },
  });

  const text = await r.text().catch(() => "");
  if (!r.ok) throw new Error(`Tumblr access_token failed (${r.status}): ${text}`);

  const parsed = parseQuery(text);
  if (!parsed.oauth_token || !parsed.oauth_token_secret) {
    throw new Error(`Tumblr access_token missing token/secret: ${text}`);
  }
  return parsed;
}
