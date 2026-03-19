/**
 * Wiki API Key Routes — tiered access management for wiki.atlasux.cloud.
 *
 * Three tiers:
 *   Free      — 5 req/min, wiki_search only, no MCP
 *   Builder   — 30 req/min, search + list + read articles, requires 2+ deposited API keys
 *   Pro       — 120 req/min, full API + MCP server access, requires 5+ deposited API keys
 *
 * POST /v1/wiki-keys/apply              — apply for a free API key
 * POST /v1/wiki-keys/accept-tos         — accept ToS (required before depositing keys)
 * POST /v1/wiki-keys/deposit-credential — deposit a platform API key → earn tier upgrades
 * GET  /v1/wiki-keys/verify             — verify a key is valid
 * GET  /v1/wiki-keys/usage              — check usage stats + tier info
 * GET  /v1/wiki-keys/credentials        — list deposited credentials (masked)
 * DELETE /v1/wiki-keys/credentials/:id  — revoke a deposited credential
 */

import type { FastifyPluginAsync } from "fastify";
import { randomBytes, createHash } from "node:crypto";
import { prisma } from "../db/prisma.js";
import { encryptToken } from "../lib/encryption.js";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function generateKey(): string {
  return `wk_${randomBytes(16).toString("hex")}`;
}

// ── Tier definitions ──────────────────────────────────────────────────────────

const BUILDER_KEYS_REQUIRED = 2;
const PRO_KEYS_REQUIRED = 5;

const TIERS = {
  free:    { rateLimit: 5,   permissions: ["wiki:search"], tools: ["wiki_search"], mcp: false },
  builder: { rateLimit: 30,  permissions: ["wiki:search", "wiki:read", "wiki:list"], tools: ["wiki_search", "wiki_list", "wiki_read"], mcp: false },
  pro:     { rateLimit: 120, permissions: ["wiki:search", "wiki:read", "wiki:list", "wiki:sections", "wiki:stats", "wiki:mcp"], tools: ["wiki_search", "wiki_read", "wiki_list", "wiki_sections", "wiki_stats"], mcp: true },
} as const;

type TierName = keyof typeof TIERS;

export function getTierTools(tier: string): readonly string[] {
  return TIERS[tier as TierName]?.tools ?? TIERS.free.tools;
}

export function tierHasMcp(tier: string): boolean {
  return TIERS[tier as TierName]?.mcp ?? false;
}

/** Determine the correct tier based on active credential count. */
function tierForCredCount(count: number): TierName {
  if (count >= PRO_KEYS_REQUIRED) return "pro";
  if (count >= BUILDER_KEYS_REQUIRED) return "builder";
  return "free";
}

const ACCEPTED_PLATFORMS = [
  "openai", "anthropic", "google", "deepseek", "mistral", "cohere",
  "stability", "midjourney", "leonardo", "ideogram", "flux",
  "elevenlabs", "replicate", "runway", "pika", "luma",
  "huggingface", "fireworks", "together", "groq", "cerebras",
];

// ── Rate limiter (in-memory, per-key) ────────────────────────────────────────

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyHash: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(keyHash);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(keyHash, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (now >= v.resetAt) rateBuckets.delete(k);
  }
}, 300_000);

// ── Key validation middleware (exported for MCP routes) ─────────────────────

export async function validateWikiKey(
  authHeader: string | undefined
): Promise<{ valid: boolean; keyHash?: string; tier?: string; error?: string }> {
  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing Authorization: Bearer <api-key>" };
  }

  const key = authHeader.slice(7);
  if (!key.startsWith("wk_")) {
    return { valid: false, error: "Invalid key format" };
  }

  const kHash = hashKey(key);
  const record = await prisma.wikiApiKey.findUnique({ where: { keyHash: kHash } });

  if (!record) return { valid: false, error: "Invalid API key" };
  if (!record.isActive) return { valid: false, error: "API key revoked" };

  if (!checkRateLimit(kHash, record.rateLimit)) {
    return { valid: false, error: "Too many requests. Please slow down." };
  }

  // Update usage stats (fire-and-forget)
  prisma.wikiApiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
  }).catch(() => { /* non-critical */ });

  return { valid: true, keyHash: kHash, tier: record.tier };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Sync a key's tier/rateLimit/permissions based on its active credential count. */
async function syncTier(recordId: string, currentTier: string): Promise<{ tier: TierName; changed: boolean }> {
  const credCount = await prisma.wikiKeyCredential.count({
    where: { wikiKeyId: recordId, isActive: true },
  });
  const correctTier = tierForCredCount(credCount);
  if (correctTier === currentTier) return { tier: correctTier, changed: false };

  const tierDef = TIERS[correctTier];
  await prisma.wikiApiKey.update({
    where: { id: recordId },
    data: {
      tier: correctTier,
      rateLimit: tierDef.rateLimit,
      permissions: [...tierDef.permissions],
    },
  });
  return { tier: correctTier, changed: true };
}

function upgradeMessage(credCount: number, newTier: TierName): string {
  if (newTier === "pro") return "Pro tier unlocked! You now have MCP server access.";
  if (newTier === "builder") {
    const remaining = PRO_KEYS_REQUIRED - credCount;
    return `Builder tier unlocked! Deposit ${remaining} more key${remaining === 1 ? "" : "s"} to unlock Pro (MCP access).`;
  }
  const toBuilder = BUILDER_KEYS_REQUIRED - credCount;
  return `Credential stored. Deposit ${toBuilder} more key${toBuilder === 1 ? "" : "s"} to unlock Builder tier.`;
}

// ── Routes ──────────────────────────────────────────────────────────────────

const wikiKeyRoutes: FastifyPluginAsync = async (app) => {

  // Apply for a free API key
  app.post<{ Body: { name: string; email: string; useCase?: string } }>("/apply", async (req, reply) => {
    const { name, email } = req.body ?? {} as Record<string, string>;

    if (!name || !email) {
      return reply.status(400).send({ ok: false, error: "name and email are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(400).send({ ok: false, error: "Invalid email format" });
    }

    const existing = await prisma.wikiApiKey.count({
      where: { email, isActive: true },
    });
    if (existing >= 3) {
      return reply.status(429).send({ ok: false, error: "Maximum 3 active keys per email" });
    }

    const rawKey = generateKey();
    const kHash = hashKey(rawKey);
    const prefix = rawKey.slice(0, 10) + "...";
    const tier: TierName = "free";
    const tierDef = TIERS[tier];

    await prisma.wikiApiKey.create({
      data: {
        name,
        email,
        keyHash: kHash,
        keyPrefix: prefix,
        tier,
        permissions: [...tierDef.permissions],
        rateLimit: tierDef.rateLimit,
      },
    });

    return {
      ok: true,
      key: rawKey,
      prefix,
      tier,
      tools: [...tierDef.tools],
      message: "Save this key — it will never be shown again.",
      upgrade: `Accept our Terms of Service, then deposit ${BUILDER_KEYS_REQUIRED}+ platform API keys to unlock more access.`,
      docs: "https://wiki.atlasux.cloud/#/api",
    };
  });

  // Accept ToS (required before depositing keys)
  app.post("/accept-tos", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || !auth.slice(7).startsWith("wk_")) {
      return reply.status(401).send({ ok: false, error: "Invalid key" });
    }

    const kHash = hashKey(auth.slice(7));
    const record = await prisma.wikiApiKey.findUnique({ where: { keyHash: kHash } });
    if (!record || !record.isActive) {
      return reply.status(401).send({ ok: false, error: "Invalid or revoked key" });
    }

    if (record.tosAcceptedAt) {
      return { ok: true, tier: record.tier, message: "Terms already accepted." };
    }

    await prisma.wikiApiKey.update({
      where: { id: record.id },
      data: { tosAcceptedAt: new Date() },
    });

    return {
      ok: true,
      tier: record.tier,
      message: "Terms accepted. You can now deposit platform API keys to upgrade your tier.",
      nextStep: `Deposit ${BUILDER_KEYS_REQUIRED}+ API keys → Builder tier. Deposit ${PRO_KEYS_REQUIRED}+ → Pro tier with MCP access.`,
    };
  });

  // Deposit a platform API key → count toward tier upgrades
  app.post<{ Body: { platform: string; apiKey: string; label?: string } }>("/deposit-credential", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || !auth.slice(7).startsWith("wk_")) {
      return reply.status(401).send({ ok: false, error: "Invalid key" });
    }

    const kHash = hashKey(auth.slice(7));
    const record = await prisma.wikiApiKey.findUnique({ where: { keyHash: kHash } });
    if (!record || !record.isActive) {
      return reply.status(401).send({ ok: false, error: "Invalid or revoked key" });
    }

    if (!record.tosAcceptedAt) {
      return reply.status(403).send({ ok: false, error: "Accept Terms of Service first (POST /accept-tos)" });
    }

    const { platform, apiKey, label } = req.body ?? {} as Record<string, string>;
    if (!platform || !apiKey) {
      return reply.status(400).send({ ok: false, error: "platform and apiKey are required" });
    }

    const normalizedPlatform = platform.toLowerCase().trim();
    if (!ACCEPTED_PLATFORMS.includes(normalizedPlatform)) {
      return reply.status(400).send({
        ok: false,
        error: `Unsupported platform. Accepted: ${ACCEPTED_PLATFORMS.join(", ")}`,
      });
    }

    if (apiKey.length < 10 || apiKey.length > 256) {
      return reply.status(400).send({ ok: false, error: "API key must be 10-256 characters" });
    }

    const encrypted = encryptToken(apiKey, ENCRYPTION_KEY);

    await prisma.wikiKeyCredential.upsert({
      where: { wikiKeyId_platform: { wikiKeyId: record.id, platform: normalizedPlatform } },
      create: {
        wikiKeyId: record.id,
        platform: normalizedPlatform,
        label: label || null,
        encryptedKey: encrypted,
      },
      update: {
        encryptedKey: encrypted,
        label: label || null,
        isActive: true,
      },
    });

    // Sync tier based on new credential count
    const credCount = await prisma.wikiKeyCredential.count({
      where: { wikiKeyId: record.id, isActive: true },
    });

    const { tier: newTier } = await syncTier(record.id, record.tier);

    return {
      ok: true,
      platform: normalizedPlatform,
      credentialsDeposited: credCount,
      tier: newTier,
      mcp: tierHasMcp(newTier),
      message: upgradeMessage(credCount, newTier),
    };
  });

  // List deposited credentials (masked)
  app.get("/credentials", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || !auth.slice(7).startsWith("wk_")) {
      return reply.status(401).send({ ok: false, error: "Invalid key" });
    }

    const kHash = hashKey(auth.slice(7));
    const record = await prisma.wikiApiKey.findUnique({ where: { keyHash: kHash } });
    if (!record) return reply.status(404).send({ ok: false, error: "Key not found" });

    const creds = await prisma.wikiKeyCredential.findMany({
      where: { wikiKeyId: record.id },
      select: { id: true, platform: true, label: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    return { ok: true, credentials: creds, tier: record.tier };
  });

  // Revoke a deposited credential
  app.delete<{ Params: { id: string } }>("/credentials/:id", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || !auth.slice(7).startsWith("wk_")) {
      return reply.status(401).send({ ok: false, error: "Invalid key" });
    }

    const kHash = hashKey(auth.slice(7));
    const record = await prisma.wikiApiKey.findUnique({ where: { keyHash: kHash } });
    if (!record) return reply.status(404).send({ ok: false, error: "Key not found" });

    const cred = await prisma.wikiKeyCredential.findFirst({
      where: { id: req.params.id, wikiKeyId: record.id },
    });
    if (!cred) return reply.status(404).send({ ok: false, error: "Credential not found" });

    await prisma.wikiKeyCredential.update({
      where: { id: cred.id },
      data: { isActive: false },
    });

    // Re-sync tier (may downgrade)
    const { tier: newTier } = await syncTier(record.id, record.tier);

    return {
      ok: true,
      message: newTier !== record.tier
        ? `Credential revoked. Tier changed to ${newTier}.`
        : "Credential revoked.",
      tier: newTier,
    };
  });

  // Verify a key
  app.get("/verify", async (req, reply) => {
    const result = await validateWikiKey(req.headers.authorization);
    if (!result.valid) {
      return reply.status(401).send({ ok: false, error: result.error });
    }
    return { ok: true, valid: true, tier: result.tier };
  });

  // Usage stats
  app.get("/usage", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ") || !auth.slice(7).startsWith("wk_")) {
      return reply.status(401).send({ ok: false, error: "Invalid key" });
    }

    const kHash = hashKey(auth.slice(7));
    const record = await prisma.wikiApiKey.findUnique({
      where: { keyHash: kHash },
      select: {
        keyPrefix: true, tier: true, permissions: true, usageCount: true,
        lastUsedAt: true, createdAt: true, isActive: true, tosAcceptedAt: true,
        _count: { select: { credentials: { where: { isActive: true } } } },
      },
    });

    if (!record) return reply.status(404).send({ ok: false, error: "Key not found" });

    const { _count, ...rest } = record;
    const credCount = _count.credentials;
    return {
      ok: true,
      ...rest,
      tools: getTierTools(record.tier),
      mcp: tierHasMcp(record.tier),
      credentialsDeposited: credCount,
      nextTier: record.tier === "free"
        ? { name: "builder", keysNeeded: BUILDER_KEYS_REQUIRED - credCount }
        : record.tier === "builder"
          ? { name: "pro", keysNeeded: PRO_KEYS_REQUIRED - credCount }
          : null,
    };
  });
};

export default wikiKeyRoutes;
