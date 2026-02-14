import { FastifyPluginAsync } from "fastify";
import { getSystemState, setSystemState } from "../services/systemState.js";

export const systemStateRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/system/state/:key", async (req) => {
    const key = (req.params as any).key as string;
    return { ok: true, state: await getSystemState(key) };
  });

  app.post("/api/system/state/:key", async (req) => {
    const key = (req.params as any).key as string;
    const body = req.body as any;

    // Optional: set these headers so audit entries get nice entity fields
    (req as any).headers["x-audit-action"] = `SYSTEM_STATE_SET ${key}`;
    (req as any).headers["x-entity-type"] = "SystemState";
    (req as any).headers["x-entity-id"] = key;

    const value = String(body?.value ?? "");
    const state = await setSystemState(key, value);
    return { ok: true, state };
  });

  // Convenience endpoints (Atlas online/offline)
  app.post("/api/system/atlas/online", async (req) => {
    (req as any).headers["x-audit-action"] = "ATLAS_ONLINE";
    const state = await setSystemState("atlas_online", "true");
    return { ok: true, state };
  });

  app.post("/api/system/atlas/offline", async (req) => {
    (req as any).headers["x-audit-action"] = "ATLAS_OFFLINE";
    const state = await setSystemState("atlas_online", "false");
    return { ok: true, state };
  });
};
