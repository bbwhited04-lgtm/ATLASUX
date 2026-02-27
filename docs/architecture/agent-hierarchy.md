# Agent Hierarchy

Atlas UX operates a structured hierarchy of AI agents organized into layers with clear reporting chains. Each agent has a defined role, skill set, and set of behavioral policies.

## Organizational Chart

```
                        Board
                          |
                      Chairman
                          |
            +-------------+-------------+
            |                           |
          Atlas (CEO)              Binky (CRO)
            |                           |
    +-------+-------+          +-------+-------+
    |       |       |          |       |       |
  Tina   Larry   Jenny    Daily-Intel Archy  Sunday
  (CFO) (Audit) (CLO)    (Intel)  (Research) (Comms)
    |                                          |
  Benny                              +--------+--------+
  (IP)                               |        |        |
                                   Kelly    Fran    Dwight
                                   (X)     (FB)   (Threads)
                                   Timmy   Terry   Cornwall
                                  (TikTok)(Tumblr)(Pinterest)
                                   Link    Emma    Donna
                                  (LI)   (Alignable)(Reddit)
                                  Reynolds  Penny
                                  (Blog)   (Ads)

  Operations:
    Petra (PM) | Sandy (Bookings) | Frank (Forms) | Porter (SharePoint)
    Claire (Calendar) | Mercer (Acquisition) | Cheryl (Support)

  Media Production:
    Venny (Image) -> Victor (Video)
```

## Layer Definitions

### Board Layer

- **Chairman** — Governance oversight, required for escalated approvals

### Executive Layer

| Agent | Role | Key Responsibilities |
|-------|------|---------------------|
| Atlas | CEO | Sole execution authority, daily aggregation, task assignment |
| Binky | CRO | Chief Research Officer, research digest, strategic intel |

Atlas is the only agent that can execute external side-effects (API calls, content publishing, fund transfers). All other agents are advisory.

### Governor Layer

| Agent | Role | Key Responsibilities |
|-------|------|---------------------|
| Tina | CFO | Finance oversight, risk gating, budget analysis |
| Larry | Audit Governor | Audit gate, compliance verification |
| Jenny | CLO | Legal compliance, contract review |
| Benny | IP Specialist | Intellectual property protection |
| Cheryl | Support Lead | Customer support triage, ticket management |

### Intelligence Layer

| Agent | Role | Key Responsibilities |
|-------|------|---------------------|
| Daily-Intel | Morning Brief | Daily intelligence aggregation, morning brief |
| Archy | Research Deep-Dive | Deep research analysis, Instagram intel |
| Sunday | Communications | Tech doc writing, communications coordination |

### Social Publisher Layer (reports to Sunday)

| Agent | Platform | Workflow |
|-------|----------|----------|
| Kelly | X (Twitter) | Hot topics, auto-DM, scheduled posts |
| Fran | Facebook | Trends analysis, page posts |
| Dwight | Threads | Trends analysis, content posts |
| Timmy | TikTok | Trends, content drafts |
| Terry | Tumblr | Trends, content posts |
| Cornwall | Pinterest | Trends, pins |
| Link | LinkedIn | Trends, scheduled posts |
| Emma | Alignable | Trends, business updates |
| Donna | Reddit | Trends, monitoring, engagement scan |
| Reynolds | Blog | SEO trends, blog writing & publishing |
| Penny | FB Ads / Multi-platform | Ads intel, multi-platform content |

### Operations Layer

| Agent | Role | Key Responsibilities |
|-------|------|---------------------|
| Petra | Project Manager | Sprint planning |
| Sandy | Bookings | CRM sync, appointment management |
| Frank | Forms | Form aggregation |
| Porter | SharePoint | SharePoint sync |
| Claire | Calendar | Calendar prep, scheduling |
| Mercer | Acquisition | Acquisition intelligence |

### Media Production Layer

| Agent | Role | Reports To |
|-------|------|------------|
| Venny | Image Production Specialist | Sunday |
| Victor | Video Production | Venny |

## Agent Configuration Files

Each agent's behavior is defined in markdown files under `Agents/`:

```
Agents/Atlas/SKILL.md           # What Atlas can do
Agents/Atlas/SOUL.md            # Atlas personality
Agents/Atlas/SOUL_LOCK.md       # Immutable personality constraints
Agents/Atlas/ATLAS_POLICY.md    # Operational policies
Agents/Atlas/MEMORY.md          # Persistent memory context

Agents/Sub-Agents/KELLY/        # Each sub-agent has its own directory
Agents/Sub-Agents/POLICY.md     # Shared sub-agent policies
Agents/Sub-Agents/SOUL.md       # Shared sub-agent personality base
Agents/Sub-Agents/SOUL-LOCK.md  # Shared immutable constraints
```

## Delegation Model

1. **Top-Down Task Assignment** — Atlas aggregates intel from all agents (WF-106) and assigns tasks
2. **Advisory Only** — Sub-agents produce analysis, recommendations, and content drafts
3. **Single Executor** — Only Atlas can execute external actions (enforced by SGL)
4. **Escalation Chain** — High-risk decisions escalate through governors (Tina, Larry) to the Chairman

## Database Registration

Agents are registered in the `agent_registry` table per tenant:

```prisma
model agent_registry {
  id         String  @id @db.Uuid
  tenant_id  String  @db.Uuid
  name       String
  role       String?
  status     String? @default("DRAFT")
}
```

Agent memory is persisted in the `agent_memory` table, allowing agents to maintain state across sessions.
