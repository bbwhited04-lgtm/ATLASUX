import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export const jobsRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/jobs/list
  app.get("/list", async (req) => {
    const tenantId = (req as any).tenantId as string | undefined;
    const q = (req.query ?? {}) as any;

    // Resolve tenantId from plugin or query param fallback
    const tid = tenantId || q.org_id || q.orgId || null;

    if (!tid || !isUUID(tid)) {
      return {
        ok: true,
        org_id: tid ?? null,
        user_id: q.user_id ?? q.userId ?? null,
        items: [],
        ts: new Date().toISOString(),
      };
    }

    const items = await prisma.job.findMany({
      where: { tenantId: tid },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    return {
      ok: true,
      org_id: tid,
      user_id: q.user_id ?? q.userId ?? null,
      items: items.map((j) => ({
        id: j.id,
        jobType: j.jobType,
        status: j.status,
        priority: j.priority,
        input: j.input,
        output: j.output,
        error: j.error,
        startedAt: j.startedAt,
        finishedAt: j.finishedAt,
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
      ts: new Date().toISOString(),
    };
  });

  // DELETE /v1/jobs/:id — cancel/remove a job (queued or paused only)
  app.delete("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId_required" });

    const { id } = req.params as { id: string };

    // Hard-delete non-running jobs; never forcibly remove a running job
    await prisma.job.deleteMany({
      where: { id, tenantId, status: { in: ["queued", "canceled", "failed", "succeeded"] } },
    });

    return reply.send({ ok: true });
  });

  // POST /v1/jobs — enqueue a job
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    const body = req.body as any;

    if (!tenantId || !isUUID(tenantId)) {
      return reply.code(400).send({ ok: false, error: "tenantId_required" });
    }

    const jobType = String(body?.jobType ?? body?.job_type ?? "").trim();
    if (!jobType) return reply.code(400).send({ ok: false, error: "missing_jobType" });

    const job = await prisma.job.create({
      data: {
        tenantId,
        jobType,
        priority: Number(body?.priority ?? 0),
        input: body?.input ?? {},
        status: "queued",
      },
    });

    return reply.send({ ok: true, id: job.id, status: job.status });
  });
};
