# Agentic Orchestration Patterns

> Advanced guide to workflow orchestration, pipelines, and agent coordination in autonomous systems.
> Audience: Platform engineers, AI architects, and Atlas UX operators.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Plan-Then-Execute](#1-plan-then-execute)
3. [Discrete Phase Separation](#2-discrete-phase-separation)
4. [Planner-Worker Separation](#3-planner-worker-separation)
5. [Continuous Autonomous Task Loop](#4-continuous-autonomous-task-loop)
6. [Sub-Agent Spawning](#5-sub-agent-spawning)
7. [Swarm Migration](#6-swarm-migration)
8. [Lane-Based Execution Queueing](#7-lane-based-execution-queueing)
9. [Factory over Assistant](#8-factory-over-assistant)
10. [Hybrid LLM/Code Workflow Coordinator](#9-hybrid-llmcode-workflow-coordinator)
11. [Workspace-Native Multi-Agent Orchestration](#10-workspace-native-multi-agent-orchestration)
12. [CLI-Native Agent Orchestration](#11-cli-native-agent-orchestration)
13. [Initializer-Maintainer Dual Agent](#12-initializer-maintainer-dual-agent)
14. [Spectrum of Control / Blended Initiative](#13-spectrum-of-control--blended-initiative)
15. [Choosing the Right Pattern](#choosing-the-right-pattern)
16. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

Orchestration determines how autonomous agents receive work, coordinate with each other, and deliver results. The choice of orchestration pattern affects throughput, fault tolerance, latency, and auditability. Atlas UX's engine loop ticks every 5 seconds, processing queued jobs via `FOR UPDATE SKIP LOCKED` -- the orchestration pattern determines how those jobs are created, sequenced, and related.

This document synthesizes 14 orchestration patterns drawn from production systems at Anthropic, Cursor, AMP, Cloudflare, and other teams building with autonomous agents.

---

## 1. Plan-Then-Execute

**Status:** Emerging | **Source:** Beurer-Kellner et al. (2025), Boris Cherny (Anthropic)

Split reasoning into two strict phases: the LLM generates a fixed sequence of tool calls before seeing any untrusted data, then a controller executes that exact sequence. Tool outputs may shape parameters but cannot change which tools run.

**Why it matters:** When planning and execution are interleaved, untrusted tool outputs can influence which action is selected next -- making control flow attackable.

**Implementation:**

```
plan = LLM.make_plan(prompt)      # frozen list of calls
for call in plan:
    result = tools.run(call)
    stash(result)                 # outputs isolated from planner
```

**Dynamic boundary:** The threshold of what requires planning changes with each model generation. Newer, more capable models push the boundary outward -- tasks that once required explicit plan mode can now be handled in a single pass.

**Atlas UX relevance:** Atlas uses ORCHESTRATION_REASONING to generate task decomposition plans before delegating to specialist agents. The plan is committed to the jobs table before any agent begins execution, preserving control-flow integrity.

**Trade-offs:**
- Strong control-flow integrity and moderate flexibility
- Content of outputs can still be poisoned (e.g., bad email body)
- Can 2-3x success rates for complex tasks when approach is aligned first

---

## 2. Discrete Phase Separation

**Status:** Emerging | **Source:** Sam Stettner (Ambral)

Break development workflows into isolated phases with clean handoffs. Each phase runs in a separate context window focused exclusively on its objective:

- **Research Phase** -- Deep exploration of requirements and constraints. No implementation concerns.
- **Planning Phase** -- Create structured roadmap. No coding distractions.
- **Implementation Phase** -- Execute each plan step. Focus purely on code quality.

**Key principle:** Pass only distilled conclusions between phases, not full conversation history. This prevents context pollution while maintaining information flow.

**Model matching:** Research and planning benefit from reasoning-focused models (Opus), while implementation benefits from execution-focused models (Sonnet).

**Atlas UX relevance:** Archy (Research) produces distilled findings that flow to Sunday (Writing) who produces content that flows to publishers. Each agent operates in a clean context window with only the distilled output from the previous phase.

**Trade-offs:**
- Higher quality outputs in each phase due to focused attention
- Requires discipline to maintain phase boundaries
- Information loss risk if handoffs are poorly structured

---

## 3. Planner-Worker Separation

**Status:** Emerging | **Source:** Cursor Engineering Team

For large-scale, long-running projects, separate agent roles into a hierarchical structure:

- **Planners** continuously explore the codebase and create tasks. They can spawn sub-planners, making planning itself parallel and recursive.
- **Workers** pick up tasks and focus entirely on completing them. They do not coordinate with other workers.
- **Judges** determine at the end of each cycle whether to continue or whether the goal is achieved.

**Scale evidence from Cursor:**
- Web browser from scratch: 1M lines of code across 1,000 files over a week
- Solid to React migration: 3 weeks, +266K/-193K edits
- Excel clone: 12K commits, 1.6M LoC

**Key insights:**
1. Model choice matters -- different models excel at different roles
2. Many improvements came from removing complexity rather than adding it
3. Workers starting fresh each cycle combats drift and tunnel vision

**Atlas UX relevance:** Atlas (CEO) acts as the planner, decomposing strategic directives into subtasks for department heads (Binky, Tina, Larry), who further decompose for specialists (Sunday, Archy, Kelly). The engine loop's job queue is the task distribution mechanism.

**Trade-offs:**
- Scales to hundreds of concurrent agents working for weeks
- Significant prompt engineering required for coordination behavior
- Token waste is real but far outweighed by throughput gains

---

## 4. Continuous Autonomous Task Loop

**Status:** Established | **Source:** Internal Practice

A continuous loop that handles task selection, execution, and completion without human intervention:

1. **Fresh context per iteration** -- each task starts clean to avoid contamination
2. **Autonomous task selection** -- specialized subagents pick the next task
3. **Automated git management** -- commits and status updates via dedicated subagents
4. **Intelligent rate limit handling** -- exponential backoff on API limits
5. **Configurable execution limits** -- safety bounds prevent runaway execution

```
MAX_ITERATIONS=50
for iteration in range(MAX_ITERATIONS):
    task = task_master.select_next()
    result = main_agent.execute(task)     # fresh context
    git_master.commit(result)
    if rate_limited:
        backoff(300)                      # 5 min backoff
```

**Atlas UX relevance:** The engine loop (`workers/engineLoop.ts`) is itself a continuous autonomous task loop, ticking every `ENGINE_TICK_INTERVAL_MS` (5000ms), claiming jobs via `FOR UPDATE SKIP LOCKED`, executing them, and updating statuses. The daily scheduler fires workflows at fixed times (WF-010 at 08:30 UTC, WF-031 at 06:00 UTC).

**Trade-offs:**
- Eliminates manual task orchestration overhead
- Best for discrete, well-defined tasks
- Requires safety limits to prevent runaway execution

---

## 5. Sub-Agent Spawning

**Status:** Validated in production | **Source:** Quinn Slack, Thorsten Ball, Will Larson

Let the main agent spawn focused sub-agents, each with its own fresh context, to work in parallel on shardable subtasks. Aggregate results when done.

**Critical requirement:** Each subagent invocation must have a clear, specific task subject for traceability.

**Two approaches:**

1. **Declarative YAML Configuration** -- define subagent types in config files with their own system prompts, allowed tools, and context windows
2. **Dynamic Spawning** -- spawn subagents on-demand for parallel task execution

**Best practices:**
- Launch independent tasks simultaneously, not sequentially
- Use clear task subjects for traceability
- Plan synthesis upfront -- define how the main agent will combine findings
- Limit to 2-4 subagents per batch for manageable coordination

**Atlas UX relevance:** Atlas delegates to Binky (CRO), Tina (CFO), and Larry (Auditor) as parallel subagents when synthesizing the daily executive summary (WF-106). Each specialist agent runs in an isolated context, and Atlas aggregates their reports using ORCHESTRATION_REASONING.

**Trade-offs:**
- Context isolation and parallelization reduce latency
- Overhead of spawning and coordinating adds complexity
- Authors note they "frequently thought we needed subagents, then found more natural alternative"

---

## 6. Swarm Migration

**Status:** Validated in production | **Source:** Boris Cherny (Anthropic)

For large-scale code migrations, use a swarm architecture where the main agent orchestrates 10+ parallel subagents working simultaneously on independent chunks:

1. Main agent creates migration plan and todo list
2. Divide work into parallelizable batches
3. Spawn 10+ agents concurrently, each taking N items
4. Each subagent migrates its chunk independently
5. Main agent verifies results and consolidates

**Real-world usage at Anthropic:** Internal users spending $1000+/month commonly run swarm migrations for framework upgrades, lint rule rollouts, and API changes. A 10-agent swarm achieves 10x+ speedup over sequential execution.

**Common migration types:**
- Framework migration (Jest to Vitest, class components to hooks)
- Lint rule enforcement across hundreds of files
- API updates when dependencies change
- Import path changes (relative to absolute)

**Atlas UX relevance:** When Atlas needs to update content across all social channels simultaneously (WF-093 through WF-105), the platform intel sweep spawns 13 agents in parallel -- each scanning their respective platform. This is Atlas's production swarm pattern.

**Trade-offs:**
- Massive parallelization (10x+ speedup) for independent tasks
- Only works if migration targets are separable
- Merge conflicts can occur with parallel changes

---

## 7. Lane-Based Execution Queueing

**Status:** Validated in production | **Source:** Clawdbot Implementation

Isolated execution lanes with independent queues and configurable concurrency per lane. Each lane is a named queue with its own concurrency limit, drained independently.

**Core concepts:**
- **Session lanes** -- per-conversation queues prevent message interleaving
- **Global lanes** -- background tasks execute without blocking session lanes
- **Hierarchical composition** -- operations can nest lanes to prevent deadlocks
- **Configurable concurrency** -- each lane supports `maxConcurrent` workers

```typescript
type LaneState = {
  queue: QueueEntry[];
  active: number;
  maxConcurrent: number;
};
```

**Deadlock prevention:** Hierarchical composition ensures outer promises resolve when inner completes -- no circular waits.

**Atlas UX relevance:** Atlas's job queue implicitly implements lanes through agent-specific job types. Email jobs (`EMAIL_SEND`), social publishing jobs, and engine reasoning jobs all operate in conceptual lanes. The `FOR UPDATE SKIP LOCKED` pattern ensures lane-level isolation at the database level.

**Trade-offs:**
- Isolation guarantees with flexible parallelism
- Memory overhead from maintaining per-lane queues
- Not a general scheduler -- lacks priority queues or work stealing

---

## 8. Factory over Assistant

**Status:** Emerging | **Source:** AMP (Thorsten Ball, Quinn Slack)

Shift from the assistant model (one-on-one, watching the agent work) to the factory model: spawn multiple autonomous agents in parallel, check on them periodically, and focus on higher-level orchestration.

**The factory mindset:**
- Send off multiple agents to different tasks
- Check in on them periodically (30-60 minutes later)
- Focus on setting up automated feedback loops
- Optimize for parallelism and autonomy

**Why the assistant model is dying:**
- Limits parallelization -- you can only watch one agent at a time
- Human becomes the bottleneck feedback loop
- Better models work better autonomously, not interactively

**Atlas UX relevance:** Atlas UX is fundamentally a factory. The engine loop spawns agent work continuously. The Agent Watcher (`/app/watcher`) provides the "check in periodically" interface, polling the audit log every 4 seconds to show live agent activity without requiring synchronous supervision.

**Trade-offs:**
- Massive parallelization and better use of human time
- Loss of real-time steering capability
- Requires robust automated feedback loops (tests, builds, linters)

---

## 9. Hybrid LLM/Code Workflow Coordinator

**Status:** Proposed | **Source:** Will Larson (Imprint)

Support both LLM-driven and code-driven workflows via a configurable coordinator parameter. Start with LLM for rapid prototyping, then migrate to code when you need determinism.

```yaml
# LLM-driven (default, fastest to iterate)
coordinator: llm

# Code-driven (deterministic, goes through code review)
coordinator: script
coordinator_script: scripts/pr_merged.py
```

**Progressive enhancement approach:**
1. Start with LLM -- fast to prototype, works for many cases
2. Observe failures -- track where non-determinism causes problems
3. Rewrite to script -- one-shot rewrite from prompt to code
4. Ship with confidence -- code goes through review

**Atlas UX relevance:** Atlas workflows use this hybrid approach already. Simple tasks use LLM-driven orchestration (ORCHESTRATION_REASONING), while critical tasks like daily scheduling (WF-010, WF-031) use code-driven deterministic execution via the scheduler worker. The `CANONICAL_WORKFLOW_KEYS` fallback in the engine acts as the code-driven coordinator.

**Trade-offs:**
- Best of both worlds: flexibility when prototyping, determinism when mature
- Two code paths to maintain
- Less dynamic scripts are harder to change than prompts

---

## 10. Workspace-Native Multi-Agent Orchestration

**Status:** Emerging | **Source:** John Xie (Taskade)

Make agents native participants in the workspace platform itself so they share the same context, memory, and lifecycle as human collaborators.

**Core components:**
1. Agent definitions are shared, versioned artifacts
2. Shared workspace memory feeds agent context
3. Workflow orchestration inside the workspace -- outputs trigger downstream agents
4. Standardized integration surface (MCP-compatible tool interfaces)
5. Cross-platform accessibility

**Atlas UX relevance:** Atlas UX is a workspace-native platform. All 30+ agents share the same KB, the same tenant context, and the same audit trail. Agent definitions (SKILL.md, POLICY.md) are versioned artifacts. Workflow outputs trigger downstream agents through the job queue. The `tenantPlugin` ensures all agents operate within proper tenant isolation.

---

## 11. CLI-Native Agent Orchestration

**Status:** Proposed | **Source:** Jory Pestorious

Expose agent capabilities through a first-class command-line interface. Developers can integrate CLI commands into Makefiles, Git hooks, cron jobs, and CI workflows.

```bash
# Git pre-commit hook
claude spec test || exit 1

# Makefile target
generate-from-spec:
    claude spec run --input api.yaml --output src/
```

**Atlas UX relevance:** Atlas's backend workers are CLI-native by design. `npm run worker:engine`, `npm run worker:email`, and `npm run kb:ingest-agents` are all CLI entry points. The scheduler worker runs as a standalone process triggered by cron-like timing.

---

## 12. Initializer-Maintainer Dual Agent

**Status:** Emerging | **Source:** Anthropic Engineering Team

For long-running projects, implement two specialized agents:

- **Initializer** (runs once) -- creates feature list, progress tracking, bootstrap scripts, testing infrastructure
- **Maintainer** (runs in subsequent sessions) -- reads context, selects next task, implements, verifies, commits

**Session bootstrapping ritual:**
1. Verify working directory
2. Read git logs and progress files
3. Read feature list and select next incomplete feature
4. Run bootstrap script to start services
5. Run existing tests before implementing new features

**Atlas UX relevance:** The `seedAiKb.ts` script acts as an initializer, creating 200+ KB documents for the knowledge base. The engine loop then acts as the maintainer, continuously processing agent tasks against that foundation. The CLAUDE.md and MEMORY.md files serve as the progress tracking artifacts that maintain context across sessions.

---

## 13. Spectrum of Control / Blended Initiative

**Status:** Validated in production | **Source:** Aman Sanger (Cursor)

Design human-agent interaction to support a spectrum of autonomy:

| Level | Autonomy | Example |
|-------|----------|---------|
| Low | Human drives, AI augments | Tab completion |
| Medium | Human defines scope, AI executes | Edit region/file |
| High | AI handles multi-file tasks | Agent feature |
| Very High | AI works asynchronously | Background agent creating PRs |

Users seamlessly switch between modes depending on task complexity and their familiarity with the codebase.

**Atlas UX relevance:** Atlas supports this spectrum through its approval workflow. Low-risk actions execute autonomously (auto-approve below `AUTO_SPEND_LIMIT_USD`). Medium-risk actions require a `decision_memo`. High-risk actions require consensus from multiple agents. The spectrum maps directly to Atlas's risk tier system.

---

## Choosing the Right Pattern

| Pattern | Best For | Latency | Complexity |
|---------|----------|---------|------------|
| Plan-Then-Execute | Security-sensitive workflows | Medium | Low |
| Discrete Phase Separation | Complex features requiring research | High | Medium |
| Planner-Worker | Massive multi-week projects | Variable | High |
| Continuous Task Loop | Repetitive discrete tasks | Low | Low |
| Sub-Agent Spawning | Parallelizable analysis | Medium | Medium |
| Swarm Migration | Large-scale code migrations | Low | Medium |
| Lane-Based Queueing | Mixed concurrent workloads | Low | Medium |
| Factory | Teams managing many agents | Low | High |
| Hybrid Coordinator | Workflows maturing from prototype | Medium | Medium |
| Workspace-Native | Platform-integrated agents | Medium | High |

---

## Atlas UX Integration Notes

Atlas UX combines multiple orchestration patterns in production:

1. **Engine loop** is a continuous autonomous task loop (pattern 4)
2. **Agent hierarchy** (Atlas > Department Heads > Specialists) is planner-worker separation (pattern 3)
3. **Content pipeline** (Archy > Sunday > Venny > Publishers) is discrete phase separation (pattern 2)
4. **Platform intel sweep** (WF-093 through WF-105) is swarm migration (pattern 6)
5. **Daily aggregation** (WF-106) uses sub-agent spawning with map-reduce (pattern 5)
6. **Approval workflow** implements spectrum of control via decision memos and risk tiers (pattern 13)
7. **Job queue with SKIP LOCKED** provides lane-based isolation (pattern 7)

The orchestration pattern determines how jobs are created and how they relate to each other. The engine loop is pattern-agnostic -- it simply processes whatever jobs appear in the queue.
