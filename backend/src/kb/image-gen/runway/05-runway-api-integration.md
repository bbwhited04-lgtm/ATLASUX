---
title: "Runway ML API Integration Guide"
platform: "runway"
category: "image-gen"
tags: ["runway", "ai-image", "api", "integration", "sdk", "gen4-image", "text-to-image"]
---

# Runway ML API Integration Guide

## Overview

Runway provides a REST API and official SDKs (JavaScript/Node.js and Python) for programmatic access to its generation models. The API supports text-to-image, image-to-video, and text-to-video generation. All API access is managed through the Runway Developer Portal at dev.runwayml.com.

## Authentication

API access requires an API key generated from the developer portal.

```
Authorization: Bearer RUNWAY_API_KEY
```

API keys are organization-scoped. Credits are purchased separately from subscription plans at $0.01 per credit through the developer portal.

## Available Image Generation Models

| Model ID | Type | Speed | Credit Cost |
|----------|------|-------|-------------|
| `gen4_image` | Text-to-Image | Standard | 5 credits (720p), 8 credits (1080p) |
| `gen4_image_turbo` | Text-to-Image | Fast (<10s) | 2 credits |

## JavaScript/Node.js SDK

### Installation

```bash
npm install --save @runwayml/sdk
```

### Text-to-Image Generation

```typescript
import RunwayML from "@runwayml/sdk";

const client = new RunwayML({
  apiKey: process.env.RUNWAY_API_KEY,
});

// Create a text-to-image task
const task = await client.textToImage.create({
  model: "gen4_image",
  promptText: "A cinematic wide shot of a lighthouse on a rocky cliff at sunset, dramatic cloud formations, shot on 35mm film with warm amber tones and natural lens flare",
  ratio: "16:9",
});

// Wait for the task to complete and get the output
const result = await task.waitForTaskOutput();
console.log(result); // Contains the generated image URL
```

### With Reference Images

```typescript
const task = await client.textToImage.create({
  model: "gen4_image",
  promptText: "Same character in a different pose, standing in a rain-soaked alley at night with neon reflections on wet pavement",
  ratio: "16:9",
  referenceImages: [
    { uri: "https://example.com/character-reference.jpg" },
  ],
});

const result = await task.waitForTaskOutput();
```

### Using Turbo for Fast Iteration

```typescript
const task = await client.textToImage.create({
  model: "gen4_image_turbo",
  promptText: "Minimalist product photograph of a matte black coffee mug on a white surface, soft studio lighting, centered composition",
  ratio: "1:1",
});

const result = await task.waitForTaskOutput();
```

## Python SDK

### Installation

```bash
pip install runwayml
```

### Text-to-Image Generation

```python
from runwayml import RunwayML

client = RunwayML(api_key="your-api-key")

task = client.text_to_image.create(
    model="gen4_image",
    prompt_text="A documentary-style photograph of a craftsman shaping pottery on a wheel, natural window light, shallow depth of field, shot on medium format digital",
    ratio="3:2",
)

result = task.wait_for_task_output()
print(result)
```

## REST API Direct

For environments where the SDK is not available:

```bash
# Create a text-to-image task
curl -X POST https://api.dev.runwayml.com/v1/text_to_image \
  -H "Authorization: Bearer $RUNWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gen4_image",
    "promptText": "A wide establishing shot of a futuristic city skyline at dusk",
    "ratio": "16:9"
  }'

# Response contains a task ID
# Poll for completion or use webhook callback
```

## Task Lifecycle

Runway API operations are asynchronous. The flow is:

1. **Create task** — Submit generation parameters, receive a task ID
2. **Poll or wait** — Use `waitForTaskOutput()` (SDK) or poll the task status endpoint
3. **Retrieve output** — Once complete, the response contains URLs to the generated assets

Task statuses: `PENDING` > `RUNNING` > `SUCCEEDED` | `FAILED`

## Aspect Ratios

Supported ratio values for image generation:

| Ratio | Use Case |
|-------|----------|
| `16:9` | Widescreen, cinematic, landscape |
| `9:16` | Vertical, mobile, stories |
| `1:1` | Square, social media, product |
| `4:3` | Classic film, documentary |
| `3:2` | Standard photography |

## Rate Limits and Quotas

- API credits are pay-as-you-go at $0.01 per credit
- Concurrent task limits depend on organization tier
- Failed tasks do not consume credits
- In-app purchases capped at $9,999; larger volumes require sales contact

## Atlas UX Integration Considerations

### Credential Storage

Store the Runway API key in the `tenant_credentials` table using the existing AES-256-GCM encryption via `credentialResolver.ts`. The credential key should be `RUNWAY_API_KEY`.

```typescript
// Resolve per-tenant Runway API key
const apiKey = await resolveCredential(tenantId, "RUNWAY_API_KEY");
```

### Service Layer Pattern

Follow the existing service pattern (similar to `services/elevenlabs.ts`):

```typescript
// backend/src/services/runway.ts
import RunwayML from "@runwayml/sdk";
import { resolveCredential } from "./credentialResolver.js";

export async function generateImage(
  tenantId: string,
  prompt: string,
  ratio: string = "16:9",
  model: string = "gen4_image"
) {
  const apiKey = await resolveCredential(tenantId, "RUNWAY_API_KEY");
  const client = new RunwayML({ apiKey });

  const task = await client.textToImage.create({
    model,
    promptText: prompt,
    ratio,
  });

  return task.waitForTaskOutput();
}
```

### Route Registration

Register under `/v1/runway` following the standard route pattern:

```typescript
// In server.ts
import { runwayRoutes } from "./routes/runwayRoutes.js";
await app.register(runwayRoutes, { prefix: "/v1/runway" });
```

### Cost Tracking

Log generation costs to the audit trail. At $0.01/credit:
- Standard image: $0.05-$0.08
- Turbo image: $0.02
- Track against `AUTO_SPEND_LIMIT_USD` for approval workflow compliance

### Error Handling

```typescript
try {
  const result = await generateImage(tenantId, prompt);
  return result;
} catch (err) {
  if (err.status === 429) {
    fastify.log.warn({ tenantId }, "Runway rate limit hit");
    // Queue for retry via job system
  }
  fastify.log.error({ err }, "Runway image generation failed");
  throw err;
}
```

## API Documentation

- Full API reference: https://docs.dev.runwayml.com/api/
- Getting started: https://docs.dev.runwayml.com/guides/using-the-api/
- Available models: https://docs.dev.runwayml.com/guides/models/
- SDK (npm): https://www.npmjs.com/package/@runwayml/sdk
- SDK (Python): https://github.com/runwayml/sdk-python
- Developer portal: https://dev.runwayml.com/


---
## Media

> **Tags:** `runway` · `gen-3` · `ai-image` · `ai-video` · `multi-modal` · `inpainting` · `video-editing`

### Official Resources
- [Official Documentation](https://docs.runwayml.com)
- [Gallery / Showcase](https://runwayml.com/research)
- [Runway Documentation](https://docs.runwayml.com)
- [Runway Research](https://runwayml.com/research)
- [Runway Academy](https://academy.runwayml.com)

### Video Tutorials
- [Runway Gen-3 Alpha Tutorial - AI Video & Image](https://www.youtube.com/results?search_query=runway+gen-3+alpha+tutorial+2025) — *Credit: Runway on YouTube* `tutorial`
- [Runway ML Complete Guide for Creators](https://www.youtube.com/results?search_query=runway+ml+complete+guide+creators) — *Credit: AI Video on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
