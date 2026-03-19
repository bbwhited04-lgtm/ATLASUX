# Image Tools — Generation, Editing, and Analysis for AI Agents

## The Visual Stack

Image tools span four capabilities: **generation** (create from text), **editing** (modify existing), **analysis** (understand content), and **optimization** (prepare for deployment). A well-equipped agent needs tools from each category.

## Image Generation Tools

### Major Providers

| Provider | Model | Cost/Image | Resolution | Strengths |
|----------|-------|-----------|------------|-----------|
| **OpenAI** | DALL-E 3 | $0.04-0.12 | 1024×1024 to 1792×1024 | Text rendering, prompt adherence |
| **OpenAI** | GPT-Image (gpt-image-1) | $0.02-0.19 | Up to 4096×4096 | Highest quality, multimodal native |
| **Stability AI** | Stable Diffusion 3 | $0.03-0.06 | Up to 2048×2048 | Fine-tunable, self-hostable |
| **Black Forest Labs** | FLUX Pro | $0.05 | Up to 1440×1440 | Photorealism, fast generation |
| **Google** | Imagen 3 | $0.03-0.04 | Up to 2048×2048 | Natural scenes, Gemini integration |
| **Ideogram** | Ideogram 2.0 | $0.02-0.08 | Up to 2048×2048 | Typography, logos, design |
| **Midjourney** | v6 | $0.02-0.04 | Up to 2048×2048 | Artistic quality, aesthetic control |
| **Leonardo AI** | Phoenix | $0.01-0.03 | Up to 2048×2048 | Consistency, character control |

Atlas UX's image gen KB covers all 16 platforms in depth — see `backend/src/kb/image-gen/`.

### Generation Tool Definition
```json
{
  "name": "generate_image",
  "description": "Generate an image from a text prompt. Costs $0.02-0.12 per image depending on resolution. NOT idempotent — each call generates a new image and incurs cost. Confirm the prompt with the user before generating. Rate limit: 5 per minute.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": {
        "type": "string",
        "maxLength": 4000,
        "description": "Detailed description of the desired image"
      },
      "size": {
        "type": "string",
        "enum": ["1024x1024", "1024x1792", "1792x1024"],
        "default": "1024x1024",
        "description": "Image dimensions"
      },
      "style": {
        "type": "string",
        "enum": ["natural", "vivid"],
        "default": "natural",
        "description": "Generation style — 'vivid' for dramatic, 'natural' for realistic"
      }
    },
    "required": ["prompt"]
  }
}
```

## Image Editing Tools

### Inpainting
Modify specific regions of an image while preserving the rest. Use cases: remove objects, fix blemishes, change backgrounds.

### Outpainting
Extend an image beyond its original boundaries. Use cases: expand cropped photos, create panoramic versions, add context.

### Style Transfer
Apply the visual style of one image to another. Use cases: brand consistency, artistic effects, mockup generation.

### Background Removal
Isolate the subject from its background. Use cases: product photos, profile pictures, design assets.

### Upscaling
Increase image resolution without quality loss. Use cases: print preparation, enlarging AI-generated images, enhancing old photos.

## Image Analysis Tools

### Classification
Categorize images by content. "Is this a receipt?" "Is this NSFW?" "What type of document is this?"

### Object Detection
Identify and locate objects within images. Bounding boxes with labels and confidence scores. Use cases: inventory counting, safety inspection, quality control.

### Face Detection
Locate faces in images. Note: face *recognition* (identifying who) has significant privacy and legal implications. Face *detection* (finding where) is generally safer.

### NSFW Filtering
Critical for any platform accepting user-uploaded images. Classify images for explicit, suggestive, or violent content before displaying or processing.

```typescript
async function checkContent(imageUrl: string): Promise<{ safe: boolean; reason?: string }> {
  // Use a content moderation API
  const result = await moderationApi.check(imageUrl);
  if (result.categories.adult > 0.8) return { safe: false, reason: "adult content detected" };
  if (result.categories.violence > 0.7) return { safe: false, reason: "violent content detected" };
  return { safe: true };
}
```

### Alt Text Generation
Generate accessible descriptions for images. Critical for web accessibility (WCAG compliance).

```json
{
  "name": "generate_alt_text",
  "description": "Generate an accessible alt text description for an image. Returns a concise description suitable for screen readers (10-125 characters).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "image_url": { "type": "string", "format": "uri", "description": "URL of the image to describe" },
      "context": { "type": "string", "description": "Page context to help generate relevant alt text" }
    },
    "required": ["image_url"]
  }
}
```

## Image Optimization Tools

### Compression
Reduce file size while maintaining visual quality. Target: < 200KB for web images.

### Format Conversion
- **JPEG** — Photos, complex images
- **PNG** — Screenshots, images with transparency
- **WebP** — Modern web (30% smaller than JPEG)
- **AVIF** — Next-gen (50% smaller than JPEG, limited support)
- **SVG** — Icons, logos, diagrams (vector, infinitely scalable)

### Responsive Sizing
Generate multiple sizes for different devices:
```
original.jpg    → 1920×1080 (desktop)
original-md.jpg → 1024×576  (tablet)
original-sm.jpg → 640×360   (mobile)
original-thumb.jpg → 200×112 (thumbnail)
```

### CDN Upload
Upload optimized images to a CDN for fast delivery. Return the CDN URL, not the raw image data.

### Metadata Tools

**EXIF Reading** — Extract camera settings, date taken, GPS coordinates from photos.

**GPS Stripping** — Remove location data before publishing. Critical for privacy:
```typescript
import sharp from 'sharp';
await sharp(inputPath)
  .rotate()  // Apply EXIF rotation
  .withMetadata({ exif: undefined })  // Strip all EXIF
  .toFile(outputPath);
```

## Image Search Tools

**Reverse Image Search** — Find where an image appears online. Useful for copyright verification, source attribution.

**Visual Similarity** — Find images similar to a reference. Useful for finding stock photos, related products, visual duplicates.

## Cost Optimization for Image Tools

| Strategy | Savings |
|----------|---------|
| Generate at 1024×1024, upscale only when needed | 50-70% |
| Cache generated images by prompt hash | 100% on duplicates |
| Use cheaper providers for drafts, premium for finals | 30-50% |
| Batch compression/optimization operations | 60% time savings |
| Serve WebP to supported browsers | 30% bandwidth |

For full cost analysis across all providers, see `api-cost-image-gen-providers.md`.

## Resources

- [OpenAI Image Generation API](https://platform.openai.com/docs/guides/images) — Official documentation for DALL-E and GPT-Image generation
- [Sharp Image Processing Library](https://sharp.pixelplumbing.com/) — High-performance Node.js image processing for optimization and format conversion

## Image References

1. Image generation provider comparison — "AI image generation provider comparison DALL-E Midjourney Stable Diffusion side by side"
2. Inpainting before and after — "image inpainting AI before after object removal example"
3. Object detection bounding boxes — "AI object detection bounding boxes labeled confidence scores example"
4. Image optimization pipeline — "image optimization pipeline compression resize format conversion CDN"
5. Responsive image sizing — "responsive image sizes srcset mobile tablet desktop diagram"

## Video References

1. [AI Image Generation Comparison — Matt Wolfe](https://www.youtube.com/watch?v=H27IP2BVYfA) — Head-to-head comparison of major image generation platforms
2. [Image Optimization for Web — Web.dev](https://www.youtube.com/watch?v=YJGCZCaIZkQ) — Complete guide to image optimization, formats, and responsive images
