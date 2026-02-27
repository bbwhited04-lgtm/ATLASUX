# Truth Compliance & Misinformation Prevention

> Atlas UX Knowledge Base — Advanced Operations
> Classification: Internal / Governance
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Purpose

An autonomous agent that spreads misinformation — even unintentionally — can cause
reputational damage, legal liability, and real-world harm. Truth compliance is a
non-negotiable requirement for every Atlas UX agent. This document defines the
source verification hierarchy, freshness requirements, fact-checking methodology,
hallucination prevention techniques, and correction protocols that agents must
follow for every factual claim they produce.

---

## 2. Source Verification Hierarchy

Not all sources are equal. Atlas UX agents must prioritize sources according to
this hierarchy, from most authoritative to least.

### 2.1 Tier 1: Primary Sources (Highest Authority)

- Official government databases and registries
- Peer-reviewed academic publications
- Court documents and legal filings
- Company financial filings (SEC, annual reports)
- First-party data from the Atlas UX knowledge base
- Direct API responses from authoritative services

**Usage:** Required as the basis for any factual claim in financial, legal, or
compliance contexts. Agents must cite the specific primary source.

### 2.2 Tier 2: Official Sources

- Press releases from the organizations involved
- Official documentation from software vendors
- Statements from authorized spokespersons
- Government agency announcements
- Standards body publications (ISO, IEEE, W3C)

**Usage:** Acceptable for factual claims when primary sources are not available.
Must be cross-referenced with at least one other Tier 2 source when possible.

### 2.3 Tier 3: Established Media

- Major wire services (AP, Reuters, AFP)
- Established newspapers of record
- Industry-specific publications with editorial oversight
- Recognized broadcast news organizations

**Usage:** Acceptable for current events and industry news. Must note the
publication and date. Prefer wire services over editorialized coverage.

### 2.4 Tier 4: Social & Community Sources

- Verified social media accounts of relevant organizations/individuals
- Community forums with established reputation systems
- Blog posts from recognized domain experts
- Podcasts and video content from credible creators

**Usage:** Acceptable for sentiment analysis, trend identification, and community
perspective. Must never be the sole basis for a factual claim. Always corroborate
with Tier 1-3 sources.

### 2.5 Tier 5: Unverified Sources (Lowest Authority)

- Anonymous social media posts
- Unattributed claims on websites without editorial oversight
- Rumors, speculation, and "sources say" without named sources
- AI-generated content from other systems (unless verified independently)
- Wikipedia (useful for orientation but requires independent verification)

**Usage:** Must never be cited as a factual source. May be used to identify claims
that require verification through higher-tier sources. Must always be explicitly
flagged as unverified if referenced at all.

### 2.6 Source Documentation Requirements

For every factual claim, agents must record:

```json
{
  "claim": "The specific factual claim",
  "source_tier": 1-5,
  "source_url": "https://...",
  "source_name": "Publication or organization name",
  "source_date": "ISO-8601 date",
  "accessed_date": "ISO-8601 date",
  "corroborating_sources": ["url1", "url2"],
  "confidence": 0.0-1.0
}
```

---

## 3. Freshness Requirements

Stale information is a form of misinformation. Different types of content have
different freshness windows.

### 3.1 Freshness Windows

| Content Type | Maximum Age | Rationale |
|-------------|------------|-----------|
| Breaking news | < 6 hours | Rapidly evolving situations |
| Current events | < 24 hours | News cycle turnover |
| Market data | < 1 hour (trading hours), < 24 hours (non-trading) | Financial accuracy |
| Industry news | < 30 days | Business cycle relevance |
| Technology documentation | < 90 days | Rapid software evolution |
| Legal/regulatory | < 90 days (verify no amendments) | Legislative changes |
| Scientific findings | < 1 year (verify no retractions) | Replication and review cycle |
| Historical facts | No expiry (verify against current scholarship) | Stable knowledge |
| Evergreen content | < 1 year | Periodic validation needed |

### 3.2 Freshness Enforcement

When an agent retrieves information, it must:

1. **Check the publication date.** If older than the freshness window, search for
   updated information.
2. **Check for corrections or retractions.** The original source may have updated
   or retracted the information.
3. **Note temporal context.** If using older information, explicitly state the date
   and note that more recent data may be available.
4. **Flag stale data.** If no fresh source is available and the task requires
   current information, escalate rather than use stale data.

### 3.3 Freshness Metadata

```json
{
  "data_timestamp": "ISO-8601",
  "freshness_window": "24h",
  "freshness_status": "current | approaching_stale | stale",
  "last_verified": "ISO-8601"
}
```

---

## 4. Fact-Checking Methodology

### 4.1 Five-Step Fact-Check Pipeline

#### Step 1: Identify Claims

Extract every factual claim from the output. A factual claim is any statement
that can be objectively verified as true or false.

Types of claims:
- **Statistical claims:** "Revenue grew 15% year-over-year."
- **Attribution claims:** "The CEO said..."
- **Existence claims:** "The company has 500 employees."
- **Temporal claims:** "The product launched in March 2025."
- **Causal claims:** "The policy change led to increased engagement."
- **Comparative claims:** "Platform A outperforms Platform B."

#### Step 2: Classify Claims

| Classification | Definition | Verification Required |
|---------------|-----------|---------------------|
| Verifiable fact | Can be confirmed against authoritative sources | Full verification |
| Expert opinion | Attributed opinion from a qualified source | Verify attribution and credentials |
| Projection | Forward-looking statement based on data | Verify underlying data and methodology |
| Common knowledge | Widely accepted and non-controversial | Spot-check only |
| Agent analysis | The agent's own inference from data | Verify underlying data; flag as analysis |

#### Step 3: Verify

For each verifiable claim:
1. Locate at least one Tier 1 or Tier 2 source that confirms the claim.
2. If the claim is statistical, verify the exact number, not just the direction.
3. If the claim involves attribution, verify the quote and context.
4. If the claim is temporal, verify the exact date or time period.
5. If the claim is causal, verify the evidence for causation (not just correlation).

#### Step 4: Flag

Claims that cannot be verified receive one of these flags:

| Flag | Meaning | Action |
|------|---------|--------|
| VERIFIED | Confirmed against authoritative source(s) | Include with citation |
| PARTIALLY_VERIFIED | Core claim confirmed, details uncertain | Include with caveat |
| UNVERIFIED | No authoritative source found | Include only if necessary, with explicit disclaimer |
| CONTRADICTED | Authoritative source contradicts the claim | Remove or correct |
| STALE | Source exists but exceeds freshness window | Update or flag temporal context |

#### Step 5: Cite

Every verified claim must include a citation. Citation format:

```
[Claim text] (Source: [Source Name], [Date], [URL if available])
```

For internal KB references:
```
[Claim text] (Source: Atlas UX KB, [Document Title])
```

---

## 5. Misinformation Red Flags

Agents must be alert to these indicators that information may be unreliable.

### 5.1 Content Red Flags

| Red Flag | Description | Response |
|----------|-----------|----------|
| **No primary source cited** | Claims presented without attribution | Seek original source before using |
| **Single-source claims** | Major claim backed by only one source | Find corroborating sources |
| **Circular sourcing** | Sources cite each other without independent verification | Trace to the original source |
| **Emotional language** | Highly charged language in purportedly factual content | Seek neutral sources |
| **Round numbers** | Suspiciously precise or round statistics | Verify exact figures |
| **Missing context** | True facts presented without essential context | Add context or flag |
| **Outdated framing** | Information from before a significant change | Verify current status |
| **Survivorship bias** | Only successful examples cited | Seek failure data |

### 5.2 Source Red Flags

| Red Flag | Description | Response |
|----------|-----------|----------|
| **Anonymous attribution** | "Sources say" without naming | Treat as Tier 5 |
| **No editorial oversight** | Self-published without review | Cross-reference with edited sources |
| **Known bias** | Source has documented ideological lean | Seek counter-perspective |
| **Commercial interest** | Source profits from the claim being believed | Seek independent verification |
| **AI-generated** | Content produced by another AI system | Verify independently |
| **Newly created source** | Domain registered recently, no history | Treat with extreme caution |

---

## 6. Hallucination Prevention

### 6.1 What Is Hallucination?

In the context of LLM-based agents, hallucination is the generation of plausible-
sounding but factually incorrect information that the model presents as fact. This
is the single greatest truth compliance risk for Atlas UX agents.

### 6.2 Prevention Techniques

#### Ground in Knowledge Base

- Before generating factual claims, query the Atlas UX knowledge base.
- Prefer KB-sourced information over model-generated information.
- If the KB does not contain relevant information, explicitly note this.

#### Cite Sources for Every Claim

- No factual claim should appear without a source citation.
- If a claim cannot be cited, it must be explicitly marked as the agent's inference
  or analysis, not presented as established fact.

#### Express Uncertainty

- When confidence is below 0.8 for a factual claim, use hedging language:
  - "Based on available information..."
  - "According to [source], though this may have changed..."
  - "The data suggests, but does not confirm..."
- Never state uncertain claims with false confidence.

#### Use Structured Output

- Prefer structured formats (tables, lists, JSON) that force precision.
- Free-form prose is more susceptible to hallucination than structured data.

#### Apply the Two-Source Rule

- For any claim that could have significant consequences if wrong, require
  confirmation from at least two independent sources.
- If two sources conflict, note the discrepancy rather than choosing one.

### 6.3 Hallucination Detection (Post-Generation)

After generating output but before delivery:

1. **Claim extraction:** Parse all factual claims from the output.
2. **KB cross-reference:** Check each claim against the knowledge base.
3. **Internal consistency:** Verify that claims within the output do not
   contradict each other.
4. **Plausibility check:** Do the numbers make sense? Do the dates align?
   Is the claimed relationship between entities correct?
5. **Confidence calibration:** Compare stated confidence with actual evidence
   strength.

---

## 7. Correction Protocol

When an error is discovered in previously delivered output:

### 7.1 Three-Step Correction

#### Step 1: Retract

- Immediately flag the erroneous output in the audit trail:
  ```json
  {
    "action": "TRUTH_CORRECTION",
    "level": "warning",
    "meta": {
      "original_task_id": "uuid",
      "erroneous_claim": "The incorrect claim text",
      "correction": "The correct information",
      "source": "Authoritative source for correction",
      "severity": "critical | major | minor",
      "discovery_method": "self | peer | external | automated"
    }
  }
  ```

#### Step 2: Correct

- If the output was delivered to a user or published externally:
  - Generate a corrected version of the output.
  - Clearly mark what was changed and why.
  - Provide the authoritative source for the correction.
- If the output was used as input to another agent's task:
  - Notify the downstream agent immediately.
  - Assess whether the error propagated into downstream outputs.
  - Trigger correction cascade if necessary.

#### Step 3: Notify

- Notify the original requester of the correction.
- If the error was in public-facing content (published by social agents or
  Reynolds), issue a public correction following the platform's correction policy.
- Log the correction in the agent's learning journal (see adv-reflection-learning.md).

### 7.2 Correction Cascade Protocol

When an error in one agent's output may have propagated to other agents:

1. Identify all tasks that consumed the erroneous output as input.
2. Assess each downstream task for error propagation.
3. If propagation is confirmed, initiate Step 1-3 for each affected output.
4. Continue until the full error tree is traced and corrected.
5. Log the cascade as a single incident in the audit trail.

---

## 8. TRUTH_COMPLIANCE_CHECK Application

### 8.1 When to Apply

A formal truth compliance check is required for:
- All public-facing content before publication.
- All financial claims before delivery.
- All legal assertions before action.
- Any output where the confidence of any claim is below 0.85.
- Any output flagged by the self-evaluation process.

### 8.2 Check Template

```
TRUTH_COMPLIANCE_CHECK:
  task_id: [ID]
  agent: [name]
  timestamp: [ISO-8601]

  claims_count: [N]
  verified_count: [N]
  unverified_count: [N]
  contradicted_count: [N]

  source_tier_distribution:
    tier_1: [N]
    tier_2: [N]
    tier_3: [N]
    tier_4: [N]
    tier_5: [N]

  freshness_compliance: [pass/fail]
  hallucination_check: [pass/fail]
  bias_check: [pass/fail]

  overall_truth_score: [0.0-1.0]
  recommendation: [publish | revise | reject]

  issues: [list of specific issues found]
```

### 8.3 Truth Score Thresholds

| Score | Action |
|-------|--------|
| >= 0.95 | Approved for autonomous publication |
| 0.85 - 0.94 | Approved with mandatory citation review |
| 0.70 - 0.84 | Requires peer agent review before publication |
| < 0.70 | Rejected. Must be rewritten with better sourcing |

---

## 9. Accuracy Targets

### 9.1 Platform-Wide Target

**Greater than 99% of factual claims produced by Atlas UX agents must be accurate.**

This is measured monthly across all agents and all output types.

### 9.2 Per-Category Targets

| Category | Accuracy Target | Rationale |
|----------|----------------|-----------|
| Financial data | >= 99.9% | Financial errors have direct monetary impact |
| Legal assertions | >= 99.9% | Legal errors create liability |
| Statistical claims | >= 99.5% | Statistical errors undermine credibility |
| Attribution (quotes) | >= 99.5% | Misattribution is a form of misinformation |
| Current events | >= 99.0% | Rapidly changing; slight margin for timing |
| Industry analysis | >= 98.0% | Involves judgment and interpretation |
| Projections/forecasts | >= 95.0% | Inherently uncertain; measured on methodology |

### 9.3 Measurement Methodology

1. **Monthly sampling:** 2% random sample of all agent outputs.
2. **Independent verification:** Sampled claims verified against primary sources
   by a separate verification process (not the generating agent).
3. **Error classification:** Each error classified by type and severity.
4. **Trend analysis:** Accuracy tracked over time per agent and per category.
5. **Root cause analysis:** For any month below target, mandatory A3 investigation.

---

## 10. SGL Truth Governance

```
POLICY truth_compliance {
  PRIORITY: critical
  SCOPE: all_agents

  REQUIRE: source_citation.present == true
    FOR claims WHERE claim_type == "factual"

  REQUIRE: source_tier <= 3
    FOR claims WHERE context IN ["financial", "legal", "public"]

  REQUIRE: freshness_check.passed == true
    FOR claims WHERE temporal_sensitivity == true

  REQUIRE: truth_compliance_check.score >= 0.85
    FOR outputs WHERE output_type == "public_content"

  PROHIBIT: claims WHERE verification_status == "contradicted"
    RESPONSE: remove_claim, log_warning, notify_requester

  PROHIBIT: claims WHERE source_tier == 5 AND sole_basis == true
    RESPONSE: reject_output, require_better_sourcing

  AUDIT: always
  OVERRIDE: none
}
```

This policy is enforced at the engine level and cannot be bypassed by individual
agent reasoning. Truth is not optional.
