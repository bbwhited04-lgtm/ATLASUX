import type { FastifyPluginAsync } from "fastify";
import { atlasExecuteGate } from "../core/exec/atlasGate.js";
import { runChat } from "../ai.js";

export const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (req, reply) => {
    const body = req.body as any;

    // runChat can read process.env directly, or you pass env object if needed later
    const result = await runChat(body, process.env as any);
    return reply.send(result);
	const tenantId = (req as any).tenantId;
const userId = (req as any).auth?.userId ?? "unknown";

const gate = await atlasExecuteGate({
  tenantId,
  userId,
  intentType: "CHAT_CALL",
  payload: { provider: body?.provider, model: body?.model },
  dataClass: "NONE",
  spendUsd: 0,
});

if (!gate.ok) return reply.code(gate.status).send(gate);

  });
};
