# State Machine Workflows — State-Based Transitions with Events

## What Is a State Machine Workflow?

A state machine workflow defines a set of **states** and the **transitions** between them. The workflow moves from state to state based on events or conditions. Unlike sequential workflows, a state machine can loop back, skip states, or branch based on the current state and incoming event.

State machines are ideal for processes with multiple possible paths, long-running lifecycles, or situations where the same entity goes through different phases (orders, tickets, subscriptions).

## Core Concepts

**State** — A distinct phase the entity is in: `draft`, `submitted`, `in_review`, `approved`, `rejected`, `completed`.

**Transition** — A valid move from one state to another, triggered by an event: `submit → in_review`, `approve → completed`.

**Event** — The trigger that causes a transition: `user_submits`, `reviewer_approves`, `timer_expires`.

**Guard** — A condition that must be true for a transition to occur: "Can only approve if all reviewers have signed off."

## State Machine Diagram

```
                    submit
    [Draft] ──────────────────► [In Review]
                                     │
                         ┌───────────┼───────────┐
                         │ approve   │           │ reject
                         ▼           │           ▼
                   [Approved]   request_changes  [Rejected]
                         │           │                │
                    execute     ▼           resubmit │
                         │    [Changes               │
                         ▼     Requested] ◄──────────┘
                   [Completed]       │
                                     │ submit
                                     └──────► [In Review]
```

## Implementation

```typescript
type State = "draft" | "submitted" | "in_review" | "approved" | "rejected" | "completed";
type Event = "submit" | "approve" | "reject" | "request_changes" | "resubmit" | "execute";

type Transition = {
  from: State;
  event: Event;
  to: State;
  guard?: (context: Record<string, unknown>) => boolean;
  action?: (context: Record<string, unknown>) => Promise<void>;
};

const transitions: Transition[] = [
  { from: "draft", event: "submit", to: "in_review",
    action: async (ctx) => { await notifyReviewers(ctx); } },
  { from: "in_review", event: "approve", to: "approved",
    guard: (ctx) => ctx.allReviewersApproved === true },
  { from: "in_review", event: "reject", to: "rejected",
    action: async (ctx) => { await notifySubmitter(ctx, "rejected"); } },
  { from: "in_review", event: "request_changes", to: "draft" },
  { from: "rejected", event: "resubmit", to: "in_review" },
  { from: "approved", event: "execute", to: "completed",
    action: async (ctx) => { await executeApprovedAction(ctx); } },
];

async function transition(current: State, event: Event, context: Record<string, unknown>): Promise<State> {
  const t = transitions.find(tr => tr.from === current && tr.event === event);
  if (!t) throw new Error(`No transition from ${current} on event ${event}`);
  if (t.guard && !t.guard(context)) throw new Error(`Guard failed for ${current} → ${event}`);
  if (t.action) await t.action(context);
  return t.to;
}
```

## When to Use State Machines

- **Multi-stage lifecycles** — Orders (placed → paid → shipped → delivered), tickets (open → assigned → in_progress → resolved)
- **Approval workflows** — Content review, expense approval, change requests
- **Subscription management** — Trial → active → past_due → cancelled → reactivated
- **Long-running processes** — Processes that span hours, days, or weeks with multiple pause points

## Atlas UX State Machine Workflows

**Decision Memo Lifecycle:**
```
[Proposed] → [Under Review] → [Approved] → [Executed]
                    │
                    └──→ [Rejected] → [Revised] → [Under Review]
```

**Job Queue:**
```
[Queued] → [Running] → [Completed]
                │
                └──→ [Failed] → [Retrying] → [Running]
                                     │
                                     └──→ [Dead Letter]
```

**Agent Engine Loop:**
```
[Idle] → [Processing Intent] → [Retrieving Context] → [Reasoning] → [Acting] → [Auditing] → [Idle]
```

## Advantages

- **Explicit valid states** — Impossible to be in an undefined state
- **Clear transition rules** — Every state change is documented and enforced
- **Auditability** — Full history of state transitions with timestamps
- **Long-running support** — State is persisted; workflow survives restarts
- **Idempotent events** — Re-sending an event in the same state is safe

## Limitations

- **Complexity grows fast** — N states with M events = up to N×M transitions to define
- **State explosion** — Adding a new concern (urgency level × current state × user role) multiplies states
- **Hard to visualize** — Large state machines become spaghetti diagrams

## Resources

- [XState Documentation](https://xstate.js.org/docs/) — The leading JavaScript state machine library with visual editor
- [Statecharts — David Harel](https://www.sciencedirect.com/science/article/pii/0167642387900359) — The seminal 1987 paper that defined hierarchical state machines

## Image References

1. State machine diagram — "state machine diagram transitions events guards UML statechart"
2. Order lifecycle state machine — "order lifecycle state machine placed paid shipped delivered diagram"
3. XState visual editor — "XState visual state machine editor browser interactive diagram"
4. State transition table — "state transition table matrix events states valid transitions"
5. Hierarchical statechart — "hierarchical statechart nested states compound Harel diagram"

## Video References

1. [State Machines in 100 Seconds — Fireship](https://www.youtube.com/watch?v=vBpGGagGz4I) — Fast, clear explanation of state machine concepts
2. [XState Tutorial — Jack Herrington](https://www.youtube.com/watch?v=73Ch_EL4YVc) — Practical state machine implementation in JavaScript
