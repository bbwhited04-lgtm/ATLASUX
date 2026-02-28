/**
 * xRoutes.ts — X (Twitter) Webhook + API
 *
 * GET  /v1/x/webhook  — CRC challenge-response verification (Twitter Account Activity API)
 * POST /v1/x/webhook  — receive event notifications (mentions, DMs, follows, likes, etc.)
 */

import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/prisma.js";

const consumerSecret = process.env.X_CLIENT_SECRET ?? "";

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
      app.log.warn("X_CLIENT_SECRET not set — cannot respond to CRC challenge");
      return reply.status(500).send({ error: "Consumer secret not configured" });
    }

    const hmac = crypto.createHmac("sha256", consumerSecret).update(crcToken).digest("base64");
    app.log.info("X webhook CRC challenge responded");
    return reply.send({ response_token: `sha256=${hmac}` });
  });

  // ── POST /webhook — X event notifications ───────────────────────────────
  app.post("/webhook", async (req, reply) => {
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

    app.log.info({ eventType }, "X webhook event received");

    try {
      await prisma.auditLog.create({
        data: {
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
