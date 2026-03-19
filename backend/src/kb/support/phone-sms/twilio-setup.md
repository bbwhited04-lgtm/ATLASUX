---
title: "How Your Business Phone Number Works"
category: "Phone & SMS"
tags: ["phone number", "twilio", "call routing", "porting", "Lucy", "inbound calls"]
related: ["call-forwarding.md", "sms-confirmations.md", "missed-call-handling.md", "../getting-started/setup-wizard.md", "../lucy/how-lucy-answers.md"]
---

# How Your Business Phone Number Works

When a customer calls your Atlas UX phone number, Lucy picks up -- just like a real receptionist. Behind the scenes, your calls are powered by Twilio, one of the most reliable phone systems in the world. Companies like Lyft, Airbnb, and thousands of service businesses rely on Twilio every day. You don't need to know any of that, though. From your end, it just works.

## Getting Your Phone Number

When you set up your Atlas UX account, you have two options for the phone number Lucy answers:

### Option 1: Get a New Number from Atlas UX

This is the fastest way to get started. During the onboarding wizard, we provision a local or toll-free number for your business. You can choose an area code that matches your service area so customers see a familiar number when Lucy calls or texts back.

Your new number is ready to use immediately -- no waiting, no paperwork.

### Option 2: Port Your Existing Business Number

Already have a number your customers know? You can transfer (port) it to Atlas UX so Lucy answers on the same number your business has always used. Here's how porting works:

1. **Submit a port request** -- In your Atlas UX dashboard, go to **Settings > Phone** and select "Port my existing number." You'll enter your current number and carrier details.
2. **We handle the transfer** -- Our team coordinates with your current carrier. You'll receive updates by email as the port progresses.
3. **Number goes live** -- Once the port completes (typically 5-10 business days), Lucy starts answering on your existing number. There's no downtime -- your old line stays active until the switch happens.

**Tip:** Don't cancel your current phone service before the port is complete. Canceling early can cause the port to fail.

## How Calls Route to Lucy

Here's what happens when someone dials your Atlas UX number:

1. **The call comes in** -- Twilio receives the call and routes it to Lucy instantly.
2. **Lucy answers** -- She greets the caller using your business name and persona. For example: "Thanks for calling Mike's Plumbing, this is Lucy. How can I help you today?"
3. **Lucy handles the conversation** -- She can book appointments, answer questions about your services, take messages, or send the caller an SMS confirmation.
4. **You get notified** -- After the call, you receive a notification with a summary of what happened -- via the dashboard, Slack, email, or SMS, depending on your preferences.

The entire process takes less than a second from ring to pickup. Your customers never hear a busy signal.

## What Lucy Can Do on the Phone

Lucy isn't just a voicemail box. During a live call, she can:

- **Book appointments** directly onto your calendar
- **Answer questions** about your services, hours, and pricing
- **Send SMS confirmations** to the caller with appointment details
- **Take detailed messages** and forward them to you
- **Escalate to a human** if the caller asks to speak with a real person (routed to your fallback number)

You configure all of this in your dashboard. See [Setting Up Call Forwarding](call-forwarding.md) for how to set your fallback number.

## Managing Your Phone Settings

In **Settings > Phone**, you can:

- View your active phone number
- Set your hours of operation (Lucy adjusts her greeting accordingly)
- Configure your escalation/fallback number
- View call logs and recordings

## Common Questions

**Will my customers know it's an AI?**
Lucy sounds natural and conversational. Most callers won't realize they're speaking with AI. If someone asks directly, Lucy is honest about it.

**Can I have multiple phone numbers?**
Yes. If you operate in several service areas, you can add additional numbers and Lucy will answer each one with the right business greeting.

**Is there a per-minute charge?**
Your $99/month plan includes generous call minutes. Usage beyond the included minutes is billed at standard per-minute rates -- you'll see the details on your billing page.

## What's Next?

- Learn how Lucy sends [Automatic SMS Confirmations](sms-confirmations.md) after booking
- Set up [Call Forwarding](call-forwarding.md) from your existing line
- See how Atlas UX handles [Missed Calls](missed-call-handling.md) so you never lose a lead


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
