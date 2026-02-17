import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  // No-dependency liveness
  app.get("/health", async () => ({ ok: true, status: "alive" }));

  // Dependency readiness (DB)
  app.get("/ready", async () => {
    // Lightweight query
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, status: "ready" };
  });
};
