# Multi-Agent Orchestration Patterns

> Advanced guide to coordinating autonomous AI agents in Atlas UX's engine loop.
> Audience: Platform engineers, AI architects, and advanced operators.

---

## Overview

Multi-agent orchestration is the discipline of coordinating multiple autonomous agents to accomplish goals that no single agent could achieve alone. Atlas UX runs 30+ named agents — each with distinct roles, tools, and policies — all governed by the engine loop that ticks every 5 seconds. The orchestration pattern you choose determines throughput, fault tolerance, latency, and correctness.

This document covers 10 orchestration patterns, when to use each, and how they map to Atlas UX's architecture.

---

## 1. Master-Worker Pattern

The foundational pattern in Atlas UX. Atlas (CEO) acts as the master: decomposing high-level objectives into discrete tasks and assigning them to specialist agents.

**How it works:**
- Atlas receives a strategic directive (e.g., "Launch Q2 marketing campaign")
- Atlas decomposes into sub-tasks: content plan (Sunday), competitive analysis (Archy), budget allocation (Tina), social scheduling (publisher agents)
- Each worker agent receives a `delegate_task` intent with clear deliverables
- Workers report completion back; Atlas aggregates results

**Implementation in Atlas UX:**
```
Intent: ORCHESTRATION_REASONING
Actor: atlas
Payload: { directive, subtasks: [{ agent, task, priority, deadline }] }
```

Each subtask becomes a queued job. The engine loop picks them up using `FOR UPDATE SKIP LOCKED`, ensuring no two workers claim the same task.

**Strengths:** Clear accountability, centralized visibility, easy to audit.
**Weaknesses:** Atlas becomes a bottleneck; single point of failure for task decomposition.

**When to use:** Strategic initiatives requiring cross-functional coordination. Any task where a human would assign work to a team.

---

## 2. Pipeline Pattern (Sequential Handoffs)

Tasks flow through a chain of agents, each transforming or enriching the output before passing it to the next.

**Canonical Atlas UX pipeline:**
```
Archy (Research) → Sunday (Writing) → Venny (Image) → Kelly/Fran/Dwight (Publish)
```

Each agent's output becomes the next agent's input. The pipeline is encoded as a workflow (e.g., WF-054 through WF-059 for social publishers).

**Implementation details:**
- Each stage creates a job with `depends_on` pointing to the previous job's ID
- The engine loop only picks up a job when all dependencies are in `completed` status
- If any stage fails, downstream jobs remain `queued` indefinitely (or until timeout triggers escalation)

**Error handling:**
- Retry logic: each stage retries up to 3 times with exponential backoff
- Dead letter: after max retries, the job moves to `failed` and Atlas receives an alert
- Skip logic: optional stages (e.g., image generation) can be marked `skippable: true`

**Strengths:** Predictable flow, easy to monitor progress, natural for content production.
**Weaknesses:** Latency accumulates; one slow stage blocks everything downstream.

---

## 3. Broadcast Pattern

Atlas sends a directive to all agents (or a subset) simultaneously. Each agent acts independently on the same information.

**Use cases:**
- Platform intel sweep (WF-093 through WF-105): 13 agents simultaneously scan their respective platforms
- Emergency announcements: Atlas broadcasts a policy change to all agents
- Daily briefing distribution: Daily-Intel sends the morning brief to all department heads

**Implementation:**
```typescript
// Engine creates N jobs simultaneously, one per target agent
const agents = ['binky', 'tina', 'larry', 'jenny', 'sunday', ...];
await Promise.all(agents.map(agent =>
  createJob({ type: 'BROADCAST_DIRECTIVE', agent, payload: directive })
));
```

**Fan-out / fan-in:** After broadcast, Atlas often needs to collect responses. This uses the map-reduce pattern (see section 9) — broadcast is the "map" phase.

**Strengths:** Maximum parallelism, fast dissemination.
**Weaknesses:** No coordination between agents; risk of conflicting actions.

---

## 4. Auction Pattern

When a task could be handled by multiple agents, the auction pattern lets agents bid based on their current capacity, expertise, and cost.

**How it works:**
1. Atlas announces a task with requirements (skills needed, deadline, budget)
2. Eligible agents evaluate the task against their current load and capabilities
3. Each agent submits a bid: estimated completion time, confidence score, token cost
4. Atlas selects the winning bid based on a scoring function

**Scoring function:**
```
score = (capability_match * 0.4) + (availability * 0.3) + (cost_efficiency * 0.2) + (historical_accuracy * 0.1)
```

**Atlas UX application:** When a customer support ticket could be handled by Cheryl (Support), Jenny (Legal), or Binky (CRO) depending on the nature of the request. The auction determines the best-fit agent.

**Implementation:**
- Task announcement is a special intent type: `TASK_AUCTION`
- Agents have a `evaluate_task` tool that returns their bid
- Atlas collects bids within a timeout window (default: 10 seconds)
- Winner receives a standard `delegate_task` intent

**Strengths:** Optimal task assignment, load balancing, cost control.
**Weaknesses:** Added latency from bidding round; requires agents to self-assess accurately.

---

## 5. Blackboard Pattern

A shared knowledge space that all agents can read from and write to. Agents monitor the blackboard for information relevant to their expertise and contribute their findings.

**Atlas UX implementation:** The Knowledge Base (KB) serves as the blackboard. Agents write research findings, analysis results, and recommendations to KB documents. Other agents query the KB before making decisions.

**How it works:**
1. A problem is posted to the KB (e.g., "Should we enter the European market?")
2. Archy writes market research findings
3. Tina adds financial analysis
4. Jenny contributes regulatory assessment
5. Larry flags compliance risks
6. Atlas reads all contributions and synthesizes a decision

**Key properties:**
- Asynchronous: agents contribute on their own schedule
- Additive: contributions accumulate without overwriting
- Observable: any agent can read any contribution (subject to tenant isolation)

**Data structure:**
```
KB Document: { id, tenantId, topic, contributions: [
  { agentId, timestamp, content, confidence, sources }
] }
```

**Strengths:** Decoupled agents, rich context accumulation, supports complex analysis.
**Weaknesses:** No guaranteed ordering; agents may act on stale information; requires conflict resolution for contradictory contributions.

---

## 6. Hierarchical Decomposition

Atlas UX's org chart is not decorative — it encodes a real decomposition hierarchy.

**Three levels:**
```
Level 0: Atlas (CEO) — Strategic objectives
Level 1: Department Heads — Binky (CRO), Tina (CFO), Larry (Auditor), Jenny (CLO)
Level 2: Specialists — Sunday, Archy, Venny, Victor, publishers, Petra, etc.
```

**Decomposition rules:**
- Atlas never directly assigns tasks to Level 2 agents (except in emergencies)
- Department heads decompose Atlas's directives into specialist-level tasks
- Specialists never escalate directly to Atlas — they go through their department head

**Benefits for SGL compliance:**
- Each level has its own approval authority (AUTO_SPEND_LIMIT cascades down)
- Risk assessment happens at every level
- Audit trail shows the full decomposition chain

**Example flow:**
```
Atlas: "Increase Q2 revenue by 15%"
  → Binky: "Launch 3 new marketing campaigns"
    → Sunday: "Write campaign copy for Campaign A"
    → Archy: "Research target demographics for Campaign B"
    → Kelly: "Schedule X/Twitter posts for Campaign C"
  → Tina: "Allocate $50K marketing budget across campaigns"
  → Mercer: "Identify 2 acquisition targets in adjacent markets"
```

---

## 7. Consensus Pattern

Multiple agents vote on a decision. Used when the stakes are high and no single agent should have unilateral authority.

**When consensus is required (per SGL):**
- Spend above 2x AUTO_SPEND_LIMIT_USD
- Actions affecting more than 100 users/contacts
- Policy changes that affect multiple departments
- Risk tier 3 or higher actions

**Voting mechanics:**
- Quorum: minimum 3 agents must vote
- Threshold: 2/3 majority required for approval
- Tie-breaking: Atlas casts the deciding vote
- Abstention: agents with no relevant expertise abstain (don't count toward quorum)

**Implementation:**
```typescript
interface ConsensusVote {
  agentId: string;
  decision: 'approve' | 'reject' | 'abstain';
  reasoning: string;
  confidence: number; // 0.0 - 1.0
  conditions?: string[]; // "approve if budget < $10K"
}
```

**Integration with Decision Memos:** Consensus votes are recorded as metadata on the DecisionMemo. The memo's `status` only moves to `approved` when the voting threshold is met.

---

## 8. Swarm Intelligence

Emergent behavior from simple agent rules. Rather than centralized orchestration, agents follow local rules and useful global behavior emerges.

**Simple rules for Atlas UX agents:**
1. If your queue is empty, check the shared task pool
2. If you see a task you can handle better than the current assignee, offer to swap
3. If you detect an anomaly in your domain, alert your department head
4. If a peer agent's output quality drops, flag it for review

**Applications:**
- Content quality improvement: publisher agents collectively raise quality by reviewing each other's outputs
- Anomaly detection: multiple agents independently monitoring different signals creates emergent threat detection
- Load balancing: agents naturally redistribute work without central coordination

**Constraints in Atlas UX:** Pure swarm intelligence is limited by SGL guardrails. Agents cannot autonomously reassign work or override policies. Swarm behaviors are advisory — Atlas still makes final decisions.

---

## 9. Map-Reduce for Agents

Distribute work across agents (map), then collect and synthesize results (reduce).

**Map phase:** Break a large task into N independent subtasks, assign one to each agent.
**Reduce phase:** Collect all results and synthesize into a single output.

**Example — Weekly Executive Summary (WF-106):**
```
MAP:
  Binky → Revenue report
  Tina → Financial summary
  Larry → Compliance report
  Archy → Market intelligence
  Petra → Project status
  Daily-Intel → KPI dashboard

REDUCE:
  Atlas → Synthesize all reports into executive summary
```

**Implementation:**
- Map phase uses broadcast pattern (section 3)
- Reduce phase waits for all map jobs to complete (or timeout)
- Atlas uses ORCHESTRATION_REASONING to synthesize — not LONG_CONTEXT_SUMMARY (avoids 90s timeout issues)

**Partial reduce:** If some agents fail or timeout, Atlas can produce a partial summary with a note about missing sections. This is preferable to blocking on a single failing agent.

---

## 10. Choreography vs. Orchestration

**Orchestration (centralized):** Atlas controls the flow. Every task goes through Atlas for routing and coordination. This is Atlas UX's primary model.

**Choreography (decentralized):** Agents react to events and coordinate peer-to-peer. No central controller.

**Atlas UX uses both:**

| Scenario | Model | Reason |
|----------|-------|--------|
| Strategic initiatives | Orchestration | Atlas needs full visibility |
| Content pipeline | Choreography | Sunday, Venny, publishers hand off naturally |
| Emergency response | Orchestration | Atlas coordinates incident response |
| Routine social posting | Choreography | Publishers operate independently on schedule |
| Budget decisions | Orchestration | Tina and Atlas must approve |

**Hybrid approach:** Atlas UX uses orchestration as the default but allows choreography within well-defined boundaries. The SGL policies define which agent-to-agent interactions can happen without Atlas's involvement.

**Choreography constraints:**
- Agents can only delegate to agents they `reportsTo` or who report to them
- Cross-department choreography requires Atlas approval
- All choreographed interactions are still logged to the audit trail

---

## Choosing a Pattern

| Pattern | Best For | Latency | Complexity | Fault Tolerance |
|---------|----------|---------|------------|-----------------|
| Master-Worker | General task assignment | Medium | Low | Medium |
| Pipeline | Content production, ETL | High | Low | Low |
| Broadcast | Notifications, intel sweeps | Low | Low | High |
| Auction | Ambiguous task routing | Medium | High | Medium |
| Blackboard | Complex analysis | High | Medium | High |
| Hierarchical | Organization-scale work | Medium | Medium | Medium |
| Consensus | High-stakes decisions | High | High | High |
| Swarm | Emergent optimization | Variable | Low | High |
| Map-Reduce | Aggregation, reporting | Medium | Medium | Medium |
| Choreography | Routine, well-defined flows | Low | Medium | Medium |

---

## Engine Loop Integration

All patterns ultimately execute through the same engine loop:

```
Every 5 seconds:
  1. Query jobs table for queued jobs (FOR UPDATE SKIP LOCKED)
  2. For each claimed job:
     a. Resolve the target agent's configuration (SKILL.md, POLICY.md)
     b. Build the agent's context (recent memory, relevant KB docs)
     c. Execute the agent's reasoning (LLM call with tools)
     d. Process tool calls (delegate_task, send_email, etc.)
     e. Update job status (completed/failed)
     f. Log to audit trail
  3. Check for timed-out jobs (running > MAX_JOB_DURATION)
  4. Process any escalations or consensus votes
```

The orchestration pattern determines how jobs are *created* and how they *relate to each other*. The engine loop is pattern-agnostic — it simply processes whatever jobs are in the queue.

---

## Anti-Patterns to Avoid

1. **Circular delegation:** Agent A delegates to B, B delegates back to A. Prevent with delegation depth limits.
2. **Orchestration without observation:** Assigning work without monitoring completion. Always set deadlines and escalation rules.
3. **Over-orchestration:** Routing simple tasks through Atlas when agents could handle them independently. Adds latency and wastes Atlas's token budget.
4. **Consensus on trivial decisions:** Using voting for low-risk, reversible actions. Reserve consensus for genuinely high-stakes decisions.
5. **Ignoring agent capacity:** Assigning work without checking queue depth. Leads to unbounded queue growth and stale results.
