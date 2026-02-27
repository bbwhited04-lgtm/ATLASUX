# Agent Deployment — Production Operations Guide

> Atlas UX Knowledge Base — Advanced Architecture
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Why Agent Deployment Is Different

Deploying an AI agent system to production is fundamentally different from deploying
a traditional web application or even a standard ML model serving endpoint. The
differences compound into a set of challenges that require purpose-built architecture.

**Key differences from traditional software:**

- **Non-deterministic behavior.** The same input may produce different outputs. You
  cannot write exact integration tests. You must build probabilistic monitoring.
- **Long-running workloads.** A single agent task may involve multiple LLM calls,
  tool invocations, reflection loops, and inter-agent handoffs — taking minutes or
  hours, not milliseconds.
- **Stateful sessions.** Agents accumulate context across steps within a task. If the
  process crashes mid-task, recovery requires reconstructing that state.
- **Unpredictable execution times.** One task completes in 3 seconds, the next takes
  90 seconds because it triggered a reflection loop or hit a rate limit. Autoscaling
  and timeout policies must account for this variance.
- **Unpredictable costs.** Token consumption varies wildly between tasks. A simple
  classification costs $0.001; a multi-agent research workflow costs $2.00. Cost
  monitoring per-task (not just aggregate) is essential.
- **External dependency chains.** Agents depend on LLM providers, search APIs, social
  platform APIs, email services, and databases. Each dependency is a failure point.
- **Safety criticality.** Unlike a website where a bug shows the wrong color, an agent
  bug sends the wrong email, posts incorrect content, or approves unauthorized spend.
  The blast radius of failures is larger.

---

## 2. Architecture Patterns for Agent Systems

### 2.1 Separate the API Server from the Engine Loop

This is the most important architectural decision. The API server handles synchronous
HTTP requests (user actions, dashboard data, webhook receipts). The engine loop handles
asynchronous agent work (job processing, LLM calls, tool execution).

**Why separation matters:**

- **Different scaling profiles.** The API server scales horizontally based on request
  volume. The engine loop scales based on job queue depth.
- **Different failure domains.** A crash in the engine loop should not take down the
  API. Users should still be able to view the dashboard even if agent processing is
  paused.
- **Different resource requirements.** The API server needs low latency and moderate
  memory. The engine loop needs high CPU/memory for LLM context building and can
  tolerate higher latency.
- **Different deployment cadences.** You might update agent prompts (engine loop)
  without touching the API, or add a new dashboard endpoint (API) without affecting
  agent behavior.

### 2.2 Worker Processes

Beyond the main engine loop, production agent systems need additional worker processes
for specialized tasks:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   API Server    │  │  Engine Worker   │  │  Email Worker    │  │   Scheduler     │
│ (Fastify HTTP)  │  │ (engineLoop.ts)  │  │(emailSender.ts) │  │ (cron triggers) │
│                 │  │                  │  │                  │  │                 │
│ Handles:        │  │ Handles:         │  │ Handles:         │  │ Handles:        │
│ - REST endpoints│  │ - Agent reasoning│  │ - Email delivery │  │ - Timed WF      │
│ - Auth/tenant   │  │ - Tool execution │  │ - MS Graph calls │  │   triggering    │
│ - Dashboard data│  │ - Job orchestrat.│  │ - Retry logic    │  │ - Daily sweeps  │
│ - Webhooks      │  │ - DecisionMemos  │  │ - Bounce handling│  │ - Calibration   │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                      │
                              ┌───────┴───────┐
                              │  PostgreSQL    │
                              │  (jobs table)  │
                              │  (audit_log)   │
                              └───────────────┘
```

Each worker is an independent process that can be scaled, deployed, and restarted
independently. They communicate exclusively through the database (jobs table).

### 2.3 Job Queue as the Coordination Layer

The database-backed job queue is the central nervous system. All inter-process
communication flows through it:

- API creates jobs (user triggers a workflow, schedules a task).
- Engine loop claims and processes jobs (agent reasoning, tool calls).
- Email worker claims and processes email delivery jobs.
- Scheduler creates jobs on a timed schedule (daily workflows).
- All workers update job status (queued, running, completed, failed).

**Concurrency safety:**

```sql
-- Engine loop uses pessimistic locking
SELECT * FROM jobs WHERE status = 'queued' FOR UPDATE SKIP LOCKED LIMIT 1;

-- Other workers use optimistic locking
UPDATE jobs SET status = 'running'
WHERE id = $1 AND status = 'queued'
RETURNING *;
-- If count = 0, another worker claimed it. Skip.
```

This prevents double-processing without requiring distributed locks, message
brokers, or external coordination services.

---

## 3. Managed Platforms vs Self-Hosted

### 3.1 The Trade-Off Spectrum

| Factor | Managed (Render, Railway, Fly.io) | Self-Hosted (EC2, GCE, VPS) |
|--------|-----------------------------------|----------------------------|
| Ops burden | Near-zero (auto TLS, CI/CD, health checks) | Full ownership (patching, monitoring, backup) |
| Control | Limited (vendor runtime, networking) | Complete (OS, networking, scheduling) |
| Cost | Premium per unit; efficient at small scale | Lower per unit at scale; higher fixed cost |
| Deploy speed | Push-to-deploy in minutes | Custom pipeline required |
| Cold starts | Possible on scale-to-zero plans | None (always-on) |

**Hybrid approach:** Many production systems use managed for the API server
(benefits from auto-scaling and edge networking) and self-hosted for the engine
loop (benefits from persistent processes and full resource control).

### 3.4 Atlas UX's Choice

Atlas UX uses Render as a managed platform for all four services:

| Service | Render ID | Type | Notes |
|---------|-----------|------|-------|
| API (web) | srv-d62bnoq4d50c738b4e6g | Web Service | Fastify HTTP server |
| Engine Worker | srv-d6eoojkr85hc73frr5rg | Background Worker | engineLoop.ts |
| Email Worker | srv-d6eoq07gi27c73ae4ing | Background Worker | emailSender.ts |
| Scheduler | srv-d6fk5tm5p6s73bqrohg | Background Worker | Cron job triggers |

Database is hosted on Supabase (managed PostgreSQL with connection pooling via
Pgbouncer). Frontend is on Vercel (static SPA deployment with edge CDN).

This gives Atlas UX the benefits of managed infrastructure while maintaining
service isolation. Each service can be restarted, scaled, or redeployed
independently.

---

## 4. Scaling Considerations

### 4.1 Horizontal Scaling of Workers

The engine loop is designed for horizontal scaling. Multiple engine worker
instances can run simultaneously because `FOR UPDATE SKIP LOCKED` ensures each
job is claimed by exactly one worker.

**Scaling triggers:**
- Job queue depth exceeding a threshold (e.g., > 50 queued jobs).
- Average job processing time exceeding target (e.g., > 30 seconds).
- Specific high-priority workflows needing faster throughput.

**Scaling limits:**
- Database connection pool size (each worker holds 1-2 connections).
- LLM API rate limits (more workers means more concurrent API calls).
- Cost (each worker instance costs money regardless of utilization).

### 4.2 Rate Limiting

Agent systems hit rate limits on two sides:

**Inbound rate limits (protecting our API):**
```typescript
// Per-route rate limiting in Fastify
{ config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }
```

**Outbound rate limits (from LLM and service providers):**
- OpenAI: Tokens per minute (TPM) and requests per minute (RPM).
- Microsoft Graph: 10,000 requests per 10 minutes per application.
- Social platform APIs: Platform-specific, often strict and opaque.

**Rate limit handling strategies:**
1. **Backoff and retry:** Exponential backoff with jitter on 429 responses.
2. **Token bucket:** Pre-compute token usage before making API calls. If the
   bucket is empty, queue the job for later processing.
3. **Priority queuing:** When rate-limited, process high-priority jobs first.
4. **Provider rotation:** Route requests across multiple API keys or providers
   to distribute load.

### 4.3 API Quota Management

Atlas UX uses multiple AI providers (`ai.ts`: OpenAI, DeepSeek, OpenRouter,
Cerebras). When a provider is rate-limited or unavailable, the engine
automatically falls back to the next provider in priority order, providing
resilience without manual intervention.

### 4.4 Database Scaling

The jobs table is the hottest table. Scaling strategies: connection pooling
(Supabase Pgbouncer), index optimization on `(status, created_at)` and
`(tenant_id, status)`, partition by status (archive old completed/failed jobs),
and read replicas for dashboard queries while workers use the primary.

---

## 5. Monitoring and Observability

### 5.1 What to Monitor

**Process health:**
- Is each worker process running? (health check endpoint)
- Is the engine loop ticking on schedule? (tick timestamp freshness)
- Are worker processes consuming excessive memory? (memory usage trend)
- Are processes restarting unexpectedly? (restart count)

**Queue health:**
- Current queue depth by job type.
- Oldest queued job age (indicates processing backlog).
- Job processing rate (jobs/minute).
- Failed job rate and failure categories.

**Agent performance:**
- Per-agent quality scores (from self-evaluation, see Agent Evaluation KB).
- Per-agent latency (time from job queued to job completed).
- Per-agent token consumption and cost.
- Per-agent error rate.

**External dependency health:**
- LLM provider response times and error rates.
- Microsoft Graph API availability.
- Social platform API availability.
- Database query latency.

### 5.2 Tracing Agent Decisions

Every agent decision must be traceable from trigger to outcome. The audit trail
captures the full lifecycle: trigger event, job creation, engine claim, context
assembly (docs retrieved, token count), LLM call (provider, tokens in/out), tool
calls (parameters, results, latency), self-evaluation scores, and job completion.

This enables post-hoc analysis of any agent action — critical for debugging and
governance compliance.

### 5.3 Logging Tool Calls

Every tool call is logged with jobId, agentId, tool name, parameters, result,
latency, and timestamp. This feeds into tool usage evaluations (Agent Evaluation
KB), cost tracking, rate limit monitoring, and debugging.

### 5.4 Performance Metrics Dashboard

The Agent Watcher (`AgentWatcher.tsx`) polls the audit log every 4 seconds,
exposing live feed, queue status by job type, per-agent scoreboard (QS, latency,
throughput), cost tracker (tokens by agent/provider), and active alerts.

---

## 6. The Atlas UX Deployment Model

### 6.1 Architecture Summary

```
                    ┌─────────────┐
                    │   Vercel    │
                    │  (Frontend) │
                    │  React SPA  │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────┴──────┐
                    │   Render    │
                    │  (API Web)  │
                    │  Fastify 5  │
                    └──────┬──────┘
                           │ DB connection
              ┌────────────┼────────────┐
              │            │            │
     ┌────────┴────┐ ┌────┴─────┐ ┌────┴──────┐
     │   Render    │ │  Render  │ │  Render   │
     │  (Engine)   │ │ (Email)  │ │(Scheduler)│
     │ engineLoop  │ │emailSend │ │  cron WFs │
     └──────┬──────┘ └────┬─────┘ └────┬──────┘
            │              │            │
            └──────────────┼────────────┘
                           │
                    ┌──────┴──────┐
                    │  Supabase   │
                    │ PostgreSQL  │
                    │ + Pgbouncer │
                    │ + Storage   │
                    └─────────────┘
```

### 6.2 Environment Configuration

All four Render services share environment variables pushed via Render API:

| Group | Key Variables |
|-------|--------------|
| Database | `DATABASE_URL` (Pgbouncer), `DIRECT_URL` (direct for migrations) |
| AI Providers | `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, fallback in `ai.ts` |
| Engine Control | `ENGINE_ENABLED`, `ENGINE_TICK_INTERVAL_MS` (default 5000ms) |
| Safety | `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, `CONFIDENCE_AUTO_THRESHOLD` |
| External Services | `MS_TENANT_ID/CLIENT_ID/CLIENT_SECRET`, `BOTFATHERTOKEN` |

### 6.3 Deployment Pipeline

```
Developer pushes to main branch
  → Render detects push (GitHub webhook)
  → Render builds: npm install && npm run build (tsc → ./dist)
  → Render deploys new version to each service
  → Health checks verify the new version is running
  → Old version is replaced (zero-downtime for web service)
```

For database changes:
```
Developer creates Prisma migration
  → Push migration files to repository
  → SSH to Render or run via deploy script: npx prisma migrate deploy
  → Migration applies to Supabase PostgreSQL
```

---

## 7. Safety in Production

### 7.1 Kill Switches

Atlas UX implements multiple kill switches at different granularities:

**Global kill switch:** `ENGINE_ENABLED=false` stops all agent processing. The
engine loop continues ticking but skips all job processing. The API and dashboard
remain operational so humans can observe and manage.

**Per-agent kill switch:** Individual agents can be suspended via their
configuration record. Suspended agents' jobs remain queued but are not claimed.

**Per-workflow kill switch:** Specific workflows can be disabled without
affecting other agent operations.

**Emergency stop procedure:**
1. Set `ENGINE_ENABLED=false` on all Render services.
2. Verify engine loop has stopped processing (check audit log for activity).
3. Investigate the issue.
4. If needed, manually fail or requeue specific jobs.
5. Fix the issue, re-enable engine.

### 7.2 Spend Limits

Financial safety is enforced at multiple layers:

**Per-action limit:** `AUTO_SPEND_LIMIT_USD` (environment variable). Any single
action that costs more than this limit requires a DecisionMemo with human approval.

**Daily aggregate limit:** Total spend across all agents for the day. When the
limit is reached, all spend-related actions are blocked until the next day or
until a human raises the limit.

**Per-agent limit:** Individual agents can have their own spend caps set below
the global limit, appropriate to their role and typical task cost.

**Recurring charge protection:** Recurring purchases are blocked by default per
Alpha safety constraints. Any recurring charge requires explicit human approval
regardless of amount.

### 7.3 Daily Action Caps

`MAX_ACTIONS_PER_DAY` limits the total number of agent actions (tool calls that
have external side effects). This prevents runaway agents from flooding platforms,
sending excessive emails, or creating unbounded costs.

**Cap enforcement:**
```typescript
const todayCount = await countActionsToday(tenantId);
if (todayCount >= MAX_ACTIONS_PER_DAY) {
  await createAlert({
    type: 'ACTION_CAP_REACHED',
    message: `Daily action cap (${MAX_ACTIONS_PER_DAY}) reached. Agent actions paused.`
  });
  return; // Do not execute the action
}
```

**Per-platform sub-caps:** Social platforms often have their own posting limits.
Atlas UX enforces per-platform sub-caps to prevent any single platform from
consuming the entire daily budget.

### 7.4 Approval Workflows

The DecisionMemo system gates high-risk actions behind human approval:

**Triggers for requiring approval:**
- Spend above `AUTO_SPEND_LIMIT_USD`
- Risk tier >= 2 (as assessed by the agent or its department head)
- Actions affecting > 100 users or contacts
- First-time actions (agent has never performed this specific action type before)
- Agent confidence below `CONFIDENCE_AUTO_THRESHOLD`

**Approval flow:**
```
Agent identifies high-risk action
  → Creates DecisionMemo with recommendation, reasoning, risk assessment
  → DecisionMemo quality is evaluated (see Agent Evaluation KB)
  → Human reviewer receives notification (Telegram, email)
  → Human approves, rejects, or requests revision
  → If approved, agent proceeds with action
  → If rejected, agent is notified and must find an alternative
  → Full audit trail recorded
```

### 7.5 Audit Trail as Safety Net

Every mutation is recorded in the `audit_log` table with tenantId, actorType,
level, action, entityType, entityId, message, structured meta (tool calls,
quality scores), and timestamp. This enables post-incident analysis, pattern
detection across agents, compliance reporting, and recovery planning.

### 7.6 Graceful Degradation

When external services fail, agents should degrade gracefully rather than crash:

| Failure | Degradation Behavior |
|---------|---------------------|
| LLM provider down | Failover to next provider in priority list |
| Microsoft Graph 429 | Queue email for retry with exponential backoff |
| Social API error | Mark job as failed, alert operator, do not retry blindly |
| Database unavailable | Engine loop pauses, API returns 503, no data loss |
| Supabase storage down | File operations fail gracefully, KB reads from cache |

The key principle: **no silent failures.** Every failure is logged, every degraded
state is visible on the dashboard, and every automated recovery action is auditable.

---

## 8. Operational Runbooks

### 8.1 Deploying a Prompt Change

1. Write the new prompt/system instruction.
2. Run regression tests against the agent's test suite (see Agent Evaluation KB).
3. If tests pass, commit and push to main.
4. Render auto-deploys. Engine worker restarts with new prompts.
5. Monitor the agent's quality scores for 24 hours.
6. If scores degrade, revert the commit and redeploy.

### 8.2 Adding a New Agent

1. Define SKILL.md and POLICY.md for the agent.
2. Add the agent to the roster configuration.
3. Create tool definitions for the agent's required tools.
4. Write 3-5 few-shot examples and store in KB.
5. Create a regression test suite (20+ test cases).
6. Run baseline evaluation and establish quality thresholds.
7. Deploy with the agent in "supervised mode" (all actions require approval).
8. After 50 successful supervised actions, transition to autonomous mode.

### 8.3 Handling a Runaway Agent

1. Identify the agent from the alert (action cap hit, unusual activity pattern).
2. Suspend the specific agent (per-agent kill switch).
3. Review recent audit log entries for the agent.
4. Identify the root cause (prompt issue, bad context, tool malfunction).
5. Fix the issue.
6. Clear any queued jobs that were generated by the runaway behavior.
7. Re-enable the agent in supervised mode.
8. After verification, return to autonomous mode.

### 8.4 Recovering from a Bad Action

1. Identify the bad action from the audit trail.
2. Assess the impact (was content published? was money spent? was an email sent?).
3. Take corrective action (delete the post, reverse the charge, send correction).
4. Log the correction as a new audit entry linked to the original.
5. Root-cause analysis: why did the agent take this action?
6. Implement the fix (prompt change, additional guardrail, tighter threshold).
7. Add the scenario to the agent's regression test suite.

---

## 9. Pre-Launch Checklist

Before deploying an agent system to production, verify:

- [ ] All four services are running and passing health checks.
- [ ] `ENGINE_ENABLED` is set to `false` until deliberate activation.
- [ ] `AUTO_SPEND_LIMIT_USD` is set to a conservative value.
- [ ] `MAX_ACTIONS_PER_DAY` is set to a conservative value.
- [ ] `CONFIDENCE_AUTO_THRESHOLD` is set to a conservative value (e.g., 0.9).
- [ ] All agents have baseline evaluation scores recorded.
- [ ] Audit trail logging is confirmed working (create a test entry and verify).
- [ ] Kill switches are tested (disable and re-enable engine).
- [ ] Alerting is configured (Telegram notifications for critical events).
- [ ] Database backups are configured and tested.
- [ ] Rate limit configuration is in place for all API endpoints.
- [ ] Monitoring dashboards are live and showing real data.
- [ ] Runbooks are documented and accessible to all operators.
- [ ] At least one human reviewer is designated and available for DecisionMemo approvals.

---

## 10. The Seven-Day Stability Test

Atlas UX's Alpha launch follows a seven-day stability test protocol:

| Days | Mode | Scope |
|------|------|-------|
| 1-2 | Supervised | All actions require human approval |
| 3-4 | Semi-autonomous | Low-risk auto, high-risk (spend, publish, email) needs approval |
| 5-6 | Full autonomous, tight thresholds | Confidence >= 0.90, action cap at 50% target |
| 7 | Production | Thresholds relaxed to target values, full action caps |

**Pass criteria:** Zero critical incidents, QS above baseline for all roles,
confidence calibration within 10%, no runaway episodes, >90% DecisionMemo
first-submission approval rate, no unplanned downtime.
