/**
 * tiktokRoutes.ts — TikTok Webhook + Content Posting API
 *
 * GET  /v1/tiktok/webhook        — verification ping
 * POST /v1/tiktok/webhook        — receive event notifications
 * POST /v1/tiktok/publish        — publish video directly to user's profile
 * POST /v1/tiktok/upload-draft   — upload video as draft to inbox
 * GET  /v1/tiktok/publish-status — check publish status
 * GET  /v1/tiktok/user-info      — fetch connected user's profile
 *
 * Security:
 *   - POST /webhook: Verifies X-Tiktok-Signature header (HMAC-SHA256 of raw body
 *     using TIKTOK_CLIENT_SECRET). Rejects if secret is missing or signature is invalid.
 *   - Authenticated routes (publish, upload-draft, publish-status, user-info):
 *     Validates that the requesting user is a member of the specified tenant.
 */

import type { FastifyPluginAsync } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/prisma.js";
import { publishVideo, uploadVideoDraft, checkPublishStatus, getUserInfo } from "../services/tiktok.js";
import { getProviderToken } from "../lib/tokenStore.js";
import { loadEnv } from "../env.js";

const tiktokClientSecret = process.env.TIKTOK_CLIENT_SECRET ?? "";

function resolveTenant(req: any): string {
  return String(
    (req.headers as any)?.["x-tenant-id"] ??
    (req.query as any)?.tenantId ??
    "",
  );
}

/**
 * Verify the TikTok webhook signature header.
 * TikTok signs webhooks with HMAC-SHA256 of the raw body using the client secret.
 */
function verifyTikTokSignature(
  signatureHeader: string | undefined,
  rawBody: string | Buffer | object,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  const bodyStr =
    typeof rawBody === "string"
      ? rawBody
      : Buffer.isBuffer(rawBody)
        ? rawBody.toString("utf8")
        : JSON.stringify(rawBody);

  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(bodyStr)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expectedHmac),
    );
  } catch {
    // Length mismatch — signatures don't match
    return false;
  }
}

/**
 * Validate that the authenticated user is a member of the specified tenant.
 * Returns the userId if valid, or null if membership cannot be confirmed.
 */
async function validateTenantMembership(
  req: any,
  tenantId: string,
): Promise<{ valid: boolean; userId: string | null; reason?: string }> {
  const userId: string | undefined = req.auth?.userId;
  if (!userId) {
    return { valid: false, userId: null, reason: "Authentication required" };
  }

  try {
    const member = await prisma.tenantMember.findFirst({
      where: { tenantId, userId },
      select: { userId: true },
    });

    if (!member) {
      return { valid: false, userId, reason: "Not a member of this tenant" };
    }

    return { valid: true, userId };
  } catch {
    return { valid: false, userId, reason: "Could not verify tenant membership" };
  }
}

export const tiktokRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /webhook — TikTok verification ──────────────────────────────────
  // TikTok sends a verification challenge on webhook registration
  app.get("/webhook", async (req, reply) => {
    const q = req.query as Record<string, string>;
    // TikTok uses challenge param for verification
    if (q.challenge) {
      app.log.info("TikTok webhook verification challenge received");
      return reply.send({ challenge: q.challenge });
    }
    return reply.send({ ok: true, service: "tiktok-webhook" });
  });

  // ── POST /webhook — TikTok event notifications ─────────────────────────
  app.post("/webhook", async (req, reply) => {
    // ── Signature verification ──────────────────────────────────────────
    if (!tiktokClientSecret) {
      app.log.warn(
        "TIKTOK_CLIENT_SECRET not set — rejecting webhook (signature cannot be verified)",
      );
      return reply.status(401).send({ error: "Webhook signature verification not configured" });
    }

    const sigHeader = (req.headers as Record<string, string | undefined>)[
      "x-tiktok-signature"
    ];

    if (!sigHeader) {
      app.log.warn("TikTok webhook received without X-Tiktok-Signature header");
      return reply.status(401).send({ error: "Missing webhook signature" });
    }

    if (!verifyTikTokSignature(sigHeader, req.body as any, tiktokClientSecret)) {
      app.log.warn("TikTok webhook signature verification failed");
      return reply.status(401).send({ error: "Invalid webhook signature" });
    }

    // ── Process verified event ──────────────────────────────────────────
    const body = req.body as any;
    const event = body?.event ?? body?.type ?? "unknown";

    app.log.info({ event }, "TikTok webhook event received (signature verified)");

    try {
      await prisma.auditLog.create({
        data: {
          tenantId: null,
          actorExternalId: "tiktok-webhook",
          actorType: "system",
          action: `tiktok.${event}`,
          entityType: "tiktok_event",
          message: `TikTok ${event} event received`,
          meta: body ?? {},
        },
      });
    } catch (err) {
      app.log.error({ err }, "Failed to log TikTok webhook event");
    }

    return reply.status(200).send({ ok: true });
  });

  // ── POST /publish — Direct Post video to user's profile ─────────────────
  app.post("/publish", async (req, reply) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return reply.status(400).send({ ok: false, error: "TENANT_REQUIRED" });

    // Validate tenant membership
    const membership = await validateTenantMembership(req, tenantId);
    if (!membership.valid) {
      app.log.warn(
        { tenantId, userId: membership.userId, reason: membership.reason },
        "TikTok publish: tenant membership validation failed",
      );
      return reply.status(403).send({ ok: false, error: membership.reason });
    }

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return reply.status(400).send({ ok: false, error: "TIKTOK_NOT_CONNECTED" });

    const body = req.body as any;
    const videoUrl = String(body?.videoUrl ?? "");
    if (!videoUrl) return reply.status(400).send({ ok: false, error: "videoUrl is required" });

    const result = await publishVideo(token, videoUrl, {
      title: body?.title,
      privacyLevel: body?.privacyLevel,
      disableComment: body?.disableComment,
      disableDuet: body?.disableDuet,
      disableStitch: body?.disableStitch,
    });

    if (result.ok) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorExternalId: "tiktok-api",
          actorType: "system",
          action: "tiktok.publish",
          entityType: "tiktok_video",
          message: `Video published to TikTok (${result.publishId})`,
          meta: { publishId: result.publishId, videoUrl, title: body?.title },
        },
      }).catch(() => null);
    }

    return result;
  });

  // ── POST /upload-draft — Upload video as draft to inbox ─────────────────
  app.post("/upload-draft", async (req, reply) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return reply.status(400).send({ ok: false, error: "TENANT_REQUIRED" });

    // Validate tenant membership
    const membership = await validateTenantMembership(req, tenantId);
    if (!membership.valid) {
      app.log.warn(
        { tenantId, userId: membership.userId, reason: membership.reason },
        "TikTok upload-draft: tenant membership validation failed",
      );
      return reply.status(403).send({ ok: false, error: membership.reason });
    }

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return reply.status(400).send({ ok: false, error: "TIKTOK_NOT_CONNECTED" });

    const body = req.body as any;
    const videoUrl = String(body?.videoUrl ?? "");
    if (!videoUrl) return reply.status(400).send({ ok: false, error: "videoUrl is required" });

    return uploadVideoDraft(token, videoUrl);
  });

  // ── GET /publish-status — Check publish status ──────────────────────────
  app.get("/publish-status", async (req, reply) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return reply.status(400).send({ ok: false, error: "TENANT_REQUIRED" });

    // Validate tenant membership
    const membership = await validateTenantMembership(req, tenantId);
    if (!membership.valid) {
      app.log.warn(
        { tenantId, userId: membership.userId, reason: membership.reason },
        "TikTok publish-status: tenant membership validation failed",
      );
      return reply.status(403).send({ ok: false, error: membership.reason });
    }

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return reply.status(400).send({ ok: false, error: "TIKTOK_NOT_CONNECTED" });

    const q = req.query as any;
    const publishId = String(q?.publishId ?? "");
    if (!publishId) return reply.status(400).send({ ok: false, error: "publishId is required" });

    return checkPublishStatus(token, publishId);
  });

  // ── GET /user-info — Fetch connected user's TikTok profile ──────────────
  app.get("/user-info", async (req, reply) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return reply.status(400).send({ ok: false, error: "TENANT_REQUIRED" });

    // Validate tenant membership
    const membership = await validateTenantMembership(req, tenantId);
    if (!membership.valid) {
      app.log.warn(
        { tenantId, userId: membership.userId, reason: membership.reason },
        "TikTok user-info: tenant membership validation failed",
      );
      return reply.status(403).send({ ok: false, error: membership.reason });
    }

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return reply.status(400).send({ ok: false, error: "TIKTOK_NOT_CONNECTED" });

    return getUserInfo(token);
  });
};
