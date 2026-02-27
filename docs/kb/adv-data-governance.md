# Data Governance Framework

> Comprehensive data governance model for multi-tenant AI agent platforms.
> Audience: Data stewards, compliance officers, platform engineers, and auditors (especially Larry).

---

## Overview

Data governance in Atlas UX is not optional — it is a structural requirement. Every piece of data in the system belongs to a tenant, is accessed by agents acting as stewards, and must be traceable from creation to deletion. This document defines the principles, policies, and processes that govern all data within the platform.

Larry (Auditor) is the primary enforcer of data governance. All governance violations are flagged in the audit log and escalated to Atlas.

---

## 1. Data Governance Principles

Six principles underpin all data decisions in Atlas UX.

**Accountability:** Every data asset has a named owner. For tenant data, the tenant is the owner. For system data, the platform team is the owner. Agents are never owners — they are stewards who access data on behalf of owners.

**Transparency:** All data access, transformation, and sharing is logged. Tenants can see exactly which agents accessed their data, when, and why. The audit log is the single source of truth for data access history.

**Integrity:** Data must be accurate, consistent, and trustworthy. Agents must validate data before acting on it. Conflicting data sources must be flagged, not silently resolved.

**Protection:** Data is protected at rest (encrypted), in transit (TLS), and in use (tenant isolation). Access follows least-privilege: agents only see data they need for their current task.

**Compliance:** The platform enforces regulatory requirements (GDPR, CCPA, SOC 2) through technical controls, not just policy documents. Compliance is verified continuously, not periodically.

**Quality:** Data quality is measured, monitored, and improved continuously. Poor-quality data is worse than no data — it leads to incorrect agent decisions.

---

## 2. Data Ownership Model

Clear ownership prevents ambiguity about who can access, modify, and delete data.

**Ownership hierarchy:**
```
Tenant (Owner)
  └── Grants access to → Atlas UX Platform (Processor)
        └── Delegates to → Named Agents (Sub-processors)
              └── May share with → Third-party Tools (External processors)
```

**Tenant as owner:**
- Tenants own all data they create or import
- Tenants control retention, sharing, and deletion policies
- Tenants can export all their data at any time (data portability)
- Tenants can request deletion of all their data (right to erasure)

**Agents as stewards:**
- Agents access tenant data only to perform their designated functions
- Agents do not retain data beyond the current task (ephemeral context)
- Agent-generated data (reports, content, analysis) belongs to the tenant
- Agents cannot share tenant data with other tenants (tenant isolation)

**Platform as processor:**
- The platform stores and processes data on behalf of tenants
- The platform enforces tenant-defined policies
- The platform provides audit trails and access logs
- The platform does not use tenant data for its own purposes (no cross-tenant training)

---

## 3. Data Classification

All data in Atlas UX is classified into one of four sensitivity levels.

| Level | Label | Examples | Access | Storage | Retention |
|-------|-------|----------|--------|---------|-----------|
| 1 | Public | Published blog posts, public social media content | Any agent | Standard | Indefinite |
| 2 | Internal | Agent configurations, workflow definitions, KB articles | Tenant's agents | Standard | Tenant-defined |
| 3 | Confidential | Customer lists, financial data, strategy documents | Authorized agents only | Encrypted | Regulated |
| 4 | Restricted | Passwords, API keys, PII, payment information | System only (no agent access) | Encrypted + isolated | Minimum required |

**Classification rules:**
- Data is classified at creation time based on its type and content
- Classification can be escalated (Internal → Confidential) but not downgraded without review
- Mixed-classification documents inherit the highest classification of any contained data
- Agents are trained to recognize and flag potentially misclassified data

**Agent access by classification:**

| Agent Tier | Public | Internal | Confidential | Restricted |
|------------|--------|----------|--------------|------------|
| Executive (Atlas, Binky) | Yes | Yes | Yes | No |
| Finance (Tina) | Yes | Yes | Yes (financial) | No |
| Legal (Jenny, Larry) | Yes | Yes | Yes | No (except for audits) |
| Content (Sunday, publishers) | Yes | Yes | No | No |
| Ops (Petra, Sandy, Frank) | Yes | Yes | No | No |

---

## 4. Data Lineage Tracking

Every piece of data in Atlas UX has a traceable history: where it came from, how it was transformed, and where it went.

**Lineage record structure:**
```typescript
interface DataLineageRecord {
  dataId: string;            // Unique identifier for the data asset
  tenantId: string;          // Owning tenant
  origin: {
    source: string;          // 'user_input' | 'agent_generated' | 'api_import' | 'integration'
    sourceDetail: string;    // Specific source (e.g., "Archy research", "Salesforce import")
    timestamp: Date;
    actor: string;           // Agent or user who created the data
  };
  transformations: Array<{
    timestamp: Date;
    actor: string;           // Agent that transformed the data
    operation: string;       // 'summarize' | 'translate' | 'enrich' | 'merge' | 'filter'
    inputHash: string;       // SHA-256 of input data
    outputHash: string;      // SHA-256 of output data
    description: string;     // Human-readable description of transformation
  }>;
  distributions: Array<{
    timestamp: Date;
    actor: string;           // Agent that shared the data
    destination: string;     // Where the data was sent
    purpose: string;         // Why it was shared
    classification: number;  // Classification at time of sharing
  }>;
  currentLocation: string;   // Where the data currently resides
  retentionPolicy: string;   // Applicable retention policy ID
}
```

**Lineage tracking points:**
1. **Creation:** When data enters the system (user input, API import, agent generation)
2. **Transformation:** When an agent modifies, summarizes, or enriches data
3. **Movement:** When data is copied between storage locations (DB → KB, KB → email)
4. **Sharing:** When data is sent to external systems (social platforms, email, APIs)
5. **Deletion:** When data is removed (hard or soft delete)

**Querying lineage:**
```
GET /v1/data/:dataId/lineage
Response: Complete transformation chain from origin to current state

GET /v1/data/lineage?actor=sunday&operation=summarize&since=2026-02-01
Response: All summarization operations performed by Sunday since Feb 1
```

---

## 5. Data Catalog

An inventory of all data assets in the system, with metadata for discovery and governance.

**Catalog entry structure:**
```typescript
interface CatalogEntry {
  id: string;
  tenantId: string;
  name: string;                   // Human-readable name
  description: string;            // What this data represents
  classification: 1 | 2 | 3 | 4; // Sensitivity level
  type: string;                   // 'table' | 'document' | 'file' | 'integration'
  schema?: object;                // For structured data: field definitions
  owner: string;                  // Tenant ID
  steward: string;                // Primary agent responsible
  tags: string[];                 // Searchable tags
  quality: {
    score: number;                // 0.0-1.0 overall quality
    lastAssessed: Date;
    issues: string[];             // Known quality issues
  };
  lineageId: string;              // Link to lineage record
  retentionPolicy: string;        // Policy ID
  createdAt: Date;
  updatedAt: Date;
}
```

**Catalog scope in Atlas UX:**
- All Prisma models (30+ tables)
- All KB document collections
- All file storage buckets
- All integration data sources (CRM, email, social platforms)
- All agent-generated content

**Catalog maintenance:** Larry runs a weekly catalog audit to identify:
- Uncataloged data assets (new tables/collections without catalog entries)
- Stale catalog entries (data that no longer exists)
- Misclassified data (classification doesn't match content)
- Orphaned data (data with no clear owner or purpose)

---

## 6. Master Data Management

Ensuring critical business entities are consistent and accurate across the system.

**Master data entities in Atlas UX:**
- **Tenants:** Canonical tenant record (name, plan, settings)
- **Users:** User profiles, roles, permissions
- **Agents:** Agent roster, configurations, states
- **Contacts:** Customer/prospect records (CRM data)
- **Products:** Products/services offered by tenants
- **Integrations:** Connected platforms and credentials

**Golden record principle:** Each master data entity has exactly one authoritative source. All other references are derived or linked, never duplicated.

```
Tenant golden record:     prisma.tenant (source of truth)
User golden record:       prisma.user
Agent golden record:      Agent roster + config files
Contact golden record:    prisma.contact (enriched by agents, owned by tenant)
```

**Conflict resolution:** When multiple sources provide conflicting data about the same entity:
1. The golden record source wins
2. Conflicts are logged with both values
3. A reconciliation job is created for the appropriate agent
4. Human review is triggered for Confidential/Restricted data conflicts

---

## 7. Data Retention Policies

How long data is kept and when it is deleted.

**Retention schedules by data type:**

| Data Type | Default Retention | Regulatory Basis | Deletion Method |
|-----------|-------------------|------------------|-----------------|
| Audit logs | 7 years | SOC 2, legal hold | Archive to cold storage |
| Financial records | 7 years | Tax regulations | Soft delete, then hard delete |
| Customer data | Tenant-defined (max 5 years) | GDPR Art. 5(1)(e) | Hard delete on request |
| Agent activity logs | 1 year | Internal policy | Automated purge |
| KB documents | Tenant-defined | N/A | Soft delete |
| Social media content | Indefinite (public) | Platform TOS | Platform-dependent |
| Session data | 30 days | Security policy | Automated purge |
| Temporary files | 7 days | N/A | Automated purge |

**Retention enforcement:**
```typescript
// Daily retention job (run by Larry)
async function enforceRetention() {
  const policies = await prisma.retentionPolicy.findMany({ where: { active: true } });

  for (const policy of policies) {
    const cutoff = subDays(new Date(), policy.retentionDays);
    const expired = await prisma[policy.tableName].findMany({
      where: { createdAt: { lt: cutoff }, tenantId: policy.tenantId }
    });

    for (const record of expired) {
      if (policy.action === 'soft_delete') {
        await prisma[policy.tableName].update({
          where: { id: record.id },
          data: { deletedAt: new Date() }
        });
      } else if (policy.action === 'hard_delete') {
        await prisma[policy.tableName].delete({ where: { id: record.id } });
      } else if (policy.action === 'archive') {
        await archiveToColdStorage(policy.tableName, record);
        await prisma[policy.tableName].delete({ where: { id: record.id } });
      }

      await auditLog({
        action: 'DATA_RETENTION_APPLIED',
        entityType: policy.tableName,
        entityId: record.id,
        message: `Record expired per policy ${policy.id}. Action: ${policy.action}`
      });
    }
  }
}
```

---

## 8. Data Access Controls

Who can access what data and under what conditions.

**Access control model:** Atlas UX uses a hybrid of Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC).

**RBAC layer:** Agent role determines baseline permissions.
```
Executive role:   Read/write all tenant data (classification 1-3)
Department head:  Read/write department data + read cross-department (classification 1-2)
Specialist:       Read/write own domain data (classification 1-2)
Publisher:        Write social content, read content briefs (classification 1)
```

**ABAC layer:** Additional attributes refine access decisions.
```
Attributes considered:
  - Data classification level
  - Agent's current task (purpose limitation)
  - Time of access (business hours vs. off-hours)
  - Data age (some data restricted after certain age)
  - Tenant-specific overrides
```

**Access decision flow:**
```
1. Agent requests data access
2. Check RBAC: Does agent's role permit this data type? → No → Deny
3. Check ABAC: Do attributes permit this specific access? → No → Deny
4. Check tenant policy: Has tenant restricted this access? → Yes → Deny
5. Log access to audit trail
6. Return data
```

---

## 9. Data Quality Dimensions

Six dimensions define data quality. Each is measurable and has defined thresholds.

| Dimension | Definition | Measurement | Target |
|-----------|-----------|-------------|--------|
| Accuracy | Data correctly represents reality | Error rate vs. source | >99% |
| Completeness | All required fields are populated | Null rate for required fields | >95% |
| Consistency | Same data is consistent across systems | Cross-system reconciliation | >98% |
| Timeliness | Data is available when needed | Time from event to availability | <5 min |
| Uniqueness | No unintended duplicates | Duplicate detection rate | >99.5% |
| Validity | Data conforms to defined formats | Schema validation pass rate | >99.9% |

**Quality scoring:**
```
Overall Quality Score = Weighted average of dimension scores
  Accuracy:     0.25 weight
  Completeness: 0.20 weight
  Consistency:  0.20 weight
  Timeliness:   0.15 weight
  Uniqueness:   0.10 weight
  Validity:     0.10 weight
```

---

## 10. Data Quality Monitoring

Continuous monitoring rather than periodic assessment.

**Automated quality checks:**
```typescript
// Runs every hour as a scheduled job
async function runQualityChecks(tenantId: string) {
  const checks: QualityCheck[] = [
    // Accuracy: compare CRM data against integration source
    { name: 'crm_accuracy', fn: checkCrmAccuracy },
    // Completeness: check for null required fields
    { name: 'contact_completeness', fn: checkContactCompleteness },
    // Consistency: compare data across tables
    { name: 'cross_table_consistency', fn: checkCrossTableConsistency },
    // Timeliness: check for stale data
    { name: 'data_freshness', fn: checkDataFreshness },
    // Uniqueness: detect duplicates
    { name: 'contact_duplicates', fn: detectContactDuplicates },
    // Validity: schema validation
    { name: 'schema_validity', fn: validateSchemas },
  ];

  const results = await Promise.all(checks.map(c => c.fn(tenantId)));

  // Store quality scorecard
  await prisma.qualityScorecard.create({
    data: {
      tenantId,
      timestamp: new Date(),
      scores: results,
      overallScore: calculateOverallScore(results)
    }
  });

  // Alert on quality degradation
  for (const result of results) {
    if (result.score < result.threshold) {
      await createAlert({
        type: 'DATA_QUALITY_DEGRADATION',
        check: result.name,
        score: result.score,
        threshold: result.threshold,
        tenantId
      });
    }
  }
}
```

**Quality dashboards:** Available at `/app/data-quality` showing:
- Overall quality score trend (30-day chart)
- Per-dimension scores
- Top quality issues by impact
- Quality improvement recommendations (generated by Larry)

---

## 11. Larry's Governance Role

Larry (Auditor) is the primary enforcement mechanism for data governance.

**Larry's governance responsibilities:**
1. **Continuous audit:** Monitor audit log for policy violations in real-time
2. **Quality assessment:** Run quality checks and generate scorecards
3. **Retention enforcement:** Execute retention policies on schedule
4. **Access review:** Weekly review of data access patterns for anomalies
5. **Catalog maintenance:** Monthly audit of the data catalog for accuracy
6. **Lineage verification:** Spot-check lineage records for completeness
7. **Compliance reporting:** Generate compliance reports for tenant review
8. **Incident response:** Investigate and report data governance incidents

**Escalation matrix:**
```
Severity 1 (Critical):  Data breach, unauthorized access    → Atlas + Jenny immediately
Severity 2 (High):      Policy violation, quality below SLA  → Atlas within 1 hour
Severity 3 (Medium):    Quality degradation, stale data      → Department head within 24 hours
Severity 4 (Low):       Minor inconsistency, catalog gap     → Weekly report
```

**Larry cannot be suspended or overridden for governance activities.** This is a hard SGL constraint. Even Atlas cannot prevent Larry from performing audits or logging violations.
