# Agent Memory Architecture

## Overview

Atlas UX agents maintain three distinct memory systems that work together to provide
continuity, context, and learned behavior across conversations and tasks. This
architecture allows agents to recall past interactions, access organizational
knowledge, and maintain coherent multi-step reasoning within a single session.

## Memory Types

### 1. Episodic Memory (Long-Term, Persistent)

Episodic memory captures specific interactions and events. Each memory is stored
in the `agent_memory` table with a session identifier, timestamp, and relevance
metadata.

```
agent_memory
  id            UUID (PK)
  tenant_id     UUID (FK → tenants)
  agent_id      TEXT          -- e.g., "atlas", "binky", "sunday"
  session_id    UUID          -- groups memories from a single conversation
  role          TEXT          -- "user" | "assistant" | "system" | "tool_result"
  content       TEXT          -- the actual message or observation
  importance    FLOAT         -- 0.0 to 1.0, computed at storage time
  embedding     vector(1536)  -- for semantic retrieval
  created_at    TIMESTAMPTZ
  expires_at    TIMESTAMPTZ   -- nullable; TTL-based cleanup
```

**Importance scoring** is computed when a memory is stored. Factors include:

- Whether the memory contains a decision or action (higher importance)
- Whether it references financial amounts or approvals (higher importance)
- Whether it is routine small talk or acknowledgment (lower importance)
- Explicit user instruction to "remember this" (importance = 1.0)

Memories with importance < 0.2 are eligible for early cleanup.

### 2. Semantic Memory (Organizational Knowledge)

Semantic memory encompasses everything the agent "knows" about the organization
and its domain. This is not stored per-agent but shared across the tenant:

- **KB documents** — Published docs in the `kb_documents` table, chunked and
  embedded in `kb_chunks`. Accessed via RAG (see vector-embeddings-rag-tuning.md).

- **SKILL.md files** — Role-specific instruction documents loaded into agent
  memory at boot. These define the agent's capabilities, constraints, and
  behavioral guidelines. SKILL.md files are held in-memory and never expire.

- **Audit trail** — The `audit_log` table serves as institutional memory.
  Agents can search past actions, decisions, and outcomes across the entire
  organization.

### 3. Working Memory (Short-Term, Session-Scoped)

Working memory is the agent's current context window — the messages, tool results,
and system prompts assembled for the current LLM completion call. It is ephemeral
and exists only for the duration of a single inference cycle.

Working memory is constructed by the engine on each tick:

1. System prompt (agent identity, SGL policies, current date/time)
2. SKILL.md content (if applicable)
3. Retrieved episodic memories (from `search_my_memories`)
4. Retrieved KB chunks (from RAG search)
5. Current conversation turns
6. Tool call results from the current session

The total working memory must fit within the model's context window. When it
exceeds the limit, the engine applies truncation rules (see Context Window
Management below).

## Memory Retrieval: search_my_memories

The `search_my_memories` tool is the primary mechanism for agents to recall past
information. When invoked, it searches **four sources in parallel**:

### Source 1: agent_memory

Searches the agent's own episodic memories using vector similarity:

```sql
SELECT content, importance, created_at,
       1 - (embedding <=> $query_embedding) AS similarity
FROM agent_memory
WHERE agent_id = $agent_id
  AND tenant_id = $tenant_id
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY similarity DESC
LIMIT 10;
```

### Source 2: audit_log

Searches organizational history for relevant past actions:

```sql
SELECT action, message, meta, timestamp
FROM audit_log
WHERE tenant_id = $tenant_id
  AND message ILIKE '%' || $search_term || '%'
ORDER BY timestamp DESC
LIMIT 10;
```

### Source 3: Workflow Steps

Searches completed workflow step outputs for relevant context:

```sql
SELECT wf.name, ws.step_name, ws.output, ws.completed_at
FROM workflow_steps ws
JOIN workflows wf ON ws.workflow_id = wf.id
WHERE wf.tenant_id = $tenant_id
  AND ws.output ILIKE '%' || $search_term || '%'
ORDER BY ws.completed_at DESC
LIMIT 5;
```

### Source 4: KB Documents

Runs a RAG search against the knowledge base (vector similarity on kb_chunks).
This is the same search used by `search_atlasux_knowledge` but scoped to the
agent's relevant categories.

### Result Merging

Results from all four sources are merged, deduplicated by content hash, and
ranked by a combined score:

```
final_score = (0.5 * similarity) + (0.2 * recency) + (0.2 * importance) + (0.1 * source_priority)
```

Source priority weights: agent_memory (1.0) > audit_log (0.8) > workflow_steps (0.6) > KB (0.5)

The top 5 results are injected into the agent's working memory as system messages.

## TTLs and Cleanup

Memory accumulation without cleanup would degrade retrieval quality over time.
Atlas UX applies several cleanup mechanisms:

### Automatic Expiration

Memories with an `expires_at` timestamp are excluded from retrieval after that
time. Default TTLs by memory type:

| Memory type | Default TTL | Rationale |
|-------------|-------------|-----------|
| Routine conversation | 7 days | Low long-term value |
| Task completion | 30 days | Useful for short-term reference |
| Decision/approval | 90 days | Compliance and audit needs |
| Explicit "remember this" | None (permanent) | User-requested persistence |
| Error/failure | 14 days | Useful for debugging, then stale |

### Importance Decay

Memories that are never retrieved gradually lose importance:

```
decayed_importance = original_importance * (0.95 ^ weeks_since_last_retrieval)
```

When `decayed_importance` drops below 0.1, the memory becomes eligible for
archival (soft delete with `archived_at` timestamp).

### Storage Quotas

Per-agent memory is capped at **10,000 episodic memories** per tenant. When the
cap is reached, the lowest-importance memories are archived first. This prevents
any single agent from consuming disproportionate storage.

## Context Window Management

When working memory exceeds the model's context window, the engine applies
truncation in this order:

1. **Older conversation turns** — Turns beyond the most recent 20 are summarized
   into a single condensed message using a fast model (Cerebras or DeepSeek).

2. **Retrieved memories** — Reduced from 5 to 3, keeping only the highest-scored.

3. **KB chunks** — Reduced from 5 to 2, keeping only the most similar.

4. **SKILL.md content** — Never truncated. This is the agent's core identity.

5. **System prompt** — Never truncated. Contains SGL policies and safety rules.

The engine logs a warning to `audit_log` whenever truncation occurs, including
the number of tokens removed and which sources were affected.

## How Memory Influences Agent Decisions

Memory retrieval happens at specific points in the agent's decision loop:

1. **Task intake** — When a new task arrives, the agent searches for memories
   of similar past tasks. If a previous attempt failed, the agent adjusts its
   approach.

2. **Tool selection** — Before choosing a tool, the agent recalls which tools
   succeeded or failed for similar operations.

3. **Decision memos** — When crafting approval requests, the agent references
   past approvals/rejections to calibrate risk assessment and framing.

4. **Content creation** — For publishing agents (Kelly, Fran, Reynolds, etc.),
   memories of past post performance inform tone, topic selection, and timing.

5. **Delegation** — When Atlas or Binky delegate tasks, they recall which
   agents handled similar work successfully and route accordingly.

## Memory Isolation

Multi-tenant isolation is enforced at every layer:

- All queries include `WHERE tenant_id = $tenant_id`
- Agent memories are scoped to both `tenant_id` and `agent_id`
- Cross-agent memory access is read-only and limited to audit_log and KB
  (agents cannot read each other's episodic memories)
- SKILL.md files are global (not tenant-specific) since they define agent
  behavior, not tenant data

## Debugging Memory Issues

Common issues and diagnostic steps:

**Agent "forgets" a conversation**: Check if the session's memories have
expired (query `agent_memory` by `session_id`). Verify the importance score
was high enough to survive cleanup.

**Agent retrieves irrelevant memories**: Check the embedding quality of the
query. Test with a more specific search term. Review the similarity threshold
(default 0.7 may be too permissive for some domains).

**Agent acts on outdated information**: Check if a newer memory should have
superseded the old one. The recency weight in the scoring formula (0.2) may
need to be increased for fast-changing domains.
