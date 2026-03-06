import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { calibrateAllAgents } from "../core/orgBrain/calibration.js";

type CalibrationScore = {
  agentId: string;
  positiveRate: number;
  totalOutcomes: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mixedCount: number;
  calibratedAt: string;
  modifier: number;
};

export const calibrationRoutes: FastifyPluginAsync = async (app) => {
  // List all agent calibration scores
  app.get("/", async (req, reply) => {
    const rows = await prisma.$queryRaw<
      { key: string; value: any; updated_at: Date | null }[]
    >`SELECT key, value, updated_at FROM system_state WHERE key LIKE 'org-brain:calibration:%'`;

    const scores: CalibrationScore[] = rows
      .map((r) => {
        const val = typeof r.value === "string" ? JSON.parse(r.value) : r.value;
        if (!val || typeof val !== "object" || !val.agentId) return null;
        return val as CalibrationScore;
      })
      .filter((s): s is CalibrationScore => s !== null);

    return reply.send({ scores, count: scores.length });
  });

  // Trigger recalibration for all agents
  app.post("/refresh", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const scores = await calibrateAllAgents(tenantId);

    return reply.send({ scores, count: scores.length });
  });
};
