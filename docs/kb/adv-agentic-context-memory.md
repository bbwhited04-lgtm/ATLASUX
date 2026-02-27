# Agentic Context and Memory Patterns

> Advanced guide to context window management, memory systems, and state persistence for autonomous agents.
> Audience: Platform engineers, AI architects, and Atlas UX operators.
> Source: Consolidated from the [Awesome Agentic Patterns](https://github.com/nibzard/awesome-agentic-patterns) repository.

---

## Table of Contents

1. [Overview](#overview)
2. [Context Minimization](#1-context-minimization)
3. [Context Window Anxiety Management](#2-context-window-anxiety-management)
4. [Context Window Auto-Compaction](#3-context-window-auto-compaction)
5. [Curated Code and File Context](#4-curated-code-and-file-context)
6. [Dynamic Context Injection](#5-dynamic-context-injection)
7. [Layered Configuration Context](#6-layered-configuration-context)
8. [Episodic Memory Retrieval](#7-episodic-memory-retrieval)
9. [Memory Reinforcement Learning (MemRL)](#8-memory-reinforcement-learning-memrl)
10. [Memory Synthesis from Execution Logs](#9-memory-synthesis-from-execution-logs)
11. [Filesystem-Based Agent State](#10-filesystem-based-agent-state)
12. [Proactive Agent State Externalization](#11-proactive-agent-state-externalization)
13. [Working Memory via Todos](#12-working-memory-via-todos)
14. [Self-Identity Accumulation](#13-self-identity-accumulation)
15. [Prompt Caching via Exact Prefix Preservation](#14-prompt-caching-via-exact-prefix-preservation)
16. [Semantic Context Filtering](#15-semantic-context-filtering)
17. [Atlas UX Integration Notes](#atlas-ux-integration-notes)

---

## Overview

Context is the lifeblood of agent reasoning. Every token matters -- too little context and agents hallucinate, too much and they lose focus. Effective context management determines whether an agent system scales gracefully or collapses under its own weight.

Atlas UX runs 30+ named agents, each needing relevant context from the KB, audit trail, tenant data, and inter-agent communications. These patterns address how to load, manage, persist, and optimize that context across sessions, agents, and workflows.

---

## 1. Context Minimization

**Status:** Emerging | **Source:** Beurer-Kellner et al. (2025)

Purge or redact untrusted segments once they have served their purpose. After transforming input into a safe intermediate (query, structured object), strip the original prompt from context.

```
sql = LLM("to SQL", user_prompt)
remove(user_prompt)              # tainted tokens gone
rows = db.query(sql)
answer = LLM("summarize rows", rows)
```

**Core principle:** Treat context as a staged pipeline -- ingest untrusted text, transform it, then aggressively discard the original tainted material. Subsequent reasoning sees only trusted data, eliminating latent prompt injections.

**Atlas UX relevance:** When agents process external data (Telegram messages, email content, social media data), the engine should transform raw input into structured intent objects and discard the original text before passing to downstream agents. This prevents adversarial content from influencing later reasoning steps.

**Trade-offs:**
- Simple, no extra models needed
- Later turns lose conversational nuance
- Overly aggressive minimization can remove useful context

---

## 2. Context Window Anxiety Management

**Status:** Emerging | **Source:** Cognition AI (2025)

Models like Claude Sonnet exhibit "context anxiety" -- they become aware of approaching context limits and proactively summarize or rush to close tasks, even when sufficient context remains.

**Symptoms:**
- Premature task completion and shortcuts
- Incomplete work despite adequate context
- Self-imposed pressure to "wrap up"

**Mitigation strategies:**

1. **Context buffer strategy** -- enable larger context windows but cap actual usage (e.g., 1M available, 200K used)
2. **Aggressive counter-prompting** -- "You have plenty of context remaining -- do not rush to complete tasks"
3. **Token budget transparency** -- explicitly state available budget in prompts

**Atlas UX relevance:** Long-running agent sessions (especially Archy research tasks and Sunday content creation) should include explicit context reassurance in their system prompts. Agent SKILL.md files should include: "Take your time. Context is not a constraint for this task."

---

## 3. Context Window Auto-Compaction

**Status:** Validated in production | **Source:** Clawdbot, Pi Coding Agent, OpenAI Codex

Automatic session compaction triggered by context overflow errors. The system detects overflow, compacts the transcript, validates the result, and retries -- all transparently.

**Core concepts:**
- **Overflow detection** -- catch API errors indicating context length exceeded
- **Auto-retry with compaction** -- compact session and retry automatically
- **Reserve token floor** -- ensure minimum 20K tokens remain post-compaction
- **Post-compaction verification** -- confirm tokens actually decreased

**API-based compaction:** Some providers offer dedicated compaction endpoints (e.g., OpenAI `/responses/compact`) that preserve the model's latent understanding through encrypted content tokens.

**Atlas UX relevance:** The engine loop should implement auto-compaction for long-running agent sessions. When an LLM call fails with a context length error, the engine should compact the agent's conversation history (preserving key decisions and state) and retry. The 90-second timeout on LONG_CONTEXT_SUMMARY routes already addresses this partially.

**Trade-offs:**
- Transparent recovery from overflow errors
- Auto-generated summaries may lose nuanced details
- Latency penalty from compaction and retry

---

## 4. Curated Code and File Context

**Status:** Validated in production | **Source:** Anonymous, Will Brown, Thorsten Ball

Maintain a minimal, high-signal context by loading only the most relevant files instead of dumping entire repositories.

**Two-tier approach:**

1. **Curated Code Context** -- use a helper subagent (search agent or vector index) to find relevant code snippets. Only top-3 snippets (each 150 tokens or fewer) enter the main agent's context.

2. **Curated File Context** -- identify primary files where changes are intended, then spawn a file-search subagent to rank additional relevant files. Load summaries rather than full files for secondary context.

**Context update cycle:**
```
Main Agent: "I need to refactor UserService"
Search Subagent: Found user_service.py, models/user.py, utils/auth.py
Context Injection: Only those three files enter the window
```

**Atlas UX relevance:** When Sunday writes content, it should receive only the relevant KB documents (not all 200+), the specific workflow instructions, and the distilled research from Archy. The `kb:chunk-docs` process already supports this by breaking documents into retrievable chunks.

---

## 5. Dynamic Context Injection

**Status:** Established | **Source:** Boris Cherny (Claude Code)

Allow users and agents to dynamically inject context into the working memory during a session:

- **File/Folder At-Mentions** -- type `@src/components/Button.tsx` to load that file into context
- **Custom Slash Commands** -- define reusable prompts in separate files, invoke with `/user:foo`

This enables targeted context exactly when needed, avoiding the overhead of loading everything upfront.

**Atlas UX relevance:** Agent tool calls like `read_kb_document` and `search_kb` serve as dynamic context injection mechanisms. When an agent needs specific information, it queries the KB rather than having everything preloaded. The `dynamic-context-injection` pattern is already implicit in how agents use the tools system.

---

## 6. Layered Configuration Context

**Status:** Established | **Source:** Boris Cherny (Claude Code)

Implement layered configuration files that agents automatically discover and load based on their location in the hierarchy:

- **Enterprise/Organization** -- root-level policies shared across all projects
- **User-Specific Global** -- personal preferences shared across all projects
- **Project-Specific** -- version-controlled project instructions (CLAUDE.md)
- **Project-Local** -- non-version-controlled individual overrides

The agent merges these layers, providing a tailored baseline without manual intervention.

**Atlas UX relevance:** Atlas UX already implements layered context:
- **SGL.md** (EXECUTION_CONSTITUTION.md) -- organization-level governance policy
- **Agent SKILL.md** -- per-agent role definitions and capabilities
- **Agent POLICY.md** -- per-agent behavioral constraints
- **Workflow definitions** -- task-specific context injected at runtime
- **Tenant configuration** -- per-tenant settings via `tenantPlugin`

---

## 7. Episodic Memory Retrieval

**Status:** Validated in production | **Source:** Cursor AI, Windsurf Flows

Add a vector-backed episodic memory store for cross-session continuity:

1. After every episode, write a structured "memory blob" (event, outcome, rationale) to the DB
2. On new tasks, embed the prompt, retrieve top-k similar memories, inject as hints
3. Apply TTL or decay scoring to prune stale memories

**Design principles:**
- Write memories as structured records (decision, evidence, outcome, confidence)
- Filter by task scope and recency at retrieval time
- Start with small `top-k` and strict metadata filters

**Atlas UX relevance:** The audit_log table already serves as an episodic memory store. Agents can query recent audit entries for their own past actions and outcomes. The KB documents function as curated long-term memory. A future enhancement would add vector-search retrieval over audit logs to inject relevant past decisions into agent context.

---

## 8. Memory Reinforcement Learning (MemRL)

**Status:** Proposed | **Source:** Shanghai Jiao Tong University, MemTensor

Add learned "utility scores" to episodic memory so agents learn from experience which memories actually lead to success -- without modifying the model.

**Memory triplet structure:**
- **Intent** -- what the user asked for (embedded)
- **Experience** -- what the agent tried (solution trace)
- **Utility** -- how well it worked (learned score, updated over time)

**Two-phase retrieval:**
1. Semantic filter -- find similar memories
2. Utility ranking -- re-rank by learned utility scores

```python
# Update utilities based on outcomes
reward = 1 if success else 0
for mem in retrieved_contexts:
    mem.utility += learning_rate * (reward - mem.utility)
```

**Why this beats basic RAG:** Standard retrieval assumes "similar implies useful," but a semantically relevant past solution might actually be a bad approach. MemRL filters out "look-alike" bad solutions by tracking which memories historically led to good outcomes.

**Atlas UX relevance:** Agent actions already have success/failure signals (job status: completed vs. failed). A MemRL layer over the jobs table could rank past approaches by their utility scores, helping agents avoid repeating failed strategies. Tina (CFO) could learn which spending patterns historically got approved vs. rejected.

---

## 9. Memory Synthesis from Execution Logs

**Status:** Emerging | **Source:** Anthropic Internal Users

Implement a two-tier memory system:

1. **Task diaries** -- agent writes structured logs for each task (what it tried, what failed, why)
2. **Synthesis agents** -- periodically review multiple task logs to extract reusable patterns

**Diary entry format:**
```markdown
## Task: Add authentication to checkout flow
Attempted approaches:
1. JWT tokens in localStorage - failed due to XSS concerns
2. HTTP-only cookies - worked but needed CORS config
3. Session tokens with Redis - chosen solution
Patterns discovered:
- Auth changes always need CORS update
- Need both client and server-side expiry checks
```

**Synthesis process:** Run synthesis agents over recent logs (weekly or after N tasks) to identify patterns appearing in 3+ tasks. Feed insights back into system prompts, reusable commands, and automated checks.

**Real usage at Anthropic:** "There are some people at Anthropic where for every task they do, they tell Claude Code to write a diary entry... they even have agents that look over the past memory and synthesize it into observations."

**Atlas UX relevance:** The audit_log already captures structured execution data. A synthesis agent (potentially Daily-Intel or a new agent) could periodically review audit logs across all agents and extract operational patterns -- "social posts published before 9 AM get higher engagement," "KB queries about pricing always precede deal closures."

---

## 10. Filesystem-Based Agent State

**Status:** Established | **Source:** Anthropic Engineering Team

Persist intermediate results and working state to files in the execution environment. This creates durable checkpoints enabling workflow resumption and recovery from failures.

**Core pattern:**
```python
def multi_step_workflow():
    if os.path.exists("state/step1_results.json"):
        step1_data = json.load(open("state/step1_results.json"))
    else:
        step1_data = perform_step1()
        json.dump(step1_data, open("state/step1_results.json", "w"))
    # Continue with step 2...
```

**State file best practices:**
- Include timestamps and version info
- Use atomic writes (write to temp, then rename)
- Define cleanup policies
- Secure files containing sensitive data

**Atlas UX relevance:** The jobs table with its status progression (queued > running > completed/failed) is Atlas's primary state persistence mechanism. Job payloads store intermediate results. The KB documents serve as long-term filesystem-based state for agent-generated content.

---

## 11. Proactive Agent State Externalization

**Status:** Emerging | **Source:** Cognition AI (2025)

Modern models proactively attempt to externalize their state by writing summaries and notes to the file system without explicit prompting. Channel this behavior productively:

1. **Guided self-documentation** -- provide templates and schemas for agent notes
2. **Hybrid memory architecture** -- combine agent self-documentation with external memory management
3. **Progressive state building** -- encourage incremental note-taking capturing decision rationale

**Atlas UX relevance:** Agents should be encouraged to write structured decision rationale into the decision_memos table rather than relying on unstructured self-documentation. The `meta` field in audit_log entries already captures some state externalization. Agent SKILL.md files should include templates for how agents should document their reasoning.

---

## 12. Working Memory via Todos

**Status:** Emerging | **Source:** Analysis of 88 Claude sessions

Use explicit todo tracking to maintain working memory throughout sessions:

**What to track:**
1. Task status (pending, in_progress, completed)
2. Blocking relationships (what blocks what)
3. Verification steps (tests or checks needed)
4. Next actions (what to do next)

**Evidence:** Projects using explicit working memory (TodoWrite) had smoother sessions and fewer corrections. It serves as working memory for both agent and user.

**Anti-pattern prevention:**
- Prevents context loss across context window switches
- Prevents redundant work (doing the same task twice)
- Prevents forgotten tasks
- Prevents unclear session state

**Atlas UX relevance:** The jobs table with status fields (queued, running, completed, failed) and the `depends_on` field serve as Atlas's working memory system. Petra (PM) could use explicit todo tracking to maintain project state across sessions. The `atlas_suggestions` table provides recommendation-level working memory.

---

## 13. Self-Identity Accumulation

**Status:** Emerging | **Source:** Claude Code Hooks System

Implement dual-hook architecture for persistent agent identity:

1. **SessionStart Hook** -- inject accumulated identity at session start
2. **SessionEnd Hook** -- extract new insights and refine the profile
3. **Identity Document** -- a persistent file (WHO_AM_I.md, SOUL.md) that evolves over time

**Profile structure includes:**
- Project goals and evolving priorities
- Preferences (coding opinions, tool choices, architectural preferences)
- Communication style and formatting conventions
- Workflow patterns and decision-making approaches
- Boundaries (what the agent should not do)

**Atlas UX relevance:** Each Atlas agent already has a persistent identity via SKILL.md (capabilities), POLICY.md (constraints), and the agent configuration in the database (role, reportsTo, email). The MEMORY.md file serves as project-level self-identity accumulation. Agent-specific identity evolution could be stored in the KB as agent-authored self-reflection documents.

---

## 14. Prompt Caching via Exact Prefix Preservation

**Status:** Emerging | **Source:** Michael Bolin (OpenAI Codex)

Maintain prompt cache efficiency through exact prefix preservation -- always append new messages rather than modifying existing ones.

**Message ordering strategy:**
1. **Static content first** (cached across all requests): system message, tool definitions, developer instructions
2. **Variable content last** (changes per request): user message, assistant messages, tool results

**What breaks cache hits:**
- Changing the list of available tools
- Reordering messages
- Modifying existing message content
- Changing the model

**Atlas UX relevance:** The engine loop should order agent context predictably: SGL policy first, then agent SKILL.md, then POLICY.md, then workflow-specific context, then dynamic data. This static prefix would be cached across all engine ticks for the same agent, reducing inference costs significantly.

---

## 15. Semantic Context Filtering

**Status:** Emerging | **Source:** Hyperbrowser Team

Extract only semantic, interactive, or relevant elements from raw data. Filter out noise and provide the LLM with a clean representation.

**Key principle:** Do not send raw data to the LLM. Send semantic abstractions.

**Impact:**

| Aspect | Raw Data | Filtered | Improvement |
|--------|----------|----------|-------------|
| Tokens | 10,000 | 100-1,000 | 10-100x reduction |
| Cost | High | Low | 10-100x cheaper |
| Accuracy | Error-prone | Reliable | Higher success rate |

**Atlas UX relevance:** When agents process external data (web scraping for Archy, email parsing for the email worker, Telegram messages), the data should be semantically filtered before entering agent context. Strip HTML boilerplate, remove tracking pixels, extract only actionable content. The KB chunking process (`kb:chunk-docs`) already applies a form of semantic filtering.

---

## Atlas UX Integration Notes

Atlas UX's context and memory architecture spans several layers:

1. **Immediate context** -- agent system prompt (SKILL.md + POLICY.md + SGL) loaded per engine tick
2. **Working memory** -- job payloads, intent data, and recent audit log entries
3. **Episodic memory** -- audit_log table capturing all agent actions with timestamps and outcomes
4. **Long-term memory** -- KB documents (200+ articles), tenant-specific data
5. **Shared state** -- jobs table with status tracking and dependency chains
6. **Identity** -- agent configuration (role, email, reportsTo) persisted in the database

**Priority improvements based on these patterns:**
- Add context budget transparency to agent prompts (pattern 2)
- Implement auto-compaction for long-running agent sessions (pattern 3)
- Add utility scoring to KB document retrieval (pattern 8)
- Build synthesis agents that extract patterns from audit logs (pattern 9)
- Order engine prompt construction for cache efficiency (pattern 14)
