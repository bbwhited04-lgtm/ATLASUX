/**
 * linkedinRoutes.ts — LinkedIn Webhook + API
 *
 * GET  /v1/linkedin/webhook  — challenge-response verification
 * POST /v1/linkedin/webhook  — receive event notifications
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const linkedinRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — LinkedIn challenge verification ──────────────────────
  // LinkedIn sends: GET /webhook?challengeCode=<code>
  // We must respond with: { "challengeCode": "<code>" }
  app.get("/webhook", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const challengeCode = q.challengeCode;

    if (!challengeCode) {
      return reply.status(400).send({ error: "Missing challengeCode" });
    }

    app.log.info({ challengeCode }, "LinkedIn webhook verification challenge received");
    return reply.send({ challengeCode });
  });

  // ── POST /webhook — LinkedIn event notifications ────────────────────────
  app.post("/webhook", async (req, reply) => {
    const body = req.body as any;
    app.log.info({ event: body }, "LinkedIn webhook event received");

    try {
      // Store the event in audit log for traceability
      await prisma.auditLog.create({
        data: {
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
