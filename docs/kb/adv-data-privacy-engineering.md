# Privacy Engineering & Data Protection

## Overview

Atlas UX processes sensitive business data across multi-tenant environments with autonomous AI agents. Privacy engineering is not an afterthought — it is an architectural requirement. This document covers privacy-by-design principles, anonymization techniques, consent management, data subject rights automation, and the specific patterns Atlas UX agents follow when handling personal data.

---

## Privacy by Design — The 7 Foundational Principles

Ann Cavoukian's Privacy by Design framework, now codified in GDPR Article 25, establishes seven principles that must be embedded into every system handling personal data.

### 1. Proactive Not Reactive; Preventative Not Remedial

Anticipate and prevent privacy violations before they occur. Do not wait for breaches or complaints.

**Atlas UX implementation:** The SGL governance policies define pre-execution checks. Every agent action involving personal data triggers a PII detection scan before execution, not after. The engine loop blocks actions that would expose personal data without explicit authorization.

### 2. Privacy as the Default Setting

Personal data must be automatically protected in any system. Users should not have to take action to protect their privacy.

**Atlas UX implementation:** All new tenants start with maximum privacy settings. Data sharing between agents requires explicit configuration. Audit log entries redact PII by default, storing only hashed identifiers unless the tenant enables verbose logging.

### 3. Privacy Embedded into Design

Privacy is integral to the system architecture, not an add-on.

**Atlas UX implementation:** Multi-tenancy with `tenant_id` on every table ensures data isolation at the schema level. Prisma middleware enforces tenant scoping on every query. Supabase RLS provides a second layer of database-level isolation.

### 4. Full Functionality — Positive-Sum, Not Zero-Sum

Privacy and functionality are not tradeoffs. Systems must deliver both.

**Atlas UX implementation:** Agents can perform their full function using anonymized or pseudonymized data. Analytics pipelines operate on aggregated metrics, not individual records. No agent capability is reduced by privacy controls.

### 5. End-to-End Security — Full Lifecycle Protection

Data is protected from collection through deletion with no gaps.

**Atlas UX implementation:** Data at rest is encrypted (Supabase AES-256). Data in transit uses TLS 1.3. Data in processing is scoped to the minimum necessary fields. Data retention policies auto-delete records past their purpose window.

### 6. Visibility and Transparency

Operations on personal data must be visible to stakeholders and subject to independent verification.

**Atlas UX implementation:** The audit trail logs every data access, transformation, and deletion with timestamps, actor IDs, and justifications. Tenants can export their complete audit history at any time.

### 7. Respect for User Privacy

User interests are paramount. Systems must offer strong defaults, appropriate notice, and empowering options.

**Atlas UX implementation:** Users control what data agents can access via granular permission settings. Data access requests are processed within 24 hours via automated workflows.

---

## Data Minimization

### Principle

Collect and process only the minimum personal data necessary for the stated purpose. Every field of personal data must justify its existence.

### Techniques

1. **Field-level minimization**: Only request fields the current operation needs. If an agent needs to send an email, it needs the email address — not the full contact profile.

2. **Temporal minimization**: Delete or anonymize data as soon as the purpose is fulfilled. A support ticket's personal details can be anonymized once resolved and past the appeal window.

3. **Access minimization**: Agents only receive data relevant to their role. Tina (CFO) sees financial data but not support ticket contents. Cheryl (Support) sees ticket details but not financial projections.

4. **Precision minimization**: Use the least precise data that serves the purpose. For geographic analytics, use city-level data instead of exact addresses.

### Implementation in Agent Prompts

```
SYSTEM: You are processing a support request.
DATA POLICY: You will receive only the fields necessary for this task.
- You have: ticket_id, category, message_text, created_at
- You do NOT have and MUST NOT request: customer_name, email, phone, address
- If resolution requires PII, escalate to human with reason code PII_REQUIRED
```

---

## Purpose Limitation

Data collected for one purpose must not be repurposed without consent. Atlas UX enforces this at the system level:

- Each data collection point documents its purpose in the schema (via Prisma model comments)
- Agent tool definitions specify what data they can access and why
- Cross-purpose data access triggers a decision memo requiring human approval
- The audit log captures the stated purpose for every data access event

### Purpose Registry

```
Purpose: customer_support
  Allowed data: ticket content, interaction history, product info
  Allowed agents: cheryl, atlas (escalation only)
  Retention: 2 years post-resolution

Purpose: financial_reporting
  Allowed data: transaction amounts, dates, categories (no PII)
  Allowed agents: tina, larry
  Retention: 7 years (tax compliance)

Purpose: content_marketing
  Allowed data: aggregate engagement metrics, anonymized demographics
  Allowed agents: sunday, binky, social publishers
  Retention: 1 year rolling
```

---

## Anonymization Techniques

### K-Anonymity

A dataset satisfies k-anonymity if every record is indistinguishable from at least k-1 other records on quasi-identifier attributes.

**Quasi-identifiers**: Attributes that, in combination, could identify an individual (age, zip code, gender, job title).

**Technique**: Generalize or suppress quasi-identifiers until each combination appears at least k times.

```
Before (k=1, identifiable):
| Age | Zip   | Diagnosis |
| 29  | 10001 | Flu       |
| 29  | 10001 | COVID     |

After (k=2, generalized):
| Age   | Zip   | Diagnosis |
| 25-30 | 100** | Flu       |
| 25-30 | 100** | COVID     |
```

**Atlas UX use case**: Analytics dashboards generalize user attributes to ensure k >= 5 before displaying demographic breakdowns.

### L-Diversity

Extends k-anonymity by requiring that each equivalence class contains at least l distinct values for the sensitive attribute. Prevents homogeneity attacks where all records in a group share the same sensitive value.

### T-Closeness

Requires that the distribution of the sensitive attribute within each equivalence class is within threshold t of the attribute's distribution in the overall dataset. Prevents skewness attacks.

### Practical Guidance

- K-anonymity alone is insufficient for strong privacy. Combine with l-diversity at minimum.
- For Atlas UX agent analytics, apply k >= 10, l >= 3, and t <= 0.15.
- Re-anonymization is required when new data is appended (quasi-identifiers may become unique).

---

## Pseudonymization

### Definition

Replace identifying fields with artificial identifiers (pseudonyms) that can be reversed only with a separately stored mapping key.

### Implementation

```
Original: { name: "Jane Doe", email: "jane@acme.com", action: "purchased" }
Pseudonymized: { id: "PSE-a7f3b2", email_hash: "8f14e45f", action: "purchased" }
Mapping (stored separately): { "PSE-a7f3b2": { name: "Jane Doe", email: "jane@acme.com" } }
```

### Atlas UX Approach

- Pseudonymization mapping keys are stored in a separate database table (`pii_mappings`) with tenant-level encryption
- Agent prompts receive only pseudonymized data unless the task explicitly requires real identifiers (e.g., sending an email)
- The mapping table has its own access controls, separate from the main application
- Reversibility enables compliance with data subject access requests

---

## Differential Privacy

### Concept

Add calibrated statistical noise to query results so that the presence or absence of any single individual's data cannot be determined from the output.

### Epsilon (Privacy Budget)

- Lower epsilon = more privacy, less accuracy
- epsilon < 1.0: Strong privacy (recommended for sensitive data)
- epsilon 1.0-3.0: Moderate privacy (acceptable for most analytics)
- epsilon > 3.0: Weak privacy (use only for non-sensitive aggregates)

### Application in Atlas UX

When agents generate reports on user behavior metrics:
```
Query: "Average session duration for enterprise tier"
True answer: 14.3 minutes
Noise mechanism: Laplace(sensitivity/epsilon) = Laplace(0.5/1.0)
Reported answer: 14.3 + noise = 14.7 minutes (±0.5 with 95% confidence)
```

This prevents inferring whether a specific user's data is in the dataset while still providing actionable analytics.

---

## Consent Management

### Consent Models

| Model | Description | Use Case |
|---|---|---|
| **Opt-in** | User must explicitly consent before processing | Marketing emails, analytics tracking |
| **Opt-out** | Processing occurs by default; user can withdraw | Service-related communications |
| **Granular** | User consents to specific purposes individually | Data sharing between agents, third-party integrations |
| **Layered** | Summary consent with detailed policy accessible | Initial onboarding flow |

### Consent Record Schema

```prisma
model ConsentRecord {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String
  purpose     String   // "marketing", "analytics", "agent_processing"
  granted     Boolean
  mechanism   String   // "checkbox", "api", "verbal"
  version     String   // Policy version consented to
  grantedAt   DateTime
  revokedAt   DateTime?
  ipAddress   String?
  userAgent   String?
}
```

### Agent Behavior

Before any agent processes data that requires consent:
1. Check `ConsentRecord` for the user + purpose combination
2. If no consent exists or consent is revoked, block the action
3. Log the consent check result to the audit trail
4. If action is blocked, suggest the user request consent via the appropriate channel

---

## Data Subject Rights Automation

GDPR Articles 15-22 and equivalent regulations grant individuals rights over their personal data. Atlas UX automates these.

### Right of Access (Art. 15)

**Workflow**: User submits access request via portal or email. Automated pipeline:
1. Verify identity (multi-factor)
2. Query all tables containing user's data (using `pii_mappings` lookup)
3. Compile into structured export (JSON + human-readable PDF)
4. Deliver within 24 hours (regulatory max: 30 days)

### Right to Rectification (Art. 16)

**Workflow**: User identifies incorrect data. Agent updates all instances across all tables in a single transaction, logs the change with before/after values in the audit trail.

### Right to Erasure (Art. 17)

**Workflow**: "Right to be forgotten" request triggers:
1. Delete all personal data from active tables
2. Delete the `pii_mappings` entry
3. Anonymize (not delete) audit trail entries (replace PII with "[REDACTED]")
4. Notify all integrated third-party services of deletion requirement
5. Retain anonymized records only where legally required (financial records)

### Right to Data Portability (Art. 20)

**Workflow**: Export user data in machine-readable format (JSON). Include all data the user provided plus data derived from their activity. Deliver as a downloadable file via signed URL (24-hour expiry).

---

## Privacy Impact Assessments (PIAs)

### When Required

- New agent capability that processes personal data
- New third-party integration
- Change in data retention policy
- New cross-border data transfer
- Any processing likely to result in high risk to individuals

### PIA Template

```markdown
## Privacy Impact Assessment: [Feature Name]
**Date**: YYYY-MM-DD
**Assessor**: [Name]

### 1. Data Flow
- What personal data is collected?
- Where does it flow (systems, agents, third parties)?
- Who has access?

### 2. Necessity and Proportionality
- Is the data collection necessary for the stated purpose?
- Could the purpose be achieved with less data?
- Is the processing proportionate to the benefit?

### 3. Risk Assessment
- Likelihood of unauthorized access: [Low/Medium/High]
- Impact of unauthorized access: [Low/Medium/High]
- Likelihood of purpose drift: [Low/Medium/High]

### 4. Mitigations
- [List specific technical and organizational measures]

### 5. Residual Risk
- [Risk level after mitigations]

### 6. Approval
- [ ] DPO reviewed
- [ ] Engineering lead reviewed
- [ ] Legal reviewed
```

---

## Data Processing Agreements (DPAs)

For every third-party service that processes personal data on behalf of Atlas UX tenants:

- **Supabase**: Data processor for database storage. DPA covers encryption at rest, data center locations, breach notification (72 hours), sub-processor management.
- **OpenAI/DeepSeek/OpenRouter**: Data processors for AI inference. DPAs must specify data retention (zero retention preferred), training opt-out, geographic processing restrictions.
- **Render**: Data processor for compute. DPA covers server-side encryption, access controls, incident response.
- **Vercel**: Data processor for frontend hosting. DPA covers CDN edge caching, log retention, geographic distribution.

### Key DPA Clauses

1. Processing only on documented instructions
2. Confidentiality obligations for personnel
3. Security measures (Article 32 GDPR)
4. Sub-processor management with notification rights
5. Assistance with data subject rights
6. Deletion or return of data on termination
7. Audit rights

---

## Cross-Border Data Transfers

### Mechanism Selection

| Transfer Scenario | Mechanism |
|---|---|
| EU to US (Supabase, OpenAI, Render) | EU-US Data Privacy Framework + SCCs fallback |
| EU to EU | No additional mechanism needed |
| Any to adequate country | Adequacy decision suffices |
| Any to non-adequate country | Standard Contractual Clauses (SCCs) + Transfer Impact Assessment |

### Transfer Impact Assessment

For each cross-border transfer:
1. Identify the destination country's surveillance laws
2. Assess whether the transferred data is within scope of those laws
3. Determine if supplementary measures can mitigate the risk
4. Document the assessment and review annually

---

## Privacy-Preserving Analytics

### Techniques for Agent Analytics

1. **Aggregation**: Report metrics at cohort level (never individual). Minimum cohort size: 10 users.
2. **Differential privacy**: Apply noise to all queries over personal data (see section above).
3. **Federated analytics**: Compute metrics locally per tenant, only share aggregated results. No raw data leaves the tenant boundary.
4. **Synthetic data**: Generate statistically representative datasets for testing and development that contain no real personal data.
5. **Secure computation**: For cross-tenant analytics (benchmarking), use secure multi-party computation so no party sees another's raw data.

---

## How Agents Handle Personal Data

### Agent Data Access Protocol

Every Atlas UX agent follows this protocol when any task involves personal data:

1. **Classify**: Identify whether the data contains PII (names, emails, phone numbers, addresses, financial info, health data, biometric data).
2. **Minimize**: Request only the fields needed for the specific task.
3. **Check consent**: Verify the data subject has consented to this processing purpose.
4. **Process**: Perform the task using pseudonymized data where possible.
5. **Log**: Record the access, purpose, and fields accessed in the audit trail.
6. **Purge**: Clear any cached personal data from the agent's context after task completion.
7. **Report**: If a potential privacy violation is detected, immediately escalate via decision memo.

### PII Detection in Agent Prompts

Agents include a PII detection instruction in their system prompts:
```
PRIVACY DIRECTIVE: Before processing any input, scan for personal data:
- Names, email addresses, phone numbers, physical addresses
- Financial account numbers, SSNs, government IDs
- Health information, biometric data
- Any data that could identify a natural person

If PII is detected and not required for the stated task purpose:
1. Flag the PII fields in your reasoning
2. Process using only non-PII fields
3. If PII is essential, log the justification
4. Never store PII in your output unless the output purpose requires it
```

### Incident Response for Privacy Breaches

If an agent detects or causes a privacy breach:
1. Immediately halt processing
2. Create a critical-severity audit log entry
3. Trigger notification to the tenant admin and DPO
4. Preserve all evidence (do not delete or modify any data)
5. Generate an incident report within 1 hour
6. Regulatory notification assessment within 24 hours (72-hour GDPR deadline)
