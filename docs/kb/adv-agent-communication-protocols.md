# Agent Communication Protocols

> How Atlas UX agents exchange information, delegate work, and coordinate actions.
> Audience: Platform engineers, integration architects, and AI system designers.

---

## Overview

Communication is the substrate of multi-agent systems. Every orchestration pattern from the companion document (adv-multi-agent-orchestration.md) relies on agents being able to send, receive, and interpret messages reliably. Atlas UX supports multiple communication protocols, each optimized for different interaction patterns.

This document covers 11 communication mechanisms, their implementation in Atlas UX, and engineering guidance for choosing between them.

---

## 1. Direct Messaging (Agent-to-Agent Email)

Each Atlas UX agent has a dedicated email address (e.g., atlas@deadapp.info, binky@deadapp.info). Agents can send emails to each other using the `send_email` tool.

**When to use:**
- Formal communications that need an audit trail
- Cross-department communications
- Notifications that the receiving agent should process asynchronously

**Implementation:**
```typescript
// Agent Sunday sending a draft to Atlas for review
await tools.send_email({
  to: 'atlas@deadapp.info',
  subject: 'Blog Draft: Q2 Marketing Strategy',
  body: 'Attached is the draft blog post for your review...',
  priority: 'P2'
});
```

**Characteristics:**
- Asynchronous (no guaranteed delivery time)
- Persistent (stored in email system, queryable later)
- Auditable (logged in audit trail automatically)
- Supports attachments (via file references)

**Routing rules:** Agents can only email agents they have a defined relationship with (reportsTo, peers in same department, or explicit cross-department permissions). Unauthorized emails are blocked by the SGL layer.

---

## 2. Publish-Subscribe (Event Subscriptions)

Agents subscribe to event types and receive notifications when matching events occur. The audit log doubles as the event bus.

**Event types agents can subscribe to:**
```
TASK_COMPLETED    — A delegated task finished
TASK_FAILED       — A delegated task failed
BUDGET_ALERT      — Spending threshold crossed
CONTENT_PUBLISHED — Content went live on a platform
ANOMALY_DETECTED  — An agent detected something unusual
POLICY_CHANGED    — SGL policy was updated
DECISION_REQUIRED — A DecisionMemo needs votes
CUSTOMER_ESCALATION — Support ticket escalated
```

**Subscription configuration (in agent POLICY.md):**
```yaml
subscriptions:
  - event: BUDGET_ALERT
    filter: { threshold: "> 80%" }
    action: review_budget
  - event: CONTENT_PUBLISHED
    filter: { platform: "x_twitter" }
    action: monitor_engagement
```

**Implementation in the engine loop:**
After each job completes, the engine checks the `publish_events` table for matching subscriptions and creates new jobs for subscribed agents.

**Strengths:** Decoupled agents, natural for reactive behaviors, scales to many subscribers.
**Weaknesses:** No guaranteed ordering of event delivery; subscribers may process events at different times.

---

## 3. Request-Reply (Synchronous Delegation)

The `delegate_task` tool implements synchronous-style communication: one agent requests work from another and waits for the result.

**How it works:**
1. Agent A calls `delegate_task({ to: 'archy', task: 'Research competitor pricing', deadline: '2h' })`
2. Engine creates a job for Archy with `callback_job_id` pointing to Agent A's current job
3. Agent A's job moves to `waiting` status
4. Archy completes the research, job moves to `completed`
5. Engine resumes Agent A's job with Archy's output as context

**Timeout handling:**
- Default timeout: 30 minutes
- If the delegate times out, the requesting agent receives a timeout notification
- The requesting agent can retry, escalate, or proceed without the result

**Nested delegation:**
Archy can further delegate to other agents while processing a request. The engine tracks the full delegation chain to prevent circular dependencies (max depth: 5).

```
Atlas → delegate_task → Binky → delegate_task → Archy → delegate_task → Sunday
```

**Important:** Delegation depth is enforced. If an agent tries to delegate beyond the max depth, the engine rejects the request and notifies the originating agent.

---

## 4. Event-Driven Communication (Audit Log as Event Bus)

The audit log is not just for compliance — it is the canonical event bus for the entire system.

**How agents react to audit events:**
```typescript
// Engine loop checks for new audit entries matching agent subscriptions
const recentEvents = await prisma.auditLog.findMany({
  where: {
    timestamp: { gte: lastCheckTime },
    action: { in: subscribedActions }
  },
  orderBy: { timestamp: 'asc' }
});
```

**Event-driven patterns in Atlas UX:**
- Larry monitors all `BUDGET_SPEND` events and flags anomalies
- Tina reacts to `INVOICE_CREATED` events to update financial projections
- Daily-Intel aggregates all events from the past 24 hours for the morning brief
- Atlas monitors `TASK_FAILED` events for escalation

**Design principle:** Every state change in the system produces an audit log entry. Agents that need to react to state changes subscribe to the relevant audit actions rather than polling individual tables.

**Advantages over direct messaging:**
- Cannot be lost (audit log is append-only and durable)
- Observable by multiple agents simultaneously
- Complete history available for replay and debugging
- No coupling between producer and consumer

---

## 5. Shared Memory (KB as Knowledge Store)

The Knowledge Base (KB) serves as a shared memory space where agents read and write structured knowledge.

**Access patterns:**
```
Write: Agent completes research → stores findings in KB doc
Read:  Agent starting a task → queries KB for relevant context
Update: Agent discovers new information → appends to existing KB doc
```

**Namespacing:** KB documents are namespaced by tenant and category to prevent agents from accidentally reading irrelevant information.

**Concurrency control:** Multiple agents can write to the same KB document. The system uses append-only semantics — each contribution is a separate entry with a timestamp and author. Conflicting information is preserved (not overwritten) and flagged for human or Atlas review.

**Knowledge decay:** KB entries older than the configured retention period are automatically marked `stale`. Agents treat stale knowledge with lower confidence and may trigger a refresh by delegating to Archy.

**Implementation:**
```typescript
// Agent writing to shared KB
await tools.kb_write({
  topic: 'competitor-analysis-q2-2026',
  content: researchFindings,
  confidence: 0.85,
  sources: ['https://competitor.com/pricing', 'industry-report-2026.pdf'],
  ttl: '30d' // knowledge valid for 30 days
});

// Agent reading from shared KB
const context = await tools.kb_query({
  topic: 'competitor-analysis',
  recency: '7d',
  minConfidence: 0.7
});
```

---

## 6. Contract Net Protocol

A formalized version of the auction pattern, used for task allocation when the best-fit agent is not predetermined.

**Four phases:**

**Phase 1 — Announcement:**
The manager agent (usually Atlas) broadcasts a task description with requirements.
```json
{
  "type": "TASK_ANNOUNCEMENT",
  "task": "Write a technical white paper on AI governance",
  "requirements": ["writing", "ai_knowledge", "compliance"],
  "deadline": "2026-03-15T00:00:00Z",
  "budget_tokens": 50000
}
```

**Phase 2 — Bidding:**
Eligible agents evaluate and respond with bids.
```json
{
  "agent": "sunday",
  "bid": {
    "estimated_hours": 4,
    "confidence": 0.92,
    "token_estimate": 35000,
    "approach": "Research existing frameworks, draft outline, write sections, peer review with Jenny"
  }
}
```

**Phase 3 — Award:**
The manager selects the winning bid and notifies all participants.

**Phase 4 — Execution & Reporting:**
The winning agent executes the task and reports results. If the agent fails, the manager can award to the next-best bidder.

**Rejection handling:** If no bids are received (all agents at capacity), the manager can retry with relaxed requirements, extended deadline, or escalate to a human operator.

---

## 7. Semantic Messaging (Structured Schemas)

All inter-agent messages follow structured schemas to prevent misinterpretation.

**Base message schema:**
```typescript
interface AgentMessage {
  id: string;                    // Unique message ID (UUID)
  from: string;                  // Sender agent ID
  to: string;                    // Recipient agent ID
  timestamp: string;             // ISO 8601
  type: MessageType;             // Enum of valid message types
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  payload: Record<string, any>;  // Type-specific payload
  correlationId?: string;        // Links related messages
  replyTo?: string;              // Message this replies to
  ttl?: number;                  // Time-to-live in seconds
}
```

**Message types and their payloads:**

| Type | Required Payload Fields |
|------|------------------------|
| TASK_REQUEST | task, requirements, deadline |
| TASK_RESULT | taskId, status, output, metrics |
| INFORMATION | topic, content, confidence, sources |
| QUERY | question, context, responseFormat |
| ALERT | severity, description, suggestedAction |
| APPROVAL_REQUEST | action, risk, justification |
| APPROVAL_RESPONSE | requestId, decision, conditions |
| STATUS_UPDATE | taskId, progress, eta |

**Validation:** The engine validates every message against its schema before delivery. Malformed messages are rejected and the sender receives an error notification.

---

## 8. Message Priority Levels

Not all messages are equal. The priority system ensures urgent communications are processed first.

**Priority definitions:**

| Level | Name | Response SLA | Use Cases |
|-------|------|-------------|-----------|
| P0 | Critical | Next engine tick (5s) | Security incident, system failure, budget overrun |
| P1 | High | Within 1 minute | Customer escalation, deadline at risk, approval needed |
| P2 | Normal | Within 15 minutes | Standard task delegation, status updates |
| P3 | Low | Within 1 hour | FYI notifications, non-urgent research requests |

**Queue ordering:** The engine loop processes jobs in priority order within each tick:
```sql
SELECT * FROM jobs
WHERE status = 'queued'
ORDER BY
  CASE priority
    WHEN 'P0' THEN 0
    WHEN 'P1' THEN 1
    WHEN 'P2' THEN 2
    WHEN 'P3' THEN 3
  END,
  created_at ASC
FOR UPDATE SKIP LOCKED
LIMIT 10;
```

**Priority escalation:** Messages automatically escalate if not processed within their SLA:
- P3 → P2 after 1 hour
- P2 → P1 after 30 minutes
- P1 → P0 after 5 minutes (and alerts Atlas)

---

## 9. Message Routing Rules

The org hierarchy defines who can communicate with whom. Not all agent-to-agent paths are permitted.

**Permitted communication paths:**
1. **Upward:** Any agent can message their direct supervisor (reportsTo)
2. **Downward:** Any supervisor can message their direct reports
3. **Lateral:** Agents in the same department can message each other
4. **Cross-department:** Requires routing through department heads or Atlas

**Routing matrix (simplified):**
```
            Atlas  Binky  Tina  Larry  Jenny  Sunday  Archy  Publishers
Atlas         -     ✓      ✓     ✓      ✓      ✓       ✓       ✓
Binky         ✓     -      ✓     ✓      ✗      ✓       ✓       ✓
Tina          ✓     ✓      -     ✓      ✗      ✗       ✗       ✗
Sunday        ✓     ✓      ✗     ✗      ✗      -       ✓       ✓
Publishers    ✗     ✗      ✗     ✗      ✗      ✓       ✗       ✗
```

**Bypass rules:**
- P0 messages bypass routing restrictions (any agent can alert any agent)
- Atlas can message any agent at any level (CEO override)
- Agents can broadcast to the audit log (readable by all)

---

## 10. Dead Letter Handling

Messages to offline, failed, or nonexistent agents are captured in a dead letter queue.

**Causes of dead letters:**
- Target agent is `suspended` or `terminated`
- Message TTL expired before delivery
- Routing validation failed
- Target agent's job queue exceeded maximum depth

**Dead letter processing:**
```
1. Message lands in dead_letter_queue table
2. Engine checks dead letter queue every 60 seconds
3. For each dead letter:
   a. If agent is temporarily unavailable → retry with backoff
   b. If agent is permanently offline → route to supervisor
   c. If message TTL expired → log as dropped, notify sender
   d. If routing failed → return to sender with error
```

**Monitoring:** Larry (Auditor) monitors dead letter rates. A spike in dead letters triggers an ANOMALY_DETECTED event, prompting Atlas to investigate.

---

## 11. Message Idempotency

Agents must handle duplicate messages gracefully. The engine guarantees at-least-once delivery, not exactly-once.

**Idempotency key:** Every message has a unique `id` field. Agents track processed message IDs in a sliding window (last 1000 messages) and skip duplicates.

**Implementation pattern:**
```typescript
async function processMessage(msg: AgentMessage): Promise<void> {
  // Check if already processed
  const existing = await prisma.processedMessages.findUnique({
    where: { messageId: msg.id }
  });
  if (existing) {
    log.info(`Skipping duplicate message ${msg.id}`);
    return;
  }

  // Process the message
  await handleMessage(msg);

  // Mark as processed
  await prisma.processedMessages.create({
    data: { messageId: msg.id, processedAt: new Date() }
  });
}
```

**Idempotent operations:** All agent tools are designed to be idempotent. Sending the same email twice, creating the same KB entry twice, or posting the same social content twice should produce the same result as doing it once. Tools use external deduplication keys (e.g., content hash + timestamp) to enforce this.

---

## Protocol Selection Guide

| Scenario | Recommended Protocol |
|----------|---------------------|
| Assign a specific task to a specific agent | Request-Reply (delegate_task) |
| Notify all agents of a policy change | Publish-Subscribe |
| Research that needs to persist for other agents | Shared Memory (KB) |
| Formal cross-department communication | Direct Messaging (email) |
| Find the best agent for an ambiguous task | Contract Net Protocol |
| Real-time reaction to system events | Event-Driven (audit log) |
| Urgent security alert | Direct Messaging with P0 priority |
| Multi-agent decision making | Consensus (see orchestration doc) |

---

## Observability

All communication is observable through:

1. **Audit log:** Every message send/receive is logged with full payload
2. **Agent Watcher:** Real-time view of agent activity (polls audit log every 4s)
3. **Message flow visualization:** Trace a correlationId to see the full message chain
4. **Dead letter dashboard:** Monitor failed deliveries
5. **Latency metrics:** Track time from send to processing for each priority level

**Key metrics to monitor:**
- Messages per agent per minute
- Average processing latency by priority
- Dead letter rate (should be <1%)
- Queue depth per agent (alert if >50 pending messages)
- Cross-department message volume (high volume may indicate architectural issues)
