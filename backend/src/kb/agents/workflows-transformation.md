# Workflow Transformation — Steps, Actions, and Processing Logic

## The Heart of the Workflow

Transformation is where work happens. Between the input trigger and the output result, every workflow executes a series of steps — each performing a specific action that moves data closer to the desired outcome. Steps can validate, transform, route, call APIs, invoke AI, wait for humans, or trigger sub-workflows.

## Step Types

### Data Transformation Steps
Reshape, enrich, or clean data:

- **Map** — Transform fields from one format to another (date formats, unit conversions, field renaming)
- **Filter** — Remove records that don't meet criteria
- **Aggregate** — Combine multiple records (sum, average, group)
- **Enrich** — Add data from external sources (geocode an address, lookup company info)
- **Validate** — Check data against business rules before proceeding

### Action Steps
Do something in the real world:

- **API Call** — Hit an external service (send SMS via Twilio, create event in Google Calendar)
- **Database Operation** — Insert, update, query records (create appointment, update status)
- **File Operation** — Read, write, upload, download files (generate PDF invoice, upload to S3)
- **Notification** — Send email, SMS, Slack message, push notification
- **AI Inference** — Call an LLM for reasoning, classification, generation

### Control Flow Steps
Manage workflow execution:

- **Condition** — If/else branching based on data values
- **Switch** — Multi-way branching (like a switch statement)
- **Loop** — Repeat steps for each item in a collection
- **Wait** — Pause execution until a condition is met or time passes
- **Error Handler** — Catch failures and execute recovery logic

### Human Steps
Involve a person in the workflow:

- **Approval** — Human reviews and approves/rejects (Atlas UX decision memos)
- **Manual Task** — Human performs work outside the system and marks complete
- **Review** — Human inspects output before it's finalized
- **Escalation** — Route to a senior person when conditions exceed thresholds

## Step Anatomy

Every step should define:

```typescript
type WorkflowStep = {
  id: string;                    // Unique step identifier
  name: string;                  // Human-readable name
  type: "action" | "condition" | "wait" | "human" | "transform";

  // Execution
  handler: (context: StepContext) => Promise<StepResult>;
  timeout_ms: number;            // Max execution time
  retries: number;               // Retry count on failure
  retryDelay_ms: number;         // Delay between retries

  // Flow control
  onSuccess: string;             // Next step ID on success
  onFailure: string;             // Next step ID on failure
  onTimeout: string;             // Next step ID on timeout

  // Audit
  logLevel: "info" | "warn" | "error";
  redactFields: string[];        // Fields to redact from audit logs
};
```

## Step Context

Each step receives context from previous steps:

```typescript
type StepContext = {
  workflowId: string;
  executionId: string;
  tenantId: string;

  // Input from previous steps
  input: Record<string, unknown>;

  // Accumulated state from all previous steps
  state: Record<string, unknown>;

  // Step metadata
  currentStep: string;
  stepNumber: number;
  startedAt: Date;

  // Previous step results
  previousResult: StepResult;
};
```

## Error Handling in Transformations

### Retry with Backoff
```typescript
async function executeWithRetry(step: WorkflowStep, context: StepContext) {
  for (let attempt = 0; attempt <= step.retries; attempt++) {
    try {
      return await step.handler(context);
    } catch (err) {
      if (attempt === step.retries) throw err;
      await sleep(step.retryDelay_ms * Math.pow(2, attempt)); // Exponential backoff
    }
  }
}
```

### Compensation (Undo)
When a later step fails, earlier steps may need to be reversed:

```
Step 1: Reserve inventory     ✓
Step 2: Charge credit card    ✓
Step 3: Ship order            ✗ (out of stock)

Compensation:
Step 2c: Refund credit card
Step 1c: Release inventory
```

### Dead Letter Queue
Steps that fail all retries get moved to a dead letter queue for manual investigation rather than being silently dropped.

## Atlas UX Transformation Examples

**Lucy Call Processing:**
1. Receive transcript (input)
2. Classify intent (AI inference)
3. Extract entities — name, phone, service type (AI transform)
4. Look up customer (database query)
5. Check availability (API call to calendar)
6. Book appointment (database write)
7. Send SMS confirmation (API call to Twilio)
8. Notify technician via Slack (API call)
9. Log to audit trail (database write)

**KB Self-Heal Pipeline:**
1. Detect gap (system trigger)
2. Classify gap type — coverage, drift, stale (AI inference)
3. Generate content (AI generation)
4. Validate content quality (AI review)
5. Ingest into KB (database write)
6. Re-embed chunks (vector operation)
7. Verify search returns results (validation query)

## Resources

- [Workflow Patterns — Control Flow](http://www.workflowpatterns.com/patterns/control/) — Academic catalog of 43 control flow patterns for workflow transformation
- [AWS Step Functions — States](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-states.html) — How AWS defines workflow step types (Task, Choice, Wait, Parallel, etc.)

## Image References

1. Workflow step types diagram — "workflow step types action condition wait human transform diagram"
2. Data transformation pipeline — "ETL data transformation pipeline extract transform load diagram"
3. Error handling retry backoff — "retry exponential backoff error handling workflow diagram"
4. Compensation pattern (saga) — "saga pattern compensation undo rollback distributed workflow diagram"
5. Step context data flow — "workflow step context state accumulation data flow diagram"

## Video References

1. [Saga Pattern Explained — CodeOpinion](https://www.youtube.com/watch?v=xDuwrtwYHu8) — How to handle failures in multi-step workflows with compensation
2. [AWS Step Functions Tutorial — Be A Better Dev](https://www.youtube.com/watch?v=s0XFX3WHg0w) — Practical walkthrough of step types and transformation patterns
