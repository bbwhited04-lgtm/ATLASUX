/**
 * xRoutes.ts — X (Twitter) Webhook + API
 *
 * GET  /v1/x/webhook  — CRC challenge-response verification (Twitter Account Activity API)
 * POST /v1/x/webhook  — receive event notifications (mentions, DMs, follows, likes, etc.)
 *
 * Security:
 *   - GET:  Responds to CRC challenge using HMAC-SHA256 of crc_token with X_CONSUMER_SECRET
 *   - POST: Verifies x-twitter-webhooks-signature header (HMAC-SHA256 of raw body)
 */

import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/prisma.js";

const consumerSecret = process.env.X_CONSUMER_SECRET ?? "";

/**
 * Verify the X-Twitter-Webhooks-Signature header against the raw request body.
 * Twitter signs webhooks with: sha256=<base64(HMAC-SHA256(consumer_secret, body))>
 */
function verifyXSignature(
  signatureHeader: string | undefined,
  rawBody: string | Buffer | object,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  // Normalise body to string for HMAC computation
  const bodyStr =
    typeof rawBody === "string"
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString("utf8")
        : JSON.stringify(rawBody);

  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(bodyStr)
    .digest("base64");

  const expected = `sha256=${expectedHmac}`;

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  } catch {
    // Length mismatch — signatures don't match
    return false;
  }
}

export const xRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — Twitter CRC challenge verification ───────────────────
  // Twitter sends: GET /webhook?crc_token=<token>
  // We must respond with: { "response_token": "sha256=<hmac>" }
  app.get("/webhook", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const crcToken = q.crc_token;

    if (!crcToken) {
      return reply.status(400).send({ error: "Missing crc_token" });
    }

    if (!consumerSecret) {
      app.log.warn("X_CONSUMER_SECRET not set — cannot respond to CRC challenge");
      return reply.status(500).send({ error: "Consumer secret not configured" });
    }

    const hmac = crypto.createHmac("sha256", consumerSecret).update(crcToken).digest("base64");
    app.log.info("X webhook CRC challenge responded");
    return reply.send({ response_token: `sha256=${hmac}` });
  });

  // ── POST /webhook — X event notifications ───────────────────────────────
  app.post("/webhook", async (req, reply) => {
    // ── Signature verification ──────────────────────────────────────────
    if (!consumerSecret) {
      app.log.warn(
        "X_CONSUMER_SECRET not set — rejecting webhook (signature cannot be verified)",
      );
      return reply.status(401).send({ error: "Webhook signature verification not configured" });
    }

    const signatureHeader = (req.headers as Record<string, string | undefined>)[
      "x-twitter-webhooks-signature"
    ];

    if (!signatureHeader) {
      app.log.warn("X webhook received without x-twitter-webhooks-signature header");
      return reply.status(401).send({ error: "Missing webhook signature" });
    }

    if (!verifyXSignature(signatureHeader, req.body as any, consumerSecret)) {
      app.log.warn("X webhook signature verification failed");
      return reply.status(401).send({ error: "Invalid webhook signature" });
    }

    // ── Process verified event ──────────────────────────────────────────
    const body = req.body as any;
    const eventType =
      body?.tweet_create_events ? "tweet" :
      body?.favorite_events ? "like" :
      body?.follow_events ? "follow" :
      body?.direct_message_events ? "dm" :
      body?.tweet_delete_events ? "tweet_delete" :
      body?.mute_events ? "mute" :
      body?.block_events ? "block" :
      "unknown";

    app.log.info({ eventType }, "X webhook event received (signature verified)");

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: null,
          actorExternalId: "x-webhook",
          actorType: "system",
          action: `x.${eventType}`,
          entityType: "x_event",
          message: `X ${eventType} event received`,
          meta: body ?? {},
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log X webhook event");
    }

    return reply.status(200).send({ ok: true });
  });
};
