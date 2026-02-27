# DevOps & Infrastructure Automation

## Overview

Atlas UX runs as a distributed system with 4 Render services, a Supabase PostgreSQL database, Vercel-hosted frontend, and multiple AI provider integrations. This document covers DevOps principles and practices — CI/CD, infrastructure as code, deployment strategies, monitoring, incident management, and reliability engineering — with specific mappings to the Atlas UX production environment.

---

## CI/CD Pipeline Design

### Pipeline Stages

A production-grade CI/CD pipeline proceeds through these stages in order. Failure at any stage halts the pipeline.

```
┌───────┐   ┌──────┐   ┌──────┐   ┌────────┐   ┌───────┐   ┌─────────┐
│ Build │──▶│ Test │──▶│ Scan │──▶│ Deploy │──▶│ Smoke │──▶│ Monitor │
└───────┘   └──────┘   └──────┘   └────────┘   └───────┘   └─────────┘
```

**Stage 1: Build**
- Compile TypeScript (`tsc --noEmit` for type checking, then `tsc` for output)
- Bundle frontend (`npm run build` via Vite)
- Verify all dependencies resolve (`npm ci`)
- Generate Prisma client (`npx prisma generate`)
- Artifact: compiled backend in `backend/dist/`, frontend in `dist/`

**Stage 2: Test**
- Unit tests: isolated function testing, mocked dependencies
- Integration tests: database queries against test database, API route testing with supertest
- End-to-end: critical user flows (login, create job, approve decision)
- Coverage threshold: 80% line coverage on new code, 60% overall

**Stage 3: Scan**
- Dependency vulnerabilities: `npm audit --audit-level=high`
- Static analysis: ESLint with security rules
- Secret scanning: detect accidentally committed credentials
- License compliance: verify all dependencies have compatible licenses

**Stage 4: Deploy**
- Database migration: `npx prisma migrate deploy` (run before code deploy)
- Backend services: rolling deploy on Render (all 4 services)
- Frontend: Vercel auto-deploys on push to main
- Configuration: verify environment variables are current

**Stage 5: Smoke Tests**
- Health check endpoints respond with 200
- Authentication flow succeeds
- Database connectivity confirmed
- At least one AI provider responds
- Engine loop ticks successfully

**Stage 6: Monitor**
- Watch error rates for 15 minutes post-deploy
- Compare latency P95 against pre-deploy baseline
- Verify no new error patterns in logs
- Auto-rollback if error rate exceeds threshold

### Atlas UX Pipeline Configuration

```yaml
# render.yaml (simplified)
services:
  - type: web
    name: atlasux-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /v1/health

  - type: worker
    name: atlasux-engine
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run worker:engine

  - type: worker
    name: atlasux-email
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run worker:email

  - type: worker
    name: atlasux-scheduler
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run worker:scheduler
```

---

## Infrastructure as Code (IaC) Principles

### Core Tenets

1. **Declarative over imperative**: Describe the desired state, not the steps to get there. The tooling determines the delta and applies it.

2. **Version controlled**: All infrastructure configuration lives in the repository alongside application code. Changes are reviewed via PRs.

3. **Idempotent**: Applying the same configuration multiple times produces the same result. No drift between intended and actual state.

4. **Immutable infrastructure**: Instead of modifying running servers, deploy new instances with the updated configuration and terminate the old ones.

5. **Environment parity**: Dev, staging, and production use the same configuration templates with environment-specific variables.

### Atlas UX IaC

- **Render**: `render.yaml` defines all 4 services, their build/start commands, and scaling parameters
- **Supabase**: Database schema managed by Prisma migrations (version controlled in `backend/prisma/migrations/`)
- **Vercel**: Configuration in `vercel.json` for build settings, routes, and headers
- **Environment variables**: Managed via Render dashboard and pushed programmatically via API (PUT `/v1/services/{id}/env-vars`)

### Environment Variable Management

```
CRITICAL RULE: Environment variable pushes to Render REPLACE ALL existing vars.

Process:
1. Fetch current vars: GET /v1/services/{serviceId}/env-vars
2. Merge new/updated vars into the existing set
3. Deduplicate (last write wins for duplicate keys)
4. Push to ALL 4 services (web, engine, email, scheduler)
5. Verify each service restarts successfully
```

---

## Deployment Strategies

### Rolling Deploy (Current — Render Default)

New instances start alongside old ones. Traffic gradually shifts as health checks pass. Old instances terminate after drain period.

- **Pros**: Zero downtime, simple configuration, automatic rollback on health check failure
- **Cons**: Brief period where old and new code run simultaneously (must handle schema compatibility)

### Blue-Green Deployment

Maintain two identical environments. Deploy to the inactive environment, verify, then switch traffic.

```
┌──────────┐     ┌──────────────┐
│  Router  │────▶│ Blue (v1.2)  │ ← currently serving
│  (LB)   │     │ Green (v1.3) │ ← deploying here
└──────────┘     └──────────────┘

After verification:
┌──────────┐     ┌──────────────┐
│  Router  │────▶│ Green (v1.3) │ ← now serving
│  (LB)   │     │ Blue (v1.2)  │ ← standby for rollback
└──────────┘     └──────────────┘
```

- **Pros**: Instant rollback (switch back to blue), full testing on production-like environment
- **Cons**: Double infrastructure cost during deployment, database migrations must be backward-compatible

### Canary Deployment

Route a small percentage of traffic (1-5%) to the new version. Monitor error rates and latency. Gradually increase traffic if metrics are healthy.

```
v1.2 (95% traffic) ──┐
                      ├── Users
v1.3 (5% traffic)  ──┘

Healthy after 30 min → v1.3 (25%) → v1.3 (50%) → v1.3 (100%)
Unhealthy → rollback v1.3, 100% returns to v1.2
```

- **Pros**: Limits blast radius of bad deploys, real production traffic validation
- **Cons**: Requires traffic splitting capability, more complex monitoring

### Database Migration Safety

Regardless of deployment strategy, database migrations must follow the expand-contract pattern:

1. **Expand**: Add new columns/tables (backward-compatible with old code)
2. **Deploy**: Roll out new code that writes to both old and new schema
3. **Migrate**: Backfill data from old schema to new schema
4. **Contract**: Remove old columns/tables after all code uses new schema

This ensures zero-downtime migrations even with rolling deploys.

---

## Feature Flags

### Implementation

```typescript
interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  allowedTenants: string[]; // Empty = all tenants
  metadata: Record<string, any>;
}

function isFeatureEnabled(flag: FeatureFlag, tenantId: string): boolean {
  if (!flag.enabled) return false;
  if (flag.allowedTenants.length > 0 && !flag.allowedTenants.includes(tenantId)) return false;
  if (flag.rolloutPercentage < 100) {
    const hash = deterministicHash(tenantId + flag.key);
    return (hash % 100) < flag.rolloutPercentage;
  }
  return true;
}
```

### Use Cases in Atlas UX

- **New agent capabilities**: Roll out Mercer's acquisition workflow to 10% of tenants before full launch
- **AI model routing**: A/B test DeepSeek vs OpenAI for specific task types
- **UI features**: Enable new dashboard components for beta tenants
- **Safety controls**: Quickly disable autonomous actions across all tenants if issues detected

### Flag Lifecycle

```
Created → Testing (internal only) → Canary (5% tenants) → Rollout (25% → 50% → 100%) → Permanent → Cleanup (remove flag code)
```

Flags that have been at 100% for >30 days should be cleaned up. Dead flag code is technical debt.

---

## Monitoring — The Three Pillars

### Metrics

Numerical measurements over time. Used for dashboards, alerting, and trend analysis.

**Key Atlas UX Metrics:**
```
# Application metrics
api_request_duration_seconds{route, method, status}
api_request_total{route, method, status}
engine_tick_duration_seconds
engine_intents_processed_total{agent, status}
jobs_queued_total{type}
jobs_completed_total{type, result}

# Business metrics
decisions_created_total{risk_tier}
decisions_approved_total
decisions_rejected_total
ai_tokens_used_total{model, agent}
ai_inference_cost_usd{model, agent}

# Infrastructure metrics
node_memory_heap_bytes
db_connection_pool_active
db_connection_pool_idle
db_query_duration_seconds{table, operation}
```

### Logs

Structured event records. Used for debugging, auditing, and post-incident analysis.

**Log Format:**
```json
{
  "timestamp": "2026-02-27T14:30:00.000Z",
  "level": "info",
  "service": "atlasux-api",
  "requestId": "req-abc123",
  "tenantId": "tenant-xyz",
  "message": "Job created",
  "meta": {
    "jobId": "job-456",
    "jobType": "EMAIL_SEND",
    "queueDepth": 12
  }
}
```

**Log Levels:**
- `error`: Something failed that should not have. Requires attention.
- `warn`: Something unexpected happened but was handled. Review if recurring.
- `info`: Normal operations worth recording. Business events, state transitions.
- `debug`: Detailed debugging information. Disabled in production by default.

**Never log:**
- Passwords, tokens, API keys, secrets
- Full credit card numbers or SSNs
- Request/response bodies containing PII (log sanitized versions)

### Traces

Distributed request traces that follow a single operation across services.

```
Request: POST /v1/jobs
├── [api] Route handler (2ms)
├── [api] Auth plugin (5ms)
├── [api] Tenant plugin (1ms)
├── [api] Prisma: job.create (15ms)
├── [api] Audit log write (8ms)
└── [api] Response serialization (1ms)
Total: 32ms

Later, engine picks up:
├── [engine] Job claim (3ms)
├── [engine] AI inference (1200ms)
│   └── [openai] GPT-4o completion (1150ms)
├── [engine] Result processing (5ms)
├── [engine] Job completion (4ms)
└── [engine] Audit log write (6ms)
Total: 1218ms
```

Traces are correlated by `requestId` or `jobId` across services.

---

## Alerting Strategy

### Alert Severity Levels

| Level | Response Time | Example | Action |
|---|---|---|---|
| P1 Critical | < 15 minutes | Service down, data breach, all agents stopped | Page on-call, all hands |
| P2 High | < 1 hour | Error rate > 5%, engine loop stalled | Page on-call |
| P3 Medium | < 4 hours | Elevated latency, queue depth growing | Notify team channel |
| P4 Low | Next business day | Disk usage trending up, certificate expiring in 14 days | Create ticket |

### Alert Design Principles

1. **Actionable**: Every alert must have a documented response procedure. If no action is needed, it is not an alert — it is a metric.
2. **De-duplicated**: Group related alerts. 100 instances of the same error = 1 alert, not 100.
3. **Contextualized**: Include relevant data in the alert (error message, affected tenant, time range, link to dashboard).
4. **Threshold-based with hysteresis**: Alert when metric crosses threshold. Do not clear until it returns below a recovery threshold (prevents flapping).

### Atlas UX Alert Definitions

```yaml
alerts:
  - name: api_down
    condition: health_check_failures > 3 in 5 minutes
    severity: P1
    channels: [telegram, email, sms]

  - name: engine_stalled
    condition: engine_ticks == 0 for 60 seconds
    severity: P2
    channels: [telegram, email]

  - name: error_rate_spike
    condition: error_rate > 5% for 10 minutes
    severity: P2
    channels: [telegram]

  - name: high_queue_depth
    condition: queued_jobs > 100 for 15 minutes
    severity: P3
    channels: [telegram]

  - name: ai_cost_spike
    condition: hourly_ai_cost > 3x rolling_7d_hourly_average
    severity: P3
    channels: [email]

  - name: db_connections_high
    condition: active_connections > 80% of pool_max for 10 minutes
    severity: P3
    channels: [telegram]
```

---

## Incident Management

### Incident Lifecycle

```
Detect → Triage → Mitigate → Resolve → Postmortem
```

**Detect**: Automated alerts, user reports, or agent self-detection (Agent Watcher component monitors agent health in real-time).

**Triage** (first 5 minutes):
1. Confirm the incident is real (not a false alarm)
2. Assess severity and impact (how many tenants affected, which capabilities are degraded)
3. Assign incident commander
4. Open incident channel (Telegram group or Teams thread)

**Mitigate** (stop the bleeding):
- If bad deploy: rollback to previous version
- If resource exhaustion: scale up or shed load
- If external dependency: activate fallback (e.g., switch AI provider)
- If data issue: disable writes, preserve state for investigation

**Resolve** (fix the root cause):
- Identify and fix the underlying issue
- Deploy the fix through normal pipeline (or hotfix path for P1)
- Verify fix resolves the incident
- Monitor for recurrence

**Postmortem** (within 48 hours):
```markdown
## Incident Postmortem: [Title]
**Date**: YYYY-MM-DD
**Duration**: X hours Y minutes
**Severity**: P1/P2/P3
**Impact**: [What was affected, how many tenants]

### Timeline
- HH:MM — Alert triggered
- HH:MM — Incident commander assigned
- HH:MM — Root cause identified
- HH:MM — Mitigation applied
- HH:MM — Incident resolved

### Root Cause
[Detailed technical explanation]

### What Went Well
- [List]

### What Went Poorly
- [List]

### Action Items
- [ ] [Action with owner and due date]
- [ ] [Action with owner and due date]
```

---

## SLIs, SLOs, and SLAs

### Definitions

- **SLI (Service Level Indicator)**: A quantitative measure of service quality (e.g., request latency P99, availability percentage).
- **SLO (Service Level Objective)**: A target value for an SLI (e.g., P99 latency < 500ms, availability > 99.9%).
- **SLA (Service Level Agreement)**: A contractual commitment with consequences for missing SLOs (e.g., service credits if availability < 99.5%).

### Atlas UX SLOs

| SLI | SLO | Measurement |
|---|---|---|
| API availability | 99.9% (8.7 hours downtime/year) | Successful health checks / total checks |
| API latency P95 | < 300ms | Exclude AI inference endpoints |
| API latency P99 | < 1000ms | Exclude AI inference endpoints |
| Engine tick frequency | > 11 ticks/minute (>91.7% of target) | Engine loop completion count |
| Job completion rate | > 99% within 5 minutes | Jobs completed / jobs created |
| AI inference availability | > 99.5% | Successful completions / total requests |

### Error Budget

If the SLO is 99.9% availability, the error budget is 0.1% — approximately 43 minutes per month. This budget is "spent" on:
- Planned maintenance
- Deployments that cause brief errors
- Unexpected incidents

When the error budget is exhausted, freeze new feature deployments and focus exclusively on reliability.

---

## Chaos Engineering Basics

### Principles

1. Start with a hypothesis: "If database latency doubles, API response times will increase but stay under SLO."
2. Design the smallest experiment that tests the hypothesis.
3. Run in production (start with a single tenant or low-traffic period).
4. Measure the result against the hypothesis.
5. Fix any weaknesses discovered.

### Safe Experiments for Atlas UX

| Experiment | What It Tests | Safety |
|---|---|---|
| Kill one worker process | Auto-restart, job recovery | Low risk: other instances handle load |
| Inject 500ms latency on DB | Timeout handling, circuit breakers | Medium risk: affects response times |
| Revoke one AI provider key | Fallback model routing | Low risk: multi-model setup should handle |
| Fill job queue with 1000 dummy jobs | Queue processing under load | Low risk: engine skips invalid jobs |
| Simulate Render service restart | Zero-downtime deploy behavior | Low risk: Render handles gracefully |

### Prerequisites Before Chaos Testing

- Monitoring and alerting are fully functional
- Rollback procedures are documented and tested
- Team is available to respond if experiment goes wrong
- Experiment has a clear abort criteria and timeout

---

## Backup and Disaster Recovery

### Backup Strategy

| Data | Backup Method | Frequency | Retention | RTO | RPO |
|---|---|---|---|---|---|
| PostgreSQL (Supabase) | Automated snapshots | Daily + WAL continuous | 30 days | 1 hour | < 5 minutes (WAL) |
| File storage (Supabase) | Bucket replication | Continuous | 30 days | 2 hours | < 1 hour |
| Environment variables | Exported to encrypted file in repo | On every change | Git history | 15 minutes | 0 (versioned) |
| Prisma migrations | Git repository | Every commit | Permanent | 5 minutes | 0 (versioned) |
| KB documents | Database backup + file backup | Daily | 30 days | 1 hour | < 5 minutes |

**RTO** (Recovery Time Objective): Maximum acceptable time to restore service.
**RPO** (Recovery Point Objective): Maximum acceptable data loss measured in time.

### Disaster Recovery Procedures

**Scenario: Database corruption or loss**
1. Identify the last known good backup
2. Restore Supabase database from snapshot
3. Apply WAL logs to reach closest-to-present state
4. Verify data integrity with checksums
5. Restart all 4 Render services
6. Run smoke tests
7. Notify affected tenants

**Scenario: Render region outage**
1. Verify the outage is Render-side (check status page)
2. If prolonged (>1 hour), deploy to backup region
3. Update DNS/routing to point to backup region
4. Verify Supabase connectivity from new region
5. Monitor for data consistency issues

**Scenario: Supabase outage**
1. All services enter degraded mode (read from cache where possible)
2. Queue writes in memory (limited by available RAM)
3. When Supabase recovers, replay queued writes
4. Verify no data loss by comparing queue records against database

---

## Atlas UX Production Topology

```
                    ┌────────────────────┐
                    │   Vercel (CDN)     │
                    │   Frontend SPA     │
                    └────────┬───────────┘
                             │ HTTPS
                    ┌────────▼───────────┐
                    │   Render: Web      │
                    │   srv-d62bnoq...   │
                    │   Fastify API      │
                    └────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──┐  ┌───────▼────┐  ┌──────▼──────┐
    │  Render:   │  │  Render:   │  │  Render:    │
    │  Engine    │  │  Email     │  │  Scheduler  │
    │  Worker    │  │  Worker    │  │  Worker     │
    └─────────┬──┘  └───────┬────┘  └──────┬──────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼───────────┐
                    │   Supabase         │
                    │   PostgreSQL 16    │
                    │   + File Storage   │
                    └────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──┐  ┌───────▼────┐  ┌──────▼──────┐
    │  OpenAI    │  │  DeepSeek  │  │  OpenRouter  │
    │  API       │  │  API       │  │  API         │
    └────────────┘  └────────────┘  └──────────────┘
```

### Service Responsibilities

- **Web (srv-d62bnoq...)**: HTTP API, authentication, route handling, real-time endpoints
- **Engine Worker (srv-d6eooj...)**: AI orchestration loop, intent processing, agent execution
- **Email Worker (srv-d6eoq0...)**: Email queue processing, Microsoft Graph API integration
- **Scheduler (srv-d6fk5u...)**: Cron-like workflow triggering, daily intel sweep, aggregation

### Zero-Downtime Deployment Procedure

1. Run `npx prisma migrate deploy` (backward-compatible migrations only)
2. Push code to main branch
3. Render auto-builds all 4 services in parallel
4. Each service does rolling restart (new instance starts, health check passes, old instance drains)
5. Verify all 4 services are healthy via `/v1/health` endpoint
6. Monitor error rates for 15 minutes
7. Deployment complete

### Environment Variable Synchronization

All 4 Render services share the same environment variables. When updating:
```
1. Fetch current vars from any service
2. Add/modify the target variables
3. Push the COMPLETE set to ALL 4 services
4. Services auto-restart on env var change
5. Verify all services restart successfully
```

This ensures no service has stale configuration, which could cause inconsistent behavior across the distributed system.
