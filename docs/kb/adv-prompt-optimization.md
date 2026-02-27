# Prompt Optimization & Testing

## Overview

Prompt engineering is not a one-shot activity. Production-grade AI systems require systematic optimization, versioning, testing, and continuous improvement of prompts. This document covers the full lifecycle of prompt optimization as practiced within the Atlas UX agent platform, from initial design through A/B testing, regression suites, and self-optimization loops.

---

## A/B Testing Prompts

### Why A/B Test Prompts

Small changes in wording, structure, or instructions can cause 10-40% swings in output quality. A/B testing removes guesswork by measuring performance against real workloads.

### Implementation Strategy

1. **Define the metric**: Choose 1-3 measurable criteria (accuracy, user satisfaction, token cost, latency).
2. **Create variants**: Change one variable at a time (instruction phrasing, example count, output format, system message tone).
3. **Split traffic**: Route 50/50 or 80/20 (control/variant) by tenant, session, or request ID.
4. **Collect results**: Log both the prompt variant ID and the quality score to the audit trail.
5. **Statistical significance**: Require at least 100 samples per variant and p < 0.05 before declaring a winner.

### Atlas UX Implementation

The engine loop tags each intent with a `prompt_variant_id` in its metadata. Downstream quality signals (decision memo approval rate, user feedback, task completion) are correlated back to the variant. Agents with >500 daily intents can converge on optimal prompts within 48 hours.

### Common Pitfalls

- Testing multiple variables simultaneously (confounding)
- Declaring winners too early (statistical noise)
- Not accounting for task-type distribution shifts across test periods
- Ignoring latency and cost differences between variants

---

## Prompt Versioning

### Semantic Versioning for Prompts

Apply SemVer to prompt management:

- **Major (X.0.0)**: Fundamental restructuring, new reasoning pattern, or output format change. Requires full regression testing.
- **Minor (0.X.0)**: New capabilities added (additional few-shot examples, new edge case handling). Backward-compatible.
- **Patch (0.0.X)**: Typo fixes, minor wording adjustments, whitespace changes. No functional change expected.

### Changelog Format

```
## v2.3.1 — 2026-02-27
- Patch: Fixed typo in System prompt ("recieve" → "receive")
- No functional change expected

## v2.3.0 — 2026-02-25
- Minor: Added 2 few-shot examples for multilingual ticket classification
- Expected: +5% accuracy on non-English tickets

## v2.0.0 — 2026-02-20
- Major: Switched from single-shot to Chain-of-Density pattern
- Breaking: Output format changed from paragraph to structured JSON
- Requires: Update all downstream consumers
```

### Storage

Prompt versions are stored in the `kb_documents` table with `category: "prompt-template"` and version metadata in the `meta` JSON field. The engine resolves the active version per agent at boot time and caches it for the duration of the tick cycle.

---

## Temperature Tuning by Task Type

Temperature controls randomness in token sampling. Incorrect temperature is the most common cause of inconsistent agent output quality.

### Temperature Guidelines

| Task Category | Temperature | Rationale |
|---|---|---|
| Code generation | 0.0 - 0.1 | Deterministic correctness required |
| Data extraction | 0.0 - 0.1 | Must match source exactly |
| Classification | 0.0 - 0.2 | Consistent categorization |
| Analytical reasoning | 0.1 - 0.3 | Slight variation explores reasoning paths |
| Business writing | 0.3 - 0.5 | Professional but not robotic |
| Summarization | 0.2 - 0.4 | Faithful but fluent |
| Creative content | 0.7 - 0.9 | Variety and engagement |
| Brainstorming | 0.8 - 1.0 | Maximum creative divergence |
| Social media posts | 0.6 - 0.8 | Personality and engagement |

### Agent-Specific Defaults

- **Tina (CFO)**: 0.1 — financial calculations demand precision
- **Sunday (Writer)**: 0.6 for drafts, 0.2 for editing passes
- **Kelly (X/Twitter)**: 0.75 — platform rewards personality and wit
- **Jenny (CLO)**: 0.15 — legal language must be precise
- **Archy (Research)**: 0.2 for analysis, 0.5 for hypothesis generation
- **Atlas (CEO)**: 0.3 — balanced judgment, not creative flair

### Dynamic Temperature

For multi-stage tasks, temperature should change per stage:
```
Stage 1: Ideation (temp=0.9) → 20 ideas
Stage 2: Filtering (temp=0.1) → rank top 5
Stage 3: Expansion (temp=0.5) → develop top 3
Stage 4: Refinement (temp=0.2) → polish final output
```

---

## Token Optimization

Tokens directly translate to cost and latency. Reducing tokens without sacrificing quality is a core optimization discipline.

### Techniques

1. **Prune system prompts**: Remove redundant instructions. If the model already follows a behavior, the instruction is wasted tokens. Audit which instructions actually change output.

2. **Compress few-shot examples**: Use the shortest examples that still demonstrate the pattern. Replace verbose examples with minimal ones.

3. **Use structured output directives**: "Respond in JSON with keys: summary, score, action" costs fewer tokens than explaining the format in prose.

4. **Reference by ID**: Instead of repeating a 500-token policy document in every prompt, store it in KB and reference: "Follow policy KB-042."

5. **Batched context**: When an agent processes 10 similar items, send them in one prompt with shared context rather than 10 separate prompts each repeating the context.

6. **Output length constraints**: Explicitly set max tokens or instruct "respond in under 100 words" to prevent verbose outputs.

7. **Remove politeness tokens**: "Please," "Thank you," "Could you kindly" add tokens without improving output. Use direct instructions.

### Measurement

Track tokens per task type over time:
```
Task: ticket_classification
v1.0: avg 1,847 tokens (input + output)
v1.1: avg 1,203 tokens (-35%) — pruned system prompt
v1.2: avg 987 tokens (-18%) — compressed few-shot examples
Quality delta: +0.3% accuracy (within noise)
```

---

## Prompt Compression Techniques

### LLMLingua-Style Compression

Remove tokens from the prompt that have high predictability (low information content). The model can reconstruct meaning from the remaining tokens.

**Before (47 tokens):**
```
Please analyze the following customer support ticket and classify it into one of the following categories: billing, technical, shipping, account, or general inquiry.
```

**After (23 tokens):**
```
Classify this support ticket: billing | technical | shipping | account | general_inquiry
```

### Context Distillation

Pre-process long reference documents into compressed versions optimized for the downstream task:

1. Full document (5000 tokens) passes through a summarization prompt
2. Output is a task-relevant summary (500 tokens)
3. Summary is cached and reused across all prompts needing that context
4. Cache invalidated when source document is updated

### Selective Retrieval

In RAG pipelines, retrieve only the most relevant chunks rather than top-K:

- Use relevance score thresholds (not just top-5)
- Apply Maximal Marginal Relevance (MMR) to deduplicate similar chunks
- Rerank retrieved chunks with a cross-encoder before injection

---

## Evaluation Metrics

### Core Metrics

| Metric | Definition | Measurement Method |
|---|---|---|
| **Accuracy** | Factual correctness of output | Human eval or ground-truth comparison |
| **Coherence** | Logical flow and internal consistency | LLM-as-judge scoring (1-5 scale) |
| **Relevance** | Addresses the actual question asked | Semantic similarity to ideal answer |
| **Completeness** | Covers all required aspects | Checklist coverage scoring |
| **Factuality** | Claims are verifiable and true | Fact extraction + verification pipeline |
| **Tone** | Matches target voice and register | Style classifier or human eval |
| **Conciseness** | Information density without padding | Token count relative to information units |
| **Actionability** | Output can be directly acted upon | Boolean: does it include next steps? |

### Composite Scoring

Weight metrics by task type:
```
Content creation: 0.2*accuracy + 0.2*coherence + 0.15*relevance + 0.15*tone + 0.15*conciseness + 0.15*completeness
Classification: 0.6*accuracy + 0.2*completeness + 0.2*conciseness
Code generation: 0.4*accuracy + 0.2*completeness + 0.2*conciseness + 0.2*coherence
```

### LLM-as-Judge

Use a separate LLM call (different model or same model with judge-specific prompt) to evaluate output:
```
You are evaluating the quality of an AI-generated response.
Criteria: [list criteria with rubric]
Response to evaluate: [output]
Score each criterion 1-5 with brief justification.
```

Atlas UX logs judge scores to the audit trail, enabling per-agent quality tracking over time.

---

## Prompt Regression Testing

### What Breaks Prompts

- Model updates (provider changes weights)
- System prompt modifications
- Context window changes
- New few-shot examples that create unintended patterns
- Tool schema changes that alter available actions

### Regression Suite Structure

```
test/
  prompts/
    ticket-classification/
      v2.3.0.prompt.json        # The prompt template
      cases/
        standard-billing.json    # Input + expected output
        multilingual-es.json
        edge-ambiguous.json
        adversarial-injection.json
      thresholds.json            # Min accuracy: 0.92, max latency: 2s
```

### Running Regressions

1. Execute each test case against the prompt
2. Score outputs using evaluation metrics
3. Compare against threshold minimums
4. Flag any regression (score drop > 5% from baseline)
5. Block deployment if critical thresholds are breached

### Frequency

- On every prompt version bump (pre-merge)
- Weekly against production prompts (detect model-side drift)
- After any model provider update announcement

---

## Prompt Libraries

### Organization

Structure prompts as reusable, composable modules:

```
library/
  system-messages/
    agent-base.md            # Shared across all agents
    role-cfo.md              # Tina-specific additions
    role-writer.md           # Sunday-specific additions
  patterns/
    react-loop.md            # ReAct template
    chain-of-density.md      # CoD template
    constitutional-check.md  # Self-critique template
  output-formats/
    json-structured.md       # JSON output instructions
    markdown-report.md       # Report format
    decision-memo.md         # Decision memo format
  guardrails/
    safety-check.md          # Safety pre-check
    pii-filter.md            # PII detection instructions
    brand-voice.md           # Brand consistency rules
```

### Composition

A production prompt is assembled from library components:
```
[system-messages/agent-base.md]
[system-messages/role-cfo.md]
[patterns/react-loop.md]
[guardrails/safety-check.md]
[output-formats/json-structured.md]
---
User query: {input}
```

This modular approach means fixing a guardrail updates all agents simultaneously.

---

## Agent Self-Optimization via Audit Trail

### The Feedback Loop

Atlas UX agents have a unique advantage: the audit trail captures every action, its outcome, and downstream effects. This data fuels self-optimization.

### Process

1. **Collect**: Every prompt execution logs variant ID, input hash, output hash, latency, token count, and downstream outcome (approval/rejection, user feedback, task success).

2. **Analyze**: Weekly analysis identifies:
   - Which prompt variants correlate with higher approval rates
   - Which task types have declining quality scores
   - Which agents have the highest token-to-value ratio
   - Which few-shot examples are no longer representative

3. **Hypothesize**: Generate candidate prompt improvements:
   - "Tickets from enterprise clients may need different few-shot examples"
   - "Temperature 0.3 outperforms 0.5 for weekly reports"
   - "Adding a step-back question improves financial analysis accuracy"

4. **Test**: Deploy candidates as A/B variants (see section above).

5. **Promote**: Winners replace current production prompts with a version bump.

### Guardrails on Self-Optimization

- No prompt change is auto-deployed. All changes create a decision memo for human review.
- Maximum one prompt variable change per optimization cycle.
- Rollback is automatic if quality drops >10% within 24 hours of deployment.
- The optimization loop itself is rate-limited to prevent prompt thrashing.

---

## Cost-Quality Frontier

### Mapping the Tradeoff

For each task type, map cost (tokens * price_per_token) against quality score:

```
Task: competitive_analysis
├── Minimal (800 tokens, quality: 0.62) — single prompt, no examples
├── Standard (1500 tokens, quality: 0.78) — 3 few-shot, structured output
├── Enhanced (2200 tokens, quality: 0.88) — CoD + self-critique
└── Maximum (3500 tokens, quality: 0.91) — full RCI with 3 iterations
```

The jump from Standard to Enhanced (+47% cost) yields +12.8% quality. Enhanced to Maximum (+59% cost) yields only +3.4% quality. For most tasks, Enhanced is the optimal point on the frontier.

### Model Routing by Task Complexity

Not every task needs the most expensive model:
- **Simple classification**: Fast, cheap model (Cerebras, GPT-4o-mini)
- **Standard analysis**: Mid-tier model (DeepSeek, GPT-4o)
- **Complex reasoning**: Premium model (Claude Opus, GPT-4)
- **Creative content**: Model with best creative benchmarks for the format

Atlas UX's `ai.ts` multi-model routing enables per-task model selection, optimizing the cost-quality frontier across the entire agent roster.

---

## Monitoring and Alerting

### Key Metrics to Track

- **Prompt latency P50/P95/P99**: Detect provider degradation
- **Token cost per task type per day**: Detect prompt bloat or traffic spikes
- **Quality score rolling average**: Detect silent regressions
- **Rejection rate by agent**: High rejection = prompt quality issue
- **Hallucination rate**: Track factuality scores, alert on decline

### Alert Thresholds

```yaml
alerts:
  quality_drop:
    condition: rolling_7d_quality < baseline - 0.05
    severity: warning
    action: flag for prompt review
  cost_spike:
    condition: daily_cost > 2x rolling_7d_average
    severity: critical
    action: throttle + investigate
  latency_degradation:
    condition: p95_latency > 10s for 15 minutes
    severity: critical
    action: switch to fallback model
```

All alerts are routed through the existing Atlas UX notification system (Telegram, email, Teams) to ensure the operations team is informed immediately.
