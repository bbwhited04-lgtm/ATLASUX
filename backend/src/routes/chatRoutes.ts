import type { FastifyPluginAsync } from "fastify";
import { runChat } from "../ai.js";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (req, reply) => {
    const body = req.body as any;

    // runChat can read process.env directly, or you pass env object if needed later
    const result = await runChat(body, process.env as any);
    return reply.send(result);
  });
};
