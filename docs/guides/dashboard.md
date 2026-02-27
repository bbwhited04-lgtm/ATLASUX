# Dashboard

The dashboard is your home screen in Atlas UX. It gives you a snapshot of everything happening across your AI workforce at a glance.

## Opening the Dashboard

The dashboard loads automatically when you enter the app. You can also return to it at any time by clicking **Dashboard** in the sidebar or navigating to `/app`.

## KPI Cards

At the top of the dashboard, you will see four key performance indicator (KPI) cards:

| Card | What It Shows |
|------|--------------|
| **Active Jobs** | The number of jobs currently running across all agents |
| **Completed Today** | How many jobs have finished successfully today |
| **Registered Agents** | The total number of AI agents in your workforce |
| **Total Spend** | Cumulative spend in USD tracked by the accounting ledger |

These numbers update automatically every 30 seconds. They pull live data from your backend, so they reflect the real state of your system.

## Hero Banner

Below the KPI cards is a welcome banner that shows:

- A summary of your active workforce size
- Quick-action buttons to jump to key areas like Chat, Jobs, Agents, and Business Manager

## Pending Decisions

If any of your agents have created decision memos that need your approval, you will see a **Pending Decisions** count. Click it to go directly to the Decisions Inbox inside Business Manager, where you can approve or reject proposals.

For more on how decisions work, see [Approval Workflows](./approval-workflows.md).

## Recent Jobs

The dashboard shows your most recent active jobs with their current status. Each job card displays:

- Job name and type
- Current status (running, queued, paused)
- When it started

Click on any job to navigate to the [Job Runner](./job-runner.md) for full details.

## Growth & Analytics

If analytics data is available, the dashboard shows a timeline of recent growth runs and workflow executions. This gives you a high-level view of what your agents have been doing over the past 7 days.

## Quick Navigation

The dashboard includes shortcut buttons to frequently used areas:

- **Chat with Atlas** -- Opens the AI chat interface
- **View Jobs** -- Opens the Job Runner
- **Manage Agents** -- Opens the Agents Hub
- **Business Manager** -- Opens business settings and assets

## Tips

- Keep the dashboard open as your "home base" to monitor activity throughout the day.
- If KPI numbers seem stale, the page auto-refreshes data every 30 seconds. You can also navigate away and back to trigger a fresh load.
- The dashboard respects your selected business (tenant). If you switch businesses in Business Manager, the dashboard updates to show data for the new selection.

## Related Guides

- [Job Runner](./job-runner.md) -- Detailed job management
- [Agent Watcher](./agent-watcher.md) -- Real-time agent activity feed
- [Approval Workflows](./approval-workflows.md) -- Decision memos and approvals
