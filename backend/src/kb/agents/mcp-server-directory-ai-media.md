# MCP Servers for AI & Media Generation

## Overview

AI and media MCP servers give agents the ability to generate, transform, and manage multimedia content — voice synthesis, image generation, video creation, and model inference. These servers bridge the gap between conversational AI and creative production, enabling workflows where an AI agent can script, generate, and publish media assets without manual tool switching.

For Atlas UX, these integrations are central to Lucy's voice capabilities and the platform's content generation pipeline.

## ElevenLabs MCP Server

**What it does:** Voice synthesis, voice cloning, and conversational AI agent management through ElevenLabs. This is the backbone of Lucy's voice — every phone call runs through ElevenLabs' Conversational AI platform.

**Key tools exposed:**
- `text_to_speech` — convert text to natural speech audio
- `create_voice` / `list_voices` — voice management and cloning
- `create_agent` / `update_agent` — conversational AI agent lifecycle
- `get_conversation_history` — retrieve past conversations
- `manage_phone_numbers` — phone number assignment for voice agents
- `get_usage` — API usage and billing information

**Cost implications:** ElevenLabs pricing is usage-based. Text-to-speech costs per character, and conversational AI costs per minute of phone time. At scale, voice costs can be significant — monitor usage closely. Atlas UX passes these costs through at $99/month flat rate per tenant.

**Setup:**
```json
{
  "mcpServers": {
    "elevenlabs": {
      "command": "npx",
      "args": ["-y", "@anthropic/elevenlabs-mcp-server"],
      "env": {
        "ELEVENLABS_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Atlas UX's Lucy uses ElevenLabs for every inbound call. The MCP server enables programmatic agent creation per tenant — when a new business signs up, the system creates a custom ElevenLabs agent with that business's persona, greeting, and available tools (book appointment, send SMS, take message). The integration lives in `services/elevenlabs.ts` and `routes/elevenlabsRoutes.ts`.

## Replicate MCP Server

**What it does:** Run machine learning models hosted on Replicate's infrastructure. Access thousands of open-source models for image generation, video creation, audio processing, and text analysis without managing GPU infrastructure.

**Key tools exposed:**
- `run_model` — execute any Replicate-hosted model
- `create_prediction` — start async model inference
- `get_prediction` — check prediction status and retrieve results
- `list_models` — browse available models
- `search_models` — find models by description

**Cost implications:** Pay-per-inference pricing based on GPU time. Image generation models typically cost $0.01-0.05 per image. Video models are significantly more expensive — $0.10-1.00+ per generation depending on duration and quality.

**Setup:**
```json
{
  "mcpServers": {
    "replicate": {
      "command": "npx",
      "args": ["-y", "mcp-replicate"],
      "env": {
        "REPLICATE_API_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

**Use case:** On-demand media generation. An AI agent can select the best model for a task (Flux for images, Stable Video Diffusion for video, Whisper for transcription), run inference, and incorporate results into larger workflows. Useful for generating marketing assets, processing customer audio, or creating visual content.

## Hugging Face MCP Server

**What it does:** Access to Hugging Face's model hub and inference API. Run models, search the hub, and access datasets from the largest open-source ML community.

**Key tools exposed:**
- `inference` — run models through the Inference API
- `search_models` — find models on the Hub
- `get_model_info` — model details and documentation
- `list_datasets` — browse available datasets
- `search_papers` — find ML research papers

**Cost implications:** The free Inference API has rate limits. Pro accounts ($9/month) get higher limits. Dedicated endpoints for production use start at ~$0.06/hour for small models.

**Setup:**
```json
{
  "mcpServers": {
    "huggingface": {
      "command": "npx",
      "args": ["-y", "mcp-huggingface"],
      "env": {
        "HF_TOKEN": "<your-hf-token>"
      }
    }
  }
}
```

**Use case:** Model exploration and prototyping. When evaluating different models for a feature (comparing embedding models, testing classifiers, evaluating summarization quality), the AI can run inference against multiple models and compare results directly.

## Stability AI MCP Server

**What it does:** Image generation and editing through Stability AI's APIs — Stable Diffusion, SDXL, and Stable Image models for text-to-image, image-to-image, inpainting, and upscaling.

**Key tools exposed:**
- `generate_image` — text-to-image generation
- `image_to_image` — modify existing images with prompts
- `inpaint` — edit specific regions of images
- `upscale` — increase image resolution
- `remove_background` — background removal

**Cost implications:** Credit-based pricing. Standard generation costs 3-6 credits per image (~$0.03-0.06). Upscaling and specialized operations cost more. Free tier includes limited credits for testing.

**Setup:**
```json
{
  "mcpServers": {
    "stability": {
      "command": "npx",
      "args": ["-y", "mcp-stability-ai"],
      "env": {
        "STABILITY_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Marketing asset creation. An AI agent can generate blog post cover images, social media graphics, and promotional materials with specific styling and branding. Inpainting and image-to-image enable iterative refinement without starting from scratch.

## Midjourney Community Server

**What it does:** Community-built integration with Midjourney's image generation service. Note that Midjourney does not have an official API — community servers typically work through Discord bot interaction or unofficial endpoints.

**Key tools exposed:**
- `imagine` — generate images from text prompts
- `variations` — create variations of generated images
- `upscale` — upscale selected images
- `describe` — generate prompts from images

**Cost implications:** Requires a Midjourney subscription ($10-60/month depending on plan). Community servers may have additional limitations or terms of service considerations.

**Setup:** Varies by implementation. Community servers typically require Midjourney credentials and may use proxy approaches. Check the specific server's documentation for current setup instructions.

**Use case:** High-quality artistic image generation. Midjourney excels at stylized, creative imagery that works well for brand assets and social media content. The community server enables AI agents to generate these assets programmatically.

## RunwayML MCP Server

**What it does:** Video generation and editing through Runway's Gen-3 and other models. Text-to-video, image-to-video, and video editing capabilities.

**Key tools exposed:**
- `generate_video` — text-to-video or image-to-video generation
- `get_generation_status` — check video generation progress
- `list_generations` — view past generations

**Cost implications:** Video generation is expensive. Runway charges per second of generated video, typically $0.05-0.50 per second depending on the model and resolution. A 4-second clip can cost $0.20-2.00. Budget carefully for production use.

**Setup:**
```json
{
  "mcpServers": {
    "runway": {
      "command": "npx",
      "args": ["-y", "mcp-runway"],
      "env": {
        "RUNWAY_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Creating short promotional videos, social media clips, and visual content. The AI agent can script the video concept, generate it through Runway, and prepare it for publishing — all in one workflow. Atlas UX's video generation KB at `backend/src/kb/video-gen/` documents the full treatment pipeline.

## Media Pipeline MCP Server

**What it does:** Asset creation and management for media production workflows. Handles the orchestration layer between generation and publishing.

**Key tools exposed:**
- `create_asset` — create and register media assets in a pipeline

**Setup:**
```json
{
  "mcpServers": {
    "media-pipeline": {
      "command": "npx",
      "args": ["-y", "@anthropic/media-pipeline-mcp-server"]
    }
  }
}
```

**Use case:** Production workflows where generated media needs to be tracked, tagged, and routed through approval processes. The media pipeline server acts as the coordination layer between generation servers (ElevenLabs, Stability, Runway) and publishing destinations (social media, websites, CMS).

## Atlas UX Wiki MCP

**What it does:** Atlas UX exposes its own knowledge base through MCP-compatible endpoints at wiki.atlasux.cloud. This gives AI agents within the Atlas ecosystem direct access to platform documentation, agent configurations, and support articles.

**Key tools exposed:**
- `search_articles` — search the Atlas UX knowledge base
- `read_article` — retrieve specific KB articles
- `query_agent_config` — access agent role definitions and policies

**Cost implications:** No additional cost — this is an internal platform feature included with Atlas UX.

**Use case:** Lucy and other Atlas agents reference the wiki during customer interactions and internal operations. When Lucy encounters a question about a feature or policy, she queries the wiki MCP for the relevant article rather than relying solely on prompt-embedded knowledge. This keeps responses current as the KB is updated.

## Cost Management for Media MCP Servers

Media generation through MCP servers can accumulate costs quickly. Best practices:

1. **Set budget alerts** on all API accounts (ElevenLabs, Replicate, Stability, Runway)
2. **Cache generated assets** — never regenerate the same content twice
3. **Use the cheapest model that meets quality requirements** — SDXL before Midjourney, Replicate open-source before proprietary APIs
4. **Implement approval gates** for expensive operations — Atlas UX's decision memo system catches spend above `AUTO_SPEND_LIMIT_USD`
5. **Monitor usage daily** during ramp-up, weekly once patterns stabilize

## Resources

- https://elevenlabs.io/docs — ElevenLabs API documentation for voice synthesis and conversational AI
- https://replicate.com/docs — Replicate model hosting platform documentation
- https://platform.stability.ai/docs/api-reference — Stability AI API reference for image generation

## Image References

1. AI voice synthesis pipeline from text to speech audio waveform — search: "text to speech synthesis pipeline architecture"
2. Image generation workflow from prompt to final asset — search: "AI image generation workflow prompt to image"
3. Media production pipeline with AI generation and approval stages — search: "AI media production pipeline automated content creation"
4. ElevenLabs conversational AI agent architecture — search: "ElevenLabs conversational AI architecture diagram"
5. Multi-model media generation comparing different AI providers — search: "AI model comparison image video generation providers"

## Video References

1. https://www.youtube.com/watch?v=7EhR_HGq00c — "ElevenLabs Conversational AI: Build Voice Agents That Answer Phones"
2. https://www.youtube.com/watch?v=FQPEni0mGYs — "AI Media Generation Pipeline: From Prompt to Published Content"
