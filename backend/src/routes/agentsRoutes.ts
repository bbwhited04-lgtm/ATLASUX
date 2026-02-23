import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const agentsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const rows = (await prisma.$queryRaw`
      select
        agent_key,
        display_name,
        staff_role,
        description
      from agents
      order by agent_key asc
    `) as any[];

    // Keep response backward-compatible with the earlier static registry shape
    // so the UI can show: id/name/title/summary
    const agents = (rows ?? []).map((a) => ({
      id: String(a.agent_key ?? ""),
      name: String(a.display_name ?? a.agent_key ?? ""),
      title: String(a.staff_role ?? ""),
      tier: "Executive",
      summary: String(a.description ?? ""),
    }));

    return { ok: true, agents };
  });
};
