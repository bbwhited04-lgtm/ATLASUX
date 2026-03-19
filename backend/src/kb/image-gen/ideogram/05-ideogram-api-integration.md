---
title: "Ideogram API Integration Guide"
platform: "ideogram"
category: "image-gen"
tags: ["ideogram", "ai-image", "api", "integration", "typescript", "atlas-ux", "developer"]
---

# Ideogram API Integration Guide

## API Overview

The Ideogram API provides RESTful endpoints for image generation, editing, remixing, upscaling, and image description. All requests are authenticated via API key and return JSON responses containing image URLs or base64-encoded image data.

**Base URL:** `https://api.ideogram.ai`

**Authentication:** API key passed via `Api-Key` header.

**API Key Setup:** Log into ideogram.ai, navigate to Profile > API Beta, and click "Create API key."

**Minimum Plan:** Plus ($15/month) required for API access.

## Endpoints

### POST /generate — Text-to-Image Generation

Generates images from a text prompt.

**Request Body:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Text description of the desired image |
| `model` | string | No | Model version: `V_3` (default), `V_2`, `V_2A` |
| `magic_prompt_option` | string | No | `AUTO`, `ON`, `OFF` — controls prompt enhancement |
| `style_type` | string | No | `AUTO`, `GENERAL`, `REALISTIC`, `DESIGN`, `RENDER_3D`, `ANIME` |
| `aspect_ratio` | string | No | e.g., `ASPECT_1_1`, `ASPECT_16_9`, `ASPECT_9_16`, etc. |
| `negative_prompt` | string | No | Elements to exclude from the image |
| `seed` | integer | No | Seed for reproducibility |
| `num_images` | integer | No | Number of images to generate (1-4) |
| `resolution` | string | No | Quality tier: `TURBO`, `BALANCED`, `QUALITY` |
| `color_palette` | object | No | Color palette specification |
| `style_reference_images` | array | No | Up to 3 reference images for style guidance |

**Response:**

```json
{
  "created": "2026-03-19T12:00:00Z",
  "data": [
    {
      "prompt": "enhanced prompt text...",
      "url": "https://ideogram.ai/assets/image/...",
      "seed": 12345,
      "is_image_safe": true,
      "style_type": "DESIGN"
    }
  ]
}
```

### POST /edit — Inpainting / Magic Fill

Edits a specific region of an existing image using a mask.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | binary | Yes | Source image (JPEG, PNG, WebP; max 10MB) |
| `mask` | binary | Yes | Mask image defining edit region (white = edit, black = preserve) |
| `prompt` | string | Yes | Description of desired edit |
| `model` | string | No | Model version |
| `style_type` | string | No | Style preset |

### POST /remix — Image Remixing

Generates new images based on an input image and new prompt. The strength parameter controls how much of the original is preserved.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | binary | Yes | Source image |
| `prompt` | string | Yes | New prompt for the remix |
| `strength` | float | No | 0.0 (preserve original) to 1.0 (maximum change) |
| `aspect_ratio` | string | No | Output aspect ratio |
| `model` | string | No | Model version |

### POST /upscale — Image Upscaling

Upscales an image with optional prompt guidance.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | binary | Yes | Source image (max 10MB) |
| `prompt` | string | No | Optional guidance for upscaling details |
| `resemblance` | integer | No | 0-100, how closely to follow original (default: 50) |
| `detail` | integer | No | 0-100, how much detail to add (default: 50) |

### POST /describe — Image Description

Analyzes an image and returns a text description of its contents.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image` | binary | Yes | Image to describe |

## Rate Limits

- **Default:** 10 concurrent in-flight requests
- **Rate limit headers** returned with each response
- Volume-based increases available for annual commitments

## Error Handling

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad request — invalid parameters |
| 401 | Unauthorized — invalid or missing API key |
| 403 | Forbidden — plan does not include API access |
| 429 | Rate limited — too many concurrent requests |
| 500 | Server error — retry with exponential backoff |

## TypeScript Integration Examples

### Basic Image Generation

```typescript
interface IdeogramGenerateRequest {
  prompt: string;
  model?: "V_3" | "V_2" | "V_2A";
  magic_prompt_option?: "AUTO" | "ON" | "OFF";
  style_type?: "AUTO" | "GENERAL" | "REALISTIC" | "DESIGN" | "RENDER_3D" | "ANIME";
  aspect_ratio?: string;
  negative_prompt?: string;
  seed?: number;
  num_images?: number;
  resolution?: "TURBO" | "BALANCED" | "QUALITY";
}

interface IdeogramImageResult {
  prompt: string;
  url: string;
  seed: number;
  is_image_safe: boolean;
  style_type: string;
}

interface IdeogramGenerateResponse {
  created: string;
  data: IdeogramImageResult[];
}

async function generateImage(
  apiKey: string,
  request: IdeogramGenerateRequest
): Promise<IdeogramGenerateResponse> {
  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ideogram API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<IdeogramGenerateResponse>;
}

// Usage
const result = await generateImage("ido-xxx", {
  prompt: 'A professional business card with the text "ATLAS UX" in bold modern font on a dark navy background',
  model: "V_3",
  style_type: "DESIGN",
  aspect_ratio: "ASPECT_16_9",
  resolution: "QUALITY",
  num_images: 4,
});

console.log(result.data.map((img) => img.url));
```

### Image Upscaling

```typescript
async function upscaleImage(
  apiKey: string,
  imageBuffer: Buffer,
  options?: { prompt?: string; resemblance?: number; detail?: number }
): Promise<IdeogramGenerateResponse> {
  const formData = new FormData();
  formData.append("image", new Blob([imageBuffer]), "image.png");

  if (options?.prompt) formData.append("prompt", options.prompt);
  if (options?.resemblance !== undefined)
    formData.append("resemblance", String(options.resemblance));
  if (options?.detail !== undefined)
    formData.append("detail", String(options.detail));

  const response = await fetch("https://api.ideogram.ai/upscale", {
    method: "POST",
    headers: { "Api-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Ideogram upscale error: ${response.status}`);
  }

  return response.json() as Promise<IdeogramGenerateResponse>;
}
```

### Edit / Magic Fill

```typescript
async function editImage(
  apiKey: string,
  imageBuffer: Buffer,
  maskBuffer: Buffer,
  prompt: string,
  styleType?: string
): Promise<IdeogramGenerateResponse> {
  const formData = new FormData();
  formData.append("image", new Blob([imageBuffer]), "image.png");
  formData.append("mask", new Blob([maskBuffer]), "mask.png");
  formData.append("prompt", prompt);
  if (styleType) formData.append("style_type", styleType);

  const response = await fetch("https://api.ideogram.ai/edit", {
    method: "POST",
    headers: { "Api-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Ideogram edit error: ${response.status}`);
  }

  return response.json() as Promise<IdeogramGenerateResponse>;
}
```

## Atlas UX Integration Path

### Credential Storage

Store the Ideogram API key using the existing `credentialResolver` pattern:

1. Encrypt the API key via `TOKEN_ENCRYPTION_KEY` (AES-256-GCM)
2. Store in `tenant_credentials` table with key name `IDEOGRAM_API_KEY`
3. Resolve at runtime via `credentialResolver.resolve(tenantId, "IDEOGRAM_API_KEY")`

### Service Layer

Create an `ideogram.ts` service file in `backend/src/services/` following the pattern established by `elevenlabs.ts`:

```typescript
// backend/src/services/ideogram.ts
import { credentialResolver } from "./credentialResolver.js";

const IDEOGRAM_BASE_URL = "https://api.ideogram.ai";

export async function ideogramGenerate(
  tenantId: string,
  prompt: string,
  options?: {
    model?: "V_3" | "V_2";
    styleType?: string;
    aspectRatio?: string;
    resolution?: "TURBO" | "BALANCED" | "QUALITY";
    negativePrompt?: string;
    numImages?: number;
  }
): Promise<IdeogramGenerateResponse> {
  const apiKey = await credentialResolver.resolve(tenantId, "IDEOGRAM_API_KEY");
  if (!apiKey) throw new Error("Ideogram API key not configured for tenant");

  const body: Record<string, unknown> = {
    prompt,
    model: options?.model ?? "V_3",
    style_type: options?.styleType ?? "AUTO",
    resolution: options?.resolution ?? "BALANCED",
    num_images: options?.numImages ?? 4,
  };

  if (options?.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options?.negativePrompt) body.negative_prompt = options.negativePrompt;

  const response = await fetch(`${IDEOGRAM_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ideogram API error ${response.status}: ${error}`);
  }

  return response.json() as Promise<IdeogramGenerateResponse>;
}
```

### Route Registration

Register Ideogram routes in `server.ts` following the existing pattern:

```typescript
import { ideogramRoutes } from "./routes/ideogramRoutes.js";
await app.register(ideogramRoutes, { prefix: "/v1/ideogram" });
```

### Cost Tracking

Log API usage to the audit trail for cost monitoring:

- Track resolution tier per request (Turbo=$0.04, Balanced=$0.07, Quality=$0.10)
- Include `num_images` in audit metadata
- Calculate estimated cost: `tier_cost * num_images`


---
## Media

> **Tags:** `ideogram` · `ai-image` · `text-rendering` · `typography` · `2.0` · `api`

### Official Resources
- [Official Documentation](https://developer.ideogram.ai/docs)
- [Gallery / Showcase](https://ideogram.ai/explore)
- [Ideogram API Documentation](https://developer.ideogram.ai/docs)
- [Ideogram Explore Gallery](https://ideogram.ai/explore)

### Video Tutorials
- [Ideogram AI Tutorial - Text in Images Perfected](https://www.youtube.com/results?search_query=ideogram+ai+tutorial+text+images+2025) — *Credit: AI Reviews on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
