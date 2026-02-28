/**
 * alignableRoutes.ts — Alignable Inbound Webhook
 *
 * Alignable has no native webhook API, so this acts as a generic
 * inbound endpoint that Zapier, Make, n8n, or manual triggers can POST to.
 *
 * POST /v1/alignable/webhook           — receive events (new connection, message, recommendation, etc.)
 * GET  /v1/alignable/webhook           — health check / verification ping
 * GET  /v1/alignable/events            — list recent Alignable events from audit log
 *
 * Events are logged to audit trail and routed to Emma (Alignable agent).
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

// Supported Alignable event types for routing
const EVENT_TYPES = [
  "new_connection",
  "message_received",
  "recommendation_received",
  "recommendation_given",
  "question_posted",
  "question_answered",
  "group_post",
  "profile_view",
  "referral",
  "event_invite",
  "mention",
  "custom",
] as const;

export const alignableRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — verification / health check ──────────────────────────
  app.get("/webhook", async (_req, reply) => {
    return reply.send({
      ok: true,
      service: "alignable-webhook",
      accepts: EVENT_TYPES,
      usage: "POST JSON with { event, data } to this URL",
    });
  });

  // ── POST /webhook — inbound event from Zapier/Make/n8n ─────────────────
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;

    if (!body || typeof body !== "object") {
      return reply.status(400).send({ ok: false, error: "Body must be JSON object" });
    }

    const event = body.event ?? body.type ?? body.eventType ?? "custom";
    const data = body.data ?? body.payload ?? body;
    const source = body.source ?? "zapier";

    app.log.info({ event, source }, "Alignable webhook event received");

    try {
      await prisma.auditLog.create({
        data: {
          actorExternalId: `alignable-${source}`,
          actorType: "system",
          action: `alignable.${event}`,
          entityType: "alignable_event",
          message: `Alignable ${event} via ${source}`,
          meta: { event, source, data, receivedAt: new Date().toISOString() },
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log Alignable webhook event");
    }

    return reply.status(200).send({
      ok: true,
      event,
      routed_to: "emma",
      message: "Event logged and queued for Emma (Alignable agent)",
    });
  });

  // ── GET /events — recent Alignable events from audit log ────────────────
  app.get("/events", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const limit = Math.min(parseInt(q.limit ?? "25", 10), 100);

    try {
      const events = await prisma.auditLog.findMany({
        where: { action: { startsWith: "alignable." } },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          action: true,
          message: true,
          meta: true,
          createdAt: true,
        },
      });

      return reply.send({ ok: true, events, count: events.length });
    } catch (err) {
      app.log.error({ err }, "Failed to fetch Alignable events");
      return reply.status(500).send({ ok: false, error: "Failed to fetch events" });
    }
  });
};
