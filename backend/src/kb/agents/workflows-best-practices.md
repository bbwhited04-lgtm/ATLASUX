# Best Practices for Creating Workflows — Map, Simplify, Assign, Test, Iterate

## Before You Automate Anything

The biggest mistake in workflow automation: automating a broken process. If your manual process has redundant steps, unclear handoffs, and bottlenecks, automating it just makes the mess faster. Fix the process first, then automate.

## Practice 1: Map the Current Process

Before building anything, document how work actually flows today — not how it's supposed to flow.

**How to map:**
1. Walk through the process end-to-end with the people who actually do the work
2. Document every step, including the unofficial ones ("I email Sarah because the system doesn't notify her")
3. Note time per step, who does it, and what tools they use
4. Mark decision points: "If the customer is premium, skip this step"
5. Identify inputs and outputs at each step

**Tools for mapping:**
- Whiteboard (physical or Miro/FigJam)
- Swimlane diagrams (who does what)
- Process mining software (automatic discovery from event logs)

**Template:**
```
Step | Who | Action | Tool | Time | Input | Output
1    | Lucy | Receive call | ElevenLabs | 30s | Incoming call | Transcript
2    | Lucy | Classify intent | AI engine | 2s | Transcript | Intent + entities
3    | Lucy | Check availability | Calendar API | 1s | Date + service | Available slots
4    | Lucy | Book appointment | Database | 1s | Slot + customer | Confirmation
5    | Lucy | Send SMS | Twilio | 2s | Phone + details | Confirmation sent
```

## Practice 2: Identify Bottlenecks

Look for the slowest, most error-prone, or most manual steps:

**Time bottlenecks:** Which step takes the longest? Is it waiting for a human? Waiting for an API? Processing a large dataset?

**Error bottlenecks:** Which step fails most often? Data entry errors? API timeouts? Missing information?

**Handoff bottlenecks:** Where does work get stuck between people? "I finished my part, but Bob hasn't picked it up in 3 days."

**Volume bottlenecks:** Which step can't handle increased load? Everything's fine at 10 orders/day but breaks at 100.

**Common bottleneck patterns:**
| Pattern | Symptom | Fix |
|---------|---------|-----|
| Human waiting | Step blocked for hours/days | Add auto-escalation, SLA alerts |
| Sequential dependency | Step B waits for Step A when they're actually independent | Parallelize |
| Manual data entry | Errors, slowness, tedium | Auto-populate from source |
| Approval queue | Manager is the bottleneck for everything | Delegation rules, auto-approve low-risk |
| Missing information | Workflow stops, back-and-forth | Collect all info upfront (better forms) |

## Practice 3: Keep It Simple

**The 80/20 rule:** 80% of the value comes from automating the core happy path. Don't try to handle every edge case on day one.

**Start with:**
- The most common path (the one that happens 80% of the time)
- Hard stops on errors (fail loudly, don't try to auto-recover everything)
- Human fallback for exceptions ("Route to human if confidence < 0.7")

**Avoid:**
- Automating rare edge cases (handle them manually until volume justifies automation)
- Over-engineering error handling (log it, alert someone, move on)
- Adding features "while we're at it" (scope creep kills workflow projects)
- Complex branching when a simple sequential flow works
- Building for hypothetical future requirements

**Rule of thumb:** If your workflow diagram doesn't fit on one screen, it's too complex. Split it into sub-workflows.

## Practice 4: Set Clear Roles

Every step needs exactly one owner. Ambiguity kills workflows.

**RACI Matrix:**
| Step | Responsible (does it) | Accountable (decides) | Consulted | Informed |
|------|----------------------|----------------------|-----------|----------|
| Create ticket | System (auto) | — | — | User, Assignee |
| Triage | AI classifier | IT Manager | — | — |
| Investigate | Assigned tech | IT Manager | User | — |
| Approve fix | IT Manager | — | Tech | User |
| Deploy fix | Assigned tech | IT Manager | — | User, Team |

**Common role mistakes:**
- **No owner** — "Someone should check this" → nobody checks it
- **Multiple owners** — "Sales and Marketing both approve" → they block each other
- **Wrong owner** — CEO approving $20 expense reports → bottleneck
- **Missing escalation** — No defined path when the owner is unavailable

## Practice 5: Test and Iterate

Workflows are never done on the first try. Build, test, observe, improve.

**Testing Strategy:**
1. **Unit test** — Test each step independently with known inputs
2. **Integration test** — Run the full workflow with test data
3. **Load test** — Run at 10x expected volume to find breaking points
4. **Edge case test** — What happens with empty inputs? Invalid data? Timeouts?
5. **User acceptance test** — Have the actual users try it and give feedback

**Iteration Cycle:**
```
Build v1 → Deploy → Observe (1-2 weeks) → Gather metrics → Identify issues → Build v2
```

**What to watch:**
- Execution time per step (any step suddenly slower?)
- Error rates (any step failing more than expected?)
- User feedback (any step confusing or unhelpful?)
- Completion rate (what % of workflows complete successfully?)
- Volume patterns (peak times, unusual spikes)

**When to iterate:**
- Step consistently takes > 2x expected time
- Error rate > 5% for any step
- Users complain about the same thing twice
- Business rules change (new pricing, new policy, new team structure)
- Volume grows beyond current design capacity

## The Meta-Workflow for Building Workflows

```
1. Map current process (with real users, not assumptions)
2. Identify top 3 bottlenecks
3. Design simplified workflow (happy path only)
4. Build v1
5. Test with real data
6. Deploy to subset of users
7. Observe for 1-2 weeks
8. Gather feedback + metrics
9. Fix top issues
10. Roll out to all users
11. Schedule quarterly review
```

## Resources

- [Lean Six Sigma — Process Mapping](https://www.isixsigma.com/methodology/process-mapping/) — Industry-standard methodology for mapping and improving processes
- [Atlassian — Workflow Best Practices](https://www.atlassian.com/work-management/project-management/workflow) — Practical guide to designing effective workflows

## Image References

1. Process mapping swimlane diagram — "process mapping swimlane diagram roles responsibilities handoffs"
2. Bottleneck identification heatmap — "workflow bottleneck identification heatmap time delay analysis"
3. RACI matrix template — "RACI matrix responsible accountable consulted informed template"
4. Iteration cycle diagram — "build measure learn iteration cycle workflow improvement diagram"
5. Workflow complexity comparison — "simple vs complex workflow comparison diagram readability maintainability"

## Video References

1. [Process Mapping in 10 Minutes — Lean Six Sigma](https://www.youtube.com/watch?v=J5p3rYjVFoo) — Quick guide to mapping business processes before automation
2. [Workflow Design Best Practices — Monday.com](https://www.youtube.com/watch?v=bvFfHJCXfp4) — Practical workflow design principles with real examples
