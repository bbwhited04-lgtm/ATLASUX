# Ultimate Prompting Guide for Veo 3.1

**Source:** https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1
**Author:** Google Cloud Blog
**Date:** 2025

## Key Takeaways

- Use a 5-part prompt formula for consistent results
- Veo 3.1 interprets professional film terminology with exceptional accuracy
- Always include a negative prompt to eliminate artifacts
- Use "hand-over-hand" prompting for extended sequences
- Audio prompting uses foreground/background layering with spatial cues
- Upload up to 3 reference images for character/style consistency

## Content

### The 5-Part Prompt Formula

Structure every Veo 3.1 prompt with these five components:

1. **Cinematography** -- Camera type, movement, and framing
   - Example: "Handheld camera tracking shot, shallow depth of field"
2. **Subject** -- Detailed character/object description
   - Example: "A woman in her 30s with curly red hair, wearing a denim jacket"
3. **Action** -- What is happening in the scene
   - Example: "walks briskly through a crowded farmer's market, glancing at produce"
4. **Environment** -- Setting, time of day, weather
   - Example: "outdoor market on a sunny autumn morning, golden leaves scattered"
5. **Audio** -- Dialogue, sound effects, music
   - Example: "ambient market chatter, a street musician playing acoustic guitar in the background"

### Film Terminology That Works Well

Veo 3.1 responds accurately to professional cinematography terms:

**Camera Movements:**
- Dolly zoom (Vertigo effect)
- Steadicam follow
- Crane up/down
- Jib shot
- Orbital tracking
- Whip pan
- Dutch angle

**Lighting Terms:**
- Chiaroscuro lighting
- Rim lighting / backlight
- Golden hour
- Blue hour
- Practical lighting (from in-scene sources)
- High-key (bright, even)
- Low-key (dramatic shadows)
- Motivated lighting

**Lens/Film Terms:**
- Anamorphic lens flare
- Shallow depth of field / bokeh
- 35mm film grain
- Tilt-shift miniature effect
- Split diopter

### Audio Layering Best Practices

Structure audio in your prompt using foreground/background hierarchy:

- **Foreground audio** should "cut through" -- dialogue, key sound events
- **Background audio** should "fill" or be "in the distance"
- Use phrasing like: "the clang of metal cuts through the ambient hum of machinery"
- For music: "a subtle, tense string score underscores the scene"

### Negative Prompt Best Practices

Use the `negativePrompt` parameter (not in-line "no" statements):

**Common negative prompt items:**
- `motion blur, face distortion, warping, morphing`
- `duplicate limbs, inconsistent lighting, background shifting`
- `floating objects, text overlay, watermark, subtitles`
- `oversaturation, plastic skin, over-sharpening`
- `soap opera effect, jump cuts, glitch morphs`
- `extra limbs, object warping`

**Tips:**
- Keep negative prompts concise (under 30 words)
- If a defect recurs, rephrase positively in the main prompt instead (e.g., "consistent anatomy, natural hand pose")
- Avoid instructive language like "no" or "don't" -- just list unwanted elements

### Hand-Over-Hand Prompting for Extended Sequences

To create longer narratives beyond 8 seconds:

1. Generate the first clip with your initial prompt
2. Use the "Extend Video" feature, which generates based on the final second of the previous clip
3. Write continuation prompts that reference the established scene
4. Maintain consistent character descriptions across clips
5. Use reference images (up to 3) to preserve character appearance

### Ingredients to Video

Upload reference images to guide generation:

- Up to 3 images of a character, object, or scene
- Veo preserves the subject's appearance in output
- Useful for brand consistency, character continuity, product videos
- Works best when reference images are clear, well-lit, and show the subject prominently

### Advanced Techniques

- **Iterative refinement:** Generate, review, adjust prompt, regenerate
- **Seed pinning:** Use the same seed number to get consistent starting points while adjusting other parameters
- **Style transfer:** Describe a specific visual style ("in the style of Wes Anderson" or "like a 1970s documentary")
- **Emotional pacing:** Describe the emotional arc ("starts calm, builds tension, peaks with a sudden reveal")


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
