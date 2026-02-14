import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";

/**
 * Simple health/status for audit storage.
 * Returns ready=true if we can insert a row into audit_log (dry run) OR if audit_log is queryable.
 */
export async function auditRoutes(app: FastifyInstance) {
  app.get("/status", async (_req, reply) => {
    try {
      // Query one row; if table exists + Prisma model works, storage is "ready"
      await prisma.auditLog.findFirst({ select: { id: true } });
      return reply.send({ ok: true, ready: true });
    } catch (err: any) {
      console.error(err);
      return reply.send({ ok: true, ready: false, error: err?.message ?? "unknown" });
    }
  });
}
