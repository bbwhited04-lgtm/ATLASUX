---
title: "SMS Notifications — Alerts on the Go"
category: "Notifications"
tags:
  - notifications
  - sms
  - text-messages
  - urgent
  - mobile
related:
  - notifications/slack-alerts
  - notifications/email-notifications
  - notifications/notification-channels
  - agents/what-are-agents
  - agents/approval-workflows
---

# SMS Notifications — Alerts on the Go

You are a trade professional. You are on a roof, under a sink, or driving between jobs. You are not staring at a laptop all day. SMS notifications make sure the most important alerts reach you no matter where you are.

## What Gets Sent as SMS

SMS is reserved for events that cannot wait. Not every agent action triggers a text message. Here is what does:

### New Appointments

When Lucy books an appointment, you receive a text with:

- Customer name
- Date and time
- Service requested

This lets you plan your schedule in real time. You see the booking the moment it happens, not when you get back to your desk.

### Appointment Cancellations

If a customer cancels or reschedules, you get an immediate text so you can adjust your day. No more showing up to a job that was cancelled two hours ago.

### Urgent Caller Messages

When a caller tells Lucy something is urgent — a burst pipe, a furnace failure, an emergency repair — Lucy flags the message as urgent and sends it to you via SMS immediately. The text includes:

- Caller name and phone number
- The message summary
- An urgency flag so you know to call back fast

### High-Priority Approval Requests

If an agent needs your approval for something time-sensitive, you can receive an SMS alert with a brief summary and a link to review the [decision memo](../agents/approval-workflows.md) in your dashboard.

## What Does Not Get Sent as SMS

To keep your text messages useful and uncluttered, routine events are not sent via SMS:

- Regular (non-urgent) call summaries — these go to [Slack](../notifications/slack-alerts.md)
- Daily activity summaries — these go to [email](../notifications/email-notifications.md)
- Agent internal activity — coordinated through Slack
- Billing receipts — sent via email

The goal is simple: when your phone buzzes with an Atlas UX text, it means something that needs your attention right now.

## Setting Up SMS Notifications

To configure SMS alerts:

1. **Go to Settings** in your Atlas UX dashboard.
2. **Select Notifications** and find the SMS section.
3. **Enter your mobile phone number** — this is the number that will receive texts.
4. **Choose which events trigger SMS.** Toggle on the event types you want:
   - New appointment booked
   - Appointment cancelled or rescheduled
   - Urgent caller message
   - High-priority approval request
5. **Save your settings.**

You will receive a confirmation text to verify your number. Reply to confirm, and you are set.

## Configuring Which Events Trigger SMS

Every business is different. A plumber who handles emergencies wants urgent caller messages via SMS. A salon owner might only want appointment changes. You control exactly which events trigger a text.

From the SMS settings page, you can toggle each event type independently:

| Event | Default | Recommended |
|-------|---------|-------------|
| New appointment | On | On for all businesses |
| Cancellation / reschedule | On | On for all businesses |
| Urgent caller message | On | On, especially for emergency trades |
| Approval request | Off | On if you are frequently away from Slack |

## Quiet Hours

You can set quiet hours so SMS notifications are held until morning. For example, if you set quiet hours from 10 PM to 6 AM:

- Urgent messages are still delivered immediately (emergencies do not wait)
- Appointment bookings and other non-urgent texts are queued and delivered at 6 AM

This way, a customer booking a haircut at 11 PM does not wake you up, but a caller reporting a gas leak at 2 AM still gets through.

## SMS + Other Channels

SMS works best as your urgent-only channel. Pair it with:

- [Slack](../notifications/slack-alerts.md) for real-time visibility into all calls and agent activity
- [Email](../notifications/email-notifications.md) for daily summaries and billing

See [Notification Channels](../notifications/notification-channels.md) for a guide to setting up the right mix for your business.


---
## Media

> **Tags:** `slack` · `notifications` · `webhooks` · `bot` · `integration` · `api`

### Official Resources
- [Official Documentation](https://api.slack.com)
- [Slack API Documentation](https://api.slack.com)
- [Slack Bolt Framework](https://api.slack.com/bolt)

### Video Tutorials
- [Slack API Bot Tutorial - Build Integrations](https://www.youtube.com/results?search_query=slack+api+bot+tutorial+build+integrations+2025) — *Credit: Slack on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
