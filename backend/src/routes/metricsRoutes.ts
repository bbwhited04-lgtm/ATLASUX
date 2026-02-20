import type { FastifyPluginAsync } from "fastify";
import { computeMetricsSnapshot, getLatestSnapshot, upsertDailySnapshot } from "../services/metricsSnapshot.js";

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  // Create/Upsert a daily metrics snapshot (intended for nightly cron)
  app.post("/snapshot", async (req, reply) => {
    const tenantId = String((req.body as any)?.tenantId ?? (req.query as any)?.tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const snapshot = await computeMetricsSnapshot({ tenantId });
    const saved = await upsertDailySnapshot({ tenantId, snapshot });

    return reply.send({ ok: true, date: snapshot.date, id: saved.id, data: snapshot });
  });

  // Get latest snapshot
  app.get("/latest", async (req, reply) => {
    const tenantId = String((req.query as any)?.tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const row = await getLatestSnapshot(tenantId);
    if (!row) return reply.code(404).send({ ok: false, error: "no_snapshot" });

    return reply.send({ ok: true, id: row.id, date: row.date, data: row.data });
  });
};
