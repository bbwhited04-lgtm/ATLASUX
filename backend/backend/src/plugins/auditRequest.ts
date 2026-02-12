import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { auditLog } from "../domain/audit/audit.service";

const plugin: FastifyPluginAsync = async (app) => {
  // Log AFTER response to capture status code
  app.addHook("onResponse", async (req, reply) => {
    // Skip health checks if you want (optional)
    if (req.routerPath === "/health") return;

    const status =
      reply.statusCode >= 200 && reply.statusCode < 400 ? "SUCCESS" : "FAILED";

    await auditLog({
      actorType: req.ctx?.actorType ?? "system",
      actorId: req.ctx?.actorId ?? null,
      action: "HTTP_REQUEST",
      entityType: "http",
      entityId: req.ctx?.requestId ?? null,
      status,
      ipAddress: req.ctx?.ipAddress ?? null,
      userAgent: req.ctx?.userAgent ?? null,
      metadata: {
        method: req.method,
        path: req.url,
        routerPath: req.routerPath ?? null,
        statusCode: reply.statusCode,
      },
    });
  });
};

export default fp(plugin, { name: "auditRequest" });
