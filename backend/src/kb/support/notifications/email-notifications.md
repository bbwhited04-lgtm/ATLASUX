---
title: "Email Notifications — Summaries and Important Updates"
category: "Notifications"
tags:
  - notifications
  - email
  - summaries
  - billing
  - approvals
related:
  - notifications/slack-alerts
  - notifications/sms-notifications
  - notifications/notification-channels
  - agents/approval-workflows
  - agents/agent-permissions
---

# Email Notifications — Summaries and Important Updates

Email is your catch-all notification channel. While [Slack](../notifications/slack-alerts.md) handles real-time alerts and [SMS](../notifications/sms-notifications.md) handles urgent on-the-go notifications, email gives you structured summaries and a permanent record of important events.

## What Arrives in Your Inbox

### Daily Summaries

Every morning, you receive a daily summary email that covers everything your AI team did in the last 24 hours:

- **Total calls answered** — how many calls Lucy handled, broken down by outcome (appointment booked, message taken, general inquiry)
- **Appointments booked** — a list of every appointment scheduled, with customer names, times, and services
- **Messages taken** — any caller messages that still need your attention
- **Agent activity highlights** — notable actions taken by your social media and research agents
- **System health** — whether all integrations are running normally

This is your morning briefing. One email, everything you need to know about yesterday.

### Appointment Confirmations

When Lucy books an appointment, you receive an email confirmation with:

- Customer contact information
- Appointment date, time, and service
- Whether the customer received an SMS confirmation
- A link to view or modify the appointment in your dashboard

### Approval Requests

When an agent creates a [decision memo](../agents/approval-workflows.md) that needs your sign-off, you receive an email with:

- What the agent wants to do
- Why they are proposing it
- The cost (if applicable)
- The risk level
- A link to approve or reject directly from the email

This is your backup for approvals you might miss in Slack. Agents wait patiently, so there is no rush, but reviewing these promptly keeps your team productive.

### Billing Notifications

You receive email notifications for billing events:

- **Payment receipts** — confirmation when your monthly subscription is charged
- **Payment failures** — if a charge does not go through, you are notified immediately
- **Plan changes** — confirmation when you upgrade, downgrade, or modify your subscription

### Agent Action Reports

For actions that agents complete after your approval, you receive a follow-up email confirming:

- The action was executed successfully
- What the outcome was
- Any relevant metrics (for example, a social media post's initial engagement)

## Email Delivery

Notification emails come from your Atlas UX account's configured email address. Each agent has their own email identity, so you can tell at a glance which agent is reporting:

- Lucy's appointment confirmations come from Lucy's email address
- Binky's research briefings come from Binky's email address
- System notifications (billing, health alerts) come from the platform address

## Managing Email Notifications

### What You Can Configure

From your Atlas UX dashboard under Settings, you can control:

- **Which events trigger emails.** Toggle specific notification types on or off.
- **Daily summary timing.** Choose when your daily summary arrives (default is 7:00 AM in your time zone).
- **Urgency routing.** Send high-priority events (like payment failures or urgent customer messages) to email immediately, while batching lower-priority updates into the daily summary.

### Avoiding Email Overload

If you are active on [Slack](../notifications/slack-alerts.md), you may not need real-time email notifications for every event. A good setup is:

- **Slack** for real-time call alerts and agent activity
- **Email** for daily summaries, billing, and approval requests
- **SMS** for urgent events when you are away from both Slack and email

See [Notification Channels](../notifications/notification-channels.md) for a guide to setting up all three channels to work together.

## Keeping Your Records

Unlike Slack messages that scroll by, emails give you a searchable archive of every important event. If you need to look up when a specific customer called, what appointment was booked last Tuesday, or when your last payment went through, your email inbox has it.


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
