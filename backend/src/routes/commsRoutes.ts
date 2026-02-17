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
        requestedBy: (req as any).user?.id ?? body.tenantId,
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
        actorUserId: (req as any).user?.id ?? body.tenantId,
        actorType: "user",
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
};
