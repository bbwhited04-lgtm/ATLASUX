---
title: "Freepik AI API Integration"
platform: "freepik-ai"
category: "image-gen"
tags: ["freepik-ai", "ai-image", "api", "integration", "developer", "mcp", "atlas-ux"]
---

# Freepik AI API Integration

## API Overview

Freepik offers a developer API that provides programmatic access to its AI image generation, stock library search, and AI editing capabilities. The API is designed as a pay-as-you-go service with no mandatory subscription, making it accessible for integration into external platforms.

**Base documentation:** https://docs.freepik.com/introduction
**API portal:** https://www.freepik.com/api
**API pricing:** https://docs.freepik.com/pricing

## API Capabilities

The Freepik API exposes three primary categories of functionality:

### AI Image Generation

- Generate HD images using Freepik's AI models (Flux, Mystic, Classic)
- Text-to-image generation with style and parameter controls
- Fast generation times suitable for production workloads
- Output in standard image formats (PNG, JPEG)

### Stock Library Search

- Search Freepik's 40M+ asset library programmatically
- Filter by type (vector, photo, PSD, icon), license, orientation, color
- Download assets directly via API
- Useful for hybrid workflows combining stock and AI-generated content

### AI Editing and Enhancement

- Image upscaling via AI models
- Background removal
- Automated image editing operations at scale
- Suitable for batch processing pipelines

## Authentication

API access requires an API key obtained through the Freepik developer portal. Authentication is handled via API key in request headers. The key is separate from consumer subscription credentials --- you need to register specifically for API access.

## MCP Server Integration

Freepik provides an official Model Context Protocol (MCP) server, available as an open-source project on GitHub:

**Repository:** https://github.com/freepik-company/freepik-mcp

The MCP server enables AI assistants (Claude, Cursor, and similar tools) to interact with Freepik's APIs through function calling. Capabilities include:

- Generating images from AI assistant conversations
- Searching the stock library from within AI workflows
- Managing visual resources without leaving the AI interface

This is particularly relevant for Atlas UX, as it means Freepik generation could be triggered directly through agent tool calls without building a custom API integration from scratch.

## Integration Options for Atlas UX

### Option 1: Direct API Integration

Integrate Freepik's REST API directly into the Atlas UX backend as a service module, similar to the existing ElevenLabs integration pattern.

**Implementation approach:**
- Create a `services/freepik.ts` service file
- Store the Freepik API key in `tenant_credentials` (encrypted via `credentialResolver.ts`)
- Expose generation endpoints through a route file registered under `/v1/freepik`
- Use the credential resolver's per-tenant lookup to support multi-tenant API key management

**Relevant endpoints:**
- Text-to-image generation for marketing content creation
- Stock search for supplementing AI-generated content
- Image upscaling for enhancing generated outputs

**Considerations:**
- API pricing is usage-based, so per-tenant cost tracking would be needed
- Generation latency is typically under 10 seconds, suitable for synchronous request/response
- For batch generation jobs, use the existing job queue system

### Option 2: MCP Server Integration

Leverage Freepik's official MCP server to enable Atlas UX agents to generate images through tool calls.

**Implementation approach:**
- Configure the Freepik MCP server as a tool source for Atlas UX agents
- Agents like Binky (CRO) or content-focused agents could invoke image generation as part of marketing workflows
- The MCP approach requires less custom code but offers less control over the integration

**Considerations:**
- MCP integration is newer and may have stability considerations
- Less granular control over caching, error handling, and retry logic
- Better suited for agent-driven workflows than user-facing API endpoints

### Option 3: Hybrid Approach

Use the direct API for user-facing features (content creation tools, marketing dashboards) and the MCP server for agent-driven autonomous content generation.

## API Rate Limits and Quotas

Specific rate limits are documented at the API pricing page. General expectations:

- Rate limits are tied to API plan tier
- Concurrent request limits apply
- Credit consumption varies by model and output resolution
- No hard daily caps beyond credit allocation

## Environment Variables Required

For Atlas UX integration, the following environment variables would be needed:

```
FREEPIK_API_KEY=<api-key-from-developer-portal>
```

Per-tenant keys should be stored encrypted in the `tenant_credentials` table following the existing pattern used for other service integrations.

## Code Example: Basic Generation Request

```typescript
// Conceptual integration following Atlas UX patterns
import { credentialResolver } from "../services/credentialResolver.js";

async function generateImage(tenantId: string, prompt: string, model: string = "flux") {
  const apiKey = await credentialResolver.resolve(tenantId, "FREEPIK_API_KEY");

  const response = await fetch("https://api.freepik.com/v1/ai/text-to-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-freepik-api-key": apiKey,
    },
    body: JSON.stringify({
      prompt,
      model,
      num_images: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Freepik API error: ${response.status}`);
  }

  return response.json();
}
```

**Note:** The above is a conceptual example. Consult the official API documentation at `docs.freepik.com` for current endpoint paths, request schemas, and response formats before implementing.


---
## Media

> **Tags:** `freepik` · `ai-image` · `stock` · `mystic` · `flux` · `commercial`

### Official Resources
- [Official Documentation](https://www.freepik.com/ai/image-generator)
- [Gallery / Showcase](https://www.freepik.com/ai/image-generator)
- [Freepik AI Image Generator](https://www.freepik.com/ai/image-generator)
- [Freepik Mystic](https://www.freepik.com/ai/image-generator)

### Video Tutorials
- [Freepik AI Image Generator - Mystic Tutorial](https://www.youtube.com/results?search_query=freepik+ai+image+generator+mystic+tutorial) — *Credit: Freepik on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
