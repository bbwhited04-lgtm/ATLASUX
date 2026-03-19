# Workflow Inputs — Triggers, Data Sources, and Event Handling

## What Triggers a Workflow?

Every workflow starts with an input — the event or data that initiates execution. The input determines what the workflow processes, what context is available, and how the workflow should behave. Well-designed inputs are validated, typed, and carry enough context for the workflow to complete without additional lookups.

## Input Categories

### Event-Based Triggers
Something happens in the system and fires the workflow:

- **Webhook** — An external system sends an HTTP POST. Atlas UX receives ElevenLabs call events, Stripe payment confirmations, and GitHub push events via webhooks.
- **Database Event** — A row is inserted, updated, or deleted. Prisma's `$subscribe` or Postgres LISTEN/NOTIFY can trigger workflows on data changes.
- **Message Queue** — A message arrives on a queue (SQS, RabbitMQ, Redis Pub/Sub). Decouples the trigger from the processor.
- **File System** — A file is uploaded, created, or modified. S3 event notifications, filesystem watchers.

### Scheduled Triggers
Time-based workflow initiation:

- **Cron Schedule** — Run at fixed intervals. Atlas UX's engine loop ticks every `ENGINE_TICK_INTERVAL_MS` (default 5000ms). Morning briefings run daily at 7 AM.
- **Delayed Execution** — Run after a specified delay. "Send follow-up email 24 hours after appointment."
- **Calendar-Based** — Run on business days only, skip holidays, respect timezone.

### Human Triggers
A person initiates the workflow:

- **Form Submission** — User fills out a web form. Onboarding wizard, support ticket, appointment request.
- **Button Click** — User clicks "Approve", "Send", "Deploy" in the UI.
- **Voice Command** — User speaks to Lucy. The voice input is transcribed and becomes the workflow input.
- **Chat Message** — User types in a chat interface. The message is parsed for intent.

### System Triggers
Internal system events:

- **API Call** — Another service calls your workflow endpoint. Microservice orchestration.
- **Error Condition** — A failure triggers a remediation workflow. Atlas UX's KB self-heal fires when vector search returns zero results.
- **Threshold Breach** — A metric exceeds a limit. Spending cap hit, rate limit approached, disk space low.

## Input Data Structure

Every workflow input should carry:

```typescript
type WorkflowInput = {
  // Identity
  workflowId: string;        // Which workflow to run
  triggerId: string;         // Unique ID for this execution
  triggerType: "webhook" | "schedule" | "human" | "system";

  // Context
  tenantId: string;          // Multi-tenant isolation
  actorId: string;           // Who/what triggered this
  timestamp: Date;           // When triggered

  // Payload
  data: Record<string, unknown>;  // The actual input data

  // Metadata
  priority: "low" | "normal" | "high" | "urgent";
  idempotencyKey?: string;   // Prevent duplicate processing
  correlationId?: string;    // Link to parent workflow
};
```

## Input Validation

Never trust raw input. Validate before processing:

```typescript
function validateWorkflowInput(input: WorkflowInput): ValidationResult {
  const errors: string[] = [];

  if (!input.tenantId) errors.push("tenantId is required");
  if (!input.data) errors.push("data payload is required");
  if (!input.triggerId) errors.push("triggerId is required for audit trail");

  // Type-specific validation
  if (input.triggerType === "webhook") {
    if (!input.data.signature) errors.push("webhook signature required");
  }

  return { valid: errors.length === 0, errors };
}
```

## Idempotency

Inputs may arrive more than once (webhook retries, duplicate form submissions). Use idempotency keys to prevent duplicate processing:

```typescript
async function processInput(input: WorkflowInput) {
  if (input.idempotencyKey) {
    const existing = await db.workflowExecution.findFirst({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) return existing.result; // Already processed
  }
  // ... process workflow
}
```

## Atlas UX Input Examples

**Voice Call Input (Lucy):**
```json
{
  "triggerType": "webhook",
  "data": {
    "callSid": "CA123...",
    "from": "+15551234567",
    "transcript": "I need to book a plumber for tomorrow morning",
    "agentId": "lucy",
    "conversationId": "conv_abc"
  }
}
```

**Engine Loop Input:**
```json
{
  "triggerType": "schedule",
  "data": {
    "tick": 14523,
    "pendingJobs": 3,
    "activeAgents": ["binky", "lucy", "sunday"]
  }
}
```

**KB Heal Input:**
```json
{
  "triggerType": "system",
  "data": {
    "trigger": "reactive",
    "query": "transformer architecture explained",
    "errorType": "coverage_gap",
    "agentId": "archy",
    "hitCount": 0
  }
}
```

## Resources

- [CloudEvents Specification](https://cloudevents.io/) — Industry standard for describing event data in a common way across systems
- [Temporal Workflow Triggers](https://docs.temporal.io/workflows#workflow-execution) — How production workflow engines handle input and execution triggers

## Image References

1. Workflow trigger types diagram — "workflow trigger types event schedule human API webhook diagram"
2. Webhook payload flow — "webhook HTTP POST payload flow sender receiver validation diagram"
3. Event-driven architecture — "event driven architecture pub sub message queue workflow diagram"
4. Input validation pipeline — "input validation pipeline schema check sanitize transform diagram"
5. Idempotency key deduplication — "idempotency key deduplication pattern distributed systems diagram"

## Video References

1. [Event-Driven Architecture Explained — IBM Technology](https://www.youtube.com/watch?v=o2HJCGcYwoU) — How event-based triggers power modern workflow systems
2. [Webhooks Explained — Fireship](https://www.youtube.com/watch?v=41NOoEz3Tzc) — Fast overview of webhook triggers and handling patterns
