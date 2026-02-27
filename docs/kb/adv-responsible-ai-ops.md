# Responsible AI Operations (RAIOps)

## Overview

Responsible AI Operations (RAIOps) is the discipline of designing, deploying, and governing AI systems so they remain safe, fair, transparent, and accountable throughout their entire lifecycle. In Atlas UX, where autonomous agents execute business-critical tasks — spending money, publishing content, sending communications — RAIOps is not optional. It is the structural foundation that separates a useful AI platform from a liability.

This document codifies the RAIOps framework as implemented in Atlas UX, maps it to regulatory requirements (EU AI Act), and provides operational guidance for every phase of the AI lifecycle.

---

## AI Lifecycle Phases

### 1. Design

Every agent begins with a design specification that answers three questions:

- **What problem does this agent solve?** (e.g., Binky identifies revenue opportunities)
- **What harm could this agent cause?** (e.g., Binky could recommend predatory pricing)
- **What constraints prevent that harm?** (e.g., spend limits, approval workflows, SGL policies)

Design artifacts include the agent's role definition (stored in `Agents/`), its SGL policy bindings, and an AI Impact Assessment (see below).

### 2. Develop

Development follows the principle of **minimal authority**. Agents are granted only the tools they need. Tool access is declared in the agent configuration and enforced at runtime by the engine. The `agentTools.ts` registry is the single source of truth for what any agent can invoke.

All agent behavior is governed by `policies/SGL.md` (System Governance Language) and `policies/EXECUTION_CONSTITUTION.md`. These are not suggestions — the engine loop in `workers/engineLoop.ts` enforces them on every tick.

### 3. Deploy

Deployment requires:

- All migrations applied (`npx prisma migrate deploy`)
- Environment variables validated (`backend/src/env.ts` fails fast on missing required vars)
- Audit logging confirmed operational (the `auditPlugin` must be registered)
- Safety guardrails active: `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, daily posting caps

No agent goes live without passing these checks. The engine loop itself checks `ENGINE_ENABLED` before processing any intents.

### 4. Monitor

Monitoring is continuous and multi-layered:

- **Audit log**: Every mutation is recorded in the `audit_log` table with `tenantId`, `actorType`, `actorUserId`, `level`, `action`, `entityType`, `entityId`, `message`, and `meta`. This is non-negotiable for Alpha compliance.
- **Agent Watcher** (`src/components/AgentWatcher.tsx`): Real-time UI that polls the audit log every 4 seconds, providing live visibility into agent activity at `/app/watcher`.
- **Job queue metrics**: Job statuses (queued, running, completed, failed) are tracked in the `jobs` table. Failed jobs include error metadata for post-mortem analysis.
- **Engine tick telemetry**: Each engine loop tick logs its duration, intents processed, and any errors encountered.

### 5. Improve

Improvement is driven by data from the monitoring phase:

- Failed jobs trigger review of the agent's tool invocations and prompt engineering
- Audit log analysis reveals patterns (e.g., an agent repeatedly hitting rate limits suggests a workflow redesign)
- Decision memo rejection rates indicate where agent judgment diverges from human expectations
- Model provider performance (latency, cost, quality) is tracked across OpenAI, DeepSeek, OpenRouter, and Cerebras via `backend/src/ai.ts`

### 6. Retire

Agent retirement follows a controlled deprecation:

1. Disable the agent's scheduled workflows in the workflow registry
2. Set the agent's status to `inactive` in the database
3. Allow in-flight jobs to complete (do not force-kill)
4. Archive the agent's audit log entries
5. Remove environment variables (email accounts, API keys) from Render services
6. Document the retirement rationale in the agent's model card

---

## AI Impact Assessments

Before any agent is deployed or materially updated, an AI Impact Assessment (AIA) must be completed. The AIA answers:

| Question | Example (Binky — CRO) |
|---|---|
| What decisions does this agent make? | Revenue strategy recommendations, pricing suggestions |
| Who is affected by those decisions? | Customers, sales team, finance |
| What data does the agent access? | Revenue metrics, customer segments, market data |
| What could go wrong? | Recommends predatory pricing, overspends ad budget |
| What safeguards exist? | Spend limits, decision memos for risk tier >= 2, CFO (Tina) review |
| How is performance measured? | Revenue impact, recommendation acceptance rate, error rate |
| What is the rollback plan? | Disable agent, revert to manual workflow |

AIAs are stored alongside agent configurations in the `Agents/` directory and reviewed quarterly by the AI Governance Committee.

---

## Human-in-the-Loop: Decision Memos

The decision memo system is the primary human-in-the-loop mechanism. It is triggered automatically when:

- **Spend exceeds `AUTO_SPEND_LIMIT_USD`** (configured per environment)
- **Risk tier >= 2** (as assessed by the engine's risk scoring)
- **Recurring charges** are involved (blocked by default in Alpha)
- **Content publication** to external platforms (social media, blog)

Decision memos are stored in the `decision_memos` table with foreign keys to the originating `job_id` and `intent_id` (added in migration `20260226200000`). This creates a complete audit chain from intent to approval to execution.

The approval workflow:

1. Agent identifies an action requiring approval
2. Engine creates a `decision_memo` with status `pending`
3. Human reviewer (or designated approver agent like Atlas/Larry) reviews the memo
4. Memo is updated to `approved` or `rejected`
5. If approved, the engine resumes execution on the next tick
6. If rejected, the intent is marked as `cancelled` with the rejection reason

---

## Algorithmic Auditing

Algorithmic auditing goes beyond logging — it is the systematic examination of agent behavior for bias, drift, and unintended consequences.

### Audit Dimensions

- **Fairness**: Are agent actions consistent across different tenant profiles? Does the content agent produce different quality output for different topics?
- **Accuracy**: How often do agent recommendations lead to successful outcomes? Track via job completion rates and decision memo approval rates.
- **Consistency**: Given similar inputs, does the agent produce similar outputs? Monitor via the audit log's `meta` field, which captures input/output pairs.
- **Drift**: Are agent behaviors changing over time due to model updates from providers? Compare action distributions month-over-month.

### Audit Schedule

- **Weekly**: Review failed jobs and rejected decision memos
- **Monthly**: Analyze agent action distributions for anomalies
- **Quarterly**: Full algorithmic audit with AI Governance Committee review

---

## Model Cards

Every Atlas UX agent has a model card documenting its operational profile:

```yaml
agent: binky
role: Chief Revenue Officer (CRO)
reportsTo: atlas
model_providers: [openai, deepseek]
capabilities:
  - Revenue opportunity identification
  - Pricing strategy recommendations
  - Market analysis synthesis
limitations:
  - Cannot access real-time market data (relies on ingested KB docs)
  - Recommendations require human approval above spend threshold
  - No direct access to payment processing
known_biases:
  - May over-index on short-term revenue metrics
  - Training data skews toward SaaS pricing models
risk_tier: 2
tools: [search_kb, create_decision_memo, send_telegram_message]
data_access: [revenue_metrics, market_data, kb_documents]
safety_controls:
  - AUTO_SPEND_LIMIT_USD enforcement
  - Decision memo required for all spend recommendations
  - Daily action cap via MAX_ACTIONS_PER_DAY
last_reviewed: 2026-02-27
```

Model cards are living documents. They are updated whenever an agent's capabilities, tools, or constraints change.

---

## Datasheets for Datasets

The knowledge base (`kb_documents` table) is the primary dataset consumed by agents. Each document has metadata:

- `createdBy`: Who authored or ingested the document (required field)
- `status`: `draft | published | archived` — only `published` documents are served to agents
- `tenant_id`: Ensures strict data isolation between tenants
- Ingestion scripts: `kb:ingest-agents` and `kb:chunk-docs` in `backend/package.json`

The `seedAiKb.ts` script provisions 200+ baseline AI/tech knowledge base documents. These are versioned and auditable.

---

## Incident Response for AI Failures

When an agent causes harm or behaves unexpectedly:

1. **Contain**: Disable the agent immediately (set `ENGINE_ENABLED=false` if systemic, or deactivate the specific agent)
2. **Assess**: Query the audit log for the agent's recent actions. Identify the scope of impact.
3. **Notify**: Alert affected stakeholders via Telegram (`telegramNotify.ts`) or Teams
4. **Remediate**: Reverse any harmful actions where possible (e.g., unpublish content, void pending transactions)
5. **Investigate**: Trace the causal chain from intent through decision memo (if any) to execution
6. **Fix**: Update agent configuration, SGL policies, or tool permissions as needed
7. **Document**: Create an incident report and update the agent's model card
8. **Prevent**: Add new safety guardrails or test cases to prevent recurrence

---

## AI Governance Committee

The AI Governance Committee comprises three agents with oversight authority:

| Agent | Role | Governance Function |
|---|---|---|
| **Atlas** | CEO | Final authority on agent deployment and retirement decisions |
| **Larry** | Governor | Reviews decision memos, monitors compliance with SGL policies |
| **Jenny** | CLO (Chief Legal Officer) | Evaluates legal risk, regulatory compliance, IP implications |

The committee reviews AIAs, algorithmic audit results, and incident reports. Their decisions are logged in the audit trail with `actorType: 'agent'`.

---

## EU AI Act Risk Mapping

Atlas UX agents are classified under the EU AI Act risk framework:

| Risk Level | Atlas UX Agents | Requirements |
|---|---|---|
| **Unacceptable** | None | N/A — no agents perform prohibited practices |
| **High** | Tina (CFO), Binky (CRO), Mercer (Acquisition) | Full AIA, human oversight, logging, accuracy monitoring |
| **Limited** | Social publishers (Kelly, Fran, Dwight, etc.) | Transparency obligations — content labeled as AI-generated |
| **Minimal** | Sunday (comms), Archy (research), Daily-Intel | No specific obligations, but Atlas UX applies baseline controls anyway |

All agents, regardless of risk level, are subject to audit logging and decision memo workflows. This exceeds EU AI Act requirements for minimal-risk systems but aligns with the platform's safety-first philosophy.

---

## Responsible Scaling

As Atlas UX scales — more tenants, more agents, more actions per day — RAIOps scales with it:

- **Per-tenant isolation**: The `tenant_id` FK on every table ensures one tenant's agent behavior cannot affect another
- **Rate limiting**: Per-tenant and per-user rate limits on all `/v1` routes prevent runaway agents from monopolizing resources
- **Action caps**: `MAX_ACTIONS_PER_DAY` is a hard ceiling, not a soft target
- **Job queue safety**: `FOR UPDATE SKIP LOCKED` (engine) and optimistic locking (workers) prevent double-execution even under high concurrency
- **Provider diversity**: `backend/src/ai.ts` supports multiple AI providers (OpenAI, DeepSeek, OpenRouter, Cerebras), reducing single-provider dependency and enabling cost/quality optimization as scale increases
- **Workflow scheduling**: The scheduler worker (`srv-d6fk5utm5p6s73bqrohg`) staggers agent workflows (e.g., platform intel sweep across WF-093 to WF-105 runs from 05:00 to 05:36 UTC) to avoid thundering herd problems

Responsible scaling means that adding capacity never bypasses safety controls. Every new agent, tenant, or workflow inherits the full RAIOps framework by default.

---

## References

- `policies/SGL.md` — System Governance Language specification
- `policies/EXECUTION_CONSTITUTION.md` — Execution constraints
- `Agents/` — Agent configurations and role definitions
- `backend/src/workers/engineLoop.ts` — Engine loop with safety enforcement
- `backend/src/plugins/auditPlugin.ts` — Audit trail implementation
- `src/components/AgentWatcher.tsx` — Live agent monitoring UI
