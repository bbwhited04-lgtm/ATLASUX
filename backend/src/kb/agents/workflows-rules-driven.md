# Rules-Driven Workflows — Conditional Branching and Business Rules

## What Is a Rules-Driven Workflow?

A rules-driven workflow uses conditional logic to determine which path the workflow takes. Instead of a fixed sequence, the workflow evaluates business rules at decision points and routes execution accordingly. "If the order total exceeds $500, require manager approval. Otherwise, auto-approve."

Rules-driven workflows sit between sequential (too rigid) and case workflows (too unstructured). They provide flexibility within a defined set of paths.

## Core Concepts

**Rule** — A condition that evaluates to true or false: `order.total > 500`, `customer.tier === "premium"`, `risk_score >= 3`.

**Decision Point** — A node in the workflow where rules are evaluated and a path is chosen.

**Rule Engine** — A system that evaluates rules against data and determines the outcome. Can be simple if/else logic, a decision table, or a full rule engine (Drools, json-rules-engine).

## Decision Tables

The most readable way to express complex rules:

| Customer Tier | Order Total | Risk Score | Action |
|--------------|-------------|------------|--------|
| Premium | Any | < 3 | Auto-approve |
| Premium | > $1,000 | ≥ 3 | Manager approval |
| Standard | ≤ $500 | < 2 | Auto-approve |
| Standard | > $500 | Any | Manager approval |
| New | Any | Any | Manager approval |

## Implementation

```typescript
type Rule = {
  name: string;
  condition: (data: Record<string, unknown>) => boolean;
  action: string; // Next step or workflow path
  priority: number; // Higher = checked first
};

const approvalRules: Rule[] = [
  {
    name: "premium-low-risk",
    condition: (d) => d.customerTier === "premium" && (d.riskScore as number) < 3,
    action: "auto_approve",
    priority: 10,
  },
  {
    name: "high-value-order",
    condition: (d) => (d.orderTotal as number) > 500,
    action: "manager_approval",
    priority: 5,
  },
  {
    name: "new-customer",
    condition: (d) => d.customerTier === "new",
    action: "manager_approval",
    priority: 8,
  },
  {
    name: "default",
    condition: () => true,
    action: "auto_approve",
    priority: 0,
  },
];

function evaluateRules(rules: Rule[], data: Record<string, unknown>): string {
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    if (rule.condition(data)) return rule.action;
  }
  return "default";
}
```

## Common Use Cases

**Routing** — Route support tickets to the right team based on category, severity, and customer tier.

**Scoring** — Calculate lead scores based on engagement signals, then route hot leads to sales immediately while warm leads get an email sequence.

**Eligibility** — Determine if a user qualifies for a promotion, discount, or feature based on their profile and behavior.

**Escalation** — Automatically escalate issues that exceed time thresholds or fail quality checks.

**Pricing** — Apply dynamic pricing rules based on volume, customer tier, season, and inventory.

## Atlas UX Rules-Driven Examples

**Agent Risk Assessment:**
```
IF action.spendUSD > AUTO_SPEND_LIMIT_USD → require decision memo
IF action.riskTier >= 2 → require decision memo
IF action.isRecurring === true → block (recurring purchases blocked by default)
IF dailyActionCount >= MAX_ACTIONS_PER_DAY → reject
ELSE → auto-execute
```

**Query Classification (queryClassifier.ts):**
```
IF query matches DIRECT_PATTERNS → tier: DIRECT (no KB needed)
IF query matches ORG_MEMORY_PATTERNS → tier: FULL_RAG
IF query matches PLAYBOOK_PATTERNS → tier: FULL_RAG
IF query matches WIKI_PATTERNS → tier: FULL_RAG
IF query matches SKILL_PATTERNS → tier: SKILL_ONLY
IF query matches HOT_CACHE_PATTERNS → tier: HOT_CACHE
ELSE → tier: FULL_RAG (novel question)
```

**Search Tier Selection:**
```
IF source === "voice" OR source === "chat" → search: [public, tenant]
IF source === "admin" → search: [public, internal]
IF source === "engine" → search: [public, internal, tenant]
```

## Rule Composition

Rules can be combined with AND, OR, NOT:

```typescript
const rule = and(
  greaterThan("orderTotal", 500),
  or(
    equals("customerTier", "new"),
    greaterThan("riskScore", 3)
  ),
  not(equals("region", "internal"))
);
```

## Advantages

- **Business-readable** — Decision tables can be reviewed by non-engineers
- **Flexible** — Add new rules without restructuring the workflow
- **Testable** — Each rule can be unit tested independently
- **Auditable** — Log which rule fired and why

## Limitations

- **Rule conflicts** — Multiple rules can match; priority resolution needed
- **Complexity creep** — 50+ rules become hard to maintain and debug
- **Hidden dependencies** — Rules may interact in unexpected ways
- **Performance** — Evaluating many rules against each input adds latency

## Resources

- [json-rules-engine (npm)](https://github.com/CacheControl/json-rules-engine) — A lightweight, production-ready rules engine for JavaScript
- [Decision Model and Notation (DMN)](https://www.omg.org/dmn/) — OMG standard for modeling business decisions and rules

## Image References

1. Decision table layout — "business rules decision table matrix conditions actions diagram"
2. Rules-driven workflow branching — "rules driven workflow conditional branching decision point diagram"
3. Rule engine architecture — "rule engine architecture facts rules inference actions diagram"
4. IF-THEN-ELSE flowchart — "conditional branching flowchart if then else decision diamond diagram"
5. Lead scoring rules example — "lead scoring rules matrix engagement signals qualification diagram"

## Video References

1. [Business Rules Engines Explained — IBM](https://www.youtube.com/watch?v=Q6xY8s8dPqQ) — How rule engines work and when to use them
2. [Decision Tables for Developers — CodeOpinion](https://www.youtube.com/watch?v=aDsUMhBNbVg) — Practical guide to implementing decision tables in code
