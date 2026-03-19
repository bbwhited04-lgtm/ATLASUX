---
title: "DALL-E 3 API Integration Guide"
platform: "dall-e-3"
category: "image-gen"
tags: ["dall-e-3", "openai", "ai-image", "api", "typescript", "integration", "atlas-ux"]
---

# DALL-E 3 API Integration Guide

## API Overview

DALL-E 3 is accessed through the OpenAI Images API. Only the generations endpoint is supported (no edits or variations for DALL-E 3).

- **Endpoint:** `POST https://api.openai.com/v1/images/generations`
- **Authentication:** Bearer token via `Authorization` header
- **Model identifier:** `dall-e-3`
- **Batch size:** `n=1` only (one image per request)
- **Response formats:** `url` (temporary URL, expires after 1 hour) or `b64_json` (base64-encoded image data)

**Deprecation Notice:** DALL-E 3 will be deprecated on May 12, 2026. Plan migration to `gpt-image-1` or `gpt-image-1.5`.

## Request Format

```typescript
interface DallE3Request {
  model: "dall-e-3";
  prompt: string;           // Max 4000 characters
  n: 1;                     // Only 1 supported for DALL-E 3
  size: "1024x1024" | "1024x1792" | "1792x1024";
  quality: "standard" | "hd";
  style: "vivid" | "natural";
  response_format?: "url" | "b64_json";  // Default: "url"
  user?: string;            // End-user ID for abuse tracking
}
```

## Response Format

```typescript
interface DallE3Response {
  created: number;           // Unix timestamp
  data: Array<{
    url?: string;            // Temporary URL (expires ~1 hour)
    b64_json?: string;       // Base64-encoded PNG
    revised_prompt: string;  // The prompt DALL-E 3 actually used (after GPT-4 rewriting)
  }>;
}
```

The `revised_prompt` field is important — DALL-E 3 rewrites your prompt internally via GPT-4 to improve image quality. The revised version is returned so you can see exactly what was generated.

## Error Handling

### Common Error Codes

| HTTP Status | Error Type | Cause | Resolution |
|------------|-----------|-------|-----------|
| 400 | `invalid_request_error` | Malformed request, invalid parameters | Check request body format |
| 400 | `image_generation_user_error` | Content policy violation | Rephrase prompt to avoid flagged content |
| 401 | `authentication_error` | Invalid or missing API key | Verify API key |
| 429 | `rate_limit_exceeded` | Too many requests | Implement exponential backoff |
| 500 | `server_error` | OpenAI internal error | Retry with backoff |
| 503 | `service_unavailable` | Model overloaded | Retry after delay |

### Error Response Format

```typescript
interface DallE3Error {
  error: {
    message: string | null;
    type: string;
    param: string | null;
    code: string | null;
  };
}
```

**Note:** Content policy rejections (400) often return `message: null` with `type: "image_generation_user_error"`, providing no specific guidance on what triggered the filter. Implement user-friendly error messages on your side.

## Rate Limits

Rate limits vary by OpenAI usage tier:

| Tier | Images Per Minute (IPM) | Notes |
|------|------------------------|-------|
| Free | 1 | Extremely limited |
| Tier 1 | 7 | Default for new paid accounts |
| Tier 2 | 7 | Same as Tier 1 |
| Tier 3 | 7 | Same |
| Tier 4 | 15 | Higher volume |
| Tier 5 | 50 | Enterprise-grade |

Rate limit headers are returned with every response:
- `x-ratelimit-limit-requests`
- `x-ratelimit-remaining-requests`
- `x-ratelimit-reset-requests`

## Content Policy

DALL-E 3 will reject prompts that request:
- Images of real, named public figures
- Copyrighted characters (Disney, Marvel, etc.)
- Violent, gory, or graphic content
- Sexually explicit or suggestive content
- Hateful or discriminatory imagery
- Deceptive content (deepfakes, misinformation)

There is no content policy "level" parameter — the filters are always active and cannot be relaxed via the API.

## TypeScript Integration Examples

### Basic Image Generation

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(prompt: string, options?: {
  size?: "1024x1024" | "1024x1792" | "1792x1024";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}): Promise<{ url: string; revisedPrompt: string }> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: options?.size ?? "1024x1024",
    quality: options?.quality ?? "standard",
    style: options?.style ?? "vivid",
    response_format: "url",
  });

  const image = response.data[0];
  return {
    url: image.url!,
    revisedPrompt: image.revised_prompt,
  };
}
```

### With Retry and Error Handling

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerateResult {
  success: boolean;
  url?: string;
  revisedPrompt?: string;
  error?: string;
  errorType?: "content_policy" | "rate_limit" | "server_error" | "unknown";
}

async function generateImageWithRetry(
  prompt: string,
  options?: {
    size?: "1024x1024" | "1024x1792" | "1792x1024";
    quality?: "standard" | "hd";
    style?: "vivid" | "natural";
  },
  maxRetries = 3
): Promise<GenerateResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options?.size ?? "1024x1024",
        quality: options?.quality ?? "standard",
        style: options?.style ?? "vivid",
        response_format: "url",
      });

      const image = response.data[0];
      return {
        success: true,
        url: image.url!,
        revisedPrompt: image.revised_prompt,
      };
    } catch (err) {
      if (err instanceof OpenAI.APIError) {
        // Content policy — do not retry
        if (err.status === 400) {
          return {
            success: false,
            error: "Image generation was blocked by content policy. Try rephrasing your prompt.",
            errorType: "content_policy",
          };
        }

        // Rate limit — exponential backoff
        if (err.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          return {
            success: false,
            error: "Rate limit exceeded. Please try again in a moment.",
            errorType: "rate_limit",
          };
        }

        // Server error — retry
        if (err.status === 500 || err.status === 503) {
          if (attempt < maxRetries - 1) {
            const delay = Math.pow(2, attempt) * 2000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          return {
            success: false,
            error: "OpenAI service is temporarily unavailable.",
            errorType: "server_error",
          };
        }
      }

      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        errorType: "unknown",
      };
    }
  }

  return { success: false, error: "Max retries exceeded", errorType: "unknown" };
}
```

### Base64 Response (For Direct Storage)

```typescript
async function generateImageBase64(prompt: string): Promise<Buffer> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    response_format: "b64_json",
  });

  const base64Data = response.data[0].b64_json!;
  return Buffer.from(base64Data, "base64");
}
```

## Atlas UX Integration Pattern

### Using credentialResolver for Per-Tenant API Keys

In the Atlas UX architecture, API keys are resolved per-tenant via `credentialResolver`. Here is how DALL-E 3 integration would work within the platform:

```typescript
import { resolveCredential } from "../services/credentialResolver.js";
import OpenAI from "openai";

async function generateImageForTenant(
  tenantId: string,
  prompt: string,
  options?: {
    size?: "1024x1024" | "1024x1792" | "1792x1024";
    quality?: "standard" | "hd";
    style?: "vivid" | "natural";
  }
): Promise<{ url: string; revisedPrompt: string; costUsd: number }> {
  // Resolve tenant-specific or platform-fallback OpenAI key
  const apiKey = await resolveCredential(tenantId, "OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("No OpenAI API key configured for this tenant");
  }

  const openai = new OpenAI({ apiKey });

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: options?.size ?? "1024x1024",
    quality: options?.quality ?? "standard",
    style: options?.style ?? "vivid",
    response_format: "url",
  });

  // Calculate cost for ledger entry
  const costUsd = calculateImageCost(
    options?.size ?? "1024x1024",
    options?.quality ?? "standard"
  );

  return {
    url: response.data[0].url!,
    revisedPrompt: response.data[0].revised_prompt,
    costUsd,
  };
}

function calculateImageCost(
  size: string,
  quality: string
): number {
  const pricing: Record<string, Record<string, number>> = {
    standard: {
      "1024x1024": 0.040,
      "1024x1792": 0.080,
      "1792x1024": 0.080,
    },
    hd: {
      "1024x1024": 0.080,
      "1024x1792": 0.120,
      "1792x1024": 0.120,
    },
  };
  return pricing[quality]?.[size] ?? 0.040;
}
```

### Cost Tracking via LedgerEntry

After generating an image, log the cost to the ledger for spend tracking and approval workflows:

```typescript
import { prisma } from "../db/prisma.js";

async function logImageGenCost(
  tenantId: string,
  costUsd: number,
  prompt: string,
  model: string = "dall-e-3"
): Promise<void> {
  await prisma.ledgerEntry.create({
    data: {
      tenant_id: tenantId,
      category: "ai_image_gen",
      vendor: "openai",
      model,
      amount_usd: costUsd,
      description: `Image generation: ${prompt.substring(0, 100)}`,
      created_at: new Date(),
    },
  });
}
```

### Integration with Decision Memos

If image generation spend exceeds `AUTO_SPEND_LIMIT_USD` or is part of a batch operation, the Atlas UX approval workflow requires a `decision_memo` before execution:

```typescript
const AUTO_SPEND_LIMIT = parseFloat(process.env.AUTO_SPEND_LIMIT_USD ?? "10");

async function generateWithApproval(
  tenantId: string,
  prompts: string[],
  options?: { quality?: "standard" | "hd" }
): Promise<void> {
  const estimatedCost = prompts.length * calculateImageCost(
    "1024x1024",
    options?.quality ?? "standard"
  );

  if (estimatedCost > AUTO_SPEND_LIMIT) {
    // Create decision memo for approval
    await prisma.decisionMemo.create({
      data: {
        tenant_id: tenantId,
        action: "batch_image_generation",
        estimated_cost_usd: estimatedCost,
        description: `Generate ${prompts.length} images via DALL-E 3`,
        status: "pending",
        risk_tier: estimatedCost > 50 ? 2 : 1,
      },
    });
    // Execution will proceed after approval in the engine loop
    return;
  }

  // Under spend limit — execute immediately
  for (const prompt of prompts) {
    await generateImageForTenant(tenantId, prompt, options);
  }
}
```

## Migration Notes

When migrating from DALL-E 3 to GPT Image 1 / 1.5:

1. **Endpoint changes:** GPT Image models use the same `/v1/images/generations` endpoint but with `model: "gpt-image-1"` or `model: "gpt-image-1.5"`.
2. **Pricing model changes:** GPT Image uses token-based pricing (input + output tokens) rather than flat per-image rates.
3. **New capabilities:** GPT Image supports image editing, inpainting, and multi-image input — features DALL-E 3 lacks.
4. **Batch size:** GPT Image 1 supports `n > 1`, unlike DALL-E 3's `n=1` limitation.
5. **Update cost calculations:** The `calculateImageCost` function will need to be rewritten for token-based pricing.


---
## Media

> **Tags:** `dall-e` · `dall-e-3` · `openai` · `chatgpt` · `ai-image` · `text-to-image` · `api`

### Platform
![dall-e-3 logo](https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg)
*Source: Official dall-e-3 branding — [dall-e-3](https://platform.openai.com/docs/guides/images)*

### Official Resources
- [Official Documentation](https://platform.openai.com/docs/guides/images)
- [Gallery / Showcase](https://openai.com/index/dall-e-3/)
- [DALL-E 3 API Documentation](https://platform.openai.com/docs/guides/images)
- [DALL-E 3 Research Page](https://openai.com/index/dall-e-3/)
- [Using DALL-E in ChatGPT](https://help.openai.com/en/articles/9055440-using-dall-e-in-chatgpt)

### Video Tutorials
- [DALL-E 3 Complete Tutorial - Generate Images with ChatGPT](https://www.youtube.com/results?search_query=dall-e+3+complete+tutorial+chatgpt+images) — *Credit: OpenAI on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
