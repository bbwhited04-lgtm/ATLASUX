---
title: "Nano Banana Pro Prompting Guide"
platform: "banana-nano"
category: "image-gen"
tags: ["banana-nano", "nano-banana-pro", "prompting", "ai-image", "text-to-image", "prompt-engineering"]
updated: "2026-03-19"
---

# Nano Banana Pro Prompting Guide

## Prompting Philosophy

Nano Banana models are built on Gemini's language understanding, which means they respond well to natural language descriptions rather than the keyword-stuffed prompts common in Stable Diffusion or Midjourney workflows. You can write prompts as you would describe an image to a professional photographer or designer. The model's "Thinking" mode (Pro and NB2) will decompose complex instructions into spatial, lighting, and compositional decisions internally.

## Key Prompting Principles

1. **Be descriptive, not keyword-heavy.** Write full sentences. "A plumber in a blue uniform kneeling under a kitchen sink, photographed from a low angle with warm overhead lighting" works better than "plumber, blue uniform, kitchen, low angle, warm light, 8k, professional."

2. **Specify text content explicitly.** Nano Banana Pro excels at text rendering. When you want text in the image, put it in quotes: 'The sign reads "Open 24/7" in bold white letters.'

3. **Use spatial instructions.** The model understands "left," "right," "foreground," "background," "centered," "off-center," and relative positioning.

4. **Request specific photographic properties.** Camera angle, depth of field, focal length, lighting direction, and color temperature are all understood.

5. **Leverage multi-turn refinement.** Generate a base image, then refine through conversation: "Make the background darker," "Add a logo in the top-right corner."

## 10 Example Prompts

### 1. Trade Business Hero Image

```
Create a professional photograph of a female HVAC technician in her mid-30s, wearing a clean navy blue polo shirt with a company logo patch, standing confidently next to a residential air conditioning unit. She is holding a digital tablet showing a work order. The setting is a well-maintained suburban backyard on a sunny morning. Shallow depth of field, subject sharp, background softly blurred. The image should feel warm, competent, and trustworthy.
```

**Best model:** Nano Banana Pro (character detail, professional quality)

### 2. Marketing Banner with Text

```
Design a wide promotional banner (16:9 aspect ratio) for a plumbing company's website. The banner shows a modern bathroom renovation in progress with exposed copper piping visible behind a partially tiled wall. Overlay text reads "24/7 Emergency Plumbing" in large bold white sans-serif font at the center, with "Call Lucy - She Never Misses" in smaller text below. The color palette is navy blue and copper/gold. Professional marketing aesthetic.
```

**Best model:** Nano Banana Pro (text rendering accuracy is critical here)

### 3. Social Media Product Showcase

```
A flat-lay photograph on a clean white marble surface showing a smartphone displaying an AI receptionist app interface, surrounded by a coffee cup, a set of car keys, and a small succulent plant. The phone screen shows an incoming call notification with the name "Lucy AI" and a green answer button. Natural window light from the upper left, soft shadows. Instagram-ready square composition.
```

**Best model:** Nano Banana 2 (fast iteration for social content)

### 4. Before/After Service Comparison

```
A split-screen image divided vertically down the center. The left side shows a neglected, overgrown residential lawn with brown patches, weeds, and scattered debris, labeled "BEFORE" in red text at the top. The right side shows the same yard beautifully landscaped with fresh green grass, trimmed hedges, a stone pathway, and flower beds, labeled "AFTER" in green text at the top. Both sides share the same house in the background for continuity. Clean, professional real estate photography style.
```

**Best model:** Nano Banana Pro (text labels, spatial consistency)

### 5. Team/Staff Portrait

```
A group photograph of four diverse trade workers standing shoulder-to-shoulder in front of a white service van. From left to right: a young Black man in electrician gear holding a voltage tester, a middle-aged white woman in plumbing overalls with a wrench, an Asian man in HVAC technician uniform, and a Hispanic woman in a general contractor hard hat with blueprints. All are smiling naturally. Overcast outdoor lighting, no harsh shadows. The van behind them has "Atlas Home Services" written on the side.
```

**Best model:** Nano Banana Pro (character consistency, text on van, multi-person composition)

### 6. Infographic/Data Visualization

```
Create a clean, modern infographic showing "The Cost of Missed Calls for Small Businesses." Use a vertical layout with a dark navy background. At the top, a large statistic: "62% of calls to small businesses go unanswered." Below that, three icon-and-stat pairs arranged vertically: a phone icon with "85% of callers won't call back," a dollar sign icon with "$1,200 average revenue lost per missed call," and a clock icon with "After-hours calls represent 35% of all inquiries." At the bottom, the text "Lucy AI answers every call. $99/mo." Use white and gold text, clean sans-serif typography.
```

**Best model:** Nano Banana Pro (complex text rendering, data accuracy, typography)

### 7. Seasonal Promotion

```
A cozy autumn scene of a home exterior with warm golden light glowing through the windows at dusk. In the foreground, a friendly technician in a branded jacket is adjusting a thermostat mounted on the exterior wall. Fallen maple leaves in red and orange scatter across the front porch. The mood is warm and inviting. Style: editorial lifestyle photography with a slight film grain. This should feel like a magazine advertisement for fall furnace tune-up services.
```

**Best model:** Nano Banana 2 (atmospheric imagery, fast generation for seasonal campaigns)

### 8. App Screenshot Mockup

```
A realistic mockup of a smartphone (iPhone 15 Pro in Natural Titanium) held at a slight angle by a person's hand against a blurred office background. The phone screen displays a clean mobile app interface with: a header reading "Today's Appointments," three appointment cards showing customer names and times (9:00 AM - Johnson Residence, 11:30 AM - Park Ave Office, 2:00 PM - Miller Kitchen Reno), and a floating action button with a "+" symbol. The UI uses a blue and white color scheme. Photorealistic rendering of the phone hardware.
```

**Best model:** Nano Banana Pro (UI text accuracy, device rendering)

### 9. Customer Testimonial Visual

```
A warm, natural portrait of a smiling middle-aged man in a flannel shirt standing in his renovated kitchen. He is leaning casually against a granite countertop. The kitchen is modern with stainless steel appliances and pendant lighting. Below the portrait, a quote block reads: "Lucy booked 3 appointments while I was on a job site. Best $99 I spend every month." - Mike R., Owner, Reliable Plumbing. The quote text is in a clean serif font on a semi-transparent dark overlay at the bottom third of the image.
```

**Best model:** Nano Banana Pro (text rendering, portrait quality)

### 10. Abstract Brand Illustration

```
An abstract, modern illustration representing AI-powered communication for businesses. Flowing curved lines in navy blue and electric gold form the silhouette of a phone handset that transforms into a constellation of connected nodes, suggesting an AI network. The background is a gradient from deep navy to black. Small particles of light drift upward from the network nodes. The style should be clean and contemporary, suitable for a SaaS landing page hero section. No text in the image.
```

**Best model:** Nano Banana 2 (abstract/conceptual imagery, fast iteration on style)

## Multi-Turn Editing Examples

### Starting Prompt
```
A professional headshot of a friendly AI assistant character - a young woman with warm brown eyes and a confident smile, wearing a modern headset with a small microphone. Clean white background. Studio lighting.
```

### Refinement Turn 1
```
Change the background to a soft gradient from light blue to white. Add a subtle glow effect around the headset to suggest it's an AI-powered device.
```

### Refinement Turn 2
```
Add the text "Meet Lucy" in elegant navy blue lettering below the portrait, and "Your AI Receptionist" in smaller gold text underneath.
```

## Prompting Pitfalls to Avoid

- **Do not use Stable Diffusion-style prompt syntax** like `(masterpiece:1.5)`, `best quality`, negative prompts, or weight notation. Nano Banana ignores these and they waste input tokens.
- **Avoid extremely long prompts.** While the model handles complex instructions well, prompts over 500 words may cause the model to prioritize some elements over others. Be precise.
- **Do not request copyrighted characters or real celebrity likenesses.** Google's content safety filters will block these requests.
- **Be specific about text content.** Vague instructions like "add some text" will produce unpredictable results. Always specify the exact words, font style, and placement.


---
## Media

> **Tags:** `banana` · `nano` · `ai-image` · `serverless` · `gpu` · `inference` · `api`

### Official Resources
- [Official Documentation](https://www.banana.dev)
- [Banana Dev Documentation](https://www.banana.dev)

### Video Tutorials
- [Banana Dev - Serverless GPU Inference](https://www.youtube.com/results?search_query=banana+dev+serverless+gpu+inference+tutorial) — *Credit: Banana on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
