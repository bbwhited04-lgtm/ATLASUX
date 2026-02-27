# Agent Scaling & Load Management

> Engineering guide to scaling the Atlas UX agent workforce under increasing load.
> Audience: Platform engineers, DevOps, and capacity planners.

---

## Overview

Atlas UX runs 30+ named agents through a single engine loop that ticks every 5 seconds. As tenant count grows, job volume increases, and agents take on more complex tasks, the system must scale without sacrificing reliability or violating SGL guardrails. This document covers scaling strategies, load management patterns, and capacity planning for the agent workforce.

---

## 1. Horizontal Scaling (More Agents of the Same Role)

Adding additional instances of an agent role to handle increased workload. Unlike traditional horizontal scaling (adding servers), agent horizontal scaling means creating specialized clones.

**When to scale horizontally:**
- A single publisher agent (e.g., Kelly for X/Twitter) cannot keep up with posting volume across all tenants
- Customer support volume exceeds Cheryl's capacity
- Research requests to Archy back up during peak planning seasons

**Implementation approach:**
```
kelly       → kelly-01, kelly-02, kelly-03
cheryl      → cheryl-01, cheryl-02, cheryl-03
archy       → archy-01, archy-02
```

**Each clone shares:**
- The same SKILL.md and POLICY.md
- The same tool permissions
- The same SGL constraints

**Each clone gets:**
- Its own job queue (partitioned by tenant or round-robin)
- Its own memory/context window
- Independent rate limits and token budgets

**Job distribution strategies:**
```
Round-robin:    Tenant A → kelly-01, Tenant B → kelly-02, Tenant C → kelly-03
Tenant-pinned:  All of Tenant A's work → kelly-01 (preserves context)
Least-loaded:   Next job → whichever kelly has the shortest queue
```

**Tenant-pinned is preferred** because it preserves context. An agent that consistently works with a tenant develops better understanding of that tenant's brand voice, preferences, and history.

---

## 2. Vertical Scaling (Enhanced Agent Capabilities)

Giving an individual agent more tools, a larger context window, or a more capable model.

**Scaling dimensions:**

| Dimension | Low | Medium | High |
|-----------|-----|--------|------|
| Model | deepseek-chat | gpt-4o | claude-opus-4-6 |
| Context window | 8K tokens | 32K tokens | 128K tokens |
| Tools | 5 basic tools | 15 standard tools | 30+ full toolkit |
| Memory | Last 10 interactions | Last 50 interactions | Full history via RAG |
| Token budget | 10K/day | 50K/day | 200K/day |

**When to scale vertically:**
- Agent accuracy drops because it lacks context (increase context window)
- Agent cannot complete complex tasks (upgrade model)
- Agent hits tool limitations (add more tools)
- Agent repeats mistakes it should have learned from (improve memory)

**Cost implications:** Vertical scaling is expensive. A single claude-opus-4-6 call costs significantly more than deepseek-chat. Use vertical scaling selectively for agents whose output quality directly impacts revenue or compliance.

**Recommended model tiers by agent role:**
```
Strategic (Atlas, Binky, Tina):     High-capability model
Legal/Compliance (Jenny, Larry):    High-capability model
Creative (Sunday, Venny):           Medium-capability model
Research (Archy, Daily-Intel):      Medium-capability model
Publishers (Kelly, Fran, etc.):     Low-capability model (template-driven)
Operational (Petra, Sandy, Frank):  Low-capability model
```

---

## 3. Load Balancing

Distributing work across agents to prevent any single agent from becoming overwhelmed.

**Round-robin load balancing:**
```typescript
function assignAgent(role: string, agents: Agent[]): Agent {
  const available = agents.filter(a => a.status === 'idle' || a.status === 'active');
  if (available.length === 0) throw new Error(`No available ${role} agents`);

  // Simple round-robin with index tracking
  const lastIndex = roundRobinState.get(role) || 0;
  const nextIndex = (lastIndex + 1) % available.length;
  roundRobinState.set(role, nextIndex);
  return available[nextIndex];
}
```

**Least-loaded balancing:**
```typescript
function assignAgent(role: string, agents: Agent[]): Agent {
  const available = agents.filter(a => a.status !== 'terminated' && a.status !== 'suspended');

  // Sort by current queue depth (ascending)
  available.sort((a, b) => a.pendingJobs - b.pendingJobs);
  return available[0];
}
```

**Capability-based balancing:**
For tasks that require specific skills, the load balancer filters by capability before balancing by load.
```typescript
function assignAgent(task: Task, agents: Agent[]): Agent {
  const capable = agents.filter(a =>
    task.requiredSkills.every(skill => a.skills.includes(skill))
  );
  if (capable.length === 0) throw new Error(`No agent has skills: ${task.requiredSkills}`);
  capable.sort((a, b) => a.pendingJobs - b.pendingJobs);
  return capable[0];
}
```

---

## 4. Backpressure Mechanisms

When the job queue grows faster than agents can process it, backpressure prevents system overload.

**Queue depth thresholds:**
```
Normal:   0–50 queued jobs     → Process normally
Warning:  51–200 queued jobs   → Reduce intake, prioritize P0/P1
Critical: 201–500 queued jobs  → Stop accepting P3 jobs, alert operators
Emergency: 500+ queued jobs    → Stop accepting P2/P3 jobs, only process P0/P1
```

**Backpressure responses:**

1. **Slow down intake:** Reduce the rate at which new jobs are created from workflow triggers
2. **Shed load:** Reject low-priority requests with a "system busy" response
3. **Batch jobs:** Combine multiple similar jobs into a single batch job (e.g., 10 social posts become 1 batch-post job)
4. **Defer non-critical work:** Push P3 jobs to a deferred queue processed during off-peak hours
5. **Scale out:** Trigger horizontal scaling of the bottleneck agent role

**Implementation in the engine loop:**
```typescript
const queueDepth = await prisma.job.count({ where: { status: 'queued' } });

if (queueDepth > 500) {
  // Emergency: only process critical jobs
  claimFilter.priority = { in: ['P0', 'P1'] };
  await notifyOperators('EMERGENCY_QUEUE_DEPTH', { depth: queueDepth });
} else if (queueDepth > 200) {
  // Critical: skip low priority
  claimFilter.priority = { in: ['P0', 'P1', 'P2'] };
} else if (queueDepth > 50) {
  // Warning: log but process all
  log.warn(`Queue depth elevated: ${queueDepth}`);
}
```

---

## 5. Circuit Breaker Pattern

Stop sending work to a failing agent. Prevent cascading failures.

**Three states:**

```
CLOSED (normal) ──[failures > threshold]──→ OPEN (tripped)
                                              │
                                      [timeout expires]
                                              │
                                              ▼
                                        HALF-OPEN (testing)
                                              │
                                    [success] │ [failure]
                                        ↙         ↘
                                   CLOSED         OPEN
```

**Configuration per agent:**
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;    // Consecutive failures before tripping (default: 5)
  resetTimeout: number;        // Seconds to wait before testing again (default: 60)
  halfOpenMaxAttempts: number; // Test attempts in half-open state (default: 3)
  monitorWindow: number;       // Seconds to track failure rate (default: 300)
}
```

**What happens when a circuit is OPEN:**
- New jobs for that agent are NOT created
- Instead, the system:
  1. Routes to a backup agent if available
  2. Queues with lower priority if deferrable
  3. Returns an error to the requester if immediate
  4. Logs the circuit trip to audit log
  5. Notifies Atlas and the agent's supervisor

**Recovery:** In HALF-OPEN state, the engine sends a single test job to the agent. If it succeeds, the circuit closes. If it fails, the circuit reopens with a longer timeout (exponential backoff: 60s → 120s → 240s → max 600s).

---

## 6. Bulkhead Pattern

Isolate agent failures so one agent's problems do not cascade to others.

**Isolation boundaries in Atlas UX:**

```
┌──────────────────────────────────────────────────┐
│                   Engine Loop                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Exec    │ │ Content │ │ Finance │            │
│  │ Bulkhead│ │ Bulkhead│ │ Bulkhead│  ...       │
│  │         │ │         │ │         │            │
│  │ Atlas   │ │ Sunday  │ │ Tina    │            │
│  │ Binky   │ │ Archy   │ │ Larry   │            │
│  │ Petra   │ │ Venny   │ │         │            │
│  │         │ │ Victor  │ │         │            │
│  │         │ │ Pub.s   │ │         │            │
│  └─────────┘ └─────────┘ └─────────┘            │
└──────────────────────────────────────────────────┘
```

**Each bulkhead gets:**
- A dedicated portion of the job processing capacity (e.g., content gets 40%, exec gets 30%, finance gets 20%, reserve 10%)
- Independent circuit breakers
- Separate token budget pools
- Isolated error counts

**Why it matters:** If all publisher agents crash due to a social media API outage, the content bulkhead trips but the executive and finance bulkheads continue operating normally. Tina can still process invoices. Atlas can still make decisions. Larry can still audit.

---

## 7. Rate Limiting Per Agent

Each agent has configurable rate limits to prevent runaway behavior and control costs.

**Rate limit dimensions:**
```typescript
interface AgentRateLimits {
  maxJobsPerMinute: number;      // Job processing throughput
  maxJobsPerHour: number;        // Sustained throughput
  maxJobsPerDay: number;         // Daily cap (MAX_ACTIONS_PER_DAY)
  maxTokensPerHour: number;      // LLM token budget
  maxApiCallsPerMinute: number;  // External API calls (social, email, etc.)
  maxDelegationsPerHour: number; // Prevent delegation storms
}
```

**Default rate limits by agent tier:**

| Tier | Jobs/min | Jobs/day | Tokens/hr | API calls/min |
|------|----------|----------|-----------|---------------|
| Executive (Atlas, Binky) | 20 | 500 | 100K | 30 |
| Department Head (Tina, Larry, Jenny) | 15 | 300 | 50K | 20 |
| Specialist (Sunday, Archy, Venny) | 10 | 200 | 30K | 15 |
| Publisher (Kelly, Fran, etc.) | 5 | 100 | 10K | 10 |

**Rate limit exceeded behavior:**
1. Job is not rejected — it remains in `queued` status
2. The engine skips the rate-limited agent on the next tick
3. The agent's queue drains naturally as the rate limit window slides
4. If the queue grows beyond the backpressure threshold, shedding rules apply

---

## 8. Resource Quotas

Hard limits on what each agent can consume. Unlike rate limits (which are about speed), quotas are about total consumption.

**Quota categories:**
```
Token budget:     Monthly LLM token allocation per agent
Storage quota:    KB documents and file storage per agent
API quota:        Monthly external API call allocation
Email quota:      Emails sent per day per agent
Cost quota:       Dollar amount per month per agent
```

**Quota enforcement:**
```typescript
async function checkQuota(agentId: string, resource: string, amount: number): Promise<boolean> {
  const usage = await getUsage(agentId, resource, 'current_period');
  const limit = await getQuotaLimit(agentId, resource);

  if (usage + amount > limit) {
    await auditLog({
      action: 'QUOTA_EXCEEDED',
      agent: agentId,
      resource,
      usage: usage + amount,
      limit
    });
    return false;
  }
  return true;
}
```

**Quota exhaustion behavior:**
- 80% consumed: Warning logged, agent notified
- 100% consumed: Agent suspended for that resource type (other resources still available)
- Emergency override: Atlas can temporarily grant additional quota (logged, requires justification)

---

## 9. Autoscaling Triggers

Automated rules for scaling agent capacity based on system metrics.

**Trigger conditions:**
```yaml
scale_up_triggers:
  - metric: queue_depth
    threshold: 100
    for: 5m                # Sustained for 5 minutes
    action: add_agent_clone
    max_clones: 5

  - metric: avg_response_time
    threshold: 30s          # Average job processing time
    for: 10m
    action: upgrade_model   # Vertical scaling

  - metric: error_rate
    threshold: 10%          # More than 10% of jobs failing
    for: 5m
    action: circuit_break_and_alert

scale_down_triggers:
  - metric: queue_depth
    threshold: 10
    for: 15m               # Sustained for 15 minutes
    action: remove_agent_clone
    min_clones: 1           # Never go below 1
```

**Cooldown periods:** After a scaling action, the system waits 10 minutes before evaluating triggers again. This prevents oscillation (rapid scale-up/scale-down cycles).

**Scaling decisions are logged:** Every autoscaling event is recorded in the audit log with the triggering metric, threshold, and action taken. Larry reviews autoscaling patterns weekly.

---

## 10. Graceful Degradation

When the system is under stress, which agents are critical and which can be temporarily suspended?

**Agent criticality tiers:**

| Tier | Agents | Degradation Behavior |
|------|--------|---------------------|
| Critical | Atlas, Tina, Larry | Never suspended; receive priority processing |
| High | Binky, Jenny, Cheryl | Suspended only in emergency; tasks deferred |
| Medium | Sunday, Archy, Petra, Daily-Intel | Can be suspended for hours; work queued |
| Low | Publishers, Venny, Victor | Can be suspended for days; social posting deferred |

**Degradation sequence:**
```
Normal → Stage 1 → Stage 2 → Stage 3 → Emergency

Stage 1: Suspend Low tier agents (save 30% capacity)
Stage 2: Suspend Medium tier agents (save additional 40% capacity)
Stage 3: Reduce High tier to essential functions only
Emergency: Only Critical tier agents operate
```

**Recovery sequence:** Reverse order. Low-tier agents come back last and process their queued backlog.

---

## 11. Capacity Planning

Estimating the agent workforce needed for a given tenant count and activity level.

**Key metrics for capacity planning:**

```
Jobs per tenant per day:          ~50 (average), ~200 (high-activity tenant)
Tokens per job (average):         2,000 input + 500 output = 2,500 total
Engine ticks per minute:          12 (5-second interval)
Jobs processed per tick:          5-10 (depending on complexity)
Jobs processed per hour:          3,600 - 7,200
```

**Capacity formula:**
```
Required capacity = (Total tenants × Jobs per tenant per day) / (Jobs per hour × Operating hours)

Example:
100 tenants × 50 jobs/day = 5,000 jobs/day
5,000 / (5,000 jobs/hr × 16 operating hours) = 0.0625 engine instances

With 3x safety margin: 0.19 engine instances → 1 engine instance is sufficient
```

**Scaling milestones:**
```
1-50 tenants:      1 engine instance, default agent configuration
50-200 tenants:    1 engine instance, horizontal scaling for publishers
200-500 tenants:   2 engine instances, dedicated content pipeline
500-1000 tenants:  4 engine instances, full horizontal scaling
1000+ tenants:     Tenant sharding, multiple engine clusters
```

**Token budget planning:**
```
Monthly token budget = Tenants × Jobs/day × 30 days × Avg tokens/job
100 tenants:  100 × 50 × 30 × 2,500 = 375M tokens/month
1000 tenants: 1000 × 50 × 30 × 2,500 = 3.75B tokens/month
```

---

## Monitoring Dashboard

Key metrics to display for scaling decisions:

```
Real-time:
  - Queue depth (total and per-agent)
  - Active/idle/suspended agent count
  - Jobs processed per minute
  - Error rate (last 5 minutes)
  - Token consumption rate

Hourly:
  - Average job processing time
  - P95 job processing time
  - Circuit breaker trips
  - Rate limit hits
  - Quota utilization percentage

Daily:
  - Total jobs processed
  - Total tokens consumed
  - Total external API calls
  - Failed job count and reasons
  - Autoscaling events
```
