# Agent Roles Explained

## Overview

Atlas UX deploys a structured hierarchy of AI agents, each with defined roles, authority boundaries, and tool access. All agents operate under the governance of the Statutory Guardrail Layer (SGL) and the Execution Constitution.

## Executive Leadership

### Atlas -- CEO & Sole Executor
- **Role**: Chief Executive Officer and the only agent authorized to execute external side effects
- **Authority**: Calls APIs, moves funds, provisions accounts, publishes content, sends outbound communications
- **Key Principle**: All other agents are advisory subroutines; Atlas is the single execution layer
- **Reports To**: Human owner (sovereign authority)

### Binky -- CRO (Chief Revenue Officer)
- **Role**: Research, intelligence gathering, and revenue strategy
- **Authority**: Draft, research, and propose; execute/publish only with explicit Atlas approval
- **Tools**: Word (read/write), OneNote (read/write), SharePoint (read), OneDrive (read)
- **Constraint**: $0 spend enforced; no paid add-ons without human approval

## Board & Governance

### Chairman
- **Role**: Board-level oversight and governance
- **Authority**: Escalation target for SGL REVIEW decisions

## Executive Staff

### Tina -- CFO (Chief Financial Officer)
- **Role**: Financial oversight, budget tracking, spend analysis, and fiscal compliance
- **Authority**: Reviews financial actions, monitors auto-spend limits, validates budget requests
- **Key Function**: Ensures all financial actions have proper traceability

### Larry -- Secretary & Auditor
- **Role**: Audit intake, compliance checks, and governance record-keeping
- **Authority**: Reads audit logs, validates compliance state, flags irregularities
- **Key Function**: Stop-audit-reply workflow for compliance investigations

### Jenny -- CLO (Chief Legal Officer)
- **Role**: Legal counsel, regulatory compliance, contract review
- **Authority**: Legal packet preparation, regulatory guidance, policy reference
- **Tools**: Policy and knowledge base access, task delegation

### Benny -- IP Counsel
- **Role**: Intellectual property protection, trademark monitoring, IP strategy
- **Authority**: IP analysis, trademark guidance, infringement detection
- **Tools**: Policy and knowledge base access, task delegation

### Cheryl -- Customer Support Lead
- **Role**: Customer support triage, response drafting, ticket management
- **Authority**: Handles support intake, escalation workflows, customer communication
- **Workflow**: WF-001 Support Intake, WF-002 Support Escalation

## Operations & Research Team (Reports to Binky)

### Daily-Intel
- **Role**: Daily intelligence briefing compilation
- **Workflow**: WF-033, runs in the daily platform intel sweep

### Archy -- Research Specialist
- **Role**: Deep research and analysis
- **Workflow**: WF-034, runs in the daily platform intel sweep

### Sunday -- Communications & Technical Documentation
- **Role**: Coordinates content creation, manages social publisher team, technical documentation
- **Authority**: Oversees all social publishers and content agents
- **Key Function**: Docs intake, draft reply, and approval gate workflows

## Social Publisher Team (All Report to Sunday)

Each social publisher is a platform-specific content agent:

| Agent | Platform | Workflow |
|-------|----------|----------|
| Kelly | X (Twitter) | WF-054 |
| Fran | Facebook | WF-055 |
| Dwight | Threads | WF-056 |
| Timmy | TikTok | WF-057 |
| Terry | Tumblr | WF-058 |
| Cornwall | Pinterest | WF-059 |
| Link | LinkedIn | Platform intel sweep |
| Emma | Alignable | Platform intel sweep |
| Donna | Reddit | Platform intel sweep |
| Reynolds | Blog | WF-108 (blog publish with image generation) |
| Penny | FB Ads / Multi-Platform | Multi-platform ad management |

### Publisher Constraints
- No agent may post without approval
- No fabricated trends or distorted data
- No impersonation of authority
- No cross-tenant boundary violations
- All write actions are drafted for Atlas review

## Media Production

### Venny -- Image Production Specialist
- **Role**: AI image generation, brand-consistent visual content
- **Reports To**: Sunday
- **Key Function**: DALL-E 3 image generation for blog headers, social media visuals

### Victor -- Video Production
- **Role**: Video content creation and editing
- **Reports To**: Venny

## Operations Specialists

### Petra -- Project Manager
- **Role**: Task coordination, project tracking, timeline management

### Sandy -- Bookings
- **Role**: Appointment scheduling, booking management

### Frank -- Forms
- **Role**: Form creation, data collection, survey management

### Porter -- SharePoint
- **Role**: Document library management, SharePoint operations

### Claire -- Calendar
- **Role**: Calendar management, scheduling, availability tracking

### Mercer -- Acquisition
- **Role**: Customer acquisition, lead generation, outreach
- **Workflow**: WF-063

## Agent Governance Rules

1. **All agents operate under Atlas**: No independent execution
2. **Audit is mandatory**: Every action is logged, attributed, and timestamped
3. **SGL compliance**: All actions must pass the Statutory Guardrail Layer evaluation
4. **Human override**: The human owner has sovereign authority over all agents
5. **No silent power**: Every action is reviewable
6. **Tool access is role-scoped**: Each agent only has access to tools relevant to their function

## Using Agents

To interact with agents:
- **Chat Interface**: Direct conversation with any agent at `/app/chat`
- **Agent Watcher**: Monitor real-time agent activity at `/app/watcher`
- **Telegram**: Use `/atlas`, `/binky`, `/cheryl` commands to switch agents
- **Workflows**: Agents execute automatically via scheduled workflows
- **Jobs**: Queue work for agents via the Job Runner at `/app/jobs`
