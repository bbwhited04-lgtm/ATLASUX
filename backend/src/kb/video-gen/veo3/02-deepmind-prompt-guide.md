# How to Create Effective Prompts with Veo 3

**Source:** https://deepmind.google/models/veo/prompt-guide/
**Author:** Google DeepMind
**Date:** 2025

## Key Takeaways

- Optimal prompt length is 100-200 words for best results
- Use specific cinematography terminology -- Veo 3 understands professional film language
- Structure prompts as: subject + action + setting + technical specs + aesthetic style
- Use quotation marks for specific dialogue lines
- Keep dialogue short enough to fit in 8 seconds
- Describe sounds explicitly for audio generation

## Content

### Prompt Structure Framework

A well-structured Veo 3 prompt should include these elements in order:

1. **Camera/Shot Type** -- How the scene is filmed
2. **Subject** -- Who or what is in the scene with detailed appearance
3. **Action** -- What is happening
4. **Setting/Environment** -- Where it takes place
5. **Lighting/Mood** -- Atmosphere and visual tone
6. **Audio/Sound** -- What should be heard

### Example Prompt (Full Structure)

> A slow tracking shot follows a weathered fisherman in his 60s, gray beard, wearing a faded yellow rain slicker, as he hauls a net from the stern of a small wooden boat. The sea is calm with gentle swells under an overcast sky at dawn. Soft, diffused lighting creates muted blues and grays. The sound of creaking wood, lapping water, and distant seagulls fills the scene. The fisherman mutters quietly, "Another day, another catch."

### Camera Movements Veo 3 Understands

- **Dolly shot** -- Camera moves toward or away from subject
- **Tracking shot** -- Camera follows subject laterally
- **Crane shot** -- Camera moves vertically
- **Steadicam** -- Smooth handheld movement
- **Dutch angle** -- Tilted camera for tension
- **Rack focus** -- Focus shifts between foreground and background
- **Dolly zoom** -- Vertigo effect (zoom in while dollying out)
- **Pan** -- Camera rotates horizontally on axis
- **Tilt** -- Camera rotates vertically on axis
- **Whip pan** -- Fast pan creating motion blur
- **Push in** -- Slow move toward subject for emphasis
- **Pull out/reveal** -- Moving back to reveal context

### Shot Types

- Extreme wide shot (EWS)
- Wide shot (WS)
- Medium shot (MS)
- Medium close-up (MCU)
- Close-up (CU)
- Extreme close-up (ECU)
- Over-the-shoulder (OTS)
- Point of view (POV)
- Bird's eye view
- Low angle
- High angle

### Dialogue Formatting

- Use quotation marks for specific speech: `A woman says, "We have to leave now."`
- Keep dialogue to what can naturally be spoken in ~8 seconds
- Describe voice qualities: "in a hushed, urgent tone" or "with a deep, gravelly voice"
- For conversations, specify who speaks and in what order

### Audio Prompting

- Describe foreground sounds prominently: "the sharp crack of thunder"
- Use spatial language for background: "in the distance, a train horn"
- Layer sounds: "footsteps on gravel, birds chirping overhead, wind rustling leaves"
- Specify music mood: "a melancholic piano melody plays softly"

### Common Mistakes to Avoid

- Prompts under 50 words produce generic, unpredictable results
- Vague descriptions like "a nice scene" give poor output
- Conflicting instructions confuse the model
- Overly long prompts (300+ words) can dilute focus
- Using "don't" or "no" in main prompt -- use negativePrompt parameter instead


---
## Media

> **Tags:** `veo` · `veo-3` · `google` · `deepmind` · `ai-video` · `vertex-ai` · `text-to-video` · `4k`

### Official Resources
- [Official Documentation](https://deepmind.google/technologies/veo/)
- [Gallery / Showcase](https://deepmind.google/technologies/veo/)
- [Google DeepMind - Veo](https://deepmind.google/technologies/veo/)
- [Veo on Vertex AI](https://cloud.google.com/vertex-ai/generative-ai/docs/video/overview)
- [Google AI Studio](https://aistudio.google.com)

### Video Tutorials
- [Google Veo 3 - AI Video Generation Tutorial](https://www.youtube.com/results?search_query=google+veo+3+ai+video+generation+tutorial) — *Credit: Google on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
