# AI Governance in Knowledge Bases

## Introduction

A knowledge base powering an AI system is not just a collection of documents — it is a regulatory surface. Every fact stored in the KB can become a claim made by the AI to a customer, a regulatory body, or a court. When the AI receptionist tells a caller "We charge $150 for drain cleaning," that fact came from the KB, and the business is accountable for its accuracy. When the AI accesses customer appointment history to answer a scheduling question, that access must comply with privacy regulations. When content is added, modified, or deleted, those changes must be traceable for audit. AI governance in knowledge bases is the discipline of ensuring that the content AI systems rely on is accurate, current, properly controlled, auditable, and compliant with applicable regulations. Without governance, a knowledge base is a liability waiting to become an incident.

## Why KB Governance Matters

### Compliance Requirements

Knowledge bases that power customer-facing AI systems fall under multiple regulatory frameworks:

**GDPR (General Data Protection Regulation)**:
- Right to be forgotten: If a customer requests deletion, their data must be removed from the KB — including any documents, notes, or records that reference them
- Purpose limitation: Data collected for one purpose (booking appointments) cannot be repurposed (marketing analytics) without consent
- Data minimization: The KB should not store more personal data than necessary
- Accuracy obligation: Personal data must be kept accurate and up to date

**SOC 2 (Service Organization Control)**:
- Availability: The KB must be reliably accessible to the AI system
- Confidentiality: Sensitive business information must be protected
- Processing integrity: KB data must be complete, valid, accurate, timely, and authorized
- Security: Access to KB data must be controlled and monitored

**HIPAA (Health Insurance Portability and Accountability Act)**:
- Applies if the KB contains any health-related information (e.g., a medical practice's patient notes)
- Requires encryption at rest and in transit, access logging, and minimum necessary access

**Industry-specific regulations**:
- Financial services: SEC record retention requirements
- Legal: Attorney-client privilege protections
- Real estate: Fair housing compliance in AI communications

### Accuracy and Trust

An AI system's trustworthiness depends entirely on the quality of its knowledge base. Governance ensures:
- Content is reviewed before publication
- Facts are verified against authoritative sources
- Outdated information is detected and updated
- Contradictions between articles are identified and resolved
- AI outputs can be traced to specific KB content for verification

### Liability Management

When an AI makes a mistake because of bad KB data, the question becomes: who is responsible?

- Was the content reviewed and approved? (Content governance)
- Who had access to modify it? (Access governance)
- When was it last verified? (Quality governance)
- Is there a record of all changes? (Audit governance)

Without governance, these questions are unanswerable — and unanswerable questions in a legal proceeding are expensive.

## Governance Dimensions

### Content Quality Governance

Content quality governance ensures that KB content meets accuracy, completeness, and currency standards before the AI uses it.

**Review workflows:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Draft    │───>│  Review   │───>│  Approve  │───>│  Publish  │
│           │    │  (expert  │    │  (owner   │    │  (live in │
│           │    │   review) │    │   sign-off)│   │   KB)     │
└──────────┘    └──────┬───┘    └──────────┘    └──────────┘
                       │
                       ▼
                ┌──────────┐
                │  Reject   │  (back to draft with feedback)
                └──────────┘
```

**Automated quality checks:**

```python
class ContentGovernance:
    def validate_for_publication(self, article: dict) -> ValidationResult:
        checks = []

        # Completeness: required sections present
        required_sections = ["Introduction", "Media", "Videos", "References"]
        for section in required_sections:
            present = f"## {section}" in article["content"]
            checks.append(Check("completeness", section, present))

        # Accuracy: no known contradictions
        contradictions = self.find_contradictions(article)
        checks.append(Check("accuracy", "no_contradictions", len(contradictions) == 0))

        # Currency: content not stale
        age_days = (datetime.utcnow() - article["updated_at"]).days
        checks.append(Check("currency", "within_freshness_sla",
                           age_days <= article.get("freshness_sla_days", 90)))

        # References: all links valid
        broken_links = self.validate_links(article["content"])
        checks.append(Check("references", "all_links_valid", len(broken_links) == 0))

        return ValidationResult(checks=checks, approved=all(c.passed for c in checks))
```

### Access Control Governance

Access control governance determines who can read, write, and administer KB content.

**Role-based access:**

| Role | Read | Write | Approve | Admin |
|------|------|-------|---------|-------|
| Viewer | All published | None | None | None |
| Contributor | All published | Draft only | None | None |
| Editor | All | All | Own namespace | None |
| Owner | All | All | All namespaces | None |
| Admin | All | All | All | Full |

**Tenant isolation:**

In multi-tenant systems, tenant isolation is non-negotiable:

```python
class TenantIsolatedKB:
    def get_article(self, article_id: str, tenant_id: str) -> Article:
        """Every KB operation is scoped to a tenant."""
        article = self.db.query(
            "SELECT * FROM kb_articles WHERE id = $1 AND tenant_id = $2",
            article_id, tenant_id
        )
        if not article:
            raise NotFoundError("Article not found")  # Same error whether it doesn't exist
                                                        # or belongs to another tenant
        return article

    def search(self, query: str, tenant_id: str) -> list:
        """Search is always filtered by tenant."""
        return self.vector_store.search(
            query=query,
            filter={"tenant_id": tenant_id},
            namespace=f"tenant:{tenant_id}"
        )
```

**Data classification:**

KB content should be classified by sensitivity:

```python
class DataClassification:
    PUBLIC = "public"          # Safe for any audience
    INTERNAL = "internal"      # Internal team only
    CONFIDENTIAL = "confidential"  # Restricted access, business-sensitive
    RESTRICTED = "restricted"  # Highly sensitive, legal/compliance implications

CLASSIFICATION_RULES = {
    "pricing": DataClassification.INTERNAL,     # Internal pricing strategies
    "customer_data": DataClassification.CONFIDENTIAL,  # Customer information
    "published_pricing": DataClassification.PUBLIC,  # Published rate cards
    "legal_policies": DataClassification.RESTRICTED,  # Legal/compliance content
    "service_descriptions": DataClassification.PUBLIC,  # Public-facing service info
}
```

### Audit Trail Governance

Every change to the KB must be recorded in an audit trail that answers: who changed what, when, and why.

**Audit log schema:**

```sql
CREATE TABLE kb_audit_log (
    id SERIAL PRIMARY KEY,
    article_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    action TEXT NOT NULL,         -- CREATE, UPDATE, DELETE, PUBLISH, UNPUBLISH
    actor_id TEXT NOT NULL,       -- Who made the change
    actor_type TEXT NOT NULL,     -- human, system, auto_heal
    previous_content TEXT,        -- Content before change (for UPDATE/DELETE)
    new_content TEXT,             -- Content after change (for CREATE/UPDATE)
    change_reason TEXT,           -- Why the change was made
    metadata JSONB,              -- Additional context
    hash TEXT NOT NULL,           -- Hash chain integrity (SOC 2 CC7.2)
    previous_hash TEXT,          -- Links to previous audit entry
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common audit queries
CREATE INDEX idx_kb_audit_article ON kb_audit_log (article_id, created_at DESC);
CREATE INDEX idx_kb_audit_actor ON kb_audit_log (actor_id, created_at DESC);
CREATE INDEX idx_kb_audit_tenant ON kb_audit_log (tenant_id, created_at DESC);
```

**Hash chain integrity:**

For SOC 2 CC7.2 compliance, audit entries form a hash chain that makes tampering detectable:

```python
import hashlib

class AuditChain:
    def create_entry(self, entry: dict) -> dict:
        # Get the previous entry's hash
        previous = self.db.query(
            "SELECT hash FROM kb_audit_log ORDER BY created_at DESC LIMIT 1"
        )
        previous_hash = previous.hash if previous else "GENESIS"

        # Compute hash of current entry + previous hash
        hash_input = json.dumps({
            "article_id": entry["article_id"],
            "action": entry["action"],
            "actor_id": entry["actor_id"],
            "timestamp": entry["created_at"].isoformat(),
            "content_hash": hashlib.sha256(
                (entry.get("new_content") or "").encode()
            ).hexdigest(),
            "previous_hash": previous_hash
        }, sort_keys=True)

        entry["hash"] = hashlib.sha256(hash_input.encode()).hexdigest()
        entry["previous_hash"] = previous_hash

        self.db.insert("kb_audit_log", entry)
        return entry

    def verify_chain(self) -> bool:
        """Verify the entire audit chain is intact."""
        entries = self.db.query("SELECT * FROM kb_audit_log ORDER BY created_at")
        for i, entry in enumerate(entries):
            expected_previous = entries[i-1].hash if i > 0 else "GENESIS"
            if entry.previous_hash != expected_previous:
                return False  # Chain is broken — tampering detected
        return True
```

### Version Control Governance

KB content should be versioned like code:

```python
class VersionedArticle:
    def update(self, article_id: str, new_content: str, author: str, reason: str):
        current = self.get(article_id)

        # Create new version
        new_version = current.version + 1

        # Store version history
        self.db.insert("kb_article_versions", {
            "article_id": article_id,
            "version": new_version,
            "content": new_content,
            "author": author,
            "reason": reason,
            "created_at": datetime.utcnow(),
            "diff": self.compute_diff(current.content, new_content)
        })

        # Update current article
        self.db.update("kb_articles", article_id, {
            "content": new_content,
            "version": new_version,
            "updated_at": datetime.utcnow()
        })

    def rollback(self, article_id: str, to_version: int, author: str, reason: str):
        """Rollback to a previous version (creates a new version, not destructive)."""
        target = self.db.query(
            "SELECT * FROM kb_article_versions WHERE article_id = $1 AND version = $2",
            article_id, to_version
        )
        self.update(article_id, target.content, author,
                   f"Rollback to v{to_version}: {reason}")
```

### Retention Governance

Define how long KB content and associated metadata are retained:

| Content Type | Retention Period | Justification |
|-------------|-----------------|---------------|
| Published articles | Indefinite (while relevant) | Active knowledge base |
| Archived articles | 2 years after archival | Audit trail + potential reactivation |
| Audit logs | 7 years | SOC 2 compliance, legal hold |
| Version history | 2 years | Rollback capability |
| User interaction logs | 90 days | Privacy minimization |
| Quality metrics | 1 year | Trend analysis |
| Deleted content | 30 days (soft delete) | Accidental deletion recovery |

```python
class RetentionPolicy:
    POLICIES = {
        "audit_logs": timedelta(days=7*365),
        "archived_articles": timedelta(days=2*365),
        "version_history": timedelta(days=2*365),
        "interaction_logs": timedelta(days=90),
        "quality_metrics": timedelta(days=365),
        "soft_deleted": timedelta(days=30),
    }

    def enforce(self):
        """Run retention enforcement (scheduled daily)."""
        for content_type, max_age in self.POLICIES.items():
            cutoff = datetime.utcnow() - max_age
            deleted_count = self.db.delete(
                content_type,
                "created_at < $1",
                cutoff
            )
            self.audit_log.record(
                action="retention_enforcement",
                content_type=content_type,
                deleted_count=deleted_count,
                cutoff_date=cutoff
            )
```

## Regulatory Requirements

### GDPR: Right to Be Forgotten

When a customer exercises their right to erasure, the KB must be scrubbed:

```python
class GDPRCompliance:
    def process_erasure_request(self, customer_id: str, tenant_id: str):
        """Remove all traces of a customer from the KB."""
        # 1. Find all articles mentioning this customer
        affected = self.search_for_customer(customer_id, tenant_id)

        # 2. Redact or delete customer references
        for article in affected:
            redacted = self.redact_customer_data(article, customer_id)
            self.update_article(article.id, redacted, reason=f"GDPR erasure: {customer_id}")

        # 3. Remove from vector store (re-embed redacted versions)
        for article in affected:
            self.re_embed(article.id)

        # 4. Remove from search index
        self.search_index.delete_by_filter({"customer_id": customer_id})

        # 5. Log the erasure (without storing the erased data)
        self.audit_log.record(
            action="gdpr_erasure",
            customer_id_hash=hashlib.sha256(customer_id.encode()).hexdigest(),
            articles_affected=len(affected),
            completed_at=datetime.utcnow()
        )
```

### SOC 2: Audit Trails

SOC 2 Type II requires demonstrating that controls operated effectively over a period (typically 12 months). For KBs, this means:

- Every content change has an audit entry
- The audit chain is tamper-evident (hash chain)
- Access attempts are logged (successful and failed)
- Review and approval workflows are documented
- Retention policies are consistently enforced

### HIPAA: Health Data

If a trade business serves medical facilities (e.g., HVAC for a hospital), the KB might contain health-related information:

- Content at rest must be encrypted (AES-256)
- Access must be logged and restricted to authorized personnel
- PHI (Protected Health Information) must be identified and handled according to HIPAA rules
- Business Associate Agreements must be in place with any third-party KB service providers

## Atlas UX Governance Implementation

Atlas UX implements several governance mechanisms:

**Audit trail with hash chain (SOC 2 CC7.2):**
The `audit_log` table records all mutations with hash chain integrity via `lib/auditChain.ts`. Every database write generates an audit entry. On DB write failure, audit events fall back to stderr — they are never lost.

**Tenant isolation:**
Every database table has a `tenant_id` foreign key. The `tenantPlugin` extracts `x-tenant-id` from request headers and scopes all queries. Cross-tenant data access is structurally impossible at the query level.

**Decision memos:**
High-risk actions (recurring charges, spend above `AUTO_SPEND_LIMIT_USD`, risk tier >= 2) require a `decision_memo` approval before execution. This governance workflow ensures that consequential actions are reviewed before they affect customers.

**Daily action caps:**
`MAX_ACTIONS_PER_DAY` enforces a hard limit on automated actions, preventing runaway AI behavior from causing widespread damage.

**Credential encryption:**
Stored API keys are encrypted at rest using AES-256-GCM via `TOKEN_ENCRYPTION_KEY`, ensuring that even database compromises do not expose credentials.

## Building a Governance Framework

### Phase 1: Foundation (Immediate)

1. Implement audit logging for all KB mutations
2. Enforce tenant isolation at the query level
3. Define content classification schema
4. Set up access control roles

### Phase 2: Quality (Month 1-2)

1. Implement automated quality checks (schema, freshness, links)
2. Set up review workflows for content publication
3. Define retention policies
4. Enable version control for articles

### Phase 3: Compliance (Month 3-6)

1. Implement GDPR erasure workflows
2. Add hash chain integrity to audit logs
3. Set up compliance reporting dashboards
4. Conduct first governance audit

### Phase 4: Maturity (Ongoing)

1. Automated compliance monitoring
2. Regular governance audits
3. Policy evolution based on regulatory changes
4. Continuous improvement of quality and access controls

## Conclusion

AI governance in knowledge bases is not a checkbox exercise — it is the structural foundation that makes AI systems trustworthy, compliant, and accountable. Content quality governance ensures the AI says the right things. Access control governance ensures the right people manage the content. Audit trail governance ensures every change is traceable. Retention governance ensures data is kept as long as needed but no longer. And regulatory compliance ensures the organization meets its legal obligations. For platforms like Atlas UX that serve real businesses handling real customer interactions, governance is not optional — it is the difference between a product that businesses can trust with their reputation and one they cannot.

## Media

1. ![Access control matrix](https://upload.wikimedia.org/wikipedia/commons/5/55/RBAC.jpg) — Role-based access control model showing permission hierarchies
2. ![Audit trail flow diagram](https://upload.wikimedia.org/wikipedia/commons/c/c3/ETL_process_in_data_warehousing.png) — Data pipeline with audit checkpoints at each stage
3. ![Data governance framework](https://upload.wikimedia.org/wikipedia/commons/8/8b/Data_warehouse_overview.JPG) — Data warehouse governance architecture
4. ![Hash chain diagram](https://upload.wikimedia.org/wikipedia/commons/9/98/Blockchain.svg) — Blockchain-style hash chain showing tamper-evident audit linking
5. ![GDPR compliance framework](https://upload.wikimedia.org/wikipedia/commons/2/24/Feedback_loop_with_descriptions.svg) — Feedback loop for continuous compliance monitoring

## Videos

1. https://www.youtube.com/watch?v=W_oUahwaoiA — "Data Quality Management Explained" by IBM Technology covering governance fundamentals
2. https://www.youtube.com/watch?v=nIr_dvcezLg — "What is Data Governance?" by IBM Technology on frameworks and implementation

## References

1. GDPR Official Text — https://gdpr-info.eu/
2. SOC 2 Trust Services Criteria — https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2
3. NIST AI Risk Management Framework — https://www.nist.gov/artificial-intelligence/executive-order-safe-secure-and-trustworthy-artificial-intelligence
4. DAMA International. "DAMA-DMBOK: Data Management Body of Knowledge." https://www.dama.org/cpages/body-of-knowledge
