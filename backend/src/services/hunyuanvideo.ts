/**
 * HunyuanVideo workflow builder — constructs ComfyUI workflow JSON
 * for Tencent's HunyuanVideo (13B) AI video generation.
 *
 * Advantages over CogVideoX-5B:
 *   - 13B parameters (vs 5B) → better motion coherence & visual quality
 *   - xDiT parallelism for multi-GPU inference
 *   - FP8 weight support → fits in ~24GB VRAM with quantization
 *   - Stronger temporal consistency for longer clips
 *
 * Trade-offs:
 *   - Heavier model, slower generation
 *   - Needs more VRAM (24GB+ recommended, vs 12GB for CogVideoX)
 *
 * Supported modes:
 *   1. Text → Video
 *   2. Image → Video (animate a still)
 *   3. Video → Video (style transfer)
 *
 * Desktop-only: requires ComfyUI + HunyuanVideo model installed locally.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type HunyuanVideoOpts = {
  prompt: string;
  negativePrompt?: string;
  durationSec?: number;   // default 5
  width?: number;          // default 960
  height?: number;         // default 544
  steps?: number;          // default 30 (HunyuanVideo converges faster)
  cfgScale?: number;       // default 7.0
  seed?: number;
  fps?: number;            // default 24 (HunyuanVideo outputs at higher fps)
  flowShift?: number;      // default 7.0 (flow matching shift parameter)
};

export type HunyuanI2VOpts = HunyuanVideoOpts & {
  imagePath: string;
  strength?: number; // 0.0–1.0, default 0.85
};

export type HunyuanV2VOpts = HunyuanVideoOpts & {
  inputVideoPath: string;
  denoise?: number; // 0.0–1.0, default 0.65
};

// ── Model config ─────────────────────────────────────────────────────────────

const MODEL_NAME = "hunyuan_video_720_cfgdistill_fp8_e4m3fn.safetensors";
const VAE_NAME = "hunyuan_video_vae_fp32.safetensors";
const TEXT_ENCODER = "llava-llama-3-8b-text-encoder-tokenizer";
const CLIP_MODEL = "clip-vit-large-patch14";

// ── Workflow builders ────────────────────────────────────────────────────────

/**
 * Text → Video workflow.
 * HunyuanVideo uses a dual text encoder (LLaVA + CLIP) for richer prompt understanding.
 */
export function textToVideo(opts: HunyuanVideoOpts): Record<string, any> {
  const fps = opts.fps ?? 24;
  const frames = Math.max(17, Math.round((opts.durationSec ?? 5) * fps));
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // Load HunyuanVideo model
    "1": {
      class_type: "HunyuanVideoModelLoader",
      inputs: {
        model_name: MODEL_NAME,
        precision: "fp8_e4m3fn",
      },
    },
    // Load VAE
    "2": {
      class_type: "HunyuanVideoVAELoader",
      inputs: { vae_name: VAE_NAME },
    },
    // Load text encoder (LLaVA-LLaMA-3-8B)
    "3": {
      class_type: "HunyuanVideoTextEncoderLoader",
      inputs: {
        text_encoder: TEXT_ENCODER,
        precision: "fp16",
      },
    },
    // Load CLIP encoder
    "4": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: CLIP_MODEL,
        type: "stable_diffusion",
      },
    },
    // Text encode (positive) — dual encoder
    "5": {
      class_type: "HunyuanVideoDualTextEncode",
      inputs: {
        text: opts.prompt,
        text_encoder: ["3", 0],
        clip: ["4", 0],
      },
    },
    // Text encode (negative) — dual encoder
    "6": {
      class_type: "HunyuanVideoDualTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "blurry, low quality, distorted, watermark, text, ugly, deformed",
        text_encoder: ["3", 0],
        clip: ["4", 0],
      },
    },
    // Sampler
    "7": {
      class_type: "HunyuanVideoSampler",
      inputs: {
        model: ["1", 0],
        positive: ["5", 0],
        negative: ["6", 0],
        width: opts.width ?? 960,
        height: opts.height ?? 544,
        num_frames: frames,
        steps: opts.steps ?? 30,
        cfg: opts.cfgScale ?? 7.0,
        seed,
        flow_shift: opts.flowShift ?? 7.0,
        scheduler: "FlowMatchEuler",
      },
    },
    // VAE Decode
    "8": {
      class_type: "HunyuanVideoVAEDecode",
      inputs: {
        samples: ["7", 0],
        vae: ["2", 0],
      },
    },
    // Save as MP4
    "9": {
      class_type: "SaveAnimatedWEBP",
      inputs: {
        images: ["8", 0],
        filename_prefix: "hunyuan_t2v",
        fps,
        quality: 92,
      },
    },
  };
}

/**
 * Image → Video workflow.
 * Animates a still image — HunyuanVideo excels at complex motion from stills.
 */
export function imageToVideo(opts: HunyuanI2VOpts): Record<string, any> {
  const fps = opts.fps ?? 24;
  const frames = Math.max(17, Math.round((opts.durationSec ?? 5) * fps));
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // Load image
    "1": {
      class_type: "LoadImage",
      inputs: { image: opts.imagePath },
    },
    // Load model
    "2": {
      class_type: "HunyuanVideoModelLoader",
      inputs: { model_name: MODEL_NAME, precision: "fp8_e4m3fn" },
    },
    // Load VAE
    "3": {
      class_type: "HunyuanVideoVAELoader",
      inputs: { vae_name: VAE_NAME },
    },
    // Text encoder
    "4": {
      class_type: "HunyuanVideoTextEncoderLoader",
      inputs: { text_encoder: TEXT_ENCODER, precision: "fp16" },
    },
    // CLIP
    "5": {
      class_type: "CLIPLoader",
      inputs: { clip_name: CLIP_MODEL, type: "stable_diffusion" },
    },
    // Positive text
    "6": {
      class_type: "HunyuanVideoDualTextEncode",
      inputs: { text: opts.prompt, text_encoder: ["4", 0], clip: ["5", 0] },
    },
    // Negative text
    "7": {
      class_type: "HunyuanVideoDualTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "blurry, low quality, distorted, watermark, text, ugly, deformed",
        text_encoder: ["4", 0], clip: ["5", 0],
      },
    },
    // Encode source image to latent
    "8": {
      class_type: "HunyuanVideoImageEncode",
      inputs: { image: ["1", 0], vae: ["3", 0] },
    },
    // Sampler with image conditioning
    "9": {
      class_type: "HunyuanVideoSampler",
      inputs: {
        model: ["2", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["8", 0],
        width: opts.width ?? 960,
        height: opts.height ?? 544,
        num_frames: frames,
        steps: opts.steps ?? 30,
        cfg: opts.cfgScale ?? 7.0,
        seed,
        flow_shift: opts.flowShift ?? 7.0,
        scheduler: "FlowMatchEuler",
        denoise: opts.strength ?? 0.85,
      },
    },
    // Decode
    "10": {
      class_type: "HunyuanVideoVAEDecode",
      inputs: { samples: ["9", 0], vae: ["3", 0] },
    },
    // Save
    "11": {
      class_type: "SaveAnimatedWEBP",
      inputs: { images: ["10", 0], filename_prefix: "hunyuan_i2v", fps, quality: 92 },
    },
  };
}

/**
 * Video → Video workflow.
 * Style transfer — HunyuanVideo preserves temporal coherence better than smaller models.
 */
export function videoToVideo(opts: HunyuanV2VOpts): Record<string, any> {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 32);
  const fps = opts.fps ?? 24;

  return {
    // Load source video
    "1": {
      class_type: "LoadVideoUpload",
      inputs: { video: opts.inputVideoPath, force_rate: fps, force_size: "Disabled" },
    },
    // Load model
    "2": {
      class_type: "HunyuanVideoModelLoader",
      inputs: { model_name: MODEL_NAME, precision: "fp8_e4m3fn" },
    },
    // Load VAE
    "3": {
      class_type: "HunyuanVideoVAELoader",
      inputs: { vae_name: VAE_NAME },
    },
    // Text encoder
    "4": {
      class_type: "HunyuanVideoTextEncoderLoader",
      inputs: { text_encoder: TEXT_ENCODER, precision: "fp16" },
    },
    // CLIP
    "5": {
      class_type: "CLIPLoader",
      inputs: { clip_name: CLIP_MODEL, type: "stable_diffusion" },
    },
    // Encode source video frames
    "6": {
      class_type: "HunyuanVideoVAEEncode",
      inputs: { pixels: ["1", 0], vae: ["3", 0] },
    },
    // Positive text
    "7": {
      class_type: "HunyuanVideoDualTextEncode",
      inputs: { text: opts.prompt, text_encoder: ["4", 0], clip: ["5", 0] },
    },
    // Negative text
    "8": {
      class_type: "HunyuanVideoDualTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "blurry, low quality, distorted, watermark, text, ugly, deformed",
        text_encoder: ["4", 0], clip: ["5", 0],
      },
    },
    // Sampler with video latent
    "9": {
      class_type: "HunyuanVideoSampler",
      inputs: {
        model: ["2", 0],
        positive: ["7", 0],
        negative: ["8", 0],
        latent_image: ["6", 0],
        steps: opts.steps ?? 30,
        cfg: opts.cfgScale ?? 7.0,
        seed,
        flow_shift: opts.flowShift ?? 7.0,
        scheduler: "FlowMatchEuler",
        denoise: opts.denoise ?? 0.65,
      },
    },
    // Decode
    "10": {
      class_type: "HunyuanVideoVAEDecode",
      inputs: { samples: ["9", 0], vae: ["3", 0] },
    },
    // Save
    "11": {
      class_type: "SaveAnimatedWEBP",
      inputs: { images: ["10", 0], filename_prefix: "hunyuan_v2v", fps, quality: 92 },
    },
  };
}
