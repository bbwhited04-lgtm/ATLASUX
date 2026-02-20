import type { FastifyPluginAsync } from "fastify";
import { agentRegistry } from "../agents/registry.js";
import { getAllowedToolsForAgent, getRoleForAgent } from "../policy/toolPolicy.js";

export const agentsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({
    ok: true,
    agents: agentRegistry.map((a) => ({
      ...a,
      role: getRoleForAgent(a.id),
      toolsAllowedEffective: getAllowedToolsForAgent(a.id),
    })),
  }));
};
