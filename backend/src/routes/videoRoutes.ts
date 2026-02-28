/**
 * Video routes — Victor's video production endpoints.
 *
 * POST /v1/video/compose  — compose a Short from images/clips/text/audio (async job)
 * GET  /v1/video/status/:jobId — check composition/generation job status
 * POST /v1/video/generate — AI video generation via ComfyUI (auto-selects CogVideoX or HunyuanVideo)
 * GET  /v1/video/capabilities — check available video engines + installed models
 * GET  /v1/video/models — list installed AI video models with specs
 * POST /v1/video/thumbnail — extract thumbnail frame from a video
 */

import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import * as comfyui from "../services/comfyui.js";
import { generateVideo, detectInstalledModels, type VideoModel } from "../services/videoModelRouter.js";
import { isFfmpegAvailable } from "../services/videoComposer.js";
import { isAvailable as isFlux1Available } from "../services/flux1.js";

export const videoRoutes: FastifyPluginAsync = async (app) => {

  // ── Capabilities check ──────────────────────────────────────────────────────

  app.get("/capabilities", async (req, reply) => {
    const [ffmpeg, comfyAvailable, flux1] = await Promise.all([
      isFfmpegAvailable(),
      comfyui.isAvailable(),
      isFlux1Available(),
    ]);

    let installedModels = { cogvideox: false, hunyuan: false };
    if (comfyAvailable) {
      installedModels = await detectInstalledModels();
    }

    return reply.send({
      ok: true,
      engines: {
        ffmpeg: { available: ffmpeg, description: "FFmpeg video composition (compose, resize, overlay, concat)" },
        comfyui: {
          available: comfyAvailable,
          description: "ComfyUI AI video generation (desktop only)",
          models: installedModels,
        },
        flux1: { available: flux1, description: "Flux1 AI image generation (cloud API)" },
      },
    });
  });

  // ── Installed models ────────────────────────────────────────────────────────

  app.get("/models", async (req, reply) => {
    const comfyAvailable = await comfyui.isAvailable();
    if (!comfyAvailable) {
      return reply.send({
        ok: true,
        comfyui: false,
        models: [],
        note: "ComfyUI offline — AI video models unavailable (desktop only)",
      });
    }

    const installed = await detectInstalledModels();
    const models = [];

    if (installed.cogvideox) {
      models.push({
        id: "cogvideox",
        name: "CogVideoX-5B",
        params: "5B",
        vram: "12GB",
        fps: 8,
        strengths: "Fast generation, low VRAM, good for short clips and quick drafts",
        bestFor: ["text-to-video short clips", "rapid iteration", "consumer GPUs"],
      });
    }

    if (installed.hunyuan) {
      models.push({
        id: "hunyuan",
        name: "HunyuanVideo 13B",
        params: "13B",
        vram: "24GB (FP8)",
        fps: 24,
        strengths: "Superior motion, temporal coherence, dual text encoder, xDiT parallelism",
        bestFor: ["image-to-video", "video-to-video", "longer clips", "high quality output"],
      });
    }

    return reply.send({
      ok: true,
      comfyui: true,
      models,
      autoSelectNote: "Use model='auto' in /generate to let Victor pick the best model for the task",
    });
  });

  // ── Compose Short (async job) ───────────────────────────────────────────────

  app.post("/compose", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const body = req.body as any;
    const images = Array.isArray(body?.images) ? body.images : [];
    const clips = Array.isArray(body?.clips) ? body.clips : [];
    const textOverlays = Array.isArray(body?.textOverlays) ? body.textOverlays : [];
    const audioPath = body?.audioPath ?? null;
    const imageDurationSec = Number(body?.imageDurationSec ?? 3);
    const outputPath = body?.outputPath ?? null;

    if (images.length === 0 && clips.length === 0) {
      return reply.code(400).send({ ok: false, error: "Provide at least one image or clip" });
    }

    // Queue as async job
    const job = await prisma.job.create({
      data: {
        tenantId,
        jobType: "VIDEO_COMPOSE",
        status: "queued",
        priority: 5,
        input: { images, clips, textOverlays, audioPath, imageDurationSec, outputPath },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "agent",
        actorUserId: null,
        actorExternalId: "victor",
        level: "info",
        action: "VIDEO_COMPOSE_QUEUED",
        entityType: "job",
        entityId: job.id,
        message: `Victor queued video composition: ${images.length} images, ${clips.length} clips`,
        meta: { jobId: job.id, images: images.length, clips: clips.length, overlays: textOverlays.length },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return reply.send({ ok: true, jobId: job.id, status: "queued" });
  });

  // ── AI Video Generation (auto-selects model) ───────────────────────────────

  app.post("/generate", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const body = req.body as any;
    const mode = String(body?.mode ?? "text-to-video") as "text-to-video" | "image-to-video" | "video-to-video";
    const prompt = String(body?.prompt ?? "");
    const model = (body?.model ?? "auto") as VideoModel;

    if (!prompt) return reply.code(400).send({ ok: false, error: "prompt required" });

    if (mode === "image-to-video" && !body?.imagePath) {
      return reply.code(400).send({ ok: false, error: "imagePath required for image-to-video" });
    }
    if (mode === "video-to-video" && !body?.inputVideoPath) {
      return reply.code(400).send({ ok: false, error: "inputVideoPath required for video-to-video" });
    }

    // Route through model router (auto-selects CogVideoX vs HunyuanVideo)
    const result = await generateVideo({
      mode,
      model,
      prompt,
      negativePrompt: body?.negativePrompt,
      durationSec: body?.durationSec,
      width: body?.width,
      height: body?.height,
      steps: body?.steps,
      cfgScale: body?.cfgScale,
      seed: body?.seed,
      imagePath: body?.imagePath,
      strength: body?.strength,
      inputVideoPath: body?.inputVideoPath,
      denoise: body?.denoise,
    });

    if (!result.ok) {
      const code = result.error?.includes("offline") ? 503 : 500;
      return reply.code(code).send({ ok: false, error: result.error });
    }

    // Track as a job
    const job = await prisma.job.create({
      data: {
        tenantId,
        jobType: "VIDEO_GENERATE",
        status: "queued",
        priority: 5,
        input: {
          mode,
          prompt,
          model: result.model,
          modelReason: result.reason,
          promptId: result.promptId,
          negativePrompt: body?.negativePrompt,
          durationSec: body?.durationSec,
          width: body?.width,
          height: body?.height,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "agent",
        actorUserId: null,
        actorExternalId: "victor",
        level: "info",
        action: "VIDEO_GENERATE_QUEUED",
        entityType: "job",
        entityId: job.id,
        message: `Victor queued AI video (${result.model}): ${mode} — "${prompt.slice(0, 80)}"`,
        meta: { jobId: job.id, promptId: result.promptId, mode, model: result.model, reason: result.reason },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return reply.send({
      ok: true,
      jobId: job.id,
      promptId: result.promptId,
      model: result.model,
      modelReason: result.reason,
      status: "queued",
    });
  });

  // ── Job status check ────────────────────────────────────────────────────────

  app.get("/status/:jobId", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const { jobId } = req.params as { jobId: string };
    const job = await prisma.job.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) return reply.code(404).send({ ok: false, error: "Job not found" });

    const input = job.input as any;
    const output = job.output as any;

    // If it's a ComfyUI job, also check ComfyUI status
    let comfyStatus = null;
    if (job.jobType === "VIDEO_GENERATE" && input?.promptId) {
      comfyStatus = await comfyui.getStatus(input.promptId).catch(() => null);
    }

    return reply.send({
      ok: true,
      jobId: job.id,
      jobType: job.jobType,
      status: job.status,
      model: input?.model ?? null,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      output: output ?? null,
      error: (job.error as any)?.message ?? null,
      comfyStatus,
    });
  });

  // ── Thumbnail extraction ────────────────────────────────────────────────────

  app.post("/thumbnail", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const body = req.body as any;
    const videoPath = String(body?.videoPath ?? "");
    const timestampSec = Number(body?.timestampSec ?? 1);

    if (!videoPath) return reply.code(400).send({ ok: false, error: "videoPath required" });

    const { generateThumbnail } = await import("../services/videoComposer.js");
    const result = await generateThumbnail(videoPath, timestampSec);

    if (!result.ok) return reply.code(500).send({ ok: false, error: result.error });
    return reply.send({ ok: true, thumbnailPath: result.outputPath });
  });
};
