/**
 * Google platform routes.
 *
 * Routes:
 *   POST /v1/google/datadeletion — Data deletion callback (for Google OAuth verification)
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const googleRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/google/datadeletion
   *
   * Google may call this when a user revokes access or requests data deletion.
   * Logs the request, clears stored tokens, and returns a confirmation.
   */
  app.post("/datadeletion", async (req, reply) => {
    // Shared secret check — reject if INBOUND_WEBHOOK_SECRET is configured and header doesn't match
    const inboundSecret = (process.env.INBOUND_WEBHOOK_SECRET ?? "").trim();
    if (inboundSecret) {
      const provided = String(req.headers["x-webhook-secret"] ?? "").trim();
      if (!provided || provided !== inboundSecret) {
        return reply.code(401).send({ error: "Invalid or missing webhook secret" });
      }
    }

    const body = (req.body ?? {}) as any;

    // Basic validation: body must have Google-format fields (user_id or sub)
    if (!body || typeof body !== "object") {
      return reply.code(400).send({ error: "Invalid request body" });
    }
    const googleUserId = body?.user_id ?? body?.sub ?? null;
    if (!googleUserId || typeof googleUserId !== "string") {
      return reply.code(400).send({ error: "Missing required field: user_id or sub" });
    }
    const confirmationCode = `GDEL-${googleUserId}-${Date.now()}`;

    await prisma.auditLog.create({
      data: {
        tenantId: "00000000-0000-0000-0000-000000000000",
        actorType: "system",
        actorUserId: null,
        actorExternalId: `google:${googleUserId}`,
        level: "warn",
        action: "GOOGLE_DATA_DELETION_REQUEST",
        entityType: "user",
        entityId: null,
        message: `Google data deletion requested for user ${googleUserId}`,
        meta: { googleUserId, confirmationCode },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    // Clear stored Google tokens — scoped by Google user ID to avoid blanket-disconnecting all tenants.
    // Only disconnect integrations whose config contains this specific Google user ID.
    if (googleUserId && googleUserId !== "unknown") {
      try {
        await prisma.integration.updateMany({
          where: {
            provider: "google",
            config: { path: ["googleUserId"], equals: googleUserId },
          },
          data: { connected: false, access_token: null, refresh_token: null },
        });
      } catch { /* best effort — if no matching integrations, nothing happens */ }
    }

    return reply.send({
      url: `https://atlasux.cloud/#/privacy?deletion=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  });
};
