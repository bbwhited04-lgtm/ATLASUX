/**
 * tiktokRoutes.ts — TikTok Webhook + Content Posting API
 *
 * GET  /v1/tiktok/webhook        — verification ping
 * POST /v1/tiktok/webhook        — receive event notifications
 * POST /v1/tiktok/publish        — publish video directly to user's profile
 * POST /v1/tiktok/upload-draft   — upload video as draft to inbox
 * GET  /v1/tiktok/publish-status — check publish status
 * GET  /v1/tiktok/user-info      — fetch connected user's profile
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { publishVideo, uploadVideoDraft, checkPublishStatus, getUserInfo } from "../services/tiktok.js";
import { getProviderToken } from "../lib/tokenStore.js";
import { loadEnv } from "../env.js";

function resolveTenant(req: any): string {
  return String(
    (req.headers as any)?.["x-tenant-id"] ??
    (req.query as any)?.tenantId ??
    "",
  );
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
    const body = req.body as any;
    const event = body?.event ?? body?.type ?? "unknown";

    app.log.info({ event }, "TikTok webhook event received");

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
  app.post("/publish", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return { ok: false, error: "TIKTOK_NOT_CONNECTED" };

    const body = req.body as any;
    const videoUrl = String(body?.videoUrl ?? "");
    if (!videoUrl) return { ok: false, error: "videoUrl is required" };

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
  app.post("/upload-draft", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return { ok: false, error: "TIKTOK_NOT_CONNECTED" };

    const body = req.body as any;
    const videoUrl = String(body?.videoUrl ?? "");
    if (!videoUrl) return { ok: false, error: "videoUrl is required" };

    return uploadVideoDraft(token, videoUrl);
  });

  // ── GET /publish-status — Check publish status ──────────────────────────
  app.get("/publish-status", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return { ok: false, error: "TIKTOK_NOT_CONNECTED" };

    const q = req.query as any;
    const publishId = String(q?.publishId ?? "");
    if (!publishId) return { ok: false, error: "publishId is required" };

    return checkPublishStatus(token, publishId);
  });

  // ── GET /user-info — Fetch connected user's TikTok profile ──────────────
  app.get("/user-info", async (req) => {
    const tenantId = resolveTenant(req);
    if (!tenantId) return { ok: false, error: "TENANT_REQUIRED" };

    const env = loadEnv(process.env);
    const token = await getProviderToken(env, tenantId, "tiktok");
    if (!token) return { ok: false, error: "TIKTOK_NOT_CONNECTED" };

    return getUserInfo(token);
  });
};
