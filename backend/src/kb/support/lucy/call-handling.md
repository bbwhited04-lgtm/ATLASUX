---
title: "How Lucy Handles Calls"
category: "Lucy AI Receptionist"
tags: ["calls", "call-flow", "appointments", "messages", "faq"]
related: ["how-lucy-works.md", "mid-call-tools.md", "what-lucy-can-do.md", "business-hours.md"]
---

# How Lucy Handles Calls

This guide walks through exactly what happens from the moment a customer dials your number to the moment they hang up. No mystery, no black box -- just a clear step-by-step breakdown.

## Step 1: Lucy answers immediately

When your phone rings, Lucy picks up on the first ring. The caller hears a warm, natural greeting:

> "Hi, thanks for calling [Your Business Name], this is Lucy. How can I help you?"

No phone trees. No "press 1 for appointments, press 2 for billing." Just a friendly voice ready to help.

## Step 2: Lucy listens and identifies the need

Lucy listens to what the caller says and figures out what they need. She is trained to recognize common intents:

- **"I need to schedule an appointment"** -- Lucy enters booking mode
- **"What time do you open?"** -- Lucy answers from your business info
- **"Can I talk to Mike?"** -- Lucy offers to take a message
- **"How much does a drain cleaning cost?"** -- Lucy answers if she has the info, or offers to have someone call back
- **"I have an emergency"** -- Lucy escalates appropriately

She does not need the caller to use specific words or phrases. Natural conversation works. "I got a leak" and "I need a plumber to come out" both lead to the same place.

## Step 3: Lucy takes action

Based on what the caller needs, Lucy does one of three things:

### Books an appointment

If the caller wants to schedule a visit or service, Lucy walks them through booking:

1. She asks for their name and what service they need
2. She finds an available time within your [business hours](business-hours.md)
3. She confirms the details with the caller
4. She books it and sends an [SMS confirmation](../phone-sms/sms-confirmations.md) to the caller's phone

The whole process takes about 60 seconds. See [Booking Flow](../appointments/booking-flow.md) for a detailed walkthrough.

### Takes a message

If the caller wants to reach a specific person or has a request that Lucy cannot handle directly:

1. She asks who the message is for
2. She captures the caller's name, phone number, and message
3. She notes the urgency level (routine or urgent)
4. She confirms the message back to the caller
5. She delivers it to your [Slack channel](../notifications/slack-alerts.md) and dashboard

### Answers a question

If the caller has a straightforward question about your business -- hours, services, location, pricing (if you have authorized it) -- Lucy answers directly from the information you provided during setup. She keeps answers concise and offers to book an appointment or connect them with someone if they need more detail.

## Step 4: Lucy wraps up the call

Once the caller's need is handled, Lucy summarizes next steps:

> "All right, you're booked for Thursday at 2pm for a drain cleaning. I just sent a confirmation text to your phone. Anything else I can help with?"

If the caller has nothing else, Lucy ends the call with a warm goodbye. The call is complete.

## Step 5: You get notified

After every call, Lucy logs the details and sends a notification to your Slack channel. You see:

- Who called
- What they needed
- What action Lucy took (booked appointment, took message, answered question)
- Any follow-up needed

This means you can be on a job site, in a meeting, or at lunch, and still know exactly what is happening with your incoming calls.

## Handling tricky situations

Lucy is built to handle the calls that trip up typical answering services:

- **Angry callers** -- Lucy stays calm, acknowledges frustration, and focuses on solving the problem. She never argues back.
- **Callers who ramble** -- Lucy listens patiently but gently steers the conversation toward a resolution.
- **Callers who ask if she is AI** -- She is honest about it and moves on. Most callers appreciate the honesty.
- **Callers who want a human** -- If you have set an escalation phone number, Lucy can offer to transfer. Otherwise, she takes a message and promises a callback.

## What if two people call at the same time?

Lucy can handle multiple calls simultaneously. Unlike a human receptionist who has to put someone on hold, Lucy gives every caller her full attention at the same time. No one waits. No one gets a busy signal.

For the full list of what Lucy can and cannot do, see [What Lucy Can Do](what-lucy-can-do.md). For technical details on her during-call capabilities, see [Mid-Call Tools](mid-call-tools.md).


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
