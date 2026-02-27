# Agent Architecture

Atlas UX employs a hierarchy of named AI agents, each with a dedicated role,
email account, personality configuration, and tool access. Agents operate
autonomously within safety guardrails, governed by the System Governance
Language (SGL) policy framework.

---

## Agent Hierarchy

```
                        +------------------+
                        |    Chairman       |
                        |    (Board)        |
                        +--------+---------+
                                 |
                  +--------------+--------------+
                  |                             |
          +-------v-------+            +-------v-------+
          |  Atlas (CEO)  |            |  Binky (CRO)  |
          |  Executive    |            |  Executive     |
          +-------+-------+            +-------+-------+
                  |                             |
       +----------+----------+        +---------+---------+
       |                     |        |         |         |
  +----v----+          +----v----+   daily   archy    sunday
  |  Tina   |          |  Larry  |   intel  research  comms
  |  CFO    |          | Governor|
  | Governor|          +---------+
  +---------+
       |
  +----+----+----+----+
  jenny  benny cheryl
  CLO    IP    Support
  (Specialists)
```

### Tier Definitions

| Tier         | Agents                                              | Authority                        |
|--------------|------------------------------------------------------|----------------------------------|
| Board        | Chairman                                             | Oversight, final escalation      |
| Executive    | Atlas (CEO), Binky (CRO)                             | Strategic direction, task assign |
| Governor     | Tina (CFO), Larry                                    | Domain oversight, budget control |
| Specialist   | Jenny (CLO), Benny (IP), Cheryl (Support)            | Domain-specific expertise        |
| Binky Crew   | Daily-Intel, Archy (Research), Sunday (Comms/Tech)   | Intelligence and communications  |
| Publishers   | Kelly, Fran, Dwight, Timmy, Terry, Cornwall, etc.    | Social media posting             |
| Ops/Media    | Venny, Victor, Petra, Sandy, Frank, Porter, etc.     | Production and operations        |

## Complete Agent Roster

### Executive & Governance

| Agent    | Role                          | Reports To  |
|----------|-------------------------------|-------------|
| Chairman | Board oversight               | --          |
| Atlas    | CEO, primary orchestrator     | Chairman    |
| Binky    | CRO, revenue & growth         | Chairman    |
| Tina     | CFO, financial governance     | Atlas       |
| Larry    | Governor                      | Atlas       |

### Specialists

| Agent    | Role                          | Reports To  |
|----------|-------------------------------|-------------|
| Jenny    | CLO (Chief Legal Officer)     | Tina        |
| Benny    | IP (Intellectual Property)    | Tina        |
| Cheryl   | Customer Support              | Tina        |

### Intelligence & Communications

| Agent       | Role                          | Reports To  |
|-------------|-------------------------------|-------------|
| Daily-Intel | Daily intelligence briefing   | Binky       |
| Archy       | Research analyst               | Binky       |
| Sunday      | Comms/Tech doc writer          | Binky       |

### Social Media Publishers (all report to Sunday)

| Agent     | Platform     |
|-----------|--------------|
| Kelly     | X (Twitter)  |
| Fran      | Facebook     |
| Dwight    | Threads      |
| Timmy     | TikTok       |
| Terry     | Tumblr       |
| Cornwall  | Pinterest    |
| Link      | LinkedIn     |
| Emma      | Alignable    |
| Donna     | Reddit       |
| Reynolds  | Blog         |
| Penny     | FB Ads / Multi-platform |

### Operations & Media

| Agent    | Role                          | Reports To  |
|----------|-------------------------------|-------------|
| Venny    | Image Production Specialist   | Sunday      |
| Victor   | Video Production              | Venny       |
| Petra    | Project Manager               | Atlas       |
| Sandy    | Bookings                      | Atlas       |
| Frank    | Forms                         | Atlas       |
| Porter   | SharePoint                    | Atlas       |
| Claire   | Calendar                      | Atlas       |
| Mercer   | Acquisition                   | Atlas       |

## Agent Configuration

Each agent is defined with the following properties:

- **Name and role** — Canonical identity and job title
- **Email account** — Dedicated email address (e.g., `atlas@deadapp.info`)
- **Personality** — Defined in `src/config/aiPersonality.ts`; affects tone and
  communication style
- **Tool access** — Which tools the agent can invoke (email, Telegram, data
  queries, social media APIs, etc.)
- **Reports to** — Determines escalation path and supervision hierarchy
- **Workflows** — Which scheduled workflows the agent participates in

## Agent Execution Model

When an agent is tasked with work, the engine follows this process:

```
1. Job is queued (either by scheduler or another agent)
         |
         v
2. Engine loop picks up the job
         |
         v
3. Agent config is loaded (role, personality, tools, constraints)
         |
         v
4. AI provider is called with agent context + task description
         |
         v
5. AI returns a plan with tool calls
         |
         v
6. Risk assessment:
   |-- Low risk (tier 0-1, below spend limit)  -->  Auto-execute
   |-- High risk (tier >= 2, above spend limit) -->  Create decision_memo
         |                                               |
         v                                               v
7. Execute tool calls                            Wait for approval
         |
         v
8. Log results to audit_log
         |
         v
9. Job status: completed or failed
```

## Tool Access

Agents interact with external systems through a controlled tool interface
defined in `agentTools.ts`:

| Tool                     | Purpose                              | Available To       |
|--------------------------|--------------------------------------|--------------------|
| `send_email`             | Send email via Microsoft Graph       | All agents         |
| `send_telegram_message`  | Send Telegram notification           | All agents         |
| `query_database`         | Read business data                   | Exec, Governors    |
| `create_content`         | Draft blog/social content            | Publishers, Sunday |
| `publish_social`         | Post to social platforms             | Publishers only    |
| `create_decision_memo`   | Request approval for high-risk action| All agents         |
| `schedule_meeting`       | Calendar operations                  | Claire, Petra      |

Tool invocation is triggered by keyword detection in agent context. For example,
phrases like "telegram", "notify me", "ping me", or "alert me" trigger the
`send_telegram_message` tool.

## SGL Governance

The System Governance Language (SGL) is a custom DSL defined in
`policies/SGL.md`. It provides declarative rules that constrain agent behavior:

- **Spend limits** — Maximum dollar amount an agent can authorize
- **Action caps** — Maximum actions per day per agent
- **Posting caps** — Maximum social media posts per day
- **Escalation rules** — When to escalate to a supervisor
- **Blocked actions** — Things agents must never do (e.g., recurring charges)

SGL policies are loaded by the engine before each agent execution. Violations
result in the action being blocked and an audit log entry being created.

## Decision Memos (Approval Workflow)

When an agent encounters a high-risk action, it creates a decision memo:

```
Agent wants to: spend $500 on advertising
                     |
                     v
Risk assessment: spend > AUTO_SPEND_LIMIT_USD
                     |
                     v
Create decision_memo:
  - action: "ADVERTISING_SPEND"
  - amount: 500.00
  - risk_tier: 2
  - justification: "Q1 campaign budget allocation"
  - status: PENDING
                     |
                     v
Human reviewer approves or rejects via UI
                     |
          +----------+----------+
          |                     |
     APPROVED              REJECTED
          |                     |
          v                     v
   Execute action        Log rejection,
   Log completion        notify agent
```

## Agent Communication

Agents communicate through several channels:

1. **Job queue** — One agent can queue a job for another agent
2. **Audit log** — Agents read the shared audit log for situational awareness
3. **Decision memos** — Agents create memos that other agents or humans review
4. **Email** — Agents can email each other using their dedicated accounts
5. **Telegram** — Agents can send notifications to configured chat IDs

## Personality System

Each agent has a personality configuration that affects:

- **Tone** — Formal (Jenny/CLO) vs. casual (Cheryl/Support)
- **Verbosity** — Terse (Daily-Intel) vs. detailed (Archy/Research)
- **Risk appetite** — Conservative (Tina/CFO) vs. growth-oriented (Binky/CRO)
- **Communication style** — How the agent writes emails, reports, and messages

Personality configs are stored in `src/config/aiPersonality.ts` and injected
into the AI provider context during agent execution.

## Related Documentation

- [Architecture Overview](./README.md)
- [Workflow Architecture](./workflows.md)
- [Job System Architecture](./job-system.md)
- [Security Architecture](./security.md)
- [Audit System Architecture](./audit-system.md)
