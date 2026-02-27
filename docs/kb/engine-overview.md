# Engine Overview

## What is the Orchestration Engine?

The orchestration engine is the central nervous system of Atlas UX. It is a continuously running process that coordinates all AI agent activity — picking up queued jobs, dispatching them to the appropriate agents, monitoring execution, and enforcing governance policies.

The engine runs as a separate Node.js process (`workers/engineLoop.ts`), decoupled from the main API server. This separation ensures that agent work does not block API responses and that the engine can be scaled, restarted, or debugged independently.

## How the Engine Loop Works

### The Tick Cycle

The engine operates on a fixed tick interval defined by `ENGINE_TICK_INTERVAL_MS` (default: 5000ms / 5 seconds). Each tick follows this sequence:

```
1. Query the jobs table for work (status: "queued")
2. Evaluate each job against SGL policies and safety guardrails
3. Assign qualifying jobs to appropriate agents
4. Monitor running jobs for completion or failure
5. Process completed jobs (update status, trigger follow-up actions)
6. Clean up stale or timed-out jobs
7. Sleep until next tick
```

### Enabling the Engine

The engine is controlled by the `ENGINE_ENABLED` environment variable:
- `ENGINE_ENABLED=true` — Engine processes jobs normally
- `ENGINE_ENABLED=false` — Engine is paused; jobs remain queued but are not dispatched

This kill switch allows operators to halt all autonomous activity instantly without shutting down the API or losing queued work.

## Job Processing

### Job Lifecycle

Every unit of agent work flows through the job system:

```
QUEUED  -->  RUNNING  -->  COMPLETED
                |
                +--->  FAILED
```

**Queued**: The job has been created and is waiting for the next engine tick to pick it up.

**Running**: An agent has been assigned and is actively working on the job. The engine monitors for completion.

**Completed**: The job finished successfully. Results are stored and any follow-up actions are triggered.

**Failed**: The job encountered an error. The failure is logged, and depending on configuration, the job may be retried or escalated.

### Job Sources

Jobs enter the queue from multiple sources:
- **API requests** — User-initiated actions that require agent processing
- **Scheduled workflows** — Cron-like triggers that fire at specified times
- **Agent-generated** — One agent creating work for another (task chaining)
- **Webhook events** — External system events that trigger agent responses
- **Decision Memo approvals** — Previously paused jobs that have been approved

### Job Types

Common job types include:
- `EMAIL_SEND` — Send an email through configured providers
- `SOCIAL_PUBLISH` — Publish content to a social media platform
- `CONTENT_GENERATE` — Generate text, images, or other content
- `DATA_ANALYSIS` — Analyze data and produce reports
- `WORKFLOW_STEP` — Execute a specific step within a multi-step workflow
- `ORCHESTRATION_REASONING` — High-level agent reasoning and task planning

## Agent Task Assignment

The engine uses a role-based dispatch system to assign jobs to agents:

1. **Job analysis**: The engine examines the job type, required capabilities, and context
2. **Agent matching**: It identifies which agent(s) have the skills and authority for this job
3. **Availability check**: It verifies the target agent hasn't hit daily action caps
4. **Policy check**: SGL rules are evaluated to ensure the agent is permitted to execute
5. **Dispatch**: The job is assigned and the agent begins execution

### Canonical Workflow Keys

For standard workflows (WF-001 through WF-106+), the engine recognizes canonical workflow keys that map directly to agent assignments. This allows workflows to be executed even without a database row, using the workflow registry as a fallback.

## Scheduled Workflows

The scheduler worker (`workers/scheduler.ts`) triggers workflows at configured times:

- **WF-010**: Daily operations — fires at 08:30 UTC
- **WF-031**: Daily intelligence — fires at 06:00 UTC
- **WF-093 to WF-105**: Platform intelligence sweep — fires 05:00-05:36 UTC
- **WF-106**: Atlas Daily Aggregation — fires at 05:45 UTC

Scheduled workflows create jobs in the queue just like any other source, and the engine processes them through the same pipeline.

## AI Provider Integration

When agents need to reason or generate content, the engine connects to AI providers configured in `ai.ts`:

- **OpenAI** — Primary reasoning and generation
- **DeepSeek** — Alternative provider for specific tasks
- **OpenRouter** — Multi-model routing
- **Cerebras** — High-speed inference for time-sensitive tasks
- **Google Gemini** — Long-context processing (used for summarization)

The engine selects the appropriate provider based on the task type, required context length, and latency requirements.

## Error Handling and Recovery

### Retry Logic
Failed jobs can be automatically retried based on the error type:
- Transient errors (network timeouts, rate limits) — retry with exponential backoff
- Permanent errors (invalid input, missing permissions) — fail immediately

### Timeout Handling
Long-running jobs are monitored against configurable timeout limits. Jobs that exceed their timeout are marked as failed and escalated.

### Circuit Breaker
If an agent or provider experiences repeated failures, the engine temporarily stops dispatching to that target, preventing cascade failures.

## Monitoring

### Agent Watcher
The Agent Watcher component (`/app/watcher`) provides real-time visibility into engine activity by polling the audit log every 4 seconds. Operators can see:
- Active jobs and their status
- Agent actions in real time
- Errors and escalations
- Decision Memo generation

### Audit Trail
Every engine action is recorded in the audit log, providing a complete history of what happened, when, and why.

## Key Takeaways

1. The engine is a separate process that ticks every 5 seconds by default.
2. All agent work flows through the job queue — nothing bypasses it.
3. SGL policies are enforced at dispatch time, before any agent executes.
4. The engine can be paused instantly via `ENGINE_ENABLED=false`.
5. Multiple AI providers are available and selected based on task requirements.
