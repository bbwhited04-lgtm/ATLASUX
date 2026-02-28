/**
 * Video routes — Victor's video production endpoints.
 *
 * POST /v1/video/compose  — compose a Short from images/clips/text/audio (async job)
 * GET  /v1/video/status/:jobId — check composition/generation job status
 * POST /v1/video/generate — AI video generation via ComfyUI + CogVideoX-5B
 * GET  /v1/video/capabilities — check available video engines
 * POST /v1/video/thumbnail — extract thumbnail frame from a video
 */

import { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import * as comfyui from "../services/comfyui.js";
import { textToVideo, imageToVideo, videoToVideo } from "../services/cogvideo.js";
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

    return reply.send({
      ok: true,
      engines: {
        ffmpeg: { available: ffmpeg, description: "FFmpeg video composition (compose, resize, overlay, concat)" },
        comfyui: { available: comfyAvailable, description: "ComfyUI + CogVideoX-5B AI video generation (desktop only)" },
        flux1: { available: flux1, description: "Flux1 AI image generation (cloud API)" },
      },
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

  // ── AI Video Generation ─────────────────────────────────────────────────────

  app.post("/generate", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.code(401).send({ ok: false, error: "unauthorized" });

    const body = req.body as any;
    const mode = String(body?.mode ?? "text-to-video"); // text-to-video | image-to-video | video-to-video
    const prompt = String(body?.prompt ?? "");
    if (!prompt) return reply.code(400).send({ ok: false, error: "prompt required" });

    // Check ComfyUI availability
    const comfyAvailable = await comfyui.isAvailable();
    if (!comfyAvailable) {
      return reply.code(503).send({
        ok: false,
        error: "ComfyUI not available. AI video generation requires a local ComfyUI instance (desktop only).",
      });
    }

    // Build the appropriate workflow
    let workflow: Record<string, any>;
    const opts = {
      prompt,
      negativePrompt: body?.negativePrompt,
      durationSec: body?.durationSec,
      width: body?.width,
      height: body?.height,
      steps: body?.steps,
      cfgScale: body?.cfgScale,
      seed: body?.seed,
    };

    switch (mode) {
      case "image-to-video":
        if (!body?.imagePath) return reply.code(400).send({ ok: false, error: "imagePath required for image-to-video" });
        workflow = imageToVideo({ ...opts, imagePath: body.imagePath, strength: body?.strength });
        break;
      case "video-to-video":
        if (!body?.inputVideoPath) return reply.code(400).send({ ok: false, error: "inputVideoPath required for video-to-video" });
        workflow = videoToVideo({ ...opts, inputVideoPath: body.inputVideoPath, denoise: body?.denoise });
        break;
      case "text-to-video":
      default:
        workflow = textToVideo(opts);
        break;
    }

    // Submit to ComfyUI
    const result = await comfyui.queuePrompt(workflow);
    if (!result.ok) {
      return reply.code(500).send({ ok: false, error: result.error });
    }

    // Track as a job
    const job = await prisma.job.create({
      data: {
        tenantId,
        jobType: "VIDEO_GENERATE",
        status: "queued",
        priority: 5,
        input: { mode, promptId: result.promptId, ...opts },
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
        message: `Victor queued AI video generation: ${mode} — "${prompt.slice(0, 100)}"`,
        meta: { jobId: job.id, promptId: result.promptId, mode },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return reply.send({ ok: true, jobId: job.id, promptId: result.promptId, status: "queued" });
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
