# Case Workflows — Flexible, Human-Guided Processes

## What Is a Case Workflow?

A case workflow (also called adaptive or unstructured workflow) has no predetermined sequence. Instead, a knowledge worker decides which steps to take, in what order, based on the specific situation. The workflow provides available actions, but the human (or AI agent) chooses the path.

Case workflows model reality — most real work doesn't follow a rigid script. A customer support case might need a refund, then a replacement, then a follow-up call, or just a quick FAQ answer. The agent decides based on context.

## How Case Workflows Differ

| Aspect | Sequential | State Machine | Case Workflow |
|--------|-----------|---------------|---------------|
| Step order | Fixed | Event-driven | Discretionary |
| Who decides next? | The workflow | The event/rule | The worker/agent |
| Predictability | High | Medium | Low |
| Flexibility | Low | Medium | High |
| Auditability | Simple | Moderate | Requires effort |
| Best for | Routine processes | Lifecycle management | Knowledge work |

## Structure

A case workflow defines:

1. **Available Actions** — The set of things that *can* be done (not must be done)
2. **Case Data** — The accumulated context about this specific case
3. **Milestones** — Key checkpoints that indicate progress (optional)
4. **Completion Criteria** — How to know when the case is resolved

```typescript
type CaseWorkflow = {
  caseId: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  data: Record<string, unknown>;

  availableActions: CaseAction[];
  completedActions: Array<{ action: string; timestamp: Date; result: unknown }>;
  milestones: Array<{ name: string; reached: boolean; reachedAt?: Date }>;

  assignedTo: string;
  createdAt: Date;
  resolvedAt?: Date;
};

type CaseAction = {
  name: string;
  description: string;
  available: (caseData: Record<string, unknown>) => boolean;
  execute: (caseData: Record<string, unknown>) => Promise<unknown>;
};
```

## Real-World Examples

### Customer Support Case
Available actions (worker picks based on situation):
- Look up customer history
- Check order status
- Issue refund
- Create replacement order
- Send apology email
- Escalate to manager
- Add internal note
- Schedule callback
- Close case

No fixed order. A simple "where's my package?" needs order lookup + status check. A complex complaint might need all actions in various orders.

### Investigation Case
Available actions:
- Interview witness
- Review evidence
- Request documents
- Consult expert
- Write findings
- Schedule hearing
- Close case with verdict

The investigator decides what to do based on what they discover.

### Creative Project
Available actions:
- Research topic
- Create outline
- Write draft
- Get feedback
- Revise
- Design visuals
- Submit for approval
- Publish

The creator may research, draft, realize they need more research, revise, get feedback, revise again. Non-linear by nature.

## AI Agent as Case Worker

AI agents are natural case workers. Given a set of available tools and a goal, they choose which tools to call, in what order, based on the conversation context:

```
User: "I need to cancel my appointment and reschedule for next week"

Agent reasoning (case workflow):
1. [Look up customer] → Found: Jane Doe, apt-123 on March 20
2. [Cancel appointment] → Cancelled apt-123
3. [Check availability] → Next week: Mon 9AM, Tue 2PM, Wed 10AM
4. [Present options to user] → "I have Monday 9 AM, Tuesday 2 PM..."
5. [User chooses Tuesday]
6. [Book appointment] → Created apt-456 on March 25 at 2 PM
7. [Send confirmation] → SMS sent
```

The agent didn't follow a script — it reasoned about what actions to take based on the user's specific request.

## Guardrails for Case Workflows

Flexibility doesn't mean no rules. Guardrails keep case workflows safe:

- **Required milestones** — Some checkpoints must be reached before closing (e.g., "customer confirmed resolution")
- **Prohibited combinations** — Can't issue refund AND send replacement without manager approval
- **Time limits** — Cases open > 48 hours auto-escalate
- **Audit requirements** — Every action logged regardless of order
- **Spending caps** — Cumulative case spend tracked against limits

Atlas UX implements these through decision memos and the daily action cap.

## Advantages

- **Handles complexity** — Real-world problems rarely follow scripts
- **Empowers workers** — Knowledge workers use judgment, not just follow instructions
- **Adaptable** — New action types can be added without restructuring the workflow
- **Natural for AI** — LLM agents inherently work as case workers

## Limitations

- **Hard to optimize** — No fixed path means no obvious bottleneck to fix
- **Hard to estimate** — Can't predict completion time
- **Audit complexity** — Non-linear trails are harder to review
- **Quality variance** — Outcome depends on worker/agent judgment

## Resources

- [Adaptive Case Management (ACM)](https://www.omg.org/cmmn/) — OMG's Case Management Model and Notation standard
- [Knowledge-Intensive Processes — BPM Research](https://link.springer.com/chapter/10.1007/978-3-642-36285-9_1) — Academic framework for understanding unstructured workflow processes

## Image References

1. Case workflow available actions — "case management available actions discretionary workflow diagram"
2. Structured vs unstructured workflow comparison — "structured vs unstructured workflow comparison rigid flexible diagram"
3. Case management dashboard — "case management dashboard kanban progress milestones tracking"
4. AI agent as case worker — "AI agent reasoning tool selection case workflow decision diagram"
5. Case lifecycle with milestones — "case lifecycle milestones open progress resolution closed diagram"

## Video References

1. [Adaptive Case Management Explained — Appian](https://www.youtube.com/watch?v=5b9XQLR4EWk) — How adaptive case management handles unpredictable work
2. [AI Agents as Knowledge Workers — Andrew Ng](https://www.youtube.com/watch?v=sal78ACtGTc) — How AI agents operate as flexible case workers with tool access
