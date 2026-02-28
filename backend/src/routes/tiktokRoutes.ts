/**
 * tiktokRoutes.ts — TikTok Webhook + API
 *
 * GET  /v1/tiktok/webhook  — verification ping
 * POST /v1/tiktok/webhook  — receive event notifications
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const tiktokRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — TikTok verification ──────────────────────────────────
  // TikTok sends a verification challenge on webhook registration
  app.get("/webhook", async (req, reply) => {
    const q = req.query as Record<string, string>;
    // TikTok uses challenge param for verification
    if (q.challenge) {
      app.log.info("TikTok webhook verification challenge received");
      return reply.send({ challenge: q.challenge });
    }
    return reply.send({ ok: true, service: "tiktok-webhook" });
  });

  // ── POST /webhook — TikTok event notifications ─────────────────────────
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;
    const event = body?.event ?? body?.type ?? "unknown";

    app.log.info({ event }, "TikTok webhook event received");

    try {
      await prisma.auditLog.create({
        data: {
          actorExternalId: "tiktok-webhook",
          actorType: "system",
          action: `tiktok.${event}`,
          entityType: "tiktok_event",
          message: `TikTok ${event} event received`,
          meta: body ?? {},
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log TikTok webhook event");
    }

    return reply.status(200).send({ ok: true });
  });
};
