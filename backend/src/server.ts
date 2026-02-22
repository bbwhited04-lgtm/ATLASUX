import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";

// Plugins
import auditPlugin from "./plugins/auditPlugin.js";
import { authPlugin } from "./plugins/authPlugin.js";
import { tenantPlugin } from "./plugins/tenantPlugin.js";
import { engineRoutes } from "./routes/engineRoutes.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { agentsRoutes } from "./routes/agentsRoutes.js";
import { systemStateRoutes } from "./routes/systemStateRoutes.js";
import { workflowsRoutes } from "./routes/workflowsRoutes.js";
import { tasksRoutes } from "./routes/tasksRoutes.js";
import { commsRoutes } from "./routes/commsRoutes.js";

// Routes
import { chatRoutes } from "./routes/chatRoutes.js";
import { auditRoutes } from "./routes/auditRoutes.js";
import { businessManagerRoutes } from "./routes/businessManagerRoutes.js";
import { jobsRoutes } from "./routes/jobsRoutes.js";
import { accountingRoutes } from "./routes/accountingRoutes.js";
import { tenantsRoutes } from "./routes/tenants.js";
import { assetsRoutes } from "./routes/assets.js";
import { ledgerRoutes } from "./routes/ledger.js";
import { kbRoutes } from "./routes/kbRoutes.js";
import { stripeRoutes } from "./routes/stripeRoutes.js";
import { metricsRoutes } from "./routes/metricsRoutes.js";
import { decisionRoutes } from "./routes/decisionRoutes.js";
import { distributionRoutes } from "./routes/distributionRoutes.js";
import { growthRoutes } from "./routes/growthRoutes.js";
import { integrationsRoutes } from "./routes/integrationsRoutes.js";
import { oauthRoutes } from "./routes/oauthRoutes.js";
import { ticketsRoutes } from "./routes/ticketsRoutes.js";

const app = Fastify({ logger: true });
app.addHook("onSend", async (_req, reply, payload) => {
  // Only touch JSON responses
  const contentType = reply.getHeader("content-type");
  if (typeof payload === "string" || !contentType?.toString().includes("application/json")) {
    return payload;
  }
  try {
    return JSON.stringify(payload, (_k, v) =>
      typeof v === "bigint" ? Number(v) : v
    );
  } catch {
    return payload;
  }
});
app.post("/v1/discord/webhook", async (request, reply) => {
  request.log.info("Discord webhook hit");
  return reply.code(200).send({ ok: true });
});

// Optional: some validators try GET too
app.get("/v1/discord/webhook", async (_request, reply) => {
  return reply.code(200).send({ ok: true });
});
const allowed = new Set([
  "https://www.atlasux.cloud",
  "https://atlasux.cloud",
  "http://localhost:5173",
  "http://localhost:3000",
]);

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, allowed.has(origin));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id", "x-user-id", "x-actor-user-id", "x-external-id", "x-actor-external-id", "x-actor-type", "x-device-id", "x-request-id", "x-client-source"],
});

// Plugins (order matters)
await app.register(auditPlugin);
await app.register(authPlugin);
await app.register(tenantPlugin);
await app.register(engineRoutes, { prefix: "/v1/engine" });
await app.register(healthRoutes, { prefix: "/v1" });
await app.register(agentsRoutes, { prefix: "/v1/agents" });
await app.register(workflowsRoutes, { prefix: "/v1/workflows" });
await app.register(tasksRoutes, { prefix: "/v1/tasks" });
await app.register(commsRoutes, { prefix: "/v1/comms" });
await app.register(systemStateRoutes, { prefix: "/v1" });

// Route prefixes
await app.register(chatRoutes, { prefix: "/v1/chat" });
await app.register(auditRoutes, { prefix: "/v1/audit" });
await app.register(businessManagerRoutes, { prefix: "/v1/business" });
await app.register(jobsRoutes, { prefix: "/v1/jobs" });
await app.register(accountingRoutes, { prefix: "/v1/accounting" });
await app.register(tenantsRoutes, { prefix: "/v1/tenants" });
await app.register(assetsRoutes, { prefix: "/v1/assets" });
await app.register(ledgerRoutes, { prefix: "/v1/ledger" });
await app.register(kbRoutes, { prefix: "/v1/kb" });
await app.register(stripeRoutes, { prefix: "/v1/stripe" });
await app.register(metricsRoutes, { prefix: "/v1/metrics" });
await app.register(decisionRoutes, { prefix: "/v1/decisions" });
await app.register(distributionRoutes, { prefix: "/v1/distribution" });
await app.register(growthRoutes, { prefix: "/v1/growth" });

// Lightweight beta feedback tickets
await app.register(ticketsRoutes, { prefix: "/v1/tickets" });

// OAuth + Integrations hub (needed by Integrations UI)
await app.register(integrationsRoutes, { prefix: "/v1/integrations" });
await app.register(oauthRoutes, { prefix: "/v1/oauth" });

const port = Number(process.env.PORT ?? 8787);
const host = "0.0.0.0";
// backend/src/server.ts
import { engineTick } from "./core/engine/engine.js";

const engineEnabled = (process.env.ENGINE_ENABLED ?? "false").toLowerCase() === "true";
const tickMs = Number(process.env.ENGINE_TICK_INTERVAL_MS ?? process.env.EMAIL_WORKER_INTERVAL_MS ?? 5000);

if (engineEnabled) {
  app.log.info(`Engine enabled. Ticking every ${tickMs}ms`);
  setInterval(async () => {
    try {
      await engineTick();
    } catch (err) {
      app.log.error({ err }, "engineTick failed");
    }
  }, tickMs);
} else {
  app.log.info("Engine disabled (ENGINE_ENABLED != true)");
}
app.listen({ port, host }).then(() => {
  app.log.info(`AtlasUX backend listening on :${port}`);
});
