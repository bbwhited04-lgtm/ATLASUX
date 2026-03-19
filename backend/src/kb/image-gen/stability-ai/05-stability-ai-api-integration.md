---
title: "Stability AI API Integration — REST Endpoints, TypeScript Examples & Self-Hosted Alternatives"
platform: "stability-ai"
category: "image-gen"
tags: ["stability-ai", "stable-diffusion", "api", "rest", "typescript", "integration", "comfyui-api", "a1111-api", "atlas-ux"]
updated: "2026-03-19"
---

# Stability AI API Integration — REST Endpoints, TypeScript Examples & Self-Hosted Alternatives

## Authentication

All requests to the Stability AI API require an API key passed via the `Authorization` header.

**Getting an API key:**
1. Create an account at https://platform.stability.ai
2. Navigate to Account > API Keys
3. Generate a new key

**Header format:**
```
Authorization: Bearer sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## API Base URL

```
https://api.stability.ai
```

## Core Endpoints

### Text-to-Image (Stable Image Ultra / SD 3.5)

**POST** `/v2beta/stable-image/generate/ultra`

The latest generation endpoint supporting Stable Image Ultra and SD 3.5 models.

```typescript
import fetch from "node-fetch";
import * as fs from "fs";

interface StabilityGenerateParams {
  prompt: string;
  negative_prompt?: string;
  aspect_ratio?: "1:1" | "16:9" | "21:9" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "9:21";
  seed?: number;
  output_format?: "png" | "jpeg" | "webp";
}

async function generateImageUltra(
  params: StabilityGenerateParams,
  apiKey: string
): Promise<Buffer> {
  const formData = new FormData();
  formData.append("prompt", params.prompt);
  if (params.negative_prompt) {
    formData.append("negative_prompt", params.negative_prompt);
  }
  formData.append("aspect_ratio", params.aspect_ratio ?? "1:1");
  formData.append("output_format", params.output_format ?? "png");
  if (params.seed !== undefined) {
    formData.append("seed", params.seed.toString());
  }

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/ultra",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stability API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Text-to-Image (SD 3.5 Models)

**POST** `/v2beta/stable-image/generate/sd3`

```typescript
interface SD3GenerateParams {
  prompt: string;
  negative_prompt?: string;
  model?: "sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium";
  aspect_ratio?: string;
  seed?: number;
  output_format?: "png" | "jpeg" | "webp";
  cfg_scale?: number; // 1-10, default 7
  steps?: number;     // model-dependent defaults
}

async function generateImageSD3(
  params: SD3GenerateParams,
  apiKey: string
): Promise<Buffer> {
  const formData = new FormData();
  formData.append("prompt", params.prompt);
  formData.append("model", params.model ?? "sd3.5-large");
  formData.append("output_format", params.output_format ?? "png");

  if (params.negative_prompt) {
    formData.append("negative_prompt", params.negative_prompt);
  }
  if (params.aspect_ratio) {
    formData.append("aspect_ratio", params.aspect_ratio);
  }
  if (params.seed !== undefined) {
    formData.append("seed", params.seed.toString());
  }
  if (params.cfg_scale !== undefined) {
    formData.append("cfg_scale", params.cfg_scale.toString());
  }

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stability API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Image-to-Image

**POST** `/v2beta/stable-image/generate/sd3` (with `image` field)

```typescript
async function imageToImage(
  prompt: string,
  inputImagePath: string,
  strength: number, // 0.0 to 1.0
  apiKey: string
): Promise<Buffer> {
  const imageBuffer = fs.readFileSync(inputImagePath);
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("image", imageBlob, "input.png");
  formData.append("strength", strength.toString());
  formData.append("model", "sd3.5-large");
  formData.append("output_format", "png");

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Stability API error ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Inpainting (Search & Replace)

**POST** `/v2beta/stable-image/edit/search-and-replace`

```typescript
async function searchAndReplace(
  prompt: string,        // what to generate in the replaced area
  searchPrompt: string,  // what to find and replace
  inputImagePath: string,
  apiKey: string
): Promise<Buffer> {
  const imageBuffer = fs.readFileSync(inputImagePath);
  const imageBlob = new Blob([imageBuffer], { type: "image/png" });

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("search_prompt", searchPrompt);
  formData.append("image", imageBlob, "input.png");
  formData.append("output_format", "png");

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Stability API error ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Inpainting (Mask-Based)

**POST** `/v2beta/stable-image/edit/inpaint`

```typescript
async function inpaint(
  prompt: string,
  inputImagePath: string,
  maskImagePath: string, // white = areas to regenerate, black = preserve
  apiKey: string
): Promise<Buffer> {
  const imageBuffer = fs.readFileSync(inputImagePath);
  const maskBuffer = fs.readFileSync(maskImagePath);

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("image", new Blob([imageBuffer]), "input.png");
  formData.append("mask", new Blob([maskBuffer]), "mask.png");
  formData.append("output_format", "png");

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/edit/inpaint",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Stability API error ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Background Removal

**POST** `/v2beta/stable-image/edit/remove-background`

```typescript
async function removeBackground(
  inputImagePath: string,
  apiKey: string
): Promise<Buffer> {
  const imageBuffer = fs.readFileSync(inputImagePath);

  const formData = new FormData();
  formData.append("image", new Blob([imageBuffer]), "input.png");
  formData.append("output_format", "png");

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/edit/remove-background",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Stability API error ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Upscaling

**POST** `/v2beta/stable-image/upscale/creative`

Note: upscaling is asynchronous. Submit a request, get a generation ID, then poll for the result.

```typescript
async function upscaleImage(
  prompt: string,
  inputImagePath: string,
  apiKey: string
): Promise<Buffer> {
  const imageBuffer = fs.readFileSync(inputImagePath);

  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("image", new Blob([imageBuffer]), "input.png");
  formData.append("output_format", "png");

  // Step 1: Submit upscale request
  const submitResponse = await fetch(
    "https://api.stability.ai/v2beta/stable-image/upscale/creative",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: formData,
    }
  );

  if (!submitResponse.ok) {
    throw new Error(`Upscale submit error ${submitResponse.status}`);
  }

  const { id: generationId } = (await submitResponse.json()) as { id: string };

  // Step 2: Poll for result
  let result: Buffer | null = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const pollResponse = await fetch(
      `https://api.stability.ai/v2beta/stable-image/upscale/creative/result/${generationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
      }
    );

    if (pollResponse.status === 200) {
      const arrayBuffer = await pollResponse.arrayBuffer();
      result = Buffer.from(arrayBuffer);
      break;
    } else if (pollResponse.status === 202) {
      continue; // Still processing
    } else {
      throw new Error(`Upscale poll error ${pollResponse.status}`);
    }
  }

  if (!result) {
    throw new Error("Upscale timed out after 150 seconds");
  }
  return result;
}
```

## Account & Balance

### Check Credit Balance

**GET** `/v1/user/balance`

```typescript
async function getBalance(apiKey: string): Promise<number> {
  const response = await fetch("https://api.stability.ai/v1/user/balance", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Balance check error ${response.status}`);
  }

  const data = (await response.json()) as { credits: number };
  return data.credits;
}
```

## Error Handling

The API returns standard HTTP status codes:

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Image returned in response body |
| 202 | Accepted (async) | Poll the result endpoint |
| 400 | Bad request | Check parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 402 | Payment required | Insufficient credits |
| 403 | Forbidden | Content policy violation |
| 429 | Rate limited | Back off and retry |
| 500 | Server error | Retry with exponential backoff |

```typescript
async function generateWithRetry(
  params: StabilityGenerateParams,
  apiKey: string,
  maxRetries = 3
): Promise<Buffer> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateImageUltra(params, apiKey);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes("429") || message.includes("500")) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err; // Non-retryable error
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Self-Hosted Alternatives

### ComfyUI API

ComfyUI exposes a REST API when run with `--listen` flag, enabling programmatic workflow execution.

```bash
# Start ComfyUI with API enabled
python main.py --listen 0.0.0.0 --port 8188
```

```typescript
interface ComfyUIWorkflow {
  [nodeId: string]: {
    class_type: string;
    inputs: Record<string, unknown>;
  };
}

async function runComfyUIWorkflow(
  workflow: ComfyUIWorkflow,
  comfyUrl = "http://localhost:8188"
): Promise<Buffer> {
  const clientId = crypto.randomUUID();

  // Queue the prompt
  const queueResponse = await fetch(`${comfyUrl}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId,
    }),
  });

  const { prompt_id } = (await queueResponse.json()) as { prompt_id: string };

  // Poll for completion
  let outputImages: Buffer[] = [];
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const historyResponse = await fetch(`${comfyUrl}/history/${prompt_id}`);
    const history = (await historyResponse.json()) as Record<string, any>;

    if (history[prompt_id]?.outputs) {
      const outputs = history[prompt_id].outputs;
      for (const nodeId of Object.keys(outputs)) {
        const images = outputs[nodeId]?.images ?? [];
        for (const img of images) {
          const imgResponse = await fetch(
            `${comfyUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`
          );
          outputImages.push(Buffer.from(await imgResponse.arrayBuffer()));
        }
      }
      break;
    }
  }

  if (outputImages.length === 0) {
    throw new Error("ComfyUI generation timed out or produced no output");
  }
  return outputImages[0];
}
```

### AUTOMATIC1111 API

A1111 exposes an API when launched with `--api` flag.

```bash
# Start A1111 with API enabled
python launch.py --api --listen
```

```typescript
interface A1111Txt2ImgParams {
  prompt: string;
  negative_prompt?: string;
  steps?: number;
  cfg_scale?: number;
  width?: number;
  height?: number;
  sampler_name?: string;
  seed?: number;
}

async function a1111TextToImage(
  params: A1111Txt2ImgParams,
  a1111Url = "http://localhost:7860"
): Promise<Buffer> {
  const response = await fetch(`${a1111Url}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: params.prompt,
      negative_prompt: params.negative_prompt ?? "",
      steps: params.steps ?? 28,
      cfg_scale: params.cfg_scale ?? 7,
      width: params.width ?? 1024,
      height: params.height ?? 1024,
      sampler_name: params.sampler_name ?? "DPM++ 2M Karras",
      seed: params.seed ?? -1,
    }),
  });

  if (!response.ok) {
    throw new Error(`A1111 API error ${response.status}`);
  }

  const data = (await response.json()) as { images: string[] };
  return Buffer.from(data.images[0], "base64");
}
```

## Atlas UX Integration Pattern

For integrating Stability AI with Atlas UX agent tools, use the credential resolver pattern to manage per-tenant API keys.

```typescript
// In backend/src/tools/ — example agent tool registration
import { credentialResolver } from "../services/credentialResolver.js";

async function stabilityGenerateForTenant(
  tenantId: string,
  prompt: string,
  model: "ultra" | "sd3.5-large" | "sd3.5-medium" = "sd3.5-medium"
): Promise<Buffer> {
  // Resolve tenant-specific or platform API key
  const apiKey = await credentialResolver.resolve(tenantId, "STABILITY_API_KEY");
  if (!apiKey) {
    throw new Error("No Stability AI API key configured for tenant");
  }

  // Check balance before generation (fail fast)
  const balance = await getBalance(apiKey);
  if (balance < 10) {
    throw new Error(`Insufficient Stability AI credits: ${balance} remaining`);
  }

  // Route to correct endpoint based on model
  if (model === "ultra") {
    return generateImageUltra({ prompt }, apiKey);
  }

  return generateImageSD3(
    { prompt, model: model === "sd3.5-large" ? "sd3.5-large" : "sd3.5-medium" },
    apiKey
  );
}
```

**Key integration notes:**
- Store the `STABILITY_API_KEY` in the `tenant_credentials` table (encrypted via AES-256-GCM)
- Use `credentialResolver.resolve()` for lookup — it checks tenant credentials first, then falls back to `process.env` for the platform owner
- Log all generation requests to the audit trail via `auditPlugin`
- Enforce `AUTO_SPEND_LIMIT_USD` checks before generation (8 credits = $0.08 for Ultra)
- Cache credit balance checks (the 5-minute credential cache in `credentialResolver` handles key caching, but balance should be checked per-request or batched)


---
## Media

> **Tags:** `stability-ai` · `stable-diffusion` · `sd3` · `sd3.5` · `sdxl` · `ai-image` · `open-source` · `comfyui`

### Platform
![stability-ai logo](https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Stability_AI_logo.svg/250px-Stability_AI_logo.svg.png)
*Source: Official stability-ai branding — [stability-ai](https://platform.stability.ai/docs)*

### Official Resources
- [Official Documentation](https://platform.stability.ai/docs)
- [Gallery / Showcase](https://stability.ai)
- [Stability AI Platform](https://platform.stability.ai)
- [Stable Diffusion Web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Stable Diffusion Art Tutorials](https://stable-diffusion-art.com/beginners-guide/)
- [Civitai Model Hub](https://civitai.com)

### Video Tutorials
- [Stable Diffusion 3.5 Tutorial - Complete Beginner's Guide](https://www.youtube.com/results?search_query=stable+diffusion+3.5+tutorial+beginners) — *Credit: SD Tutorials on YouTube* `tutorial`
- [Stable Diffusion Installation Guide 2025](https://www.youtube.com/results?search_query=stable+diffusion+installation+guide+2025) — *Credit: AI Art on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
