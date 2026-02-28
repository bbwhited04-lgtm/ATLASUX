/**
 * pinterestRoutes.ts — Pinterest Webhook + API
 *
 * Pinterest has limited webhook support (only via Ads API).
 * This acts as an inbound endpoint for Zapier/Make/n8n triggers.
 *
 * GET  /v1/pinterest/webhook  — health check
 * POST /v1/pinterest/webhook  — receive events (new_pin, repin, board_update, follower, comment, etc.)
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const pinterestRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — health check ─────────────────────────────────────────
  app.get("/webhook", async (_req, reply) => {
    return reply.send({
      ok: true,
      service: "pinterest-webhook",
      accepts: ["new_pin", "repin", "board_update", "follower", "comment", "save", "click", "custom"],
    });
  });

  // ── POST /webhook — inbound event ───────────────────────────────────────
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;
    if (!body || typeof body !== "object") {
      return reply.status(400).send({ ok: false, error: "Body must be JSON object" });
    }

    const event = body.event ?? body.type ?? "custom";
    const source = body.source ?? "zapier";

    app.log.info({ event, source }, "Pinterest webhook event received");

    try {
      await prisma.auditLog.create({
        data: {
          actorExternalId: `pinterest-${source}`,
          actorType: "system",
          action: `pinterest.${event}`,
          entityType: "pinterest_event",
          message: `Pinterest ${event} via ${source}`,
          meta: { event, source, data: body.data ?? body, receivedAt: new Date().toISOString() },
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log Pinterest webhook event");
    }

    return reply.status(200).send({
      ok: true,
      event,
      routed_to: "cornwall",
    });
  });
};
