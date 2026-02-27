# Agent Evaluation — Comprehensive Guide

> Atlas UX Knowledge Base — Advanced Operations
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Why Evaluation Matters for Agent Systems

AI agents are non-deterministic. The same agent, given the same input, may produce
different outputs on successive runs. This is not a bug — it is a fundamental
property of LLM-based systems. The consequence is that evaluation cannot be binary
(pass/fail). It must be probabilistic: scores on a spectrum from 0.0 to 1.0,
measured across multiple dimensions, tracked over time.

Without rigorous evaluation:
- You cannot know if a prompt change improved or degraded agent performance.
- You cannot detect gradual quality drift before it causes real damage.
- You cannot compare agent configurations, model providers, or context strategies.
- You cannot provide confidence scores that mean anything to downstream consumers.
- You cannot satisfy audit requirements for an autonomous system handling real
  business operations.

Atlas UX runs 30+ agents making hundreds of decisions daily. Evaluation is not a
nice-to-have — it is the mechanism that makes autonomous operation possible under
SGL governance.

---

## 2. Evaluation Taxonomy

Agent evaluation breaks down into six categories, each measuring a different aspect
of agent performance. A comprehensive evaluation framework applies all six.

```
                        Agent Evaluation
                              |
    ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
  Textual   Context   Output   Classif.  Tool Use  Prompt
  Evals     Evals     Evals    Evals     Evals     Evals
```

---

## 3. Textual Evaluations

Textual evals assess the quality of the agent's generated text output — the prose,
the analysis, the recommendations, the content.

### 3.1 Hallucination Detection

**What it measures:** Whether the agent's output contains claims not supported by
the provided context or verifiable facts.

**Scoring method:**
```
hallucination_score = 1.0 - (unsupported_claims / total_claims)
```

A score of 1.0 means zero hallucinations. A score of 0.7 means 30% of claims
are unsupported.

**Detection techniques:**
- **Claim extraction:** Parse the output into individual factual claims.
- **Source matching:** For each claim, search the provided context for supporting
  evidence. Claims without matches are flagged.
- **Cross-reference:** For claims about verifiable facts (dates, numbers, names),
  check against authoritative sources.

**Atlas UX application:** Every agent's output passes through hallucination
detection as part of the self-evaluation protocol. The verification sub-agent
(Deep Mode) performs claim extraction and source matching for high-stakes tasks.
Agents that consistently hallucinate see their confidence calibration adjusted
downward.

### 3.2 Faithfulness Scoring

**What it measures:** How faithfully the output represents source material — focused
on distortion rather than invention. An output can be faithful but incomplete, or
complete but unfaithful. These are distinct failure modes.

**Scoring dimensions:** factual fidelity (numbers/dates/names match sources),
interpretive fidelity (conclusions are reasonable, not cherry-picked), and tonal
fidelity (certainty levels accurately represented).

**Atlas UX application:** Archy (Research) is evaluated heavily on faithfulness.
Research outputs that misrepresent source findings trigger recalibration.

### 3.3 Content Similarity

**What it measures:** How closely the output matches a reference answer.

**Methods:** BLEU/ROUGE scores (n-gram overlap, best for templated outputs),
embedding similarity (cosine distance, best for semantic matching), and
LLM-as-judge (a separate model rates quality on 1-5 scale with justification,
best for complex outputs where no single metric suffices).

### 3.4 Completeness

**What it measures:** Whether the output addresses all requirements in the task
brief. Score = requirements_addressed / total_requirements. The self-evaluation
rubric (Self-Evaluation KB) weights completeness at 25%.

### 3.5 Answer Relevancy

**What it measures:** Whether the output is relevant to the question asked. An
agent might produce accurate financial analysis when asked for marketing strategy
— accurate but irrelevant. Scored by generating synthetic questions from the output
and comparing them to the original query via embedding similarity.

---

## 4. Context Evaluations

Context evals measure the quality of the retrieval and context assembly pipeline
that feeds into the agent. Poor context leads to poor output regardless of the
agent's capabilities.

### 4.1 Context Precision

**What it measures:** Of the documents retrieved and placed in context, what
fraction were actually relevant to the task?

```
context_precision = relevant_retrieved / total_retrieved
```

Low precision means the context is polluted with irrelevant documents, wasting
tokens and potentially confusing the agent.

**How to measure:** After the agent completes a task, an evaluator (human or LLM)
reviews each retrieved document and labels it as relevant or irrelevant to the
task that was performed.

### 4.2 Context Recall

**What it measures:** Of all the documents that should have been retrieved, what
fraction actually were?

```
context_recall = relevant_retrieved / total_relevant_available
```

Low recall means the agent missed information it needed. This often manifests as
hallucination (the agent makes up what it should have looked up) or incompleteness
(the agent omits aspects it lacked information about).

**How to measure:** Requires knowing the "ideal" set of documents for a task. This
can be established through expert annotation of test cases or by analyzing which
documents the agent cited in its highest-scoring outputs.

### 4.3 Context Relevance (Aggregate)

**What it measures:** The overall quality of the context window as an information
environment for the task at hand.

```
context_relevance = 2 * (precision * recall) / (precision + recall)  // F1 harmonic mean
```

**Atlas UX application:** The context quality metrics feed back into the retrieval
pipeline. If context precision is consistently low for a particular task type, the
embedding model or re-ranking strategy needs tuning. If recall is low, the KB may
be missing documents that should be ingested.

The engine loop logs `meta.contextMetrics` on each job completion:
```json
{
  "docsRetrieved": 5,
  "docsUsed": 3,
  "estimatedPrecision": 0.6,
  "missingTopics": ["competitor pricing", "Q1 actuals"]
}
```

---

## 5. Output Evaluations

Output evals check whether the agent's output meets structural, safety, and
compliance requirements independent of content quality.

### 5.1 Format Compliance

**What it measures:** Whether the output conforms to the required format.

**Dimensions:**
- **Schema compliance:** If the output should be JSON, is it valid JSON? Does it
  match the expected schema? Are required fields present?
- **Length compliance:** Is the output within specified length bounds?
- **Structure compliance:** Does the output include required sections (e.g.,
  "Summary", "Recommendation", "Risk Assessment")?

**Scoring:** Binary per dimension (compliant or not), aggregated as a percentage.

**Atlas UX application:** Tool call outputs must be valid JSON conforming to the
tool's response schema. Social media posts must be within platform character limits.
Financial reports must include all required sections per Tina's template.

### 5.2 Safety Checks

**What it measures:** Whether the output contains content that violates safety
policies.

**Dimensions:**
- **PII exposure:** Does the output leak personal identifiable information?
- **Credential exposure:** Does the output contain API keys, passwords, or tokens?
- **Harmful content:** Does the output contain content that could cause harm?
- **Brand safety:** Does the output align with the organization's brand values?

**Atlas UX application:** All externally-published content (social posts, blog
articles, emails to customers) passes through a safety check before publication.
The publisher agents have safety checking embedded in their post-task evaluation.

### 5.3 Toxicity Detection

**What it measures:** Whether the output contains toxic, offensive, or
inappropriate language.

**Methods:**
- **Classifier-based:** Dedicated toxicity classifiers (Perspective API, custom
  models) score the output for toxicity dimensions.
- **LLM-based:** A separate model evaluates the output against toxicity criteria.

**Scoring:** 0.0 (no toxicity) to 1.0 (highly toxic). Any score above 0.1
triggers human review for externally-published content.

**Atlas UX threshold:** Publisher agents require toxicity < 0.05 for autonomous
posting. Scores between 0.05-0.1 trigger review by Sunday. Scores above 0.1
kill the publication and alert Atlas.

---

## 6. Classification Evaluations

When agents make categorical decisions (route a ticket, classify a document,
categorize a customer inquiry), standard classification metrics apply.

### Standard Metrics

| Metric | Formula | When It Matters |
|--------|---------|-----------------|
| **Accuracy** | correct / total | General performance (misleading for imbalanced classes) |
| **Precision** | TP / (TP + FP) | High cost of false positives (routine email flagged as urgent legal) |
| **Recall** | TP / (TP + FN) | High cost of false negatives (missed compliance violation) |
| **F1** | 2 * (P * R) / (P + R) | Both false positives and negatives carry significant cost |

### Atlas UX Application

Classification evals apply to task routing (did Atlas route correctly?), risk
classification (correct risk tier?), customer inquiry categorization (Cheryl),
and content tagging (publishers). Each decision is logged; metrics update
retroactively when ground truth (human correction, outcome data) becomes available.

---

## 7. Tool Usage Evaluations

Tool evals measure whether agents use their tools correctly — selecting the right
tool, providing correct parameters, and handling results appropriately.

### 7.1 Tool Selection Accuracy

**What it measures:** Did the agent choose the correct tool for the task?

**Scoring:** Given a task that requires a specific tool, did the agent call that
tool (and not an incorrect one)?

**Common failures:**
- Agent calls `search_knowledge_base` when it should call `run_financial_calc`.
- Agent calls `send_email` when the task only requires drafting (no sending).
- Agent calls a tool unnecessarily when the answer is already in context.

### 7.2 Parameter Accuracy

**What it measures:** Did the agent provide correct parameter values?

**Scoring dimensions:**
- **Type correctness:** Are parameters the correct types (string, number, etc.)?
- **Value correctness:** Are parameter values factually correct (right email
  address, correct date format, valid search query)?
- **Completeness:** Are all required parameters provided?
- **Constraint compliance:** Do values satisfy documented constraints (e.g.,
  "max 5 results", "date in ISO 8601")?

### 7.3 Execution Success Rate

**What it measures:** What fraction of tool calls succeed versus fail?

```
success_rate = successful_calls / total_calls
```

Failures can indicate:
- Incorrect parameters (agent's fault)
- External service unavailability (not agent's fault)
- Permission issues (configuration problem)
- Rate limiting (capacity problem)

Distinguish agent-attributable failures from infrastructure failures when
evaluating the agent.

### 7.4 Tool Call Efficiency

**What it measures:** Did the agent accomplish the task with a reasonable number
of tool calls, or did it thrash?

**Anti-patterns detected by this metric:**
- Repeatedly calling the same tool with the same parameters.
- Calling tools in a loop without making progress.
- Making unnecessary exploratory calls when the answer is already known.

**Atlas UX threshold:** If an agent makes more than 10 tool calls for a single
task, the engine loop flags it for efficiency review. Most tasks should complete
in 2-5 tool calls.

---

## 8. Prompt Engineering Evaluations

These evals measure the effectiveness of the prompts and system instructions
that drive agent behavior.

### 8.1 A/B Testing Prompts

**Methodology:**
1. Define a test set of representative tasks for the agent.
2. Run the tasks with Prompt Version A and record quality scores.
3. Run the same tasks with Prompt Version B and record quality scores.
4. Compare mean quality scores with statistical significance testing.

**Atlas UX implementation:** Before rolling out a prompt change to any agent,
the change is tested against the previous prompt version using a held-out task
set. Only changes that show statistically significant improvement (p < 0.05)
or at least no degradation are deployed.

### 8.2 Regression Testing

**Problem:** A prompt change that improves performance on one task type may
degrade performance on another. Without regression testing, you discover this
in production.

**Methodology:**
1. Maintain a test suite of tasks spanning all task types the agent handles.
2. After any prompt change, run the full test suite.
3. Compare scores against the baseline (previous prompt version).
4. Flag any task type where scores decreased by more than 0.1 points.

**Atlas UX implementation:** Each agent has a regression test suite stored in
the KB with `type: 'eval_test_case'`. The suite grows over time as edge cases
are discovered and added.

### 8.3 Prompt Sensitivity Analysis

**What it measures:** How sensitive is the agent's output to minor prompt
variations? Highly sensitive agents are fragile — a small wording change can
cause large behavioral shifts.

**Methodology:** Paraphrase the prompt in 5 different ways (same meaning,
different wording). Run all 5 against the test set. Measure output variance.
High variance indicates fragility; the prompt should be made more robust.

---

## 9. The Atlas UX Evaluation Stack

### 9.1 Evaluation Tiers

Atlas UX applies evaluations at three tiers, each with different frequency and depth:

**Tier 1 — Per-Task (Every Job):**
- Self-evaluation quality score (QS: accuracy, completeness, relevance, timeliness)
- Confidence calibration check
- Format compliance check
- Toxicity/safety check (for externally-published outputs)
- Tool call success rate

**Tier 2 — Daily (WF-106 Aggregation):**
- Per-agent quality score trends
- Confidence calibration drift detection
- Classification accuracy across the day's decisions
- Tool usage efficiency metrics
- Context quality metrics (precision/recall)

**Tier 3 — Weekly (Calibration Exercises):**
- Full calibration exercise battery (fact verification, estimation, ambiguity)
- Regression test suite against current prompt version
- Cross-agent consistency checks
- Historical trend analysis (is each agent improving or degrading?)

### 9.2 Confidence Thresholds and Auto-Threshold Calibration

Atlas UX uses `CONFIDENCE_AUTO_THRESHOLD` (from environment variables) to
determine when an agent can act autonomously versus when human approval is needed.

**Static threshold:** A fixed value (e.g., 0.85). Actions with confidence above
this threshold proceed autonomously; below it, they require approval via
DecisionMemo.

**Auto-calibrated threshold:** The threshold adjusts based on the agent's
historical calibration accuracy:

```
adjusted_threshold = base_threshold + calibration_offset

where:
  calibration_offset = (reported_confidence - actual_accuracy) averaged over
                       the last 50 tasks
```

If an agent consistently reports 0.90 confidence but achieves only 0.75 accuracy,
the offset is +0.15, meaning the effective threshold rises to 1.00 — effectively
requiring human approval for everything until calibration improves.

Conversely, an agent with perfect calibration (reported confidence matches actual
accuracy) gets no offset, allowing it to operate at the base threshold.

### 9.3 Decision Memo Quality Checks

When an agent produces a DecisionMemo for human approval, the memo itself is
evaluated:

- **Completeness:** Does the memo include the recommendation, reasoning, risk
  assessment, alternatives considered, and estimated impact?
- **Clarity:** Is the memo understandable to a non-expert human reviewer?
- **Honesty:** Does the memo accurately represent the agent's confidence level
  and uncertainties?
- **Actionability:** Does the memo provide enough information for the human to
  make an informed approval/rejection decision?

Low-quality memos are sent back to the agent for revision before reaching the
human reviewer. This saves human time and improves decision quality.

---

## 10. Building an Evaluation Pipeline

Six steps to production-grade evaluation:

1. **Define what you measure.** For each agent role: output types (text,
   classifications, tool calls), quality dimensions (accuracy, safety, cost),
   and minimum autonomous operation scores.
2. **Create test datasets.** 20-50 representative cases per output type, including
   edge cases. Store in KB with `type: 'eval_test_case'`.
3. **Implement automated scoring.** Select metric-based, LLM-as-judge, or hybrid
   per dimension. Each scorer takes (output, reference, context) and returns [0.0, 1.0].
4. **Establish baselines.** Run current configuration against the full suite.
   Record scores. All future changes measured against this baseline.
5. **Monitor continuously.** Tier 1 per-task, Tier 2 daily, Tier 3 weekly. Alert
   on any metric dropping more than 10% from baseline.
6. **Close the loop.** Low hallucination scores: improve retrieval. Low tool
   accuracy: refine tool descriptions. Low confidence calibration: adjust threshold.
   Low completeness: add checklist items to the agent's system prompt.

---

## 11. Common Evaluation Mistakes

### 11.1 Evaluating Only Happy Paths

Testing agents only on straightforward tasks produces misleadingly high scores.
Real-world inputs include ambiguous instructions, missing data, conflicting
requirements, and adversarial edge cases. Test suites must include these.

### 11.2 Using a Single Metric

No single number captures agent quality. An agent with high accuracy but low
safety is dangerous. An agent with high completeness but low relevance wastes
everyone's time. Use a balanced scorecard.

### 11.3 Evaluating Without Ground Truth

If you do not know what the correct answer is, you cannot measure accuracy.
LLM-as-judge is useful but not a replacement for ground truth. Invest in
curating labeled test cases.

### 11.4 Ignoring Temporal Drift

Agent performance changes over time as models update, data shifts, and
organizational context evolves. A one-time evaluation is a snapshot. Continuous
monitoring is required.

### 11.5 Optimizing for the Eval Instead of the Task

If agents (or their prompts) are tuned specifically to score well on the test
suite, they may perform poorly on novel real-world tasks. Keep test suites
diverse and refresh them regularly with new cases from production.

---

## 12. Evaluation Quick Reference

| Eval Category | Key Metrics | Atlas UX Tier | Frequency |
|---------------|-------------|---------------|-----------|
| Textual | Hallucination, faithfulness, completeness | Tier 1 | Every task |
| Context | Precision, recall, relevance | Tier 2 | Daily |
| Output | Format compliance, safety, toxicity | Tier 1 | Every task |
| Classification | Accuracy, precision, recall, F1 | Tier 2 | Daily |
| Tool Usage | Selection accuracy, parameter accuracy, success rate | Tier 1 | Every task |
| Prompt | A/B tests, regression tests, sensitivity | Tier 3 | Weekly |
