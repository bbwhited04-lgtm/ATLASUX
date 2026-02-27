# Job Runner

The Job Runner is where you create, monitor, and manage all jobs running across your AI workforce. Jobs are the units of work that agents execute -- everything from sending emails to publishing social posts.

## Opening the Job Runner

Click **Jobs** in the sidebar or navigate to `/app/jobs`.

## Understanding Jobs

A job is a task queued in the system for an agent to execute. Jobs go through these statuses:

| Status | Meaning |
|--------|---------|
| **Queued** | Waiting to be picked up by the engine |
| **Running** | Currently being processed by an agent |
| **Completed** | Successfully finished |
| **Paused** | Temporarily stopped |
| **Failed** | Something went wrong during execution |

## Viewing Active Jobs

The main view shows all active (non-completed) jobs in a list. Each job card displays:

- **Job name** -- A human-readable label derived from the job type
- **Type icon** -- Visual indicator (video, social, document, email, or general task)
- **Status badge** -- Color-coded status indicator
- **Progress bar** -- Shows estimated completion for running jobs
- **Start time** -- When the job was created
- **Priority** -- High, medium, or low

## Filtering Jobs

Use the filter buttons at the top to narrow the list by job type:

- **All** -- Show everything
- **Video** -- Video generation jobs
- **Animation** -- Image and animation jobs
- **Social** -- Social media posts and publishing
- **Document** -- Blog posts, reports, and KB documents
- **Task** -- General tasks and automation

## Creating a New Job

1. Click the **+ New Job** button in the top right.
2. Select a job type from the dropdown:
   - **EMAIL_SEND** -- Send an email through the platform
   - **SOCIAL_POST** -- Publish a social media post
3. Fill in the required fields (recipient, subject, body text, etc.).
4. Click **Submit** to queue the job.

The job will appear in the active list with a "Queued" status. The engine picks up queued jobs every 5 seconds.

## Cancelling a Job

To cancel a running or queued job:

1. Find the job in the active list.
2. Click the **X** (cancel) button on the job card.
3. Confirm the cancellation.

Cancelled jobs are removed from the active list.

## Completed Jobs

Scroll down past the active jobs to see the **Completed Jobs** section. This shows recently finished jobs with their completion time.

## Pagination

If you have many jobs, the list is paginated with 15 items per page. Use the arrow buttons at the bottom to navigate between pages.

## Auto-Refresh

The job list automatically refreshes every 10 seconds, so you can leave it open to watch progress in real time.

## Tips

- Jobs created by agents (through workflows or the engine) also appear here alongside jobs you create manually.
- If a job seems stuck in "Queued" status, make sure the Atlas engine is online (check the header status indicator).
- Use the [Agent Watcher](./agent-watcher.md) for a more detailed real-time view of what agents are doing.

## Related Guides

- [Dashboard](./dashboard.md) -- See job counts on the home screen
- [Agent Watcher](./agent-watcher.md) -- Real-time activity monitoring
- [Approval Workflows](./approval-workflows.md) -- Some jobs require approval before execution
