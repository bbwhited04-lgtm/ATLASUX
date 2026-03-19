/**
 * Self-Mend Routes — monitoring and stats for the LLM self-mending system.
 *
 * GET /v1/mend/stats         — mending stats (blocked, rewritten, flagged)
 * GET /v1/mend/recent        — recent mend decisions
 * POST /v1/mend/test         — test a message against the mending checks
 */

import type { FastifyPluginAsync } from "fastify";
import { getMendStats, mendCheck } from "../core/agent/selfMend.js";
import { prisma } from "../db/prisma.js";

const mendRoutes: FastifyPluginAsync = async (app) => {
  // Stats for last N hours
  app.get<{ Querystring: { hours?: string } }>("/stats", async (req) => {
    const tenantId = (req.headers["x-tenant-id"] as string) ?? "";
    const hours = parseInt(req.query.hours ?? "24", 10);
    return getMendStats(tenantId, hours);
  });

  // Recent mend decisions
  app.get<{ Querystring: { limit?: string } }>("/recent", async (req) => {
    const tenantId = (req.headers["x-tenant-id"] as string) ?? "";
    const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 100);

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: { startsWith: "SELF_MEND_" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        actorType: true,
        actorExternalId: true,
        entityType: true,
        message: true,
        meta: true,
        createdAt: true,
      },
    });

    return logs;
  });

  // Test a message against mending checks (dry-run)
  app.post<{ Body: { text: string; agentId: string; channelName: string } }>("/test", async (req) => {
    const tenantId = (req.headers["x-tenant-id"] as string) ?? "";
    const { text, agentId, channelName } = req.body;

    if (!text || !agentId || !channelName) {
      return { error: "text, agentId, and channelName are required" };
    }

    const verdict = await mendCheck(text, agentId, channelName, tenantId);

    // Don't log test checks to audit trail — return result only
    return {
      action: verdict.action,
      score: verdict.score,
      reasons: verdict.reasons,
      mendedText: verdict.mendedText,
    };
  });
};

export default mendRoutes;
