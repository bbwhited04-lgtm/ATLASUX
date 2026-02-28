/**
 * Meta (Facebook/Instagram) platform routes.
 *
 * Routes:
 *   POST /v1/meta/datadeletion — GDPR data deletion callback (required by Meta app review)
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { createHmac } from "crypto";

const META_APP_SECRET = process.env.META_APP_SECRET ?? "";

/**
 * Verify the signed_request from Meta.
 * Returns the decoded payload or null if invalid.
 */
function parseSignedRequest(signedRequest: string): any | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".", 2);
    if (!encodedSig || !payload) return null;

    const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    const expected = createHmac("sha256", META_APP_SECRET)
      .update(payload)
      .digest();

    if (!sig.equals(expected)) return null;

    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"),
    );
    return decoded;
  } catch {
    return null;
  }
}

export const metaRoutes: FastifyPluginAsync = async (app) => {
  /**
   * POST /v1/meta/datadeletion
   *
   * Meta sends this when a user requests deletion of their data.
   * We must respond with a JSON containing a URL where the user can
   * check the status of their deletion request + a confirmation code.
   *
   * See: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
   */
  app.post("/datadeletion", async (req, reply) => {
    const body = req.body as any;
    const signedRequest = body?.signed_request;

    if (!signedRequest || !META_APP_SECRET) {
      return reply.code(400).send({ error: "Invalid request" });
    }

    const data = parseSignedRequest(signedRequest);
    if (!data) {
      return reply.code(403).send({ error: "Invalid signature" });
    }

    const userId = data.user_id ? String(data.user_id) : "unknown";
    const confirmationCode = `DEL-${userId}-${Date.now()}`;

    // Log the deletion request
    await prisma.auditLog.create({
      data: {
        tenantId: "00000000-0000-0000-0000-000000000000",
        actorType: "system",
        actorUserId: null,
        actorExternalId: `meta:${userId}`,
        level: "warn",
        action: "META_DATA_DELETION_REQUEST",
        entityType: "user",
        entityId: null,
        message: `Meta data deletion requested for Facebook user ${userId}`,
        meta: { facebookUserId: userId, confirmationCode },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    // Delete stored tokens for this Meta user — scoped to matching external ID only.
    // Meta sends us the Facebook user_id; find integrations whose config references it.
    try {
      const metaIntegrations = await prisma.integration.findMany({
        where: { provider: "meta", connected: true },
        select: { id: true, config: true },
      });
      const matchingIds = metaIntegrations
        .filter(i => {
          const cfg = (i.config ?? {}) as Record<string, any>;
          return String(cfg.user_id ?? cfg.facebook_user_id ?? "") === userId;
        })
        .map(i => i.id);
      if (matchingIds.length > 0) {
        await prisma.integration.updateMany({
          where: { id: { in: matchingIds } },
          data: { connected: false, access_token: null, refresh_token: null },
        });
      }
    } catch { /* best effort */ }

    // Meta requires this exact response format
    return reply.send({
      url: `https://atlasux.cloud/#/privacy?deletion=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  });
};
