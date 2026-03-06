/**
 * linkedinRoutes.ts — LinkedIn Webhook + API
 *
 * GET  /v1/linkedin/webhook  — challenge-response verification (HMAC-SHA256)
 * POST /v1/linkedin/webhook  — receive event notifications
 *
 * Security:
 *   - GET:  Responds with challengeCode + challengeResponse (HMAC-SHA256 of challengeCode
 *           using LINKEDIN_CLIENT_SECRET) per LinkedIn's webhook verification spec.
 *   - POST: Validates payload structure (must have recognized LinkedIn notification shape).
 *           If LINKEDIN_WEBHOOK_SECRET is configured, verifies the
 *           LinkedIn-Notifications-Signature header.
 */

import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/prisma.js";

const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? "";
const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET ?? "";

/**
 * Validate that a LinkedIn POST webhook payload has the expected structure.
 * LinkedIn notification payloads contain at minimum an object with identifiable fields.
 */
function isValidLinkedInPayload(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;

  // LinkedIn webhook payloads should have at least one of these fields
  const knownFields = ["topic", "eventType", "event", "data", "type", "resource", "status"];
  return knownFields.some((field) => field in b);
}

export const linkedinRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — LinkedIn challenge verification ──────────────────────
  // LinkedIn sends: GET /webhook?challengeCode=<code>
  // We must respond with: { "challengeCode": "<code>", "challengeResponse": "<hmac>" }
  // The challengeResponse is HMAC-SHA256(clientSecret, challengeCode) in hex.
  app.get("/webhook", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const challengeCode = q.challengeCode;

    if (!challengeCode) {
      return reply.status(400).send({ error: "Missing challengeCode" });
    }

    if (!clientSecret) {
      app.log.warn(
        "LINKEDIN_CLIENT_SECRET not set — cannot compute challengeResponse for verification",
      );
      return reply.status(500).send({ error: "LinkedIn client secret not configured" });
    }

    const challengeResponse = crypto
      .createHmac("sha256", clientSecret)
      .update(challengeCode)
      .digest("hex");

    app.log.info("LinkedIn webhook verification challenge responded");
    return reply.send({ challengeCode, challengeResponse });
  });

  // ── POST /webhook — LinkedIn event notifications ────────────────────────
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;

    // ── Signature verification (if LINKEDIN_WEBHOOK_SECRET is configured) ──
    if (webhookSecret) {
      const sigHeader = (req.headers as Record<string, string | undefined>)[
        "linkedin-notifications-signature"
      ];

      if (!sigHeader) {
        app.log.warn("LinkedIn webhook received without LinkedIn-Notifications-Signature header");
        return reply.status(401).send({ error: "Missing webhook signature" });
      }

      // LinkedIn signature format: "hmacsha256=<hex-digest>"
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
      const expectedHmac = crypto
        .createHmac("sha256", webhookSecret)
        .update(bodyStr)
        .digest("hex");
      const expected = `hmacsha256=${expectedHmac}`;

      try {
        const valid = crypto.timingSafeEqual(
          Buffer.from(sigHeader),
          Buffer.from(expected),
        );
        if (!valid) {
          app.log.warn("LinkedIn webhook signature verification failed");
          return reply.status(401).send({ error: "Invalid webhook signature" });
        }
      } catch {
        app.log.warn("LinkedIn webhook signature verification failed (length mismatch)");
        return reply.status(401).send({ error: "Invalid webhook signature" });
      }
    } else {
      app.log.error(
        "LINKEDIN_WEBHOOK_SECRET not set — rejecting webhook (fail-closed)",
      );
      return reply.status(503).send({ error: "Webhook secret not configured" });
    }

    // ── Payload structure validation ────────────────────────────────────
    if (!isValidLinkedInPayload(body)) {
      app.log.warn("LinkedIn webhook received with unrecognized payload structure");
      return reply
        .status(400)
        .send({ error: "Invalid payload structure — missing required LinkedIn notification fields" });
    }

    app.log.info(
      { topic: body?.topic, eventType: body?.eventType },
      "LinkedIn webhook event received",
    );

    try {
      // Store the event in audit log for traceability
      await prisma.auditLog.create({
        data: {
          tenantId: null,
          actorExternalId: "linkedin-webhook",
          actorType: "system",
          action: "linkedin.webhook.event",
          entityType: body?.topic ?? body?.eventType ?? "unknown",
          message: "LinkedIn webhook event received",
          meta: body ?? {},
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log LinkedIn webhook event");
    }

    // Always return 200 so LinkedIn doesn't retry
    return reply.status(200).send({ ok: true });
  });
};
