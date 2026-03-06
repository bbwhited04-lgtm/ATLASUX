import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { getSystemState } from "../services/systemState.js";

export const diagnosticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/scheduler", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;

    // 1. Environment flags
    const schedulerEnabled = process.env.SCHEDULER_ENABLED ?? "(not set)";

    // 2. Atlas online system state
    let atlasOnline: any = null;
    try {
      const row = await getSystemState("atlas_online");
      atlasOnline = row?.value ?? null;
    } catch { /* non-fatal */ }

    // 3. Last 10 scheduler job fires
    let recentFires: any[] = [];
    try {
      recentFires = await prisma.auditLog.findMany({
        where: {
          action: "SCHEDULER_JOB_FIRED",
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { timestamp: "desc" },
        take: 10,
        select: { message: true, timestamp: true, meta: true },
      });
    } catch { /* non-fatal */ }

    // 4. Last 5 daily-intel entries
    let intelEntries: any[] = [];
    try {
      intelEntries = await prisma.auditLog.findMany({
        where: {
          action: "WORKFLOW_STEP",
          message: { contains: "intel" },
          ...(tenantId ? { tenantId } : {}),
        },
        orderBy: { timestamp: "desc" },
        take: 5,
        select: { message: true, timestamp: true, meta: true },
      });
    } catch { /* non-fatal */ }

    // 5. Stuck intents (RUNNING > 15 minutes)
    let stuckIntents = 0;
    try {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000);
      stuckIntents = await prisma.intent.count({
        where: {
          status: "RUNNING",
          createdAt: { lt: cutoff },
        },
      });
    } catch { /* non-fatal */ }

    return reply.send({
      ok: true,
      schedulerEnabled,
      atlasOnline,
      stuckIntents,
      recentFires,
      intelEntries,
    });
  });
};
