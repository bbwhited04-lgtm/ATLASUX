import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

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
    const body = (req.body ?? {}) as Partial<EmailRequest>;
    if (!body.tenantId || !body.fromAgent || !body.to || !body.subject || !body.text) {
      return reply.code(400).send({ ok: false, error: "tenantId, fromAgent, to, subject, text are required" });
    }

    const job = await prisma.job.create({
      data: {
        tenantId: body.tenantId,
        requested_by_user_id: (req as any).user?.id ?? body.tenantId,
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
        tenantId: body.tenantId,
        actorUserId: null,
        actorExternalId: String((req as any).user?.id ?? body.tenantId ?? ""),
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
    const tenantId = String((req.query as any)?.tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const jobs = await prisma.job.findMany({
      where: { tenantId, jobType: "EMAIL_SEND" },
      orderBy: { createdAt: "desc" },
      take: 100,
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

    const tenantId = body.tenantId ?? "";

    const job = await prisma.job.create({
      data: {
        tenantId: tenantId || "demo_org",
        requested_by_user_id: (req as any).user?.id ?? tenantId || "demo_org",
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
          actorExternalId: String((req as any).user?.id ?? tenantId ?? ""),
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
