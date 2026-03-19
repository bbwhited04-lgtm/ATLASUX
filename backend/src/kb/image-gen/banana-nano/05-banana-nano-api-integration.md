---
title: "Nano Banana Pro API Integration Guide"
platform: "banana-nano"
category: "image-gen"
tags: ["banana-nano", "nano-banana-pro", "api", "integration", "typescript", "gemini-api", "google-genai"]
updated: "2026-03-19"
---

# Nano Banana Pro API Integration Guide

## Overview

Nano Banana Pro is accessed through the Google Gemini API. There is no separate "Nano Banana API" -- it is the Gemini API with an image-capable model ID. Authentication uses a Google AI API key (for Google AI Studio) or Google Cloud service account credentials (for Vertex AI).

## Authentication

### Google AI Studio (Recommended for Development)

Obtain an API key from [Google AI Studio](https://aistudio.google.com/apikey). No credit card required for free-tier access.

### Vertex AI (Recommended for Production)

Use Google Cloud service account credentials with the Vertex AI API enabled. Requires a Google Cloud project with billing.

## SDK Installation

```bash
npm install @google/genai
```

The `@google/genai` package is the official Google GenAI SDK for JavaScript/TypeScript. Minimum version 1.30+ is required for Nano Banana Pro support.

## Model IDs

| Model | ID | Use Case |
|-------|----|----------|
| Nano Banana Pro | `gemini-3-pro-image-preview` | Professional quality, best text rendering |
| Nano Banana 2 | `gemini-3.1-flash-image-preview` | Fast generation, search grounding |
| Nano Banana | `gemini-2.5-flash-image` | Budget/speed tier |

## API Endpoints

All requests go through the Gemini API's `generateContent` endpoint:

- **Google AI Studio:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Vertex AI:** `https://{region}-aiplatform.googleapis.com/v1/projects/{project}/locations/{region}/publishers/google/models/{model}:generateContent`

## Basic Image Generation (TypeScript)

```typescript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateImage(prompt: string, outputPath: string): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
  }

  return null;
}

// Usage
await generateImage(
  'A professional photo of a plumber in a blue uniform. His name badge reads "Atlas Home Services."',
  "output.png"
);
```

## Image Generation with Aspect Ratio

```typescript
async function generateWithAspectRatio(
  prompt: string,
  aspectRatio: string,
  outputPath: string
): Promise<string | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: aspectRatio, // "1:1", "16:9", "9:16", "4:3", "3:4"
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
  }

  return null;
}

// Generate a wide banner
await generateWithAspectRatio(
  'A promotional banner for "Lucy AI Receptionist" with navy blue background and gold text reading "Never Miss a Call Again"',
  "16:9",
  "banner.png"
);
```

## Image Editing (Multi-Turn Conversation)

```typescript
async function editImage(
  imagePath: string,
  editInstruction: string,
  outputPath: string
): Promise<string | null> {
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [
      {
        role: "user",
        parts: [
          { text: editInstruction },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, "base64");
      fs.writeFileSync(outputPath, buffer);
      return outputPath;
    }
  }

  return null;
}

// Edit an existing image
await editImage(
  "original-photo.png",
  "Change the background to a modern office setting and add warm lighting",
  "edited-photo.png"
);
```

## Multi-Turn Conversational Editing (Chat Session)

```typescript
async function conversationalEdit(): Promise<void> {
  const chat = ai.chats.create({
    model: "gemini-3-pro-image-preview",
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  // Turn 1: Generate base image
  const response1 = await chat.sendMessage({
    message: "Generate a professional headshot of a friendly female AI assistant wearing a modern headset. Clean white background.",
  });
  saveImageFromResponse(response1, "lucy-v1.png");

  // Turn 2: Refine
  const response2 = await chat.sendMessage({
    message: "Change the background to a soft blue gradient. Add a subtle glow around the headset.",
  });
  saveImageFromResponse(response2, "lucy-v2.png");

  // Turn 3: Add branding
  const response3 = await chat.sendMessage({
    message: 'Add the text "Meet Lucy" in navy blue below the portrait, and "Your AI Receptionist" in gold underneath.',
  });
  saveImageFromResponse(response3, "lucy-v3.png");
}

function saveImageFromResponse(response: any, path: string): void {
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      fs.writeFileSync(path, Buffer.from(part.inlineData.data, "base64"));
    }
  }
}
```

## Atlas UX Integration Pattern

For Atlas UX agents to use Nano Banana Pro, the integration should follow the existing credential resolver pattern and route structure.

### Service Layer (`services/nanoBanana.ts`)

```typescript
import { GoogleGenAI } from "@google/genai";
import { resolveCredential } from "./credentialResolver.js";

interface ImageGenResult {
  imageBuffer: Buffer;
  mimeType: string;
  textResponse?: string;
}

export async function generateNanoBananaImage(
  tenantId: string,
  prompt: string,
  options?: {
    model?: "pro" | "flash" | "flash2";
    aspectRatio?: string;
  }
): Promise<ImageGenResult | null> {
  const apiKey = await resolveCredential(tenantId, "GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("No Gemini API key configured for tenant");
  }

  const ai = new GoogleGenAI({ apiKey });

  const modelId =
    options?.model === "pro"
      ? "gemini-3-pro-image-preview"
      : options?.model === "flash2"
        ? "gemini-3.1-flash-image-preview"
        : "gemini-2.5-flash-image";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      ...(options?.aspectRatio && {
        imageConfig: { aspectRatio: options.aspectRatio },
      }),
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return {
        imageBuffer: Buffer.from(part.inlineData.data, "base64"),
        mimeType: part.inlineData.mimeType || "image/png",
        textResponse: response.candidates?.[0]?.content?.parts
          ?.find((p: any) => p.text)?.text,
      };
    }
  }

  return null;
}
```

### Route Handler (`routes/imageGenRoutes.ts`)

```typescript
import { FastifyPluginAsync } from "fastify";
import { generateNanoBananaImage } from "../services/nanoBanana.js";

const imageGenRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/image-gen/nano-banana", async (request, reply) => {
    const tenantId = request.headers["x-tenant-id"] as string;
    const { prompt, model, aspectRatio } = request.body as {
      prompt: string;
      model?: "pro" | "flash" | "flash2";
      aspectRatio?: string;
    };

    const result = await generateNanoBananaImage(tenantId, prompt, {
      model,
      aspectRatio,
    });

    if (!result) {
      return reply.code(422).send({ error: "Image generation failed" });
    }

    return reply.send({
      image: result.imageBuffer.toString("base64"),
      mimeType: result.mimeType,
      text: result.textResponse,
    });
  });
};

export default imageGenRoutes;
```

## Error Handling

Common error responses from the Gemini API:

| Error | Cause | Resolution |
|-------|-------|------------|
| `IMAGE_SAFETY` | Content safety filter triggered | Rephrase prompt to avoid flagged content |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement exponential backoff |
| `INVALID_ARGUMENT` | Bad model ID or config | Check model ID and config structure |
| `RESOURCE_EXHAUSTED` | Quota exceeded | Upgrade plan or wait for quota reset |
| `RECITATION` | Output too similar to training data | Rephrase prompt for more originality |

### Retry Logic

```typescript
async function generateWithRetry(
  prompt: string,
  maxRetries = 3
): Promise<ImageGenResult | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateNanoBananaImage("tenant-id", prompt, { model: "pro" });
    } catch (err: any) {
      if (err.status === 429) {
        // Rate limited -- exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      if (err.message?.includes("IMAGE_SAFETY")) {
        // Content filter -- do not retry, prompt needs adjustment
        throw new Error("Content safety filter triggered. Adjust prompt.");
      }
      throw err;
    }
  }
  return null;
}
```

## Environment Variables

Add to `backend/.env`:

```
GEMINI_API_KEY=your-google-ai-studio-api-key
```

This key is already referenced in the Atlas UX `env.ts` configuration. The credential resolver will check `tenant_credentials` first, then fall back to `process.env.GEMINI_API_KEY` for the platform owner tenant.


---
## Media

> **Tags:** `banana` · `nano` · `ai-image` · `serverless` · `gpu` · `inference` · `api`

### Official Resources
- [Official Documentation](https://www.banana.dev)
- [Banana Dev Documentation](https://www.banana.dev)

### Video Tutorials
- [Banana Dev - Serverless GPU Inference](https://www.youtube.com/results?search_query=banana+dev+serverless+gpu+inference+tutorial) — *Credit: Banana on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
