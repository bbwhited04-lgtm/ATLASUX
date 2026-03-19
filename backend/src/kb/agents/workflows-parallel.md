# Parallel Workflows — Concurrent Execution and Fan-Out/Fan-In

## What Is a Parallel Workflow?

A parallel workflow executes multiple steps simultaneously rather than sequentially. When steps are independent — they don't depend on each other's output — running them in parallel reduces total execution time dramatically.

If Step A takes 3 seconds and Step B takes 2 seconds, sequential execution takes 5 seconds. Parallel execution takes 3 seconds (the slower step).

## Core Patterns

### Fan-Out (Split)
One trigger spawns multiple parallel branches:

```
                    ┌──► [Send SMS]
[Booking Created] ──┼──► [Send Email]
                    ├──► [Notify Slack]
                    └──► [Update Calendar]
```

All four notifications fire simultaneously. No reason to wait for SMS before sending email.

### Fan-In (Join)
Multiple parallel branches converge at a single point:

```
[Fetch Weather] ──┐
[Fetch Traffic] ──┼──► [Build Morning Brief]
[Fetch Calendar] ─┘
```

The morning brief can't be built until all three data sources return. The join waits for all branches.

### Fan-Out/Fan-In Combined
```
                    ┌──► [Score Lead A] ──┐
[Import Leads] ────┼──► [Score Lead B] ──┼──► [Rank All Leads] → [Assign to Sales]
                    └──► [Score Lead C] ──┘
```

## Implementation

```typescript
async function fanOutFanIn<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = 5,
): Promise<R[]> {
  const results: R[] = [];
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const p = processor(item).then(r => { results.push(r); });
    executing.add(p);
    p.finally(() => executing.delete(p));

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}
```

### With Error Tolerance

```typescript
async function parallelWithTolerance<T>(
  tasks: Array<{ name: string; fn: () => Promise<T> }>,
  options: { failFast?: boolean; minSuccess?: number } = {},
) {
  const results = await Promise.allSettled(tasks.map(t => t.fn()));

  const successes = results.filter(r => r.status === "fulfilled");
  const failures = results.filter(r => r.status === "rejected");

  if (options.failFast && failures.length > 0) {
    throw new Error(`${failures.length} parallel tasks failed`);
  }

  if (options.minSuccess && successes.length < options.minSuccess) {
    throw new Error(`Only ${successes.length}/${options.minSuccess} required tasks succeeded`);
  }

  return { successes, failures };
}
```

## Concurrency Controls

Never run unlimited parallel operations. Always cap concurrency:

- **Database queries** — Max 10 concurrent to avoid connection pool exhaustion
- **API calls** — Respect provider rate limits (OpenAI: 60 RPM, Twilio: 100 SMS/sec)
- **File operations** — Max 50 concurrent to avoid fd exhaustion
- **Image generation** — Max 5 concurrent to control costs

## When to Use Parallel Workflows

- **Independent notifications** — SMS + email + Slack can all fire simultaneously
- **Multi-source data fetching** — Weather + traffic + calendar for a morning brief
- **Batch processing** — Score 100 leads, process 50 images, send 200 reminders
- **Redundant queries** — Query multiple search providers and merge results (Atlas UX web search)

## Atlas UX Parallel Examples

**Web Search (lib/webSearch.ts):**
Atlas UX rotates across 5 search providers but can query multiple simultaneously for speed and redundancy.

**KB Context Building (getKbContext.ts):**
```typescript
// These could run in parallel (independent queries):
const governance = await prisma.kbDocument.findMany({ where: { ... } });
const agentDocs = await prisma.kbDocument.findMany({ where: { ... } });
const relevant = await queryTiered({ ... });
const wikiDocs = await searchWikiForAgents(query, wikiLimit);
```

**Subagent Dispatch:**
Claude Code's Agent tool can dispatch multiple background agents simultaneously for independent tasks — like writing 9 batches of KB articles in parallel.

## Join Strategies

| Strategy | Behavior | Use When |
|----------|----------|----------|
| **Wait All** | Wait for every branch to complete | All results needed (morning brief) |
| **Wait Any** | Continue when first branch completes | Racing for fastest response |
| **Wait N of M** | Continue when N branches complete | Redundancy (2 of 3 search providers) |
| **Wait Timeout** | Continue after timeout, use whatever completed | Best-effort with time constraint |

## Dangers of Parallel Execution

- **Race conditions** — Two branches modifying the same record
- **Resource exhaustion** — 1,000 parallel API calls overwhelm the service
- **Partial failures** — 3 of 5 branches succeed — what do you do with the result?
- **Cost multiplication** — Parallel image generation at $0.04 each adds up fast
- **Debugging difficulty** — Non-deterministic execution order makes reproduction hard

## Resources

- [Workflow Patterns — Parallel Split](http://www.workflowpatterns.com/patterns/control/basic/wcp2.php) — Academic definition of the parallel split pattern
- [Promise.allSettled — MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) — JavaScript's built-in parallel execution with error tolerance

## Image References

1. Fan-out fan-in diagram — "fan out fan in parallel workflow split join merge diagram"
2. Concurrent task execution — "concurrent parallel task execution timeline Gantt chart diagram"
3. Race condition diagram — "race condition parallel execution shared resource conflict diagram"
4. Concurrency pool pattern — "concurrency pool semaphore bounded parallel execution diagram"
5. Promise.allSettled results — "Promise allSettled fulfilled rejected results JavaScript diagram"

## Video References

1. [Concurrency Patterns — Go Conference](https://www.youtube.com/watch?v=f6kdp27TYZs) — Fan-out/fan-in patterns applicable to any language
2. [Parallel Workflows in n8n — n8n](https://www.youtube.com/watch?v=WKb6E0uJ1rE) — Visual parallel workflow building in a no-code platform
