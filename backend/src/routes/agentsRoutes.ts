import type { FastifyPluginAsync } from "fastify";
import { agentRegistry } from "../agents/registry.js";

export const agentsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ ok: true, agents: agentRegistry }));
};
