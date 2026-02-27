# Content Pipeline: Idea to Publish

## Overview

The Atlas UX content pipeline is a multi-stage, multi-agent workflow that takes a content idea from initial research through to published, promoted content across all active platforms. Each stage has a designated lead agent, quality gates, and approval checkpoints that enforce the platform's safety guardrails.

## Pipeline Stages

```
[Idea/Brief] → [Research] → [Drafting] → [Visual Production] → [Platform Adaptation] → [Publishing] → [Performance Monitoring]
     |             |             |               |                      |                    |                |
   Atlas         Archy        Sunday          Venny            Platform Agents          Scheduler         Penny
```

## Stage 1: Research and Validation

**Lead Agent**: Archy (Research Specialist)
**Trigger**: Task order from Atlas (via WF-010 daily brief) or manual content request

Archy receives a topic or content brief and performs:

1. **Fact Verification**: Cross-references claims against multiple sources using SERP API queries. Every factual claim must have at least one verifiable source.

2. **Competitive Analysis**: Checks what competitors have published on the same topic in the last 30 days. Identifies content gaps and unique angle opportunities.

3. **Keyword Research**: Pulls search volume data, keyword difficulty scores, and related queries. Provides Reynolds (Blog/SEO) data for optimization.

4. **Source Compilation**: Assembles a research packet with verified facts, statistics, quotes, and source URLs.

**Quality Gate**: Research packet must include a minimum of 3 verified sources. If the topic cannot be adequately sourced, Archy flags it as "insufficient evidence" and escalates to Atlas for a go/no-go decision.

**Output**: Research packet stored in `kb_documents` with tag `research-packet`.

## Stage 2: Content Drafting

**Lead Agent**: Sunday (Communications & Tech Doc Writer)
**Trigger**: Completed research packet from Archy

Sunday consumes the research packet and produces content drafts:

1. **Blog Post Draft**: Long-form article (800-1500 words) with SEO optimization based on Reynolds' keyword data. Includes headline, subheadings, meta description, and call-to-action.

2. **Social Copy Package**: Platform-specific copy for each active social channel. Each piece is tailored to the platform's tone, character limits, and best practices.

3. **Email Newsletter Block**: A condensed version suitable for inclusion in email campaigns.

Sunday writes all content in the tenant's brand voice, configured in the agent personality settings.

**Quality Gate**: All drafts must pass a readability check (target: Grade 8 reading level for social, Grade 10 for blog). Content must not contain unverified claims not present in Archy's research packet.

**Output**: Draft content stored in `kb_documents` with tag `content-draft` and status `draft`.

## Stage 3: Visual Production

**Lead Agent**: Venny (Image Production Specialist)
**Reports To**: Sunday

Venny generates visual assets to accompany the content:

1. **Hero Image**: Primary visual for blog posts and social shares.
2. **Platform Thumbnails**: Sized appropriately for each platform (1200x630 for Facebook/LinkedIn, 1080x1080 for Instagram, 1200x675 for Twitter).
3. **Infographics**: Data visualizations when the content includes statistics.
4. **Video Assets**: Victor (Video Production, reports to Venny) produces short-form video when applicable.

Visual production uses the tenant's brand guidelines (colors, fonts, style) stored in the business configuration.

**Quality Gate**: All images must meet minimum resolution requirements. Brand colors must be present. No watermarks or stock photo artifacts.

**Output**: Assets uploaded to Supabase storage bucket `kb_uploads` at `tenants/{tenantId}/content/`.

## Stage 4: Platform Adaptation and Publishing

**Lead Agents**: Platform-specific social publishers (all report to Sunday)

Each platform agent takes the social copy package and visual assets, then adapts for their channel:

| Agent    | Platform   | Adaptations                                        |
|----------|------------|---------------------------------------------------|
| Kelly    | X/Twitter  | Thread formatting, hashtag optimization, polls     |
| Fran     | Facebook   | Group sharing strategy, carousel formatting        |
| Link     | LinkedIn   | Professional tone adjustment, article publishing   |
| Timmy    | TikTok     | Script adaptation for short-form video             |
| Cornwall | Pinterest  | Pin descriptions, board categorization             |
| Donna    | Reddit     | Subreddit selection, community-appropriate tone    |
| Reynolds | Blog       | SEO metadata, internal linking, schema markup      |
| Dwight   | Threads    | Conversational adaptation, reply chain formatting  |
| Terry    | Tumblr     | Tag optimization, reblog-friendly formatting       |
| Emma     | Alignable  | B2B angle, local business relevance                |

**Approval Checkpoint**: Before publishing, each agent creates a `decision_memo` if:
- The content mentions a competitor by name
- The content includes pricing or financial claims
- The content is on a topic flagged as sensitive
- Daily posting cap is approaching

Publishing is staggered across the day for optimal engagement per platform.

**Quality Gate**: Each agent verifies platform-specific formatting rules, character limits, and media specifications before posting.

## Stage 5: Performance Monitoring

**Lead Agent**: Penny (Ads & Multi-Platform Performance)

After content is published, Penny monitors:

1. **Engagement Metrics**: Likes, shares, comments, clicks across all platforms within the first 24 hours.
2. **Ad Amplification**: For high-performing organic content, Penny may recommend paid amplification (subject to budget approval via decision memo if spend exceeds `AUTO_SPEND_LIMIT_USD`).
3. **Performance Report**: 48-hour post-publish report comparing actual engagement against predicted benchmarks.
4. **Optimization Recommendations**: Suggestions for follow-up content, format changes, or platform reallocation.

**Output**: Performance report stored in `kb_documents` with tag `content-performance`.

## End-to-End Timeline

| Stage               | Duration      | Cumulative    |
|---------------------|---------------|---------------|
| Research            | 15-30 min     | 0:30          |
| Drafting            | 20-45 min     | 1:15          |
| Visual Production   | 10-30 min     | 1:45          |
| Platform Adaptation | 10-20 min     | 2:05          |
| Publishing          | Staggered     | 2:05 + sched  |
| Performance Review  | 48 hours post | Ongoing       |

Total time from idea to first publish: approximately 2 hours (automated).

## Audit Trail

Every stage transition is logged to the `audit_log` table:
- `action`: `content.research_complete`, `content.draft_complete`, `content.visual_complete`, `content.published`, `content.performance_reviewed`
- `entityType`: `content_pipeline`
- `meta`: includes `{ stage, agentName, contentId, workflowId }`

This ensures full traceability from idea to published content for compliance and quality review.
