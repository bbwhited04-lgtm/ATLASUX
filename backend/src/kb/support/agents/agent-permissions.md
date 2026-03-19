---
title: "Agent Permissions — What Agents Can and Cannot Do"
category: "Agents"
tags:
  - agents
  - permissions
  - safety
  - spending
  - limits
related:
  - agents/approval-workflows
  - agents/how-agents-work
  - agents/agent-roles
  - notifications/notification-channels
---

# Agent Permissions — What Agents Can and Cannot Do

Your AI agents are powerful, but they are not running wild. Every agent operates within clearly defined boundaries. This article explains what agents can do on their own and what requires your approval.

## Actions That Happen Automatically

These are routine, low-risk tasks that agents handle without asking you first:

- **Answering phone calls.** Lucy picks up every call, greets the caller, and handles the conversation.
- **Taking messages.** When a caller wants to leave a message, Lucy captures it and sends it to you via [Slack](../notifications/slack-alerts.md) or [email](../notifications/email-notifications.md).
- **Booking appointments.** Lucy can schedule appointments based on your availability and send SMS confirmations to the caller.
- **Drafting content.** Social media agents can write post drafts, prepare captions, and create content calendars.
- **Research.** Binky and his research team can browse the web, analyze competitors, and prepare reports.
- **Internal communication.** Agents can message each other through Slack to coordinate on tasks.
- **Reading data.** Agents can view dashboards, read documents, and check schedules.

## Actions That Require Your Approval

Anything with real-world consequences beyond routine operations goes through the [approval workflow](../agents/approval-workflows.md):

### Spending Money

Any action that costs money is checked against your daily spend limit. If an agent wants to take an action that would exceed that limit, it must get your approval first. Examples:

- Running a paid ad campaign
- Purchasing a tool or subscription
- Any recurring charges (these are blocked by default, regardless of amount)

### Publishing Content

All social media agents are explicitly forbidden from publishing without approval. This means:

- New posts on X, Facebook, LinkedIn, TikTok, Threads, Reddit, Pinterest, Tumblr, Alignable, or the blog
- Replies to comments or community threads
- Auto-DMs to new followers

Agents draft the content. You review and approve it before it goes live.

### High-Risk Actions

The system assigns a risk tier to every action. Actions at risk tier 2 or above require a decision memo and your sign-off. High-risk actions include:

- Any financial commitment
- Publishing content to public channels
- Modifying business-critical settings
- Actions that affect customer data

## Hard Limits the System Enforces

These are not configurable per-agent preferences. They are system-wide safety guardrails that cannot be overridden:

### Daily Action Cap

There is a maximum number of actions any agent can take in a single day. Once that cap is reached, agents stop working and wait for the next day. This prevents runaway behavior.

### Daily Spend Limit

There is a dollar cap on how much agents can spend per day. If no limit is set, the system defaults to a hard stop, meaning agents cannot spend anything at all without explicit configuration.

### Recurring Charge Block

Recurring purchases are blocked by default. An agent cannot sign up for a monthly service, start a subscription, or commit to ongoing charges without going through the approval process.

### Forbidden Actions Per Agent

Each agent has a specific list of things they are explicitly forbidden from doing:

| Agent | Cannot Do |
|-------|-----------|
| Lucy | Spend money |
| All social media agents | Publish without approval |
| Penny (ads) | Spend or publish without approval |
| Claude Code (engineering) | Direct production database writes without approval |
| Vision (browser automation) | Access password fields, payment forms, banking sites |

## How You Get Notified

When an agent needs your approval, you are notified through your configured [notification channels](../notifications/notification-channels.md). You can receive alerts via:

- [Slack](../notifications/slack-alerts.md) — instant messages in your workspace
- [Email](../notifications/email-notifications.md) — for approvals that can wait
- [SMS](../notifications/sms-notifications.md) — for urgent approvals when you are on a job site

## The Audit Trail

Every action, whether auto-approved or manually approved, is logged in the audit trail. You can review what happened, when, and which agent did it. The audit trail uses a tamper-proof hash chain, so records cannot be altered after the fact.

For a walkthrough of the approval process itself, see [Approval Workflows](../agents/approval-workflows.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
