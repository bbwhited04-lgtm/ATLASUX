import type { FastifyPluginAsync } from "fastify";
import { workflowCatalog } from "../workflows/registry.js";

export const workflowsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ ok: true, workflows: workflowCatalog }));
};
