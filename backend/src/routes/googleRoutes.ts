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
    const body = (req.body ?? {}) as any;
    const googleUserId = body?.user_id ?? body?.sub ?? "unknown";
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
