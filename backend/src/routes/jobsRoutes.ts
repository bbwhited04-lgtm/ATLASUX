import type { FastifyPluginAsync } from "fastify";

export const jobsRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/jobs/list?org_id=demo_org&user_id=demo_user
  app.get("/list", async (req) => {
    const q = (req.query ?? {}) as any;

    return {
      ok: true,
      org_id: q.org_id ?? q.orgId ?? null,
      user_id: q.user_id ?? q.userId ?? null,
      items: [],
      ts: new Date().toISOString(),
    };
  });

  // Frontend alpha flows currently POST to /v1/jobs/list (legacy).
  // Provide a stub POST handler so local testing doesn't 404.
  app.post("/list", async (req) => {
    const body = (req.body ?? {}) as any;

    return {
      ok: true,
      started: true,
      job_id: "job_" + Date.now(),
      org_id: body.org_id ?? body.orgId ?? null,
      user_id: body.user_id ?? body.userId ?? null,
      type: body.type ?? "generic",
      payload: body.payload ?? null,
      ts: new Date().toISOString(),
    };
  });
};
