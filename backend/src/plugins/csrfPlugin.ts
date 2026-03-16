/**
 * CSRF Protection — DB-backed synchronizer token pattern.
 *
 * Works cross-origin (frontend → backend) without cookies.
 * Uses the oauth_state table for token storage with 1-hour TTL.
 *
 * Flow:
 *   1. Any authenticated response includes x-csrf-token header
 *   2. Frontend reads it and sends on all state-changing requests
 *   3. Backend validates token exists in DB before processing mutations
 *
 * Controls: PCI DSS 6.5.9, NIST SC-23, HITRUST 09.m, SOC 2 CC6.6, ISO A.14.1.2
 */
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "crypto";
import { setOAuthState, getOAuthState } from "../lib/oauthState.js";

const CSRF_HEADER = "x-csrf-token";
const CSRF_TTL_MS = 60 * 60 * 1000; // 1 hour

const SKIP_PREFIXES = [
  "/v1/billing/stripe/webhook",
  "/v1/stripe/webhook",
  "/v1/stripe/subscription-webhook",
  "/v1/oauth/",
  "/v1/discord/webhook",
  "/v1/meta/deletion",
  "/v1/google/deletion",
  "/v1/x/webhook",
  "/v1/tiktok/webhook",
  "/v1/telegram/webhook",
  "/v1/twilio/sms/inbound",
  "/v1/twilio/voice/inbound",
  "/v1/twilio/voice/status",
  "/v1/twilio/voice/recording",
  "/v1/twilio/voice/stream",
  "/v1/twilio/voice/mercer-stream",
  "/v1/linkedin/webhook",
  "/v1/alignable/webhook",
  "/v1/tumblr/webhook",
  "/v1/pinterest/webhook",
  "/v1/teams/webhook",
  "/v1/zoom/webhook",
  "/v1/elevenlabs/tool/",
  "/v1/elevenlabs/webhook/",
  "/v1/gate/validate",
  "/v1/health",
  "/v1/auth/provision",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const csrfPlugin: FastifyPluginAsync = async (app) => {
  // Issue a new CSRF token on mutating authenticated responses only
  // (avoids DB write amplification from GET polling — Gemini audit finding)
  app.addHook("onSend", async (req, reply, payload) => {
    const userId = (req as any).auth?.userId;
    if (!userId) return payload;

    // Only issue new tokens on mutating methods or when none was sent
    const hadToken = !!req.headers[CSRF_HEADER];
    const isMutation = MUTATING_METHODS.has(req.method.toUpperCase());
    if (hadToken && !isMutation) return payload;

    // Generate token and store in DB
    const token = randomBytes(32).toString("hex");
    const key = `csrf:${userId}:${token}`;
    await setOAuthState(key, { userId }, CSRF_TTL_MS).catch(() => null);

    reply.header(CSRF_HEADER, token);
    return payload;
  });

  // Validate CSRF token on mutating requests
  app.addHook("preHandler", async (req, reply) => {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) return;

    // Skip exempt routes (webhooks, OAuth callbacks, public endpoints)
    for (const prefix of SKIP_PREFIXES) {
      if (req.url.startsWith(prefix)) return;
    }

    // Skip if no auth context (unauthenticated routes handle their own security)
    const userId = (req as any).auth?.userId;
    if (!userId) return;

    const token = req.headers[CSRF_HEADER] as string | undefined;
    if (!token) {
      return reply.code(403).send({ ok: false, error: "csrf_token_missing" });
    }

    const key = `csrf:${userId}:${token}`;
    const data = await getOAuthState(key);
    if (!data || data.userId !== userId) {
      return reply.code(403).send({ ok: false, error: "csrf_token_invalid" });
    }

    // Token is valid — don't delete it (allow reuse within TTL window)
  });
};

export default fp(csrfPlugin);
