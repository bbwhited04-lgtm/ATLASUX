# Real-Time Agent Coordination

## Overview

Atlas UX runs 30+ autonomous agents that must collaborate without duplicating
effort, creating conflicts, or overwhelming shared resources. Coordination
happens through several mechanisms: the job queue (single-assignment guarantee),
task delegation (explicit handoffs), workflow pipelines (sequential processing),
shared context (KB and audit trail), and the Daily-Intel agent as a central
coordination hub.

## The Coordination Problem

Without coordination, autonomous agents face several failure modes:

- **Double execution** — Two agents pick up the same task simultaneously
- **Resource contention** — Multiple agents try to post to the same social
  channel at the same time
- **Context divergence** — Agents make decisions based on stale information
  because they cannot see what other agents are doing
- **Circular delegation** — Agent A delegates to Agent B, who delegates back
  to Agent A

Atlas UX addresses each of these through architectural constraints enforced
by the engine loop and job queue.

## Job Queue: Single-Assignment Guarantee

The `jobs` table is the central mechanism for preventing double execution:

```
jobs
  id            UUID (PK)
  tenant_id     UUID (FK → tenants)
  type          TEXT          -- "AGENT_TASK", "EMAIL_SEND", "WORKFLOW_STEP", etc.
  status        TEXT          -- "queued" → "running" → "completed" | "failed"
  assigned_to   TEXT          -- agent_id or worker_id (NULL when queued)
  payload       JSONB         -- task-specific data
  priority      INT           -- 0 (low) to 3 (urgent)
  attempts      INT           -- retry counter
  max_attempts  INT           -- default 3
  locked_at     TIMESTAMPTZ   -- optimistic lock timestamp
  created_at    TIMESTAMPTZ
  completed_at  TIMESTAMPTZ
```

### Optimistic Locking

When the engine loop assigns a job to an agent, it uses optimistic locking
to prevent race conditions:

```sql
UPDATE jobs
SET status = 'running',
    assigned_to = $agent_id,
    locked_at = NOW()
WHERE id = $job_id
  AND status = 'queued'
  AND locked_at IS NULL
RETURNING *;
```

If two engine instances (or two ticks) try to claim the same job simultaneously,
only one `UPDATE` will match the `WHERE` clause. The other returns zero rows
and moves on to the next available job.

### Lock Expiration

If an agent fails to complete a job within **5 minutes**, the lock expires
and the job becomes available for reassignment:

```sql
UPDATE jobs
SET status = 'queued',
    assigned_to = NULL,
    locked_at = NULL,
    attempts = attempts + 1
WHERE status = 'running'
  AND locked_at < NOW() - INTERVAL '5 minutes'
  AND attempts < max_attempts;
```

Jobs that exceed `max_attempts` are moved to `status = 'failed'` and logged
to the audit trail for manual review.

## Task Delegation via delegate_task

The `delegate_task` tool allows management agents (Atlas, Binky, Sunday, Petra)
to explicitly assign work to specialist agents:

```typescript
// Agent Atlas invokes:
{
  name: "delegate_task",
  arguments: {
    target_agent: "sunday",
    task_description: "Write a blog post about our Q1 product updates",
    priority: "normal",
    deadline: "2026-02-27T17:00:00Z"
  }
}
```

This creates a new job in the queue:

```typescript
await prisma.job.create({
  data: {
    tenantId,
    type: "AGENT_TASK",
    status: "queued",
    payload: {
      from_agent: "atlas",
      target_agent: "sunday",
      task_description: "Write a blog post about our Q1 product updates",
      priority: "normal",
      deadline: "2026-02-27T17:00:00Z"
    },
    priority: 1
  }
});
```

### Delegation Rules

The engine enforces delegation constraints:

1. **Only authorized agents can delegate** — Atlas, Binky, Sunday, Petra
2. **Agents cannot delegate to themselves** — Prevents infinite loops
3. **Circular delegation detection** — If Agent A delegates to B, and B
   tries to delegate the same task back to A, the engine rejects it
4. **Delegation depth limit** — Maximum 3 levels of re-delegation
   (A → B → C → D, but D cannot delegate further)

## Workflow Handoffs

Workflows define sequential processing pipelines where each agent handles
one step before passing the result to the next agent. The content pipeline
is a canonical example:

### Content Pipeline: Archy -> Sunday -> Venny -> Publisher

```
Step 1: Archy (Research)
  └─ Searches X, analyzes trends, produces a research brief
  └─ Output: { topic, key_points, sources, sentiment }

Step 2: Sunday (Content Writer)
  └─ Takes Archy's research brief
  └─ Writes polished content (blog post, social copy, or thread)
  └─ Output: { content, platform, media_suggestions }

Step 3: Venny (Image Production)
  └─ Takes Sunday's content and media suggestions
  └─ Generates or sources appropriate images
  └─ Output: { content, media_urls }

Step 4: Publisher Agent (e.g., Kelly for X, Reynolds for Blog)
  └─ Takes the final content + media package
  └─ Publishes to the target platform
  └─ Output: { post_url, published_at }
```

Each step is a separate job in the queue. When step N completes, the engine
creates a new job for step N+1 with the previous step's output as input:

```typescript
// Engine: on workflow step completion
if (currentStep < workflow.totalSteps) {
  await prisma.job.create({
    data: {
      tenantId,
      type: "WORKFLOW_STEP",
      status: "queued",
      payload: {
        workflow_id: workflow.id,
        step_number: currentStep + 1,
        input: currentStepOutput,
        assigned_agent: workflow.steps[currentStep + 1].agent
      }
    }
  });
}
```

### Workflow Error Handling

If a step fails, the workflow pauses and the engine:

1. Logs the failure to `audit_log`
2. Notifies the workflow owner (usually Atlas or Petra) via Telegram
3. Keeps subsequent steps in `queued` status (they will not execute)
4. Allows manual retry or skip via the dashboard

## Shared Context: KB and Audit Trail

Agents share information through two persistent stores:

### Knowledge Base (KB)

Any agent can write to the KB by creating or updating `kb_documents`. This
allows agents to share structured knowledge:

- Archy writes research reports to KB for other agents to reference
- Sunday writes content guidelines that publishers use for tone consistency
- Daily-Intel writes daily briefings that all agents can search

KB access is read-many, write-few. Agents read KB via `search_atlasux_knowledge`
and write via direct DB operations in their task handlers.

### Audit Trail

The `audit_log` is the system's source of truth for "what happened." Every
agent action is logged, creating a shared timeline that any agent can search
via `search_my_memories` (which queries audit_log as one of its four sources).

This means:
- Kelly can check if Fran already posted about a topic today (preventing
  duplicate content across platforms)
- Atlas can review what all agents accomplished before writing the daily summary
- Tina can audit financial operations across all agents

## Agent-to-Agent Communication

Agents can communicate directly through two mechanisms:

### 1. Internal Messages via Job Queue

An agent can create a job of type `AGENT_MESSAGE` targeting another agent:

```typescript
await prisma.job.create({
  data: {
    tenantId,
    type: "AGENT_MESSAGE",
    payload: {
      from: "binky",
      to: "atlas",
      message: "Revenue report ready. Q1 projections exceed target by 12%.",
      context: { report_id: "..." }
    }
  }
});
```

The target agent picks this up on the next engine tick and can respond.

### 2. Agent Email

Each agent has a dedicated email address (e.g., atlas@deadapp.info,
binky@deadapp.info). Agents can send emails to each other for formal
communication that needs to be tracked. This uses the same `EMAIL_SEND`
job type as external emails.

## Daily-Intel: The Coordination Hub

The Daily-Intel agent (WF-033, runs at 06:00 UTC) serves as the central
coordination point for the entire agent organization:

### Morning Briefing Pipeline

1. Daily-Intel collects overnight activity from the audit trail
2. Queries each agent's completed tasks and pending items
3. Checks external signals (market data, social mentions, competitor activity)
4. Produces a structured daily brief containing:
   - Completed tasks summary
   - Pending/blocked items
   - Priority recommendations
   - External signals requiring attention
5. Writes the brief to KB for all agents to reference
6. Triggers WF-106 (Atlas Daily Aggregation) at 05:45 UTC

### Atlas Daily Aggregation (WF-106)

Atlas receives Daily-Intel's brief plus all overnight agent reports, then:

1. Reviews and prioritizes the day's work
2. Delegates tasks to appropriate agents via `delegate_task`
3. Resolves any conflicts or overlapping assignments
4. Sets the day's strategic focus

This creates a natural coordination rhythm: intelligence gathering (Daily-Intel)
followed by strategic planning and task assignment (Atlas).

## Conflict Resolution

When multiple agents need the same resource, the engine applies these rules:

### Social Platform Posting

Only one agent can post to a given platform within a configurable cooldown
(default: 30 minutes). The engine checks `audit_log` for recent posts:

```sql
SELECT COUNT(*) FROM audit_log
WHERE action = 'SOCIAL_POST'
  AND meta->>'platform' = $platform
  AND tenant_id = $tenant_id
  AND timestamp > NOW() - INTERVAL '30 minutes';
```

If a recent post exists, the new post is queued with a delayed execution time.

### Budget Allocation

When multiple agents request spending, Tina (CFO) reviews all pending
`decision_memo` entries and approves them in priority order, ensuring the
daily spend limit (`AUTO_SPEND_LIMIT_USD`) is not exceeded by cumulative
approvals.

### File Access

File operations (upload, delete) use the job queue's optimistic locking
to prevent concurrent modifications to the same file. The file path is
included in the job payload for conflict detection.

## Monitoring Coordination

The **Agent Watcher** (`/app/watcher`) provides real-time visibility into
agent coordination:

- Live activity feed polling `audit_log` every 4 seconds
- Per-agent status indicators (idle, working, waiting, error)
- Job queue depth and processing rate
- Workflow pipeline progress visualization
- Delegation chain tracking (who assigned what to whom)

This allows human operators to identify coordination failures quickly —
stuck workflows, backed-up queues, or agents waiting on blocked dependencies.
