# Atlas UX — Vendor Risk Management Policy

**Effective Date:** February 27, 2026
**Last Updated:** February 27, 2026
**Owner:** DEAD APP CORP
**Scope:** All third-party vendors that process, store, or transmit Atlas UX data or provide infrastructure critical to platform operations

---

## 1. Purpose

This policy establishes how Atlas UX evaluates, monitors, and manages third-party vendor risk. Every vendor that touches tenant data, processes payments, hosts infrastructure, or provides AI capabilities must be assessed, documented, and reviewed on a recurring schedule.

---

## 2. Vendor Inventory

### 2.1 Infrastructure Vendors

| Vendor | Service | Data Access | Criticality | Env Vars |
|--------|---------|-------------|-------------|----------|
| **Supabase** | PostgreSQL database hosting, Pgbouncer connection pooling, file storage (`kb_uploads` bucket) | Full access to all tenant data, audit logs, jobs, integrations, OAuth tokens (encrypted), file uploads | **Critical** — total platform dependency | `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Render** | Backend API hosting (Fastify web service), 5 worker processes (engine, email, scheduler, jobs, social) | Processes all data in transit; env vars contain all secrets | **Critical** — backend goes down if Render goes down | All backend env vars |
| **Vercel** | Frontend SPA hosting and CDN | No direct data access; serves static assets; env vars contain `VITE_API_BASE_URL` and `VITE_APP_GATE_CODE` only | **High** — frontend inaccessible if Vercel down, but backend API still functional | `VITE_API_BASE_URL`, `VITE_APP_GATE_CODE` |

### 2.2 Payment Vendors

| Vendor | Service | Data Access | Criticality | Env Vars |
|--------|---------|-------------|-------------|----------|
| **Stripe** | Payment processing, product/price catalog, webhook events | Stripe holds all card data (PCI DSS Level 1). Atlas UX receives only payment intent IDs, customer IDs, and event metadata via webhooks. Never sees card numbers. | **High** — billing broken without Stripe, but core platform functions without it | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

### 2.3 AI Providers

| Vendor | Service | Data Access | Criticality | Env Vars |
|--------|---------|-------------|-------------|----------|
| **OpenAI** | Primary LLM provider (GPT-4, etc.) | Receives prompt content which may include tenant business data, agent instructions, content drafts | **High** — primary AI engine | `OPENAI_API_KEY`, `OPENAI_BASE_URL` |
| **DeepSeek** | Secondary LLM provider | Same as OpenAI — receives prompt content | **Medium** — fallback provider | `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL` |
| **OpenRouter** | AI model routing/fallback | Same as OpenAI — receives prompt content | **Medium** — fallback provider | `OPENROUTER_API_KEY` |
| **Cerebras** | Fast inference provider | Same as OpenAI — receives prompt content | **Low** — used for specific fast-inference tasks | `CEREBRAS_API_KEY` |
| **Google (Gemini)** | Long-context summarization, fallback | Same as OpenAI — receives prompt content | **Medium** — used for long-context workflows | `GEMINI_API_KEY` |

### 2.4 Communication Vendors

| Vendor | Service | Data Access | Criticality | Env Vars |
|--------|---------|-------------|-------------|----------|
| **Microsoft (Graph API)** | Email sending (via MS_SENDER_UPN), Teams integration, M365 OAuth | Outbound email content, Teams channel messages, OAuth tokens | **High** — email sending and M365 integration depend on it | `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_SENDER_UPN`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI` |
| **Telegram** | Bot messaging, webhook notifications | Message content sent to/from the bot | **Low** — convenience feature, not core | `BOTFATHERTOKEN`, `TELEGRAM_WEBHOOK_SECRET` |

### 2.5 OAuth / Social Platform Vendors

| Vendor | Service | Data Access | Criticality | Env Vars |
|--------|---------|-------------|-------------|----------|
| **Google** | OAuth sign-in, Google Calendar, YouTube integration | User profile info, calendar events (if authorized) | **Medium** — one of several auth providers | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Meta (Facebook/Instagram)** | OAuth, social publishing (Fran agent) | User profile, pages, publishing permissions | **Medium** — required for Meta social features | `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` |
| **X (Twitter)** | OAuth, social publishing (Kelly agent) | User profile, posting permissions | **Low** — single social channel | `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`, `X_BEARER_TOKEN`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` |
| **Reddit** | OAuth, posting (Donna agent) | User profile, subreddit posting | **Low** — single social channel | `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI` |
| **LinkedIn** | OAuth, posting (Link agent) | User profile, company page posting | **Low** — single social channel | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` |
| **Pinterest** | OAuth, pin creation (Cornwall agent) | User profile, board/pin creation | **Low** — single social channel | `PINTEREST_APP_ID`, `PINTEREST_SECRET_KEY`, `PINTEREST_REDIRECT_URI` |
| **TikTok** | OAuth, video posting (Timmy agent) | User profile, video publishing | **Low** — single social channel | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` |
| **Tumblr** | OAuth 1.0a, posting (Terry agent) | User profile, blog posting | **Low** — single social channel | `TUMBLR_AUTH_KEY`, `TUMBLR_OAUTH_SECRET`, `TUMBLR_REDIRECT_URI` |
| **Discord** | Webhook integration | Inbound webhook payloads | **Low** — notification channel | `DISCORD_PUBLIC_KEY` |

---

## 3. Risk Classification

### 3.1 Classification Criteria

Each vendor is scored on three axes:

**Data Sensitivity** (what data does the vendor access?):
- **4 — Restricted:** Full database access, encryption keys, all tenant data (Supabase)
- **3 — Confidential:** Processes tenant business data in transit (Render, AI providers)
- **2 — Internal:** Receives limited operational data (Stripe event metadata, email content)
- **1 — Public:** No tenant data access (Vercel CDN serving static assets)

**Operational Dependency** (what breaks if this vendor goes down?):
- **4 — Total:** Entire platform is non-functional (Supabase, Render)
- **3 — Major:** Core feature set degraded (Stripe, OpenAI, Microsoft/email)
- **2 — Partial:** Specific feature unavailable, workaround exists (DeepSeek, Gemini)
- **1 — Minimal:** Cosmetic or convenience feature only (Telegram, individual social platforms)

**Replaceability** (how hard is it to switch vendors?):
- **4 — Locked in:** Migration would take months and significant rearchitecting (Supabase — Prisma schema, Pgbouncer, storage bucket)
- **3 — Difficult:** Migration is possible but requires significant effort (Render — env var management, worker config)
- **2 — Moderate:** Alternative providers exist with similar APIs (OpenAI to DeepSeek, Stripe)
- **1 — Easy:** Drop-in replacement possible (individual social platform APIs)

**Overall Risk Score:** Sum of three axes (3-12 scale)
- **10-12:** Critical risk — requires quarterly review, documented contingency plan
- **7-9:** High risk — requires semi-annual review
- **4-6:** Medium risk — requires annual review
- **3:** Low risk — reviewed during annual vendor audit

### 3.2 Current Risk Scores

| Vendor | Data | Dependency | Replaceability | Score | Rating |
|--------|------|------------|----------------|-------|--------|
| Supabase | 4 | 4 | 4 | **12** | Critical |
| Render | 3 | 4 | 3 | **10** | Critical |
| Stripe | 2 | 3 | 2 | **7** | High |
| OpenAI | 3 | 3 | 2 | **8** | High |
| Microsoft (Graph) | 2 | 3 | 2 | **7** | High |
| Vercel | 1 | 3 | 1 | **5** | Medium |
| DeepSeek | 3 | 2 | 1 | **6** | Medium |
| Google (Gemini) | 3 | 2 | 1 | **6** | Medium |
| OpenRouter | 3 | 2 | 1 | **6** | Medium |
| Cerebras | 3 | 1 | 1 | **5** | Medium |
| Google (OAuth) | 2 | 2 | 1 | **5** | Medium |
| Meta | 2 | 1 | 1 | **4** | Medium |
| Telegram | 1 | 1 | 1 | **3** | Low |
| X/Twitter | 1 | 1 | 1 | **3** | Low |
| Reddit | 1 | 1 | 1 | **3** | Low |
| LinkedIn | 1 | 1 | 1 | **3** | Low |
| Pinterest | 1 | 1 | 1 | **3** | Low |
| TikTok | 1 | 1 | 1 | **3** | Low |
| Tumblr | 1 | 1 | 1 | **3** | Low |
| Discord | 1 | 1 | 1 | **3** | Low |

---

## 4. Vendor Assessment Checklist

Before onboarding a new vendor or during scheduled reviews, complete the following:

### 4.1 Security Assessment

- [ ] Does the vendor have SOC 2 Type II or equivalent certification?
- [ ] Does the vendor encrypt data at rest (AES-256 or equivalent)?
- [ ] Does the vendor encrypt data in transit (TLS 1.2+)?
- [ ] Does the vendor support multi-factor authentication for admin access?
- [ ] Does the vendor have a documented incident response plan?
- [ ] Does the vendor provide breach notification within 72 hours?
- [ ] Does the vendor allow customer-managed encryption keys?
- [ ] Does the vendor publish a security whitepaper or trust center page?
- [ ] Has the vendor had any publicly disclosed breaches in the past 3 years?
- [ ] Does the vendor perform regular penetration testing?

### 4.2 Data Handling Assessment

- [ ] What specific data types does the vendor access or process?
- [ ] Where is data stored geographically? (Relevant for GDPR)
- [ ] Does the vendor use subprocessors? If so, are they disclosed?
- [ ] Does the vendor retain data after contract termination? For how long?
- [ ] Can data be exported or deleted on request?
- [ ] Does the vendor's data processing comply with GDPR Article 28 (processor obligations)?

### 4.3 Operational Assessment

- [ ] What is the vendor's published SLA for uptime?
- [ ] Does the vendor provide a public status page?
- [ ] What are the vendor's support response times?
- [ ] Does the vendor have a documented change management process?
- [ ] What is the vendor's disaster recovery capability (RTO/RPO)?

### 4.4 Contractual Assessment

- [ ] Is a Data Processing Agreement (DPA) in place?
- [ ] Is a Business Associate Agreement (BAA) required and in place? (for PHI)
- [ ] Are liability caps and indemnification terms acceptable?
- [ ] Is there a right-to-audit clause?
- [ ] What are the contract termination terms?

---

## 5. Data Processing Agreement (DPA) Status

| Vendor | DPA Required | DPA Status | BAA Required | BAA Status | Notes |
|--------|-------------|------------|-------------|------------|-------|
| Supabase | Yes | Standard DPA accepted on signup | No (no PHI today) | N/A | DPA covers GDPR processor obligations |
| Render | Yes | Standard DPA in Terms of Service | No | N/A | Data processed in US regions |
| Vercel | No (no tenant data) | N/A | No | N/A | Only serves static assets |
| Stripe | Yes | Standard DPA accepted | No | N/A | PCI DSS Level 1 certified |
| OpenAI | Yes | API Terms include data processing terms | No | N/A | Zero data retention API policy available |
| DeepSeek | Yes | Review required — China-based entity | No | N/A | GDPR adequacy decision status: review needed |
| Microsoft | Yes | Standard DPA (MSPA) | No | N/A | EU data boundary option available |
| Google | Yes | Standard DPA accepted | No | N/A | GDPR-compliant data processing |
| Meta | Yes | Platform Terms include data handling | No | N/A | Data minimization per Meta Platform Policy |
| Telegram | No (minimal data) | N/A | No | N/A | Only bot message content |

**Action items:**
- DeepSeek: Verify data processing terms and data residency. If prompts contain EU personal data, assess GDPR transfer mechanism (Standard Contractual Clauses or equivalent).
- OpenAI: Enable zero-data-retention option for API calls if not already active.
- All AI providers: Ensure terms prohibit using Atlas UX prompt data for model training.

---

## 6. Annual Review Schedule

| Quarter | Activity |
|---------|----------|
| **Q1 (January-March)** | Critical vendors (Supabase, Render): full reassessment. Review all DPAs. |
| **Q2 (April-June)** | High-risk vendors (Stripe, OpenAI, Microsoft): full reassessment. |
| **Q3 (July-September)** | Medium-risk vendors (Vercel, DeepSeek, Google, Meta, etc.): review. All vendor certifications verified. |
| **Q4 (October-December)** | Low-risk vendors (social platforms, Telegram, Discord): light review. Annual vendor audit report compiled. |

**Ad-hoc reviews triggered by:**
- Vendor security incident or public breach disclosure
- Significant change in vendor terms of service
- Vendor acquisition or merger
- Change in data shared with the vendor
- New regulatory requirement affecting the vendor relationship

---

## 7. Incident Notification Requirements

Each vendor must meet the following notification standards. Where vendor contracts do not explicitly guarantee these timelines, Atlas UX monitors vendor status pages and incident communications proactively.

| Vendor | Required Notification Timeline | Current Contractual Guarantee | Monitoring Approach |
|--------|-------------------------------|-------------------------------|---------------------|
| Supabase | Within 24 hours of confirmed breach | Per Supabase DPA | status.supabase.com + email alerts |
| Render | Within 24 hours of confirmed breach | Per Render ToS | status.render.com + email alerts |
| Stripe | Within 72 hours (per PCI DSS) | Per Stripe DPA | Stripe Dashboard alerts + webhook monitoring |
| OpenAI | Within 72 hours | Per OpenAI API Terms | status.openai.com + API error monitoring |
| Microsoft | Within 72 hours (per MSPA) | Yes, contractual | admin.microsoft.com + Service Health |

**If a vendor notifies Atlas UX of a breach:**
1. IC is notified immediately (per Incident Response Plan)
2. Assess whether Atlas UX tenant data was affected
3. If tenant data affected: trigger Atlas UX incident response (see `INCIDENT_RESPONSE.md`)
4. Determine if downstream breach notification to Atlas UX customers is required

---

## 8. Vendor Offboarding Procedures

When terminating a vendor relationship:

### 8.1 Pre-Termination (30 days before)

1. **Data export:** Extract all Atlas UX data from the vendor's systems
2. **Migration plan:** Replacement vendor identified and tested
3. **Secret rotation:** Identify all env vars and credentials associated with the vendor
4. **Dependency mapping:** Identify all code paths that call the vendor's API (check `backend/src/` routes, services, integrations, workers, and tools)
5. **Communication:** Notify internal team of the timeline

### 8.2 Termination Day

1. **Remove env vars:** Delete all vendor-specific env vars from Render (all 6 services) and Vercel
2. **Revoke credentials:** Revoke API keys, OAuth app credentials, and webhook secrets at the vendor
3. **Deploy code changes:** Remove or replace all vendor API calls in the codebase. If the feature is being removed entirely, add graceful error handling (return 503 with `vendor_unavailable` message)
4. **Verify:** Confirm all services restart cleanly without the vendor's env vars

### 8.3 Post-Termination (within 30 days)

1. **Data deletion confirmation:** Request written confirmation from the vendor that all Atlas UX data has been deleted from their systems
2. **Audit log:** Record the offboarding in `audit_log` with `action: VENDOR_OFFBOARDED`
3. **Update this document:** Remove the vendor from the inventory or mark as "Terminated"
4. **Contract closure:** Confirm final billing and close the account

### 8.4 Vendor-Specific Offboarding Notes

**Supabase (Critical — requires migration plan):**
- Export full database via `pg_dump`
- Migrate to alternative PostgreSQL host (e.g., AWS RDS, Neon, self-hosted)
- Update `DATABASE_URL` and `DIRECT_URL` on all Render services
- Migrate `kb_uploads` bucket contents to alternative object storage
- Update `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` references in `filesRoutes.ts`
- Estimated effort: 2-4 weeks with testing

**Render (Critical — requires migration plan):**
- Alternative: Railway, Fly.io, AWS ECS, or self-hosted
- Re-create all 6 services on the new platform
- Migrate all env vars (deduplicate, audit for stale values)
- Update CI/CD pipeline for new deployment target
- Update `render.yaml` equivalent for new platform
- Estimated effort: 1-2 weeks with testing

**Stripe (High — requires payment migration):**
- Alternative: Paddle, Braintree, or direct bank integration
- Migrate customer records and subscription state
- Update `stripeRoutes.ts`, `billingWebhookRoutes.ts`, `stripe.client.ts`, and `stripeCatalog.ts`
- Estimated effort: 2-3 weeks

**AI Provider (any):**
- AI providers are already abstracted in `backend/src/ai.ts` with multiple fallback providers
- Removing one provider: update `ai.ts` to remove the provider config, remove the env var
- Estimated effort: 1-2 days

---

## 9. Policy Maintenance

- This document is reviewed quarterly by the Compliance Officer
- Vendor inventory is updated whenever a new integration is added to the codebase
- DPA status is verified annually during the Q1 review cycle
- Risk scores are recalculated after any vendor incident or significant platform change

---

**Contact:**
- **Compliance:** compliance@atlasux.com
- **Security:** security@deadapp.info
- **Vendor inquiries:** compliance@atlasux.com

---

**End of Document**
