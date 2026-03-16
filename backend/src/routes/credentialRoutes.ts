import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { clearCredentialCache } from "../services/credentialResolver.js";
import { encryptToken } from "../lib/encryption.js";

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;

const ALLOWED_PROVIDERS = new Set([
  "postiz", "openai", "anthropic", "deepseek", "openrouter",
  "slack", "twilio_sid", "twilio_token", "twilio_from",
  "flux1", "serp", "resend", "sendgrid", "gemini",
  "pinecone", "stability", "newsdata", "tavily",
  "elevenlabs", "you_com", "brave", "exa", "mediastack", "nyt",
]);

export const credentialRoutes: FastifyPluginAsync = async (app) => {
  /** GET / — list tenant's configured credentials (keys redacted) */
  app.get("/", async (req) => {
    const tenantId = (req as any).tenantId as string;
    const rows = await prisma.tenantCredential.findMany({
      where: { tenantId },
      select: { id: true, provider: true, label: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: { provider: "asc" },
    });
    return { ok: true, credentials: rows };
  });

  /** PUT /:provider — upsert a credential */
  app.put("/:provider", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const provider = (req.params as any).provider as string;
    const { key, label } = (req.body ?? {}) as { key?: string; label?: string };

    if (!ALLOWED_PROVIDERS.has(provider)) {
      return reply.code(400).send({ ok: false, error: `Unknown provider: ${provider}` });
    }
    if (!key || typeof key !== "string" || key.trim().length < 4) {
      return reply.code(400).send({ ok: false, error: "Invalid API key" });
    }

    const encryptedKey = encryptToken(key.trim(), ENCRYPTION_KEY);
    const row = await prisma.tenantCredential.upsert({
      where: { tenantId_provider: { tenantId, provider } },
      create: { tenantId, provider, key: encryptedKey, label: label?.trim() ?? null, isActive: true },
      update: { key: encryptedKey, label: label?.trim() ?? undefined, isActive: true },
    });

    clearCredentialCache(tenantId);

    prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        level: "info",
        action: "CREDENTIAL_UPSERTED",
        entityType: "tenant_credential",
        entityId: row.id,
        message: `Credential for ${provider} updated`,
        meta: { provider },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return { ok: true, provider, active: true };
  });

  /** DELETE /:provider — remove a credential */
  app.delete("/:provider", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const provider = (req.params as any).provider as string;

    try {
      await prisma.tenantCredential.delete({
        where: { tenantId_provider: { tenantId, provider } },
      });
    } catch {
      return reply.code(404).send({ ok: false, error: "Credential not found" });
    }

    clearCredentialCache(tenantId);
    return { ok: true, deleted: provider };
  });
};
