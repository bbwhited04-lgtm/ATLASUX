/**
 * zoomRoutes.ts — Zoom Webhook
 *
 * POST /v1/zoom/webhook — receive event notifications + endpoint validation
 *
 * Zoom sends a validation challenge as a POST (not GET) with:
 *   { "event": "endpoint.url_validation", "payload": { "plainToken": "<token>" } }
 * We must respond with:
 *   { "plainToken": "<token>", "encryptedToken": hmac-sha256(plainToken, secretToken) }
 */

import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/prisma.js";

const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET ?? "";

export const zoomRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;

    // ── Endpoint URL validation challenge ────────────────────────────────
    if (body?.event === "endpoint.url_validation") {
      const plainToken = body.payload?.plainToken;
      if (!plainToken || !webhookSecret) {
        app.log.warn("Zoom validation challenge received but ZOOM_WEBHOOK_SECRET not set");
        return reply.status(400).send({ error: "Missing plainToken or webhook secret" });
      }

      const encryptedToken = crypto
        .createHmac("sha256", webhookSecret)
        .update(plainToken)
        .digest("hex");

      app.log.info("Zoom webhook endpoint validation responded");
      return reply.send({ plainToken, encryptedToken });
    }

    // ── Normal event notifications ───────────────────────────────────────
    const eventType = body?.event ?? "unknown";
    app.log.info({ eventType }, "Zoom webhook event received");

    try {
      await prisma.auditLog.create({
        data: {
          actorExternalId: "zoom-webhook",
          actorType: "system",
          action: `zoom.${eventType}`,
          entityType: "zoom_event",
          message: `Zoom ${eventType} event received`,
          meta: body ?? {},
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log Zoom webhook event");
    }

    return reply.status(200).send({ ok: true });
  });
};
