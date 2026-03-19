# HR Onboarding Workflow — Employee Onboarding Automation

## The Problem

Manual employee onboarding takes 3-5 days of HR time per hire. Forms get lost, IT tickets are forgotten, equipment arrives late, and new employees sit idle waiting for access. A structured onboarding workflow cuts this to hours and ensures nothing falls through the cracks.

## The Workflow

```
Trigger: Offer letter signed
    ↓
1. [Create employee record] → HRIS, payroll, benefits
    ↓
2. [IT provisioning] (parallel)
   ├── Create email account
   ├── Set up SSO/directory access
   ├── Order laptop/equipment
   └── Configure VPN credentials
    ↓
3. [Team setup] (parallel)
   ├── Add to Slack channels
   ├── Add to relevant GitHub/GitLab repos
   ├── Schedule intro meetings with team
   └── Assign buddy/mentor
    ↓
4. [Documentation]
   ├── Send employee handbook
   ├── Collect tax forms (W-4, I-9)
   ├── Send benefits enrollment link
   └── Collect emergency contacts
    ↓
5. [Manager notification]
   ├── Notify direct manager with start date
   ├── Send first-week schedule template
   └── Remind about 30/60/90 day plan
    ↓
6. [Day-1 welcome] (triggered by start date)
   ├── Send welcome email
   ├── Assign first-day checklist
   ├── Schedule orientation session
   └── Trigger follow-up survey (30 days later)
    ↓
[Complete — employee fully onboarded]
```

## Workflow Type Analysis

This is a **hybrid workflow**:
- **Sequential** overall (steps happen in order)
- **Parallel** within steps (IT provisioning tasks run simultaneously)
- **Rules-driven** for equipment (engineer → MacBook Pro; sales → standard laptop)
- **Human-in-the-loop** for manager approvals and document collection

## Implementation in Common Platforms

### n8n
1. Webhook trigger from HRIS (BambooHR, Gusto, Rippling)
2. HTTP nodes for API calls to Google Workspace, Slack, GitHub
3. Wait node for document collection (poll or webhook)
4. Scheduled trigger for Day-1 welcome

### Zapier
1. Trigger: New row in "Offers" Google Sheet
2. Multi-step Zap with branching for role-based equipment
3. Delay step for Day-1 welcome
4. Limitation: Complex branching needs multiple Zaps

### Monday.com
1. Form submission creates board item
2. Automation: status change triggers notifications
3. Timeline view tracks progress
4. Integration with Slack/email for notifications

## Metrics to Track

| Metric | Manual | Automated | Improvement |
|--------|--------|-----------|-------------|
| Time to full access | 3-5 days | 2-4 hours | 90-95% faster |
| HR time per hire | 8-12 hours | 30 min oversight | 95% reduction |
| Missed steps | 15-20% | < 1% | Near-zero errors |
| Employee satisfaction (Day 1) | 3.2/5 | 4.6/5 | 44% improvement |
| Time to productivity | 2-3 weeks | 1-2 weeks | 33-50% faster |

## For Small Trade Businesses (Atlas UX Context)

A plumbing company hiring a new technician needs a simpler version:
1. Collect name, phone, emergency contact
2. Add to scheduling system
3. Issue company phone/tablet
4. Add to Slack and dispatch system
5. Assign training schedule with senior tech
6. Send welcome text with first-day details

Atlas UX's Lucy could handle steps 1-2 via voice, trigger the rest automatically.

## Resources

- [SHRM Onboarding Best Practices](https://www.shrm.org/topics-tools/tools/toolkits/understanding-employee-onboarding) — Society for Human Resource Management's onboarding framework
- [BambooHR Onboarding Automation](https://www.bamboohr.com/hr-software/onboarding/) — How modern HRIS platforms automate onboarding workflows

## Image References

1. Employee onboarding workflow diagram — "employee onboarding workflow automation diagram HR process steps"
2. IT provisioning parallel tasks — "IT provisioning parallel tasks equipment accounts access onboarding"
3. Onboarding checklist template — "new employee onboarding checklist template automated tasks"
4. Before/after onboarding timeline — "manual vs automated onboarding timeline comparison days vs hours"
5. Onboarding satisfaction survey — "employee onboarding satisfaction survey results chart improvement"

## Video References

1. [Automating Employee Onboarding — Process Street](https://www.youtube.com/watch?v=QC4OoQU0DHQ) — Step-by-step guide to building automated onboarding workflows
2. [HR Automation with Zapier — Zapier](https://www.youtube.com/watch?v=V1hkj8RwPJU) — Practical HR automation examples including onboarding
