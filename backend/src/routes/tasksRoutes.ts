import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { meterJobCreated } from "../lib/usageMeter.js";

type CreateTaskRequest = {
  tenantId: string;
  createdBy?: string;
  assignedAgentId: string;
  title: string;
  description?: string;
  workflowId?: string;
  priority?: number;
  input?: any;
  traceId?: string;
};

export const tasksRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const body = (req.body ?? {}) as Partial<CreateTaskRequest>;
    if (!tenantId || !body.assignedAgentId || !body.title) {
      return reply.code(400).send({ ok: false, error: "tenantId, assignedAgentId, title are required" });
    }

    const job = await prisma.job.create({
      data: {
        tenantId,
        requested_by_user_id: (req as any).user?.id ?? body.createdBy ?? tenantId,
        status: "queued",
        jobType: "AGENT_TASK",
        priority: typeof body.priority === "number" ? body.priority : 0,
        input: {
          assignedAgentId: body.assignedAgentId,
          title: body.title,
          description: body.description ?? "",
          workflowId: body.workflowId ?? null,
          input: body.input ?? {},
          traceId: body.traceId ?? null,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: String((req as any).user?.id ?? body.createdBy ?? tenantId ?? ""),
        actorType: "system",
        level: "info",
        action: "TASK_CREATED",
        entityType: "job",
        entityId: job.id,
        message: `Task created for ${body.assignedAgentId}: ${body.title}`,
        meta: { assignedAgentId: body.assignedAgentId, title: body.title, workflowId: body.workflowId ?? null, traceId: body.traceId ?? null },
        timestamp: new Date(),
      },
    });

    // Phase 2: meter job creation
    const userId = (req as any).auth?.userId;
    if (userId && tenantId) meterJobCreated(userId, tenantId);

    return reply.send({ ok: true, taskId: job.id });
  });

  app.get("/", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    const agentId = String((req.query as any)?.agentId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const where: any = { tenantId, jobType: "AGENT_TASK" };
    if (agentId) where.input = { path: ["assignedAgentId"], equals: agentId };

    const tasks = await prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return reply.send({ ok: true, tasks });
  });
};
