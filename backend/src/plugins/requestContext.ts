import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";

declare module "fastify" {
  interface FastifyRequest {
    ctx: {
      requestId: string;
      actorType: "user" | "atlas" | "system";
      actorId: string | null;
      ipAddress: string | null;
      userAgent: string | null;
    };
  }
}

const plugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req) => {
    const requestId =
      (req.headers["x-request-id"] as string | undefined) ?? crypto.randomUUID();

    const userAgent = (req.headers["user-agent"] as string | undefined) ?? null;

    // If you're behind a proxy, enable trustProxy in Fastify options.
    const ipAddress = (req.ip as string | undefined) ?? null;

    // Default until auth plugin sets it
    req.ctx = {
      requestId,
      actorType: "system",
      actorId: null,
      ipAddress,
      userAgent,
    };
  });
};

export default fp(plugin, { name: "requestContext" });
