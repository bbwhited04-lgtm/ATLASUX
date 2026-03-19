---
title: "Lucy's Mid-Call Tools"
category: "Lucy AI Receptionist"
tags: ["mid-call", "tools", "booking", "sms", "messages", "webhook", "elevenlabs"]
related: ["call-handling.md", "what-lucy-can-do.md", "how-lucy-works.md"]
---

# Lucy's Mid-Call Tools

One of the things that sets Lucy apart from a basic auto-attendant is that she can take real actions while she is still talking to the caller. She does not just collect information and hand it off -- she books appointments, sends text messages, and captures messages right there on the call. This guide explains how each tool works and what happens behind the scenes.

## The three mid-call tools

Lucy has three tools she can use during a live conversation:

### 1. Book Appointment

When a caller wants to schedule a visit or service, Lucy does not just write it down for later. She books it on the spot.

**What Lucy collects:**
- Caller's name
- Phone number (if available from caller ID or provided verbally)
- Type of service requested (e.g., "drain cleaning," "color appointment," "AC tune-up")
- Preferred date and time
- Any additional notes from the caller

**What happens next:**
Lucy sends this information to your Atlas UX backend instantly. The appointment is created in your calendar, and Lucy confirms the booking with the caller before moving on. The entire exchange takes about a minute.

For the full booking experience, see [Booking Flow](../appointments/booking-flow.md).

### 2. Send SMS

Lucy can send a text message to the caller's phone while they are still on the line. She most commonly uses this right after booking an appointment, but she can also send a text whenever it is useful -- for example, texting your business address or a link.

**What Lucy sends:**
- A confirmation message with the appointment details (date, time, service)
- Or any other short message relevant to the conversation

**What the caller experiences:**
They hear Lucy say something like "I just sent you a text with the details," and a moment later the text arrives on their phone. It feels seamless because it is -- Lucy triggers the SMS without pausing the conversation.

For more on SMS, see [SMS Confirmations](../phone-sms/sms-confirmations.md).

### 3. Take Message

When the caller wants to leave a message for a specific person or for your team in general, Lucy captures it properly -- not just a name and number scribbled on a sticky note.

**What Lucy captures:**
- Who the message is from (caller's name)
- Their callback number
- Who the message is for (if applicable)
- The actual message content
- Urgency level: low, normal, or urgent

**What happens next:**
The message is delivered to your [Slack channel](../notifications/slack-alerts.md) and your Atlas UX dashboard immediately. Urgent messages are flagged so they stand out. You or your team can follow up as soon as you are available.

## How it works behind the scenes

If you are curious about the technology (feel free to skip this part if you are not), here is how Lucy's mid-call tools actually function:

Lucy's voice is powered by ElevenLabs Conversational AI. During a call, ElevenLabs handles the speaking and listening. When Lucy decides she needs to take an action -- like booking an appointment -- ElevenLabs sends a request to your Atlas UX backend through what is called a **webhook tool**.

Think of it like this: Lucy is talking to the caller, realizes she needs to book an appointment, taps a button in the background (the webhook), your system processes the booking, and Lucy gets a confirmation back -- all in about one second. The caller does not hear any delay or interruption.

Each tool is registered when your Lucy agent is created during setup. They are preconfigured to work with your specific business account, so there is no additional setup required on your end.

## When does Lucy use each tool?

Lucy decides which tool to use based on the conversation:

| Caller says | Lucy uses |
|---|---|
| "I'd like to schedule a haircut for Saturday" | Book Appointment |
| "Can you text me the confirmation?" | Send SMS |
| "Can you have Mike call me back?" | Take Message |
| "I need a drain cleaning next Tuesday" | Book Appointment, then Send SMS |
| "Just let them know I called about the estimate" | Take Message |

Lucy can also chain tools together. A common flow is: book an appointment, then immediately send an SMS confirmation -- two tools used back-to-back in a single call.

## Do I need to set anything up?

No. Lucy's mid-call tools are configured automatically when your account is created through the [Setup Wizard](../getting-started/setup-wizard.md). They work out of the box.

If you want to understand the full call flow from start to finish, see [Call Handling](call-handling.md). For everything Lucy can and cannot do, see [What Lucy Can Do](what-lucy-can-do.md).


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
