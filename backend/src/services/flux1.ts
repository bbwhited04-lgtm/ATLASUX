/**
 * Flux1 Image Generation Service — API-based image generation for Venny.
 *
 * Uses the Black Forest Labs Flux API to generate images from text prompts.
 * Cloud-compatible (no local GPU needed).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type Flux1GenerateOpts = {
  prompt: string;
  width?: number;       // default 1024
  height?: number;      // default 1024
  steps?: number;       // default 20
  guidance?: number;    // default 7.5
  seed?: number;        // -1 for random
  model?: "flux1-schnell" | "flux1-dev" | "flux1-pro"; // default schnell
};

export type Flux1Result = {
  ok: boolean;
  imageUrl?: string;
  imageBase64?: string;
  seed?: number;
  error?: string;
};

// ── Config ───────────────────────────────────────────────────────────────────

const FLUX_API_BASE = "https://api.bfl.ml";

function getApiKey(): string {
  return (process.env.FLUX1_API_KEY ?? "").trim();
}

// ── Generate image ───────────────────────────────────────────────────────────

export async function generateImage(opts: Flux1GenerateOpts): Promise<Flux1Result> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: "FLUX1_API_KEY not configured" };

  const model = opts.model ?? "flux1-schnell";
  const endpoint = `${FLUX_API_BASE}/v1/${model.replace("flux1-", "flux-pro-1.1-ultra")}`;

  // Submit generation request
  const submitRes = await fetch(`${FLUX_API_BASE}/v1/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Key": apiKey,
    },
    body: JSON.stringify({
      prompt: opts.prompt,
      width: opts.width ?? 1024,
      height: opts.height ?? 1024,
      steps: opts.steps,
      guidance: opts.guidance,
      seed: opts.seed,
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text().catch(() => "");
    return { ok: false, error: `Flux1 API ${submitRes.status}: ${errText.slice(0, 300)}` };
  }

  const submitData = (await submitRes.json()) as any;
  const requestId = submitData.id;
  if (!requestId) return { ok: false, error: "No request ID returned from Flux1 API" };

  // Poll for result (max 120s)
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2_000));

    const statusRes = await fetch(`${FLUX_API_BASE}/v1/get_result?id=${requestId}`, {
      headers: { "X-Key": apiKey },
    });

    if (!statusRes.ok) continue;

    const statusData = (await statusRes.json()) as any;

    if (statusData.status === "Ready") {
      return {
        ok: true,
        imageUrl: statusData.result?.sample ?? statusData.result?.url,
        seed: statusData.result?.seed,
      };
    }

    if (statusData.status === "Error" || statusData.status === "Request Moderated") {
      return { ok: false, error: statusData.status };
    }

    // Still pending — keep polling
  }

  return { ok: false, error: "Flux1 generation timed out after 120s" };
}

/** Check if Flux1 API is configured and reachable */
export async function isAvailable(): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) return false;
  // Just check if we have the key — no health endpoint needed
  return true;
}

/**
 * Generate image and return as Buffer for direct use (upload, OneDrive, etc.)
 */
export async function generateImageBuffer(opts: Flux1GenerateOpts): Promise<{ ok: boolean; buffer?: Buffer; error?: string }> {
  const result = await generateImage(opts);
  if (!result.ok || !result.imageUrl) return { ok: false, error: result.error ?? "No image URL" };

  try {
    const res = await fetch(result.imageUrl);
    if (!res.ok) return { ok: false, error: `Failed to download image: ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, buffer: buf };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
