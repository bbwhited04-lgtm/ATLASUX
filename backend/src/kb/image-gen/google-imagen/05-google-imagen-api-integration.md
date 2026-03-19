---
title: "Google Imagen API Integration"
platform: "google-imagen"
category: "image-gen"
tags: ["google-imagen", "vertex-ai", "api", "typescript", "gemini-api", "integration", "google-cloud", "service-account"]
---

# Google Imagen API Integration

## API Access Options

Google provides two primary paths for programmatic image generation:

1. **Vertex AI API** — Full-featured enterprise API on Google Cloud. Requires a Google Cloud project, billing, and service account authentication.
2. **Gemini Developer API** — Simpler API via Google AI Studio. Uses API key authentication (similar to OpenAI). Supports both Imagen models and Gemini native image generation.

For Atlas UX, the Gemini Developer API is the recommended path since the platform already has a `GEMINI_API_KEY` configured.

## Gemini Developer API (Recommended)

### Setup

Install the Google Gen AI SDK:

```bash
npm install @google/genai
```

### Authentication

The Gemini Developer API uses a simple API key, configured via the `GEMINI_API_KEY` environment variable already present in the Atlas UX backend.

### TypeScript: Generate Image with Imagen via Gemini API

```typescript
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImageWithImagen(prompt: string): Promise<Buffer | null> {
  const response = await genai.models.generateImages({
    model: "imagen-3.0-generate-002",
    prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: "1:1", // "1:1", "3:4", "4:3", "9:16", "16:9"
      // Safety settings (optional)
      personGeneration: "allow_adult",
      safetySetting: "block_medium_and_above",
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const imageBytes = response.generatedImages[0].image?.imageBytes;
    if (imageBytes) {
      return Buffer.from(imageBytes, "base64");
    }
  }
  return null;
}
```

### TypeScript: Generate Image with Gemini Native (Multimodal)

Gemini's native image generation allows conversational image creation with text + image output in a single call:

```typescript
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImageWithGemini(
  prompt: string
): Promise<{ text: string; imageBuffer: Buffer | null }> {
  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  let text = "";
  let imageBuffer: Buffer | null = null;

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.text) {
        text += part.text;
      }
      if (part.inlineData?.data) {
        imageBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }
  }

  return { text, imageBuffer };
}
```

### TypeScript: Edit Image (Gemini Native)

```typescript
import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function editImage(
  imagePath: string,
  editInstruction: string
): Promise<Buffer | null> {
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");
  const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash-exp-image-generation",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          { text: editInstruction },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }
  return null;
}
```

## Vertex AI API (Enterprise)

For production workloads requiring enterprise features (SLAs, audit logging, VPC isolation), use the Vertex AI API.

### Setup

```bash
npm install @google-cloud/vertexai
```

### Authentication

Vertex AI uses Google Cloud service accounts rather than API keys:

1. Create a Google Cloud project and enable the Vertex AI API
2. Create a service account with the `Vertex AI User` role
3. Download the JSON key file or configure Workload Identity Federation
4. Set environment variables:

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### TypeScript: Vertex AI Image Generation

```typescript
import { VertexAI } from "@google-cloud/vertexai";

const vertexai = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
});

async function generateImageVertexAI(prompt: string): Promise<Buffer | null> {
  const model = vertexai.getGenerativeModel({
    model: "imagen-3.0-generate-002",
  });

  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  // Extract image from response
  const candidate = response.response.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }
  return null;
}
```

## Rate Limits

### Gemini Developer API (Free Tier)

| Limit | Value |
|-------|-------|
| Requests per minute | ~15 RPM |
| Daily limit | Varies (undocumented) |
| Images per request | 1-4 |

### Gemini Developer API (Paid)

| Limit | Value |
|-------|-------|
| Requests per minute | Higher (project-dependent) |
| Daily limit | No hard cap |
| Images per request | 1-4 |

### Vertex AI (Standard PayGo)

| Limit | Value |
|-------|-------|
| Requests per minute | Dynamic (per-project quota) |
| Daily limit | No hard cap |
| Images per request | 1-8 |
| Quota increase | Available via Cloud Console |

Rate limits on Vertex AI are dynamic rather than fixed. A 429 error indicates temporary resource contention, not a hard quota breach. Implement exponential backoff for retry logic.

## Atlas UX Integration Notes

### Using Existing GEMINI_API_KEY

The Atlas UX backend already has `GEMINI_API_KEY` configured in the environment. The Gemini Developer API path requires no additional credentials or Google Cloud setup:

```typescript
// In Atlas UX service layer
import { GoogleGenAI, Modality } from "@google/genai";

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Use directly — no Google Cloud project needed
```

### Per-Tenant Credential Resolution

For multi-tenant support, leverage the existing `credentialResolver` service to allow tenants to bring their own Google API keys:

```typescript
import { resolveCredential } from "../services/credentialResolver.js";

async function getGoogleGenAI(tenantId: string) {
  const apiKey = await resolveCredential(tenantId, "GEMINI_API_KEY");
  return new GoogleGenAI({ apiKey });
}
```

### Safety Setting Recommendations

For Atlas UX (trade business marketing content):

```typescript
const safetyConfig = {
  personGeneration: "allow_adult",      // Allow people in trade/service photos
  safetySetting: "block_medium_and_above", // Block clearly inappropriate content
};
```

### Error Handling

```typescript
async function generateWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<Buffer | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateImageWithImagen(prompt);
    } catch (error: any) {
      if (error.status === 429) {
        // Rate limited — exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (error.status === 400) {
        // Prompt rejected by safety filters — do not retry
        throw new Error(`Prompt rejected by safety filters: ${error.message}`);
      }
      throw error;
    }
  }
  return null;
}
```


---
## Media

> **Tags:** `google` · `imagen` · `imagen-3` · `vertex-ai` · `ai-image` · `gemini` · `deepmind`

### Official Resources
- [Official Documentation](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Gallery / Showcase](https://deepmind.google/technologies/imagen-3/)
- [Google Vertex AI - Imagen Overview](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [DeepMind - Imagen 3](https://deepmind.google/technologies/imagen-3/)
- [Google AI Studio](https://aistudio.google.com)

### Video Tutorials
- [Google Imagen 3 - Complete Tutorial](https://www.youtube.com/results?search_query=google+imagen+3+tutorial+2025) — *Credit: Google Cloud on YouTube* `tutorial`
- [Google AI Image Generation in Gemini](https://www.youtube.com/results?search_query=google+gemini+image+generation+tutorial) — *Credit: Google on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
