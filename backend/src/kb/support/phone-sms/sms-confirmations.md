---
title: "Automatic SMS Confirmations"
category: "Phone & SMS"
tags: ["sms", "text message", "appointment confirmation", "booking", "templates", "customization"]
related: ["twilio-setup.md", "missed-call-handling.md", "call-forwarding.md", "../appointments/managing-appointments.md", "../integrations/calendar-sync.md"]
---

# Automatic SMS Confirmations

When Lucy books an appointment for a customer during a phone call, she can send them a text message right away with the details. No extra steps, no manual follow-up. The customer hangs up the phone and immediately has the info they need in their pocket.

## What the Customer Receives

After Lucy books an appointment, the caller gets a text message that includes:

- **Your business name** -- So the customer knows who it's from
- **Date and time** -- The exact appointment slot that was booked
- **Service type** -- What they're coming in for (e.g., "AC inspection" or "haircut and color")
- **Your business address** -- If applicable for in-person appointments
- **A friendly closing** -- Something like "See you then! Reply to this text if you need to reschedule."

Here's an example of what a confirmation text looks like:

> Hi Sarah! Your appointment with Rivera HVAC is confirmed for Tuesday, March 24 at 10:00 AM -- AC inspection. Our address is 1420 Main St, Suite B. See you then! Reply here if you need to make changes.

Short, clear, and everything the customer needs in one message.

## When Confirmations Are Sent

SMS confirmations go out in two situations:

1. **During a phone call** -- When Lucy books an appointment while talking with the customer, she sends the confirmation before the call even ends. She'll say something like, "I just sent you a text with the details."
2. **After a web booking** -- If a customer books through your online scheduling page, they receive the same confirmation text automatically.

## Customizing Your SMS Templates

You're not stuck with a generic message. In your Atlas UX dashboard, go to **Settings > Notifications > SMS Templates** to adjust:

### Business Name Display
Choose how your business name appears in texts. Use your full legal name, a shortened version, or a brand name -- whatever your customers recognize.

### Message Tone
Pick from a few pre-written styles or write your own. Options range from casual and friendly to buttoned-up and professional. A plumber might want something relaxed; an insurance agency might prefer something more formal.

### Included Details
Toggle which details appear in the confirmation:
- Date and time (always included)
- Service type
- Business address or service area
- Prep instructions (e.g., "Please have your filter model number ready")
- Cancellation/reschedule instructions

### Reminders
In addition to the initial confirmation, you can set up reminder texts that go out:
- **24 hours before** the appointment
- **1 hour before** the appointment
- Or both

Reminders cut down on no-shows significantly. Most trade businesses see a 30-40% reduction in missed appointments just by turning on the 24-hour reminder.

## Reply Handling

When a customer replies to a confirmation text, Lucy handles it. She can:

- **Confirm the appointment** if the customer replies "yes" or "confirmed"
- **Start a reschedule** if the customer asks to change the time
- **Take a message** if the customer has a question Lucy can't resolve
- **Forward to you** if the message needs a human touch

All inbound texts show up in your Atlas UX dashboard under **Messages**, so you have a complete history of every conversation.

## Costs and Limits

SMS confirmations are included in your Atlas UX plan. Standard-rate texts (within the US and Canada) don't cost extra. If you're sending a very high volume of messages, you'll see a usage summary on your billing page.

## Common Questions

**Can I turn off SMS confirmations?**
Yes. Go to **Settings > Notifications** and toggle off "Send SMS after booking." We don't recommend it -- customers expect a confirmation -- but it's your call.

**What if the customer gave a landline number?**
Lucy detects landlines and skips the text. The appointment is still booked; the customer just won't get an SMS.

**Do confirmations work for walk-in businesses?**
If your business doesn't take appointments, you probably won't need this feature. But if you handle any scheduled work -- estimates, consultations, service calls -- confirmations are a game-changer.

## What's Next?

- Learn how your [Business Phone Number Works](twilio-setup.md) with Atlas UX
- Set up [Call Forwarding](call-forwarding.md) to route calls from your existing line
- See how [Missed Call Handling](missed-call-handling.md) makes sure no lead slips through


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
