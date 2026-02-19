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

const app = Fastify({ logger: true });

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
  allowedHeaders: ["Content-Type", "Authorization", "x-tenant-id"],
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

const port = Number(process.env.PORT ?? 8787);
const host = "0.0.0.0";

app.listen({ port, host }).then(() => {
  app.log.info(`AtlasUX backend listening on :${port}`);
});
