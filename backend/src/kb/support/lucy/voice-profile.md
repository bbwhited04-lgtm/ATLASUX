---
title: "Setting Up Lucy's Voice"
category: "Lucy AI Receptionist"
tags: ["voice", "elevenlabs", "customization", "greeting"]
related: ["personality-customization.md", "how-lucy-works.md", "call-handling.md"]
---

# Setting Up Lucy's Voice

Lucy's voice is powered by ElevenLabs, one of the most advanced voice AI platforms available. This is what makes her sound like a real person rather than a robot reading a script. This guide covers how to set up and customize the way Lucy sounds on the phone.

## Why Lucy sounds natural

Traditional phone bots sound robotic because they stitch together pre-recorded clips. Lucy is different. ElevenLabs generates her speech in real time using a neural voice model. This means she can say anything -- including names, addresses, and appointment details she has never said before -- and it sounds smooth and natural.

She uses contractions ("I'll", "we're", "that's"), adds natural pauses, and adjusts her pacing to match the conversation. If the caller is in a hurry, she keeps it brief. If they are chatty, she warms up.

## Choosing a voice

Lucy comes with a default voice that is warm, professional, and female. It works well across industries and caller demographics. This is the voice most businesses stick with.

If you want a different sound, you can select from other curated voice options in your Atlas UX dashboard under **Settings > Voice Profile**. Each voice has been selected for clarity, warmth, and professionalism on phone calls specifically -- not all voices that sound good in a podcast sound good on a phone line.

You can also provide a custom ElevenLabs voice ID if you have created your own voice through ElevenLabs directly.

## Customizing the greeting

Lucy's default greeting is:

> "Hi, thanks for calling [Your Business Name], this is Lucy. How can I help you?"

You can change this to whatever fits your business. Some examples:

- **Salon:** "Hey there, thanks for calling [Salon Name], this is Lucy. Looking to book an appointment?"
- **Plumber:** "Thanks for calling [Company Name], this is Lucy. What can I help you with today?"
- **HVAC:** "Hi, you've reached [Company Name], this is Lucy. How can I help?"

Keep your greeting short -- under two sentences. Callers want to get to the point quickly. You can set your custom greeting in the [Setup Wizard](../getting-started/setup-wizard.md) or update it later in your dashboard.

## Voice settings explained

Behind the scenes, Lucy's voice has two key settings that affect how she sounds:

- **Stability** controls how consistent her voice sounds from sentence to sentence. Higher stability means a steadier, more predictable tone. Lower stability adds more natural variation and expressiveness.
- **Similarity boost** controls how closely the generated speech matches the original voice model. Higher values produce a more precise match.

The defaults are tuned for phone calls and work well for most businesses. You generally do not need to change these unless you have a specific preference.

## Language support

Lucy's default language is English, but she can be configured for other languages if your customer base needs it. Language settings are available during agent setup.

## Tips for the best experience

1. **Keep greetings under 15 seconds.** Long greetings frustrate callers.
2. **Include your business name** in the greeting so callers know they reached the right place.
3. **Test your voice setup** by calling your own number after configuration. Listen as a customer would.
4. **Do not overthink it.** The default voice and greeting work great for most businesses. You can always change them later.

For more on how Lucy adapts her tone during conversations, see [Personality Customization](personality-customization.md).


---
## Media

> **Tags:** `elevenlabs` · `voice` · `tts` · `conversational-ai` · `voice-agent` · `speech-synthesis`

### Official Resources
- [Official Documentation](https://elevenlabs.io/docs)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [Conversational AI Overview](https://elevenlabs.io/docs/conversational-ai/overview)
- [ElevenLabs Conversational AI Platform](https://elevenlabs.io/conversational-ai)
- [ElevenAgents Quickstart](https://elevenlabs.io/docs/eleven-agents/quickstart)

### Video Tutorials
- [ElevenLabs Conversational AI - Build Voice Agents](https://www.youtube.com/results?search_query=elevenlabs+conversational+ai+voice+agent+tutorial) — *Credit: ElevenLabs on YouTube* `tutorial`
- [ElevenLabs Conversational AI 2.0 Overview](https://www.youtube.com/results?search_query=elevenlabs+conversational+ai+2.0+overview) — *Credit: ElevenLabs on YouTube* `showcase`
- [Building AI Phone Agents with ElevenLabs + Twilio](https://www.youtube.com/results?search_query=elevenlabs+twilio+ai+phone+agent+tutorial) — *Credit: AI Dev on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
