# Atlas UX -- Information Security Management System (ISMS) Scope Document

**Document ID:** ISMS-SCOPE-001
**Standard:** ISO/IEC 27001:2022
**Effective Date:** March 1, 2026
**Last Updated:** March 1, 2026
**Owner:** Billy E. Whited / DEAD APP CORP
**Platform:** [atlasux.cloud](https://www.atlasux.cloud)
**Version:** 1.0 (Initial Draft)
**Classification:** Internal

---

## Document Purpose

This document defines the scope of the Information Security Management System (ISMS) for Atlas UX, a product of DEAD APP CORP. It satisfies the requirements of ISO/IEC 27001:2022 Clauses 4.1 through 6.1.3, and establishes the foundation upon which a formal ISMS will be built.

**Maturity disclosure:** No formal ISMS exists today. This document establishes the scope for building one. All statements about current controls reference real, code-backed implementations documented in `policies/ISO27001_COMPLIANCE.md` and `policies/COMPLIANCE_INDEX.md`. Gaps are stated plainly.

---

## 1. Context of the Organization (Clause 4.1)

### 1.1 Organizational Profile

| Attribute | Detail |
|-----------|--------|
| Legal entity | DEAD APP CORP |
| Entity type | Missouri closed corporation, owned by THE DEAD APP CORP TRUST |
| Principal owner | Billy E. Whited |
| Industry | SaaS -- AI-powered employee productivity and autonomous agent orchestration |
| Stage | Startup / Alpha |
| Employees | Sole proprietor with AI agent workforce; no W-2 employees at time of writing |
| Product | Atlas UX -- full-stack AI employee productivity platform |
| Revenue model | B2B SaaS subscription (Stripe billing) |

### 1.2 What Atlas UX Does

Atlas UX is a multi-tenant platform that deploys autonomous AI agents to perform business tasks on behalf of its customers (tenants). The platform includes:

- A React 18 single-page application (SPA) and Electron desktop client
- A Fastify 5 API server running as four separate Render services (web API, engine worker, email worker, scheduler)
- Supabase-hosted PostgreSQL 16 database with Auth, Storage, and Row-Level Security
- AI inference via multiple providers (OpenAI, DeepSeek, OpenRouter, Cerebras, Google Gemini)
- 30+ named AI agents with email accounts, role definitions, and governance policies
- An autonomous engine loop that orchestrates agent actions every 5 seconds
- Integration with 15+ OAuth providers and external platforms
- Payment processing via Stripe (SAQ-A scope -- Atlas UX never handles card data)

### 1.3 Internal Context

**Strengths:**
- Code-backed security controls: JWT authentication, tenant isolation (application + RLS), audit logging, CORS whitelisting, CSP headers, rate limiting, input validation (Zod), CSRF protection (DB-backed synchronizer tokens)
- Governance policies enforced at execution time (SGL policy language, Execution Constitution, decision memo approval workflow)
- Safety guardrails: daily action caps, spend limits, recurring purchase blocks, risk-tier escalation
- Multi-framework compliance documentation covering SOC 2, ISO 27001, GDPR, HIPAA, PCI DSS, NIST 800-53, and HITRUST CSF
- All security controls are verifiable in the codebase with documented file paths

**Weaknesses:**
- Sole proprietor -- no separation of duties for human roles; single point of failure for operational knowledge
- No formal ISMS, no internal audit program, no management review cadence established
- No independent security assessment (penetration test, SOC 2 observation period) has been conducted
- No staging environment -- changes deploy directly from main branch to production
- No Data Protection Officer (DPO) appointed
- Some controls are partial or planned (see `ISO27001_COMPLIANCE.md` Section 6)

### 1.4 External Context

| Factor | Impact on ISMS |
|--------|---------------|
| AI regulation (EU AI Act, US executive orders) | Platform must demonstrate responsible AI governance; SGL policies and approval workflows provide foundation |
| Data protection laws (GDPR, state privacy laws) | Cross-border data transfers to AI providers (including DeepSeek in China) require transfer mechanisms; DSAR and consent management endpoints implemented |
| Cloud provider dependencies | Complete reliance on Render, Vercel, and Supabase; no owned infrastructure; vendor risk assessment process in place |
| Competitive pressure | Early-stage startup; speed of development sometimes prioritized over formal process maturity |
| Cybersecurity threat landscape | AI-powered platforms are high-value targets; autonomous agents expand the attack surface beyond traditional SaaS |

---

## 2. Needs and Expectations of Interested Parties (Clause 4.2)

### 2.1 Interested Parties Register

| Interested Party | Category | Needs and Expectations | ISMS Relevance |
|-----------------|----------|----------------------|----------------|
| **Customers (tenants)** | Primary users | Confidentiality of business data; availability of platform; data portability (GDPR Art. 20); right to erasure (Art. 17); transparent AI decision-making | Tenant isolation (RLS + application-level), DSAR endpoints, audit trail, consent management |
| **Billy E. Whited (owner)** | Owner / operator | Platform viability; regulatory compliance; protection of intellectual property; manageable risk exposure | All ISMS controls; risk management framework; business continuity |
| **GDPR supervisory authorities** | Regulator | Lawful processing; 72-hour breach notification; DPIA for high-risk processing; DPO appointment if required; data transfer safeguards | Breach register with deadline tracking, consent management, DSAR lifecycle; **Gap: no DPO, no DPIA conducted** |
| **US state regulators** | Regulator | Compliance with applicable state privacy laws (CCPA/CPRA, etc.) | DSAR endpoints support access, deletion, and portability requests |
| **AI providers (OpenAI, DeepSeek, OpenRouter, Cerebras, Google)** | Vendors / data processors | Compliance with their acceptable use policies; responsible data handling; no submission of prohibited content | SGL non-overridable prohibitions; prompt content may include tenant data; **Gap: no formal data processing agreements with all AI providers** |
| **Infrastructure providers (Render, Supabase, Vercel)** | Vendors / data processors | Payment for services; compliance with their ToS; shared responsibility model adherence | Vendor risk assessments documented in `VENDOR_MANAGEMENT.md`; all three are SOC 2 certified |
| **Stripe** | Payment processor | PCI DSS compliance; webhook security; API key protection | SAQ-A scope -- Stripe handles all card data; webhook signature verification implemented; API keys server-side only |
| **OAuth platform providers (Google, Microsoft, Meta, X, TikTok, etc.)** | Integration partners | Compliance with platform developer policies; secure token storage; OAuth consent flow adherence | Token vault with AES-256-GCM encryption; token lifecycle management; **Gap: several providers pending approval** |
| **Potential investors / acquirers** | Future stakeholders | Demonstrable security posture; SOC 2 readiness; clean audit trail | Compliance documentation; tamper-evident audit logging; vendor risk management |
| **Potential employees / contractors** | Future workforce | Clear security policies; defined roles and responsibilities | This ISMS scope document; role definitions in Section 8 |

### 2.2 Requirements Traceability

Each interested party's requirements are tracked to specific controls:

| Requirement Source | Requirement | Control Reference |
|-------------------|-------------|-------------------|
| GDPR Art. 5 | Lawful, fair, transparent processing | `policies/GDPR_COMPLIANCE.md`, consent endpoints |
| GDPR Art. 17 | Right to erasure | `DELETE /v1/compliance/dsar/:email/erase` |
| GDPR Art. 20 | Data portability | `GET /v1/compliance/dsar/:email/export` |
| GDPR Art. 33 | 72-hour breach notification | Breach register with deadline calculation |
| PCI DSS v4.0 | Protect cardholder data | Delegated to Stripe; SAQ-A scope |
| SOC 2 TSC CC6.1 | Logical access controls | `authPlugin.ts`, `tenantPlugin.ts`, RLS |
| ISO 27001 A.8.15 | Logging | `auditPlugin.ts`, hash-chained audit trail |

---

## 3. Scope of the ISMS (Clause 4.3)

### 3.1 Scope Statement

The ISMS covers the design, development, deployment, and operation of the **Atlas UX AI employee productivity platform**, including:

- All software components (frontend SPA, backend API, workers, Electron client)
- All data processed by the platform (tenant business data, user credentials, AI-generated content, audit logs, payment metadata)
- All cloud infrastructure services used to host and operate the platform
- All third-party integrations that process tenant data
- The governance and safety policies that constrain autonomous agent behavior
- The human and organizational processes involved in platform operation

### 3.2 Assets in Scope

#### 3.2.1 Application Services

| Service | Hosting | Description |
|---------|---------|-------------|
| Atlas UX Web Application | Vercel | React 18 SPA at `atlasux.cloud`; static assets served via Vercel CDN |
| Atlas UX API Server | Render (web service `srv-d62bnoq4d50c738b4e6g`) | Fastify 5 backend; 30+ route files mounted under `/v1`; handles all authenticated API traffic |
| Engine Worker | Render (worker service `srv-d6eoojkr85hc73frr5rg`) | Autonomous agent orchestration loop; ticks every 5 seconds; processes intents and executes agent actions |
| Email Worker | Render (worker service `srv-d6eoq07gi27c73ae4ing`) | Processes `EMAIL_SEND` jobs from the queue; sends via Microsoft Graph API |
| Scheduler Worker | Render (worker service `srv-d6fk5utm5p6s73bqrohg`) | Triggers scheduled workflows (daily intel sweeps, platform monitoring) |
| Electron Desktop App | End-user device | Optional desktop client; same SPA bundled with Electron; no additional backend |

#### 3.2.2 Data Stores

| Store | Provider | Data Types |
|-------|----------|------------|
| PostgreSQL 16 | Supabase (AWS us-east-1) | All tenant data, user accounts, audit logs, jobs, integrations, OAuth tokens (encrypted), CRM contacts, KB documents, decision memos, workflow state |
| Supabase Auth | Supabase | User authentication state, JWT signing keys, session metadata |
| Supabase Storage (`kb_uploads` bucket) | Supabase | Tenant-uploaded files; per-tenant path isolation (`tenants/{tenantId}/`) |
| Environment variables (185 vars) | Render, Vercel | API keys, database credentials, OAuth secrets, configuration; pushed to all 4 Render services |

#### 3.2.3 Third-Party Integrations (Data Processors)

| Category | Providers | Data Exchanged |
|----------|-----------|---------------|
| AI inference | OpenAI, DeepSeek, OpenRouter, Cerebras, Google Gemini | Prompt content (may include tenant business data, agent instructions, content drafts) |
| Email sending | Microsoft Graph API | Outbound email content, recipient addresses |
| Payment processing | Stripe | Payment intents, customer IDs, product/price metadata; **never** card numbers |
| OAuth / social platforms | Google, Microsoft, Meta, X, TikTok, LinkedIn, Reddit, Pinterest, Tumblr, Alignable, Telegram | OAuth tokens, profile data, published content, platform analytics |
| Communication | Telegram Bot API, Microsoft Teams (Graph API) | Message content, chat IDs |

#### 3.2.4 Governance Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| System Governance Language (SGL) | `policies/SGL.md` | Non-overridable execution boundaries for AI agents |
| Execution Constitution | `policies/EXECUTION_CONSTITUTION.md` | Agent execution rules and accountability chain |
| Compliance Framework Index | `policies/COMPLIANCE_INDEX.md` | Honest posture across 7 regulatory frameworks |
| ISO 27001 Compliance Mapping | `policies/ISO27001_COMPLIANCE.md` | Annex A control-by-control status |
| Risk Management Framework | `policies/RISK_MANAGEMENT.md` | Risk assessment methodology and register |
| Incident Response Plan | `policies/INCIDENT_RESPONSE.md` | P0-P3 severity definitions and procedures |
| Data Retention Policy | `policies/DATA_RETENTION.md` | Retention periods by data type |
| Vendor Management Policy | `policies/VENDOR_MANAGEMENT.md` | Third-party vendor risk assessment process |
| CLAUDE.md | `CLAUDE.md` | Mandatory development and operational rules |

### 3.3 Boundaries -- What Is Excluded

| Exclusion | Justification |
|-----------|---------------|
| Physical office security (ISO 27001 A.7.1-A.7.14) | DEAD APP CORP is a fully remote operation with no owned or leased office space. There is no physical infrastructure to secure. Physical security of data centers is delegated to infrastructure providers (Render, Vercel, Supabase/AWS), all of which hold SOC 2 Type II certification. |
| End-user device management (MDM) | Atlas UX is a web-based SaaS product accessed via standard browsers. The Electron desktop app is optional and runs on customer-owned devices. DEAD APP CORP does not manage, configure, or enforce policies on end-user devices. |
| Physical data center operations | All compute, storage, and networking is provided by cloud vendors. DEAD APP CORP has no physical access to any data center. |
| Customer internal security practices | Tenants are responsible for their own access credential management (passwords, MFA configuration via Supabase Auth), authorized user management within their tenant, and compliance with their own regulatory obligations. |
| Third-party SaaS applications used for internal business operations | At startup stage, no internal SaaS tools (HR systems, CRM, internal chat) are in use beyond the Atlas UX platform itself and standard developer tools (GitHub, VS Code). |

### 3.4 Interfaces and Dependencies

| Interface | Direction | Security Control |
|-----------|-----------|-----------------|
| Vercel CDN to end-user browser | Outbound | TLS 1.2+ (Vercel-managed), CSP headers, HSTS |
| Browser to Render API | Inbound | TLS 1.2+ (Render-managed), CORS whitelist, JWT authentication, tenant isolation, rate limiting |
| Render API to Supabase PostgreSQL | Outbound | TLS via Pgbouncer connection string, RLS policies, `withTenant()` session variable |
| Render API to Supabase Storage | Outbound | Supabase service role key (server-side only), signed URLs for client access |
| Render API to AI providers | Outbound | API key authentication, HTTPS |
| Render API to Microsoft Graph | Outbound | OAuth2 client_credentials flow, HTTPS |
| Stripe webhooks to Render API | Inbound | Webhook signature verification (`stripe.webhooks.constructEvent`) |
| Telegram webhooks to Render API | Inbound | Webhook secret validation |

---

## 4. Information Security Policy Statement (Clause 5.2)

### 4.1 Policy Statement

DEAD APP CORP is committed to protecting the confidentiality, integrity, and availability of all information processed, stored, and transmitted by the Atlas UX platform. This commitment extends to:

1. **Confidentiality:** Tenant data is isolated at both the application layer (`tenantPlugin`, `authPlugin`) and database layer (PostgreSQL Row-Level Security). OAuth tokens are encrypted at rest with AES-256-GCM. API keys and secrets are stored as environment variables, never in source code or client bundles.

2. **Integrity:** All API requests are logged to an audit trail. The audit trail is designed for tamper evidence (hash-chained audit logging is in the remediation pipeline). SGL policies prevent unauthorized modifications by AI agents. Decision memo approvals are required for high-risk actions.

3. **Availability:** The platform runs on redundant cloud infrastructure (Render container orchestration, Supabase managed PostgreSQL with automated backups, Vercel CDN). Service health is monitored via the `/health` endpoint. The engine loop has independent error isolation to prevent cascading failures.

### 4.2 Policy Commitments

DEAD APP CORP commits to:

- **Compliance:** Meeting all applicable legal, regulatory, and contractual obligations related to information security, including GDPR, applicable US state privacy laws, PCI DSS (via Stripe delegation), and platform provider terms of service.
- **Risk management:** Identifying, assessing, and treating information security risks using the methodology defined in `policies/RISK_MANAGEMENT.md`, with risk acceptance decisions documented and reviewed.
- **Continuous improvement:** Regularly reviewing and improving the ISMS through management reviews, internal audits (once established), incident post-mortems, and gap remediation cycles.
- **Awareness:** Ensuring that all parties with access to Atlas UX systems understand their security responsibilities, whether human operators or AI agents (via SGL policy enforcement).
- **Proportionality:** Implementing controls appropriate to a startup-stage organization, scaling security investment as the business grows.

### 4.3 Policy Communication

This policy is:
- Published in the project repository (`policies/ISMS_SCOPE.md`) and accessible to all contributors
- Referenced by `CLAUDE.md` mandatory build rules that govern all code changes
- Enforced at runtime by SGL policies and platform safety guardrails
- Subject to review at each management review cycle (see Section 7.3)

---

## 5. Risk Assessment Methodology (Clause 6.1.2)

### 5.1 Methodology Reference

The risk assessment methodology is fully defined in `policies/RISK_MANAGEMENT.md`. This section summarizes the key parameters for ISMS scope purposes.

### 5.2 Risk Assessment Approach

Atlas UX uses a **qualitative risk assessment** based on a 5x5 likelihood-by-impact matrix.

**Likelihood scale (1-5):** Rare, Unlikely, Possible, Likely, Almost Certain
**Impact scale (1-5):** Negligible, Minor, Moderate, Major, Catastrophic

**Risk Score = Likelihood x Impact** (range 1-25)

### 5.3 Risk Rating Thresholds

| Rating | Score Range | Treatment Requirement |
|--------|-----------|----------------------|
| Critical | 12-25 | Immediate treatment required; cannot be accepted without owner sign-off |
| High | 8-11 | Treatment plan within 30 days |
| Medium | 4-7 | Treatment plan within 90 days |
| Low | 1-3 | Monitor; treatment optional |

### 5.4 Risk Acceptance Criteria

- **Low risks (1-3):** May be accepted by the Information Security Officer without further justification.
- **Medium risks (4-7):** May be accepted with documented rationale, reviewed at next management review.
- **High risks (8-11):** May only be accepted with explicit owner (Billy E. Whited) approval and documented compensating controls.
- **Critical risks (12-25):** Cannot be accepted. Must be treated (mitigated, transferred, or avoided). If treatment is not immediately possible, an interim risk reduction plan must be documented with a target completion date.

### 5.5 Risk Treatment Options

For each identified risk, one or more of the following treatment options is selected:

1. **Mitigate:** Implement controls to reduce likelihood or impact (e.g., add input validation, enable RLS FORCE)
2. **Transfer:** Shift risk to a third party (e.g., Stripe handles PCI DSS; infrastructure providers handle physical security)
3. **Avoid:** Eliminate the activity that creates the risk (e.g., SGL blocks recurring purchases by default)
4. **Accept:** Acknowledge and monitor the risk when treatment cost exceeds the risk exposure, subject to acceptance criteria above

### 5.6 Risk Assessment Schedule

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Full risk assessment | Annually (next: March 2027) | Information Security Officer |
| Risk register review | Quarterly | Information Security Officer |
| Risk assessment triggered by major change | Ad hoc (new vendor, architecture change, security incident) | Information Security Officer |
| Compliance dashboard review | Monthly | Information Security Officer |

---

## 6. Statement of Applicability (Clause 6.1.3d)

### 6.1 Reference Document

The full control-by-control applicability assessment is maintained in `policies/ISO27001_COMPLIANCE.md`, which maps all 93 Annex A controls to their implementation status, evidence files, and gap remediation plans.

### 6.2 Applicability Summary

| Control Theme | Total | Applicable | Implemented | Partial | Planned | N/A | Justification for N/A |
|--------------|-------|------------|-------------|---------|---------|-----|----------------------|
| A.5 Organizational (37) | 37 | 34 | 25 | 5 | 4 | 3 | A.5.6 (special interest groups): no memberships; A.6.1-A.6.2 (screening/employment terms): sole proprietor, no employees |
| A.6 People (8) | 8 | 6 | 1 | 4 | 1 | 2 | A.6.1 (screening), A.6.2 (employment terms): no employees; organizational HR processes outside codebase |
| A.7 Physical (14) | 14 | 0 | 0 | 0 | 0 | 14 | Fully remote, no owned infrastructure; delegated to SOC 2 Type II certified providers (Render, Vercel, Supabase/AWS) |
| A.8 Technological (34) | 34 | 34 | 16 | 13 | 5 | 0 | All technological controls applicable to a cloud-native SaaS |
| **Totals** | **93** | **74** | **42** | **22** | **10** | **19** | |

### 6.3 Controls Excluded with Justification

| Control ID | Control Name | Exclusion Justification |
|------------|-------------|------------------------|
| A.5.6 | Contact with special interest groups | DEAD APP CORP holds no memberships in security-relevant special interest groups. Will reassess as the organization scales. |
| A.6.1 | Screening | DEAD APP CORP is a sole proprietorship with no employees. The owner is the sole human operator. Screening will be implemented when hiring begins. |
| A.6.2 | Terms and conditions of employment | No employment relationships exist. Will be addressed when hiring begins. |
| A.7.1 | Physical security perimeters | No owned or leased physical premises. All infrastructure is cloud-hosted. Physical security is the responsibility of Render (SOC 2), Vercel (SOC 2), and Supabase/AWS (SOC 2, ISO 27001). |
| A.7.2 | Physical entry controls | Same as A.7.1. |
| A.7.3 | Securing offices, rooms and facilities | Same as A.7.1. |
| A.7.4 | Physical security monitoring | Same as A.7.1. |
| A.7.5 | Protecting against physical and environmental threats | Same as A.7.1. |
| A.7.6 | Working in secure areas | Same as A.7.1. |
| A.7.7 | Clear desk and clear screen | Sole proprietor working remotely; organizational policy, not a technical control. Low risk given no shared office. |
| A.7.8 | Equipment siting and protection | No owned data center equipment. |
| A.7.9 | Security of assets off-premises | No company-owned portable assets. |
| A.7.10 | Storage media | All data stored in cloud databases and object storage; no removable media. |
| A.7.11 | Supporting utilities | Delegated to cloud infrastructure providers. |
| A.7.12 | Cabling security | Delegated to cloud infrastructure providers. |
| A.7.13 | Equipment maintenance | No owned equipment requiring maintenance. |
| A.7.14 | Secure disposal or re-use of equipment | No owned equipment to dispose of. |

### 6.4 Key Applicable Controls -- Current Status

The following controls are applicable and represent the current security posture:

**Fully Implemented (42 controls):** These controls have verifiable code-level implementations. Key examples:
- A.5.15 Access control (JWT auth + tenant membership)
- A.5.16 Identity management (Supabase Auth + auto-provisioned user records)
- A.8.5 Secure authentication (bearer tokens validated on every request)
- A.8.15 Logging (audit plugin captures every API request)
- A.8.27 Secure system architecture (multi-tenancy, plugin architecture, RLS)
- A.8.22 Segregation of networks (4 independent Render services)

**Partial (22 controls):** Implementations exist but have documented gaps. Key examples:
- A.8.3 Information access restriction (RLS enabled but not forced; `FORCE ROW LEVEL SECURITY` pending)
- A.8.24 Use of cryptography (OAuth tokens encrypted; no application-level encryption at rest for all data)
- A.8.25 Secure development life cycle (CLAUDE.md rules exist; no automated SAST/DAST)
- A.8.31 Separation of environments (dev vs prod environment variables; no formal staging)

**Planned (10 controls):** Not yet implemented. Key examples:
- A.5.12/A.5.13 Data classification and labeling
- A.5.30 ICT readiness for business continuity (no formal BC plan)
- A.8.8 Vulnerability management (no automated scanning)
- A.8.29 Security testing in development (no SAST/DAST in CI)
- A.8.33 Test information management

---

## 7. Management Commitment (Clause 5.1)

### 7.1 Leadership Commitment

Billy E. Whited, as sole owner and operator of DEAD APP CORP, commits to:

1. **Establishing the ISMS:** This document initiates the formal ISMS scope definition. The ISMS will be built incrementally, starting with the highest-risk gaps identified in `policies/ISO27001_COMPLIANCE.md` Section 6.
2. **Providing resources:** Allocating development time and, where necessary, financial resources to implement security controls and close identified gaps.
3. **Communicating the importance of information security:** All code-level governance (CLAUDE.md, SGL, Execution Constitution) reflects the commitment that security is not optional.
4. **Ensuring the ISMS achieves its intended outcomes:** Tracking control implementation against the remediation timeline in `ISO27001_COMPLIANCE.md` Section 9.
5. **Supporting continuous improvement:** Conducting management reviews, acting on incident post-mortems, and updating policies as the platform evolves.

### 7.2 Resource Allocation

| Resource | Current State | Planned |
|----------|--------------|---------|
| Personnel | Owner (Billy E. Whited) handles all security functions | Appoint DPO and expand team as revenue allows |
| Budget | Bootstrap; no dedicated security budget | Allocate security line item when Series A or revenue milestones are reached |
| Tools | GitHub (source control), Render/Vercel/Supabase (infrastructure), npm audit (manual) | Automated SAST/DAST in CI, vulnerability scanning, log aggregation |
| Time | Security work integrated into development sprints | Dedicated security review time each quarter |

### 7.3 Management Review Cadence

| Review | Frequency | Participants | Inputs | Outputs |
|--------|-----------|-------------|--------|---------|
| ISMS Management Review | Quarterly (first review: June 2026) | Billy E. Whited (owner) | Compliance dashboard data, incident reports, risk register, audit findings, gap remediation progress | Updated risk treatment plans, resource allocation decisions, policy updates |
| Compliance Dashboard Review | Monthly | Billy E. Whited | `GET /v1/compliance/dashboard` output, DSAR status, breach deadlines, vendor reassessment status | Action items for overdue items |
| Incident Post-Mortem | After every P0/P1 incident | Billy E. Whited + relevant technical contributors | Incident report, root cause analysis, timeline | Lessons learned, preventive actions, policy updates |
| Annual ISMS Scope Review | Annually (next: March 2027) | Billy E. Whited | Business changes, new regulations, vendor changes, architecture changes | Updated ISMS scope document, updated Statement of Applicability |

**Honest assessment:** With a sole proprietor, these reviews are self-reviews. This is a recognized weakness. As the organization grows, independent review participants will be added. Until then, the compliance dashboard API endpoint (`GET /v1/compliance/dashboard`) provides objective, data-driven input that reduces reliance on subjective self-assessment.

---

## 8. Roles and Responsibilities

### 8.1 Current Roles

| Role | Assigned To | Responsibilities |
|------|------------|-----------------|
| **Information Security Officer (ISO)** | Billy E. Whited | Overall ISMS ownership; risk assessment and treatment decisions; incident response coordination; policy authorship and review; vendor risk assessment; compliance dashboard monitoring; management review execution |
| **Data Protection Officer (DPO)** | **Not yet appointed** | GDPR Art. 37-39 responsibilities: advising on data protection obligations, monitoring compliance, cooperating with supervisory authorities, conducting DPIAs. **Gap: will be appointed when processing scale or regulatory requirement triggers the obligation.** |
| **Development Team** | Billy E. Whited + AI coding assistants (Claude Code, Windsurf, Cursor) | Secure development practices per CLAUDE.md; implementing security controls in code; build verification before commit; no stub code; correct Prisma/Fastify patterns |
| **Incident Response Lead** | Billy E. Whited | First responder for all P0-P3 incidents per `policies/INCIDENT_RESPONSE.md`; containment, investigation, recovery, post-mortem |
| **System Administrator** | Billy E. Whited | Render/Vercel/Supabase service management; environment variable management (185 vars across 4 services); deployment oversight; database migration execution |

### 8.2 AI Agent Security Roles

Atlas UX is unique in that its "workforce" consists of autonomous AI agents governed by security policies. The following agents have security-relevant roles:

| Agent | Role | Security Responsibility |
|-------|------|------------------------|
| Atlas | CEO / orchestrator | Executes WF-106 daily aggregation; all agent actions subject to SGL policy evaluation |
| Tina | CFO | Financial risk assessment; spend approval above `AUTO_SPEND_LIMIT_USD` |
| Jenny | CLO (Chief Legal Officer) | Legal compliance review; SGL blocks statutory violations |
| Benny | IP Specialist | Intellectual property protection; SGL blocks copyright/trademark infringement |
| Cheryl | Customer Support | Handles support interactions; bound by SGL customer data handling rules |

All AI agents are constrained by:
- SGL non-overridable prohibitions (cannot be bypassed by any actor, including the owner)
- `MAX_ACTIONS_PER_DAY` daily action cap
- `AUTO_SPEND_LIMIT_USD` spend limit requiring human approval
- Decision memo approval workflow for risk tier >= 2 actions
- Audit logging of every action

### 8.3 Responsibility Matrix (RACI)

| Activity | Owner (B. Whited) | DPO (TBD) | AI Agents |
|----------|-------------------|-----------|-----------|
| ISMS scope definition | A/R | C (when appointed) | -- |
| Risk assessment | A/R | C | -- |
| Security control implementation | A/R | -- | -- |
| Incident response | A/R | I | -- |
| DSAR processing | A/R | R (when appointed) | -- |
| Audit log monitoring | A/R | -- | I (AgentWatcher) |
| Vendor assessment | A/R | C | -- |
| Policy review | A/R | R (when appointed) | -- |
| Daily platform operations | A | -- | R (via engine loop) |
| Compliance dashboard review | A/R | I | -- |

**Legend:** A = Accountable, R = Responsible, C = Consulted, I = Informed

### 8.4 Future Roles (Planned)

As DEAD APP CORP scales, the following roles will be established:

1. **Data Protection Officer (DPO):** First hire priority for compliance. Required if processing activities reach GDPR Art. 37 thresholds.
2. **Security Engineer:** Dedicated to SAST/DAST pipeline, vulnerability management, penetration testing coordination.
3. **Internal Auditor:** Independent of development; conducts ISMS internal audits per ISO 27001 Clause 9.2.
4. **Compliance Analyst:** Manages vendor assessments, DSAR lifecycle, breach reporting deadlines.

---

## 9. ISMS Implementation Roadmap

### 9.1 Current State (March 2026)

- 42 of 74 applicable Annex A controls fully implemented (57%)
- 22 controls partially implemented (30%)
- 10 controls planned (13%)
- No formal ISMS processes (internal audit, management review, corrective action)
- Risk management framework documented but not yet exercised through a formal cycle
- Incident response plan documented but not tested

### 9.2 Phase 1: Foundation (Q1-Q2 2026)

| Milestone | Target | Status |
|-----------|--------|--------|
| ISMS scope document (this document) | March 2026 | Complete |
| ISO 27001 Annex A control mapping | March 2026 | Complete (`ISO27001_COMPLIANCE.md`) |
| Risk management framework | February 2026 | Complete (`RISK_MANAGEMENT.md`) |
| Incident response plan | February 2026 | Complete (`INCIDENT_RESPONSE.md`) |
| Hash-chained audit logs | March 2026 | Remediation in progress |
| CSRF protection (DB-backed) | March 2026 | Remediation in progress |
| Session termination / token blacklist | March 2026 | Remediation in progress |
| First management review | June 2026 | Scheduled |

### 9.3 Phase 2: Hardening (Q3-Q4 2026)

| Milestone | Target |
|-----------|--------|
| `FORCE ROW LEVEL SECURITY` on all tables | Q3 2026 |
| Automated SAST/DAST in CI pipeline | Q3 2026 |
| Formal staging environment | Q3 2026 |
| First internal audit | Q4 2026 |
| DPO appointment (if required by scale) | Q4 2026 |
| First penetration test | Q4 2026 |
| Data classification scheme implemented | Q4 2026 |

### 9.4 Phase 3: Certification Readiness (2027)

| Milestone | Target |
|-----------|--------|
| All "Planned" controls implemented | Q1 2027 |
| SOC 2 Type II observation period started | Q1 2027 |
| Full ISMS internal audit cycle completed | Q2 2027 |
| ISO 27001 Stage 1 audit (documentation review) | Q3 2027 |
| ISO 27001 Stage 2 audit (implementation verification) | Q4 2027 |

---

## 10. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | March 1, 2026 | Billy E. Whited | Initial ISMS scope document |

### 10.1 Review Schedule

This document will be reviewed:
- At each quarterly ISMS management review
- Whenever there is a significant change to the organization, its context, or interested party requirements
- At minimum annually (next annual review: March 2027)

### 10.2 Related Documents

| Document | Location | Relationship |
|----------|----------|-------------|
| ISO 27001 Compliance Mapping | `policies/ISO27001_COMPLIANCE.md` | Statement of Applicability detail |
| Compliance Framework Index | `policies/COMPLIANCE_INDEX.md` | Cross-framework compliance status |
| Risk Management Framework | `policies/RISK_MANAGEMENT.md` | Risk assessment methodology (referenced in Section 5) |
| Incident Response Plan | `policies/INCIDENT_RESPONSE.md` | Incident handling procedures |
| Data Retention Policy | `policies/DATA_RETENTION.md` | Data lifecycle management |
| Vendor Management Policy | `policies/VENDOR_MANAGEMENT.md` | Third-party risk management |
| SGL Policy | `policies/SGL.md` | AI agent governance |
| Execution Constitution | `policies/EXECUTION_CONSTITUTION.md` | Agent execution boundaries |
| GDPR Compliance | `policies/GDPR_COMPLIANCE.md` | Data protection controls |
| SOC 2 Compliance | `policies/SOC2_COMPLIANCE.md` | Trust Services Criteria mapping |
| CLAUDE.md | `CLAUDE.md` | Development security rules |

---

**Approved by:** Billy E. Whited, Owner, DEAD APP CORP
**Date:** March 1, 2026
**Next Review:** June 1, 2026 (first quarterly management review)
