import type { FastifyPluginAsync } from "fastify";
import { auditLog } from "../domain/audit/audit.service.js";

export const auditRequestPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", async (req) => {
    const routeUrl = (req.routeOptions?.url as string | undefined) || req.url;
    if (routeUrl === "/health") return;

    try {
      await auditLog({
        actorType: "system",
        actorId: null,
        action: "http.request",
        entityType: "http",
        entityId: null,
        status: "PENDING",
        ipAddress: (req.ip as string | undefined) ?? null,
        userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
        metadata: {
          method: req.method,
          routerPath: routeUrl,
        },
      });
    } catch {
      // never block request
    }
  });

  fastify.addHook("onResponse", async (req, reply) => {
    const routeUrl = (req.routeOptions?.url as string | undefined) || req.url;
    if (routeUrl === "/health") return;

    const status: "SUCCESS" | "FAILED" = reply.statusCode >= 400 ? "FAILED" : "SUCCESS";

    try {
      await auditLog({
        actorType: "system",
        actorId: null,
        action: "http.response",
        entityType: "http",
        entityId: null,
        status,
        ipAddress: (req.ip as string | undefined) ?? null,
        userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
        metadata: {
          method: req.method,
          routerPath: routeUrl,
          statusCode: reply.statusCode,
        },
      });
    } catch {
      // never block response
    }
  });
};
