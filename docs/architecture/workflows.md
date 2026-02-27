# Workflow Architecture

Atlas UX uses a registry-based workflow system that combines hand-coded workflow
definitions with an n8n-style manifest. Workflows are triggered by the scheduler
worker on a cron-like schedule and executed by the engine loop through the job
queue.

---

## Workflow Registry

Workflows are identified by a registry code (WF-NNN) and defined in
`workflowsRoutes.ts`. The registry spans from WF-001 to WF-106+, organized into
three generations:

```
+-------------------+     +-------------------+     +-------------------+
|  Core Registry    |     |  n8n Manifest     |     |  Platform Intel   |
|  WF-001 to WF-021|     |  WF-022 to WF-092 |     |  WF-093 to WF-106|
|  Hand-coded       |     |  Manifest-defined |     |  Auto-generated   |
+-------------------+     +-------------------+     +-------------------+
```

### Core Registry (WF-001 to WF-021)

These are the original hand-coded workflows with full database rows. Each has
a defined trigger, steps, and expected output.

### n8n Manifest (WF-022 to WF-092)

These workflows were derived from an n8n-style manifest and merged into the
routes file. They follow the same execution model but were generated in bulk.

### Platform Intel Sweep (WF-093 to WF-105)

Thirteen agent workflows that run a daily intelligence sweep across all
platforms. Each agent scans its assigned platform for competitive intelligence,
trending topics, and actionable insights.

| Workflow | Agent     | Schedule (UTC) |
|----------|-----------|----------------|
| WF-093   | Agent 1   | 05:00          |
| WF-094   | Agent 2   | 05:03          |
| WF-095   | Agent 3   | 05:06          |
| ...      | ...       | ...            |
| WF-105   | Agent 13  | 05:36          |

### Atlas Daily Aggregation (WF-106)

The capstone workflow. Runs at 05:45 UTC after all intel sweep agents have
reported. Atlas (CEO) aggregates all intelligence reports and assigns tasks to
the appropriate agents for the day.

WF-106 uses `ORCHESTRATION_REASONING` (not `LONG_CONTEXT_SUMMARY`) to avoid
timeout issues with long-context models.

## Workflow Execution Flow

```
Scheduler Worker
  |  Checks current time against workflow schedules
  |  Fires matching workflows
  v
+-------------------+
|   Jobs Table      |
|   status: queued  |
|   type: WORKFLOW  |
|   payload: {      |
|     workflowId,   |
|     agentId,      |
|     params        |
|   }               |
+-------------------+
         |
         v
Engine Worker (ticks every 5s)
  |  Picks up queued WORKFLOW jobs
  |  Loads workflow definition
  |  Loads agent config
  v
+-------------------+
| Step Execution    |
|  1. Context load  |
|  2. AI reasoning  |
|  3. Tool calls    |
|  4. Result store  |
+-------------------+
         |
         v
+-------------------+
|   Jobs Table      |
|   status:         |
|   completed/failed|
+-------------------+
```

## CANONICAL_WORKFLOW_KEYS

The engine maintains a fallback list called `CANONICAL_WORKFLOW_KEYS` for
manifest workflows that do not have a corresponding database row. This allows
the scheduler to fire workflows that exist only in the code-defined manifest
without requiring a database migration for each new workflow.

```
Engine receives job with workflowId: "WF-054"
  |
  |-- Check DB for workflow row
  |   |
  |   +-- Found? Use DB definition
  |   +-- Not found? Check CANONICAL_WORKFLOW_KEYS
  |       |
  |       +-- Found in canonical list? Use manifest definition
  |       +-- Not found? Job fails with "unknown workflow"
```

## Scheduled Workflows

The scheduler worker (`workers/scheduler.ts`) runs as a separate Render service
and fires workflows at predetermined times:

### Daily Schedule (UTC)

```
05:00 - 05:36  |  WF-093 to WF-105  |  Platform Intel Sweep (13 agents)
05:45          |  WF-106             |  Atlas Daily Aggregation
06:00          |  WF-031             |  Daily operations workflow
08:30          |  WF-010             |  Morning briefing workflow
```

### Agent-Specific Workflows

| Workflow Range | Agents                     | Purpose                    |
|----------------|----------------------------|----------------------------|
| WF-033         | Daily-Intel                | Daily intelligence report  |
| WF-034         | Archy                      | Research compilation       |
| WF-054 - WF-059 | Social publishers        | Content publishing         |
| WF-063         | Mercer                     | Acquisition scanning       |
| WF-084 - WF-089 | Ops agents               | Operations tasks           |
| WF-092         | Cheryl                     | Support queue processing   |

## Workflow Definition Structure

Each workflow definition includes:

```
{
  id: "WF-054",
  name: "Kelly X Publisher",
  description: "Publish curated content to X (Twitter)",
  agent: "kelly",
  schedule: {
    cron: "0 12 * * *",      // Daily at noon UTC
    timezone: "UTC"
  },
  steps: [
    {
      name: "gather_content",
      action: "AI_REASONING",
      prompt: "Review today's content queue..."
    },
    {
      name: "publish",
      action: "TOOL_CALL",
      tool: "publish_social",
      params: { platform: "x" }
    }
  ],
  constraints: {
    maxPostsPerDay: 3,
    requireApproval: false,
    riskTier: 1
  }
}
```

## Workflow States

A workflow execution progresses through these states:

```
SCHEDULED  -->  QUEUED  -->  RUNNING  -->  COMPLETED
                                |
                                +--------->  FAILED
                                |
                                +--------->  PENDING_APPROVAL
                                                |
                                          +-----+-----+
                                          |           |
                                       APPROVED    REJECTED
                                          |           |
                                          v           v
                                       RUNNING     CANCELLED
```

## Error Handling

- Failed workflows are logged with the error in the job result
- The engine does not automatically retry failed workflows (retries are managed
  at the job level)
- If a workflow step fails, subsequent steps are skipped and the job is marked
  as failed
- Timeout: long-running workflows have provider-specific timeouts (90s for
  long-context, standard for others)

## Creating New Workflows

To add a new workflow:

1. Define the workflow in `workflowsRoutes.ts` with a new WF-NNN code
2. Add the workflow key to `CANONICAL_WORKFLOW_KEYS` if it should work without
   a DB row
3. Add a schedule entry in the scheduler worker if it should run automatically
4. Assign the workflow to an agent
5. Test by manually queuing a job with the workflow ID

## Monitoring

Workflow execution can be monitored through:

- **Job Runner UI** (`/app/jobs`) — View job statuses, payloads, and results
- **Agent Watcher UI** (`/app/watcher`) — Real-time audit log polling (every 4s)
- **Audit log queries** — Filter by `entityType: workflow`

## Related Documentation

- [Architecture Overview](./README.md)
- [Job System Architecture](./job-system.md)
- [Agent Architecture](./agents.md)
- [Audit System Architecture](./audit-system.md)
