# Agent Watcher

The Agent Watcher is a live activity monitor that shows you what your AI agents are doing in real time. It polls the audit log and job queue to give you a continuously updating view of agent activity.

## Opening Agent Watcher

Click **Agent Watcher** in the sidebar or navigate to `/app/watcher`. You can also reach it from the "Watch Live" button on a business card in Business Manager.

## Layout

The Agent Watcher has three main sections:

1. **Activity Feed** -- A scrolling list of audit log entries (left/main area)
2. **Active Jobs** -- Cards showing currently running jobs (right panel)
3. **Controls** -- Filtering, pause, and refresh buttons (top bar)

## Activity Feed

The activity feed shows audit log entries in reverse chronological order (newest first). Each entry displays:

- **Timestamp** -- When the action occurred (hours:minutes:seconds)
- **Level icon** -- Color-coded by severity:
  - Cyan (info) -- Normal operations
  - Amber (warn) -- Warnings that may need attention
  - Red (error) -- Errors or failures
  - Gray (debug) -- Low-level debug information
- **Agent name** -- Which agent performed the action
- **Action** -- What was done (e.g., "job.created", "email.sent", "workflow.executed")
- **Entity** -- What was affected (e.g., job ID, document ID)
- **Message** -- A human-readable description

The feed auto-scrolls to show the newest entries. You can disable auto-scroll by scrolling up manually.

## Filtering

### By Level

Use the level filter buttons to show only specific severity levels:
- **All** -- Show everything
- **Info** -- Normal operations only
- **Warn** -- Warnings only
- **Error** -- Errors only

### By Agent

Use the agent filter dropdown to see activity from a specific agent only. Select "All" to see everyone.

## Active Jobs Panel

The right panel shows jobs that are currently running or queued. Each job card displays:

- Job type and title
- Current status (queued, running, paused, completed, failed)
- Priority level
- Agent assigned
- Start time
- Error message (for failed jobs)

Job status badges are color-coded:
- Gray: queued
- Cyan (pulsing): running
- Amber: paused
- Green: completed
- Red: failed

## Pause and Resume

Click the **Pause** button to stop the auto-refresh. This is useful when you want to read through entries without new ones pushing them off screen. Click **Resume** to start polling again.

## Manual Refresh

Click the **Refresh** button to immediately fetch the latest data without waiting for the next automatic poll.

## Refresh Intervals

- **Audit log** -- Refreshes every 4 seconds
- **Active jobs** -- Refreshes every 8 seconds
- **Last refresh timestamp** -- Shown at the top of the page

## Tips

- Use the Agent Watcher during workflow executions to see each step as it happens.
- Filter by "error" level to quickly spot problems.
- The pause feature is useful for investigating a specific event -- pause, read the details, then resume.
- Keep the Agent Watcher open in a second browser tab while working in other parts of the app.

## Related Guides

- [Job Runner](./job-runner.md) -- Create and manage jobs
- [Agents Hub](./agents-hub.md) -- Understand agent roles and capabilities
- [Approval Workflows](./approval-workflows.md) -- See when agents request human approval
- [Security](./security.md) -- The audit log is a core security feature
