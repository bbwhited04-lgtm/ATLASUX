# AI-Driven Coding & Development

## Overview

Atlas UX agents — particularly Sunday (tech documentation and comms) and Atlas (CEO/orchestration) — leverage AI-driven coding capabilities to accelerate development, enforce quality standards, and reduce technical debt. This document covers the patterns, techniques, and guardrails for AI-assisted code generation, review, refactoring, testing, documentation, and bug detection within the Atlas UX platform.

---

## Code Generation Patterns

### Spec-to-Code Pipeline

The highest-quality code generation follows a structured specification pipeline rather than ad-hoc natural language requests.

**Stage 1 — Requirements Specification**
```
Feature: Tenant-scoped file upload
Requirements:
- Accept multipart/form-data POST to /v1/files/upload
- Validate file type (allow: png, jpg, pdf, docx, xlsx, csv)
- Validate file size (max: 10MB per file)
- Enforce per-tenant quota (MAX_FILES_PER_TENANT, MAX_STORAGE_MB_PER_TENANT)
- Store in Supabase bucket under tenants/{tenantId}/
- Return signed URL with 1-hour expiry
- Log upload to audit trail
```

**Stage 2 — Interface Definition**
```typescript
interface UploadRequest {
  tenantId: string;
  file: MultipartFile;
}

interface UploadResponse {
  fileId: string;
  fileName: string;
  signedUrl: string;
  expiresAt: string;
  sizeBytes: number;
}
```

**Stage 3 — Code Generation**
The AI generates the implementation against the spec and interface, ensuring every requirement maps to code. Each requirement gets a comment annotation for traceability.

**Stage 4 — Validation**
Generated code is verified against the spec: every requirement must have corresponding implementation and test coverage.

### Prompt Structure for Code Generation

```
ROLE: Senior TypeScript backend engineer
CONTEXT: Fastify 5 + Prisma + Supabase stack. Multi-tenant (tenant_id on all tables).
SPEC: [paste specification]
CONSTRAINTS:
- Use existing patterns from codebase (import from "../db/prisma.js")
- Include tenant scoping via tenantPlugin
- Log to audit trail
- Handle errors with proper HTTP status codes
- TypeScript strict mode
OUTPUT: Complete implementation file with imports, types, route handler, and inline comments.
```

---

## Code Review Automation

### Review Dimensions

AI-powered code review evaluates across four dimensions simultaneously:

**Security**
- SQL injection via raw queries (prefer Prisma parameterized queries)
- XSS via unsanitized user input in responses
- Missing authentication/authorization checks
- Hardcoded secrets or credentials
- Insecure direct object references (tenant_id bypass)
- Missing rate limiting on public endpoints

**Performance**
- N+1 query patterns (use Prisma `include` or `select`)
- Unbounded queries without pagination
- Missing database indexes for filtered/sorted columns
- Synchronous operations that should be async
- Unnecessary data fetching (select * when only 2 fields needed)

**Style & Consistency**
- Naming conventions (camelCase for variables, PascalCase for types)
- Import ordering and path conventions
- Error handling patterns (consistent with codebase)
- Comment quality (explains "why," not "what")
- Dead code and unused imports

**Logic**
- Off-by-one errors in pagination
- Race conditions in concurrent access patterns
- Missing null/undefined checks
- Incorrect boolean logic in complex conditions
- Incomplete switch/case statements (missing default)

### Review Prompt Template

```
Review this code change for a Fastify + Prisma + TypeScript backend.
Focus areas: security, performance, style consistency, logical correctness.

CODEBASE CONVENTIONS:
- Prisma import: "../db/prisma.js"
- All routes require tenantId from tenantPlugin
- Audit logging on all mutations
- Rate limiting on public endpoints

DIFF:
[paste diff]

For each issue found:
1. Severity: critical | high | medium | low
2. Category: security | performance | style | logic
3. Line number(s)
4. Description of the issue
5. Suggested fix (code snippet)
```

---

## Refactoring Suggestions

### Extract Method

**Detection signal:** A function exceeds 50 lines or has multiple distinct logical blocks separated by comments.

```typescript
// BEFORE: Monolithic handler
async function handleOrder(req, reply) {
  // Validate input (15 lines)
  // Check inventory (10 lines)
  // Calculate pricing (20 lines)
  // Process payment (15 lines)
  // Send confirmation (10 lines)
}

// AFTER: Extracted methods
async function handleOrder(req, reply) {
  const validated = validateOrderInput(req.body);
  await checkInventory(validated.items);
  const pricing = calculatePricing(validated.items, validated.discountCode);
  const payment = await processPayment(pricing, validated.paymentMethod);
  await sendOrderConfirmation(validated.email, payment.receiptId);
}
```

### Simplify Conditionals

**Detection signal:** Nested if/else depth exceeds 3, or boolean expressions combine more than 3 conditions.

```typescript
// BEFORE
if (user && user.role === 'admin' && user.tenant === tenantId && !user.suspended) {
  if (action === 'delete' || action === 'archive') {
    if (target.owner === user.id || user.role === 'admin') {
      // execute
    }
  }
}

// AFTER: Guard clauses + extracted predicates
const canManage = isActiveAdmin(user, tenantId);
const isDestructiveAction = ['delete', 'archive'].includes(action);
const hasOwnership = target.owner === user.id || user.role === 'admin';

if (!canManage) return reply.code(403).send({ error: 'Insufficient permissions' });
if (!isDestructiveAction) return handleNonDestructive(action, target);
if (!hasOwnership) return reply.code(403).send({ error: 'Not owner or admin' });
// execute
```

### Reduce Cyclomatic Complexity

**Detection signal:** Cyclomatic complexity score > 10 for any single function.

Strategies:
- Replace switch/case with lookup objects or strategy pattern
- Extract early returns (guard clauses) for edge cases
- Use polymorphism instead of type-checking conditionals
- Replace nested loops with higher-order functions (map, filter, reduce)

### Dead Code Elimination

**Detection signal:** Unused exports, unreachable branches, commented-out code blocks, parameters that are never read.

AI review flags dead code with confidence levels:
- **High confidence**: No callers found in entire codebase
- **Medium confidence**: Only test files reference it
- **Low confidence**: May be used via dynamic import or external caller

---

## Test Generation

### Unit Tests from Function Signatures

Given a function signature and its JSDoc, generate comprehensive unit tests:

```typescript
// Source function
/**
 * Calculates tiered pricing based on quantity and customer tier.
 * @param quantity - Number of units (must be > 0)
 * @param tier - Customer tier: 'standard' | 'premium' | 'enterprise'
 * @returns Price per unit in cents
 * @throws {ValidationError} if quantity <= 0
 */
function calculateUnitPrice(quantity: number, tier: CustomerTier): number

// Generated tests
describe('calculateUnitPrice', () => {
  // Happy path
  it('returns standard pricing for small quantities', () => { ... });
  it('applies volume discount at 100+ units', () => { ... });
  it('applies premium tier discount', () => { ... });
  it('applies enterprise tier discount (largest)', () => { ... });

  // Edge cases
  it('handles quantity of exactly 1', () => { ... });
  it('handles boundary quantity (99 vs 100)', () => { ... });
  it('handles very large quantities (MAX_SAFE_INTEGER)', () => { ... });

  // Error cases
  it('throws ValidationError for quantity 0', () => { ... });
  it('throws ValidationError for negative quantity', () => { ... });
  it('throws for invalid tier value', () => { ... });

  // Property-based
  it('price per unit decreases or stays same as quantity increases', () => {
    fc.assert(fc.property(fc.integer({ min: 1, max: 100000 }), (q) => {
      const p1 = calculateUnitPrice(q, 'standard');
      const p2 = calculateUnitPrice(q + 1, 'standard');
      return p2 <= p1;
    }));
  });
});
```

### Edge Case Generation Strategy

1. **Boundary values**: 0, 1, -1, MAX_INT, empty string, single character
2. **Type boundaries**: null, undefined, NaN, Infinity
3. **Collection boundaries**: empty array, single element, duplicate elements
4. **Format boundaries**: Unicode, emoji, RTL text, SQL injection strings, XSS payloads
5. **Concurrency**: Simultaneous calls, rapid sequential calls, interleaved operations
6. **State boundaries**: Before initialization, after cleanup, during migration

### Property-Based Testing

Define invariants that must hold for all inputs:
- Encoding then decoding returns the original value
- Sorting is idempotent (sorting a sorted array produces the same array)
- Price is always non-negative
- Pagination returns every record exactly once across all pages
- Tenant isolation: operation for tenant A never returns data from tenant B

---

## Documentation Generation

### JSDoc from Code Analysis

AI analyzes function implementation to generate accurate JSDoc:

```typescript
// AI reads this implementation:
async function findAvailableSlots(calendarId: string, date: Date, duration: number) {
  const events = await prisma.event.findMany({
    where: { calendarId, date: { gte: startOfDay(date), lte: endOfDay(date) } },
    orderBy: { startTime: 'asc' }
  });
  const gaps = findGaps(events, duration);
  return gaps.filter(g => g.duration >= duration);
}

// AI generates:
/**
 * Finds available time slots in a calendar for a given date and minimum duration.
 *
 * Queries all events for the specified calendar on the given date, identifies
 * gaps between events, and returns only those gaps that meet the minimum
 * duration requirement.
 *
 * @param calendarId - The unique identifier of the calendar to search
 * @param date - The date to check for availability (time component ignored)
 * @param duration - Minimum slot duration in minutes
 * @returns Array of available time slots, each with start, end, and duration
 * @throws {PrismaClientKnownRequestError} if calendarId doesn't exist
 */
```

### API Documentation from Route Definitions

AI scans Fastify route registrations and generates OpenAPI-compatible documentation:

```typescript
// Route definition
fastify.post<{ Body: CreateJobBody }>('/v1/jobs', {
  config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  schema: { body: CreateJobSchema }
}, handler);

// Generated documentation
/**
 * POST /v1/jobs
 *
 * Create a new job in the queue.
 *
 * Authentication: Required (Bearer token)
 * Tenant: Required (x-tenant-id header)
 * Rate Limit: 30 requests per minute
 *
 * Request Body:
 *   - type (string, required): Job type enum
 *   - payload (object, required): Job-specific payload
 *   - priority (number, optional): 1-10, default 5
 *
 * Responses:
 *   201: Job created successfully
 *   400: Invalid request body
 *   401: Missing or invalid authentication
 *   429: Rate limit exceeded
 */
```

---

## Bug Detection Patterns

### Null Dereference

**Pattern**: Accessing properties on potentially null/undefined values without guards.

```typescript
// BUG: user might be null if not found
const user = await prisma.user.findUnique({ where: { id } });
const name = user.name; // Potential null dereference

// FIX:
const user = await prisma.user.findUnique({ where: { id } });
if (!user) throw new NotFoundError(`User ${id} not found`);
const name = user.name;
```

### Race Conditions

**Pattern**: Check-then-act without atomicity in concurrent environments.

```typescript
// BUG: Race condition — job could be claimed between findFirst and update
const job = await prisma.job.findFirst({ where: { status: 'queued' } });
if (job) {
  await prisma.job.update({ where: { id: job.id }, data: { status: 'running' } });
}

// FIX: Atomic claim with optimistic locking
const claimed = await prisma.job.updateMany({
  where: { id: job.id, status: 'queued' },
  data: { status: 'running' }
});
if (claimed.count !== 1) return; // Already claimed by another worker
```

### Resource Leaks

**Pattern**: Opening connections, file handles, or streams without guaranteed cleanup.

```typescript
// BUG: If processFile throws, the stream is never closed
const stream = fs.createReadStream(path);
await processFile(stream);
stream.close();

// FIX: Use try/finally or disposable pattern
const stream = fs.createReadStream(path);
try {
  await processFile(stream);
} finally {
  stream.close();
}
```

### Injection Vulnerabilities

**Pattern**: Constructing queries or commands from user input without parameterization.

```typescript
// BUG: SQL injection via raw query
const results = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE name = '${req.body.name}'`
);

// FIX: Parameterized query
const results = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = ${req.body.name}
`;
```

---

## Code Explanation

AI-generated code explanations serve two purposes: onboarding new developers and creating audit-friendly documentation of complex logic.

### Explanation Prompt Template

```
Explain this code to a mid-level developer who is new to the Atlas UX codebase.
Structure your explanation as:
1. Purpose: What does this code accomplish? (1-2 sentences)
2. Flow: Step-by-step walkthrough of execution
3. Key decisions: Why was it implemented this way? (architectural choices)
4. Dependencies: What external systems/services does it interact with?
5. Edge cases: What edge cases does it handle (or fail to handle)?
6. Potential improvements: What could be improved?
```

---

## Migration Assistance

### Database Migration Generation

Given a schema change requirement, generate Prisma migration:

```
Requirement: Add a "tags" field to the kb_documents table.
- Tags are an array of strings
- Maximum 10 tags per document
- Tags should be searchable
- Must include tenant_id scoping

Generated migration:
ALTER TABLE "kb_documents" ADD COLUMN "tags" TEXT[] DEFAULT '{}';
CREATE INDEX "kb_documents_tags_gin" ON "kb_documents" USING GIN ("tags");
-- Application-level validation: max 10 tags per document
```

### Code Migration Patterns

When upgrading dependencies or changing patterns:
1. AI scans all files using the old pattern
2. Generates the replacement for each occurrence
3. Produces a migration checklist with file paths and line numbers
4. Generates tests to verify the migration did not change behavior

---

## Technical Debt Quantification

### Debt Categories and Scoring

| Category | Weight | Detection Method |
|---|---|---|
| Security vulnerabilities | 10 | Static analysis, dependency audit |
| Missing error handling | 7 | Pattern matching on async calls without try/catch |
| Duplicated code | 5 | Token-level similarity analysis |
| Missing tests | 5 | Coverage analysis against critical paths |
| Outdated dependencies | 4 | npm audit, version comparison |
| Code complexity | 3 | Cyclomatic complexity > 10 |
| Missing documentation | 2 | Functions > 20 lines without JSDoc |
| Style inconsistencies | 1 | Linter violations |

### Debt Score Calculation

```
Debt Score = Sum(issues * category_weight) / total_lines_of_code * 1000
```

Interpretation:
- Score < 5: Healthy codebase
- Score 5-15: Normal debt, schedule periodic cleanup
- Score 15-30: Concerning, allocate sprint time
- Score > 30: Critical, prioritize debt reduction over features

### Agent Application

Sunday and Atlas can run technical debt audits on the codebase:
1. Scan for each debt category
2. Produce a prioritized list (severity * effort_to_fix)
3. Generate decision memos for high-priority items
4. Track debt score over time in the analytics dashboard

---

## Safety Guardrails for AI-Generated Code

### Never Auto-Deploy

All AI-generated code goes through:
1. Automated test suite (must pass 100%)
2. Security scan (no new vulnerabilities)
3. Human review (at least one approval)
4. Staged rollout (canary → 10% → 50% → 100%)

### Scope Limitations

AI code generation agents are restricted to:
- Application code within `src/` and `backend/src/`
- Test files within `test/` directories
- Documentation files within `docs/`
- Configuration files only via decision memo approval

They are explicitly prohibited from:
- Modifying authentication or authorization logic without human review
- Changing database schema without migration review
- Altering deployment configurations
- Accessing or modifying environment variables or secrets
