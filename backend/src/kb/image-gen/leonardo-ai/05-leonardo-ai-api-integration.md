---
title: "Leonardo.ai API Integration Guide"
platform: "leonardo-ai"
category: "image-gen"
tags: ["leonardo-ai", "ai-image", "api", "typescript", "integration", "sdk", "rest-api"]
---

# Leonardo.ai API Integration Guide

## Overview

Leonardo.ai provides a REST API and official TypeScript SDK for programmatic image generation. The API uses bearer token authentication and a token-based billing model matching the web platform. API access requires a paid subscription (Apprentice or higher).

## Authentication

API keys are generated from the Leonardo.ai dashboard under API Access settings.

```typescript
// Bearer token authentication
const headers = {
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json",
};
```

## Official TypeScript SDK

### Installation

```bash
npm install @leonardo-ai/sdk
```

### SDK Initialization

```typescript
import { Leonardo } from "@leonardo-ai/sdk";

const leonardo = new Leonardo({
  bearerAuth: process.env.LEONARDO_API_KEY,
});
```

## Key API Endpoints

### Get User Info

```typescript
// GET /me - Returns user ID, username, token balance
const userInfo = await leonardo.user.getUserSelf();
console.log(userInfo.object?.userDetails);
// { id: "uuid", username: "...", tokenRenewalDate: "...", apiConcurrencySlots: 10 }
```

### Create Image Generation

```typescript
// POST /generations - Create a new image generation
const generation = await leonardo.image.createGeneration({
  prompt: "A cyberpunk cityscape at night, neon lights, rain-slicked streets, cinematic",
  modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Phoenix 1.0
  width: 1024,
  height: 1024,
  numImages: 4,
  alchemy: true,
  photoReal: false,
  guidance_scale: 7,
  // Optional: negative prompt (Alchemy V2 only)
  negative_prompt: "blurry, low quality, watermark",
});

const generationId = generation.object?.sdGenerationJob?.generationId;
```

### Get Generation Result

```typescript
// GET /generations/{id} - Poll for generation results
const result = await leonardo.image.getGenerationById(generationId);
const images = result.object?.generationsByPk?.generatedImages;

// Each image contains:
// { id: string, url: string, nsfw: boolean, likeCount: number }
for (const img of images ?? []) {
  console.log(img.url); // CDN URL to the generated image
}
```

### Upscale an Image

```typescript
// POST /variations/upscale - Upscale a generated image
const upscale = await leonardo.image.createVariationUpscale({
  id: generatedImageId, // ID of image to upscale
});
```

### Create with Image-to-Image (Init Image)

```typescript
// Upload an init image first
const upload = await leonardo.image.uploadInitImage({
  extension: "png",
});

// Then use in generation
const generation = await leonardo.image.createGeneration({
  prompt: "Transform into watercolor painting style",
  modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
  width: 1024,
  height: 1024,
  numImages: 1,
  init_image_id: uploadedImageId,
  init_strength: 0.5, // 0 = ignore init image, 1 = follow closely
});
```

## Direct REST API Usage (No SDK)

For environments where the SDK is not suitable, use the REST API directly.

```typescript
const LEONARDO_BASE_URL = "https://cloud.leonardo.ai/api/rest/v1";

interface LeonardoGenerationRequest {
  prompt: string;
  modelId: string;
  width: number;
  height: number;
  num_images: number;
  alchemy?: boolean;
  photoReal?: boolean;
  guidance_scale?: number;
  negative_prompt?: string;
  presetStyle?: string;
}

interface LeonardoGeneratedImage {
  id: string;
  url: string;
  nsfw: boolean;
}

async function generateImage(
  apiKey: string,
  request: LeonardoGenerationRequest
): Promise<string> {
  const response = await fetch(`${LEONARDO_BASE_URL}/generations`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Leonardo API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.sdGenerationJob.generationId;
}

async function pollGeneration(
  apiKey: string,
  generationId: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<LeonardoGeneratedImage[]> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `${LEONARDO_BASE_URL}/generations/${generationId}`,
      {
        headers: { "Authorization": `Bearer ${apiKey}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Poll error: ${response.status}`);
    }

    const data = await response.json();
    const status = data.generations_by_pk?.status;

    if (status === "COMPLETE") {
      return data.generations_by_pk.generated_images;
    }

    if (status === "FAILED") {
      throw new Error("Generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Generation timed out");
}
```

## Rate Limits and Concurrency

| Limit Type | Standard API | Enterprise |
|-----------|-------------|------------|
| Concurrent requests | 5 | Custom |
| Concurrent generation jobs | 10 | Custom |
| Concurrent model training jobs | 5 | Custom |
| Request queue depth | Plan-dependent | Custom |

Rate limit responses return HTTP 429 with a `Retry-After` header. Implement exponential backoff for production integrations.

## Common Model IDs

| Model | ID | Best For |
|-------|-----|---------|
| Phoenix 1.0 | `6b645e3a-d64f-4341-a6d8-7a3690fbf042` | General purpose, best prompt adherence |
| Leonardo Diffusion XL | `1e60896f-3c26-4296-8571-a5f3e7ec6314` | Photorealism |
| Leonardo Vision XL | `5c232a9e-9061-4777-980f-0d2e4f63b3c3` | Artistic / illustrative |

*Note: Model IDs may change. Query the `/platformModels` endpoint for current model listings.*

## Integration Path for Atlas UX Agents

### Credential Storage

Store the Leonardo API key in the `tenant_credentials` table using the existing credential resolver pattern:

```typescript
// Store via credentialResolver
// Key name: LEONARDO_API_KEY
// Encrypted at rest with AES-256-GCM via TOKEN_ENCRYPTION_KEY
```

### Agent Integration Pattern

```typescript
import { credentialResolver } from "../services/credentialResolver.js";

async function agentGenerateImage(
  tenantId: string,
  prompt: string,
  options?: { alchemy?: boolean; photoReal?: boolean; width?: number; height?: number }
) {
  const apiKey = await credentialResolver.resolve(tenantId, "LEONARDO_API_KEY");
  if (!apiKey) {
    throw new Error("Leonardo API key not configured for tenant");
  }

  const generationId = await generateImage(apiKey, {
    prompt,
    modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042", // Phoenix
    width: options?.width ?? 1024,
    height: options?.height ?? 1024,
    num_images: 1,
    alchemy: options?.alchemy ?? true,
    photoReal: options?.photoReal ?? false,
    guidance_scale: 7,
  });

  // Poll for results
  const images = await pollGeneration(apiKey, generationId);
  return images[0]?.url;
}
```

### Job Queue Integration

For non-blocking generation, queue Leonardo requests as jobs:

```typescript
// Queue a generation job
await prisma.jobs.create({
  data: {
    tenant_id: tenantId,
    type: "IMAGE_GENERATION",
    status: "queued",
    payload: {
      provider: "leonardo",
      prompt,
      settings: { alchemy: true, model: "phoenix" },
    },
  },
});
```

The engine loop picks up queued jobs and processes them asynchronously, storing completed image URLs back in the job result payload.

## Error Handling

| HTTP Status | Meaning | Action |
|------------|---------|--------|
| 400 | Invalid request parameters | Check prompt, model ID, dimensions |
| 401 | Invalid or expired API key | Refresh credentials |
| 403 | Feature not available on plan | Check subscription tier |
| 429 | Rate limited | Retry with exponential backoff |
| 500 | Server error | Retry after delay |

## API Documentation

- Official docs: https://docs.leonardo.ai/docs
- API reference: https://docs.leonardo.ai/reference
- TypeScript SDK: https://github.com/Leonardo-Interactive/leonardo-ts-sdk
- npm package: https://www.npmjs.com/package/@leonardo-ai/sdk


---
## Media

> **Tags:** `leonardo-ai` · `ai-image` · `alchemy` · `phoenix` · `realtime-canvas` · `image-generation`

### Official Resources
- [Official Documentation](https://docs.leonardo.ai)
- [Gallery / Showcase](https://app.leonardo.ai/ai-generations)
- [Leonardo AI Learn Hub](https://leonardo.ai/learn/)
- [Leonardo AI Webinars](https://leonardo.ai/webinars/)
- [Leonardo 101: Beginner's Guide](https://leonardo.ai/webinars/leonardo-101-welcome-to-leonardo-ai-webinar/)

### Video Tutorials
- [Leonardo AI Tutorial for Beginners](https://www.youtube.com/results?search_query=leonardo+ai+tutorial+beginners+2025) — *Credit: Leonardo AI on YouTube* `tutorial`
- [Leonardo AI Phoenix Model - Complete Guide](https://www.youtube.com/results?search_query=leonardo+ai+phoenix+model+guide) — *Credit: AI Art on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
