---
title: "How Agents Work — Behind the Scenes"
category: "Agents"
tags:
  - agents
  - engine
  - tools
  - safety
related:
  - agents/what-are-agents
  - agents/agent-roles
  - agents/agent-permissions
  - agents/approval-workflows
---

# How Agents Work — Behind the Scenes

You do not need to understand the technical details to use Atlas UX. But if you are curious about what is happening under the hood when your AI team is working, this article explains it in plain language.

## The Engine Loop

At the heart of Atlas UX is something called the engine loop. Think of it as a heartbeat that pulses every few seconds. Each pulse, the system checks: Are there tasks waiting? Does an agent need to act? Is anything overdue?

When there is work to do, the engine assigns it to the right agent based on their role. Lucy handles incoming calls. Kelly handles X posts. Binky handles research. Each agent picks up their tasks automatically.

## How an Agent Completes a Task

Here is what happens when an agent receives a task, step by step:

1. **Task arrives.** A customer calls, a social post is scheduled, or a workflow triggers a new job.
2. **Agent picks it up.** The engine routes the task to the agent whose role matches the work.
3. **Agent uses tools.** Each agent has access to specific tools. Lucy can use Twilio to answer calls and send SMS messages. Kelly can use the X API to post tweets. Fran can use the Facebook Graph API to publish posts.
4. **Safety checks run.** Before any action is executed, the system checks: Does this cost money? Is it above the daily action limit? Does it need human approval? (See [Agent Permissions](../agents/agent-permissions.md) for the full breakdown.)
5. **Action happens or approval is requested.** If the action is routine, it proceeds. If it is high-risk or involves spending, the agent creates a [decision memo](../agents/approval-workflows.md) and waits for your approval.
6. **Everything is logged.** Every action, every decision, every approval is recorded in an audit trail. Nothing happens in the dark.

## Tools Agents Use

Agents are not just chatbots making conversation. They have real tools that connect to real services:

- **Phone and SMS** — Lucy uses Twilio to answer calls and ElevenLabs for natural-sounding voice conversations. She can send SMS confirmations to callers.
- **Social media APIs** — Each social agent connects to their platform's API to publish posts, read comments, track engagement, and manage followers.
- **Web research** — Binky and Archy can search the web using multiple research providers to gather competitive intelligence and industry news.
- **Microsoft 365** — Agents can draft emails, create documents, manage calendars, and coordinate through Teams.
- **Slack** — Agents communicate with each other (and notify you) through Slack channels.

## Safety Rules and Guardrails

Every agent operates within strict boundaries. These are not suggestions; they are hard limits enforced by the system.

- **Daily action caps.** There is a maximum number of actions any agent can take per day. Once the cap is reached, agents stop and wait.
- **Spending limits.** Any action that costs money is checked against your daily spend limit. If an action would exceed it, the agent must get your approval.
- **Forbidden actions.** Agents have explicit lists of things they cannot do. Social media agents cannot publish without approval. Lucy cannot spend money. The engineering agent cannot write directly to the production database without approval.
- **Risk tiers.** Every action is assigned a risk level. Low-risk actions (answering a phone call, drafting a document) proceed automatically. Higher-risk actions (spending money, publishing content, making recurring commitments) require approval.

For the complete list of what needs approval versus what does not, see [Agent Permissions](../agents/agent-permissions.md).

## The Audit Trail

Every single action is logged. This includes what the agent did, when it did it, what tools it used, and whether it was auto-approved or required your sign-off. You can review this trail at any time.

This is not just for your peace of mind. It is how the system maintains accountability. If something goes wrong, you can trace exactly what happened and why.

## What You Do Not Need to Worry About

- You do not need to "program" your agents. They come pre-configured with their roles and tools.
- You do not need to babysit them. Routine tasks happen automatically.
- You do not need to understand APIs or code. The dashboard shows you what your team is doing in plain English.

Want to know specifically what your agents can do without asking? Read [Agent Permissions](../agents/agent-permissions.md). Want to see how approvals work in practice? Read [Approval Workflows](../agents/approval-workflows.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
