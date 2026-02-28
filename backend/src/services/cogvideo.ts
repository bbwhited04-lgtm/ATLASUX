/**
 * CogVideoX-5B workflow builder — constructs ComfyUI workflow JSON
 * for AI video generation.
 *
 * Supported modes:
 *   1. Text → Video (prompt only)
 *   2. Image → Video (animate a still image)
 *   3. Video → Video (style transfer on existing video)
 *
 * The workflows are submitted to ComfyUI via the comfyui.ts client.
 * Desktop-only: requires ComfyUI + CogVideoX-5B model installed locally.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type CogVideoOpts = {
  /** Text prompt describing the desired video */
  prompt: string;
  /** Negative prompt (things to avoid) */
  negativePrompt?: string;
  /** Duration in seconds (default 6) */
  durationSec?: number;
  /** Output width (default 720) */
  width?: number;
  /** Output height (default 480) */
  height?: number;
  /** Number of inference steps (default 50) */
  steps?: number;
  /** CFG scale (default 6.0) */
  cfgScale?: number;
  /** Seed (-1 for random, default -1) */
  seed?: number;
};

export type ImageToVideoOpts = CogVideoOpts & {
  /** Path to the input image (on the ComfyUI server) */
  imagePath: string;
  /** Strength of the animation (0.0–1.0, default 0.85) */
  strength?: number;
};

export type VideoToVideoOpts = CogVideoOpts & {
  /** Path to the input video (on the ComfyUI server) */
  inputVideoPath: string;
  /** Denoise strength (0.0–1.0, default 0.7) */
  denoise?: number;
};

// ── Model config ─────────────────────────────────────────────────────────────

const MODEL_NAME = "CogVideoX_5b_fp16.safetensors";
const VAE_NAME = "cogvideox_vae.safetensors";
const SCHEDULER = "CogVideoXDDIM";

// ── Workflow builders ────────────────────────────────────────────────────────

/**
 * Text → Video workflow.
 * Generates a video clip from a text prompt using CogVideoX-5B.
 */
export function textToVideo(opts: CogVideoOpts): Record<string, any> {
  const frames = Math.max(13, Math.round((opts.durationSec ?? 6) * 8)); // CogVideo uses 8fps
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // Load CogVideo model
    "1": {
      class_type: "CogVideoModelLoader",
      inputs: { model_name: MODEL_NAME },
    },
    // Load VAE
    "2": {
      class_type: "CogVideoVAELoader",
      inputs: { vae_name: VAE_NAME },
    },
    // Text encode (positive)
    "3": {
      class_type: "CogVideoTextEncode",
      inputs: {
        text: opts.prompt,
        model: ["1", 0],
      },
    },
    // Text encode (negative)
    "4": {
      class_type: "CogVideoTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "blurry, low quality, distorted, watermark",
        model: ["1", 0],
      },
    },
    // Sampler
    "5": {
      class_type: "CogVideoSampler",
      inputs: {
        model: ["1", 0],
        positive: ["3", 0],
        negative: ["4", 0],
        width: opts.width ?? 720,
        height: opts.height ?? 480,
        num_frames: frames,
        steps: opts.steps ?? 50,
        cfg: opts.cfgScale ?? 6.0,
        seed,
        scheduler: SCHEDULER,
      },
    },
    // VAE Decode
    "6": {
      class_type: "CogVideoVAEDecode",
      inputs: {
        samples: ["5", 0],
        vae: ["2", 0],
      },
    },
    // Save video output
    "7": {
      class_type: "SaveAnimatedWEBP",
      inputs: {
        images: ["6", 0],
        filename_prefix: "cogvideo_t2v",
        fps: 8,
        quality: 90,
      },
    },
  };
}

/**
 * Image → Video workflow.
 * Animates a still image using CogVideoX-5B image conditioning.
 */
export function imageToVideo(opts: ImageToVideoOpts): Record<string, any> {
  const frames = Math.max(13, Math.round((opts.durationSec ?? 6) * 8));
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // Load image
    "1": {
      class_type: "LoadImage",
      inputs: { image: opts.imagePath },
    },
    // Load CogVideo model
    "2": {
      class_type: "CogVideoModelLoader",
      inputs: { model_name: MODEL_NAME },
    },
    // Load VAE
    "3": {
      class_type: "CogVideoVAELoader",
      inputs: { vae_name: VAE_NAME },
    },
    // Text encode (positive)
    "4": {
      class_type: "CogVideoTextEncode",
      inputs: {
        text: opts.prompt,
        model: ["2", 0],
      },
    },
    // Text encode (negative)
    "5": {
      class_type: "CogVideoTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "blurry, low quality, distorted, watermark",
        model: ["2", 0],
      },
    },
    // Image-conditioned sampler
    "6": {
      class_type: "CogVideoImageEncode",
      inputs: {
        image: ["1", 0],
        vae: ["3", 0],
      },
    },
    "7": {
      class_type: "CogVideoSampler",
      inputs: {
        model: ["2", 0],
        positive: ["4", 0],
        negative: ["5", 0],
        latent_image: ["6", 0],
        width: opts.width ?? 720,
        height: opts.height ?? 480,
        num_frames: frames,
        steps: opts.steps ?? 50,
        cfg: opts.cfgScale ?? 6.0,
        seed,
        scheduler: SCHEDULER,
        denoise: opts.strength ?? 0.85,
      },
    },
    // VAE Decode
    "8": {
      class_type: "CogVideoVAEDecode",
      inputs: {
        samples: ["7", 0],
        vae: ["3", 0],
      },
    },
    // Save
    "9": {
      class_type: "SaveAnimatedWEBP",
      inputs: {
        images: ["8", 0],
        filename_prefix: "cogvideo_i2v",
        fps: 8,
        quality: 90,
      },
    },
  };
}

/**
 * Video → Video workflow.
 * Style-transfers an existing video using CogVideoX-5B.
 */
export function videoToVideo(opts: VideoToVideoOpts): Record<string, any> {
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 32);

  return {
    // Load source video
    "1": {
      class_type: "LoadVideoUpload",
      inputs: {
        video: opts.inputVideoPath,
        force_rate: 8,
        force_size: "Disabled",
      },
    },
    // Load CogVideo model
    "2": {
      class_type: "CogVideoModelLoader",
      inputs: { model_name: MODEL_NAME },
    },
    // Load VAE
    "3": {
      class_type: "CogVideoVAELoader",
      inputs: { vae_name: VAE_NAME },
    },
    // Encode source frames to latent
    "4": {
      class_type: "CogVideoVAEEncode",
      inputs: {
        pixels: ["1", 0],
        vae: ["3", 0],
      },
    },
    // Text encode (positive)
    "5": {
      class_type: "CogVideoTextEncode",
      inputs: {
        text: opts.prompt,
        model: ["2", 0],
      },
    },
    // Text encode (negative)
    "6": {
      class_type: "CogVideoTextEncode",
      inputs: {
        text: opts.negativePrompt ?? "blurry, low quality, distorted, watermark",
        model: ["2", 0],
      },
    },
    // Sampler with video latent input
    "7": {
      class_type: "CogVideoSampler",
      inputs: {
        model: ["2", 0],
        positive: ["5", 0],
        negative: ["6", 0],
        latent_image: ["4", 0],
        steps: opts.steps ?? 50,
        cfg: opts.cfgScale ?? 6.0,
        seed,
        scheduler: SCHEDULER,
        denoise: opts.denoise ?? 0.7,
      },
    },
    // VAE Decode
    "8": {
      class_type: "CogVideoVAEDecode",
      inputs: {
        samples: ["7", 0],
        vae: ["3", 0],
      },
    },
    // Save
    "9": {
      class_type: "SaveAnimatedWEBP",
      inputs: {
        images: ["8", 0],
        filename_prefix: "cogvideo_v2v",
        fps: 8,
        quality: 90,
      },
    },
  };
}
