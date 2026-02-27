# Atlas UX — Risk Management Framework

**Effective Date:** February 27, 2026
**Last Updated:** February 27, 2026
**Owner:** DEAD APP CORP
**Scope:** All risks to Atlas UX platform operations, data, compliance, and business continuity

---

## 1. Purpose

This framework defines how Atlas UX identifies, assesses, treats, and monitors risks. It connects to the platform's existing guardrail systems (SGL policy enforcement, `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, decision memo approvals) and provides a structured approach to managing both technical and business risks.

---

## 2. Risk Assessment Methodology

### 2.1 Likelihood x Impact Matrix (5x5)

Risks are scored on two dimensions, each rated 1-5:

**Likelihood:**
| Score | Label | Definition |
|-------|-------|------------|
| 1 | Rare | Less than 1% chance per year; no known precedent |
| 2 | Unlikely | 1-10% chance per year; has occurred in the industry but not to us |
| 3 | Possible | 10-50% chance per year; has occurred to similar companies |
| 4 | Likely | 50-90% chance per year; near-misses have occurred at Atlas UX |
| 5 | Almost Certain | >90% chance per year; has already happened or is actively occurring |

**Impact:**
| Score | Label | Definition |
|-------|-------|------------|
| 1 | Negligible | <$100 cost, no data exposure, no user impact, no regulatory concern |
| 2 | Minor | $100-$1,000 cost, minor service degradation (<5 min), no data breach |
| 3 | Moderate | $1,000-$10,000 cost, service outage (5-60 min), potential limited data exposure, minor regulatory concern |
| 4 | Major | $10,000-$100,000 cost, extended outage (1-24 hours), confirmed data breach, regulatory investigation likely |
| 5 | Catastrophic | >$100,000 cost, platform-wide outage (>24 hours), large-scale data breach, regulatory fines, existential business threat |

### 2.2 Risk Score Calculation

**Risk Score = Likelihood x Impact** (range: 1-25)

| | Impact 1 | Impact 2 | Impact 3 | Impact 4 | Impact 5 |
|---|----------|----------|----------|----------|----------|
| **Likelihood 5** | 5 (Med) | 10 (High) | 15 (Crit) | 20 (Crit) | 25 (Crit) |
| **Likelihood 4** | 4 (Med) | 8 (High) | 12 (Crit) | 16 (Crit) | 20 (Crit) |
| **Likelihood 3** | 3 (Low) | 6 (Med) | 9 (High) | 12 (Crit) | 15 (Crit) |
| **Likelihood 2** | 2 (Low) | 4 (Med) | 6 (Med) | 8 (High) | 10 (High) |
| **Likelihood 1** | 1 (Low) | 2 (Low) | 3 (Low) | 4 (Med) | 5 (Med) |

**Risk Rating Thresholds:**
- **Critical (12-25):** Requires immediate treatment; cannot be accepted without executive sign-off
- **High (8-11):** Requires treatment plan within 30 days
- **Medium (4-7):** Requires treatment plan within 90 days
- **Low (1-3):** Monitor; treatment optional

---

## 3. Risk Register

### RISK-001: Database Breach via Supabase Credential Compromise

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Description** | `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` credentials leaked or compromised, granting an attacker full read/write access to all tenant data, audit logs, jobs, and integrations |
| **Likelihood** | 2 (Unlikely) — keys are stored in Render env vars, not in source code |
| **Impact** | 5 (Catastrophic) — all tenant data exposed, regulatory notifications required |
| **Risk Score** | **10 (High)** |
| **Existing Controls** | Env vars stored in Render (not in git); `.env` files in `.gitignore`; Supabase service role key is JWT format (not guessable) |
| **Treatment** | Mitigate — implement secret scanning in CI/CD; enable Supabase audit logs; establish quarterly key rotation schedule |
| **Risk Owner** | CTO |
| **Review Date** | Q2 2026 |

### RISK-002: API Key Leak in Git History

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Description** | Any API key (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, OAuth client secrets, `BOTFATHERTOKEN`, etc.) committed to git repository, even if subsequently removed from the working tree |
| **Likelihood** | 3 (Possible) — common developer error, 40+ env vars to manage |
| **Impact** | 4 (Major) — unauthorized API usage, potential financial loss from AI/Stripe charges, credential rotation across 6 Render services |
| **Risk Score** | **12 (Critical)** |
| **Existing Controls** | `.env` in `.gitignore`; `env.ts` uses Zod validation (fails on missing vars, does not log values) |
| **Treatment** | Mitigate — add `git-secrets` or GitHub secret scanning; add pre-commit hook to scan for key patterns; document key rotation runbook (see `INCIDENT_RESPONSE.md` Section 8.4) |
| **Risk Owner** | Engineering Lead |
| **Review Date** | Q2 2026 |

### RISK-003: Unauthorized Agent Action (AI Agent Autonomy Risk)

| Field | Value |
|-------|-------|
| **Category** | Operational |
| **Description** | An AI agent (Atlas, Binky, or any specialist) takes an action that was not intended, authorized, or appropriate — such as sending unauthorized communications, making unintended purchases, or publishing inappropriate content |
| **Likelihood** | 3 (Possible) — inherent in autonomous AI systems; complexity of 30+ agent configurations |
| **Impact** | 3 (Moderate) — reputational damage, financial loss up to spend limit, customer trust erosion |
| **Risk Score** | **9 (High)** |
| **Existing Controls** | SGL policy (ALLOW/REVIEW/BLOCK decisions); `AUTO_SPEND_LIMIT_USD` caps per-action spend; `MAX_ACTIONS_PER_DAY` daily action cap; `CONFIDENCE_AUTO_THRESHOLD` requires human approval below threshold; decision memo approval workflow for risk tier >= 2; Execution Constitution: only Atlas executes, all others are advisory; all actions logged to `audit_log` |
| **Treatment** | Mitigate — maintain Agent Watcher monitoring (`/app/watcher`); quarterly review of SGL rules and spend limits; implement post-execution content review for publishing agents |
| **Risk Owner** | CTO |
| **Review Date** | Quarterly |

### RISK-004: Agent Overspend (Financial Runaway)

| Field | Value |
|-------|-------|
| **Category** | Financial |
| **Description** | AI agents collectively exceed budget limits through many small transactions that individually fall below `AUTO_SPEND_LIMIT_USD` but aggregate to significant cost |
| **Likelihood** | 3 (Possible) — edge case in autonomous execution logic |
| **Impact** | 3 (Moderate) — unexpected AI provider charges, Stripe product creation costs |
| **Risk Score** | **9 (High)** |
| **Existing Controls** | `AUTO_SPEND_LIMIT_USD` per-action limit; `MAX_ACTIONS_PER_DAY` daily cap; decision memo required for recurring charges; ledger tracking in `accounting` routes; `stripeRoutes.ts` requires `AWAITING_HUMAN` intent approval for product creation |
| **Treatment** | Mitigate — implement daily aggregate spend tracking with hard cutoff; add budget alert notifications via Telegram/email when 80% of daily budget consumed; monthly budget reconciliation |
| **Risk Owner** | CFO (Tina agent) / CTO |
| **Review Date** | Monthly |

### RISK-005: Vendor Outage (Supabase)

| Field | Value |
|-------|-------|
| **Category** | Availability |
| **Description** | Supabase experiences extended outage, making the database inaccessible. All API requests fail, engine loop stops, workers cannot process jobs. |
| **Likelihood** | 2 (Unlikely) — Supabase has 99.9% SLA, but single-provider dependency exists |
| **Impact** | 5 (Catastrophic) — total platform outage for all tenants |
| **Risk Score** | **10 (High)** |
| **Existing Controls** | Health check endpoint on Render (`/health`); Supabase provides both Pgbouncer (`DATABASE_URL`) and direct connection (`DIRECT_URL`) |
| **Treatment** | Accept (short-term) / Mitigate (long-term) — evaluate read replica or standby database; implement circuit breaker pattern in Prisma client; document manual failover procedure |
| **Risk Owner** | CTO |
| **Review Date** | Q3 2026 |

### RISK-006: Vendor Outage (Render)

| Field | Value |
|-------|-------|
| **Category** | Availability |
| **Description** | Render experiences platform-wide outage. Backend API and all 5 workers become unavailable. Frontend on Vercel remains accessible but cannot communicate with backend. |
| **Likelihood** | 2 (Unlikely) — Render has reasonable uptime track record |
| **Impact** | 5 (Catastrophic) — backend completely unavailable |
| **Risk Score** | **10 (High)** |
| **Existing Controls** | Frontend is independently hosted on Vercel; `render.yaml` documents all service configurations for rapid re-deployment |
| **Treatment** | Accept (short-term) / Transfer (long-term) — maintain `render.yaml` and env var documentation for rapid migration to Railway or Fly.io if needed; evaluate multi-region deployment |
| **Risk Owner** | CTO |
| **Review Date** | Q3 2026 |

### RISK-007: Cross-Tenant Data Leakage

| Field | Value |
|-------|-------|
| **Category** | Security / Compliance |
| **Description** | A bug in `tenantPlugin.ts` or a route handler that does not properly filter by `tenant_id` allows one tenant to read or modify another tenant's data |
| **Likelihood** | 2 (Unlikely) — tenantPlugin enforces `x-tenant-id` header on every authenticated request; all Prisma queries include `tenantId` |
| **Impact** | 5 (Catastrophic) — breach of data isolation, regulatory notification required, customer trust destroyed |
| **Risk Score** | **10 (High)** |
| **Existing Controls** | `tenantPlugin.ts` extracts `tenant_id` from header and injects into request; every DB table has `tenant_id` FK; migration `20260226200000` added `tenant_id` to remaining tables |
| **Treatment** | Mitigate — add automated integration tests that verify tenant isolation on every route; periodic manual audit of new routes to verify `tenantId` filtering; consider Supabase RLS as defense-in-depth layer |
| **Risk Owner** | Engineering Lead |
| **Review Date** | Quarterly |

### RISK-008: Compliance Violation (GDPR)

| Field | Value |
|-------|-------|
| **Category** | Compliance |
| **Description** | Failure to respond to data subject requests within 30 days, failure to report breach within 72 hours, or processing EU personal data without valid legal basis |
| **Likelihood** | 2 (Unlikely) — policies and procedures are documented |
| **Impact** | 4 (Major) — GDPR fines up to 4% of annual turnover or EUR 20M; regulatory investigation |
| **Risk Score** | **8 (High)** |
| **Existing Controls** | GDPR compliance framework documented (`GDPR_COMPLIANCE.md`); DPO designated (dpo@atlasux.com); data retention policy (`DATA_RETENTION.md`) defines 30-day deletion window; incident response plan includes 72-hour notification procedure |
| **Treatment** | Mitigate — implement automated data subject request tracking; test 72-hour notification workflow annually; verify DPA status with all vendors (see `VENDOR_MANAGEMENT.md` Section 5) |
| **Risk Owner** | DPO (dpo@atlasux.com) |
| **Review Date** | Q1 2026 (annual) |

### RISK-009: AI Provider Data Misuse

| Field | Value |
|-------|-------|
| **Category** | Privacy / Compliance |
| **Description** | An AI provider (OpenAI, DeepSeek, OpenRouter, Cerebras, Gemini) uses Atlas UX prompt data for model training, violating tenant data confidentiality expectations |
| **Likelihood** | 2 (Unlikely) — API terms generally exclude training, but terms vary by provider |
| **Impact** | 3 (Moderate) — tenant data used for training without consent; potential GDPR violation if EU personal data in prompts |
| **Risk Score** | **6 (Medium)** |
| **Existing Controls** | AI provider abstraction in `ai.ts` allows switching providers; prompt content generally contains business context, not raw PII; OpenAI API has opt-out for training |
| **Treatment** | Mitigate — verify zero-training-data-retention terms with each provider; minimize PII in prompts (strip emails, names where possible); document data flow for each provider in vendor assessment |
| **Risk Owner** | DPO / CTO |
| **Review Date** | Semi-annual |

### RISK-010: Social Publishing Error (Reputational)

| Field | Value |
|-------|-------|
| **Category** | Operational / Reputational |
| **Description** | A social publishing agent (Kelly, Fran, Dwight, Timmy, Terry, Cornwall, Link, Emma, Donna, Reynolds, Penny) publishes content that is incorrect, offensive, or inappropriate on behalf of a tenant |
| **Likelihood** | 3 (Possible) — 11 publishing agents across multiple platforms, content is AI-generated |
| **Impact** | 3 (Moderate) — reputational damage to tenant, potential platform bans, customer churn |
| **Risk Score** | **9 (High)** |
| **Existing Controls** | SGL content review; daily posting cap; publishing requires `ALLOW` from SGL evaluation; social worker processes content through approval queue |
| **Treatment** | Mitigate — implement content preview/approval step before publishing (currently in progress); add content sentiment analysis gate; maintain per-platform content guidelines for each agent |
| **Risk Owner** | Sunday (Comms Lead agent) / CTO |
| **Review Date** | Quarterly |

### RISK-011: Engine Loop Deadlock or Infinite Loop

| Field | Value |
|-------|-------|
| **Category** | Operational |
| **Description** | The engine loop (`engineLoop.ts`, ticking every `ENGINE_TICK_INTERVAL_MS`) enters a state where it processes the same job repeatedly, deadlocks on a database row, or consumes excessive resources |
| **Likelihood** | 2 (Unlikely) — engine uses `FOR UPDATE SKIP LOCKED` for safe concurrent access |
| **Impact** | 3 (Moderate) — agents stop processing; queued jobs pile up; engine worker consumes resources without producing results |
| **Risk Score** | **6 (Medium)** |
| **Existing Controls** | `FOR UPDATE SKIP LOCKED` prevents deadlocks; `ENGINE_TICK_INTERVAL_MS` default 5000ms prevents tight loops; workers use optimistic locking; Render will restart crashed workers |
| **Treatment** | Mitigate — add engine heartbeat monitoring (if no `ENGINE_TICK` audit log entry in 30 seconds, alert); implement per-job timeout; add dead-letter queue for jobs that fail N times |
| **Risk Owner** | Engineering Lead |
| **Review Date** | Q2 2026 |

### RISK-012: OAuth Token Theft

| Field | Value |
|-------|-------|
| **Category** | Security |
| **Description** | OAuth tokens (Google, Meta, X, Microsoft, Reddit, LinkedIn, Pinterest, TikTok, Tumblr) stored in the `integrations` table are compromised, allowing unauthorized access to tenant social accounts and communication channels |
| **Likelihood** | 2 (Unlikely) — tokens encrypted at rest in Supabase; access requires valid `tenant_id` |
| **Impact** | 4 (Major) — unauthorized posting on tenant social accounts; unauthorized email sending; privacy breach |
| **Risk Score** | **8 (High)** |
| **Existing Controls** | Tokens stored in DB with tenant isolation; backend-only access (never exposed to frontend); `authPlugin.ts` validates JWT before any route handler; rate limiting on sensitive routes |
| **Treatment** | Mitigate — implement token encryption at application level (beyond Supabase at-rest encryption); reduce token scopes to minimum required; implement token refresh monitoring (alert on unusual refresh patterns) |
| **Risk Owner** | Engineering Lead |
| **Review Date** | Q2 2026 |

---

## 4. Risk Acceptance Criteria

A risk may be accepted (no further treatment) only if:

1. **Risk score is Low (1-3):** The risk owner can accept without further approval.
2. **Risk score is Medium (4-7):** The risk owner documents the acceptance rationale. CTO reviews and co-signs.
3. **Risk score is High (8-11):** Acceptance requires written justification, CTO approval, and quarterly re-evaluation. The acceptance is recorded in the risk register.
4. **Risk score is Critical (12-25):** Cannot be accepted. Must be treated (mitigated, transferred, or avoided). If treatment is not feasible within 90 days, the CEO must sign off on a temporary acceptance with a concrete remediation timeline.

**Acceptance documentation must include:**
- Risk ID and description
- Current risk score
- Reason treatment is not being applied
- Compensating controls (if any)
- Re-evaluation date
- Approver signature

---

## 5. Risk Treatment Options

### 5.1 Avoid
Eliminate the risk by removing the activity or technology that creates it.

*Example:* If DeepSeek's data residency terms are unacceptable for GDPR, avoid the risk by removing DeepSeek as a provider and routing all traffic to OpenAI or Gemini.

### 5.2 Mitigate
Reduce the likelihood or impact through controls.

*Example:* Add `git-secrets` pre-commit hook to reduce likelihood of RISK-002 (API key leak). Implement per-job timeouts to reduce impact of RISK-011 (engine loop issue).

### 5.3 Transfer
Shift the risk to a third party, typically through insurance or contractual agreements.

*Example:* Stripe's PCI DSS Level 1 certification transfers card data breach risk from Atlas UX to Stripe. Cyber liability insurance transfers financial impact of a data breach.

### 5.4 Accept
Acknowledge the risk and take no further action.

*Example:* RISK-006 (Render outage) is temporarily accepted because the cost of multi-region deployment exceeds the current risk-adjusted impact. Re-evaluated quarterly.

---

## 6. Review Cadence

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Full risk register review | Quarterly | CTO + Compliance Officer |
| Critical/High risk status check | Monthly | CTO |
| Risk scoring recalculation | After any incident, architecture change, or new vendor onboarding | Risk Owner |
| Risk framework review (this document) | Annually | Compliance Committee |
| New risk identification workshop | Semi-annually | Full engineering team |

**Trigger-based reviews:**
- Any P0/P1 incident triggers immediate review of related risks
- New feature deployment that introduces external API calls triggers vendor risk assessment
- New agent deployment triggers review of RISK-003 (unauthorized agent action) controls
- Regulatory change (new GDPR guidance, HIPAA update) triggers review of RISK-008

---

## 7. Risk Owner Assignments

| Role | Risks Owned | Responsibilities |
|------|-------------|------------------|
| **CTO** | RISK-001, RISK-003, RISK-004, RISK-005, RISK-006, RISK-009 | Technical risk treatment decisions; infrastructure vendor relationships; AI governance |
| **Engineering Lead** | RISK-002, RISK-007, RISK-011, RISK-012 | Code-level controls; CI/CD security; tenant isolation; engine reliability |
| **DPO** | RISK-008, RISK-009 | GDPR compliance; data processing agreements; privacy impact assessments |
| **CEO** | All Critical risks (approval authority) | Final sign-off on risk acceptance; budget for risk treatment; regulatory liaison |

---

## 8. Connection to Existing Platform Guardrails

Atlas UX has built-in guardrails that directly implement risk mitigations:

| Guardrail | Env Var / Config | Risks Mitigated |
|-----------|-----------------|-----------------|
| **SGL Policy** (`policies/SGL.md`) | Hardcoded in engine | RISK-003 (unauthorized agent action), RISK-010 (publishing error) |
| **Auto-Spend Limit** | `AUTO_SPEND_LIMIT_USD` | RISK-004 (overspend) |
| **Daily Action Cap** | `MAX_ACTIONS_PER_DAY` | RISK-003, RISK-004 |
| **Confidence Threshold** | `CONFIDENCE_AUTO_THRESHOLD` | RISK-003 (low-confidence actions require human approval) |
| **Decision Memo Workflow** | `decision_memos` table, `AWAITING_HUMAN` intent status | RISK-003, RISK-004 (risk tier >= 2 requires approval) |
| **Execution Constitution** (`policies/EXECUTION_CONSTITUTION.md`) | Hardcoded in engine | RISK-003 (only Atlas executes; others are advisory) |
| **Tenant Plugin** | `tenantPlugin.ts` | RISK-007 (cross-tenant isolation) |
| **Auth Plugin** | `authPlugin.ts` | RISK-001, RISK-007, RISK-012 |
| **Rate Limiting** | Per-route `rateLimit` config | RISK-002 (brute force), RISK-011 (abuse) |
| **Audit Log** | `auditPlugin.ts`, `audit_log` table | All risks (detection and forensics) |
| **Optimistic Locking** | Workers use `updateMany` with status WHERE clause | RISK-011 (prevents double-processing) |
| **FOR UPDATE SKIP LOCKED** | Engine loop intent processing | RISK-011 (prevents deadlocks) |

---

## 9. Risk Reporting

### 9.1 Monthly Risk Dashboard (provided to CTO)
- Count of open risks by rating (Critical/High/Medium/Low)
- Risks with overdue treatment actions
- New risks identified since last report
- Risks closed or downgraded since last report

### 9.2 Quarterly Risk Report (provided to Compliance Committee)
- Full risk register snapshot
- Treatment progress for all High/Critical risks
- Changes in risk scores
- Incident correlation (did any incidents validate or invalidate risk assessments?)
- Recommendations for new controls or process changes

### 9.3 Annual Risk Summary (included in Compliance Annual Report)
- Year-over-year risk trend
- Total treatment investments
- Residual risk profile
- Recommendations for next year

---

**Contact:**
- **Risk Management:** compliance@atlasux.com
- **Security Incidents:** incidents@atlasux.com
- **DPO:** dpo@atlasux.com

---

**End of Document**
