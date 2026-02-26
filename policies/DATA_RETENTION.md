# Atlas UX — Data Retention & Deletion Policy

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026
**Product:** Atlas UX
**Owner:** DEAD APP CORP
**Scope:** All systems that collect, process, store, or transmit user data or Meta Platform Data

---

## 1. Purpose

This Data Retention & Deletion Policy defines how Atlas UX collects, stores, retains, and deletes data. The goal is to:

* Minimize stored personal and Platform Data
* Protect user privacy
* Meet platform and regulatory expectations
* Ensure predictable and auditable data lifecycle management

Atlas UX follows a **data minimization and least-retention** philosophy.

---

## 2. Data Classification

Atlas UX processes the following categories of data:

### 2.1 Account & Identity Data

Examples:

* user_id
* email address
* tenant membership
* role and seat assignment
* authentication metadata

**Purpose:** account management, authentication, authorization.

---

### 2.2 Platform Data (Meta and other providers)

Examples (as permitted by the user):

* profile link (`user_link`)
* post metadata (`user_posts`)
* photo/media metadata (`user_photos`)
* managed asset identifiers
* publish results (post IDs, permalinks, status)

**Important:** Atlas UX primarily stores **IDs and limited metadata**, not full media files.

**Purpose:** content workflows, deduplication, publishing, and auditability.

---

### 2.3 Operational & Workflow Data

Examples:

* jobs and workflow state
* tool proposals
* approval records
* agent activity
* scheduling metadata

**Purpose:** execution of the Atlas autonomous workflow engine.

---

### 2.4 Audit & Security Data

Examples:

* actor_user_id
* actor_type
* action performed
* timestamp
* IP address (if available)
* user agent (if available)

**Purpose:** security monitoring, compliance, incident response.

---

### 2.5 Billing & Usage Data

Examples:

* seat counts
* usage meters
* subscription status
* Stripe customer references

**Purpose:** billing, rate limiting, and service enforcement.

---

## 3. Data Minimization Principles

Atlas UX enforces the following:

* Store **only the minimum data required** for functionality.
* Prefer storing **provider IDs and metadata** rather than full content.
* Never store OAuth tokens in client-side storage.
* Encrypt sensitive tokens at rest in the integrations vault.
* Scope all data by tenant.

---

## 4. Retention Periods

Unless otherwise required by law or contract, Atlas UX applies the following default retention periods.

### 4.1 Account & Identity Data

**Retention:**

* Retained while the account is active.
* Deleted or anonymized within **30 days** of verified account deletion request.

**Exceptions:**

* Data required for fraud prevention or legal obligations may be retained longer where permitted by law.

---

### 4.2 Platform Data (Meta and similar)

**Stored Data Type:** IDs and limited metadata only.

**Retention:**

* Active integrations: retained while the integration is connected.
* After user disconnects Meta: tokens are revoked and deleted promptly.
* Associated cached metadata is deleted or anonymized within **30 days** unless required for audit integrity.

Atlas UX does **not** maintain independent long-term archives of user media files.

---

### 4.3 Workflow & Job Data

**Retention:**

* Active and recent workflow data retained for operational continuity.
* Historical workflow records may be retained for up to **12 months** for troubleshooting and analytics.
* Older records may be aggregated or anonymized.

Tenants may request earlier deletion where technically feasible.

---

### 4.4 Audit Logs

Audit logs are critical for security and compliance.

**Retention:** up to **24 months** by default.

Rationale:

* fraud detection
* incident investigation
* enterprise audit requirements

Where feasible, audit logs may be **pseudonymized** after account deletion while preserving system integrity.

---

### 4.5 Billing & Financial Records

**Retention:** up to **7 years** as required for accounting and tax compliance.

This may include:

* subscription records
* invoices
* payment processor references

Sensitive payment data is handled by the payment processor and not stored directly by Atlas UX.

---

## 5. User-Initiated Deletion

Users may request deletion via:

* in-app account deletion (when available), or
* support request to the Atlas UX team.

Upon verified request:

1. Account access is disabled.
2. Integrations are disconnected and tokens revoked.
3. User data enters the deletion queue.
4. Data is deleted or anonymized within **30 days**, except where retention is legally required.

Users will receive confirmation once deletion is completed.

---

## 6. Integration Disconnect Behavior

When a user disconnects Meta or another provider:

* OAuth tokens are revoked and removed from the vault.
* Atlas UX stops further data access immediately.
* Cached Platform Data is scheduled for cleanup per retention rules.

---

## 7. Backups

Atlas UX maintains encrypted backups for disaster recovery.

**Backup retention:**

* rolling backups retained for a limited operational window
* backups automatically expire
* backups are not used to restore deleted user accounts except for disaster recovery events

Deleted data will age out of backups according to the backup lifecycle.

---

## 8. Security Safeguards

Atlas UX protects retained data through:

* encryption in transit (HTTPS/TLS)
* encryption at rest for sensitive secrets
* tenant-scoped access controls
* role-based permissions
* rate limiting and abuse detection
* audit logging of sensitive actions

---

## 9. Policy Review

This policy is reviewed periodically and updated as Atlas UX evolves, including when:

* new data categories are introduced
* platform requirements change
* regulatory requirements evolve

---

## 10. Contact

For data retention or deletion requests:

**Privacy Contact:** privacy@deadapp.info
**Security Contact:** security@deadapp.info
**Company:** DEAD APP CORP
**Product:** Atlas UX

---

**End of Document**
