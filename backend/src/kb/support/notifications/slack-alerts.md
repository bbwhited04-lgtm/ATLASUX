---
title: "Slack Notifications — Real-Time Alerts in Your Workspace"
category: "Notifications"
tags:
  - notifications
  - slack
  - alerts
  - calls
  - appointments
related:
  - notifications/email-notifications
  - notifications/sms-notifications
  - notifications/notification-channels
  - agents/approval-workflows
  - agents/what-are-agents
---

# Slack Notifications — Real-Time Alerts in Your Workspace

Slack is the fastest way to stay informed about what your AI team is doing. When Lucy answers a call, when an appointment gets booked, or when an agent needs your approval, you get a message in Slack within seconds.

## What You Receive in Slack

### New Call Alerts

Every time Lucy answers a phone call, you get a Slack notification with:

- **Caller name** (if available from caller ID)
- **Phone number**
- **Reason for calling** — Lucy summarizes what the caller wanted
- **Action taken** — whether Lucy booked an appointment, took a message, or transferred the call
- **Call duration**

This means you never have to wonder "did anyone call while I was on a job?" You can scroll through your Slack channel and see every call that came in.

### Appointment Confirmations

When Lucy books an appointment, Slack shows you:

- **Customer name and phone number**
- **Date and time** of the appointment
- **Service requested** — what the customer needs done
- **Confirmation status** — whether an SMS confirmation was sent to the customer

### Messages Taken

When a caller wants to leave a message instead of booking, you get the full message in Slack:

- **Who called**
- **Their phone number**
- **The complete message** in the caller's own words
- **Urgency flag** — if the caller indicated it was urgent, the message is marked accordingly

### Agent Activity

Beyond calls, your Slack workspace also receives updates about agent activity:

- **Approval requests** — when an agent needs your sign-off on a [decision memo](../agents/approval-workflows.md)
- **Task completions** — when agents finish significant work items
- **System health alerts** — if something needs your attention (like a failed integration)

## How Agents Appear in Slack

Each agent posts to Slack with their own name and avatar. Lucy shows up as "Lucy" with a telephone icon. Binky shows up as "Binky" with a magnifying glass. This makes it easy to scan your channel and know who is reporting what.

Your agents also communicate with each other through Slack channels. This is part of how they coordinate work internally. You can observe these conversations if you want to see how your team is collaborating.

## Setting Up Slack

To connect Slack to your Atlas UX account:

1. **Go to Settings** in your Atlas UX dashboard.
2. **Select Integrations** and find the Slack section.
3. **Click Connect to Slack** — this will open a Slack authorization page.
4. **Choose your workspace** and authorize the Atlas UX bot.
5. **Select a channel** where you want notifications delivered (or create a new one like `#atlas-alerts`).

Once connected, notifications start flowing immediately. There is nothing else to configure.

## Tips for Organizing Slack Notifications

- **Create a dedicated channel.** A channel like `#lucy-calls` or `#atlas-alerts` keeps business notifications separate from your regular Slack conversations.
- **Use Slack's notification settings.** If you do not want your phone buzzing for every call, set the channel to notify you only for urgent messages or mentions.
- **Pin important messages.** When Lucy flags an urgent message or a high-value lead calls, pin that message so you can follow up later.
- **Check the channel at end of day.** Even if you cannot respond in real time, a quick scroll through the channel gives you a complete picture of every call and booking from that day.

## Slack + Other Channels

Slack works best as your real-time notification channel. For less urgent updates, pair it with [email notifications](../notifications/email-notifications.md) for daily summaries. For truly urgent events when you are away from Slack, set up [SMS notifications](../notifications/sms-notifications.md) as a backup.

See [Notification Channels](../notifications/notification-channels.md) for a complete guide to configuring all three channels together.


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
