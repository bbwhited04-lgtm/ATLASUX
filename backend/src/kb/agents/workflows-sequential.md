# Sequential Workflows — Linear Step-by-Step Execution

## The Simplest Pattern

A sequential workflow executes steps in a fixed, linear order. Step 1 completes, then Step 2 begins, then Step 3, and so on. No branching, no parallelism, no decision points. Each step's output feeds directly into the next step's input.

Sequential workflows are the most common type and the right choice for most simple business processes. Don't reach for state machines or parallel execution until you've proven a sequential workflow isn't enough.

## When to Use Sequential

- Steps must happen in a specific order (can't send confirmation before booking)
- Each step depends on the previous step's output
- The process is well-understood and rarely changes
- Error handling is simple: retry or stop

## Structure

```
[Start] → [Step 1] → [Step 2] → [Step 3] → [Step 4] → [End]
```

No branches, no loops, no parallel paths. If any step fails, the workflow either retries or stops.

## Real-World Example: Appointment Booking

```
1. Receive request (name, phone, service, date)
    ↓
2. Validate input (phone format, date not in past, service exists)
    ↓
3. Look up or create customer record
    ↓
4. Check technician availability for requested date
    ↓
5. Create appointment record in database
    ↓
6. Send SMS confirmation to customer
    ↓
7. Notify assigned technician via Slack
    ↓
8. Log to audit trail
    ↓
[Complete]
```

Each step must succeed before the next begins. If Step 4 finds no availability, the workflow stops and reports back.

## Implementation Pattern

```typescript
type Step = {
  name: string;
  execute: (context: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

async function runSequential(steps: Step[], initialContext: Record<string, unknown>) {
  let context = { ...initialContext };

  for (const step of steps) {
    try {
      const result = await step.execute(context);
      context = { ...context, ...result };
    } catch (err) {
      return { status: "failed", failedStep: step.name, error: err, context };
    }
  }

  return { status: "completed", context };
}
```

## Error Handling Strategies

**Stop on Failure** — The simplest approach. If any step fails, the entire workflow fails. Report which step failed and why.

**Retry and Continue** — Retry the failed step N times with backoff. If all retries fail, stop.

**Skip and Continue** — Mark the failed step as skipped and continue. Only works for non-critical steps (e.g., Slack notification failure shouldn't block appointment booking).

**Compensate and Roll Back** — When a later step fails, undo earlier steps in reverse order.

## Advantages

- **Simple to understand** — Anyone can read the flow top to bottom
- **Simple to debug** — Failures point to a specific step
- **Simple to audit** — Linear trail of actions
- **Simple to test** — Test each step independently, then the chain

## Limitations

- **Slow for independent steps** — Steps that could run in parallel are forced to wait
- **Rigid** — No conditional branching (need rules-driven or state machine for that)
- **Single point of failure** — One slow step blocks everything downstream
- **Not suitable for long-running processes** — A workflow waiting days for human approval blocks the entire chain

## Atlas UX Sequential Workflows

- **Email sender worker** — Pick up queued email → render template → send via SMTP → mark as sent → log audit
- **KB document ingestion** — Receive document → chunk into sections → generate embeddings → upsert to Pinecone → update chunk table
- **Stripe checkout** — Create checkout session → redirect user → receive webhook → update subscription → provision features

## Resources

- [Workflow Patterns — Sequence](http://www.workflowpatterns.com/patterns/control/basic/wcp1.php) — Academic definition of the sequence control flow pattern
- [AWS Step Functions — Sequential Steps](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-states.html) — How AWS implements sequential task execution

## Image References

1. Sequential workflow diagram — "sequential workflow linear steps diagram start end flowchart"
2. Pipeline processing pattern — "data processing pipeline sequential stages diagram ETL"
3. Error handling in sequential flow — "error handling retry stop sequential workflow diagram"
4. Step dependency chain — "step dependency chain sequential execution order diagram"
5. Before/after automation — "manual vs automated sequential process comparison diagram"

## Video References

1. [Process Automation Basics — Kissflow](https://www.youtube.com/watch?v=M_XxOKm-HjE) — Introductory guide to sequential business process automation
2. [AWS Step Functions — Amazon Web Services](https://www.youtube.com/watch?v=Dh7h3lkpeP4) — Building sequential workflows with AWS managed services
