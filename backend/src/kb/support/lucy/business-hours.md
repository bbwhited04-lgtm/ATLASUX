---
title: "Setting Up Business Hours"
category: "Lucy AI Receptionist"
tags: ["business-hours", "after-hours", "holidays", "scheduling"]
related: ["call-handling.md", "how-lucy-works.md", "personality-customization.md"]
---

# Setting Up Business Hours

Lucy answers your phone 24/7, but she behaves differently depending on whether your business is open or closed. This guide explains how to set your hours, configure after-hours behavior, and handle holidays.

## Why business hours matter

Your hours of operation affect two things:

1. **Appointment booking** -- Lucy will only offer appointment times within your working hours. She will not book a drain cleaning at 3am unless you want her to.
2. **Caller expectations** -- When someone calls after hours, Lucy lets them know when you will be back and offers alternatives like leaving a message or booking for the next available day.

## Setting your hours

During the [Setup Wizard](../getting-started/setup-wizard.md), you enter your hours of operation. This is a simple text description that Lucy uses in conversation. Examples:

- `Mon-Fri 8am-6pm, Sat 9am-1pm`
- `Monday through Friday, 9am to 5pm`
- `7 days a week, 8am to 8pm`

You can update your hours at any time from your Atlas UX dashboard under **Settings**.

Lucy uses these hours naturally in conversation. She does not read them out robotically -- she works them into her responses. For example:

> Caller: "Can I come in tomorrow at 7pm?"
> Lucy: "We close at 6pm on weekdays, but I can book you for 5pm tomorrow or any time Saturday morning. What works best?"

## After-hours behavior

Here is what happens when someone calls outside your business hours:

1. **Lucy still answers.** She never sends calls to voicemail. The phone gets picked up on the first ring, day or night.
2. **She identifies the caller's need.** Just like during business hours, she listens to what the caller wants.
3. **She tells them your hours.** If the caller wants to come in or schedule a visit, Lucy lets them know when you are open.
4. **She offers alternatives:**
   - Book an appointment for the next available time during business hours
   - Take a detailed message so you can follow up when you are back
   - Answer common questions that do not require you to be available (service info, location, etc.)
5. **She notifies you.** Every after-hours call generates a notification in your [Slack channel](../notifications/slack-alerts.md) and dashboard so you can follow up first thing in the morning.

The key point: callers who reach out after hours still get a helpful experience. They do not hear a ringing phone or a generic voicemail greeting. They talk to Lucy, get their question answered or their message taken, and hang up feeling good about your business.

## Holidays and special closures

If you close for holidays or have special hours on certain days, you have two options:

1. **Update your hours temporarily** in the dashboard before the holiday. Change them back when you reopen.
2. **Include common holidays in your hours description** when you set up, for example: `Mon-Fri 8am-5pm, closed major holidays.`

Lucy will reference whatever hours you have set. If a caller asks "are you open on Thanksgiving?" and your hours say "closed major holidays," Lucy will let them know.

For planned closures (vacation, training days, etc.), update your hours in advance so Lucy gives callers accurate information.

## How hours affect appointments

When Lucy books an appointment, she works within your stated hours. If your hours are Monday through Friday 8am to 6pm, she will not offer a Sunday slot. She suggests times that make sense for your schedule.

If a caller insists on a time outside your hours, Lucy explains that the time is not available and offers the closest alternative. She handles this gracefully -- no awkward silence, no confusion.

For more on how Lucy handles the full appointment booking flow, see [Booking Flow](../appointments/booking-flow.md).

## Tips

1. **Be specific with your hours.** "Mon-Fri 8-5" is better than "weekdays." The clearer your hours, the better Lucy communicates them.
2. **Include Saturday hours if applicable.** Many trade businesses work half-days on Saturday. Make sure Lucy knows.
3. **Check your hours after seasonal changes.** If your hours shift in summer or winter, update them so Lucy stays accurate.
4. **Do not worry about time zones.** Lucy operates in your local business time zone as configured during setup.


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
