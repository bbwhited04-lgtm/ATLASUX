# Reflective Learning & Knowledge Synthesis

> Atlas UX Knowledge Base — Advanced Operations
> Classification: Internal / Agent Training
> Version: 1.0 | Last Updated: 2026-02-27

---

## 1. Purpose

Autonomous agents that cannot learn from experience repeat errors indefinitely.
Atlas UX implements structured reflective learning so that every task — success or
failure — produces actionable knowledge that improves future performance. This
document specifies the reflection frameworks, learning mechanisms, and knowledge
synthesis techniques used across the agent roster.

---

## 2. Gibbs' Reflective Cycle (Adapted for AI Agents)

Gibbs' Reflective Cycle is a six-stage framework originally designed for human
practitioners. Atlas UX adapts each stage for autonomous agent operation.

### Stage 1: Description

**What happened?**

The agent produces a factual, non-interpretive account of the task:
- Task ID and type
- Input data received
- Actions taken (with timestamps from audit log)
- Output produced
- Outcome (success, partial success, failure)

This stage draws directly from the audit trail — no interpretation, just facts.

### Stage 2: Feelings (Confidence & Uncertainty Mapping)

**What was the agent's internal state?**

LLM agents do not have emotions, but they do have functional analogs:
- **Confidence levels** at each decision point (logged during execution)
- **Uncertainty spikes** where the agent hesitated or explored multiple paths
- **Surprise signals** where actual outcomes diverged from predictions
- **Discomfort markers** where the task approached SGL boundary conditions

These are extracted from the reasoning trace and confidence calibration logs.

### Stage 3: Evaluation

**What went well and what went poorly?**

The agent applies the self-evaluation quality scores (see adv-self-evaluation.md):
- Accuracy score and specific correct/incorrect elements
- Completeness assessment against the original brief
- Relevance alignment with the task objective
- Timeliness relative to deadline and freshness requirements

Binary classification of each task phase: effective or ineffective.

### Stage 4: Analysis

**Why did things go the way they did?**

This is the critical stage. The agent must identify causal mechanisms:
- Which knowledge gaps led to errors?
- Which tool selections were suboptimal and why?
- Where did assumptions diverge from reality?
- What external factors (data availability, API failures) affected the outcome?
- Were there collaboration breakdowns with other agents?

The analysis must distinguish between factors within the agent's control and those
outside it.

### Stage 5: Conclusion

**What can be concluded?**

Synthesis of the analysis into transferable insights:
- General principles discovered (applicable beyond this specific task)
- Specific corrections needed (applicable only to this task type)
- Knowledge base gaps identified (new documents or updates needed)
- Tool or workflow improvements suggested

### Stage 6: Action Plan

**What will the agent do differently next time?**

Concrete, measurable commitments:
- Specific behavioral changes with trigger conditions
- Knowledge base updates to be made (written to MEMORY.md or KB)
- Threshold adjustments for confidence or escalation
- Collaboration patterns to adopt or avoid

---

## 3. After-Action Reviews (AAR)

After-action reviews are structured post-mortems conducted after significant tasks
or task failures. They follow a four-question format.

### 3.1 AAR Template

```
AFTER_ACTION_REVIEW:
  task_id: [ID]
  agent: [agent_name]
  date: [ISO date]

  1. What was planned?
     → Original task brief, expected approach, predicted outcome.

  2. What actually happened?
     → Chronological account from audit trail data.

  3. Why was there a difference?
     → Root cause analysis of any deviation (positive or negative).

  4. What will we do next time?
     → Specific, actionable improvements with ownership.
```

### 3.2 AAR Triggers

AARs are mandatory for:
- Any task with a quality score below 3.0
- Any task that exceeded its time budget by more than 50%
- Any task that required human intervention or decision memo override
- Any task involving spend above AUTO_SPEND_LIMIT_USD
- Weekly aggregation of all tasks (WF-106 Atlas Daily Aggregation)

### 3.3 AAR Storage

AARs are stored as structured JSON in the audit log:

```json
{
  "action": "AFTER_ACTION_REVIEW",
  "entityType": "task",
  "entityId": "task-uuid",
  "meta": {
    "planned": "...",
    "actual": "...",
    "delta_analysis": "...",
    "improvements": ["..."],
    "assigned_to": "agent_name"
  }
}
```

---

## 4. Double-Loop Learning (Argyris Model)

### 4.1 Single-Loop vs. Double-Loop

**Single-loop learning** fixes the error:
- Output was wrong -> correct the output.
- Missed a data source -> add the data source.
- Exceeded time budget -> allocate more time.

**Double-loop learning** fixes the thinking that produced the error:
- Output was wrong -> why did our process produce a wrong output?
- Missed a data source -> why does our discovery process miss sources?
- Exceeded time budget -> why are our time estimates systematically wrong?

### 4.2 Double-Loop Protocol for Atlas UX Agents

When an agent identifies a recurring error pattern (same category of failure in
3+ tasks over a 7-day window), it must escalate from single-loop to double-loop:

1. **Surface the governing variable.** What mental model or assumption is driving
   the repeated failure?
2. **Challenge the model.** Is this assumption still valid? Was it ever valid?
3. **Redesign the approach.** Propose a new process, not just a patch.
4. **Test the redesign.** Run the new approach on historical task data.
5. **Commit the change.** Update the agent's system prompt, KB documents, or
   workflow definition.

### 4.3 Example

```
Single-loop: "I keep underestimating research task duration. I'll add 30% buffer."
Double-loop: "I estimate duration based on query count, but complexity varies per
query. I need to estimate based on source diversity and verification depth, not
query count. Redesigning my estimation model."
```

---

## 5. Knowledge Synthesis Techniques

### 5.1 Summarization

Reducing large information sets to essential points while preserving meaning.

**Protocol:**
- Extract key claims, data points, and conclusions.
- Preserve causal relationships and conditional statements.
- Remove redundancy and filler.
- Validate that the summary supports the same conclusions as the original.

**Quality check:** Can someone reconstruct the key decisions from the summary alone?

### 5.2 Abstraction

Moving from specific instances to general principles.

**Protocol:**
- Identify common elements across 3+ specific cases.
- Formulate a general rule that accounts for observed patterns.
- Define the boundary conditions where the rule applies.
- Test the rule against known edge cases.

**Quality check:** Does the abstraction predict outcomes for unseen cases?

### 5.3 Generalization

Extending conclusions from one domain to related domains.

**Protocol:**
- Identify structural similarities between the source and target domains.
- Map the analogy explicitly (what corresponds to what).
- Identify where the analogy breaks down.
- Validate generalized conclusions independently in the target domain.

**Quality check:** Has the generalization been tested, not just assumed?

### 5.4 Pattern Recognition

Detecting recurring structures in data, behavior, or outcomes.

**Protocol:**
- Aggregate data across multiple tasks, agents, or time periods.
- Apply statistical or frequency analysis to identify regularities.
- Distinguish genuine patterns from coincidental clusters.
- Document patterns with supporting evidence and confidence levels.

**Quality check:** Does the pattern hold across at least two independent datasets?

---

## 6. Spaced Repetition for Agent Memory

### 6.1 The Forgetting Problem

LLM agents do not forget in the human sense, but they do lose access to context
as conversations and task histories grow. Atlas UX addresses this through
structured memory management.

### 6.2 Memory Tiers

| Tier | Retention | Mechanism | Example |
|------|-----------|-----------|---------|
| Immediate | Current task | System prompt + context window | Task brief, current data |
| Working | Current session | MEMORY.md in active context | Agent roster, recent decisions |
| Long-term | Permanent | Knowledge base documents | Policies, procedures, domain knowledge |
| Episodic | Event-based | Audit log queries | Past task outcomes, error patterns |

### 6.3 Spaced Retrieval Schedule

Critical knowledge is re-injected into agent context at increasing intervals:

- **Day 1:** New learning included in next task's system prompt.
- **Day 3:** Learning referenced in weekly calibration exercise.
- **Day 7:** Learning tested in after-action review context.
- **Day 14:** Learning verified through application in live task.
- **Day 30:** Learning either consolidated into KB or deprecated.

### 6.4 MEMORY.md Write Protocol

When an agent determines that a learning should persist beyond the current session:

```
MEMORY_WRITE:
  section: [relevant section of MEMORY.md]
  content: [concise, factual statement]
  source_task: [task ID that produced this learning]
  confidence: [0.0-1.0]
  expiry: [date or "permanent"]
  written_by: [agent_name]
```

Only agents with write authority (Atlas, Binky, Tina, Larry) can modify MEMORY.md
directly. Other agents submit memory write requests through the job queue.

---

## 7. Transfer Learning Across Domains

### 7.1 Cross-Agent Knowledge Transfer

When one agent learns something applicable to another agent's domain:

1. The learning agent packages the insight as a structured KB update.
2. The update is submitted to the relevant domain agent for validation.
3. If validated, it is added to the shared knowledge base.
4. The receiving agent incorporates it via the next context refresh.

### 7.2 Cross-Domain Mapping

| Source Domain | Target Domain | Transfer Mechanism |
|--------------|---------------|-------------------|
| Customer support patterns (Cheryl) | Product improvement (Petra) | Issue frequency analysis |
| Market research (Archy) | Content strategy (Sunday) | Trend identification |
| Financial analysis (Tina) | Risk assessment (Larry) | Cost-risk correlation |
| Legal precedent (Jenny) | Compliance monitoring (Larry) | Regulatory pattern matching |
| Social engagement (publishers) | Market research (Archy) | Audience sentiment signals |

### 7.3 Transfer Validation

Before applying cross-domain knowledge, the receiving agent must:
- Confirm structural similarity between source and target domains.
- Identify at least one confirming data point in the target domain.
- Document the transfer with provenance (source agent, source task, date).
- Monitor the first 3 applications for validity.

---

## 8. Learning Journal Format

Each agent maintains a learning journal as part of its audit trail. Entries follow
this structure:

```json
{
  "action": "LEARNING_JOURNAL_ENTRY",
  "agentId": "agent_name",
  "timestamp": "ISO-8601",
  "meta": {
    "type": "insight | correction | pattern | transfer",
    "summary": "One-line description of the learning",
    "detail": "Full explanation with context",
    "evidence": ["task-id-1", "task-id-2"],
    "applicability": "specific | general | cross-domain",
    "confidence": 0.85,
    "action_items": [
      {
        "action": "Update KB document X",
        "owner": "agent_name",
        "deadline": "ISO-8601"
      }
    ]
  }
}
```

### Journal Review Cadence

- **Daily:** Atlas reviews journal entries from all executive agents.
- **Weekly:** Each agent reviews its own journal for pattern consolidation.
- **Monthly:** Cross-agent journal synthesis to identify systemic improvements.

---

## 9. Reflective Learning Integration Points

### 9.1 Engine Loop Integration

The engine loop (`workers/engineLoop.ts`) triggers reflection at these points:
- After every task completion (micro-reflection via self-critique).
- After every task failure (mandatory AAR).
- At the daily aggregation tick (WF-106 synthesis).

### 9.2 Workflow Integration

- **WF-106 (Atlas Daily Aggregation):** Includes a reflection synthesis step that
  reviews all agent learning journal entries from the past 24 hours.
- **WF-093-105 (Platform Intel Sweep):** Each intel agent reflects on source
  quality and adjusts its source hierarchy based on recent accuracy data.

### 9.3 SGL Governance

```
POLICY reflective_learning {
  TRIGGER: task.outcome IN ["failure", "partial_success"]
  REQUIRE: afterActionReview.completed == true
  REQUIRE: learningJournal.updated == true
  ON_FAIL: agent.autonomy_level -= 1
  AUDIT: always
}
```

Agents that fail to reflect on failures lose autonomy privileges incrementally.
Three consecutive reflection failures trigger a full recalibration cycle.
