# Centralized State Management for Multi-Agent Systems

## Introduction

When multiple AI agents operate within the same platform, they need shared context. Agent A books an appointment; Agent B needs to know the calendar is updated. Agent C processes a customer complaint; Agent D needs to see that complaint before sending a marketing email to the same customer. Without centralized state, agents operate in silos — making decisions based on incomplete information, duplicating work, or worse, contradicting each other. This article examines the architecture patterns for shared state in multi-agent systems: blackboard architectures, shared databases, event stores, and the consistency models that determine whether agents see the same reality.

## Shared Memory Architectures

### The Blackboard Pattern

The blackboard architecture, originating from Hearsay-II in the 1970s, is the oldest pattern for multi-agent knowledge sharing. A shared data store (the "blackboard") holds the current problem state. Agents ("knowledge sources") read from the blackboard, perform specialized reasoning, and write their conclusions back. A control component decides which agent acts next based on the current blackboard state.

```
┌─────────────────────────────────────────────┐
│                 Blackboard                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Customer │ │ Calendar │ │ Agent State  │  │
│  │ Context  │ │  State   │ │   Registry   │  │
│  └─────────┘ └──────────┘ └──────────────┘  │
├─────────────────────────────────────────────┤
│              Control Component               │
│   (Priority queue, conflict resolution)      │
├──────┬──────┬──────┬──────┬──────┬──────────┤
│ Lucy │Atlas │Binky │Delta │Ephor │ ... more  │
│(recv)│(CEO) │(CRO) │(ops) │(eng) │  agents   │
└──────┴──────┴──────┴──────┴──────┴──────────┘
```

**Implementation in TypeScript:**

```typescript
interface BlackboardEntry {
  key: string;
  value: unknown;
  updatedBy: string;   // Agent name
  updatedAt: Date;
  version: number;
  tenantId: string;
}

class Blackboard {
  private store: Map<string, BlackboardEntry> = new Map();
  private subscribers: Map<string, Set<(entry: BlackboardEntry) => void>> = new Map();

  read(key: string, tenantId: string): BlackboardEntry | undefined {
    const fullKey = `${tenantId}:${key}`;
    return this.store.get(fullKey);
  }

  write(key: string, value: unknown, agentName: string, tenantId: string): void {
    const fullKey = `${tenantId}:${key}`;
    const existing = this.store.get(fullKey);
    const entry: BlackboardEntry = {
      key,
      value,
      updatedBy: agentName,
      updatedAt: new Date(),
      version: (existing?.version ?? 0) + 1,
      tenantId,
    };
    this.store.set(fullKey, entry);
    this.notifySubscribers(fullKey, entry);
  }

  subscribe(keyPattern: string, callback: (entry: BlackboardEntry) => void): void {
    if (!this.subscribers.has(keyPattern)) {
      this.subscribers.set(keyPattern, new Set());
    }
    this.subscribers.get(keyPattern)!.add(callback);
  }

  private notifySubscribers(key: string, entry: BlackboardEntry): void {
    for (const [pattern, callbacks] of this.subscribers) {
      if (key.includes(pattern)) {
        for (const cb of callbacks) cb(entry);
      }
    }
  }
}
```

**Strengths:** Simple mental model, all agents see the same state, easy to debug (inspect the blackboard).
**Weaknesses:** Single point of contention, scaling challenges with many concurrent writers, no built-in history.

### Shared Database Pattern

The most common production pattern: agents read and write to a shared relational database. PostgreSQL with JSONB columns provides both structured queries and flexible schema for agent-specific data.

```typescript
// Agent state stored in PostgreSQL via Prisma
interface AgentStateRecord {
  id: string;
  tenantId: string;
  agentName: string;
  stateType: string;       // "customer_context" | "calendar" | "task_queue"
  payload: Record<string, unknown>;  // JSONB
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// Reading shared state with optimistic locking
async function readAndUpdateState(
  prisma: PrismaClient,
  tenantId: string,
  stateType: string,
  agentName: string,
  updateFn: (current: unknown) => unknown
): Promise<void> {
  const current = await prisma.agentState.findFirst({
    where: { tenantId, stateType },
  });

  if (!current) {
    throw new Error(`State ${stateType} not found for tenant ${tenantId}`);
  }

  const newPayload = updateFn(current.payload);

  // Optimistic lock: update only if version hasn't changed
  const updated = await prisma.agentState.updateMany({
    where: {
      id: current.id,
      version: current.version,  // Optimistic lock check
    },
    data: {
      payload: newPayload as any,
      version: current.version + 1,
      updatedAt: new Date(),
      updatedBy: agentName,
    },
  });

  if (updated.count === 0) {
    throw new Error("Concurrent modification detected — retry");
  }
}
```

**Strengths:** ACID transactions, mature tooling, SQL querying, proven at scale.
**Weaknesses:** Relational schema rigidity (mitigated by JSONB), higher latency than in-memory options.

### Event Store Pattern

Instead of storing current state, store the sequence of events that produced the current state. Each agent action becomes an event. State is derived by replaying events. This provides complete history and enables temporal queries ("what did the agents know at 3pm yesterday?").

```typescript
interface AgentEvent {
  eventId: string;
  tenantId: string;
  agentName: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;   // Links related events
  causationId?: string;    // What event caused this one
}

class EventStore {
  async append(event: AgentEvent): Promise<void> {
    await prisma.agentEvent.create({ data: event });
  }

  async getEvents(
    tenantId: string,
    filters: { agentName?: string; eventType?: string; after?: Date }
  ): Promise<AgentEvent[]> {
    return prisma.agentEvent.findMany({
      where: {
        tenantId,
        ...(filters.agentName && { agentName: filters.agentName }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.after && { timestamp: { gte: filters.after } }),
      },
      orderBy: { timestamp: "asc" },
    });
  }

  async deriveState(tenantId: string, stateType: string): Promise<unknown> {
    const events = await this.getEvents(tenantId, { eventType: stateType });
    return events.reduce((state, event) => {
      return applyEvent(state, event);
    }, {} as Record<string, unknown>);
  }
}
```

**Strengths:** Complete audit trail, temporal queries, event replay for debugging, natural fit for agent systems.
**Weaknesses:** State derivation adds latency, event schema evolution is complex, storage grows linearly with activity.

## State Consistency in Concurrent Agent Systems

### The Concurrency Problem

When Agent A reads customer state, processes a phone call, and writes an update, what happens if Agent B reads the same state concurrently, processes a different request, and writes a conflicting update? The second write overwrites the first, losing Agent A's changes.

### Consistency Models

| Model | Guarantee | Latency | Best For |
|-------|-----------|---------|----------|
| Strong consistency | Every read sees the latest write | Highest | Financial transactions, critical state |
| Eventual consistency | Reads may see stale data temporarily | Lowest | Caches, analytics, non-critical context |
| Causal consistency | If A happens-before B, everyone sees A before B | Medium | Most agent interactions |
| Session consistency | Each agent's session is consistent | Medium | Per-agent workflows |

For multi-agent AI systems, **causal consistency** is typically the right choice: if Agent A books an appointment and then Agent B checks the calendar, Agent B must see the booking. But two unrelated agents operating on different customers need not see each other's updates instantly.

### Implementation with PostgreSQL

PostgreSQL's `SERIALIZABLE` isolation level provides strong consistency for critical operations:

```sql
-- Agent A: Book an appointment (serializable transaction)
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Check for conflicts
SELECT * FROM appointments
WHERE tenant_id = $1 AND time_slot = $2
FOR UPDATE;  -- Lock the row

-- Book if no conflict
INSERT INTO appointments (tenant_id, customer_id, time_slot, booked_by)
VALUES ($1, $2, $3, 'Lucy');

COMMIT;
```

For less critical state, `READ COMMITTED` (PostgreSQL's default) provides sufficient consistency with better performance.

## Database-Backed State: PostgreSQL JSONB and Redis

### PostgreSQL JSONB for Persistent State

JSONB columns store agent state as flexible JSON documents within a relational schema:

```sql
CREATE TABLE agent_shared_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    state_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, state_key)
);

-- Index for fast JSONB queries
CREATE INDEX idx_state_payload ON agent_shared_state
USING gin (payload jsonb_path_ops);

-- Query: find all states where customer sentiment is negative
SELECT * FROM agent_shared_state
WHERE tenant_id = $1
AND payload @> '{"customer_sentiment": "negative"}';
```

### Redis for Ephemeral and High-Speed State

Redis provides sub-millisecond reads and writes for state that does not require durability:

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

class AgentCache {
  private prefix = "agent:state";

  async set(tenantId: string, key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    const fullKey = `${this.prefix}:${tenantId}:${key}`;
    await redis.set(fullKey, JSON.stringify(value), "EX", ttlSeconds);
  }

  async get<T>(tenantId: string, key: string): Promise<T | null> {
    const fullKey = `${this.prefix}:${tenantId}:${key}`;
    const raw = await redis.get(fullKey);
    return raw ? JSON.parse(raw) : null;
  }

  // Publish state change for other agents to react
  async publishStateChange(tenantId: string, change: Record<string, unknown>): Promise<void> {
    await redis.publish(`agent:changes:${tenantId}`, JSON.stringify(change));
  }

  // Subscribe to state changes
  async subscribeToChanges(tenantId: string, handler: (change: unknown) => void): Promise<void> {
    const sub = redis.duplicate();
    await sub.subscribe(`agent:changes:${tenantId}`);
    sub.on("message", (channel, message) => handler(JSON.parse(message)));
  }
}
```

### Hybrid Pattern: PostgreSQL + Redis

Production systems typically use both:
- **PostgreSQL:** Source of truth for durable state (customer records, appointments, agent configurations)
- **Redis:** Cache layer for hot state (current conversation context, active agent assignments, rate limiting counters)

```typescript
class HybridStateManager {
  async getState(tenantId: string, key: string): Promise<unknown> {
    // Try cache first
    const cached = await this.cache.get(tenantId, key);
    if (cached) return cached;

    // Fall back to database
    const dbState = await prisma.agentSharedState.findUnique({
      where: { tenantId_stateKey: { tenantId, stateKey: key } },
    });

    if (dbState) {
      // Warm cache for next read
      await this.cache.set(tenantId, key, dbState.payload);
      return dbState.payload;
    }

    return null;
  }

  async setState(tenantId: string, key: string, value: unknown, agentName: string): Promise<void> {
    // Write to database (source of truth)
    await prisma.agentSharedState.upsert({
      where: { tenantId_stateKey: { tenantId, stateKey: key } },
      update: { payload: value as any, updatedBy: agentName, version: { increment: 1 } },
      create: { tenantId, stateKey: key, payload: value as any, updatedBy: agentName },
    });

    // Update cache
    await this.cache.set(tenantId, key, value);

    // Notify other agents
    await this.cache.publishStateChange(tenantId, { key, value, agent: agentName });
  }
}
```

## Conflict Resolution Strategies

### Last-Write-Wins (LWW)

The simplest strategy: the most recent write overwrites any previous value. Suitable when state is idempotent (setting a customer's preferred contact time — only the latest preference matters).

**Risk:** Data loss when concurrent writes carry different information that should be merged, not replaced.

### Optimistic Concurrency Control

Each state record carries a version number. Updates include the expected version; if it does not match, the update is rejected and the agent must retry with fresh data.

```typescript
async function optimisticUpdate(
  tenantId: string,
  key: string,
  agentName: string,
  updateFn: (current: unknown) => unknown,
  maxRetries = 3,
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const current = await prisma.agentSharedState.findUnique({
      where: { tenantId_stateKey: { tenantId, stateKey: key } },
    });

    if (!current) throw new Error(`State ${key} not found`);

    const newValue = updateFn(current.payload);

    try {
      await prisma.agentSharedState.update({
        where: {
          id: current.id,
          version: current.version,  // Version check
        },
        data: {
          payload: newValue as any,
          version: current.version + 1,
          updatedBy: agentName,
        },
      });
      return; // Success
    } catch (e) {
      if (attempt === maxRetries - 1) throw e;
      // Retry with fresh data
    }
  }
}
```

### CRDTs (Conflict-Free Replicated Data Types)

CRDTs are data structures designed for concurrent modification without coordination. Common types:

- **G-Counter (grow-only counter):** Each agent maintains its own counter; the total is the sum. Used for counting events across agents.
- **OR-Set (observed-remove set):** Elements can be added and removed concurrently without conflicts. Used for shared tag sets or capability lists.
- **LWW-Register:** A register where the value with the latest timestamp wins. Used for simple key-value state.

```typescript
// G-Counter CRDT: each agent has its own counter
interface GCounter {
  counts: Record<string, number>;  // agentName → count
}

function increment(counter: GCounter, agentName: string): GCounter {
  return {
    counts: {
      ...counter.counts,
      [agentName]: (counter.counts[agentName] || 0) + 1,
    },
  };
}

function total(counter: GCounter): number {
  return Object.values(counter.counts).reduce((sum, c) => sum + c, 0);
}

function merge(a: GCounter, b: GCounter): GCounter {
  const allAgents = new Set([...Object.keys(a.counts), ...Object.keys(b.counts)]);
  const merged: Record<string, number> = {};
  for (const agent of allAgents) {
    merged[agent] = Math.max(a.counts[agent] || 0, b.counts[agent] || 0);
  }
  return { counts: merged };
}
```

### Manual Merge with Human Review

For high-stakes conflicts (two agents assign conflicting priorities to the same customer), escalate to human review via a decision memo or approval workflow.

## Agent Isolation vs Shared Context Trade-offs

### Full Isolation

Each agent operates in its own state silo. No shared memory, no conflict risk, no coordination overhead.

**When to use:** Independent agents that never interact (e.g., separate tenants' AI assistants).
**Risk:** Agents duplicate work, miss cross-cutting information, make inconsistent decisions.

### Full Sharing

All agents share all state. Every agent can read and write any state.

**When to use:** Tightly coupled agent teams working on the same task.
**Risk:** Noisy state (agents see irrelevant information), contention on popular state keys, security concerns (Agent A should not access Agent B's credentials).

### Scoped Sharing (Recommended)

State is scoped by tenant, domain, and access level. Agents see only the state relevant to their role:

```typescript
interface StateScope {
  tenantId: string;          // Always scoped to tenant
  domain: string;            // "customer", "calendar", "billing", "internal"
  accessLevel: "read" | "write" | "admin";
}

const AGENT_SCOPES: Record<string, StateScope[]> = {
  "Lucy": [
    { tenantId: "*", domain: "customer", accessLevel: "write" },
    { tenantId: "*", domain: "calendar", accessLevel: "write" },
    { tenantId: "*", domain: "billing", accessLevel: "read" },
  ],
  "Atlas": [
    { tenantId: "*", domain: "*", accessLevel: "admin" },
  ],
  "Binky": [
    { tenantId: "*", domain: "customer", accessLevel: "read" },
    { tenantId: "*", domain: "billing", accessLevel: "write" },
    { tenantId: "*", domain: "marketing", accessLevel: "write" },
  ],
};
```

## Atlas UX Pattern: Tenant-Scoped State with Audit Trail

Atlas UX implements scoped sharing with full audit logging:

1. **Every database table has `tenant_id`:** State isolation between tenants is enforced at the data model level, not the application level.
2. **The `tenantPlugin` extracts tenant context:** Every request carries `x-tenant-id`, and the plugin injects it into the request context. No query can accidentally access another tenant's state.
3. **The `auditPlugin` logs all mutations:** Every state change is recorded in the `audit_log` table with the agent name, action type, and before/after state. Hash chain integrity ensures the audit trail cannot be tampered with.
4. **The job system provides async coordination:** Agents enqueue work via the `jobs` table (statuses: queued, running, completed, failed). The engine loop processes jobs sequentially, preventing concurrent modification of the same state.
5. **Decision memos gate risky state changes:** High-risk mutations (spend above limit, recurring charges, risk tier 2+) require approval before execution, preventing agents from making dangerous changes autonomously.

This architecture provides the benefits of shared state (agents see each other's work) with the safety of isolation (tenants are separate, risky actions require approval, everything is auditable).

## Conclusion

Centralized state management is the nervous system of a multi-agent platform. Without it, agents are isolated intelligences making decisions in the dark. The blackboard pattern provides conceptual clarity, shared databases provide production reliability, and event stores provide complete history. The choice of consistency model — strong, eventual, or causal — should match the domain requirements: financial operations need strong consistency, while marketing analytics can tolerate eventual consistency. For most AI agent platforms, the recommended architecture combines PostgreSQL as the durable source of truth, Redis for high-speed ephemeral state, scoped access controls per agent role, and a comprehensive audit trail that records every state mutation.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopology-Star.svg/400px-NetworkTopology-Star.svg.png — Star topology representing centralized state accessed by multiple agents
2. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/ACID_Properties.svg/400px-ACID_Properties.svg.png — ACID transaction properties diagram for database-backed state consistency
3. https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Event_store.svg/400px-Event_store.svg.png — Event store architecture showing append-only event sequence
4. https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Blackboard_system.svg/400px-Blackboard_system.svg.png — Blackboard architecture with knowledge sources and control component
5. https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Optimistic_locking.svg/400px-Optimistic_locking.svg.png — Optimistic concurrency control flow with version checking

## Videos

1. https://www.youtube.com/watch?v=M4q59P8gMWk — "Distributed Systems in One Lesson" by Tim Berglund covering consistency models and state management patterns
2. https://www.youtube.com/watch?v=bo5j0IGFnBY — "CRDTs: The Hard Parts" by Martin Kleppmann explaining conflict-free data structures for distributed systems

## References

1. Nii, H. P. (1986). "Blackboard Systems: The Blackboard Model of Problem Solving and the Evolution of Blackboard Architectures." AI Magazine, 7(2). https://ojs.aaai.org/aimagazine/index.php/aimagazine/article/view/537
2. Kleppmann, M. (2017). "Designing Data-Intensive Applications." O'Reilly Media. https://dataintensive.net/
3. Shapiro, M., Preguica, N., Baquero, C., & Zawirski, M. (2011). "Conflict-Free Replicated Data Types." INRIA Research Report. https://hal.inria.fr/inria-00609399
4. PostgreSQL Documentation. "Transaction Isolation." https://www.postgresql.org/docs/current/transaction-iso.html
