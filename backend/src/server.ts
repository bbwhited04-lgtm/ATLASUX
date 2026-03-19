import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import "dotenv/config";
import { writeFileSync, existsSync } from "fs";
import { prisma, connectWithRetry } from "./db/prisma.js";

// Bootstrap Google credentials from base64 env var (for cloud deploys)
if (process.env.GOOGLE_CREDENTIALS_BASE64 && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credPath = "/tmp/gcloud-credentials.json";
  if (!existsSync(credPath)) {
    writeFileSync(credPath, Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, "base64"));
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

// Plugins
import auditPlugin from "./plugins/auditPlugin.js";
import { authPlugin } from "./plugins/authPlugin.js";
import { tenantPlugin } from "./plugins/tenantPlugin.js";
import csrfPlugin from "./plugins/csrfPlugin.js";
import tenantRateLimitPlugin from "./plugins/tenantRateLimit.js";
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
import { postizRoutes } from "./routes/postizRoutes.js";
import { cannedResponseRoutes } from "./routes/cannedResponseRoutes.js";
import { budgetRoutes } from "./routes/budgetRoutes.js";
import { filesRoutes } from "./routes/filesRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { metaRoutes } from "./routes/metaRoutes.js";
import { googleRoutes } from "./routes/googleRoutes.js";
import { runtimeRoutes } from "./routes/runtimeRoutes.js";
import { atlasRoutes } from "./routes/atlasRoutes.js";
import { complianceRoutes } from "./routes/complianceRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { gateRoutes } from "./routes/gateRoutes.js";
import { leadsRoutes } from "./routes/leadsRoutes.js";
import { youtubeRoutes } from "./routes/youtubeRoutes.js";
import { videoRoutes } from "./routes/videoRoutes.js";
import { outlookRoutes } from "./routes/outlookRoutes.js";
import { calendarRoutes } from "./routes/calendarRoutes.js";
import { meetingRoutes } from "./routes/meetingRoutes.js";
import { linkedinRoutes } from "./routes/linkedinRoutes.js";
import { alignableRoutes } from "./routes/alignableRoutes.js";
import { xRoutes } from "./routes/xRoutes.js";
import { tiktokRoutes } from "./routes/tiktokRoutes.js";
import { tumblrRoutes } from "./routes/tumblrRoutes.js";
import { pinterestRoutes } from "./routes/pinterestRoutes.js";
import { browserRoutes } from "./routes/browserRoutes.js";
import { localAgentRoutes } from "./routes/localAgentRoutes.js";
import { zoomRoutes } from "./routes/zoomRoutes.js";
import { twilioRoutes } from "./routes/twilioRoutes.js";
import { orgMemoryRoutes } from "./routes/orgMemoryRoutes.js";
import { calibrationRoutes } from "./routes/calibrationRoutes.js";
import { diagnosticsRoutes } from "./routes/diagnosticsRoutes.js";
import { quickbooksRoutes } from "./routes/quickbooksRoutes.js";
import { credentialRoutes } from "./routes/credentialRoutes.js";
import { evolutionRoutes } from "./routes/evolutionRoutes.js";
import { treatmentRoutes } from "./routes/treatmentRoutes.js";
import elevenlabsRoutes from "./routes/elevenlabsRoutes.js";
import supportKbRoutes from "./routes/supportKbRoutes.js";
import wikiRoutes from "./routes/wikiRoutes.js";
import wikiKeyRoutes from "./routes/wikiKeyRoutes.js";
import wikiMcpRoutes from "./routes/wikiMcpRoutes.js";
import mendRoutes from "./routes/mendRoutes.js";

// Wait for DB before starting Fastify (retries on transient pooler blips)
await connectWithRetry(5, 3000);

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-csrf-token",
      "req.headers.x-gate-admin-key",
      "req.headers.x-inbound-secret",
      "req.headers.x-webhook-secret",
      "req.headers.x-elevenlabs-secret",
    ],
  },
  pluginTimeout: 30_000, // 30s — survive slow DB reconnects
});
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
  "https://wiki.atlasux.cloud",
]);
if (process.env.NODE_ENV !== "production") {
  allowed.add("http://localhost:5173");
  allowed.add("http://localhost:3000");
}

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    cb(null, allowed.has(origin));
  },
  credentials: true,
  exposedHeaders: ["x-csrf-token"],
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
    "x-csrf-token",
  ],
});

await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://widget.trustpilot.com", "https://connect.facebook.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://atlasux.cloud", "https://www.facebook.com", "https://atlasux-files.s3.amazonaws.com"],
      fontSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.atlasux.cloud",
        "https://www.facebook.com",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  // HSTS: 1 year max-age, include subdomains (PCI 4.1, NIST SC-8, SOC 2 CC6.7)
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  // Strict referrer policy (GDPR Art. 32)
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});

await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });
await app.register(websocket);

// Gate routes — registered before auth (public validate + admin key-based)
await app.register(gateRoutes, { prefix: "/v1/gate" });

// Lead capture — public (no auth required)
await app.register(leadsRoutes, { prefix: "/v1/leads" });

// Public auth endpoints (login/register) — before authPlugin
await app.register(async (publicAuth) => {
  const { prisma } = await import("./db/prisma.js");
  const jose = await import("jose");
  const { hash: bcryptHash, compare: bcryptCompare } = await import("bcrypt");
  const { randomUUID } = await import("node:crypto");

  async function signJwt(userId: string, email: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    return new jose.SignJWT({ sub: userId, email })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer("atlasux")
      .setAudience("atlasux-api")
      .setExpirationTime("7d")
      .sign(secret);
  }

  publicAuth.post("/register", async (req, reply) => {
    const { email, password } = (req.body as any) ?? {};
    if (!email || !password) return reply.code(400).send({ ok: false, error: "email_and_password_required" });
    if (password.length < 8) return reply.code(400).send({ ok: false, error: "password_too_short" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return reply.code(409).send({ ok: false, error: "email_already_registered" });

    const id = randomUUID();
    const passwordHash = await bcryptHash(password, 12);
    await prisma.user.create({ data: { id, email, passwordHash, displayName: email.split("@")[0] } });
    const token = await signJwt(id, email);
    return reply.send({ ok: true, token, userId: id });
  });

  publicAuth.post("/login", async (req, reply) => {
    const { email, password } = (req.body as any) ?? {};
    if (!email || !password) return reply.code(400).send({ ok: false, error: "email_and_password_required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return reply.code(401).send({ ok: false, error: "invalid_credentials" });

    const valid = await bcryptCompare(password, user.passwordHash);
    if (!valid) return reply.code(401).send({ ok: false, error: "invalid_credentials" });

    const token = await signJwt(user.id, user.email);
    return reply.send({ ok: true, token, userId: user.id });
  });
}, { prefix: "/v1/auth" });

// Plugins (order matters)
await app.register(auditPlugin);
await app.register(authPlugin);
await app.register(csrfPlugin);
await app.register(tenantPlugin);
await app.register(tenantRateLimitPlugin);

// Auth routes — provision + logout (needs authPlugin for JWT verification)
await app.register(authRoutes, { prefix: "/v1/auth" });
await app.register(engineRoutes, { prefix: "/v1/engine" });
await app.register(healthRoutes, { prefix: "/v1" });
// Root-level health check
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

// Postiz — social media analytics proxy (channels, per-channel + aggregate)
await app.register(postizRoutes, { prefix: "/v1/postiz" });

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

// Meetings — meeting notes, transcript fetch, AI summarization
await app.register(meetingRoutes, { prefix: "/v1/meetings" });

// LinkedIn — webhook + API
await app.register(linkedinRoutes, { prefix: "/v1/linkedin" });

// Alignable — inbound webhook for Zapier/Make triggers
await app.register(alignableRoutes, { prefix: "/v1/alignable" });

// X (Twitter) — Account Activity API webhook
await app.register(xRoutes, { prefix: "/v1/x" });

// TikTok — webhook for video/engagement events
await app.register(tiktokRoutes, { prefix: "/v1/tiktok" });

// Tumblr — inbound webhook for Zapier/Make triggers
await app.register(tumblrRoutes, { prefix: "/v1/tumblr" });

// Pinterest — inbound webhook for Zapier/Make triggers
await app.register(pinterestRoutes, { prefix: "/v1/pinterest" });

// Zoom — webhook for meeting/webinar events
await app.register(zoomRoutes, { prefix: "/v1/zoom" });

// Browser automation — governed headless Chromium (SGL + decision memos)
await app.register(browserRoutes, { prefix: "/v1/browser" });

// Local vision agent — polls for LOCAL_VISION_TASK jobs, executes via CDP
await app.register(localAgentRoutes, { prefix: "/v1/local-agent" });

// Twilio — voice + SMS webhooks and outbound call API
await app.register(twilioRoutes, { prefix: "/v1/twilio" });

// ElevenLabs — conversational AI voice agents, webhooks, phone management
await app.register(elevenlabsRoutes, { prefix: "/v1/elevenlabs" });

// Support KB — public help center articles (no auth required)
await app.register(supportKbRoutes, { prefix: "/v1/support" });

// Wiki — public knowledge base at wiki.atlasux.cloud (no auth required)
await app.register(wikiRoutes, { prefix: "/v1/wiki" });
await app.register(mendRoutes, { prefix: "/v1/mend" });

// Wiki API Keys — self-service key management (no auth, keys are self-contained)
await app.register(wikiKeyRoutes, { prefix: "/v1/wiki-keys" });

// Wiki MCP Server — Model Context Protocol for agent access (requires wiki API key)
await app.register(wikiMcpRoutes, { prefix: "/v1/wiki-mcp" });

// Org Memory — the Organizational Brain persistent memory layer
await app.register(orgMemoryRoutes, { prefix: "/v1/org-memory" });

// Agent Calibration — confidence adjustment from outcome data
await app.register(calibrationRoutes, { prefix: "/v1/calibration" });
await app.register(diagnosticsRoutes, { prefix: "/v1/diagnostics" });

// QuickBooks — OAuth2 connection, webhook, status
await app.register(quickbooksRoutes, { prefix: "/v1/quickbooks" });

// Per-tenant credential management (API keys for third-party providers)
await app.register(credentialRoutes, { prefix: "/v1/credentials" });

// Agent evolution system — behavior changes, trials, history
await app.register(evolutionRoutes, { prefix: "/v1/evolution" });
await app.register(treatmentRoutes, { prefix: "/v1" });

const port = Number(process.env.PORT ?? 8787);
const host = "0.0.0.0";
// backend/src/server.ts
import { engineTick } from "./core/engine/engine.js";

const engineEnabled = (process.env.ENGINE_ENABLED ?? "false").toLowerCase() === "true";
const tickMs = Number(process.env.ENGINE_TICK_INTERVAL_MS ?? process.env.EMAIL_WORKER_INTERVAL_MS ?? 5000);

if (engineEnabled) {
  app.log.warn(
    `Engine enabled in-process (ENGINE_ENABLED=true). ` +
    `Do NOT also run "npm run worker:engine" — use one or the other to avoid duplicate ticks.`
  );
  app.log.info(`Engine ticking every ${tickMs}ms`);
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

// Prune expired revoked tokens daily (HIPAA §164.312(d))
setInterval(async () => {
  try {
    await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch { /* table may not exist yet */ }
}, 24 * 60 * 60 * 1000);

app.listen({ port, host }).then(() => {
  app.log.info(`AtlasUX backend listening on :${port}`);
});
