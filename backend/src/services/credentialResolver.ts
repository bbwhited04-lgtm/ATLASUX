/**
 * Tenant-scoped credential resolver.
 *
 * Lookup order:
 *   1. tenant_credentials table (per-tenant key)
 *   2. process.env fallback (platform owner only)
 *
 * The OWNER_TENANT_ID always falls through to process.env if no
 * tenant-specific credential exists. Other tenants get null if
 * no credential is stored.
 */

import { prisma } from "../db/prisma.js";

const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

/** Maps provider names to their process.env key names */
const ENV_FALLBACK_MAP: Record<string, string> = {
  postiz:       "POSTIZ_API_KEY",
  openai:       "OPENAI_API_KEY",
  anthropic:    "ANTHROPIC_API_KEY",
  deepseek:     "DEEPSEEK_API_KEY",
  openrouter:   "OPENROUTER_API_KEY",
  cerebras:     "CEREBRAS_API_KEY",
  slack:        "SLACK_BOT_TOKEN",
  twilio_sid:   "TWILIO_ACCOUNT_SID",
  twilio_token: "TWILIO_AUTH_TOKEN",
  twilio_from:  "TWILIO_FROM_NUMBER",
  flux1:        "FLUX1_API_KEY",
  serp:         "SERP_API_KEY",
  resend:       "RESEND_API_KEY",
  sendgrid:     "SENDGRID_API_KEY",
  gemini:       "GEMINI_API_KEY",
  pinecone:     "PINECONE_API_KEY",
  stability:    "STABILITY_API_KEY",
  newsdata:     "NEWSDATA_API_KEY",
  tavily:       "TAVILY_API_KEY",
  you_com:      "YOU_COM_API_KEY",
  nyt:          "NYT_API_KEY",
  mediastack:   "MEDIASTACK_API_KEY",
};

// In-memory cache: tenantId:provider -> key (TTL 5 min)
const cache = new Map<string, { key: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolve a credential for a given tenant + provider.
 * Returns the API key/token string, or null if not available.
 */
export async function resolveCredential(
  tenantId: string,
  provider: string,
): Promise<string | null> {
  const cacheKey = `${tenantId}:${provider}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.key;
  }

  // 1. Check tenant_credentials table
  try {
    const row = await prisma.tenantCredential.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
      select: { key: true, isActive: true },
    });
    if (row?.isActive && row.key) {
      cache.set(cacheKey, { key: row.key, expiresAt: Date.now() + CACHE_TTL_MS });
      return row.key;
    }
  } catch {
    // DB error — fall through to env
  }

  // 2. Env fallback (owner tenant only)
  if (tenantId === OWNER_TENANT_ID) {
    const envKey = ENV_FALLBACK_MAP[provider];
    const envVal = envKey ? (process.env[envKey]?.trim() || null) : null;
    cache.set(cacheKey, { key: envVal, expiresAt: Date.now() + CACHE_TTL_MS });
    return envVal;
  }

  // 3. Non-owner tenant with no stored credential
  cache.set(cacheKey, { key: null, expiresAt: Date.now() + CACHE_TTL_MS });
  return null;
}

/**
 * Resolve a credential or throw if not available.
 */
export async function requireCredential(
  tenantId: string,
  provider: string,
): Promise<string> {
  const key = await resolveCredential(tenantId, provider);
  if (!key) {
    throw new Error(
      `No ${provider} credential configured. Add your ${provider} API key in Settings > Integrations.`
    );
  }
  return key;
}

/** Clear cache for a tenant (call after credential update). */
export function clearCredentialCache(tenantId?: string) {
  if (tenantId) {
    for (const k of cache.keys()) {
      if (k.startsWith(`${tenantId}:`)) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}
