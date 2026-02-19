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
};
