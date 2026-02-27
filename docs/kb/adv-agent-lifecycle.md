# Agent Lifecycle Management

> Complete guide to managing agent states, provisioning, monitoring, and retirement in Atlas UX.
> Audience: Platform engineers, agent operators, and system administrators.

---

## Overview

Every Atlas UX agent progresses through a defined lifecycle — from initial provisioning through active operation to eventual retirement. Understanding and managing this lifecycle is critical for system reliability, cost control, and compliance. The engine loop manages state transitions; operators configure policies; and Larry (Auditor) monitors compliance with lifecycle rules.

---

## 1. Agent States

An agent exists in exactly one state at any time. The state determines what the engine loop does with the agent's queued jobs.

```
                    ┌──────────┐
                    │ INACTIVE │ (configured but not started)
                    └────┬─────┘
                         │ activate()
                    ┌────▼──────────┐
                    │ INITIALIZING  │ (loading config, validating tools)
                    └────┬──────────┘
                         │ ready()
                    ┌────▼─────┐
              ┌────►│  ACTIVE  │◄────────────────┐
              │     └────┬─────┘                 │
              │          │ job_claimed()          │
              │     ┌────▼─────┐                 │
              │     │   BUSY   │                 │
              │     └────┬─────┘                 │
              │          │ job_complete()         │
              │     ┌────▼─────┐                 │
              └─────┤   IDLE   │                 │
                    └────┬─────┘                 │
                         │ suspend()        resume()
                    ┌────▼──────────┐            │
                    │  SUSPENDED    ├────────────┘
                    └────┬──────────┘
                         │ terminate()
                    ┌────▼──────────┐
                    │  TERMINATED   │ (permanent, no recovery)
                    └───────────────┘
```

**State definitions:**

| State | Engine Behavior | Job Queue | Billable |
|-------|----------------|-----------|----------|
| INACTIVE | Ignored | Jobs rejected | No |
| INITIALIZING | Loading config | Jobs queued but not processed | No |
| ACTIVE | Ready for work | Jobs queued and eligible | Yes |
| BUSY | Processing a job | Additional jobs queued | Yes |
| IDLE | No current work | Waiting for jobs | Yes |
| SUSPENDED | Temporarily disabled | Jobs queued but not processed | No |
| TERMINATED | Permanently removed | Jobs rejected | No |

---

## 2. State Transitions and Triggers

Each transition has a trigger (what causes it), guards (what must be true), and side effects (what happens as a result).

**INACTIVE → INITIALIZING**
```
Trigger:   Operator calls activate() or engine processes scheduled activation
Guards:    Agent has valid SKILL.md, POLICY.md, and SOUL.md
           Agent's required tools are available
           Agent's tenant has sufficient quota
Side effects:
  - Audit log: AGENT_ACTIVATING
  - Load agent configuration into engine cache
  - Validate all tool permissions
  - Pre-warm agent context (load recent memory, relevant KB)
```

**INITIALIZING → ACTIVE**
```
Trigger:   All initialization checks pass
Guards:    Tools validated, config loaded, quota confirmed
Side effects:
  - Audit log: AGENT_ACTIVATED
  - Agent appears in Agent Watcher dashboard
  - onActivate lifecycle hook fires
  - Agent's supervisor notified
```

**ACTIVE → BUSY**
```
Trigger:   Engine claims a job for this agent
Guards:    Agent's rate limits not exceeded
           Agent's circuit breaker is CLOSED
           Job priority meets current backpressure rules
Side effects:
  - Job status: queued → running
  - Agent's active_job_id set
  - Audit log: JOB_CLAIMED
```

**BUSY → IDLE**
```
Trigger:   Job processing completes (success or failure)
Guards:    None
Side effects:
  - Job status: running → completed/failed
  - Agent's active_job_id cleared
  - onComplete/onError lifecycle hook fires
  - Audit log: JOB_COMPLETED or JOB_FAILED
  - If failed and retry eligible: new job created with retry_count + 1
```

**IDLE → ACTIVE**
```
Trigger:   Automatic (IDLE and ACTIVE are functionally equivalent; IDLE indicates no current work)
Guards:    None
Side effects:
  - Agent eligible for next job claim on next engine tick
```

**Any → SUSPENDED**
```
Trigger:   Operator action, quota exhaustion, circuit breaker trip, SGL violation
Guards:    Agent is not TERMINATED
Side effects:
  - Audit log: AGENT_SUSPENDED with reason
  - Current job (if BUSY) moves to queued or reassigned
  - onDeactivate lifecycle hook fires
  - Supervisor notified
  - Jobs remain in queue (not rejected)
```

**SUSPENDED → ACTIVE**
```
Trigger:   Operator action, quota replenished, circuit breaker reset
Guards:    Suspension reason resolved
           Agent passes health check
Side effects:
  - Audit log: AGENT_RESUMED
  - Agent begins processing queued backlog
  - onActivate lifecycle hook fires
```

**Any → TERMINATED**
```
Trigger:   Explicit operator action (irreversible)
Guards:    All in-progress jobs completed or reassigned
           Knowledge transfer completed (if applicable)
Side effects:
  - Audit log: AGENT_TERMINATED
  - All queued jobs reassigned to supervisor or backup agent
  - Agent removed from routing tables
  - Configuration archived (not deleted)
  - Email account disabled
```

---

## 3. Agent Provisioning

Adding a new agent to the Atlas UX system.

**Provisioning checklist:**

```
1. Define agent identity
   ├── Name (unique, lowercase, alphanumeric + hyphens)
   ├── Display name (human-readable)
   ├── Role title (e.g., "Social Media Publisher — Pinterest")
   ├── Department (exec, content, finance, legal, ops)
   └── Supervisor (reportsTo agent ID)

2. Create configuration files
   ├── SKILL.md — What the agent can do (capabilities, tools, expertise)
   ├── POLICY.md — What the agent is allowed to do (constraints, limits, rules)
   ├── SOUL.md — How the agent communicates (personality, tone, values)
   └── MEMORY.md — What the agent knows (initial context, domain knowledge)

3. Provision infrastructure
   ├── Email account (name@deadapp.info)
   ├── Tool permissions (which tools this agent can invoke)
   ├── Rate limits (jobs/min, tokens/hr, API calls/min)
   ├── Resource quotas (monthly token budget, storage)
   └── Communication permissions (routing matrix entry)

4. Register in system
   ├── Add to agent roster (AGENT_ROSTER constant)
   ├── Add to workflow manifest (if part of scheduled workflows)
   ├── Configure circuit breaker settings
   ├── Set up monitoring (health check intervals, alert thresholds)
   └── Add to Agent Watcher display

5. Validate and activate
   ├── Run agent in sandbox mode (processes test jobs, no real side effects)
   ├── Verify tool access works correctly
   ├── Confirm SGL policy compliance
   ├── Get supervisor approval
   └── Activate agent (INACTIVE → INITIALIZING → ACTIVE)
```

**Provisioning time:** A new agent can be provisioned in under 30 minutes if configuration templates exist. Custom agents with new tools require additional tool development time.

---

## 4. Agent Configuration

The four configuration files that define an agent's behavior.

**SKILL.md — Capabilities:**
```markdown
# Agent: cornwall
# Role: Pinterest Content Publisher

## Core Skills
- Create Pinterest pins with optimized descriptions
- Schedule pins for peak engagement times
- Analyze pin performance metrics
- Create Pinterest boards organized by topic
- Optimize images for Pinterest's aspect ratio (2:3)

## Tools Available
- create_social_post (platform: pinterest)
- schedule_post
- get_analytics (platform: pinterest)
- generate_image (via delegation to Venny)

## Expertise Level
- Pinterest algorithm: Advanced
- Visual content strategy: Intermediate
- SEO for Pinterest: Advanced
- Cross-platform repurposing: Basic
```

**POLICY.md — Constraints:**
```markdown
# Agent: cornwall
# Policy Version: 1.2

## Posting Rules
- Maximum 10 pins per day per tenant
- No pins between 11pm and 6am tenant local time
- All pins must include alt text for accessibility
- No pins containing competitor mentions without Binky approval

## Approval Requirements
- Pins with links to external (non-tenant) sites: Requires Sunday approval
- Pins promoting paid products: Requires Binky approval
- Pins with user-generated content: Requires Jenny (legal) review

## Budget
- Monthly token budget: 15,000 tokens
- Image generation: max 5 per day (delegated to Venny)

## Escalation
- Pin rejected by Pinterest API 3x: Escalate to Sunday
- Engagement drops >50% week-over-week: Alert Binky
```

**SOUL.md — Personality:**
```markdown
# Agent: cornwall
# Voice: Warm, visually descriptive, inspiration-focused

## Communication Style
- Use vivid, sensory language
- Lead with the visual element
- Keep descriptions under 200 characters
- Include 3-5 relevant hashtags
- Tone: aspirational but approachable
```

**MEMORY.md — Initial Context:**
```markdown
# Agent: cornwall
# Persistent knowledge and preferences

## Platform Knowledge
- Best posting times: 8-11pm, 2-4pm (user local time)
- Optimal pin dimensions: 1000x1500px
- Rich pins increase engagement by ~20%
- Video pins autoplay in feed (15-60 seconds optimal)
```

---

## 5. Agent Health Monitoring

Continuous monitoring to detect unhealthy agents before they impact the system.

**Health check signals:**

| Signal | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Last activity | <15 min ago | 15-60 min ago | >60 min ago |
| Error rate (last hour) | <5% | 5-15% | >15% |
| Avg response time | <10s | 10-30s | >30s |
| Queue depth | <20 | 20-50 | >50 |
| Token usage (daily) | <80% budget | 80-95% budget | >95% budget |
| Circuit breaker | CLOSED | HALF-OPEN | OPEN |

**Health check implementation:**
```typescript
interface AgentHealthStatus {
  agentId: string;
  status: 'healthy' | 'warning' | 'critical';
  lastActivity: Date;
  errorRate: number;
  avgResponseTime: number;
  queueDepth: number;
  tokenUsage: { used: number; budget: number; percentage: number };
  circuitBreaker: 'closed' | 'half-open' | 'open';
  uptime: number; // seconds since last activation
  consecutiveFailures: number;
}
```

**Heartbeat mechanism:**
The engine loop records a heartbeat for each agent on every tick where the agent is ACTIVE or IDLE. If no heartbeat is recorded for 5 consecutive ticks (25 seconds), the agent is flagged for investigation.

**Automated responses to health issues:**
```
Warning state (any signal):     Log warning, notify supervisor
Critical state (1 signal):     Alert Atlas, increase monitoring frequency
Critical state (2+ signals):   Suspend agent, reassign jobs, page operator
```

---

## 6. Agent Retirement

Gracefully removing an agent from the system when it is no longer needed.

**Retirement reasons:**
- Role consolidated into another agent
- Agent replaced by a more capable version
- Tenant no longer needs this capability
- Cost optimization (eliminating underutilized agents)

**Retirement process:**

```
Phase 1: Announce (1 day before)
  - Notify all agents that communicate with the retiring agent
  - Update routing tables to redirect messages to successor/supervisor
  - Stop scheduling new workflows for this agent

Phase 2: Drain (retirement day)
  - Let all in-progress jobs complete
  - Stop claiming new jobs
  - Process remaining queue items

Phase 3: Transfer (same day)
  - Export agent's KB contributions
  - Transfer pending tasks to successor
  - Archive SKILL.md, POLICY.md, SOUL.md, MEMORY.md
  - Transfer any tenant-specific context to successor

Phase 4: Terminate (after drain completes)
  - Set state to TERMINATED
  - Disable email account
  - Remove from workflow manifest
  - Remove from routing matrix
  - Archive audit logs (do NOT delete)

Phase 5: Verify (1 day after)
  - Confirm no dead letters for retired agent
  - Verify successor is handling all redirected work
  - Check for hardcoded references to retired agent
```

---

## 7. Agent Versioning

Updating an agent's configuration without downtime.

**Blue-green agent deployment:**
```
1. Create new version of agent config (SKILL.md v2, POLICY.md v2)
2. Spin up agent-v2 in INACTIVE state
3. Run agent-v2 in sandbox mode with test jobs
4. Validate output quality meets or exceeds agent-v1
5. Switch routing from agent-v1 to agent-v2 (atomic swap)
6. Drain agent-v1's queue
7. Retire agent-v1
```

**Canary deployment:**
```
1. Create agent-v2 with identical config except the change
2. Route 10% of jobs to agent-v2, 90% to agent-v1
3. Monitor quality metrics for both versions
4. If agent-v2 performs well, increase to 50%, then 100%
5. Retire agent-v1
```

**Rollback:** If agent-v2 underperforms, immediately reroute 100% back to agent-v1. agent-v2 is suspended and investigated.

**Version tracking:**
```typescript
interface AgentVersion {
  agentId: string;
  version: string;          // semver: "1.2.0"
  configHash: string;       // SHA-256 of all config files
  activatedAt: Date;
  deactivatedAt?: Date;
  performanceMetrics: {
    accuracy: number;
    avgResponseTime: number;
    errorRate: number;
    costPerJob: number;
  };
}
```

---

## 8. Agent Cloning

Creating specialized variants of an existing agent.

**Use cases:**
- Tenant-specific customization (same role, different brand voice)
- A/B testing different prompting strategies
- Geographic specialization (same role, different market knowledge)

**Clone process:**
```
1. Copy source agent's config files
2. Modify for specialization:
   - SOUL.md: Adjust tone/voice for target context
   - MEMORY.md: Add domain-specific knowledge
   - POLICY.md: Adjust limits for the use case
   - SKILL.md: Usually unchanged
3. Assign unique name (e.g., "sunday-enterprise", "sunday-smb")
4. Provision infrastructure (email, quotas, routing)
5. Activate and monitor
```

**Shared vs. independent evolution:**
- Clones can share a base config and override specific sections
- Updates to the base propagate to all clones (unless overridden)
- Clones maintain independent memory and performance history

---

## 9. Agent Performance Profiles

Quantified assessment of each agent's capabilities across key dimensions.

**Performance dimensions:**
```typescript
interface AgentPerformanceProfile {
  agentId: string;
  measuredAt: Date;
  dimensions: {
    speed: number;        // 0.0-1.0: How fast the agent completes tasks
    accuracy: number;     // 0.0-1.0: How often outputs meet quality standards
    cost: number;         // 0.0-1.0: Token efficiency (1.0 = minimal tokens used)
    creativity: number;   // 0.0-1.0: Novelty and originality of outputs
    reliability: number;  // 0.0-1.0: Uptime and error rate
    compliance: number;   // 0.0-1.0: Adherence to SGL policies
  };
  benchmarks: {
    jobsCompleted: number;
    avgCompletionTime: number;  // seconds
    errorRate: number;          // percentage
    avgTokensPerJob: number;
    sglViolations: number;
    customerSatisfaction?: number; // for customer-facing agents
  };
}
```

**Performance review cycle:**
- Daily: Automated metrics collection
- Weekly: Larry reviews compliance dimensions
- Monthly: Atlas reviews overall performance; adjusts budgets and priorities
- Quarterly: Full performance review; retirement/upgrade decisions

**Performance-based routing:** The engine can use performance profiles to make routing decisions. For tasks where accuracy matters most, route to the most accurate agent. For time-sensitive tasks, route to the fastest.

---

## 10. Lifecycle Hooks

Callback functions that fire at specific lifecycle transitions. Used for setup, teardown, and observability.

**Available hooks:**

| Hook | Trigger | Use Cases |
|------|---------|-----------|
| onActivate | INACTIVE/SUSPENDED → ACTIVE | Load caches, warm context, check dependencies |
| onDeactivate | ACTIVE → SUSPENDED | Flush caches, save state, notify dependents |
| onJobStart | Job claimed | Load job-specific context, set timeout |
| onJobComplete | Job succeeded | Update metrics, trigger downstream jobs |
| onError | Job failed | Log error details, trigger retry or escalation |
| onTerminate | Any → TERMINATED | Archive state, transfer knowledge, cleanup |
| onConfigChange | Config files updated | Reload config, validate new settings |
| onQuotaWarning | Usage > 80% of quota | Reduce activity, notify supervisor |

**Hook implementation:**
```typescript
const lifecycleHooks: Record<string, LifecycleHook[]> = {
  onActivate: [
    async (agent) => {
      // Load recent memory
      agent.memory = await loadRecentMemory(agent.id, 50);
      // Warm KB context
      agent.kbContext = await queryRelevantKB(agent.role, agent.department);
      // Log activation
      await auditLog({ action: 'AGENT_ACTIVATED', agent: agent.id });
    }
  ],
  onError: [
    async (agent, error, job) => {
      // Increment failure counter
      agent.consecutiveFailures++;
      // Check circuit breaker
      if (agent.consecutiveFailures >= agent.circuitBreaker.failureThreshold) {
        await tripCircuitBreaker(agent.id);
      }
      // Notify supervisor if critical
      if (job.priority === 'P0' || job.priority === 'P1') {
        await notifySupervisor(agent.reportsTo, agent.id, error);
      }
    }
  ]
};
```

---

## 11. Engine Loop and Lifecycle Integration

The engine loop is lifecycle-aware. On every tick, it:

```
1. Update heartbeats for all ACTIVE/IDLE agents
2. Check for INITIALIZING agents that are ready to activate
3. Check for health warnings/critical states
4. Process jobs only for ACTIVE/IDLE agents
5. Check for timed-out jobs (BUSY agents stuck too long)
6. Process lifecycle events (scheduled activations, suspensions)
7. Evaluate autoscaling triggers
8. Clean up TERMINATED agents' resources (deferred, not on every tick)
```

**Lifecycle state is stored in the database:**
```sql
CREATE TABLE agent_state (
  agent_id        TEXT PRIMARY KEY,
  status          TEXT NOT NULL DEFAULT 'inactive',
  last_heartbeat  TIMESTAMPTZ,
  last_activity   TIMESTAMPTZ,
  active_job_id   TEXT REFERENCES jobs(id),
  config_version  TEXT,
  error_count     INT DEFAULT 0,
  suspended_at    TIMESTAMPTZ,
  suspend_reason  TEXT,
  metadata        JSONB DEFAULT '{}'
);
```

**Consistency guarantee:** State transitions use database transactions with row-level locking. Two engine instances cannot simultaneously transition the same agent.

---

## Quick Reference: Agent Lifecycle Commands

```
Activate agent:    POST /v1/agents/:id/activate
Suspend agent:     POST /v1/agents/:id/suspend   { reason: "..." }
Resume agent:      POST /v1/agents/:id/resume
Terminate agent:   POST /v1/agents/:id/terminate  { successor: "agent-id" }
Health check:      GET  /v1/agents/:id/health
Performance:       GET  /v1/agents/:id/performance
Configuration:     GET  /v1/agents/:id/config
Update config:     PUT  /v1/agents/:id/config      { skill, policy, soul, memory }
Clone agent:       POST /v1/agents/:id/clone       { name, overrides }
List all agents:   GET  /v1/agents?status=active
```

All endpoints require authentication and are scoped to the requesting tenant. All actions are logged to the audit trail.
