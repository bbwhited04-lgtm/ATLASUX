import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import * as circuitBreaker from "../lib/circuitBreaker.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // No-dependency liveness
  app.get("/health", async () => ({ ok: true, status: "alive" }));

  // Dependency readiness (DB)
  app.get("/ready", async () => {
    // Lightweight query
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, status: "ready" };
  });

  // LLM provider circuit breaker status
  app.get("/health/providers", async () => {
    const providers = circuitBreaker.getState();
    const allOpen = Object.values(providers).length > 0 &&
      Object.values(providers).every((p) => p.state === "OPEN");
    return {
      ok: !allOpen,
      providers,
    };
  });
};
