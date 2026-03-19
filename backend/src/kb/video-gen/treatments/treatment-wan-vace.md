# Wan 2.1 VACE (Video Adaptive Composition Engine) Treatment
**Sources:**
- https://github.com/ali-vilab/VACE
- https://github.com/Wan-Video/Wan2.1
- https://openaccess.thecvf.com/content/ICCV2025/papers/Jiang_VACE_All-in-One_Video_Creation_and_Editing_ICCV_2025_paper.pdf
- https://docs.comfy.org/tutorials/video/wan/vace
- https://www.runcomfy.com/comfyui-workflows/vace-wan2-1-video-to-video-workflow
- https://stable-diffusion-art.com/wan-vace-v2v/
- https://stable-diffusion-art.com/wan-vace-ref/
- https://www.stablediffusiontutorials.com/2025/05/vace-model.html
- https://ghost.oxen.ai/how-to-use-wan-2-1-vace-to-generate-hollywood-level-video-edits/
- https://promptaa.com/blog/wan-2-1-vace
- https://wavespeed.ai/models/wavespeed-ai/wan-2.1-14b-vace
- https://fal.ai/models/fal-ai/wan-vace-14b/outpainting/api
- https://aimlapi.com/models/wan-2-2-vace-fun-a14b-inpainting
- https://docs.aimlapi.com/api-references/video-models/alibaba-cloud/wan2.2-vace-fun-a14b-inpainting-image-to-video
- https://docs.aimlapi.com/api-references/video-models/alibaba-cloud/wan2.2-vace-fun-a14b-outpainting-image-to-video

**Date:** 2026-03-18

## Key Takeaways
- VACE (Video All-in-one Creation and Editing) is Alibaba's unified framework for video generation and editing tasks
- Published at ICCV 2025 -- peer-reviewed, production-quality research
- Unifies text-to-video, reference-to-video, video-to-video, inpainting, outpainting, and motion transfer under a single model
- Open-source (GitHub) with local deployment via ComfyUI or cloud API access
- Uses "context tokens" and context blocks separate from the main DiT blocks for efficient multi-task handling
- Available in 1.3B and 14B parameter variants at 480p and 720p resolutions
- Wan 2.2 VACE Fun extends with improved inpainting and outpainting capabilities
- Key advantage: all editing tasks share a single model, reducing infrastructure complexity

## Which Models Support This
| Model | Size | Resolution | Tasks |
|-------|------|-----------|-------|
| Wan 2.1 VACE 1.3B | 1.3B params | 480p | All VACE tasks (lighter) |
| Wan 2.1 VACE 14B | 14B params | 480p-720p | All VACE tasks (highest quality) |
| Wan 2.2 VACE Fun 14B | 14B params | 480p-720p | Enhanced inpainting/outpainting |

## How It Works

### Architecture
VACE uses a context-adapter approach built on top of the Wan 2.1 video diffusion model (DiT-based). Each editing task is fed through "context tokens" via separate context blocks rather than being mixed into the main diffusion transformer blocks. This design:
- Trains faster than approaches that combine video and context tokens
- Achieves better performance by keeping task conditioning separate
- Enables easy composition of multiple tasks in a single pass

### Supported Tasks

#### 1. Video-to-Video (V2V) -- Style Transfer
- Input: source video + text prompt describing target style
- The model applies the described style while preserving motion and structure
- Supports depth-guided and pose-guided control signals

#### 2. Masked Video Editing (MV2V) -- Inpainting
- Input: source video + binary mask (per-frame or static) + text prompt
- Replaces masked regions with generated content matching the prompt
- Preserves unmasked areas perfectly
- Use cases: object removal, subject replacement, background swap

#### 3. Video Outpainting
- Input: source video + expansion direction/amount
- Extends the video frame beyond its original boundaries
- Generates coherent content for the expanded regions
- Useful for aspect ratio conversion (e.g., vertical to horizontal)

#### 4. Reference-to-Video (R2V)
- Input: reference image + text prompt
- Generates video maintaining the subject/style from the reference
- Enables character consistency across multiple generations

#### 5. Motion Transfer (Move-Anything)
- Input: source video + motion reference
- Transfers motion patterns from one video to another subject

#### 6. Animate-Anything
- Input: static image + motion description
- Brings still images to life with described motion

### Composable Tasks
VACE's unique advantage is task composition -- you can combine multiple operations:
- Reference image + inpainting mask + text prompt = subject injection into specific region
- Outpainting + style transfer = expanded frame with new aesthetic
- Motion reference + character reference = custom character performing specific motion

## Code/API Examples

### ComfyUI Workflow (Local Deployment)
```python
# ComfyUI nodes for VACE video-to-video
# 1. Load the VACE model
# 2. Use WanVaceToVideo node
# 3. Connect source video, prompt, and optional control signals

# Key nodes:
# - WanVaceToVideo: Main processing node
# - TrimVideoLatent: Trim/adjust video length
# - LoadVideo: Import source footage
# - MaskComposite: Create inpainting masks
```

### Video-to-Video Style Transfer (ComfyUI)
```
Workflow:
1. LoadVideo -> source_video
2. TextPrompt: "cinematic film noir style, high contrast, dramatic shadows"
3. WanVaceToVideo(
     video=source_video,
     prompt=text_prompt,
     mode="v2v",
     strength=0.7,
     control_type="depth"
   )
4. SaveVideo -> output
```

### Inpainting via API (AIMLAPI)
```python
import requests

response = requests.post(
    "https://api.aimlapi.com/v1/video/wan-2-2-vace-fun-a14b-inpainting",
    headers={"Authorization": "Bearer YOUR_KEY"},
    json={
        "video_url": "https://storage.example.com/source.mp4",
        "mask_url": "https://storage.example.com/mask.mp4",
        "prompt": "Replace the person with a robot walking in the same direction",
        "negative_prompt": "blurry, distorted",
        "num_frames": 48,
        "resolution": "720p"
    }
)
```

### Outpainting via API (fal.ai)
```python
import fal_client

result = fal_client.submit("fal-ai/wan-vace-14b/outpainting", {
    "video_url": "https://storage.example.com/vertical-video.mp4",
    "prompt": "Expand to show the full cityscape with neon lights",
    "expand_left": 0.3,
    "expand_right": 0.3,
    "resolution": "720p"
})
```

### WaveSpeed API (Cloud, optimized inference)
```python
import requests

response = requests.post(
    "https://api.wavespeed.ai/v1/wan-2.1-14b-vace",
    headers={"Authorization": "Bearer YOUR_KEY"},
    json={
        "task": "v2v",
        "video_url": "https://...",
        "prompt": "Transform into watercolor painting style",
        "strength": 0.65
    }
)
```

## Quality Considerations
- **Resolution**: 480p (1.3B) or 720p (14B) -- not natively 1080p or 4K
- **Best for**: Inpainting, outpainting, style transfer, motion transfer -- especially when you need multiple editing operations in a single pipeline
- **Strengths**: Open-source, composable tasks, single model for all editing operations, strong academic backing (ICCV 2025)
- **Limitations**: Lower native resolution than Kling/Sora; requires ComfyUI knowledge for local deployment; 14B model needs significant GPU RAM (24GB+ VRAM recommended)
- **Inpainting quality**: Excellent at object removal and subject replacement when masks are well-defined
- **Outpainting quality**: Good for moderate expansion; large expansions can show seam artifacts
- **Style transfer**: Works best with clear style descriptions; depth/pose control signals improve consistency
- **No native audio**: Purely visual model -- audio must be handled separately

## Integration Notes for Atlas UX
- **Venny/Victor pipeline -- primary use cases**:
  - **Inpainting**: Remove unwanted objects from footage, replace backgrounds, swap subjects
  - **Outpainting**: Convert vertical social media clips to widescreen for YouTube/web
  - **Style transfer**: Apply brand-specific visual styles to raw footage
  - **Motion transfer**: Create character animations from reference motion clips
  - **Composition**: Chain multiple VACE operations (e.g., outpaint + style transfer in one pass)
- **Deployment strategy**: Use cloud APIs (fal.ai, WaveSpeed, AIMLAPI) for production; ComfyUI for local testing and experimentation
- **Resolution pipeline**: Generate at 720p with VACE, then upscale with the upscaling-enhancement treatment pipeline
- **Cost advantage**: Open-source model means self-hosting is viable for high-volume processing
- **Workflow integration**: VACE's composable task design maps naturally to a treatment chain -- each operation can be a discrete step in the video processing pipeline
- **Mask generation**: Consider integrating SAM 2 (Segment Anything Model) for automatic mask generation to feed into VACE inpainting tasks


---
## Media

### Platform References
- **kling**: [Docs](https://klingai.com) · [Gallery](https://klingai.com/explore)
- **wan**: [Docs](https://github.com/Wan-Video/Wan2.1) · [Gallery](https://wan-video.github.io)

### Related Videos
- [Kling AI Video Generator Tutorial - Complete Guide](https://www.youtube.com/results?search_query=kling+ai+video+generator+tutorial+2025) — *Credit: AI Video on YouTube* `kling`
- [Kling 3.0 - Motion Brush & Advanced Features](https://www.youtube.com/results?search_query=kling+3.0+motion+brush+advanced+tutorial) — *Credit: AI Tutorials on YouTube* `kling`
- [Wan 2.1 Video Generation - Self-Hosted Tutorial](https://www.youtube.com/results?search_query=wan+2.1+video+generation+self+hosted+tutorial) — *Credit: AI Self-Hosted on YouTube* `wan`
- [Wan VACE - Video Editing with AI](https://www.youtube.com/results?search_query=wan+vace+video+editing+ai+tutorial) — *Credit: AI Video on YouTube* `wan`

> *All video content is credited to original creators. Links direct to source platforms.*
