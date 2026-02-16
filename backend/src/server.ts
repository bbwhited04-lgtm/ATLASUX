import Fastify from "fastify";
import cors from "@fastify/cors";

// Routes
import { chatRoutes } from "./routes/chatRoutes.js";
import { auditRoutes } from "./routes/auditRoutes.js";
import { businessManagerRoutes } from "./routes/businessManagerRoutes.js";
import { jobsRoutes } from "./routes/jobsRoutes.js";
import { accountingRoutes } from "./routes/accountingRoutes.js";
import { tenantsRoutes } from "./routes/tenants.js";
import { assetsRoutes } from "./routes/assets.js";
import { ledgerRoutes } from "./routes/ledger.js";
import { authPlugin } from "./plugins/authPlugin.js";
import { tenantPlugin } from "./plugins/tenantPlugin.js";
await app.register(tenantPlugin);
// Plugin (default export)
import auditPlugin from "./plugins/auditPlugin.js";
wait app.register(authPlugin);
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
  allowedHeaders: ["Content-Type", "Authorization"],
});


// Plugins
await app.register(auditPlugin);

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
