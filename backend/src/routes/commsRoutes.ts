import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

type EmailRequest = {
  tenantId: string;
  fromAgent: string;
  to: string;
  subject: string;
  text: string;
  traceId?: string;
};

export const commsRoutes: FastifyPluginAsync = async (app) => {
  // Queue an email as a Job. A future SMTP worker can deliver these.
  app.post("/email", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as Partial<EmailRequest>;
    if (!tenantId || !body.fromAgent || !body.to || !body.subject || !body.text) {
      return reply.code(400).send({ ok: false, error: "tenantId, fromAgent, to, subject, text are required" });
    }

    const job = await prisma.job.create({
      data: {
        tenantId,
        requested_by_user_id: (req as any).user?.id ?? tenantId,
        status: "queued",
        jobType: "EMAIL_SEND",
        priority: 5,
        input: {
          to: body.to,
          subject: body.subject,
          text: body.text,
          fromAgent: body.fromAgent,
          traceId: body.traceId ?? null,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: String((req as any).user?.id ?? tenantId ?? ""),
        actorType: "system",
        level: "info",
        action: "EMAIL_QUEUED",
        entityType: "job",
        entityId: job.id,
        message: `Queued email from ${body.fromAgent} to ${body.to}`,
        meta: { to: body.to, fromAgent: body.fromAgent, subject: body.subject, traceId: body.traceId ?? null },
        timestamp: new Date(),
      },
    });

    return reply.send({ ok: true, jobId: job.id });
  });

  // Outbox viewer (queued emails)
  app.get("/outbox", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const jobs = await prisma.job.findMany({
      where: { tenantId, jobType: "EMAIL_SEND" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return reply.send({ ok: true, jobs });
  });

  // Queue a Teams channel message as a TEAMS_SEND job.
  app.post("/teams", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as any;
    const teamId = String(body.teamId ?? "").trim();
    const channelId = String(body.channelId ?? "").trim();
    const text = String(body.text ?? "").trim();
    const fromAgent = String(body.fromAgent ?? "atlas").trim();
    const toAgent = body.toAgent ? String(body.toAgent).trim() : null;

    if (!tenantId || !teamId || !channelId || !text) {
      return reply.code(400).send({ ok: false, error: "tenantId, teamId, channelId, text required" });
    }

    const job = await prisma.job.create({
      data: {
        tenantId,
        requested_by_user_id: (req as any).user?.id ?? tenantId,
        status: "queued",
        jobType: "TEAMS_SEND",
        priority: 5,
        input: { teamId, channelId, text, fromAgent, toAgent },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: fromAgent,
        actorType: "system",
        level: "info",
        action: "TEAMS_QUEUED",
        entityType: "job",
        entityId: job.id,
        message: `Queued Teams message from ${fromAgent}${toAgent ? ` → ${toAgent}` : ""} in channel ${channelId}`,
        meta: { teamId, channelId, fromAgent, toAgent },
        timestamp: new Date(),
      },
    });

    return reply.send({ ok: true, jobId: job.id });
  });

  // Teams outbox
  app.get("/teams/outbox", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const jobs = await prisma.job.findMany({
      where: { tenantId, jobType: "TEAMS_SEND" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return reply.send({ ok: true, jobs });
  });

  // Lightweight stub so the UI can "send" an install link without wiring a provider yet.
  // Replace with Twilio/Vonage/etc when ready.
  app.post("/sms", async (req, reply) => {
    const body = (req.body ?? {}) as { tenantId?: string; to?: string; message?: string };
    const to = String(body.to ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!to || !message) {
      return reply.code(400).send({ ok: false, error: "to and message are required" });
    }

    const tenantId = String((req as any).tenantId ?? "");

    const job = await prisma.job.create({
      data: {
        tenantId: tenantId || "demo_org",
        requested_by_user_id: (req as any).user?.id || tenantId || "demo_org",
        status: "queued",
        jobType: "SMS_SEND",
        priority: 5,
        input: { to, message },
      },
    });

    // Best-effort audit.
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: tenantId || "demo_org",
          actorUserId: null,
          actorExternalId: String((req as any).user?.id ?? ""),
          actorType: "system",
          level: "info",
          action: "SMS_QUEUED",
          entityType: "job",
          entityId: job.id,
          message: `Queued SMS to ${to}`,
          meta: { to, message },
          timestamp: new Date(),
        },
      });
    } catch {
      // ignore
    }

    return reply.send({ ok: true, jobId: job.id });
  });
};
