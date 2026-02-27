# Data Quality Management

> Practical guide to measuring, monitoring, and improving data quality in AI agent systems.
> Audience: Data engineers, agent developers, and quality-focused operators.

---

## Overview

Data quality is the foundation of trustworthy AI agent decisions. When Tina (CFO) generates a financial forecast, the accuracy depends entirely on the quality of the underlying data. When Sunday writes a blog post based on Archy's research, factual errors in the research propagate to published content. Poor data quality does not just cause inaccurate outputs — it erodes trust in the entire agent workforce.

This document covers the full data quality lifecycle: profiling, cleansing, validation, scoring, monitoring, and continuous improvement.

---

## 1. Data Profiling

Before you can improve data quality, you must understand its current state. Data profiling is the systematic examination of data to understand its structure, content, and relationships.

**Profiling dimensions:**

**Structural profiling:**
```
For each table/collection:
  - Row count
  - Column count and data types
  - Null rates per column
  - Unique value counts (cardinality)
  - Min/max/mean/median for numeric columns
  - Length distribution for string columns
  - Date range for temporal columns
```

**Content profiling:**
```
For each column:
  - Value frequency distribution (top 20 values)
  - Pattern analysis (e.g., phone numbers matching XXX-XXX-XXXX)
  - Domain analysis (does this look like an email, URL, name?)
  - Outlier detection (values >3 standard deviations from mean)
  - Format consistency (mixed formats within a column)
  - Encoding issues (UTF-8 violations, special characters)
```

**Relationship profiling:**
```
Across tables:
  - Foreign key integrity (orphaned references)
  - Referential consistency (matching IDs across tables)
  - Cross-field dependencies (if status = "active", then activated_at must exist)
  - Temporal consistency (created_at < updated_at < deleted_at)
```

**Profiling implementation for Atlas UX:**
```typescript
async function profileTable(tableName: string, tenantId: string): Promise<DataProfile> {
  const totalRows = await prisma[tableName].count({ where: { tenantId } });

  const columns = getColumns(tableName);
  const columnProfiles: ColumnProfile[] = [];

  for (const col of columns) {
    const nullCount = await prisma[tableName].count({
      where: { tenantId, [col.name]: null }
    });

    const distinctCount = await prisma.$queryRawUnsafe(
      `SELECT COUNT(DISTINCT "${col.name}") as cnt FROM "${tableName}" WHERE "tenant_id" = $1`,
      tenantId
    );

    columnProfiles.push({
      name: col.name,
      type: col.type,
      nullRate: nullCount / totalRows,
      cardinality: Number(distinctCount[0].cnt),
      completeness: 1 - (nullCount / totalRows),
    });
  }

  return {
    tableName,
    tenantId,
    totalRows,
    profiledAt: new Date(),
    columns: columnProfiles
  };
}
```

**Profiling schedule:** Full profiling runs weekly. Incremental profiling (new/changed rows only) runs daily. Critical tables (contacts, financial records) are profiled hourly.

---

## 2. Data Cleansing Techniques

Systematic correction of identified quality issues.

**Standardization:**
Transform data into consistent formats.
```
Phone numbers:  "(555) 123-4567" → "+15551234567"
Dates:          "2/27/26", "Feb 27, 2026", "27-02-2026" → "2026-02-27T00:00:00Z"
Names:          "john smith", "JOHN SMITH" → "John Smith"
Addresses:      "123 Main St." → "123 Main Street"
URLs:           "www.example.com" → "https://www.example.com"
Countries:      "US", "USA", "United States" → "US" (ISO 3166-1 alpha-2)
```

**Implementation pattern:**
```typescript
const standardizers: Record<string, (value: string) => string> = {
  phone: (v) => v.replace(/\D/g, '').replace(/^1?(\d{10})$/, '+1$1'),
  email: (v) => v.trim().toLowerCase(),
  url: (v) => {
    if (!v.startsWith('http')) v = 'https://' + v;
    return new URL(v).toString();
  },
  name: (v) => v.trim().split(/\s+/).map(
    w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join(' '),
};
```

**Deduplication:**
Identify and merge duplicate records.

```
Step 1: Blocking — Group potentially matching records by a key
  Contacts: Group by normalized last_name + first 3 chars of first_name
  Companies: Group by normalized domain

Step 2: Matching — Compare pairs within each block
  Similarity metrics:
    - Exact match (=)
    - Levenshtein distance (for typos)
    - Jaro-Winkler (for name variations)
    - Soundex/Metaphone (for phonetic similarity)
    - Token-based (for word reordering: "Smith John" ↔ "John Smith")

Step 3: Scoring — Calculate overall match confidence
  match_score = (name_similarity * 0.3) + (email_match * 0.4) + (phone_match * 0.3)
  Threshold: match_score > 0.85 → likely duplicate

Step 4: Merging — Combine duplicates into golden record
  - Keep the most complete record as the survivor
  - Fill nulls from the duplicate
  - Flag conflicts for human review
  - Maintain merge history for undo capability
```

**Enrichment:**
Add missing data from reliable sources.
```
Source data:     { name: "Acme Corp", website: null, industry: null }
After enrichment: { name: "Acme Corp", website: "https://acme.com", industry: "Technology" }

Enrichment sources:
  - Company website scraping (basic info)
  - Public business registries
  - Social media profiles
  - Agent research (Archy performs targeted enrichment)
```

**Validation:**
Verify data against external sources or business rules.
```
Email validation:    MX record check, syntax validation, disposable email detection
Phone validation:    Format check, carrier lookup, region verification
Address validation:  Geocoding API, postal code verification
URL validation:      HTTP HEAD request, SSL certificate check, redirect following
```

---

## 3. Data Validation Rules

Systematic rules that prevent bad data from entering the system.

**Rule categories:**

**Schema validation (structural):**
```typescript
const contactSchema = {
  email: { type: 'string', format: 'email', required: true },
  firstName: { type: 'string', minLength: 1, maxLength: 100, required: true },
  lastName: { type: 'string', minLength: 1, maxLength: 100, required: true },
  phone: { type: 'string', pattern: /^\+\d{10,15}$/, required: false },
  company: { type: 'string', maxLength: 200, required: false },
  createdAt: { type: 'datetime', required: true, auto: true },
};
```

**Business rule validation (semantic):**
```typescript
const businessRules: ValidationRule[] = [
  {
    name: 'invoice_total_matches_lines',
    table: 'invoices',
    validate: (invoice) => {
      const lineTotal = invoice.lines.reduce((sum, l) => sum + l.amount, 0);
      return Math.abs(invoice.total - lineTotal) < 0.01;
    },
    severity: 'error',
    message: 'Invoice total does not match sum of line items'
  },
  {
    name: 'contact_has_valid_channel',
    table: 'contacts',
    validate: (contact) => {
      return contact.email || contact.phone || contact.socialHandle;
    },
    severity: 'warning',
    message: 'Contact has no valid communication channel'
  },
  {
    name: 'decision_memo_has_justification',
    table: 'decision_memos',
    validate: (memo) => {
      return memo.justification && memo.justification.length > 50;
    },
    severity: 'error',
    message: 'Decision memo requires substantive justification (>50 chars)'
  }
];
```

**Cross-field consistency:**
```
IF status = 'completed' THEN completed_at IS NOT NULL
IF status = 'active' THEN suspended_at IS NULL
IF risk_tier >= 2 THEN decision_memo_id IS NOT NULL
IF amount > AUTO_SPEND_LIMIT_USD THEN approval_status = 'approved'
IF tenant.plan = 'free' THEN agent_count <= 5
```

**Referential integrity:**
```sql
-- Every job must reference a valid agent
ALTER TABLE jobs ADD CONSTRAINT fk_jobs_agent
  FOREIGN KEY (agent_id) REFERENCES agents(id);

-- Every audit log must reference a valid tenant
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- DecisionMemo FK to source job/intent (migration 20260226200000)
ALTER TABLE decision_memos ADD COLUMN job_id TEXT REFERENCES jobs(id);
ALTER TABLE decision_memos ADD COLUMN intent_id TEXT REFERENCES intents(id);
```

---

## 4. Data Quality Scorecards

Quantified assessment of data quality at multiple granularities.

**Entity-level scorecard:**
```typescript
interface EntityScorecard {
  entityType: string;        // 'contact', 'invoice', 'kb_document'
  entityId: string;
  tenantId: string;
  assessedAt: Date;
  scores: {
    accuracy: number;        // 0.0-1.0
    completeness: number;    // Required fields populated / total required fields
    consistency: number;     // Cross-system match rate
    timeliness: number;      // 1.0 if updated within freshness window
    uniqueness: number;      // 1.0 if no duplicates found, 0.0 if is a duplicate
    validity: number;        // Schema validation pass rate
  };
  overall: number;           // Weighted average
  issues: Array<{
    dimension: string;
    field: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    suggestedFix?: string;
  }>;
}
```

**Aggregate scorecard (per table, per tenant):**
```
Contacts Quality Report — Tenant: acme-corp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total records:     1,247
Overall score:     0.87 (Good)

Dimension          Score    Target   Status
─────────────────────────────────────────
Accuracy           0.94     0.99     ⚠ Below target
Completeness       0.82     0.95     ✗ Below target
Consistency        0.91     0.98     ⚠ Below target
Timeliness         0.96     0.95     ✓ On target
Uniqueness         0.88     0.995    ✗ Below target
Validity           0.99     0.999    ✓ On target

Top Issues:
1. 224 contacts missing phone number (completeness)
2. 149 potential duplicate contacts (uniqueness)
3. 67 contacts with outdated email (accuracy)
4. 43 contacts with inconsistent company names (consistency)
```

---

## 5. Automated Quality Checks in Pipelines

Data quality gates integrated into agent workflows.

**Pre-action validation:**
Before any agent acts on data, validate it.
```typescript
async function validateBeforeAction(
  agent: Agent,
  data: any,
  action: string
): Promise<ValidationResult> {
  const rules = getValidationRules(agent.role, action);
  const results = rules.map(rule => ({
    rule: rule.name,
    passed: rule.validate(data),
    severity: rule.severity,
    message: rule.message
  }));

  const errors = results.filter(r => !r.passed && r.severity === 'error');
  const warnings = results.filter(r => !r.passed && r.severity === 'warning');

  if (errors.length > 0) {
    return { valid: false, errors, warnings, action: 'BLOCK' };
  }
  if (warnings.length > 0) {
    return { valid: true, errors: [], warnings, action: 'PROCEED_WITH_CAUTION' };
  }
  return { valid: true, errors: [], warnings: [], action: 'PROCEED' };
}
```

**Post-action validation:**
After data is created or modified, verify quality.
```typescript
async function validateAfterWrite(
  tableName: string,
  recordId: string,
  tenantId: string
): Promise<void> {
  const record = await prisma[tableName].findUnique({ where: { id: recordId } });
  const scorecard = await assessEntityQuality(tableName, record, tenantId);

  if (scorecard.overall < 0.7) {
    await createQualityAlert({
      type: 'LOW_QUALITY_RECORD_CREATED',
      table: tableName,
      recordId,
      score: scorecard.overall,
      issues: scorecard.issues
    });
  }
}
```

**Pipeline quality gates:**
```
Content Pipeline Quality Gates:
  Gate 1 (after Archy research):
    - Sources cited: minimum 3
    - Source freshness: all sources < 90 days old
    - Factual claims: must be verifiable
    → Fail: return to Archy with feedback

  Gate 2 (after Sunday writing):
    - Grammar score: > 95%
    - Readability: Flesch-Kincaid grade 8-12
    - SEO score: > 70%
    - Brand voice consistency: > 80%
    → Fail: return to Sunday with specific edits

  Gate 3 (after Venny image creation):
    - Resolution: meets platform requirements
    - Alt text: present and descriptive
    - Brand consistency: matches style guide
    → Fail: return to Venny with corrections
```

---

## 6. Data Quality SLAs

Service Level Agreements that define quality commitments.

**SLA definitions:**
```yaml
data_quality_slas:
  contacts:
    accuracy: 0.99
    completeness: 0.95
    freshness: 24h       # Updated within last 24 hours
    dedup_rate: 0.995     # Less than 0.5% duplicates
    measurement: daily
    escalation: Tina → Atlas if breached 3 consecutive days

  financial_records:
    accuracy: 0.999
    completeness: 0.999
    consistency: 0.999
    freshness: 1h
    measurement: hourly
    escalation: Larry → Atlas immediately if breached

  kb_documents:
    accuracy: 0.95
    completeness: 0.90
    freshness: 7d
    measurement: weekly
    escalation: Sunday → Atlas if breached 2 consecutive weeks

  social_content:
    accuracy: 0.95        # Factual accuracy
    validity: 0.99        # Meets platform requirements
    timeliness: 1h        # Published within 1 hour of scheduled time
    measurement: per-post
    escalation: Publisher → Sunday if quality drops
```

**SLA tracking:**
```typescript
async function checkSLA(slaId: string): Promise<SLAStatus> {
  const sla = await getSLADefinition(slaId);
  const currentMetrics = await measureCurrentQuality(sla.entityType, sla.tenantId);

  const breaches: SLABreach[] = [];
  for (const [dimension, target] of Object.entries(sla.targets)) {
    if (currentMetrics[dimension] < target) {
      breaches.push({
        dimension,
        target,
        actual: currentMetrics[dimension],
        gap: target - currentMetrics[dimension],
        since: await getBreachStartTime(slaId, dimension)
      });
    }
  }

  return {
    slaId,
    status: breaches.length === 0 ? 'met' : 'breached',
    breaches,
    consecutiveBreachDays: await getConsecutiveBreachDays(slaId),
    needsEscalation: breaches.length > 0 && await shouldEscalate(sla, breaches)
  };
}
```

---

## 7. Root Cause Analysis for Quality Issues

Systematic approach to understanding why data quality problems occur.

**Common root causes:**

| Symptom | Possible Root Causes |
|---------|---------------------|
| High null rates | Missing validation on input forms; integration not mapping all fields; optional fields that should be required |
| Duplicate records | No dedup check on create; multiple integrations importing same source; merge operations creating copies |
| Stale data | Sync frequency too low; integration credentials expired; agent not running refresh workflows |
| Format inconsistencies | No standardization on input; multiple systems with different formats; legacy data not migrated |
| Referential integrity violations | Cascading deletes not configured; out-of-order imports; race conditions in concurrent writes |

**Root cause analysis process:**
```
1. Detect: Quality check identifies an issue
2. Quantify: How many records are affected? What's the impact?
3. Categorize: Is this a one-time event or systemic?
4. Trace: Use data lineage to find where the problem was introduced
5. Identify: What process/agent/integration caused the issue?
6. Fix: Correct the data AND the process that created it
7. Verify: Confirm the fix resolved the issue
8. Prevent: Add validation rules to prevent recurrence
9. Document: Record the RCA in the quality log for future reference
```

**RCA template:**
```markdown
## Root Cause Analysis: [Issue Title]
- **Detected:** 2026-02-27 by Larry's hourly quality check
- **Impact:** 342 contact records with invalid phone formats
- **Root cause:** Bulk import from CRM integration used local phone format instead of E.164
- **Fix applied:** Re-standardized all affected records using phone standardizer
- **Prevention:** Added E.164 validation to CRM import pipeline
- **Verified:** Quality check passed on next run
```

---

## 8. Quality Improvement Cycles

Continuous improvement through measure-identify-fix-monitor loops.

**PDCA cycle for data quality:**

```
Plan:    Review quality scorecards, identify worst-performing dimensions
Do:      Implement fixes (cleansing, validation rules, process changes)
Check:   Run quality checks, compare before/after metrics
Act:     Standardize successful fixes, update SLAs if needed
```

**Quarterly quality improvement planning:**
```
Week 1:  Larry generates comprehensive quality report
Week 2:  Atlas reviews report, prioritizes improvements
Week 3-10: Agents implement improvements
Week 11: Larry measures improvement
Week 12: Atlas reviews results, adjusts priorities for next quarter
```

**Quality debt tracking:**
Like technical debt, quality debt accumulates when issues are deferred.
```typescript
interface QualityDebtItem {
  id: string;
  description: string;
  affectedRecords: number;
  estimatedFixEffort: 'low' | 'medium' | 'high';
  businessImpact: 'low' | 'medium' | 'high' | 'critical';
  discoveredAt: Date;
  deferredReason?: string;
  priorityScore: number; // businessImpact * affectedRecords / fixEffort
}
```

---

## 9. Agent Data Validation Responsibilities

Each agent role has specific data validation duties.

**Archy (Research):**
- Verify source credibility before citing
- Cross-reference facts across multiple sources
- Flag confidence level on all research outputs
- Never present single-source claims as established facts

**Sunday (Writer):**
- Fact-check all claims in generated content
- Verify statistics and numbers from source material
- Ensure quotes are accurate and attributed
- Check that links are valid and point to correct destinations

**Tina (CFO):**
- Validate all financial calculations
- Cross-check totals against line items
- Verify currency conversions use current rates
- Ensure tax calculations follow applicable rules

**Larry (Auditor):**
- Run integrity checks across all tables
- Verify audit log completeness (no gaps)
- Check that all required approvals exist for completed actions
- Validate that retention policies are being enforced

**Publishers (Kelly, Fran, etc.):**
- Validate content meets platform-specific requirements
- Check image dimensions and file sizes
- Verify hashtags and mentions are valid
- Confirm scheduling times are in appropriate windows

---

## 10. CRM Data Quality

Special considerations for customer relationship data, which is often the most valuable and most problematic data in the system.

**Contact deduplication strategy:**
```
Matching fields (weighted):
  Email (exact):        0.40 weight  → exact match = 1.0
  Phone (normalized):   0.25 weight  → exact match = 1.0
  Name (fuzzy):         0.20 weight  → Jaro-Winkler similarity
  Company (fuzzy):      0.15 weight  → Token-based similarity

Thresholds:
  > 0.90: Auto-merge (log the merge)
  0.75-0.90: Flag for review (suggest merge)
  < 0.75: Not a duplicate

Merge rules:
  - Keep the record with more complete data as survivor
  - Merge non-null fields from the duplicate into the survivor
  - Preserve all activity history (combine timelines)
  - Update all references to point to survivor ID
  - Keep the merge record for audit and potential undo
```

**Email validation pipeline:**
```
Level 1: Syntax check (RFC 5322 compliance)
Level 2: Domain check (MX record exists)
Level 3: Disposable email detection (block known disposable domains)
Level 4: Role-based detection (info@, admin@, support@ — flag, don't block)
Level 5: Deliverability check (SMTP verification — use sparingly, rate-limited)
```

**Company matching:**
```
Input:           "Acme Corp.", "ACME Corporation", "acme-corp"
Normalized:      "acme corp"
Matching steps:
  1. Normalize: lowercase, remove punctuation, expand abbreviations
  2. Token sort: alphabetize words ("corp acme" → "acme corp")
  3. Compare: Jaro-Winkler on normalized + token-sorted strings
  4. Domain match: if website domains match, confidence boost +0.3
```

**CRM quality metrics dashboard:**
```
Contact Health:
  Total contacts:        1,247
  Valid emails:          1,183 (94.9%)
  Valid phones:            892 (71.5%)
  Complete profiles:       756 (60.6%)  ← Improvement target
  Potential duplicates:     43 (3.4%)
  Stale (no activity 90d): 287 (23.0%)

Company Health:
  Total companies:         312
  With website:            289 (92.6%)
  With industry:           241 (77.2%)
  Potential duplicates:     18 (5.8%)
```

---

## Quality Monitoring Checklist

Daily checks (automated):
- [ ] Schema validation pass rate >99.9%
- [ ] No new referential integrity violations
- [ ] Null rates within acceptable bounds
- [ ] No new duplicate clusters detected

Weekly checks (Larry):
- [ ] Quality scorecards reviewed and shared
- [ ] SLA compliance verified
- [ ] Root cause analysis completed for new issues
- [ ] Quality debt backlog prioritized

Monthly checks (Atlas):
- [ ] Quality trends reviewed (improving/degrading)
- [ ] SLA targets reassessed
- [ ] Resource allocation for quality improvement
- [ ] Agent validation responsibilities reviewed
