import type { FastifyPluginAsync } from "fastify";
import { runGrowthLoop } from "../services/growthLoop.js";

export const growthRoutes: FastifyPluginAsync = async (app) => {
  // Manually trigger the daily growth loop (cron can hit this)
  app.post("/run", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String(body.tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const agent = String(body.agent ?? "atlas");
    const proposedAction = body.proposedAction;

    const res = await runGrowthLoop({ tenantId, agent, proposedAction });
    return reply.send(res);
  });
};
