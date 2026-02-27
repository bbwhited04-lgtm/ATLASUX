# Code Optimization Strategies

## Overview

Performance optimization is a discipline of measurement, targeted improvement, and validation. This document covers optimization strategies across the full stack — algorithms, databases, frontend, backend, memory, APIs, and cost — with specific guidance for the Atlas UX platform's Fastify + Prisma + React + Supabase architecture.

---

## The 80/20 Rule of Optimization

Before optimizing anything, measure. 80% of performance impact comes from 20% of the code. Premature optimization wastes engineering time and adds complexity without measurable benefit.

### Optimization Protocol

1. **Measure**: Profile the system under realistic load. Identify actual bottlenecks with data, not intuition.
2. **Prioritize**: Rank bottlenecks by user impact (latency, throughput, error rate).
3. **Optimize**: Fix the top bottleneck. Change one thing at a time.
4. **Validate**: Re-measure to confirm the optimization worked and did not introduce regressions.
5. **Document**: Record what was changed, why, and the before/after metrics.
6. **Repeat**: Move to the next bottleneck. Stop when gains no longer justify effort.

### Anti-Patterns

- Optimizing code that runs once per day for 50ms
- Adding caching layers before proving the database is actually slow
- Micro-optimizing loops that process 10 items
- Choosing a complex algorithm when the input size is always small (n < 100)

---

## Performance Profiling

### Backend Profiling (Node.js / Fastify)

**CPU Profiling**
```bash
# Generate a CPU profile for 30 seconds
node --prof backend/dist/server.js
# Process the profile
node --prof-process isolate-*.log > profile.txt
```

**Heap Snapshots**
```bash
# In code, trigger heap snapshot
const v8 = require('v8');
v8.writeHeapSnapshot();
```

**Request-Level Timing**
```typescript
// Fastify hook for per-route timing
fastify.addHook('onResponse', (req, reply, done) => {
  const duration = reply.elapsedTime; // Fastify built-in
  logger.info({ route: req.routeOptions.url, method: req.method, duration, statusCode: reply.statusCode });
  done();
});
```

### Frontend Profiling (React / Vite)

- **React DevTools Profiler**: Identifies components that re-render unnecessarily
- **Chrome Performance tab**: Flame charts showing main thread work, layout thrashing, long tasks
- **Lighthouse**: Automated audits for performance, accessibility, SEO
- **Web Vitals API**: Real user metrics (LCP, FID, CLS, INP, TTFB)

### Database Profiling (PostgreSQL)

```sql
-- Enable query logging for slow queries (> 100ms)
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Analyze a specific query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT * FROM audit_log WHERE tenant_id = 'xxx' ORDER BY timestamp DESC LIMIT 50;
```

---

## Algorithm Optimization

### Big-O Awareness

| Operation | Array | Hash Map | Sorted Array | B-Tree (DB Index) |
|---|---|---|---|---|
| Search | O(n) | O(1) avg | O(log n) | O(log n) |
| Insert | O(1) append | O(1) avg | O(n) | O(log n) |
| Delete | O(n) | O(1) avg | O(n) | O(log n) |
| Range query | O(n) | O(n) | O(log n + k) | O(log n + k) |

### Data Structure Selection

| Use Case | Optimal Structure | Why |
|---|---|---|
| Lookup by ID | Hash Map / Map | O(1) average lookup |
| Sorted display | Array + sort on insert | Avoid re-sorting on every render |
| Deduplication | Set | O(1) membership test |
| Priority queue (job scheduler) | Min-Heap | O(log n) insert and extract-min |
| Prefix search (autocomplete) | Trie | O(m) where m = query length |
| Range queries (date filters) | B-Tree (DB index) | O(log n) range scans |
| Frequency counting | Map<string, number> | O(1) increment |

### Common Algorithm Improvements

**Replace nested loops with hash lookups:**
```typescript
// SLOW: O(n * m)
const matches = users.filter(u => orders.some(o => o.userId === u.id));

// FAST: O(n + m)
const orderUserIds = new Set(orders.map(o => o.userId));
const matches = users.filter(u => orderUserIds.has(u.id));
```

**Replace repeated array scans with pre-built index:**
```typescript
// SLOW: O(n) per lookup, O(n * k) total
items.forEach(item => {
  const category = categories.find(c => c.id === item.categoryId);
});

// FAST: O(1) per lookup, O(n + k) total
const categoryMap = new Map(categories.map(c => [c.id, c]));
items.forEach(item => {
  const category = categoryMap.get(item.categoryId);
});
```

---

## Database Query Optimization

### N+1 Query Problem

The most common database performance killer in ORM-based applications.

```typescript
// N+1: 1 query for jobs + N queries for job.tenant
const jobs = await prisma.job.findMany(); // 1 query
for (const job of jobs) {
  const tenant = await prisma.tenant.findUnique({ where: { id: job.tenantId } }); // N queries
}

// FIXED: Single query with include
const jobs = await prisma.job.findMany({
  include: { tenant: true } // 1 query with JOIN
});

// BETTER: Select only needed fields
const jobs = await prisma.job.findMany({
  select: {
    id: true,
    status: true,
    tenant: { select: { id: true, name: true } }
  }
});
```

### Index Design

**Rules of thumb:**
1. Index columns that appear in WHERE, JOIN ON, and ORDER BY clauses
2. Composite indexes: put equality columns first, range columns last
3. Include columns in the index to enable index-only scans
4. Don't over-index — each index slows writes

**Atlas UX critical indexes:**
```sql
-- Audit log: most queried table
CREATE INDEX idx_audit_log_tenant_timestamp ON audit_log (tenant_id, timestamp DESC);
CREATE INDEX idx_audit_log_tenant_action ON audit_log (tenant_id, action);

-- Jobs: engine loop queries queued jobs frequently
CREATE INDEX idx_jobs_status_created ON jobs (status, created_at) WHERE status = 'queued';

-- KB documents: full-text search
CREATE INDEX idx_kb_documents_search ON kb_documents USING GIN (to_tsvector('english', title || ' ' || content));
```

### Query Plan Analysis

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM audit_log
WHERE tenant_id = 'tenant_abc' AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 50;

-- Look for:
-- Seq Scan → needs an index
-- Nested Loop with inner Seq Scan → N+1 at DB level
-- Sort with external merge → memory too low, increase work_mem
-- Rows estimated vs actual differ by >10x → stale statistics, run ANALYZE
```

### Connection Pooling

**Problem**: Each database connection consumes ~10MB of server RAM. Node.js apps under load can exhaust connection limits.

**Solution**: Supabase provides PgBouncer for connection pooling. Atlas UX uses:
- `DATABASE_URL`: Points to PgBouncer (transaction mode, max 200 connections pooled down to 20 server connections)
- `DIRECT_URL`: Bypasses PgBouncer for migrations and long-running operations

**Configuration:**
```
Pool size: 20 connections per service
Max wait: 30 seconds
Idle timeout: 60 seconds
Statement timeout: 30 seconds (prevents runaway queries)
```

---

## Frontend Optimization

### Bundle Size Reduction

**Current Atlas UX Vite split strategy:**
```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'router': ['react-router', 'react-router-dom'],
  'ui-vendor': ['lucide-react', 'recharts'],
  'charts': ['recharts']
}
```

**Techniques:**
1. **Tree shaking**: Import specific functions, not entire libraries. `import { format } from 'date-fns'` not `import * as dateFns from 'date-fns'`.
2. **Dynamic imports**: Load heavy components only when needed.
3. **Bundle analysis**: Run `npx vite-bundle-visualizer` to find oversized chunks.
4. **Dependency audit**: Replace heavy libraries with lighter alternatives (e.g., `dayjs` instead of `moment`).

### Code Splitting and Lazy Loading

```typescript
// Lazy load routes
const AgentWatcher = React.lazy(() => import('./components/AgentWatcher'));
const BlogManager = React.lazy(() => import('./components/BlogManager'));

// In router
<Route path="/app/watcher" element={
  <Suspense fallback={<LoadingSpinner />}>
    <AgentWatcher />
  </Suspense>
} />
```

**Guidelines:**
- Lazy load any component larger than 50KB that is not on the initial route
- Prefetch components for likely next navigation targets
- Keep the initial bundle under 200KB gzipped

### Core Web Vitals

| Metric | Target | Impact |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Perceived load speed |
| INP (Interaction to Next Paint) | < 200ms | Responsiveness |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |
| TTFB (Time to First Byte) | < 800ms | Server response speed |

**LCP optimization**: Preload critical images, inline critical CSS, minimize render-blocking scripts.
**INP optimization**: Break long tasks (>50ms) into smaller chunks using `requestIdleCallback` or `scheduler.yield()`. Avoid synchronous layouts.
**CLS optimization**: Set explicit dimensions on images/embeds, avoid inserting content above the viewport.

### React-Specific Optimizations

1. **Memoization**: `React.memo()` for components that receive stable props. `useMemo()` for expensive computations. `useCallback()` for callbacks passed to memoized children.

2. **Virtualization**: For lists with >100 items, use `react-window` or `react-virtuoso` to render only visible rows.

3. **State colocation**: Keep state as close to where it is used as possible. Global state causes unnecessary re-renders across the tree.

4. **Batch updates**: React 18 auto-batches inside event handlers. For async operations, wrap in `flushSync` only when immediate DOM update is required.

---

## Backend Optimization

### Caching Strategy

**Layer 1 — In-Memory Cache (fastest, per-process)**
```typescript
const cache = new Map<string, { data: any; expiresAt: number }>();

function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = await fetcher();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
```
Use for: configuration, feature flags, tenant settings, frequently accessed reference data.

**Layer 2 — Redis Cache (shared across processes/services)**
Use for: session data, rate limit counters, expensive query results, inter-service shared state.

**Layer 3 — CDN Cache (edge, closest to user)**
Use for: static assets (JS, CSS, images), public API responses with appropriate `Cache-Control` headers.

### Cache Invalidation

The two hardest problems in computer science: cache invalidation, naming things, and off-by-one errors.

**Strategies:**
- **TTL-based**: Simple but may serve stale data. Use for data where eventual consistency is acceptable (analytics, dashboards).
- **Event-based**: Invalidate on write. Use Prisma middleware to clear cache entries when related records are modified.
- **Version-based**: Include a version/hash in the cache key. When data changes, the version changes, naturally invalidating old entries.

### Async and Non-Blocking Patterns

```typescript
// SLOW: Sequential async calls
const user = await getUser(id);
const orders = await getOrders(id);
const preferences = await getPreferences(id);
// Total time: sum of all three

// FAST: Parallel async calls
const [user, orders, preferences] = await Promise.all([
  getUser(id),
  getOrders(id),
  getPreferences(id),
]);
// Total time: max of the three
```

### Batch Operations

```typescript
// SLOW: Individual inserts (N round trips)
for (const item of items) {
  await prisma.auditLog.create({ data: item });
}

// FAST: Batch insert (1 round trip)
await prisma.auditLog.createMany({ data: items });
```

---

## Memory Optimization

### Node.js Memory Management

**Identify leaks:**
```typescript
// Monitor heap usage
setInterval(() => {
  const usage = process.memoryUsage();
  logger.info({
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
  });
}, 60000);
```

**Common leak sources:**
- Growing Maps/Sets that are never cleared (add TTL or max size)
- Event listeners added but never removed
- Closures capturing large objects unnecessarily
- Unbounded arrays (logs, queues) without max length

**Prevention:**
- Use WeakMap/WeakSet for object-keyed caches (allows GC)
- Set maximum sizes on in-memory caches with LRU eviction
- Stream large data instead of loading into memory
- Explicitly null out large objects after use in long-running processes

---

## API Optimization

### Pagination

Every list endpoint must support pagination. Unbounded queries are a production incident waiting to happen.

```typescript
// Cursor-based pagination (preferred for large datasets)
GET /v1/audit-log?cursor=abc123&limit=50

// Offset-based pagination (simpler but slower for deep pages)
GET /v1/jobs?offset=200&limit=50
```

**Cursor vs Offset:**
- Cursor: Consistent performance regardless of page depth. Use for audit logs, activity feeds.
- Offset: Simple to implement. Performance degrades for deep pages (offset > 10000). Use for small datasets or when random page access is needed.

### Field Selection

```typescript
// Client requests only needed fields
GET /v1/users?fields=id,name,email

// Backend selects only those fields from DB
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true }
});
```

This reduces database I/O, network payload, and serialization time.

### Response Compression

```typescript
// Fastify compression plugin
import compress from '@fastify/compress';
fastify.register(compress, {
  encodings: ['gzip', 'br'], // Brotli preferred when supported
  threshold: 1024, // Only compress responses > 1KB
});
```

Typical compression ratios: JSON responses compress 60-80%, reducing bandwidth and improving perceived latency.

---

## Cost Optimization

### LLM Token Cost Reduction

Tokens are the largest variable cost in AI-powered platforms.

1. **Prompt compression**: Reduce system prompt tokens by 30-50% (see adv-prompt-optimization.md).
2. **Model routing**: Use cheaper models for simple tasks. GPT-4o-mini for classification, full GPT-4 only for complex reasoning.
3. **Caching**: Cache identical prompts (hash the input). Many agent tasks process similar inputs repeatedly.
4. **Batch processing**: Group similar tasks into a single prompt where possible.
5. **Early termination**: Stop generation when the answer is clear (structured output with stop tokens).
6. **Max token limits**: Set `max_tokens` per task type to prevent verbose outputs.

**Cost tracking:**
```typescript
// Log token usage per agent per task type
await prisma.auditLog.create({
  data: {
    action: 'ai_inference',
    meta: {
      agent: 'sunday',
      model: 'gpt-4o',
      inputTokens: 1234,
      outputTokens: 567,
      costUsd: 0.0234,
      taskType: 'blog_draft'
    }
  }
});
```

### API Call Batching

```typescript
// EXPENSIVE: 10 separate API calls
for (const recipient of recipients) {
  await sendEmail(recipient, template);
}

// CHEAPER: Batch API (if provider supports it)
await sendBulkEmail(recipients, template);
```

### Database Cost

- Use read replicas for analytics queries (separate from transactional load)
- Archive old data to cold storage (audit logs > 1 year)
- Optimize vacuum and autovacuum settings to reclaim space efficiently
- Monitor and alert on database size growth rate

---

## Optimization Checklist

Before any optimization work, verify:

- [ ] The bottleneck is confirmed by profiling data, not assumption
- [ ] The optimization targets a hot path (runs frequently or impacts user experience)
- [ ] There are before-metrics to compare against
- [ ] The optimization does not sacrifice code readability without justification
- [ ] The optimization is validated by after-metrics showing measurable improvement
- [ ] Edge cases and error handling are not broken by the optimization
- [ ] The optimization is documented for future maintainers
