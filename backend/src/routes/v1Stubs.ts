import type { FastifyPluginAsync } from "fastify";

export const v1Stubs: FastifyPluginAsync = async (app) => {
  app.get("/integrations/status", async (req) => ({ ok: true, route: "integrations/status", q: req.query }));
  app.get("/accounting/summary", async (req) => ({ ok: true, route: "accounting/summary", q: req.query }));
  //app.get("/audit/list", async (req) => ({ ok: true, route: "audit/list", q: req.query, items: [] }));
  app.get("/jobs/list", async (req) => ({ ok: true, route: "jobs/list", q: req.query, items: [] }));
};
