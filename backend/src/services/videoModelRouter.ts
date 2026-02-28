/**
 * Video Model Router — Victor's intelligent model selection.
 *
 * Auto-selects the best AI video model based on task requirements,
 * available hardware, and installed models. Supports manual override.
 *
 * Models:
 *   cogvideox  — CogVideoX-5B (lightweight, fast, 12GB VRAM, 8fps)
 *   hunyuan    — HunyuanVideo 13B (heavy, quality, 24GB VRAM, 24fps, FP8)
 *
 * Auto-selection logic:
 *   1. If only one model is installed → use that
 *   2. Quality priority (long clips, high res, I2V with complex motion) → HunyuanVideo
 *   3. Speed priority (short clips, quick drafts, iteration) → CogVideoX
 *   4. Default → CogVideoX (lighter, more accessible)
 */

import * as comfyui from "./comfyui.js";
import * as cogvideo from "./cogvideo.js";
import * as hunyuan from "./hunyuanvideo.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type VideoModel = "cogvideox" | "hunyuan" | "auto";

export type ModelSelection = {
  model: "cogvideox" | "hunyuan";
  reason: string;
};

export type GenerateVideoOpts = {
  mode: "text-to-video" | "image-to-video" | "video-to-video";
  model?: VideoModel;
  prompt: string;
  negativePrompt?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  steps?: number;
  cfgScale?: number;
  seed?: number;
  // image-to-video
  imagePath?: string;
  strength?: number;
  // video-to-video
  inputVideoPath?: string;
  denoise?: number;
};

// ── Model detection ──────────────────────────────────────────────────────────

/** Check which video models are available in ComfyUI */
export async function detectInstalledModels(baseUrl?: string): Promise<{
  cogvideox: boolean;
  hunyuan: boolean;
}> {
  try {
    const stats = await comfyui.getSystemStats(baseUrl);
    if (!stats) return { cogvideox: false, hunyuan: false };

    // Check object_info for model node types
    const base = (baseUrl ?? process.env.COMFYUI_BASE_URL ?? "http://localhost:8188").replace(/\/+$/, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const apiKey = process.env.COMFYUI_API_KEY;
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch(`${base}/object_info`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return { cogvideox: false, hunyuan: false };

    const info = (await res.json()) as Record<string, any>;

    return {
      cogvideox: !!info["CogVideoModelLoader"] || !!info["CogVideoSampler"],
      hunyuan: !!info["HunyuanVideoModelLoader"] || !!info["HunyuanVideoSampler"],
    };
  } catch {
    return { cogvideox: false, hunyuan: false };
  }
}

// ── Auto-selection ───────────────────────────────────────────────────────────

export function selectModel(
  opts: GenerateVideoOpts,
  installed: { cogvideox: boolean; hunyuan: boolean },
): ModelSelection {
  // If only one is installed, use it
  if (installed.hunyuan && !installed.cogvideox) {
    return { model: "hunyuan", reason: "Only HunyuanVideo is installed" };
  }
  if (installed.cogvideox && !installed.hunyuan) {
    return { model: "cogvideox", reason: "Only CogVideoX is installed" };
  }
  if (!installed.cogvideox && !installed.hunyuan) {
    // Fallback to CogVideoX (will fail at queue time but at least attempts)
    return { model: "cogvideox", reason: "No models detected — defaulting to CogVideoX" };
  }

  // Both installed — smart selection
  const duration = opts.durationSec ?? 5;
  const width = opts.width ?? 720;
  const height = opts.height ?? 480;
  const totalPixels = width * height;

  // HunyuanVideo wins for:
  // 1. Longer clips (> 4 seconds) — better temporal coherence
  if (duration > 4) {
    return { model: "hunyuan", reason: `Long clip (${duration}s) — HunyuanVideo has better temporal coherence` };
  }

  // 2. High resolution (> 720p equivalent)
  if (totalPixels > 921_600) { // 1280×720
    return { model: "hunyuan", reason: "High resolution — HunyuanVideo produces sharper detail" };
  }

  // 3. Image-to-video with complex scenes
  if (opts.mode === "image-to-video") {
    return { model: "hunyuan", reason: "Image-to-video — HunyuanVideo excels at animating stills" };
  }

  // 4. Video-to-video (style transfer needs strong temporal awareness)
  if (opts.mode === "video-to-video") {
    return { model: "hunyuan", reason: "Video-to-video — HunyuanVideo preserves temporal coherence better" };
  }

  // CogVideoX wins for:
  // Short clips, lower res, text-to-video quick drafts
  return { model: "cogvideox", reason: `Short clip (${duration}s), text-to-video — CogVideoX is faster` };
}

// ── Build workflow ───────────────────────────────────────────────────────────

export function buildWorkflow(
  model: "cogvideox" | "hunyuan",
  opts: GenerateVideoOpts,
): Record<string, any> {
  if (model === "hunyuan") {
    switch (opts.mode) {
      case "image-to-video":
        if (!opts.imagePath) throw new Error("imagePath required for image-to-video");
        return hunyuan.imageToVideo({
          prompt: opts.prompt,
          negativePrompt: opts.negativePrompt,
          durationSec: opts.durationSec,
          width: opts.width,
          height: opts.height,
          steps: opts.steps,
          cfgScale: opts.cfgScale,
          seed: opts.seed,
          imagePath: opts.imagePath,
          strength: opts.strength,
        });
      case "video-to-video":
        if (!opts.inputVideoPath) throw new Error("inputVideoPath required for video-to-video");
        return hunyuan.videoToVideo({
          prompt: opts.prompt,
          negativePrompt: opts.negativePrompt,
          durationSec: opts.durationSec,
          width: opts.width,
          height: opts.height,
          steps: opts.steps,
          cfgScale: opts.cfgScale,
          seed: opts.seed,
          inputVideoPath: opts.inputVideoPath,
          denoise: opts.denoise,
        });
      default:
        return hunyuan.textToVideo({
          prompt: opts.prompt,
          negativePrompt: opts.negativePrompt,
          durationSec: opts.durationSec,
          width: opts.width,
          height: opts.height,
          steps: opts.steps,
          cfgScale: opts.cfgScale,
          seed: opts.seed,
        });
    }
  }

  // CogVideoX
  switch (opts.mode) {
    case "image-to-video":
      if (!opts.imagePath) throw new Error("imagePath required for image-to-video");
      return cogvideo.imageToVideo({
        prompt: opts.prompt,
        negativePrompt: opts.negativePrompt,
        durationSec: opts.durationSec,
        width: opts.width,
        height: opts.height,
        steps: opts.steps,
        cfgScale: opts.cfgScale,
        seed: opts.seed,
        imagePath: opts.imagePath,
        strength: opts.strength,
      });
    case "video-to-video":
      if (!opts.inputVideoPath) throw new Error("inputVideoPath required for video-to-video");
      return cogvideo.videoToVideo({
        prompt: opts.prompt,
        negativePrompt: opts.negativePrompt,
        durationSec: opts.durationSec,
        width: opts.width,
        height: opts.height,
        steps: opts.steps,
        cfgScale: opts.cfgScale,
        seed: opts.seed,
        inputVideoPath: opts.inputVideoPath,
        denoise: opts.denoise,
      });
    default:
      return cogvideo.textToVideo({
        prompt: opts.prompt,
        negativePrompt: opts.negativePrompt,
        durationSec: opts.durationSec,
        width: opts.width,
        height: opts.height,
        steps: opts.steps,
        cfgScale: opts.cfgScale,
        seed: opts.seed,
      });
  }
}

/** Full generate flow: detect models → select → build workflow → queue */
export async function generateVideo(opts: GenerateVideoOpts): Promise<{
  ok: boolean;
  model: string;
  reason: string;
  promptId?: string;
  error?: string;
}> {
  const comfyAvailable = await comfyui.isAvailable();
  if (!comfyAvailable) {
    return { ok: false, model: "none", reason: "ComfyUI not available", error: "ComfyUI offline" };
  }

  // Detect installed models
  const installed = await detectInstalledModels();

  // Select model (manual override or auto)
  let selection: ModelSelection;
  if (opts.model && opts.model !== "auto") {
    selection = { model: opts.model, reason: `Manual selection: ${opts.model}` };
  } else {
    selection = selectModel(opts, installed);
  }

  // Build and queue workflow
  const workflow = buildWorkflow(selection.model, opts);
  const result = await comfyui.queuePrompt(workflow);

  if (!result.ok) {
    return { ok: false, model: selection.model, reason: selection.reason, error: result.error };
  }

  return {
    ok: true,
    model: selection.model,
    reason: selection.reason,
    promptId: result.promptId,
  };
}
