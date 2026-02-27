# Content Creation Workflow

## Overview

Atlas UX provides a complete content pipeline from ideation to distribution. The process flows through research, drafting, visual production, review, publishing, and cross-platform distribution -- all coordinated by the agent team under governance controls.

## The Content Pipeline

```
Research -> Drafting -> Visual Assets -> Review -> Publish -> Distribute -> Monitor
```

### Stage 1: Research and Ideation

**Agents Involved**: Binky (CRO), Archy (Research), Daily-Intel

The content pipeline begins with intelligence gathering:

1. **Daily Intel Sweep** (05:00-05:36 UTC): 13 agents scan their platforms for trends, competitor activity, and audience signals
2. **Archy's Research**: Deep-dive analysis on topics flagged by the intel sweep
3. **Binky's Strategy**: Revenue-aligned content recommendations based on market data
4. **Atlas Aggregation** (WF-106, 05:45 UTC): All intel compiled and task assignments issued

**Output**: A prioritized list of content topics with audience targeting, platform selection, and strategic rationale.

### Stage 2: Content Drafting

**Agents Involved**: Sunday (Coordinator), Reynolds (Blog), Social Publishers

Once topics are assigned:

1. **Sunday** receives the content brief from Atlas and assigns specific tasks
2. **Reynolds** drafts long-form blog content (1000-2000 words, SEO-optimized)
3. **Social publishers** draft platform-specific short-form content
4. **Knowledge Base** is referenced for brand guidelines, tone of voice, and factual accuracy

**Blog Drafting Process**:
- Title and meta description
- Outline with H2/H3 structure
- Full draft with internal links
- SEO keyword integration
- Featured image brief for Venny

**Social Drafting Process**:
- Platform-appropriate length and format
- Hashtag and keyword strategy
- CTA aligned with campaign goals
- Visual asset requirements identified

### Stage 3: Visual Asset Production

**Agents Involved**: Venny (Image), Victor (Video)

Visual content is generated to accompany written pieces:

1. **Venny** creates images using DALL-E 3 with brand-consistent parameters:
   - Color palette: Navy and cyan (matching Atlas UX brand)
   - Style: Professional, clean, modern
   - Dimensions: Platform-appropriate (landscape for blog, square for social, vertical for Pinterest/TikTok)

2. **Victor** produces video content where platforms prioritize video:
   - Short-form clips for TikTok and Reels
   - Explainer videos for YouTube and LinkedIn
   - Animated graphics for social posts

3. Featured images are stored in Supabase storage (`kb_uploads` bucket) under the tenant path

### Stage 4: Review and Approval

**Agents Involved**: Atlas (CEO), Sunday (Coordinator)

All content passes through the approval pipeline:

1. **Draft Review**: Sunday reviews drafts from publishers for quality and brand alignment
2. **Atlas Approval**: High-confidence content may auto-approve; otherwise, a decision memo is generated
3. **SGL Evaluation**: The Statutory Guardrail Layer checks content for:
   - Copyright infringement
   - Trademark violations
   - Deceptive or fraudulent claims
   - Engagement manipulation tactics
4. **Human Override**: The organization owner can intervene at any point

**Approval Outcomes**:
- **ALLOW**: Content proceeds to publishing
- **REVIEW**: Content requires human review (risk tier 2+)
- **BLOCK**: Content violates SGL constraints and is rejected

### Stage 5: Publishing

**Agents Involved**: Atlas (Sole Executor), Reynolds (Blog), Social Publishers

Only Atlas can execute external side effects:

1. **Blog Publishing** (WF-108):
   - Reynolds drafts the post in Blog Studio
   - Venny generates the featured image
   - Atlas approves and publishes
   - Post appears on the public blog at `/blog/:slug`

2. **Social Publishing**:
   - Each publisher sends content to their platform API
   - Atlas executes the API call
   - Confirmation is logged to the audit trail

3. **Email Distribution**:
   - Newsletter or email campaign content is queued as EMAIL_SEND jobs
   - The email worker processes sends via Microsoft Graph

### Stage 6: Cross-Platform Distribution

**Agents Involved**: All social publishers under Sunday's coordination

After a blog post is published:

1. **Kelly** creates an X/Twitter thread summarizing key points
2. **Link** writes a LinkedIn article or post linking to the blog
3. **Fran** shares on Facebook with community engagement angle
4. **Cornwall** creates pins with optimized descriptions
5. **Donna** posts to relevant subreddits (value-first approach)
6. **Dwight** adapts for Threads
7. **Terry** creates a Tumblr post
8. **Emma** shares on Alignable for local business audience
9. **Penny** manages paid promotion across platforms

### Stage 7: Performance Monitoring

**Agents Involved**: Social publishers, Binky (CRO), Daily-Intel

Post-distribution monitoring:

1. Each publisher tracks engagement metrics on their platform
2. Data feeds into the Business Manager > Intelligence tab
3. Metrics tracked: impressions, CTR, conversions, engagement rate, reach
4. Binky analyzes ROI and channel performance
5. Insights feed back into Stage 1 for the next content cycle

## Blog Studio

The Blog Studio is integrated into the Business Manager:

- **Left Panel (55%)**: Compose area with title, content editor, category, tags, SEO fields
- **Right Panel (45%)**: Published posts list with search and filter
- **Featured Image**: Upload directly to Supabase storage or paste a URL
- **Preview**: Live preview of the post as it will appear on the public blog
- **Publishing**: Draft, publish, or schedule posts

## Content Types and Recommended Agents

| Content Type | Primary Agent | Supporting Agents |
|-------------|---------------|-------------------|
| Blog Post (1000-2000 words) | Reynolds | Venny (images), Sunday (review) |
| X/Twitter Thread | Kelly | Venny (graphics) |
| LinkedIn Article | Link | Archy (research) |
| Facebook Post | Fran | Venny (images) |
| Pinterest Pin | Cornwall | Venny (images) |
| Reddit Post | Donna | Archy (research) |
| TikTok Caption | Timmy | Victor (video) |
| Email Campaign | Sunday | Cheryl (support content) |
| Product Description | Sunday | Binky (market positioning) |

## Governance and Quality Standards

### Content Integrity
Atlas UX content adheres to the Soul document principles:
- No fake viral hacks or manufactured outrage
- No engagement manipulation or algorithm exploitation
- Growth through consistency, clarity, precision, and value creation

### Audit Trail
Every piece of content has a complete audit record:
- Who drafted it (agent and timestamp)
- Who reviewed it (agent and timestamp)
- Who approved it (Atlas and/or human, with timestamp)
- Where it was published (platform and URL)
- Performance data linked back to the content record

### Daily Posting Cap
A configurable daily posting cap prevents over-publishing and maintains content quality over quantity.
