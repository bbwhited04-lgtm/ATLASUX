# Debug It — Systematic Debugging Prompts

Prompt templates for systematic debugging and root cause analysis. From stack trace triage to memory leak hunts, these prompts turn vague "it's broken" reports into actionable diagnosis.

---

## Debugging Prompts

### Prompt: Error Trace Analysis
**Use when:** You have a stack trace or error message and need to understand what went wrong
**Complexity:** Simple

```
Analyze this error trace and identify the root cause:

Error:
{{ERROR_MESSAGE}}

Stack trace:
{{STACK_TRACE}}

Application context:
- Framework: {{FRAMEWORK}}
- Runtime: {{RUNTIME}}
- Last successful operation: {{LAST_SUCCESS}}

Provide:
1. What the error means in plain English
2. The originating line/file (not the framework internals)
3. The most likely cause (top 3 ranked by probability)
4. A fix for each cause with code example
5. How to prevent this class of error going forward
```

**Expected output:** Ranked list of probable causes with targeted fixes.

---

### Prompt: 5 Whys Root Cause Investigation
**Use when:** A bug keeps recurring or the surface-level fix didn't hold
**Complexity:** Medium

```
Perform a "5 Whys" root cause analysis on this issue:

Symptom: {{SYMPTOM}}
When it occurs: {{TRIGGER_CONDITIONS}}
Frequency: {{FREQUENCY}}
Impact: {{IMPACT}}
Environment: {{ENVIRONMENT}}

For each "why" level:
1. State the question
2. State the answer based on available evidence
3. Identify what evidence you'd need to verify the answer
4. Continue to the next level

After 5 levels, provide:
- The root cause statement
- Corrective action (fix the root cause)
- Preventive action (ensure it can't recur)
- Detection improvement (catch it earlier next time)
```

**Expected output:** Structured 5 Whys chain leading to root cause with corrective/preventive actions.

---

### Prompt: Memory Leak Detection
**Use when:** Node.js process memory grows over time or OOM crashes occur
**Complexity:** Complex

```
Help me investigate a memory leak in a {{RUNTIME}} application.

Symptoms:
- Memory usage pattern: {{MEMORY_PATTERN}}
- Time to OOM: {{TIME_TO_OOM}}
- Process manager: {{PROCESS_MANAGER}}
- Application type: {{APP_TYPE}}

Provide a debugging plan:
1. Instrumentation code to add heap snapshots at intervals
2. Commands to capture heap dumps (--inspect, v8.writeHeapSnapshot)
3. How to compare two heap snapshots to find growing objects
4. Common leak patterns in {{FRAMEWORK}} apps:
   - Event listener accumulation
   - Closure references to large objects
   - Global cache without eviction
   - Unclosed database connections/streams
   - Timer/interval references not cleared
5. A code snippet to add memory monitoring to the process
6. PM2 configuration to auto-restart on memory threshold

Show the exact Node.js flags and tool commands needed.
```

**Expected output:** Step-by-step memory leak investigation plan with tooling commands and code.

---

### Prompt: Performance Profiling
**Use when:** Endpoints are slow or the application has latency spikes
**Complexity:** Medium

```
Profile the performance of {{TARGET}} in the {{FRAMEWORK}} application.

Observed behavior:
- Endpoint/function: {{ENDPOINT}}
- Current latency: {{CURRENT_LATENCY}}
- Expected latency: {{TARGET_LATENCY}}
- Load conditions: {{LOAD}}

Generate:
1. Profiling instrumentation code (console.time, perf_hooks, or custom middleware)
2. CPU profiling commands (--prof, --prof-process, clinic.js)
3. A flame graph generation pipeline
4. Bottleneck identification checklist:
   - Database queries (N+1, missing indexes, full scans)
   - Synchronous operations blocking the event loop
   - Excessive JSON serialization/deserialization
   - Network calls without connection pooling
   - Middleware stack overhead
5. Quick wins ranked by effort vs. impact
```

**Expected output:** Profiling toolkit setup with bottleneck checklist and optimization recommendations.

---

### Prompt: Database Query Analysis
**Use when:** Slow queries or high database load
**Complexity:** Medium

```
Analyze this database query for performance:

Query:
{{QUERY}}

Table details:
- Table: {{TABLE_NAME}}
- Row count: {{ROW_COUNT}}
- Existing indexes: {{INDEXES}}
- Database: {{DATABASE_TYPE}} {{VERSION}}

Run this analysis:
1. Explain the query execution plan (EXPLAIN ANALYZE output interpretation)
2. Identify sequential scans on large tables
3. Check for missing indexes based on WHERE/JOIN/ORDER BY columns
4. Detect N+1 query patterns in the surrounding code
5. Suggest query rewrites (subquery to JOIN, CTE optimization)
6. Recommend index creation with exact CREATE INDEX statements
7. Estimate performance improvement from each recommendation

For Prisma users: show the equivalent Prisma query with includes/selects optimized.
```

**Expected output:** Query execution plan analysis with specific index and rewrite recommendations.

---

### Prompt: Log Correlation
**Use when:** Debugging an issue that spans multiple services or requests
**Complexity:** Medium

```
Help me correlate logs across {{NUM_SERVICES}} services to trace this issue:

Issue: {{ISSUE_DESCRIPTION}}
Time window: {{START_TIME}} to {{END_TIME}}
Services involved: {{SERVICES}}
Log format: {{LOG_FORMAT}}

Provide:
1. A correlation strategy using {{CORRELATION_ID_TYPE}} (request ID, trace ID, tenant ID)
2. Log search commands (grep, jq, or log platform queries) for each service
3. A timeline reconstruction template:
   | Timestamp | Service | Event | Request ID | Details |
4. Common cross-service failure patterns:
   - Timeout cascades
   - Retry storms
   - Inconsistent state from partial failures
   - Clock skew between services
5. A structured incident timeline from the correlated logs
```

**Expected output:** Correlation commands and a filled-in timeline identifying the failure chain.

---

### Prompt: Race Condition Identification
**Use when:** Bugs that appear intermittently or under load
**Complexity:** Complex

```
Investigate a potential race condition in {{CODEBASE_AREA}}.

Symptoms:
- Behavior: {{INTERMITTENT_BEHAVIOR}}
- Frequency: {{OCCURRENCE_RATE}}
- Concurrency level when it occurs: {{CONCURRENCY}}
- Affected data: {{AFFECTED_DATA}}

Analyze for:
1. Shared mutable state accessed without synchronization
2. Check-then-act patterns (TOCTOU vulnerabilities)
3. Database operations without proper transaction isolation
4. Event ordering assumptions that don't hold under load
5. Cache invalidation timing windows

For each found pattern:
- Show the vulnerable code path
- Explain the timing window that allows the race
- Provide a fix (mutex, transaction, optimistic locking, idempotency key)
- Show a test that reproduces the race condition
```

**Expected output:** Identified race conditions with reproduction tests and concurrency-safe fixes.

---

### Prompt: Dependency Conflict Resolution
**Use when:** npm install fails, peer dependency warnings, or runtime module errors
**Complexity:** Simple

```
Resolve dependency conflicts in this {{PACKAGE_MANAGER}} project:

Error/warning output:
{{NPM_OUTPUT}}

package.json dependencies:
{{DEPENDENCIES}}

Provide:
1. A plain-English explanation of each conflict
2. The dependency tree path causing each conflict (npm ls {{PACKAGE}})
3. Resolution options ranked by safety:
   a. Update the conflicting package
   b. Use a compatible version range
   c. Add overrides/resolutions to force a version
   d. Replace the dependency with an alternative
4. The exact package.json changes needed
5. Commands to verify the resolution (npm ls, npm audit)
6. Any breaking changes to watch for after resolution
```

**Expected output:** Conflict explanation with ranked resolution strategies and exact version changes.

---

## Resources

- https://nodejs.org/en/learn/diagnostics/memory-leaks
- https://www.postgresql.org/docs/current/using-explain.html
- https://clinicjs.org/documentation/

## Image References

1. **Node.js flame graph example** — search: "Node.js flame graph CPU profiling visualization"
2. **5 Whys root cause analysis diagram** — search: "5 whys root cause analysis fishbone diagram"
3. **PostgreSQL EXPLAIN ANALYZE output** — search: "PostgreSQL EXPLAIN ANALYZE query plan visualization"
4. **Memory leak heap snapshot comparison** — search: "Chrome DevTools heap snapshot memory leak comparison"
5. **Race condition timing diagram** — search: "race condition timing diagram concurrency bug"

## Video References

1. https://www.youtube.com/watch?v=hliOMEQRqf8 — "Finding And Fixing Node.js Memory Leaks: A Practical Guide"
2. https://www.youtube.com/watch?v=WFkpWjS1FPc — "Debugging Node.js with Chrome DevTools"
