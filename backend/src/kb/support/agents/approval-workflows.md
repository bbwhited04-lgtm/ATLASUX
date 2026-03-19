---
title: "Approval Workflows — How Decision Memos Work"
category: "Agents"
tags:
  - agents
  - approvals
  - decision-memo
  - safety
  - spending
related:
  - agents/agent-permissions
  - agents/how-agents-work
  - agents/what-are-agents
  - notifications/notification-channels
  - notifications/slack-alerts
---

# Approval Workflows — How Decision Memos Work

When one of your AI agents wants to do something significant, like spend money, publish content, or take a high-risk action, it does not just go ahead and do it. Instead, it creates a decision memo and waits for your approval. This article explains how that process works.

## Why Approvals Exist

You hired AI agents to save time, not to create surprises. The approval system exists for three reasons:

1. **Cost control.** No agent can spend your money without your explicit sign-off.
2. **Brand safety.** Nothing gets published to your social media accounts until you have reviewed it.
3. **Risk management.** Actions that could affect your business in significant ways require human judgment.

This is not about slowing things down. Routine tasks like answering calls, booking appointments, and drafting content happen instantly without any intervention from you. Approvals only kick in when the stakes are high enough that you should be in the loop.

## How the Process Works

Here is the step-by-step flow:

### 1. Agent Identifies a Task

An agent decides it needs to take an action that falls outside its automatic permissions. For example, Penny (the ads agent) has prepared a Facebook ad campaign, or Kelly wants to publish a batch of scheduled tweets.

### 2. Agent Creates a Decision Memo

The agent writes up a decision memo that includes:

- **What it wants to do.** A clear description of the proposed action.
- **Why.** The reasoning behind the action.
- **Cost.** If money is involved, the exact amount.
- **Risk level.** How the system has classified the risk.
- **Recommended action.** What the agent thinks you should do (approve or modify).

### 3. You Get Notified

The system sends you a notification through your configured channels. Depending on your [notification settings](../notifications/notification-channels.md), you might receive:

- A [Slack message](../notifications/slack-alerts.md) with the memo details and approve/reject options
- An [email notification](../notifications/email-notifications.md) with a link to review the memo
- An [SMS alert](../notifications/sms-notifications.md) for urgent or time-sensitive approvals

### 4. You Review and Decide

You read the memo and make a call:

- **Approve** — The agent proceeds with the action exactly as proposed.
- **Reject** — The agent stands down. The action is not taken.

### 5. Agent Proceeds (or Stops)

If approved, the agent executes the action and logs the result. If rejected, the agent records the rejection and moves on to other tasks.

## Real-World Examples

Here are some scenarios you might encounter:

**Scenario: Ad campaign**
Penny prepares a $75 Facebook ad campaign targeting local homeowners. She creates a decision memo: "Run 7-day Facebook ad campaign, $75 budget, targeting homeowners within 25 miles." You get a Slack notification, review the targeting and budget, and approve. The campaign launches.

**Scenario: Social media batch**
Kelly has drafted 12 tweets for the coming week. She submits them as a decision memo. You review the content, approve 10 of them, and reject 2 that do not match your brand voice. Kelly schedules the 10 approved tweets.

**Scenario: Recurring charge**
An agent proposes signing up for a monthly analytics tool at $29/month. Recurring charges are always flagged for approval regardless of amount. You see the memo, decide the tool is worth it, and approve.

**Scenario: High-value lead follow-up**
Mercer identifies a high-value prospect and wants to send a personalized outreach email sequence. Since this involves external customer communication, it requires your review. You approve the sequence with a small wording change.

## What Triggers an Approval

Not every action needs your sign-off. Here is the quick summary (see [Agent Permissions](../agents/agent-permissions.md) for the full list):

| Trigger | Example |
|---------|---------|
| Spending above your daily limit | $50 ad buy when your limit is $20/day |
| Any recurring charge | Monthly tool subscription at any price |
| Risk tier 2 or above | Publishing to public social channels |
| Actions on the agent's forbidden list | Lucy trying to make a purchase |

## Tips for Managing Approvals

- **Check notifications regularly.** Agents can queue up work while waiting, but time-sensitive actions (like responding to a trending topic) benefit from quick approvals.
- **Set up multiple notification channels.** Use [Slack](../notifications/slack-alerts.md) for real-time alerts and [email](../notifications/email-notifications.md) as a backup so nothing gets missed.
- **Review your spend limits.** If you find yourself approving the same type of low-dollar action repeatedly, you might want to adjust your daily spend limit to reduce approval friction.

## The Safety Net

Even after you approve an action, the system continues to enforce hard limits. Daily action caps and spend limits still apply. And every action, approved or not, is permanently recorded in the audit trail.

Your agents work for you. The approval system makes sure it stays that way.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
