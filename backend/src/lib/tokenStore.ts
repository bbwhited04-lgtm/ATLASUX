/**
 * Centralized token read/write layer.
 *
 * All token access goes through here so encryption is applied consistently.
 * Backward-compatible: if a stored value is plaintext (pre-migration), it
 * is returned as-is. New writes are encrypted when TOKEN_ENCRYPTION_KEY is set.
 */
import type { Env } from "../env.js";
import { prisma } from "../db/prisma.js";
import { encryptToken, decryptToken } from "./encryption.js";

// ── Token vault (Prisma) ───────────────────────────────────────────────────

export interface TokenVaultRow {
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
}

/**
 * Read a token from token_vault for a given org + provider.
 * Decrypts automatically if encrypted.
 */
export async function readTokenVault(
  env: Env,
  orgId: string,
  provider: string,
): Promise<TokenVaultRow | null> {
  const row = await prisma.tokenVault.findFirst({
    where: { orgId, provider },
    select: { accessToken: true, refreshToken: true, expiresAt: true },
  });

  if (!row) return null;

  const key = env.TOKEN_ENCRYPTION_KEY;
  return {
    access_token: decryptToken(row.accessToken, key),
    refresh_token: row.refreshToken ? decryptToken(row.refreshToken, key) : null,
    expires_at: row.expiresAt,
  };
}

/**
 * Write (upsert) a full token set to token_vault.
 * Encrypts access_token and refresh_token before storage.
 */
export async function writeTokenVault(
  env: Env,
  args: {
    org_id: string;
    user_id?: string | null;
    provider: string;
    access_token: string;
    refresh_token?: string | null;
    expires_at?: string | null;
    scope?: string | null;
    meta?: any;
  },
): Promise<void> {
  const key = env.TOKEN_ENCRYPTION_KEY;
  const userId = args.user_id || args.org_id;

  await prisma.tokenVault.upsert({
    where: {
      orgId_userId_provider: {
        orgId: args.org_id,
        userId,
        provider: args.provider,
      },
    },
    create: {
      orgId: args.org_id,
      userId,
      provider: args.provider,
      accessToken: encryptToken(args.access_token, key),
      refreshToken: args.refresh_token ? encryptToken(args.refresh_token, key) : null,
      expiresAt: args.expires_at ?? null,
      scope: args.scope ?? null,
      meta: args.meta ?? null,
    },
    update: {
      accessToken: encryptToken(args.access_token, key),
      refreshToken: args.refresh_token ? encryptToken(args.refresh_token, key) : null,
      expiresAt: args.expires_at ?? null,
      scope: args.scope ?? null,
      meta: args.meta ?? null,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update only the access_token (+ optional expires_at) in token_vault.
 * Used after a token refresh.
 */
export async function updateTokenVaultAccessToken(
  env: Env,
  orgId: string,
  provider: string,
  accessToken: string,
  expiresAt?: string,
): Promise<void> {
  const key = env.TOKEN_ENCRYPTION_KEY;
  const update: Record<string, any> = {
    accessToken: encryptToken(accessToken, key),
    updatedAt: new Date(),
  };
  if (expiresAt) update.expiresAt = expiresAt;

  await prisma.tokenVault.updateMany({
    where: { orgId, provider },
    data: update,
  });
}

// ── Integration table (Prisma) ───────────────────────────────────────────────

export interface IntegrationTokenRow {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: Date | null;
}

/**
 * Read the access_token from the Prisma integration table.
 * Decrypts automatically if encrypted.
 */
export async function readIntegrationToken(
  env: Env,
  tenantId: string,
  provider: string,
): Promise<IntegrationTokenRow | null> {
  const row = await prisma.integration.findFirst({
    where: { tenantId, provider: provider as any, connected: true },
    select: { access_token: true, refresh_token: true, token_expires_at: true },
  });
  if (!row?.access_token) return null;

  const key = env.TOKEN_ENCRYPTION_KEY;
  return {
    access_token: decryptToken(row.access_token, key),
    refresh_token: row.refresh_token ? decryptToken(row.refresh_token, key) : null,
    token_expires_at: row.token_expires_at,
  };
}

/**
 * Convenience: get the decrypted access_token for a provider from token_vault.
 * Returns null if not found or not connected.
 */
export async function getProviderToken(
  env: Env,
  tenantId: string,
  provider: string,
): Promise<string | null> {
  const vault = await readTokenVault(env, tenantId, provider);
  return vault?.access_token ?? null;
}

/**
 * Clear tokens from the token_vault for a given org + provider.
 */
export async function clearTokenVault(
  env: Env,
  orgId: string,
  provider: string,
): Promise<void> {
  await prisma.tokenVault.deleteMany({
    where: { orgId, provider },
  });
}
