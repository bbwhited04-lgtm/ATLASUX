# How to Prompt Veo 3 for the Best Results

**Source:** https://replicate.com/blog/using-and-prompting-veo-3
**Author:** Replicate Blog
**Date:** 2025

## Key Takeaways

- Veo 3 performs best with 100-200 word prompts
- Use quotation marks for specific dialogue
- Audio only works in text-to-video mode (not image-to-video)
- Describe sounds with spatial hierarchy (foreground vs background)
- Keep explicit dialogue to what fits in ~8 seconds
- Negative prompts work well for removing subtitles, text, artifacts

## Content

### Prompt Length Guidelines

| Word Count | Result Quality |
|------------|---------------|
| Under 50 | Generic, unpredictable results |
| 50-100 | Decent but may lack specificity |
| 100-200 | Optimal range for detailed, high-quality output |
| 200-300 | Good if well-structured, may lose focus |
| 300+ | Diminishing returns, model may ignore parts |

### Dialogue Prompting

**Format:** Use quotation marks for exact speech.

```
A barista behind a counter looks up and says, "What can I get started for you today?"
```

**Tips:**
- Keep dialogue short -- must fit within ~8 seconds
- Describe voice character: "in a warm, friendly tone" or "with a sharp, authoritative voice"
- For multi-character dialogue, specify turn order explicitly
- Veo generates dialogue as part of the audio track, not as subtitles

**Important limitation:** Audio (including dialogue) only works in text-to-video mode. If you use "Ingredients to Video" or "First Frame to Video", speech generation will likely fail or degrade.

### Sound Effect Prompting

Use spatial cues to layer audio:

- **Foreground (prominent):** "The sharp crack of a bat hitting a baseball cuts through the air"
- **Background (ambient):** "In the distance, crowd cheering and organ music playing"
- **Transitional:** "A door slams shut, followed by echoing footsteps growing quieter"

### Practical Example Prompts

**Commercial/Product:**
> Medium shot of a sleek coffee machine on a marble countertop. Steam rises from a freshly poured espresso. Morning sunlight streams through a kitchen window, casting warm highlights on the chrome surface. The gentle hiss of steam and the quiet drip of coffee fill the scene. Soft, warm color grading. Shot on 35mm, shallow depth of field.

**Narrative/Character:**
> Close-up tracking shot of a young woman, early 20s, with short dark hair and paint-stained overalls, as she steps back from a large canvas in a sunlit studio loft. She tilts her head, studying her work, then smiles slightly. "I think this one's finally done," she says softly. Natural light pours through large industrial windows. The ambient sound of a quiet studio -- a fan humming, distant traffic.

**Nature/Documentary:**
> Cinematic aerial drone shot sweeping over a vast redwood forest at golden hour. The camera glides just above the canopy, with shafts of sunlight piercing through the ancient trees. A hawk soars into frame from the left. The sound of wind through the treetops and distant birdsong. Shot in the style of a BBC nature documentary. Anamorphic lens, warm color grading.

### Common Pitfalls

1. **Vague prompts** -- "A cool video of a city" gives random results
2. **Conflicting instructions** -- "A dark, gloomy scene with bright, cheerful lighting"
3. **Too many subjects** -- Focus on 1-2 main subjects per clip
4. **Ignoring audio** -- Not specifying sound leaves audio to random generation
5. **Using "no" in main prompt** -- Use negativePrompt parameter instead
6. **Expecting long-form** -- Each clip is max 8 seconds; plan sequences accordingly


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
