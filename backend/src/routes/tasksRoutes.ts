import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

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
    const body = (req.body ?? {}) as Partial<CreateTaskRequest>;
    if (!body.tenantId || !body.assignedAgentId || !body.title) {
      return reply.code(400).send({ ok: false, error: "tenantId, assignedAgentId, title are required" });
    }

    const job = await prisma.job.create({
      data: {
        tenantId: body.tenantId,
        requested_by_user_id: (req as any).user?.id ?? body.createdBy ?? body.tenantId,
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
        tenantId: body.tenantId,
        actorUserId: (req as any).user?.id ?? body.createdBy ?? body.tenantId,
        actorType: "user",
        level: "info",
        action: "TASK_CREATED",
        entityType: "job",
        entityId: job.id,
        message: `Task created for ${body.assignedAgentId}: ${body.title}`,
        meta: { assignedAgentId: body.assignedAgentId, title: body.title, workflowId: body.workflowId ?? null, traceId: body.traceId ?? null },
        timestamp: new Date(),
      },
    });

    return reply.send({ ok: true, taskId: job.id });
  });

  app.get("/", async (req, reply) => {
    const tenantId = String((req.query as any)?.tenantId ?? "");
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
