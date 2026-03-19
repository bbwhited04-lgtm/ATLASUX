---
title: "Notification Channels — Setting Up Your Alerts"
category: "Notifications"
tags:
  - notifications
  - setup
  - configuration
  - slack
  - email
  - sms
related:
  - notifications/slack-alerts
  - notifications/email-notifications
  - notifications/sms-notifications
  - agents/approval-workflows
  - agents/agent-permissions
  - agents/what-are-agents
---

# Notification Channels — Setting Up Your Alerts

Atlas UX keeps you informed through three notification channels: Slack, email, and SMS. Each channel serves a different purpose, and you can configure them to match how you work. This guide helps you set up the right combination.

## The Three Channels at a Glance

| Channel | Best For | Speed | Where You See It |
|---------|----------|-------|------------------|
| [Slack](../notifications/slack-alerts.md) | Real-time visibility into all activity | Instant | Desktop or phone app |
| [Email](../notifications/email-notifications.md) | Daily summaries, billing, permanent records | Minutes | Inbox |
| [SMS](../notifications/sms-notifications.md) | Urgent alerts when you are away from a screen | Instant | Phone text messages |

## Recommended Setup by Business Type

Different businesses need different notification setups. Here are recommendations based on how you work:

### Plumber / HVAC / Emergency Trades

You handle emergencies and need to know about urgent calls immediately.

- **SMS:** On for urgent caller messages, new appointments, and cancellations
- **Slack:** On for all call summaries and agent activity
- **Email:** On for daily summaries and billing

### Salon / Barbershop / Spa

Your schedule is your business. Appointment changes matter most.

- **SMS:** On for new appointments and cancellations
- **Slack:** On for all call summaries
- **Email:** On for daily summaries, billing, and approval requests

### General Contractor / Landscaping

You are on job sites all day and check in at the end of the day.

- **SMS:** On for urgent messages and cancellations only
- **Slack:** On for everything (review when you have a break)
- **Email:** On for daily summaries (your morning briefing)

### Office-Based Service Business

You have a desk and can monitor Slack throughout the day.

- **SMS:** Off or urgent-only
- **Slack:** On for everything (your primary channel)
- **Email:** On for daily summaries and billing

## How to Configure Each Channel

### Slack Setup

1. Go to **Settings** in your dashboard.
2. Select **Integrations** and find **Slack**.
3. Click **Connect to Slack** and authorize the Atlas UX bot in your workspace.
4. Choose a channel for notifications (or create a new one like `#atlas-alerts`).

Detailed walkthrough: [Slack Notifications](../notifications/slack-alerts.md)

### Email Setup

Email notifications use the address associated with your Atlas UX account. To adjust what you receive:

1. Go to **Settings** in your dashboard.
2. Select **Notifications** and find **Email**.
3. Toggle event types on or off.
4. Set your daily summary delivery time.

Detailed walkthrough: [Email Notifications](../notifications/email-notifications.md)

### SMS Setup

1. Go to **Settings** in your dashboard.
2. Select **Notifications** and find **SMS**.
3. Enter your mobile phone number and verify it.
4. Toggle which events trigger a text message.
5. Optionally set quiet hours.

Detailed walkthrough: [SMS Notifications](../notifications/sms-notifications.md)

## Setting Priorities — Which Events Go Where

Here is a practical guide to routing events to the right channel:

| Event | Slack | Email | SMS |
|-------|-------|-------|-----|
| Every call answered | Yes | In daily summary | No |
| Appointment booked | Yes | Yes | Yes (recommended) |
| Appointment cancelled | Yes | Yes | Yes |
| Caller message (normal) | Yes | In daily summary | No |
| Caller message (urgent) | Yes | Yes | Yes |
| Agent approval request | Yes | Yes | Optional |
| Daily summary | No (real-time already) | Yes | No |
| Billing receipt / failure | No | Yes | No |
| System health alert | Yes | Yes | No |

## Quiet Hours

Both Slack and SMS support quiet hours. During quiet hours:

- **Non-urgent notifications** are held and delivered when quiet hours end.
- **Urgent notifications** (emergency caller messages) are always delivered immediately.

To set quiet hours, go to **Settings** then **Notifications** then **Quiet Hours**. Choose your start and end times. A common setting for trade businesses is 9 PM to 6 AM.

## Testing Your Setup

After configuring your channels, you can send a test notification from the Settings page. This sends a sample alert through each enabled channel so you can confirm everything is connected and working.

## Changing Your Settings Later

Your notification preferences are not permanent. As your business grows or your workflow changes, come back to Settings and adjust. Many business owners start with everything enabled and then fine-tune over the first few weeks.

## Related Articles

- [What Are AI Agents?](../agents/what-are-agents.md) — understand the team that generates these notifications
- [Approval Workflows](../agents/approval-workflows.md) — how agent approvals arrive as notifications
- [Agent Permissions](../agents/agent-permissions.md) — what triggers notifications versus what happens silently


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
