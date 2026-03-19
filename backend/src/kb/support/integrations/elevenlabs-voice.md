---
title: "ElevenLabs Voice Technology"
category: "Integrations"
tags: ["elevenlabs", "voice", "lucy", "AI voice", "conversational AI"]
related:
  - integrations/twilio-telephony
  - troubleshooting/lucy-not-answering
  - security-privacy/caller-data-handling
---

# ElevenLabs Voice Technology

Lucy's natural-sounding voice is powered by **ElevenLabs**, a leading AI voice technology company. This is what makes Lucy sound like a real person on the phone -- not a robotic automated system that frustrates your callers.

## What Is ElevenLabs?

ElevenLabs builds advanced text-to-speech and conversational AI technology. Their platform generates realistic human speech with natural intonation, pacing, and emotion. When a customer calls your business and Lucy answers, ElevenLabs is the engine producing her voice in real time.

## Why Lucy Sounds Natural

Traditional phone systems use pre-recorded prompts or robotic text-to-speech. Lucy is different:

- **Real-time voice generation** -- Lucy does not play back recordings. She generates speech on the fly based on the conversation, so her responses are always contextual and natural.
- **Professional voice profiles** -- Lucy uses a warm, professional female voice (Jessica Ann Bogart) that has been selected specifically for business phone calls. It is friendly without being overly casual.
- **Conversational pacing** -- ElevenLabs handles pauses, emphasis, and rhythm so Lucy sounds like she is actually listening and responding, not reading a script.
- **Multi-persona support** -- Atlas UX supports multiple voice personas (Lucy, Josh, Mercer) for different use cases like inbound reception, outbound sales, and follow-up calls.

## How Your Voice Profile Works

When you set up Lucy for your business, Atlas UX creates a voice agent profile on ElevenLabs configured specifically for you:

1. **Business customization** -- Lucy's greeting and conversation style are tailored to your business type (plumbing, salon, HVAC, insurance, etc.) and your specific services.
2. **Service knowledge** -- Lucy knows your services, hours of operation, and can describe what you offer to callers.
3. **Language support** -- Lucy defaults to English but can be configured for other languages supported by ElevenLabs.
4. **Escalation handling** -- If a caller needs a human, Lucy can transfer to your designated escalation phone number.

## Mid-Call Capabilities

During a live call, Lucy can take real actions powered by webhook tools registered with ElevenLabs:

- **Book appointments** -- Lucy checks your calendar and books directly during the call.
- **Send SMS confirmations** -- After booking, Lucy triggers an SMS confirmation to the caller via [Twilio](twilio-telephony.md).
- **Take messages** -- If you are unavailable or the caller prefers, Lucy captures the message and delivers it to you.

These are not post-call automations. They happen in real time while the caller is still on the line.

## Voice Quality and Reliability

ElevenLabs processes voice generation in their cloud infrastructure, which means:

- **Low latency** -- Responses are generated in milliseconds so conversations feel natural with no awkward delays.
- **High uptime** -- ElevenLabs operates redundant infrastructure to keep voice services available 24/7.
- **Consistent quality** -- Every call gets the same professional voice quality whether it is your first call of the day or your hundredth.

## Privacy and Security

Voice interactions are handled with care:

- All webhook communications between ElevenLabs and Atlas UX are validated using timing-safe secret comparison to prevent unauthorized access.
- Your ElevenLabs API credentials are encrypted at rest using AES-256-GCM. See [How We Protect Your Data](../security-privacy/how-we-protect-your-data.md).
- For details on how caller information is handled during voice calls, see [Caller Data Handling](../security-privacy/caller-data-handling.md).

## Frequently Asked Questions

**Can I change Lucy's voice?**
Yes. Atlas UX supports multiple voice profiles. Contact support to switch personas or request a custom voice configuration.

**Does Lucy record calls?**
Call handling and data capture are covered in [Caller Data Handling](../security-privacy/caller-data-handling.md).

**What happens if ElevenLabs has an outage?**
If voice generation is temporarily unavailable, calls can be routed to your escalation phone number so you never miss a customer.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
