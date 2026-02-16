import type { FastifyPluginAsync } from "fastify";
import { engineTick } from "../core/engine/engine.js";

export const engineRoutes: FastifyPluginAsync = async (app) => {
  app.post("/tick", async (_req, reply) => {
    const result = await engineTick();
    return reply.send(result);
  });
};

