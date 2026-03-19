---
title: "FLUX API Integration Guide"
platform: "flux"
category: "image-gen"
tags: ["flux", "black-forest-labs", "ai-image", "api", "integration", "typescript", "replicate", "fal-ai"]
updated: "2026-03-19"
---

# FLUX API Integration Guide

## API Providers Overview

FLUX images can be generated through four main API providers, each with different tradeoffs:

| Provider | Strengths | Models Available | Auth Method |
|----------|-----------|-----------------|-------------|
| **BFL API** | Official, latest models first | All FLUX variants | `x-key` header |
| **Replicate** | Simple API, large community | FLUX.1 + FLUX.2 family | `Authorization: Bearer` |
| **fal.ai** | Fast inference, serverless | FLUX.1 + FLUX.2 family | `Authorization: Key` |
| **Together AI** | Budget-friendly | FLUX Dev, Schnell | `Authorization: Bearer` |

## BFL Official API

### Base URLs
- **Global:** `https://api.bfl.ai/v1/`
- **EU:** `https://api.eu.bfl.ai/v1/`
- **US:** `https://api.us.bfl.ai/v1/`

### Authentication
All requests require the `x-key` header with your BFL API key.

### Request Flow (Async Polling)

BFL uses an asynchronous polling pattern:
1. **POST** to the model endpoint — returns a `polling_url`
2. **GET** the `polling_url` — repeat until status is `"Ready"`
3. **Download** the result URL (expires in 10 minutes)

### TypeScript Example: BFL API

```typescript
interface BflGenerateResponse {
  id: string;
  polling_url: string;
}

interface BflPollResponse {
  status: "Pending" | "Ready" | "Error";
  result?: {
    sample: string; // URL to generated image
    prompt: string;
  };
}

async function generateWithBfl(
  prompt: string,
  apiKey: string,
  model: string = "flux-2-pro"
): Promise<string> {
  // Step 1: Submit generation request
  const submitRes = await fetch(`https://api.bfl.ai/v1/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-key": apiKey,
    },
    body: JSON.stringify({
      prompt,
      width: 1024,
      height: 1024,
    }),
  });

  if (!submitRes.ok) {
    throw new Error(`BFL submit failed: ${submitRes.status}`);
  }

  const { polling_url } = (await submitRes.json()) as BflGenerateResponse;

  // Step 2: Poll for result
  let attempts = 0;
  const maxAttempts = 60;
  const pollInterval = 2000; // 2 seconds

  while (attempts < maxAttempts) {
    const pollRes = await fetch(polling_url);
    const pollData = (await pollRes.json()) as BflPollResponse;

    if (pollData.status === "Ready" && pollData.result) {
      return pollData.result.sample; // Image URL
    }

    if (pollData.status === "Error") {
      throw new Error("BFL generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error("BFL generation timed out");
}
```

### Available Model Endpoints

| Endpoint | Model |
|----------|-------|
| `flux-pro-1.1` | FLUX 1.1 Pro |
| `flux-pro-1.1-ultra` | FLUX 1.1 Pro Ultra (4MP) |
| `flux-2-pro` | FLUX.2 Pro |
| `flux-2-flex` | FLUX.2 Flex |
| `flux-2-dev` | FLUX.2 Dev |
| `flux-2-klein` | FLUX.2 Klein |

## Replicate API

Replicate provides a simpler API with webhook support.

### TypeScript Example: Replicate

```typescript
interface ReplicateResponse {
  id: string;
  status: string;
  output?: string[];
  error?: string;
}

async function generateWithReplicate(
  prompt: string,
  apiToken: string,
  model: string = "black-forest-labs/flux-1.1-pro"
): Promise<string> {
  // Step 1: Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      model,
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    }),
  });

  const prediction = (await createRes.json()) as ReplicateResponse;

  // Step 2: Poll for completion
  let result = prediction;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const pollRes = await fetch(
      `https://api.replicate.com/v1/predictions/${result.id}`,
      {
        headers: { Authorization: `Bearer ${apiToken}` },
      }
    );
    result = (await pollRes.json()) as ReplicateResponse;
  }

  if (result.status === "failed" || !result.output?.[0]) {
    throw new Error(result.error || "Replicate generation failed");
  }

  return result.output[0]; // Image URL
}
```

## fal.ai API

fal.ai offers the fastest inference times with a serverless architecture.

### TypeScript Example: fal.ai

```typescript
interface FalResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
  prompt: string;
}

async function generateWithFal(
  prompt: string,
  apiKey: string,
  model: string = "fal-ai/flux-2-pro"
): Promise<string> {
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      image_size: "square_hd", // 1024x1024
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      safety_tolerance: "2",
    }),
  });

  if (!res.ok) {
    throw new Error(`fal.ai generation failed: ${res.status}`);
  }

  const data = (await res.json()) as FalResponse;
  return data.images[0].url;
}
```

## Atlas UX Integration Pattern

For integrating FLUX into the Atlas UX platform, the Venny agent (image generation specialist) would use the existing `credentialResolver` service to obtain per-tenant API keys, with cost tracking logged to the audit trail.

### Architecture

```
Venny Agent Request
  -> credentialResolver.resolve(tenantId, "BFL_API_KEY")
  -> fluxService.generate(prompt, options)
  -> BFL/Replicate/fal.ai API
  -> Store result URL + log cost to audit_log
  -> Return image URL to agent
```

### TypeScript Integration Sketch

```typescript
import { credentialResolver } from "../services/credentialResolver.js";
import { prisma } from "../db/prisma.js";

interface FluxGenerateOptions {
  prompt: string;
  model?: "flux-2-pro" | "flux-1.1-pro" | "flux-2-dev" | "flux-2-klein";
  width?: number;
  height?: number;
  provider?: "bfl" | "replicate" | "fal";
}

interface FluxResult {
  imageUrl: string;
  model: string;
  provider: string;
  costUsd: number;
  generationTimeMs: number;
}

async function generateFluxImage(
  tenantId: string,
  options: FluxGenerateOptions
): Promise<FluxResult> {
  const startTime = Date.now();
  const provider = options.provider ?? "bfl";
  const model = options.model ?? "flux-2-pro";

  // Resolve per-tenant API key
  const apiKey = await credentialResolver.resolve(
    tenantId,
    provider === "bfl"
      ? "BFL_API_KEY"
      : provider === "replicate"
        ? "REPLICATE_API_TOKEN"
        : "FAL_API_KEY"
  );

  if (!apiKey) {
    throw new Error(`No ${provider} API key configured for tenant ${tenantId}`);
  }

  // Generate image via selected provider
  let imageUrl: string;
  if (provider === "bfl") {
    imageUrl = await generateWithBfl(options.prompt, apiKey, model);
  } else if (provider === "replicate") {
    imageUrl = await generateWithReplicate(options.prompt, apiKey);
  } else {
    imageUrl = await generateWithFal(options.prompt, apiKey);
  }

  const generationTimeMs = Date.now() - startTime;

  // Estimate cost based on model
  const costUsd = estimateCost(model, options.width ?? 1024, options.height ?? 1024);

  // Log generation to audit trail
  await prisma.audit_log.create({
    data: {
      tenant_id: tenantId,
      actor: "venny-agent",
      action: "image.generate",
      resource_type: "flux-image",
      detail: JSON.stringify({
        model,
        provider,
        prompt: options.prompt.substring(0, 200),
        costUsd,
        generationTimeMs,
      }),
    },
  });

  return { imageUrl, model, provider, costUsd, generationTimeMs };
}

function estimateCost(model: string, width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000;
  const costs: Record<string, number> = {
    "flux-2-pro": 0.015 + 0.015 * megapixels,
    "flux-1.1-pro": 0.04,
    "flux-2-dev": 0.012 * megapixels,
    "flux-2-klein": 0.014,
  };
  return costs[model] ?? 0.04;
}
```

### Cost Tracking

Track per-tenant image generation costs using the existing audit log:

- **Per-generation:** Log model, provider, resolution, estimated cost, and generation time
- **Daily aggregation:** Query audit_log for `action = 'image.generate'` grouped by tenant and date
- **Budget enforcement:** Check tenant's daily/monthly spend against configured limits before generating
- **Provider rotation:** If one provider is down or rate-limited, fall back to alternatives automatically

### Rate Limiting

Apply the existing `tenantRateLimit` plugin to image generation endpoints:

- **Default:** 50 images per tenant per hour
- **Burst:** Allow up to 10 concurrent generation requests
- **Daily cap:** Configurable per tenant (default 500 images/day)

### Error Handling

```typescript
// Retry with exponential backoff for transient failures
// Fall back to alternative provider on persistent failures
// Log all failures to audit trail for debugging
// Never retry on 4xx errors (bad prompt, auth failure)
// Retry up to 3 times on 5xx errors with 2s/4s/8s delays
```


---
## Media

> **Tags:** `flux` · `black-forest-labs` · `ai-image` · `open-source` · `schnell` · `dev` · `pro` · `comfyui`

### Platform
![flux logo](https://blackforestlabs.ai/wp-content/uploads/2024/07/BFL_Logo.png)
*Source: Official flux branding — [flux](https://docs.bfl.ml)*

### Official Resources
- [Official Documentation](https://docs.bfl.ml)
- [Gallery / Showcase](https://blackforestlabs.ai)
- [Black Forest Labs - Flux Models](https://blackforestlabs.ai)
- [Flux API Documentation](https://docs.bfl.ml)
- [Flux on Hugging Face](https://huggingface.co/black-forest-labs)

### Video Tutorials
- [Flux AI Image Generation - Complete Tutorial](https://www.youtube.com/results?search_query=flux+ai+image+generation+tutorial+2025) — *Credit: AI Art on YouTube* `tutorial`
- [Installing Flux in ComfyUI - Step by Step](https://www.youtube.com/results?search_query=flux+comfyui+installation+tutorial) — *Credit: ComfyUI on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
