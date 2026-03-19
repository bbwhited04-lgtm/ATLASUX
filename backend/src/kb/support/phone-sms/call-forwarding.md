---
title: "Setting Up Call Forwarding"
category: "Phone & SMS"
tags: ["call forwarding", "business line", "routing", "voicemail", "fallback", "escalation"]
related: ["twilio-setup.md", "sms-confirmations.md", "missed-call-handling.md", "../getting-started/setup-wizard.md", "../lucy/how-lucy-answers.md"]
---

# Setting Up Call Forwarding

If you already have a business phone number that your customers know, you don't have to give it up. You can forward calls from your existing line to your Atlas UX number, so Lucy answers every call -- even the ones dialed to your old number.

This guide covers how to set up forwarding, your options for routing rules, and what happens when calls need to reach a real person.

## Why Forward Calls to Lucy?

Most trade businesses have one of these problems:

- You're on a job and can't answer the phone
- Calls go to voicemail and customers hang up
- You answer, but you're distracted and forget to book the appointment
- After-hours calls are completely lost

Call forwarding solves all of this. Your phone number stays the same. Your customers dial the same number they always have. But instead of ringing your pocket or going to voicemail, Lucy picks up and handles it professionally.

## How to Set Up Forwarding

### Step 1: Find Your Atlas UX Number

Log into your dashboard and go to **Settings > Phone**. You'll see your Atlas UX phone number listed at the top. This is the number you'll forward calls to.

### Step 2: Set Up Forwarding on Your Current Line

The exact steps depend on your phone carrier. Here are the most common:

**From a cell phone:**
- **All calls:** Dial `*72` followed by your Atlas UX number, then press call. You'll hear a confirmation tone.
- **Unanswered calls only:** Dial `*71` followed by your Atlas UX number. This forwards calls only when you don't pick up.
- **To cancel forwarding:** Dial `*73` and press call.

**From a landline or office phone:**
- Contact your phone provider (AT&T, Verizon, Spectrum, etc.) and request call forwarding to your Atlas UX number. Most providers can set this up in minutes.

**From a VoIP system (RingCentral, Grasshopper, Google Voice, etc.):**
- Log into your VoIP dashboard and add your Atlas UX number as a forwarding destination. Most VoIP systems let you set this up in the call routing or auto-attendant settings.

**Tip:** If you're not sure how to forward on your carrier, search "[your carrier name] call forwarding" or call their support line. It's a standard feature on every phone plan.

### Step 3: Test It

After setting up forwarding, call your business number from a different phone. You should hear Lucy answer with your business greeting. If the call still goes to your old voicemail, double-check that forwarding is active.

## Forwarding Rules

You have flexibility in how calls route to Lucy. Choose the setup that fits your work style:

### Forward All Calls
Every call goes directly to Lucy. This is the most common setup for trade businesses -- Lucy handles everything and only escalates when needed. You stay focused on the job.

### Forward When Busy or Unanswered
Calls ring your phone first. If you don't answer within a set number of rings (usually 4-6), the call forwards to Lucy. This gives you the option to answer personally when you can, with Lucy as your safety net.

### Forward After Hours Only
During business hours, calls ring your phone or front desk normally. Outside those hours, calls go to Lucy. Great if you have staff answering phones during the day but need coverage for evenings and weekends.

### Schedule-Based Forwarding
Some VoIP systems let you create time-based rules. For example: forward to Lucy on weekdays before 8 AM and after 6 PM, all day on weekends, and any time you're marked as "on a job" in your calendar.

## Escalation: When Calls Need a Human

Sometimes a caller needs to speak with a real person -- an upset customer, a complex estimate, or an emergency. Lucy handles this by offering to transfer the call to your **escalation number**.

Set your escalation number in **Settings > Phone > Escalation Number**. This can be:

- Your personal cell phone
- An office manager's line
- A rotating on-call number

When Lucy transfers a call, she gives the caller a warm handoff: "Let me connect you with the team directly." You'll also get a notification with context about what the caller needs.

## Voicemail Fallback

If Lucy can't complete the call for any reason (extremely rare -- see [Missed Call Handling](missed-call-handling.md)), the system falls back to voicemail. The recording is transcribed and delivered to your dashboard, email, and Slack so you can follow up quickly.

## Common Questions

**Will forwarding cost extra on my phone plan?**
Most carriers include call forwarding in standard plans. Some may charge a small fee -- check with your provider.

**Can I forward from multiple numbers?**
Yes. If you have several business lines (main line, direct lines, etc.), you can forward all of them to your Atlas UX number.

**How do I stop forwarding?**
Dial `*73` from your phone, or remove the forwarding rule in your VoIP dashboard. Calls will go back to ringing your phone directly.

## What's Next?

- Learn how your [Business Phone Number Works](twilio-setup.md) with Atlas UX
- See how Lucy sends [Automatic SMS Confirmations](sms-confirmations.md) after booking
- Understand [Missed Call Handling](missed-call-handling.md) and how no lead gets lost


---
## Media

> **Tags:** `twilio` · `sms` · `voice` · `phone` · `programmable` · `webhooks` · `twiml`

### Official Resources
- [Official Documentation](https://www.twilio.com/docs)
- [Twilio Documentation](https://www.twilio.com/docs)
- [Twilio Voice API](https://www.twilio.com/docs/voice)
- [Twilio SMS API](https://www.twilio.com/docs/sms)

### Video Tutorials
- [Twilio Voice & SMS Integration Tutorial](https://www.youtube.com/results?search_query=twilio+voice+sms+integration+tutorial+2025) — *Credit: Twilio on YouTube* `tutorial`
- [Building an AI Phone System with Twilio](https://www.youtube.com/results?search_query=ai+phone+system+twilio+tutorial) — *Credit: AI Dev on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
