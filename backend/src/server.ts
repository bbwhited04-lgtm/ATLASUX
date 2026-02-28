import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
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
import { emailRoutes } from "./routes/emailRoutes.js";

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
import { listeningRoutes } from "./routes/listeningRoutes.js";
import { oauthRoutes } from "./routes/oauthRoutes.js";
import { ticketsRoutes } from "./routes/ticketsRoutes.js";
import { toolsRoutes } from "./routes/toolsRoutes.js";
import { agentFlowRoutes } from "./routes/agentFlowRoutes.js";
import { blogRoutes } from "./routes/blogRoutes.js";
import { redditRoutes } from "./routes/redditRoutes.js";
import { mobileRoutes } from "./routes/mobileRoutes.js";
import { telegramRoutes } from "./routes/telegramRoutes.js";
import { teamsRoutes } from "./routes/teamsRoutes.js";
import { crmRoutes } from "./routes/crmRoutes.js";
import { analyticsRoutes } from "./routes/analyticsRoutes.js";
import { cannedResponseRoutes } from "./routes/cannedResponseRoutes.js";
import { budgetRoutes } from "./routes/budgetRoutes.js";
import { filesRoutes } from "./routes/filesRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { metaRoutes } from "./routes/metaRoutes.js";
import { googleRoutes } from "./routes/googleRoutes.js";
import { runtimeRoutes } from "./routes/runtimeRoutes.js";
import { atlasRoutes } from "./routes/atlasRoutes.js";
import { complianceRoutes } from "./routes/complianceRoutes.js";
import { gateRoutes } from "./routes/gateRoutes.js";
import { youtubeRoutes } from "./routes/youtubeRoutes.js";
import { videoRoutes } from "./routes/videoRoutes.js";
import { outlookRoutes } from "./routes/outlookRoutes.js";
import { calendarRoutes } from "./routes/calendarRoutes.js";
import { linkedinRoutes } from "./routes/linkedinRoutes.js";

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
// Discord webhook — Ed25519 signature verification required
// Registered as a scoped plugin so we can use a raw body parser without
// affecting the JSON parsing of every other route.
await app.register(async (discordScope) => {
  discordScope.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => {
    done(null, body);
  });

  discordScope.post("/v1/discord/webhook", async (request, reply) => {
    const pubKeyHex = process.env.DISCORD_PUBLIC_KEY ?? "";
    if (!pubKeyHex) return reply.code(503).send({ ok: false, error: "DISCORD_NOT_CONFIGURED" });

    const sig = String(request.headers["x-signature-ed25519"] ?? "");
    const ts  = String(request.headers["x-signature-timestamp"] ?? "");
    if (!sig || !ts) return reply.code(401).send({ ok: false, error: "MISSING_SIGNATURE" });

    const rawBody = Buffer.isBuffer(request.body)
      ? (request.body as Buffer)
      : Buffer.from(String(request.body ?? ""));
    const message = Buffer.concat([Buffer.from(ts), rawBody]);

    const { createPublicKey, verify } = await import("node:crypto");
    const pubKey = createPublicKey({
      key: Buffer.concat([
        Buffer.from("302a300506032b6570032100", "hex"),
        Buffer.from(pubKeyHex, "hex"),
      ]),
      format: "der",
      type: "spki",
    });

    let valid = false;
    try {
      valid = verify(null, message, pubKey, Buffer.from(sig, "hex"));
    } catch {
      return reply.code(401).send({ ok: false, error: "SIGNATURE_VERIFICATION_FAILED" });
    }
    if (!valid) return reply.code(401).send({ ok: false, error: "INVALID_SIGNATURE" });

    request.log.info("Discord webhook verified");
    return reply.code(200).send({ ok: true });
  });

  // Discord validator probe
  discordScope.get("/v1/discord/webhook", async (_request, reply) => {
    return reply.code(200).send({ ok: true });
  });
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
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-tenant-id",
    "x-user-id",
    "x-device-id",
    "x-request-id",
    "x-client-source",
    "x-inbound-secret",
  ],
});

await app.register(helmet, {
  contentSecurityPolicy: false, // CSP managed by frontend/CDN
  crossOriginEmbedderPolicy: false,
});

await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

// Gate routes — registered before auth (public validate + admin key-based)
await app.register(gateRoutes, { prefix: "/v1/gate" });

// Plugins (order matters)
await app.register(auditPlugin);
await app.register(authPlugin);
await app.register(tenantPlugin);
await app.register(engineRoutes, { prefix: "/v1/engine" });
await app.register(healthRoutes, { prefix: "/v1" });
// Root-level health check for Render's healthCheckPath: /health
app.get("/health", async () => ({ ok: true, status: "alive" }));
await app.register(agentsRoutes, { prefix: "/v1/agents" });
await app.register(workflowsRoutes, { prefix: "/v1/workflows" });
await app.register(tasksRoutes, { prefix: "/v1/tasks" });
await app.register(commsRoutes, { prefix: "/v1/comms" });
await app.register(emailRoutes, { prefix: "/v1/email" });
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
await app.register(listeningRoutes, { prefix: "/v1/listening" });
await app.register(oauthRoutes, { prefix: "/v1/oauth" });

// M365 tool registry and controlled invocation
await app.register(toolsRoutes, { prefix: "/v1/tools" });

// Atlas → M365 → Binky research flow
await app.register(agentFlowRoutes, { prefix: "/v1/agent-flow" });

// Blog publisher (stores posts in KB)
await app.register(blogRoutes, { prefix: "/v1/blog" });

// Donna's Reddit approval queue
await app.register(redditRoutes, { prefix: "/v1/reddit" });

// Mobile device pairing (QR-based, in-memory store)
await app.register(mobileRoutes, { prefix: "/v1/mobile" });

// Telegram Bot API bridge
await app.register(telegramRoutes, { prefix: "/v1/telegram" });

// Microsoft Teams — channel messaging + cross-agent comms
await app.register(teamsRoutes, { prefix: "/v1/teams" });

// CRM — contacts, companies, segments, activities
await app.register(crmRoutes, { prefix: "/v1/crm" });

// Analytics — aggregated metrics, period comparison, ROI by channel
await app.register(analyticsRoutes, { prefix: "/v1/analytics" });

// Canned responses (messaging templates)
await app.register(cannedResponseRoutes, { prefix: "/v1/canned-responses" });

// Budget tracking
await app.register(budgetRoutes, { prefix: "/v1/budgets" });
await app.register(filesRoutes, { prefix: "/v1/files" });

// Per-user identity, usage metering, seat management
await app.register(userRoutes, { prefix: "/v1/user" });

// Meta (Facebook/Instagram) — data deletion callback (GDPR compliance)
await app.register(metaRoutes, { prefix: "/v1/meta" });

// Google — data deletion callback (OAuth verification compliance)
await app.register(googleRoutes, { prefix: "/v1/google" });

// Runtime status (engine enabled, pending approvals, last tick)
await app.register(runtimeRoutes, { prefix: "/v1/runtime" });

await app.register(atlasRoutes, { prefix: "/v1/atlas" });

// Compliance — GDPR DSAR, consent, breach register, incidents, vendor assessments
await app.register(complianceRoutes, { prefix: "/v1/compliance" });

// YouTube — scraping, search, upload (Venny + Victor workflows)
await app.register(youtubeRoutes, { prefix: "/v1/youtube" });

// Video — composition (FFmpeg), AI generation (ComfyUI/CogVideoX), thumbnails
await app.register(videoRoutes, { prefix: "/v1/video" });

// Outlook — M365 inbox reading via Graph API (app-only credentials)
await app.register(outlookRoutes, { prefix: "/v1/outlook" });

// Calendar — M365 calendar events via Graph API (app-only credentials)
await app.register(calendarRoutes, { prefix: "/v1/calendar" });

// LinkedIn — webhook + API
await app.register(linkedinRoutes, { prefix: "/v1/linkedin" });

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
