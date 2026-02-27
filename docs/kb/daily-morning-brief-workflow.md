# Daily Morning Brief Workflow

## Overview

The Daily Morning Brief is Atlas UX's flagship automated intelligence pipeline. Every day, a coordinated sequence of workflows gathers platform intelligence from 13 social and research agents, synthesizes findings into a unified briefing packet, and delivers actionable task orders to the entire agent roster. The pipeline runs unattended between 05:00 and 08:30 UTC.

## Pipeline Timeline

| Time (UTC) | Workflow     | What Happens                                                  |
|-------------|-------------|---------------------------------------------------------------|
| 05:00-05:36 | WF-093-105  | Platform Intel Sweep — 13 agents pull trending data           |
| 05:45       | WF-106      | Atlas Daily Aggregation — Daily-Intel synthesizes all reports  |
| 06:00       | WF-031      | Archy deep-research pass on flagged topics                    |
| 08:30       | WF-010      | Daily Brief delivery — Atlas reads packet, issues task orders  |

## Phase 1: Platform Intel Sweep (WF-093 through WF-105)

Starting at 05:00 UTC, 13 agents are dispatched in staggered 2-3 minute intervals. Each agent connects to their assigned platform via SERP API, pulls trending topics, engagement data, and competitive signals. Reports are written to the `kb_documents` table with a standardized format and tagged with the current date.

Agents involved: Kelly (X/Twitter), Fran (Facebook), Link (LinkedIn), Timmy (TikTok), Cornwall (Pinterest), Donna (Reddit), Reynolds (Blog/SEO), Dwight (Threads), Terry (Tumblr), Emma (Alignable), Penny (Ads/Multi-platform), Archy (Research), Venny (Visual Trends).

Each agent produces a structured report containing:
- Top 5 trending topics on their platform
- Engagement velocity metrics (rising vs declining)
- Competitor activity summary
- Recommended content angles
- Visual trend notes (Venny only)

## Phase 2: Atlas Daily Aggregation (WF-106)

At 05:45 UTC, WF-106 fires. The Daily-Intel agent collects all 13 platform reports from Phase 1. It uses the ORCHESTRATION_REASONING AI provider (not LONG_CONTEXT_SUMMARY, which would timeout) to synthesize them into a single unified intelligence packet.

The aggregation output includes:
- **Cross-Platform Trends**: Topics trending on 3+ platforms simultaneously
- **Platform-Specific Opportunities**: Unique angles for each channel
- **Risk Alerts**: Negative sentiment spikes, brand mentions requiring response
- **Content Recommendations**: Prioritized list of topics with suggested formats
- **Visual Direction**: Consolidated guidance from Venny's trend analysis

## Phase 3: Daily Brief Delivery (WF-010)

At 08:30 UTC, WF-010 triggers. Atlas (CEO agent) reads the unified packet and generates task orders for the day. These orders are distributed via email to each agent's dedicated mailbox.

Task order format:
```
TO: [agent]@deadapp.info
SUBJECT: Daily Orders — [DATE]
BODY:
  Priority Tasks:
    1. [Task description] — Deadline: [time]
    2. [Task description] — Deadline: [time]
  Context: [Relevant intelligence from morning brief]
  Budget Authorization: [Amount if applicable]
  Approval Required: [Yes/No]
```

## Data Flow

```
Platform APIs (SERP)
    |
    v
13 Platform Agents (WF-093-105)
    |
    v
kb_documents table (13 individual reports)
    |
    v
Daily-Intel Agent (WF-106) — synthesis
    |
    v
Unified Intelligence Packet
    |
    v
Atlas CEO Agent (WF-010) — task assignment
    |
    v
Agent email inboxes (task orders)
```

## Agent Contributions

| Agent     | Platform    | Contribution Focus                        |
|-----------|-------------|-------------------------------------------|
| Kelly     | X/Twitter   | Real-time conversation trends, hashtags   |
| Fran      | Facebook    | Group discussions, page engagement        |
| Link      | LinkedIn    | B2B trends, industry thought leadership   |
| Timmy     | TikTok      | Viral content formats, audio trends       |
| Cornwall  | Pinterest   | Visual trends, seasonal content           |
| Donna     | Reddit      | Community sentiment, emerging topics      |
| Reynolds  | Blog/SEO    | Search trends, keyword opportunities      |
| Dwight    | Threads     | Conversational trends, Meta ecosystem     |
| Terry     | Tumblr      | Subculture trends, creative formats       |
| Emma      | Alignable   | Small business sentiment, local trends    |
| Penny     | Ads         | Ad performance benchmarks, CPM shifts     |
| Archy     | Research    | Deep analysis, fact verification          |
| Venny     | Visual      | Image/video style trends, design shifts   |

## Error Handling

If any agent fails during the sweep, the pipeline continues without that agent's report. WF-106 notes which reports are missing and flags coverage gaps. If more than 4 agents fail, Atlas is alerted immediately and the daily brief includes a degraded-coverage warning.

## Output Storage

All reports and the final brief are stored in the `kb_documents` table with:
- `status`: `published`
- `createdBy`: the agent's name
- `meta`: includes `{ workflowId, date, pipelinePhase }`

The unified packet is also cached in the tenant's knowledge base for agent reference throughout the day.

## Monitoring

The Agent Watcher (`/app/watcher`) shows real-time progress of the morning pipeline. Each agent's audit log entries appear as they complete their sweep, giving operators visibility into the pipeline without checking individual reports.
