---
title: "Missed Call Handling"
category: "Phone & SMS"
tags: ["missed calls", "notifications", "callbacks", "lead capture", "voicemail", "reliability"]
related: ["twilio-setup.md", "call-forwarding.md", "sms-confirmations.md", "../notifications/notification-settings.md", "../lucy/how-lucy-answers.md"]
---

# Missed Call Handling

Lucy answers your phone 24 hours a day, 7 days a week. She doesn't take lunch breaks, call in sick, or let the phone ring while she finishes something else. That said, no system is perfect -- so Atlas UX is built with multiple layers of backup to make sure you never lose a lead.

## How Often Does Lucy Miss a Call?

Rarely. Lucy's voice system runs on enterprise-grade infrastructure (ElevenLabs and Twilio) with 99.9%+ uptime. In normal operation, Lucy picks up within one second of the first ring.

The situations where a call might not connect are uncommon edge cases:

- A brief network interruption between the caller and the phone system
- An extremely high volume of simultaneous calls (dozens at once)
- A carrier-level outage on the caller's end

Even in these cases, Atlas UX has your back.

## What Happens If a Call Is Missed

If for any reason a call doesn't connect to Lucy, here's the safety net:

### 1. Voicemail Captures the Message

The call automatically rolls to voicemail. The caller hears your business greeting and can leave a message. The recording is:

- **Transcribed automatically** -- You get the full text, not just an audio file
- **Delivered to your dashboard** -- It appears in your Messages inbox instantly
- **Sent to your phone** -- Via SMS or push notification, depending on your settings

### 2. You Get a Missed Call Notification

Within seconds of a missed call, you receive a notification that includes:

- **Caller's phone number** -- So you can call back immediately
- **Time of the call** -- With timezone
- **CRM match** -- If the caller is already in your contacts, you'll see their name and history
- **Voicemail transcript** -- If they left a message

Notifications go to whichever channels you've turned on:
- **Dashboard** (always on)
- **Email**
- **SMS to your cell**
- **Slack** (if connected)

You configure these in **Settings > Notifications**. We recommend having at least two channels active so nothing slips through.

### 3. Automatic Follow-Up Text

If Atlas UX detects a missed call, it can automatically send the caller a text message:

> "Hi, this is [Your Business Name]. Sorry we missed your call! We'll get back to you shortly. If you'd like to book an appointment, reply to this text or call us back anytime -- Lucy is available 24/7."

This keeps the lead warm and lets the customer know you're responsive, even if the call didn't connect. You can customize this message in **Settings > Notifications > Missed Call SMS**.

## Callback Features

Your dashboard makes it easy to follow up on any missed call:

### One-Tap Callback
From the missed call notification in your dashboard, tap the phone number to call back. Lucy can also place the callback on your behalf -- she'll dial the customer, greet them, and then connect you once they pick up.

### Callback Queue
All missed calls appear in a callback queue in your dashboard. Each entry shows:
- Caller name (if known)
- Phone number
- Time of the missed call
- Whether they left a voicemail
- Whether you've already returned the call

Mark calls as "returned" to keep your queue clean. If a call goes unreturned for more than 2 hours, you'll get a reminder notification.

### Outbound Call Scheduling
If you can't call back right away, schedule a callback for later. Atlas UX will remind you at the scheduled time and can even have Lucy place the call when you're ready.

## The Business Impact

Missed calls are expensive. Industry data shows that 85% of callers who reach voicemail don't leave a message, and 75% of those callers don't call back. For a plumber or HVAC tech, that's real money walking out the door.

Atlas UX is designed to minimize missed calls to nearly zero. But when the rare one slips through, the layered notification and follow-up system makes sure you get back to the customer fast -- before they call your competitor.

## How to Review Your Call History

All calls -- answered, missed, and returned -- are logged in **Dashboard > Calls**. You can filter by:

- Date range
- Status (answered, missed, voicemail)
- Caller (name or phone number)
- Duration

Export your call history anytime for your records or bookkeeping.

## Common Questions

**Can I set quiet hours for notifications?**
Yes. In **Settings > Notifications**, you can set "Do Not Disturb" hours. Missed calls are still logged and the follow-up text still goes out -- you just won't get pinged at 2 AM.

**What if someone calls and hangs up before voicemail?**
Atlas UX still logs the call and the caller's number. You'll get a missed call notification so you can call back.

**Does Lucy ever go completely offline?**
Lucy's infrastructure is designed for continuous uptime. Planned maintenance (rare) happens during off-peak hours and typically lasts less than a minute. You'll be notified in advance.

## What's Next?

- Learn how your [Business Phone Number Works](twilio-setup.md) with Atlas UX
- Set up [Call Forwarding](call-forwarding.md) from your existing business line
- See how Lucy sends [Automatic SMS Confirmations](sms-confirmations.md) after booking
- Explore [Social Media posting](../social-media/creating-posts.md) to keep your business visible online


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
