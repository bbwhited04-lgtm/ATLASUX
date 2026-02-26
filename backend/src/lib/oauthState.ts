/**
 * oauthState.ts — Database-backed store for OAuth PKCE verifiers, CSRF nonces,
 * and Tumblr request-token secrets.
 *
 * Replaces the in-memory Maps that break across multiple server instances.
 * Uses the `oauth_state` table (key TEXT PK, value TEXT, expires_at TIMESTAMPTZ).
 */
import { prisma } from "../db/prisma.js";

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

/** Store a key-value pair with an expiration. */
export async function setOAuthState(key: string, value: any, ttlMs = DEFAULT_TTL_MS): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMs);
  const serialized = JSON.stringify(value);

  await prisma.oAuthState.upsert({
    where: { key },
    create: { key, value: serialized, expiresAt },
    update: { value: serialized, expiresAt },
  });
}

/** Retrieve a value by key. Returns null if not found or expired. */
export async function getOAuthState<T = any>(key: string): Promise<T | null> {
  const row = await prisma.oAuthState.findUnique({ where: { key } });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    // Expired — clean it up and return null
    await prisma.oAuthState.delete({ where: { key } }).catch(() => null);
    return null;
  }
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

/** Delete a key (e.g. after successful token exchange). */
export async function deleteOAuthState(key: string): Promise<void> {
  await prisma.oAuthState.delete({ where: { key } }).catch(() => null);
}

/** Remove all expired rows. Call periodically to prevent unbounded growth. */
export async function pruneExpiredOAuthState(): Promise<number> {
  const result = await prisma.oAuthState.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
