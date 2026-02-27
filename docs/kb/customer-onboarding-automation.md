# Customer Onboarding Automation

## Overview

Atlas UX automates the customer onboarding experience through a coordinated email sequence, CRM lifecycle tagging, calendar scheduling, and proactive support monitoring. The goal is to take a new customer from sign-up to fully operational within 7 days, with automated touchpoints at each milestone.

## Email Welcome Sequence

The onboarding email sequence is processed by the email sender worker (`emailSender.ts`), which polls the `jobs` table for `EMAIL_SEND` job types. Emails are sent via Microsoft Graph API through the `atlas@deadapp.info` sender address.

### Day 1: Welcome Email

**Trigger**: Account creation (tenant provisioned)
**From**: Atlas (CEO)
**Subject**: Welcome to Atlas UX — Your AI Team is Ready

Content includes:
- Personal welcome from Atlas
- Quick overview of their AI agent team
- Link to the dashboard with their gate code
- Immediate next step: "Connect your first integration"
- Support contact information (Cheryl's direct line)

**CRM Tag Applied**: `new_customer`

### Day 2: Meet Your Agents

**Trigger**: 24 hours after welcome email
**From**: Sunday (Communications Writer)
**Subject**: Meet Your AI Team — Here's Who Does What

Content includes:
- Introduction to each agent assigned to their tier
- What each agent specializes in
- How to communicate with agents (task requests, email, Telegram)
- Link to the Agent Hub (`/app/agents`)

**CRM Tag Applied**: `onboarding_day2`

### Day 3: First Workflow

**Trigger**: 48 hours after welcome email
**From**: Petra (Project Manager)
**Subject**: Your First Automated Workflow — Let's Set One Up

Content includes:
- Step-by-step guide to running their first workflow
- Recommended starter workflow based on their industry
- Link to Workflow Manager (`/app/workflows`)
- Video walkthrough link (if available)

**CRM Tag Applied**: `onboarding_day3`

### Day 5: Advanced Features

**Trigger**: 96 hours after welcome email
**From**: Binky (CRO)
**Subject**: Unlock the Full Power of Your AI Team

Content includes:
- Advanced features overview: content pipeline, intel sweeps, budget management
- Integration deep-dive (connecting social accounts, email, CRM)
- Tips for getting the most out of the daily morning brief
- Link to Knowledge Base (`/app/knowledge-base`)

**CRM Tag Applied**: `onboarding_day5`

### Day 7: Feedback Request

**Trigger**: 144 hours after welcome email
**From**: Atlas (CEO)
**Subject**: How's Your First Week? We'd Love Your Feedback

Content includes:
- Onboarding completion congratulations
- Survey link (3 questions, takes 60 seconds)
- Feature request submission form
- Reminder of support channels
- Invitation to schedule a strategy call with Binky

**CRM Tag Applied**: `onboarding_complete`, `active`
**CRM Tag Removed**: `new_customer`, `onboarding`

## CRM Lifecycle Tags

Tags are applied to the tenant record in the `integrations` table and tracked in audit logs.

| Tag                | Applied When                    | Removed When              |
|--------------------|---------------------------------|---------------------------|
| `new_customer`     | Account creation                | Day 7 completion          |
| `onboarding`       | Day 1 email sent                | Day 7 completion          |
| `onboarding_day2`  | Day 2 email sent                | Day 7 (cleanup)           |
| `onboarding_day3`  | Day 3 email sent                | Day 7 (cleanup)           |
| `onboarding_day5`  | Day 5 email sent                | Day 7 (cleanup)           |
| `onboarding_complete` | Day 7 email sent             | Never (permanent)         |
| `active`           | Day 7 or first workflow run     | Account deactivation      |
| `at_risk`          | No login for 14 days            | Next login                |

## Calendar Scheduling

Claire (Calendar Agent) manages onboarding-related scheduling:

- **Day 3**: Offers to schedule a "First Workflow Walkthrough" call (30 min, optional)
- **Day 7**: Offers to schedule a "Strategy Session" with Binky (45 min, optional)
- **Day 14**: If no workflows have been run, schedules a check-in with Cheryl

Calendar events are created via Google Calendar API using `gcal_create_event`. Attendees receive calendar invitations with Google Meet links.

## Support Monitoring

Cheryl (Customer Support) monitors new accounts during the onboarding window:

1. **Login Tracking**: If a new customer hasn't logged in within 48 hours of account creation, Cheryl sends a personalized follow-up email.

2. **Integration Failures**: If an integration connection attempt fails, Cheryl receives an alert and reaches out proactively with troubleshooting steps.

3. **Error Patterns**: If the customer encounters 3+ errors in a session, Cheryl flags the account for manual review and sends a "need help?" message.

4. **Sentiment Analysis**: Cheryl monitors any support emails or Telegram messages from the customer for negative sentiment, escalating to Petra or Atlas if needed.

## Atlas Weekly Review

Every Monday, Atlas reviews onboarding metrics as part of the Weekly Executive Summary:

- Number of new customers onboarded this week
- Completion rate (reached Day 7 milestone)
- Drop-off points (which day sees the most disengagement)
- Average time to first workflow run
- Support ticket rate during onboarding

If the completion rate drops below 70%, Atlas escalates to Binky for a growth strategy review.

## Job Queue Implementation

Each onboarding email is queued as an `EMAIL_SEND` job in the `jobs` table with `scheduledFor` set to 09:00 UTC (or the customer's local morning). The payload includes `to`, `from` (`atlas@deadapp.info`), `subject`, `body`, and `onboardingDay` for tracking.

## Audit Trail

All onboarding events are logged with `entityType: "customer_onboarding"` and actions such as `onboarding.email_sent`, `onboarding.tag_applied`, `onboarding.milestone_reached`, and `onboarding.completed`. Meta includes `{ day, emailSubject, tags }`.
