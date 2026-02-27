# Workflow System

Atlas UX uses a workflow registry with over 100 defined workflows (WF-001 through WF-108). Workflows are triggered by the scheduler worker on daily and weekly cadences, or manually via the engine API.

## Workflow Registry

Workflow definitions and handlers are registered in `backend/src/workflows/registry.ts`. The registry exports:

- `workflowCatalogAll` — Array of all workflow metadata objects
- `getWorkflowHandler(workflowId)` — Returns the handler function for a given workflow ID

Workflow IDs can be either:
- A human-readable key like `WF-021`
- A database UUID from the `workflows` table

The engine checks both the DB and the canonical registry (`CANONICAL_WORKFLOW_KEYS`) to allow new manifest entries to work without database seeding.

## Workflow File Definitions

High-level workflow descriptions live in `workflows/`:

```
workflows/
  WORKFLOWS.md                     # Master registry
  WF-001_SUPPORT_INTAKE.md         # Support intake flow
  WF-002_SUPPORT_ESCALATION.md     # Support escalation
  WF-010_DAILY_EXEC_BRIEF.md       # Atlas daily executive brief
  WF-020_ENGINE_RUN_SMOKE_TEST.md  # Engine smoke test
```

## Scheduler — `schedulerWorker.ts`

The scheduler worker (`backend/src/workers/schedulerWorker.ts`) fires workflows at their scheduled times. It uses de-duplication keys stored in `system_state` to prevent duplicate firings.

### Daily Schedule (UTC)

**Phase 1 — Platform Intel Sweep (05:00-05:36):**

| Time | Agent | Workflow | Description |
|------|-------|----------|-------------|
| 05:00 | Kelly | WF-093 | X Hot Topics |
| 05:03 | Fran | WF-094 | Facebook Trends |
| 05:06 | Dwight | WF-095 | Threads Trends |
| 05:09 | Timmy | WF-096 | TikTok Trends |
| 05:12 | Terry | WF-097 | Tumblr Trends |
| 05:15 | Cornwall | WF-098 | Pinterest Trends |
| 05:18 | Link | WF-099 | LinkedIn Trends |
| 05:21 | Emma | WF-100 | Alignable Trends |
| 05:24 | Donna | WF-101 | Reddit Trends |
| 05:27 | Reynolds | WF-102 | Blog SEO Trends |
| 05:30 | Penny | WF-103 | FB Ads Intel |
| 05:33 | Archy | WF-104 | Instagram Intel |
| 05:36 | Venny | WF-105 | YouTube Intel |

**Phase 2 — Aggregation (05:45):**

| Time | Agent | Workflow | Description |
|------|-------|----------|-------------|
| 05:45 | Atlas | WF-106 | Aggregation & Task Assignment |

**Phase 3 — Research & Content (06:00-19:00):**

| Time | Agent | Workflow | Description |
|------|-------|----------|-------------|
| 06:00 | Binky | WF-031 | Research Digest |
| 07:00 | Daily-Intel | WF-033 | Morning Brief |
| 07:30 | Archy | WF-034 | Research Deep-Dive |
| 08:00 | Claire | WF-088 | Calendar Prep |
| 08:30 | Atlas | WF-010 | Daily Executive Brief |
| 09:00 | Timmy | WF-054 | TikTok Content Draft |
| 09:15 | Fran | WF-057 | Facebook Page Post |
| 09:30 | Dwight | WF-055 | Threads Post |
| 10:00 | Terry | WF-049 | Tumblr Post |
| 10:30 | Kelly | WF-042 | X Auto-DM Check |
| 11:00 | Link | WF-045 | LinkedIn Scheduled Post |
| 11:30 | Cornwall | WF-048 | Pinterest Pins |
| 12:00 | Donna | WF-051 | Reddit Monitor |
| 14:00 | Donna | WF-052 | Reddit Engagement Scan |
| 15:00 | Venny | WF-059 | Image Asset Pipeline |
| 16:00 | Reynolds | WF-041 | Blog -> LinkedIn & X |
| 17:00 | Penny | WF-040 | Multi-Platform Content |
| 18:00 | Sunday | WF-058 | Technical Brief Writer |
| 19:00 | Victor | WF-089 | Video Production Check |

**Wednesday Only:**

| Time | Agent | Workflow | Description |
|------|-------|----------|-------------|
| 13:00 | Reynolds | WF-108 | Blog Write & Publish |

### Weekly Schedule

**Monday:**

| Time | Agent | Workflow | Description |
|------|-------|----------|-------------|
| 07:00 | Mercer | WF-063 | Acquisition Intel |
| 07:30 | Petra | WF-084 | Sprint Planning |
| 08:00 | Emma | WF-056 | Alignable Update |
| 08:30 | Sandy | WF-085 | CRM Sync Check |
| 09:00 | Porter | WF-087 | SharePoint Sync |

**Friday:**

| Time | Agent | Workflow | Description |
|------|-------|----------|-------------|
| 15:00 | Larry | WF-072 | Audit Gate |
| 15:30 | Tina | WF-073 | Finance Risk Gate |
| 16:00 | Frank | WF-086 | Form Aggregator |

## De-duplication

The scheduler prevents duplicate firings using system state keys:
- Daily workflows: `scheduler:{workflowId}` with today's date
- Weekly workflows: `scheduler:{workflowId}:{YYYY-Www}` with ISO week number

## Workflow Execution Flow

1. Scheduler determines which workflows are due
2. Creates an intent with `intentType: "ENGINE_RUN"` and `workflowId` in payload
3. Engine loop claims the intent
4. SGL evaluates the intent
5. If ALLOW, the workflow handler executes
6. Results are logged to audit trail

## Manual Triggering

Workflows can be triggered manually via the engine API:

```bash
POST /v1/engine/run
{
  "workflowId": "WF-020",
  "agentId": "atlas"
}
```
