# Workflow System

## What Are Workflows?

Workflows in Atlas UX are predefined sequences of agent actions that automate complex, multi-step business processes. Instead of manually coordinating tasks between agents, workflows define the steps, ordering, triggers, and conditions that drive automated execution.

A workflow is like a playbook — it tells the system what needs to happen, in what order, and which agents are responsible for each step.

## Workflow Registry

Atlas UX maintains a comprehensive workflow registry spanning over 100 defined workflows. These are organized by function:

### Core Operations (WF-001 to WF-021)
The foundational workflows that handle essential business operations:
- WF-001 through WF-009: Infrastructure and system maintenance tasks
- WF-010: **Daily Operations** — The master daily workflow that kicks off routine business activities
- WF-011 through WF-021: Standard operational procedures

### n8n Manifest Workflows (WF-022 to WF-092)
Extended workflows covering specialized functions:
- WF-031: **Daily Intelligence** — Market and competitive intelligence gathering
- WF-033: Daily Intel agent workflow
- WF-034: Archy (research agent) workflow
- WF-054 to WF-059: Social media publisher workflows
- WF-063: Mercer (acquisition agent) workflow
- WF-084 to WF-089: Operations agent workflows
- WF-092: Cheryl (customer support) workflow

### Platform Intelligence Sweep (WF-093 to WF-105)
A coordinated 13-agent intelligence sweep that runs daily:
- Each agent scans its assigned platform for relevant activity
- Results are collected and aggregated
- Fires sequentially from 05:00 to 05:36 UTC

### Orchestration (WF-106+)
- WF-106: **Atlas Daily Aggregation & Task Assignment** — The CEO agent (Atlas) reviews all intelligence reports and assigns tasks for the day. Fires at 05:45 UTC after the intelligence sweep completes.

## Workflow Scheduling

Workflows can be triggered in several ways:

### Time-Based (Cron)
The scheduler worker fires workflows at configured times:

| Workflow | Schedule | Description |
|---|---|---|
| WF-010 | 08:30 UTC | Daily operations |
| WF-031 | 06:00 UTC | Daily intelligence |
| WF-093-105 | 05:00-05:36 UTC | Platform intel sweep |
| WF-106 | 05:45 UTC | Atlas daily aggregation |

### Event-Based
Workflows can be triggered by system events:
- Webhook receipts from external services
- Job completion (one workflow triggers another)
- Decision Memo approvals
- Threshold crossings (e.g., error rate exceeds limit)

### Manual
Users can trigger workflows on demand through:
- The Workflow Manager UI
- Direct API calls to workflow endpoints
- Agent commands

## Workflow Execution

### Step Processing

Each workflow consists of ordered steps. The engine processes them sequentially:

1. **Step initialization** — Load step configuration and required context
2. **Agent assignment** — Identify and assign the responsible agent
3. **Pre-execution check** — Validate SGL policies and safety guardrails
4. **Execution** — The agent performs the step's action using available tools
5. **Result capture** — Store the step's output for use by subsequent steps
6. **Condition evaluation** — Check if the step's output meets conditions for proceeding
7. **Next step** — Advance to the next step or branch based on conditions

### Branching and Conditions

Workflows support conditional logic:
- **If/then branching** — Take different paths based on step results
- **Error handling** — Specific steps for failure recovery
- **Skip conditions** — Skip steps that are not relevant based on earlier results
- **Parallel execution** — Some workflows allow multiple steps to run concurrently

### Canonical Workflow Keys

The engine recognizes canonical workflow keys that enable workflow execution without requiring a database entry. This fallback mechanism ensures that standard workflows can always run, even if the database workflow table has not been populated. The workflow registry in `workflowsRoutes.ts` serves as the source of truth.

## Creating Workflows

Workflows are defined with the following structure:

```
Workflow Definition
───────────────────────────────
id:          Unique identifier (e.g., "WF-107")
name:        Human-readable name
description: What the workflow accomplishes
trigger:     How the workflow starts (cron, event, manual)
steps:       Ordered list of steps, each with:
  - agent:   Which agent performs this step
  - action:  What the agent should do
  - tools:   Which tools are available for this step
  - input:   Data required from previous steps or context
  - output:  What this step produces
  - conditions: When to proceed vs. branch
```

## Workflow Monitoring

### Real-Time Visibility

Active workflows can be monitored through:
- **Agent Watcher** — Shows individual agent actions as workflows execute
- **Job Queue** — Each workflow step creates a job that can be tracked
- **Audit Log** — Complete record of every step's execution and result

### Failure Handling

When a workflow step fails:
1. The failure is logged with full context
2. Depending on configuration, the workflow may retry, skip, or halt
3. If halted, a notification is sent to human operators
4. The workflow can be resumed or restarted from the failed step

## Common Workflow Patterns

### Morning Intelligence Routine
WF-093 through WF-106 form a coordinated morning routine:
1. Each platform agent scans for relevant activity (05:00-05:36)
2. Atlas aggregates all reports (05:45)
3. Atlas assigns tasks based on findings
4. Agents execute assigned tasks throughout the day

### Content Publishing Pipeline
1. Content generation agent drafts content
2. Review step (may trigger Decision Memo for sensitive topics)
3. Media production agents create accompanying visuals
4. Platform-specific agents publish to their assigned channels
5. Analytics tracking begins

### Customer Support Escalation
1. Cheryl receives and categorizes inbound inquiries
2. Simple inquiries are handled autonomously
3. Complex issues are escalated with context to human operators
4. Resolution is tracked and logged

## Key Takeaways

1. Workflows automate multi-step processes across multiple agents.
2. Over 100 workflows are defined, covering operations, intelligence, publishing, and support.
3. Triggers include time-based (cron), event-based, and manual activation.
4. The engine handles step sequencing, branching, and failure recovery automatically.
5. Every workflow step is auditable and monitored in real time.
