import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

// Returns workflows from the DB (not the static registry).
// This allows N8N-imported workflows (workflow_key like `N8N-*`) to appear in the UI.
export const workflowsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const rows = (await prisma.$queryRaw`
      select
        workflow_key,
        agent_key,
        name,
        status,
        version,
        created_at,
        updated_at
      from workflows
      order by agent_key asc, name asc
    `) as any[];

    return {
      ok: true,
      workflows: (rows ?? []).map((w) => ({
        workflow_key: String(w.workflow_key ?? ""),
        agent_key: w.agent_key ? String(w.agent_key) : null,
        name: w.name ? String(w.name) : String(w.workflow_key ?? ""),
        status: w.status ? String(w.status) : null,
        version: w.version ? String(w.version) : null,
        created_at: w.created_at ?? null,
        updated_at: w.updated_at ?? null,
      })),
    };
  });
};
