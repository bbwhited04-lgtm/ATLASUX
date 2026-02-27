# DevOps & Infrastructure Automation

## Overview

DevOps unifies software development and IT operations to shorten delivery cycles, increase deployment frequency, and ensure reliability. For Atlas UX, DevOps practices govern how the platform's 4 Render services, Vercel frontend, and Supabase database are built, tested, deployed, and monitored.

---

## 1. CI/CD Pipeline Design

A mature CI/CD pipeline automates the path from code commit to production:

### Pipeline Stages
1. **Build** — Compile TypeScript, bundle frontend (Vite), generate Prisma client
2. **Test** — Unit tests, integration tests, type checking (`tsc --noEmit`)
3. **Security Scan** — Dependency audit (`npm audit`), secret scanning, SAST
4. **Deploy** — Push to staging, run smoke tests, promote to production
5. **Smoke Test** — Hit key endpoints (`/v1/health`, `/v1/runtime/status`), verify responses
6. **Monitor** — Watch error rates, latency, and resource usage for 15 minutes post-deploy

### Pipeline Principles
- **Fast feedback**: Tests should complete in under 5 minutes
- **Fail early**: Run cheapest checks first (lint → type check → unit test → integration)
- **Immutable artifacts**: Build once, deploy the same artifact to staging and production
- **Rollback ready**: Every deploy should be reversible within 2 minutes

### Atlas UX Pipeline
```
git push → GitHub Actions → npm ci → tsc → test → build
  → Render auto-deploy (web, email-worker, engine-worker, scheduler)
  → Vercel auto-deploy (frontend)
  → Tauri CI (desktop builds on v* tags)
```

---

## 2. Infrastructure as Code (IaC)

### Principles
- **Declarative**: Describe desired state, not steps to get there
- **Version controlled**: All infrastructure config lives in git
- **Reproducible**: Same config produces identical environments every time
- **Self-documenting**: The code IS the documentation

### Atlas UX IaC
- `render.yaml` — Declares all 4 Render services with build/start commands
- `docker-compose.yml` — Local PostgreSQL 16 for development
- `prisma/schema.prisma` — Database schema as code, versioned migrations
- `.github/workflows/` — CI/CD pipeline definitions
- `tauri.conf.json` — Desktop build configuration

---

## 3. Deployment Strategies

### Blue-Green Deployment
- Maintain two identical environments (blue=current, green=new)
- Deploy to green, test, switch traffic from blue to green
- Instant rollback: switch back to blue
- **Cost**: 2x infrastructure during deployment

### Canary Deployment
- Route 5-10% of traffic to the new version
- Monitor error rates and latency
- Gradually increase to 25% → 50% → 100%
- **Advantage**: Limits blast radius of bad deploys

### Rolling Deployment
- Update instances one at a time
- Each instance drains connections before updating
- **What Render uses**: Zero-downtime rolling deploys for web services

### Feature Flags
- Decouple deployment from release
- Deploy dark (code live but feature hidden)
- Enable per-tenant, per-user, or percentage-based rollout
- Kill switch for instant disable without redeploy

---

## 4. Monitoring & Observability

### The Three Pillars

**Metrics** — Numeric measurements over time
- Request rate (requests/second)
- Error rate (4xx, 5xx percentage)
- Latency (P50, P95, P99)
- Resource utilization (CPU, memory, disk, connections)
- Business metrics (active jobs, agent actions/day, LLM token spend)

**Logs** — Discrete events with context
- Structured JSON logs (timestamp, level, message, metadata)
- Correlation IDs to trace requests across services
- Log levels: DEBUG → INFO → WARN → ERROR → FATAL
- Retention: 7 days hot, 30 days warm, 90 days cold

**Traces** — Request flow across services
- Distributed tracing shows the full lifecycle of a request
- Identify which service/function is the bottleneck
- Measure time spent in each component (API → DB → LLM → response)

### What to Monitor for Atlas UX
| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| API response time (P95) | < 500ms | > 2s |
| Error rate | < 1% | > 5% |
| Engine loop tick | Every 5s | Missed 3+ ticks |
| Email worker | < 30s delivery | Queue depth > 100 |
| LLM API latency | < 10s | > 30s |
| Database connections | < 80% pool | > 90% pool |
| Daily token spend | Within budget | > 80% daily limit |

---

## 5. Alerting Strategy

### Severity Levels
- **P0 Critical**: System down, data loss, security breach → Immediate response
- **P1 High**: Feature broken for all users, payment processing failed → < 15 min
- **P2 Medium**: Feature degraded, slow performance → < 1 hour
- **P3 Low**: Cosmetic issue, non-critical log errors → Next business day

### Alerting Best Practices
- **Alert on symptoms, not causes** (alert on error rate, not on CPU usage)
- **Avoid alert fatigue**: Only alert on actionable conditions
- **Escalation chain**: Auto-escalate if not acknowledged within SLA
- **Runbook links**: Every alert should link to a runbook with resolution steps

---

## 6. Incident Management

### Incident Lifecycle
1. **Detect** — Monitoring alert or user report triggers incident
2. **Triage** — Assign severity, identify affected systems, communicate status
3. **Mitigate** — Immediate action to reduce impact (rollback, feature flag, scale up)
4. **Resolve** — Fix root cause, verify fix, restore normal operation
5. **Postmortem** — Blameless review: timeline, root cause, action items, lessons learned

### Postmortem Template
```
## Incident: [Title]
**Severity**: P0/P1/P2
**Duration**: [start] to [end] ([total time])
**Impact**: [who was affected, what broke]

## Timeline
- HH:MM — Alert fired
- HH:MM — Incident declared
- HH:MM — Root cause identified
- HH:MM — Fix deployed
- HH:MM — All clear

## Root Cause
[What actually broke and why]

## Action Items
- [ ] [Preventive measure 1] — Owner — Due date
- [ ] [Preventive measure 2] — Owner — Due date

## Lessons Learned
[What we'll do differently]
```

---

## 7. SLIs, SLOs, and SLAs

### Definitions
- **SLI (Service Level Indicator)**: A measurable metric (e.g., "99.2% of requests complete in < 500ms")
- **SLO (Service Level Objective)**: A target for the SLI (e.g., "99.5% of requests should complete in < 500ms")
- **SLA (Service Level Agreement)**: A contractual commitment with consequences (e.g., "99.9% uptime or credits issued")

### Atlas UX SLOs
| Service | SLI | SLO |
|---------|-----|-----|
| API Availability | Successful responses / total requests | 99.5% |
| API Latency | Requests < 500ms / total requests | 95% |
| Engine Loop | Ticks within 10s of schedule | 99% |
| Email Delivery | Emails sent within 60s of queue | 95% |
| Data Durability | Zero data loss events | 99.99% |

### Error Budgets
- If SLO is 99.5%, error budget is 0.5% (43 minutes/month of downtime)
- Spend error budget on feature velocity — fast deploys, experiments
- When budget is exhausted, freeze features and focus on reliability

---

## 8. Chaos Engineering

### Principles
- **Start with a hypothesis**: "If X fails, the system will Y"
- **Minimize blast radius**: Test in staging first, then canary in production
- **Automate experiments**: Repeatable, scheduled chaos tests

### Experiments for Atlas UX
1. Kill one of 4 Render services — does the system degrade gracefully?
2. Simulate LLM API timeout — do agents fall back correctly?
3. Database connection pool exhaustion — does the API queue or error?
4. Spike job queue to 1000 items — does the engine loop handle backpressure?

---

## 9. Backup & Disaster Recovery

### Backup Strategy (3-2-1 Rule)
- **3** copies of data
- **2** different storage media
- **1** offsite copy

### Atlas UX Backups
- **Database**: Supabase automatic daily backups + point-in-time recovery
- **File storage**: Supabase Storage with bucket-level retention
- **Code**: Git repository (GitHub) with branch protection
- **Configuration**: Environment variables documented in backend/.env template

### Recovery Time Objectives
| Component | RTO (Recovery Time) | RPO (Recovery Point) |
|-----------|--------------------|--------------------|
| Database | < 1 hour | < 1 hour (PITR) |
| API services | < 10 minutes | Zero (stateless) |
| File storage | < 30 minutes | < 24 hours |
| Frontend | < 5 minutes | Zero (CDN + git) |

---

## 10. Atlas UX Render Architecture

### Four Services
| Service | Type | Purpose | Scaling |
|---------|------|---------|---------|
| `web` | Web Service | Fastify API server | Auto-scale on traffic |
| `email-worker` | Background Worker | Polls jobs table for EMAIL_SEND | Single instance |
| `engine-worker` | Background Worker | Engine loop (5s tick) | Single instance |
| `scheduler` | Background Worker | Cron-like workflow triggers | Single instance |

### Environment Variable Management
- Source of truth: `backend/.env` (local file)
- Push to Render: PUT to `/v1/services/{id}/env-vars` (replaces ALL — always merge)
- All 4 services share the same env var set
- Never rely on what's currently on Render — always push from local

### Zero-Downtime Deploy Process
1. Push to `main` branch
2. Render detects push, triggers build on all 4 services
3. Each service: `npm install` → `npm run build` → health check → swap traffic
4. Old instance drains connections for 30s before termination
5. Verify: hit `/v1/health` and `/v1/runtime/status`

---

## Agent Application

- **Petra** uses pipeline thinking for project management — each task flows through stages
- **Larry** monitors SLOs and alerts on compliance drift
- **Atlas** makes deploy/rollback decisions based on error budgets
- **Cheryl** follows incident management playbook for support escalations
- **All agents** benefit from observability data fed into their context
