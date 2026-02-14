import type { FastifyPluginAsync } from "fastify";

export const accountingRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/accounting/summary?org_id=demo_org&user_id=demo_user
  app.get("/summary", async (req) => {
    const q = (req.query ?? {}) as any;

    return {
      ok: true,
      org_id: q.org_id ?? q.orgId ?? null,
      user_id: q.user_id ?? q.userId ?? null,
      summary: {
        revenue: 0,
        expenses: 0,
        net: 0,
        approvalsPending: 0,
        flags: 0,
      },
      ts: new Date().toISOString(),
    };
  });
};
