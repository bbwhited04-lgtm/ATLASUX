import Fastify from "fastify";
import cors from "@fastify/cors";

// Routes (adjust paths if your filenames differ)
import { chatRoutes } from "./routes/chatRoutes.js";
import { auditRoutes } from "./routes/auditRoutes.js";
import { businessManagerRoutes } from "./routes/businessManagerRoutes.js";
import { jobsRoutes } from "./routes/jobsRoutes.js";
import { accountingRoutes } from "./routes/accountingRoutes.js";

// Plugin (default export)
import auditPlugin from "./plugins/auditPlugin.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  // --- CORS (global) ---
  await app.register(cors, {
    origin: [
      "https://www.atlasux.cloud",
      "https://atlasux.cloud",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // --- Health / sanity endpoints ---
  app.get("/", async () => ({
    ok: true,
    service: "atlasux-backend",
    ts: new Date().toISOString(),
  }));
  app.get("/site_integration", async (req, reply) => {
  // forward/alias to the v1 handler response shape
  const q = (req.query ?? {}) as any;
  return reply.send({
    ok: true,
    org_id: q.org_id ?? "demo_org",
    user_id: q.user_id ?? "demo_user",
    providers: [],
    ts: new Date().toISOString(),
  });
});
  app.get("/__version", async () => ({
    ok: true,
    stamp: process.env.BUILD_STAMP || "no_stamp",
    node: process.version,
    env: process.env.NODE_ENV || "unknown",
    ts: new Date().toISOString(),
  }));

  // --- API Routes (match the UI calls) ---
  app.register(accountingRoutes, { prefix: "/v1/accounting" });
  app.register(jobsRoutes, { prefix: "/v1/jobs" });
  app.register(businessManagerRoutes, { prefix: "/v1/integrations" });
  app.register(auditRoutes, { prefix: "/v1/audit" });
  app.register(chatRoutes, { prefix: "/v1/chat" });

  // --- Plugins (auto audit hooks, etc.) ---
  app.register(auditPlugin);

  return app;
}

// If Render runs dist/server.js directly, this will start the server.
// If you use dist/index.js, this still works fine (it just won’t be executed unless imported/run).

