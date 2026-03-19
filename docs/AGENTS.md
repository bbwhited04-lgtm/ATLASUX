# AI Agent System

## Overview

Atlas UX operates a hierarchical multi-agent system where agents have defined roles, reporting chains, tool permissions, and governance constraints. No agent acts autonomously -- all execution flows through Atlas (President/CEO) after SGL governance evaluation.

---

## Hierarchy

```
Chairman (Billy E. Whited) ........................ Board (sovereign authority)
  |
  +-- Atlas (President / CEO) ..................... Executive
  |     |
  |     +-- Executive Staff
  |     |     +-- Treasurer Tina (CFO) ........... Governor
  |     |     +-- Secretary Larry (Audit) ........ Governor
  |     |     +-- Legal Counsel Jenny ............ Specialist
  |     |     +-- IP Counsel Benny ............... Specialist
  |     |
  |     +-- Sub-Agents (Atlas direct reports)
  |           +-- Lucy (Receptionist) ............ Voice & front desk
  |           +-- Mercer (Customer Acquisition) .. Outbound sales
  |           +-- Petra (Project Manager) ........ Project tracking
  |           +-- Porter (SharePoint) ............ Reports to Larry
  |
  +-- Binky (Chief Research Officer) .............. Executive
        |
        +-- Direct Reports
              +-- Cheryl (Customer Support)
              +-- Daily-Intel (Intel Aggregator)
              +-- Archy (Research Subagent)
              +-- Frank (Forms & Data)
              +-- Sunday (Comms & Docs Writer)
                    |
                    +-- Social Media Team
                          +-- Venny (Image/Video)
                          |     +-- Victor (Video Specialist)
                          +-- Penny (Facebook Ads)
                          +-- Donna (Reddit)
                          +-- Cornwall (Pinterest)
                          +-- Link (LinkedIn)
                          +-- Dwight (Threads)
                          +-- Reynolds (Blog)
                          +-- Emma (Alignable)
                          |     +-- Claire (Calendar)
                          |     +-- Sandy (Bookings)
                          +-- Fran (Facebook Page)
                          +-- Kelly (X / Twitter)
                          +-- Terry (Tumblr)
                          +-- Timmy (TikTok)
```

**Reporting rules:**
1. Every agent has exactly one `reportsTo` parent in `backend/src/agents/registry.ts`.
2. Escalation always flows upward: Agent -> Parent -> Atlas -> Chairman.
3. No agent may bypass its reporting chain.

**Source of truth:** `backend/src/agents/registry.ts` (canonical IDs, tiers, reporting lines, tool permissions).

---

## Agent Configuration Files

Each agent has a directory under `Agents/` containing:

| File | Purpose |
|------|---------|
| `SOUL.md` | Core identity, values, and behavioral principles |
| `SOUL_LOCK.md` | SHA-256 hash lock preventing unauthorized soul modifications |
| `AGENTS.md` | Role definition, mission, inputs, responsibilities, restrictions |
| `POLICY.md` | Operational constraints and compliance rules |
| `SKILL.md` | Capabilities, tools, and knowledge areas (injected into chat context) |
| `MEMORY.md` | Persistent facts and learned context |

---

## Key Agents

### Atlas (President/CEO)

- **Role:** Sole execution layer. All external side effects (API calls, fund transfers, content publishing) flow through Atlas.
- **Soul:** Truth at all times. Accountability architecture. Every action leaves a trace. Human override is paramount.
- **Authority:** Full execution authority subject to SGL and human approval gates.

### Binky (Chief Research Officer)

- **Role:** Intelligence-driven research, validation, and compliance advisory.
- **Authority:** Advisory only. Cannot execute external actions. Provides research backing for other agents.

### Lucy (Receptionist)

- **Role:** AI voice receptionist. Answers calls 24/7, books appointments, sends SMS, takes messages.
- **Soul:** Warmth with precision. Professional but never cold. Every caller is the most important person.
- **Implementation:** ElevenLabs Conversational AI + Twilio voice. See [VOICE.md](VOICE.md).

### Mercer (Customer Acquisition)

- **Role:** Outbound sales strategy, prospect management, campaign proposals.
- **Authority:** Proposal only. No direct spend, no tool procurement, no pricing authority.
- **Restrictions:** No outbound claims without Binky citation. No access to financial or tenant PII.

---

## Statutory Guardrail Layer (SGL)

Source: `policies/SGL.md`, `backend/src/core/sgl.ts`

SGL defines non-overridable execution boundaries. No agent, tenant, administrator, or founder may bypass these constraints.

### Decision Outputs

| Decision | Meaning |
|----------|---------|
| `ALLOW` | Intent may proceed |
| `REVIEW` | Human approval required before execution |
| `BLOCK` | Intent is prohibited |

### Automatic REVIEW Triggers

```typescript
// From sgl.ts
if (regulated.has(intent.type))     -> REVIEW  // GOV_FILING_IRS, BANK_TRANSFER, CRYPTO_TRADE_EXECUTE
if (intent.type === "BROWSER_TASK") -> REVIEW  // Browser automation
if (intent.dataClass === "PHI")     -> REVIEW  // Protected health info
if (intent.spendUsd >= 250)         -> REVIEW  // Spend threshold
```

### Non-Overridable Prohibitions (always BLOCK)

- Statutory violations (federal, state, international law)
- PHI/HIPAA unsafe handling
- Copyright/trademark infringement
- Fraudulent or deceptive claims
- Regulated financial execution without authorization
- Government filings without signature
- Unauthorized bank transfers
- Attempts to modify SGL logic itself

### Tamper Policy

Attempts to alter or bypass SGL are logged, trigger restricted execution state, and require compliance review.

### Immutability

SGL logic changes require: code update, version increment, audit record, and board acknowledgment.

---

## Execution Constitution

Source: `policies/EXECUTION_CONSTITUTION.md`

1. **Single Executor Rule:** Atlas is the sole execution layer. All other agents are advisory subroutines.
2. **Pre-Execution Requirements:** Intent validated, SGL returns ALLOW, human approval if flagged.
3. **Human Authorization:** Regulated actions require explicit approval, payload hash, timestamp, and approver identity.
4. **State Transitions:** All state changes emit an audit event.

Intent states: `DRAFT -> VALIDATING -> BLOCKED_SGL | REVIEW_REQUIRED | AWAITING_HUMAN -> APPROVED -> EXECUTING -> EXECUTED | FAILED`

5. **External Side Effects:** Only Atlas may call APIs, move funds, provision accounts, publish content, or send outbound communications.

---

## Decision Memo / Approval Workflow

Decision memos are the governance mechanism for actions requiring human approval.

```
Agent proposes action
  -> DecisionMemo created (PROPOSED)
  -> Auto-approval check:
       - estimatedCostUsd < AUTO_SPEND_LIMIT_USD
       - riskTier < 2
       - confidence > CONFIDENCE_AUTO_THRESHOLD
       -> If all pass: auto-approve
       -> Otherwise: AWAITING_HUMAN
  -> Human approves/rejects via UI or email
  -> If approved: Atlas executes
  -> Outcome logged to decision_outcomes
```

Fields on a decision memo: `agent`, `title`, `rationale`, `estimatedCostUsd`, `billingType` (none/one_time/recurring), `riskTier` (0-5), `confidence` (0-1), `expectedBenefit`, `payload`.

---

## Safety Guardrails

| Guardrail | Env Var | Default | Purpose |
|-----------|---------|---------|---------|
| Auto-spend limit | `AUTO_SPEND_LIMIT_USD` | - | Max USD for auto-approval |
| Daily action cap | `MAX_ACTIONS_PER_DAY` | - | Max engine executions per day |
| Confidence threshold | `CONFIDENCE_AUTO_THRESHOLD` | - | Min confidence for auto-approval |
| Recurring purchases | - | Blocked | Recurring charges blocked by default |

---

## Per-Tenant Agent Access

Agents are gated per tenant tier:

| Model | Table | Purpose |
|-------|-------|---------|
| `TenantAgentConfig` | `tenant_agent_config` | If no row exists for tenant+agent, agent is unavailable |
| `TenantWorkflowConfig` | `tenant_workflow_config` | If no row exists, workflow is unavailable |

Tier-based defaults are seeded on tenant provisioning via `seedTenantDefaults()` in auth routes. The owner tenant bypasses these gates and gets all agents from the global registry.

Chat endpoint enforces agent access via `enforceAgentAccess()` -- Lucy, Claire, Sandy require pro/enterprise tier.

---

## Organizational Brain

Source: `backend/src/core/agent/orgMemory.ts`, `backend/src/routes/orgMemoryRoutes.ts`

Persistent organizational memory stored in `org_memories` table. Categories: preference, insight, pattern, outcome, glossary, relationship.

Features:
- Confidence scoring (0-1) with decay
- Access counting for relevance ranking
- Semantic search via Pinecone
- Stale memory pruning
- Source tracking (which agent or hook created the memory)

---

## Agent Calibration

Source: `backend/src/core/orgBrain/calibration.ts`, `backend/src/routes/calibrationRoutes.ts`

Calibration adjusts agent confidence modifiers based on outcome data:
- Tracks positive/negative/neutral/mixed outcomes per agent
- Computes positive rate and calibration modifier
- Stored in `system_state` as `org-brain:calibration:{agentId}`
- Triggered on demand via `POST /v1/calibration/refresh`
