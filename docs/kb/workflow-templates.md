# Workflow Templates

## Overview

Atlas UX includes 100+ predefined workflows covering daily operations, content creation, social publishing, research, support, financial oversight, and cross-platform intelligence. Workflows are organized by workflow ID (WF-XXX) and can be triggered on schedule, on demand, or by event.

## Core Operational Workflows

### WF-001: Support Intake
**Agent**: Cheryl (Customer Support)
**Trigger**: Incoming support request
**Steps**:
1. Receive and parse the support request
2. Categorize by topic (billing, technical, account, general)
3. Assess urgency (critical, high, medium, low)
4. Search Knowledge Base for relevant articles
5. Draft a response based on KB content and context
6. Queue response for approval if risk level warrants review
7. Send approved response via email
8. Log interaction to CRM and audit trail

### WF-002: Support Escalation
**Agent**: Cheryl -> Atlas
**Trigger**: Support ticket exceeds Cheryl's authority or complexity
**Steps**:
1. Cheryl flags the ticket for escalation
2. Escalation memo is created with context and history
3. Atlas reviews and assigns to the appropriate executive agent
4. Jenny (Legal) is involved if the issue has legal implications
5. Resolution is tracked and reported back through the chain

### WF-010: Daily Executive Brief
**Agent**: Atlas (CEO)
**Trigger**: Scheduled at 08:30 UTC daily
**Steps**:
1. Aggregate intelligence from morning sweep workflows (WF-093 to WF-105)
2. Compile financial summary from Tina's overnight analysis
3. List pending decision memos with urgency flags
4. Summarize agent activity from the past 24 hours
5. Identify priority items requiring human attention
6. Draft and send the brief email to the organization owner
7. CC to Binky (CRO) for awareness

### WF-020: Engine Run Smoke Test
**Agent**: Atlas
**Trigger**: On demand or post-deployment
**Steps**:
1. Verify engine loop is running and responsive
2. Create a test job and confirm it processes
3. Validate database connectivity
4. Check AI provider availability
5. Confirm email worker is processing
6. Report results to audit log

## Intelligence Workflows

### WF-033: Daily Intel (Daily-Intel Agent)
**Trigger**: Part of daily platform intel sweep (05:00 UTC)
**Steps**:
1. Scan news sources for industry-relevant updates
2. Monitor competitor activity and product changes
3. Track market trends and emerging technologies
4. Compile findings into a structured brief
5. Send report to Sunday (Communications lead)

### WF-034: Research Deep Dive (Archy)
**Trigger**: Part of daily platform intel sweep
**Steps**:
1. Receive research topics from Atlas or Binky
2. Conduct deep analysis on assigned topics
3. Cross-reference multiple sources for accuracy
4. Compile findings with citations
5. Deliver research report to Binky (CRO)

### WF-093 to WF-105: Platform Intel Sweep (13 Agents)
**Trigger**: Scheduled daily, 05:00 to 05:36 UTC (staggered 3 minutes apart)
**Agents**: All 13 social publishers + intel specialists
**Steps per agent**:
1. Scan assigned platform for trends, competitor activity, and audience signals
2. Analyze engagement patterns and content performance
3. Identify opportunities and threats
4. Compile platform-specific intelligence report
5. Send report to Sunday

### WF-106: Atlas Daily Aggregation & Task Assignment
**Trigger**: Scheduled at 05:45 UTC daily
**Steps**:
1. Receive aggregated intelligence from all morning sweep workflows
2. Use ORCHESTRATION_REASONING to analyze cross-platform patterns
3. Identify priority opportunities and threats
4. Assign daily tasks to appropriate agents
5. Set content creation priorities
6. Update strategic direction based on intelligence

## Social Publishing Workflows

### WF-054: X/Twitter Publishing (Kelly)
**Trigger**: Content assignment from Sunday or on demand
**Steps**:
1. Receive content brief and target audience
2. Draft tweets or thread with hashtag strategy
3. Request image from Venny if visual content needed
4. Submit for Atlas approval
5. Publish on approval
6. Monitor initial engagement metrics

### WF-055: Facebook Publishing (Fran)
**Trigger**: Content assignment from Sunday or on demand
**Steps**:
1. Receive content brief
2. Draft Facebook post with engagement prompts
3. Optimize for Facebook algorithm (format, length, media)
4. Submit for approval
5. Publish and monitor community response

### WF-056: Threads Publishing (Dwight)
**Trigger**: Content assignment from Sunday or on demand

### WF-057: TikTok Publishing (Timmy)
**Trigger**: Content assignment from Sunday or on demand
**Special**: Coordinates with Victor for video content

### WF-058: Tumblr Publishing (Terry)
**Trigger**: Content assignment from Sunday or on demand

### WF-059: Pinterest Publishing (Cornwall)
**Trigger**: Content assignment from Sunday or on demand
**Special**: Coordinates with Venny for vertical pin images

### WF-108: Blog Publishing (Reynolds)
**Trigger**: Content assignment or on demand
**Steps**:
1. Reynolds drafts the blog post in Blog Studio
2. SEO optimization (title, meta description, keywords, internal links)
3. Venny generates a DALL-E 3 featured image (navy/cyan brand palette)
4. Atlas reviews and approves the post
5. Post is published to the public blog
6. Confirmation email sent to Atlas with CC to Sunday
7. Social publishers receive distribution assignments

## Financial Workflows

### Tina (CFO) Overnight Analysis
**Trigger**: Scheduled daily
**Steps**:
1. Review all ledger entries from the past 24 hours
2. Compare spend against allocated budgets
3. Flag any anomalous or unexpected charges
4. Generate financial summary for the daily executive brief
5. Escalate concerns to Atlas if spend patterns deviate from plan

### Larry (Auditor) Compliance Check
**Trigger**: Scheduled or on demand
**Steps**:
1. Audit intake: review flagged actions from the past period
2. Compliance check against governance policies
3. If violation found: stop-audit initiated
4. Generate audit report with findings
5. Send reply to Atlas with compliance status

## Legal and IP Workflows

### Jenny (CLO) Legal Intake
**Trigger**: Escalation from Atlas or SGL REVIEW
**Steps**:
1. Receive legal question or regulatory concern
2. Research applicable laws and regulations
3. Prepare legal packet with analysis and recommendation
4. Submit to Atlas for review
5. If chairman approval required, escalate per SGL rules

### Benny (IP Counsel) IP Review
**Trigger**: Content review or IP concern
**Steps**:
1. Receive content or action for IP analysis
2. Check for trademark, copyright, and patent implications
3. Provide IP risk assessment
4. Recommend modifications if infringement risk exists
5. Clear content for publication or flag for human review

## Operations Workflows

### WF-063: Mercer (Acquisition)
**Trigger**: Scheduled or CRM-triggered
**Steps**:
1. Analyze CRM segments for acquisition targets
2. Score leads based on firmographic and behavioral data
3. Draft outreach content for high-scoring leads
4. Submit outreach plan for approval
5. Execute approved outreach via appropriate channels

### Petra (Project Management)
**Trigger**: Task assignment from Atlas
**Steps**:
1. Receive project brief or task list
2. Break down into actionable items with timelines
3. Assign sub-tasks to appropriate agents
4. Track progress and report status
5. Escalate blockers to Atlas

### Claire (Calendar Management)
**Trigger**: Scheduling requests
**Steps**:
1. Receive scheduling request
2. Check availability across relevant calendars
3. Propose time slots
4. Confirm booking on approval
5. Send calendar invitations

## Workflow Configuration

### Enabling and Disabling
Workflows can be enabled or disabled in the Agents Hub under the Workflows view. Disabled workflows will not fire on their schedule but can still be triggered manually.

### Custom Scheduling
Modify workflow trigger times in the scheduler configuration:
- Platform intel sweep: 05:00-05:36 UTC (staggered)
- Daily aggregation: 05:45 UTC
- Daily executive brief: 08:30 UTC
- Adjust times to match your business hours and timezone

### Manual Triggering
Any workflow can be triggered on demand via:
- The Workflows view in the Agents Hub
- The API: `POST /v1/workflows/:id/trigger`
- Chat command to Atlas: "Run workflow WF-010"

### Canonical Workflow Keys
The engine accepts manifest workflows without requiring a database row. This is handled through CANONICAL_WORKFLOW_KEYS fallback in the engine, ensuring all registered workflows can execute even before they are formally provisioned in the database.

## Creating Custom Workflows

Custom workflows can be defined for Business and Enterprise tiers:
1. Define the workflow steps and agent assignments
2. Set the trigger type (schedule, event, manual)
3. Configure approval requirements per step
4. Test with a dry run before enabling
5. Monitor execution through the Agent Watcher

## n8n Integration

Atlas UX includes an n8n workflow library with 70+ pre-built templates across categories:
- Social media automation
- Content creation
- Financial operations
- Legal and compliance
- Healthcare
- HR and operations
- DevOps
- Customer service
- Analytics and research

These templates can be imported and customized for your specific business needs.
