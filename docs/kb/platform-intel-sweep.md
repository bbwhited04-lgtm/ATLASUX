# Platform Intel Sweep Explained

## Overview

The Platform Intel Sweep (WF-093 through WF-105) is a coordinated intelligence-gathering operation that runs 13 specialized agents across social media platforms, search engines, and content networks. The sweep runs daily between 05:00 and 05:36 UTC, producing 13 structured reports that feed into WF-106 (Atlas Daily Aggregation).

## Workflow Schedule

Each agent is staggered 2-3 minutes apart to avoid rate limiting and distribute API load evenly.

| Workflow | Time (UTC) | Agent    | Platform         |
|----------|-----------|----------|------------------|
| WF-093   | 05:00     | Kelly    | X (Twitter)      |
| WF-094   | 05:03     | Fran     | Facebook         |
| WF-095   | 05:06     | Link     | LinkedIn         |
| WF-096   | 05:09     | Timmy    | TikTok           |
| WF-097   | 05:12     | Cornwall | Pinterest        |
| WF-098   | 05:15     | Donna    | Reddit           |
| WF-099   | 05:18     | Reynolds | Blog/SEO         |
| WF-100   | 05:20     | Dwight   | Threads          |
| WF-101   | 05:23     | Terry    | Tumblr           |
| WF-102   | 05:26     | Emma     | Alignable        |
| WF-103   | 05:29     | Penny    | Ads Multi-Plat   |
| WF-104   | 05:32     | Archy    | Research/General  |
| WF-105   | 05:36     | Venny    | Visual Trends    |

## How Each Agent Works

### Data Collection

Each agent executes the following steps:

1. **SERP API Query**: The agent sends 3-5 targeted queries to the SERP API, tailored to their platform. Queries are constructed using a combination of industry keywords, competitor names, and trending topic seeds from the previous day's brief.

2. **Result Parsing**: Raw SERP results are parsed to extract titles, snippets, engagement signals, and metadata. The agent filters out irrelevant noise and duplicates.

3. **Trend Analysis**: The agent uses its AI reasoning capability (via the engine's ORCHESTRATION_REASONING provider) to identify patterns, rank topics by relevance, and generate actionable insights.

4. **Report Generation**: A structured report is produced and stored in the `kb_documents` table.

## Agent-Specific Focus Areas

**Kelly (X/Twitter)** — Tracks real-time conversations, trending hashtags, viral tweets, and influencer activity. Focuses on engagement velocity — which topics are accelerating vs fading.

**Fran (Facebook)** — Monitors group discussions, page engagement metrics, and ad library trends. Identifies community sentiment shifts and content formats driving shares.

**Link (LinkedIn)** — Covers B2B industry trends, thought leadership posts, job market signals, and professional community discussions. Flags high-engagement articles and emerging industry narratives.

**Timmy (TikTok)** — Tracks viral content formats, trending audio clips, challenge participation rates, and creator economy shifts. Focuses on content formats that could be adapted for the tenant's brand.

**Cornwall (Pinterest)** — Analyzes visual search trends, seasonal content patterns, pin engagement rates, and emerging aesthetic directions. Particularly valuable for e-commerce and lifestyle brands.

**Donna (Reddit)** — Monitors subreddit discussions, AMAs, sentiment in niche communities, and emerging topics before they hit mainstream platforms. Reddit is often the earliest signal for trending topics.

**Reynolds (Blog/SEO)** — Pulls search trend data, keyword difficulty shifts, content gap opportunities, and competitor blog activity. Focuses on long-form content strategy and organic search opportunities.

**Dwight (Threads)** — Tracks conversational trends within the Meta ecosystem, cross-pollination from Instagram, and emerging community dynamics on the relatively new platform.

**Terry (Tumblr)** — Monitors subculture trends, creative community activity, and niche content formats. Tumblr often surfaces cultural movements months before other platforms.

**Emma (Alignable)** — Covers small business sentiment, local market trends, B2B networking activity, and partnership opportunities within the Alignable ecosystem.

**Penny (Ads/Multi-Platform)** — Pulls ad performance benchmarks across platforms, CPM/CPC trend data, audience targeting shifts, and competitive ad creative analysis.

**Archy (Research/General)** — Conducts deep research on topics flagged by other agents. Validates facts, finds primary sources, and provides the analytical backbone for the intelligence operation.

**Venny (Visual Trends)** — Analyzes trending visual styles across all platforms — color palettes, typography, image composition, video editing styles. Feeds directly into content creation guidance.

## Report Format

Every agent produces a report following this structure:

```markdown
# [Platform] Intel Report — [DATE]
Agent: [Name] | Workflow: WF-[ID]

## Top Trending Topics
1. [Topic] — Engagement Score: [X/10] — Velocity: [Rising/Stable/Falling]
2. [Topic] — ...

## Key Insights
- [Insight with supporting data]
- [Insight with supporting data]

## Competitor Activity
- [Notable competitor action or campaign]

## Recommended Actions
- [Specific, actionable recommendation]
- [Specific, actionable recommendation]

## Risk Flags
- [Any negative trends or threats to monitor]
```

## How Reports Feed Into WF-106

At 05:45 UTC, nine minutes after the last sweep agent completes, WF-106 fires. The Daily-Intel agent queries `kb_documents` for all reports tagged with today's date and the `platform-intel-sweep` tag.

The aggregation process:
1. Load all 13 reports (or however many completed successfully)
2. Note any missing reports and flag coverage gaps
3. Cross-reference topics appearing on multiple platforms
4. Rank trends by cross-platform presence and engagement velocity
5. Synthesize into a unified intelligence packet
6. Store the packet for Atlas (WF-010) to consume at 08:30 UTC

## Failure Handling

- If a SERP API call fails, the agent retries up to 3 times with exponential backoff (5s, 15s, 45s)
- If all retries fail, the agent writes a partial report noting the failure
- WF-106 proceeds with whatever reports are available
- If more than 4 agents fail, an alert is sent to Atlas and the daily brief is flagged as degraded
- All failures are logged to the `audit_log` table with `level: "warn"` or `level: "error"`

## Resource Usage

Each sweep agent typically consumes:
- 3-5 SERP API calls
- 1 AI reasoning call (for analysis)
- 1 database write (report storage)
- Total pipeline: ~45-65 SERP calls, 13 AI calls, 13 DB writes per day
