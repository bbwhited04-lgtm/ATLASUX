# Agent System

Atlas UX operates a hierarchy of named AI agents, each with defined roles, skills, and behavioral policies. Agents are advisory subroutines -- only Atlas (the CEO agent) can execute external side-effects.

## Agent Registry

Agents are defined at two levels:

1. **File-based configuration** in the `Agents/` directory (policies, skills, personality)
2. **Database registry** in the `agent_registry` table (per-tenant agent records)

### File Structure

```
Agents/
  Atlas/                    # CEO — sole executor
    SKILL.md                # Capabilities and tool access
    SOUL.md                 # Personality directives
    SOUL_LOCK.md            # Immutable personality constraints
    ATLAS_POLICY.md         # Operational policies
    MEMORY.md               # Persistent context
    Executive-Staff/        # Direct report configs
  Sub-Agents/
    BINKY/                  # CRO (research)
    SUNDAY/                 # Communications / tech writer
    KELLY/                  # X (Twitter) publisher
    FRAN/                   # Facebook publisher
    ... (27 sub-agents total)
```

Each sub-agent directory typically contains:
- `SKILL.md` — What the agent can do
- `SOUL.md` — Personality and behavioral directives
- `POLICY.md` or agent-specific policy files

## Agent Roster

### Executive Layer

| Agent | Role | Reports To |
|-------|------|------------|
| Atlas | CEO (sole executor) | Board (Chairman) |
| Binky | CRO (Chief Research Officer) | Atlas |

### Governors

| Agent | Role |
|-------|------|
| Tina | CFO (finance, risk) |
| Larry | Audit governor |
| Jenny | CLO (legal) |
| Benny | IP specialist |
| Cheryl | Support lead |

### Social Publishers (report to Sunday)

| Agent | Platform |
|-------|----------|
| Kelly | X (Twitter) |
| Fran | Facebook |
| Dwight | Threads |
| Timmy | TikTok |
| Terry | Tumblr |
| Cornwall | Pinterest |
| Link | LinkedIn |
| Emma | Alignable |
| Donna | Reddit |
| Reynolds | Blog |
| Penny | FB Ads / multi-platform |

### Operations & Media

| Agent | Role |
|-------|------|
| Sunday | Communications / tech doc writer |
| Venny | Image production specialist |
| Victor | Video production (reports to Venny) |
| Petra | Project manager |
| Sandy | Bookings / CRM |
| Frank | Forms |
| Porter | SharePoint |
| Claire | Calendar |
| Mercer | Acquisition intelligence |

### Intelligence

| Agent | Role |
|-------|------|
| Daily-Intel | Morning intelligence brief |
| Archy | Research deep-dive |

## Agent Tools — `backend/src/core/agent/agentTools.ts`

The `agentTools.ts` file defines the tool registry available to agents during execution. Tools include:

- `send_telegram_message` — Send notifications via Telegram
- Knowledge base operations
- Content publishing tools
- Data retrieval tools

Tools are invoked by the engine during workflow execution based on the agent's SKILL.md permissions.

## Deep Agent Pipeline — `backend/src/core/agent/deepAgentPipeline.ts`

The deep agent pipeline handles multi-step reasoning for complex tasks. It enables agents to:

1. Analyze the task context
2. Break down complex requests
3. Call appropriate tools
4. Synthesize results
5. Report back to the requesting agent or user

## Agent Memory — `backend/src/core/agent/agentMemory.ts`

Agents have persistent memory stored in the `agent_memory` table. This allows agents to:

- Remember context across sessions
- Track ongoing tasks
- Maintain state for multi-day workflows

## Delegation Model

The execution model follows strict rules from `policies/EXECUTION_CONSTITUTION.md`:

1. **Single Executor Rule** — Atlas is the sole execution layer. All other agents are advisory.
2. **Pre-Execution Requirements** — Every action must pass SGL evaluation and have human approval if flagged.
3. **State Transitions** — All state changes emit audit events.

Sub-agents produce recommendations and content. Atlas reviews and executes. This ensures all external side-effects (API calls, fund transfers, content publishing) go through a single auditable execution path.

## Workflow Integration

Each agent has scheduled workflows that fire via the scheduler worker. For example:

- Kelly runs `WF-093` (X Hot Topics) daily at 05:00 UTC
- Reynolds runs `WF-108` (Blog Write & Publish) every Wednesday at 13:00 UTC
- Atlas runs `WF-106` (Aggregation & Task Assignment) daily at 05:45 UTC

See [Workflow System](../architecture/workflow-system.md) for the complete schedule.

## Agent Email Accounts

Each named agent has a dedicated email address configured via environment variables. These are used for outbound communications routed through the email sender worker.
