/**
 * tumblrRoutes.ts — Tumblr Webhook + API
 *
 * Tumblr has no native webhook system, so this acts as a generic
 * inbound endpoint for Zapier/Make/n8n triggers or custom scrapers.
 *
 * GET  /v1/tumblr/webhook  — health check
 * POST /v1/tumblr/webhook  — receive events (new_post, reblog, like, follow, ask, etc.)
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const tumblrRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — health check ─────────────────────────────────────────
  app.get("/webhook", async (_req, reply) => {
    return reply.send({
      ok: true,
      service: "tumblr-webhook",
      accepts: ["new_post", "reblog", "like", "follow", "ask", "mention", "custom"],
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

    app.log.info({ event, source }, "Tumblr webhook event received");

    try {
      await prisma.auditLog.create({
        data: {
          actorExternalId: `tumblr-${source}`,
          actorType: "system",
          action: `tumblr.${event}`,
          entityType: "tumblr_event",
          message: `Tumblr ${event} via ${source}`,
          meta: { event, source, data: body.data ?? body, receivedAt: new Date().toISOString() },
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log Tumblr webhook event");
    }

    return reply.status(200).send({
      ok: true,
      event,
      routed_to: "terry",
    });
  });
};
