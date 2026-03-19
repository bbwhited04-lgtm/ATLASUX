# IT Service Request Workflow — Ticket Routing and Resolution

## The Problem

IT support without a workflow means tickets get lost in email, urgent requests wait behind minor ones, the same issues get solved differently each time, and there's no data on resolution times or common problems. A structured IT workflow routes tickets to the right person, tracks SLAs, and builds a knowledge base of solutions.

## The Workflow

```
1. [Request Intake]
   ├── User submits via form/email/Slack/chat
   ├── Auto-classify category (hardware, software, access, network)
   ├── Auto-assign priority (P1-P4)
   └── Generate ticket ID
    ↓
2. [Triage] (rules-driven)
   ├── P1 (critical) → Immediate page to on-call
   ├── P2 (high) → Assign to senior tech, 4hr SLA
   ├── P3 (medium) → Assign to team queue, 24hr SLA
   └── P4 (low) → Self-service knowledge base redirect
    ↓
3. [Assignment]
   ├── Auto-assign based on category + availability
   ├── Load balance across team members
   ├── Notify assigned technician
   └── Start SLA timer
    ↓
4. [Investigation]
   ├── Technician reviews ticket details
   ├── Check knowledge base for known solutions
   ├── Contact user for additional info if needed
   └── Diagnose root cause
    ↓
5. [Resolution] (branching)
   ├── Known issue → Apply documented fix
   ├── New issue → Develop solution, document in KB
   ├── Hardware → Schedule replacement/repair
   ├── Access → Provision/revoke permissions
   └── Escalation → Route to specialist/vendor
    ↓
6. [Verification]
   ├── Confirm fix with user
   ├── User accepts or reopens
   └── If reopened → back to Investigation
    ↓
7. [Closure]
   ├── Close ticket with resolution notes
   ├── Update knowledge base if new solution
   ├── Stop SLA timer
   ├── Send satisfaction survey
   └── Update team metrics
```

## Workflow Type Analysis

- **State machine** for ticket lifecycle (open → assigned → investigating → resolved → closed)
- **Rules-driven** for triage and routing (priority × category × availability)
- **Sequential** for investigation through resolution
- **Human-in-the-loop** for verification (user confirms fix)
- **Case workflow** for investigation (technician decides what to check)

## SLA Configuration

| Priority | Response Time | Resolution Time | Escalation |
|----------|--------------|-----------------|------------|
| P1 — Critical | 15 min | 4 hours | Auto-page after 15 min |
| P2 — High | 1 hour | 8 hours | Manager after 4 hours |
| P3 — Medium | 4 hours | 24 hours | Manager after 12 hours |
| P4 — Low | 24 hours | 72 hours | Auto-close after 7 days |

## Auto-Classification with AI

Use an LLM to classify incoming tickets:

```typescript
const classifyPrompt = `Classify this IT request:
"${ticketDescription}"

Return JSON: { "category": "hardware|software|access|network", "priority": "P1|P2|P3|P4", "suggested_team": "..." }

Priority guide:
- P1: System down, data loss, security breach
- P2: Major feature broken, no workaround
- P3: Feature degraded, workaround exists
- P4: Question, enhancement request, minor issue`;
```

## Platform Implementations

### Kissflow
- Pre-built IT service request template
- SLA tracking with escalation rules
- Custom forms for different request types
- Dashboard with open tickets, SLA compliance, team workload

### ClickUp
- Custom statuses matching ticket lifecycle
- Automations for assignment and notifications
- Time tracking per ticket for team metrics
- Integration with monitoring tools (PagerDuty, Datadog)

### n8n
- Webhook intake from Slack/email/forms
- LLM node for auto-classification
- HTTP nodes for integration with ITSM tools
- Scheduled check for SLA breaches

## Atlas UX Application

For Atlas UX's trade business customers, the IT service request pattern maps to **customer service requests**:

```
Customer calls Lucy → Lucy classifies request → Routes to right agent
├── Billing → Tina (financial ops)
├── Scheduling → Lucy (appointment management)
├── Complaint → Cheryl (support)
├── Sales inquiry → Binky (CRO)
└── Technical → Escalate to human
```

The same workflow pattern — intake, classify, route, resolve, verify, close — applies to any service business.

## Metrics to Track

| Metric | Target | What It Tells You |
|--------|--------|-------------------|
| First response time | < SLA | Team responsiveness |
| Resolution time | < SLA | Problem-solving efficiency |
| SLA compliance | > 95% | Service quality |
| First-contact resolution | > 70% | Knowledge base quality |
| Reopen rate | < 5% | Fix quality |
| Customer satisfaction | > 4.0/5 | User experience |

## Resources

- [ITIL 4 Service Request Management](https://www.axelos.com/certifications/itil-service-management) — The industry standard framework for IT service management
- [Atlassian ITSM Guide](https://www.atlassian.com/itsm/service-request-management) — Practical guide to service request management with Jira

## Image References

1. IT service request lifecycle — "IT service request ticket lifecycle workflow status diagram ITSM"
2. Triage priority matrix — "incident priority matrix severity impact urgency P1 P2 P3 P4"
3. Auto-assignment routing — "ticket auto assignment routing rules team load balance diagram"
4. SLA tracking dashboard — "SLA tracking dashboard compliance response resolution time chart"
5. Escalation path diagram — "ticket escalation path timeline auto-escalate manager director diagram"

## Video References

1. [ITIL Service Request Management — Axelos](https://www.youtube.com/watch?v=hK-GBJodHvQ) — Official ITIL framework for managing service requests
2. [Building IT Helpdesk Automation — n8n](https://www.youtube.com/watch?v=qZJ3emSLdaQ) — Practical IT ticket automation with n8n
