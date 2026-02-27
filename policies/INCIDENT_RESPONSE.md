# Atlas UX — Incident Response Plan

**Effective Date:** February 27, 2026
**Last Updated:** February 27, 2026
**Owner:** DEAD APP CORP
**Scope:** All Atlas UX production systems (Render backend, Vercel frontend, Supabase PostgreSQL, third-party integrations)

---

## 1. Purpose

This document defines how Atlas UX detects, responds to, contains, and recovers from security incidents and service disruptions. It covers the operational procedures for the platform's actual infrastructure: Fastify API on Render, React SPA on Vercel, Supabase-hosted PostgreSQL, and all third-party vendor integrations.

---

## 2. Severity Levels

### P0 — Critical
**Definition:** Complete service outage, confirmed data breach, or active exploitation of a vulnerability affecting production data.

Examples:
- Supabase database credentials compromised
- Render API keys or `STRIPE_SECRET_KEY` leaked in a public commit
- Confirmed unauthorized access to tenant data (cross-tenant read/write)
- All Render services down simultaneously
- Active exploitation of an authentication bypass in `authPlugin.ts`

**Response time:** Acknowledge within 15 minutes. All hands on deck within 30 minutes.

### P1 — High
**Definition:** Significant degradation of service, potential data exposure, or a vulnerability with a clear exploitation path that has not yet been exploited.

Examples:
- Engine loop (`engineLoop.ts`) stuck, no agents processing for >30 minutes
- One Render worker service (email, engine, scheduler, social, jobs) down and not auto-recovering
- OAuth token stored unencrypted or logged to stdout
- `tenantPlugin.ts` failing to enforce tenant isolation on a specific route
- AI provider API key exposed in client-side bundle

**Response time:** Acknowledge within 1 hour. Active investigation within 2 hours.

### P2 — Medium
**Definition:** Partial service degradation, non-critical vulnerability, or a near-miss that could escalate.

Examples:
- Single AI provider (OpenAI, DeepSeek) unavailable but fallback providers working
- Elevated error rate on Stripe webhook verification (`billingWebhookRoutes.ts`)
- Rate limiting not triggering correctly on a specific route
- Audit log writes failing silently (data integrity issue, not data breach)
- Telegram bot (`BOTFATHERTOKEN`) responding with errors

**Response time:** Acknowledge within 4 hours. Fix or mitigate within 24 hours.

### P3 — Low
**Definition:** Minor issue with no immediate security or availability impact.

Examples:
- Non-critical dependency vulnerability in `package-lock.json`
- Cosmetic error in compliance reporting
- Development environment misconfiguration
- Single failed job in the jobs queue that does not affect other tenants

**Response time:** Acknowledge within 1 business day. Scheduled fix within 1 week.

---

## 3. Roles and Responsibilities

### Incident Commander (IC)
- Declares incident severity and owns the incident until resolution
- Coordinates all response activities
- Makes go/no-go decisions on containment actions (e.g., "rotate all Render env vars now")
- Writes or delegates the post-incident review
- **Primary:** CTO / Engineering Lead
- **Backup:** Senior backend engineer

### Technical Lead (TL)
- Leads the hands-on investigation and remediation
- Executes containment and eradication steps on Render, Supabase, and Vercel
- Provides technical status updates to the IC every 30 minutes during P0/P1
- **Primary:** On-call engineer
- **Backup:** Any engineer with Render dashboard access

### Communications Lead (CL)
- Drafts all internal and external communications
- Manages the status page and customer notifications
- Handles regulatory notification timelines (GDPR 72-hour, HIPAA 60-day)
- **Primary:** CEO / Founder
- **Backup:** Compliance Officer (compliance@atlasux.com)

---

## 4. Escalation Chain

### P0 — Critical
1. **Detecting engineer** posts to `#incidents` Slack/Discord channel with `@here`
2. **IC** is paged immediately (phone call + SMS)
3. **TL** joins within 15 minutes
4. **CL** joins within 30 minutes
5. If no response from IC within 15 minutes, backup IC is paged
6. External counsel notified within 1 hour if data breach is confirmed

### P1 — High
1. **Detecting engineer** posts to `#incidents` channel
2. **IC** notified via Slack/Discord DM + email to incidents@atlasux.com
3. **TL** begins investigation within 1 hour
4. **CL** on standby, joins if customer impact confirmed

### P2 — Medium
1. **Detecting engineer** files an issue and notifies `#incidents` channel
2. **On-call engineer** triages during next business hours window
3. **IC** notified if issue escalates

### P3 — Low
1. **Detecting engineer** files an issue in the backlog
2. Addressed during normal sprint planning

---

## 5. Response Procedures

### 5.1 Detection

**Automated detection sources:**
- Render service health checks (`/health` endpoint on the web service)
- Supabase dashboard alerts (connection pool exhaustion, storage limits)
- Vercel deployment status and function errors
- Application-level: Fastify logger output on Render (structured JSON logs)
- Audit log anomalies: sudden spike in `BLOCK` or `REVIEW` SGL decisions
- Engine loop: no `audit_log` entries with `action = 'ENGINE_TICK'` for >3 tick intervals (15+ seconds)

**Manual detection sources:**
- Customer support reports via tickets@atlasux.com or Cheryl (support agent)
- Internal team observation
- Third-party vendor notifications (Stripe, Supabase status pages)
- Security researcher reports to security@deadapp.info

### 5.2 Containment

**Immediate containment (P0/P1):**

| Scenario | Action |
|----------|--------|
| API key leaked in git history | 1. Rotate the key immediately in Render dashboard (all 4 services + web). 2. Force-push a cleaned commit or use `git filter-branch`. 3. Invalidate the old key at the provider (Stripe, OpenAI, etc.). |
| Supabase DB credentials compromised | 1. Rotate the database password in Supabase dashboard. 2. Update `DATABASE_URL` and `DIRECT_URL` on all Render services. 3. Restart all services. 4. Review `audit_log` for unauthorized queries. |
| Cross-tenant data access | 1. Identify the affected route. 2. Add emergency `WHERE tenant_id = ?` guard or disable the route. 3. Deploy hotfix to Render. 4. Audit all requests to that route in the past 72 hours. |
| Render service compromised | 1. Suspend the service in Render dashboard. 2. Rotate all env vars pushed to that service. 3. Redeploy from a known-good commit. |
| Vercel frontend serving malicious code | 1. Roll back to the previous deployment in Vercel dashboard (instant). 2. Investigate the build pipeline for compromise. |
| Auth bypass in `authPlugin.ts` | 1. Enable maintenance mode (return 503 on all authenticated routes). 2. Patch and deploy. 3. Invalidate all active JWT tokens by rotating the signing secret. |

**Short-term containment (P2):**
- Disable the affected feature flag or route
- Apply rate limiting if the issue is abuse-related
- Notify affected tenants if needed

### 5.3 Eradication

After containment:
1. **Root cause analysis** — Identify the exact code path, configuration, or process failure
2. **Patch development** — Fix the vulnerability or misconfiguration
3. **Code review** — All incident patches require a second pair of eyes before merge
4. **Dependency audit** — If the issue came from a dependency, check for related vulnerabilities
5. **Credential rotation** — Rotate any credential that may have been exposed, even if "probably fine"

### 5.4 Recovery

1. Deploy the fix to Render (web service redeploys automatically on push; workers require manual restart or Render auto-deploy)
2. Verify all 6 Render services are healthy:
   - `atlasux-backend` (web)
   - `atlasux-engine-worker`
   - `atlasux-email-worker`
   - `atlasux-scheduler`
   - `atlasux-jobs-worker`
   - `atlasux-social-worker`
3. Verify Vercel frontend is serving correctly
4. Run validation queries against Supabase to confirm data integrity
5. Confirm audit log is recording events again
6. Monitor error rates for 24 hours post-recovery
7. IC declares incident resolved and sets the 48-hour observation window

### 5.5 Post-Incident Review

Conducted within **5 business days** of incident resolution for P0/P1, within **10 business days** for P2.

---

## 6. Communication Templates

### 6.1 Internal — Incident Declaration (Slack/Discord)

```
INCIDENT DECLARED — [P0/P1/P2/P3]
Summary: [one-line description]
Detected: [timestamp UTC]
Impact: [what is broken, who is affected]
IC: [name]
TL: [name]
Status: INVESTIGATING
Next update: [timestamp, typically +30min for P0/P1]
```

### 6.2 Internal — Status Update

```
INCIDENT UPDATE — [P0/P1/P2/P3] — [INVESTIGATING/CONTAINED/RESOLVED]
Summary: [updated description]
What changed: [containment actions taken]
Current impact: [remaining impact]
Next steps: [what we are doing next]
Next update: [timestamp]
```

### 6.3 Customer Notification — Service Disruption

```
Subject: Atlas UX Service Disruption — [Date]

We are aware of an issue affecting [describe affected functionality].

What happened: [brief, honest description without exposing security details]
Impact: [what users may have experienced]
Status: [We have identified the issue and are deploying a fix / The issue has been resolved]
Duration: [start time] to [end time or "ongoing"]

We apologize for the inconvenience. If you have questions, contact support@deadapp.info.

— Atlas UX Team
```

### 6.4 Customer Notification — Data Breach

```
Subject: Important Security Notice from Atlas UX

We are writing to inform you of a security incident that may have affected your data.

What happened: [factual description]
What data was involved: [specific data types]
What we have done: [containment and remediation actions]
What you should do: [specific recommended actions]
Timeline: [when it happened, when we discovered it, when we contained it]

For questions, contact security@deadapp.info.

— Atlas UX Security Team
```

---

## 7. Regulatory Breach Notification

### 7.1 GDPR — 72-Hour Notification

**Trigger:** Confirmed breach of personal data of EU/EEA data subjects.

**Timeline:**
- **Hour 0:** Breach confirmed by IC
- **Hour 0-4:** CL drafts notification to supervisory authority
- **Hour 4-24:** Legal review of notification
- **Hour 24-48:** Notification finalized with all available facts
- **Hour 48-72:** Notification submitted to the lead supervisory authority

**Notification must include (per Article 33):**
1. Nature of the breach (categories and approximate number of data subjects)
2. Name and contact details of the DPO (dpo@atlasux.com)
3. Likely consequences of the breach
4. Measures taken or proposed to address the breach

**Data subject notification (Article 34):** Required if breach is likely to result in high risk to rights and freedoms. Same timeline, sent to affected users via email.

**Where to file:** Lead supervisory authority based on main establishment. If no EU establishment, file with each relevant Member State authority.

### 7.2 HIPAA — 60-Day Notification

**Trigger:** Breach of unsecured protected health information (PHI).

**Note:** Atlas UX does not currently process PHI in production. This procedure exists for future compliance readiness. If PHI processing begins, Business Associate Agreements must be in place first.

**Timeline:**
- **Day 0:** Breach confirmed
- **Day 0-14:** Risk assessment per 45 CFR 164.402 (four-factor test: nature of PHI, unauthorized person, whether PHI was actually acquired/viewed, extent of mitigation)
- **Day 14-30:** Individual notifications drafted and reviewed by legal counsel
- **Day 30-60:** Notifications sent to affected individuals via first-class mail or email (if individual consented to electronic notice)
- **Day 60 (hard deadline):** All individual notifications must be sent

**Additional requirements:**
- If breach affects 500+ individuals: notify HHS Secretary and prominent media outlets simultaneously
- If breach affects <500 individuals: log and report to HHS Secretary within 60 days of calendar year end
- Notification content: description of breach, types of information involved, steps individuals should take, what the organization is doing, contact information

---

## 8. Platform-Specific Runbooks

### 8.1 Render — Service Down

**Symptoms:** `/health` endpoint returning 5xx or not responding; Render dashboard shows service as "Suspended" or "Deploy failed."

**Steps:**
1. Check Render status page (status.render.com) for platform-wide issues
2. Check Render dashboard for the affected service's logs
3. If deploy failed: review the build log, fix the code, push a new commit
4. If service crashed at runtime: check for unhandled exceptions in logs, particularly in `server.ts` startup
5. If all services are down: check if `DATABASE_URL` is valid (Supabase may have rotated pooler credentials)
6. Manual restart: Render dashboard > Service > Manual Deploy (or trigger via `render-cli`)
7. If env vars were lost: re-push using `PUT /v1/services/{serviceId}/env-vars` (deduplicate keys, push to all 6 services)

**Service IDs for reference:**
- Web: `srv-d62bnoq4d50c738b4e6g`
- Email worker: `srv-d6eoq07gi27c73ae4ing`
- Engine worker: `srv-d6eoojkr85hc73frr5rg`
- Scheduler: `srv-d6fk5utm5p6s73bqrohg`

### 8.2 Supabase — Database Breach or Outage

**Symptoms:** Prisma queries failing with connection errors; Supabase dashboard showing connection pool exhaustion or abnormal query patterns.

**Steps:**
1. Check Supabase status page and dashboard for known issues
2. If connection pool exhausted: restart Supabase Pgbouncer from dashboard; check for long-running queries and kill them
3. If unauthorized access suspected:
   a. Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase dashboard
   b. Rotate the database password
   c. Update `DATABASE_URL`, `DIRECT_URL`, and `SUPABASE_SERVICE_ROLE_KEY` on all Render services
   d. Restart all services
   e. Query `audit_log` for recent suspicious `actorType = 'system'` entries with unexpected IP addresses
4. If data was exfiltrated: follow breach notification procedures (Sections 7.1/7.2)
5. Review Supabase auth logs and Row Level Security policies (note: Atlas UX uses application-level tenant isolation via `tenantPlugin.ts`, not Supabase RLS)

### 8.3 Vercel — Frontend Compromise

**Symptoms:** Users reporting unexpected behavior; SPA serving different content than expected.

**Steps:**
1. Verify by loading the site in an incognito browser
2. Check Vercel dashboard for recent deployments — was there an unauthorized deploy?
3. If compromised: roll back to the last known-good deployment in Vercel dashboard (instant rollback)
4. Check `VITE_API_BASE_URL` and `VITE_APP_GATE_CODE` in Vercel env vars — ensure they have not been tampered with
5. If the build pipeline was compromised: audit GitHub Actions / Vercel build logs, rotate Vercel team tokens
6. Frontend-specific: the gate code (`VITE_APP_GATE_CODE`) is the only secret baked into the frontend build; it is not a security-critical credential

### 8.4 API Key Compromised

**Symptoms:** Unexpected charges from AI providers; unauthorized API calls appearing in provider dashboards; key found in public repository.

**Steps:**
1. Identify which key was compromised (check: `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`, `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `BOTFATHERTOKEN`, `MS_CLIENT_SECRET`, OAuth client secrets)
2. Rotate the key at the provider immediately
3. Update the env var on all relevant Render services (web + workers)
4. If `STRIPE_SECRET_KEY`: also update `STRIPE_WEBHOOK_SECRET` and re-register the webhook endpoint in Stripe dashboard
5. If `SUPABASE_SERVICE_ROLE_KEY`: this is the most dangerous — it has full database access. Rotate immediately in Supabase, update all Render services
6. If any OAuth client secret: rotate at the provider, update Render, re-test the OAuth flow
7. Scan git history for the compromised key: `git log --all -p -S 'key_prefix'`
8. If found in git: use `git filter-branch` or BFG Repo-Cleaner to remove, force-push, and notify GitHub to purge caches

---

## 9. Post-Incident Review Template

```markdown
# Post-Incident Review — [Incident ID]

**Date:** [date]
**Severity:** [P0/P1/P2/P3]
**Duration:** [start] to [end] ([total duration])
**IC:** [name]
**TL:** [name]
**CL:** [name]

## Summary
[2-3 sentence summary of what happened]

## Timeline (all times UTC)
- [HH:MM] — [event]
- [HH:MM] — [event]
- ...

## Root Cause
[Technical root cause. Be specific: which file, which configuration, which process failed.]

## Impact
- **Users affected:** [number or percentage]
- **Tenants affected:** [list or count]
- **Data exposed:** [none / describe what was exposed]
- **Duration of impact:** [time]
- **Financial impact:** [if any — e.g., AI provider overcharges]

## What Went Well
- [bullet points]

## What Went Wrong
- [bullet points]

## Action Items
| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [action] | [owner] | [date] | Open |
| 2 | [action] | [owner] | [date] | Open |

## Lessons Learned
[What we will do differently next time]

## Regulatory Notifications
- GDPR notification required: [Yes/No]
- HIPAA notification required: [Yes/No]
- Notifications sent: [dates and recipients]
```

---

## 10. Incident Log

All incidents are tracked in the following locations:
- **Database:** `audit_log` table (level: `critical` or `error`, action: `INCIDENT_*`)
- **Document:** Internal incident tracker (linked from `#incidents` channel)
- **Regulatory:** Breach notification register maintained by CL

---

## 11. Testing and Maintenance

- **Tabletop exercise:** Conducted quarterly. Simulate a P0 scenario and walk through this plan.
- **Runbook validation:** Each platform-specific runbook (Section 8) is tested annually against a staging environment.
- **Contact list verification:** Escalation contacts verified monthly.
- **Plan review:** This document is reviewed and updated every 6 months or after any P0/P1 incident, whichever comes first.

---

**Contact:**
- **Incidents:** incidents@atlasux.com
- **Security:** security@deadapp.info
- **Privacy:** privacy@deadapp.info

---

**End of Document**
