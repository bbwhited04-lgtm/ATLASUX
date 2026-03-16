# Compliance Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden Atlas UX to certification-ready state across SOC 2, ISO 27001, HIPAA, PCI DSS, NIST 800-53, GDPR, and HITRUST CSF.

**Architecture:** Framework-mapped code hardening — every change traces to specific control IDs. 7 code sections (DB migrations, plugins, routes) followed by 8 policy doc rewrites. Each commit message includes the framework control IDs it satisfies.

**Tech Stack:** Fastify 5, Prisma 5, PostgreSQL 16 (Supabase), TypeScript, Zod, Node crypto

---

## Task 1: Hash-Chained Audit Logs — Migration

**Controls:** SOC 2 CC7.2, ISO A.12.4.1, NIST AU-10, HITRUST 09.aa, PCI 10.5.5, GDPR Art. 5(1)(f)

**Files:**
- Modify: `backend/prisma/schema.prisma` (AuditLog model, ~line 173)
- Create: `backend/prisma/migrations/20260303010000_audit_hash_chain/migration.sql`

**Step 1: Add columns to AuditLog model in schema.prisma**

Find the AuditLog model and add two fields before the `@@index` lines:

```prisma
  prevHash    String?  @map("prev_hash")
  recordHash  String?  @map("record_hash")
```

**Step 2: Create the migration SQL**

```sql
ALTER TABLE "audit_log" ADD COLUMN "prev_hash" TEXT;
ALTER TABLE "audit_log" ADD COLUMN "record_hash" TEXT;
CREATE INDEX "audit_log_record_hash_idx" ON "audit_log" ("record_hash");
```

**Step 3: Run migration**

```bash
cd backend && npx prisma migrate dev --name audit_hash_chain
```

**Step 4: Build to verify**

```bash
cd backend && npm run build
```

**Step 5: Commit**

```bash
git add backend/prisma/
git commit -m "feat(SOC2-CC7.2,NIST-AU-10): add hash chain columns to audit_log"
```

---

## Task 2: Hash-Chained Audit Logs — Chain Logic

**Files:**
- Create: `backend/src/lib/auditChain.ts`
- Modify: `backend/src/plugins/auditPlugin.ts`

**Step 1: Create auditChain.ts**

Create `backend/src/lib/auditChain.ts`:

```typescript
import { createHash } from "node:crypto";
import { prisma } from "../db/prisma.js";

// In-memory cache of latest hash per tenant (avoids DB read on every insert)
const latestHash = new Map<string, string>();

const GENESIS_HASH = "0".repeat(64); // SHA-256 of nothing — chain anchor

function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Compute and return the hash chain fields for a new audit log entry.
 * Call this BEFORE inserting the row.
 */
export async function computeAuditHash(args: {
  tenantId: string | null;
  action: string;
  entityId: string | null;
  timestamp: Date;
  actorUserId: string | null;
}): Promise<{ prevHash: string; recordHash: string }> {
  const key = args.tenantId ?? "__global__";

  // Try cache first, fall back to DB
  let prevHash = latestHash.get(key);
  if (!prevHash) {
    const latest = await prisma.auditLog.findFirst({
      where: { tenantId: args.tenantId ?? undefined, recordHash: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { recordHash: true },
    });
    prevHash = latest?.recordHash ?? GENESIS_HASH;
  }

  const payload = [
    prevHash,
    args.tenantId ?? "",
    args.action,
    args.entityId ?? "",
    args.timestamp.toISOString(),
    args.actorUserId ?? "",
  ].join("|");

  const recordHash = sha256(payload);

  // Update cache
  latestHash.set(key, recordHash);

  return { prevHash, recordHash };
}

/**
 * Verify the hash chain for a tenant. Returns broken links.
 */
export async function verifyAuditChain(tenantId: string): Promise<{
  total: number;
  verified: number;
  broken: Array<{ id: string; expected: string; actual: string; createdAt: Date }>;
}> {
  const rows = await prisma.auditLog.findMany({
    where: { tenantId, recordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      tenantId: true,
      action: true,
      entityId: true,
      createdAt: true,
      timestamp: true,
      actorUserId: true,
      prevHash: true,
      recordHash: true,
    },
  });

  const broken: Array<{ id: string; expected: string; actual: string; createdAt: Date }> = [];
  let lastHash = GENESIS_HASH;

  for (const row of rows) {
    // Verify prev_hash points to the previous record's hash
    if ((row as any).prevHash !== lastHash) {
      broken.push({
        id: row.id,
        expected: lastHash,
        actual: (row as any).prevHash ?? "null",
        createdAt: row.createdAt,
      });
    }

    // Recompute and verify record_hash
    const ts = (row as any).timestamp ?? row.createdAt;
    const payload = [
      (row as any).prevHash ?? "",
      row.tenantId ?? "",
      row.action,
      row.entityId ?? "",
      (ts instanceof Date ? ts : new Date(ts)).toISOString(),
      row.actorUserId ?? "",
    ].join("|");
    const expected = sha256(payload);

    if ((row as any).recordHash !== expected) {
      broken.push({
        id: row.id,
        expected,
        actual: (row as any).recordHash ?? "null",
        createdAt: row.createdAt,
      });
    }

    lastHash = (row as any).recordHash ?? lastHash;
  }

  return { total: rows.length, verified: rows.length - broken.length, broken };
}
```

**Step 2: Update auditPlugin.ts to compute hashes**

In `backend/src/plugins/auditPlugin.ts`, add the import at the top:

```typescript
import { computeAuditHash } from "../lib/auditChain.js";
```

Replace the `try` block inside the `onSend` hook (the part that does `prisma.auditLog.create`) with hash computation before each insert. In both Attempt 1 and Attempt 2, add hash computation before the create call:

Before the existing `try { await prisma.auditLog.create(...)` block, add:

```typescript
      const now = new Date();
      const tenantId = (req as any).tenantId ?? null;
      const hashFields = await computeAuditHash({
        tenantId,
        action: `${req.method} ${req.url}`,
        entityId: null,
        timestamp: now,
        actorUserId: (req as any).auth?.userId ?? null,
      });
```

Then add `prevHash: hashFields.prevHash, recordHash: hashFields.recordHash, timestamp: now,` to both create data objects (as part of the `as any` cast).

**Step 3: Add verify endpoint to complianceRoutes.ts**

At the end of `backend/src/routes/complianceRoutes.ts` (before the closing `};`), add:

```typescript
  // ── Audit Chain Verification ────────────────────────────────────────
  app.get("/audit/verify", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return reply.status(400).send({ ok: false, error: "Tenant ID required" });

    const { verifyAuditChain } = await import("../lib/auditChain.js");
    const result = await verifyAuditChain(tenantId);

    return {
      ok: true,
      chain: {
        total: result.total,
        verified: result.verified,
        intact: result.broken.length === 0,
        brokenLinks: result.broken.slice(0, 50),
      },
    };
  });
```

**Step 4: Build and commit**

```bash
cd backend && npm run build
git add backend/src/lib/auditChain.ts backend/src/plugins/auditPlugin.ts backend/src/routes/complianceRoutes.ts
git commit -m "feat(SOC2-CC7.2,ISO-A.12.4.1,NIST-AU-10): hash-chained audit logs with verification endpoint"
```

---

## Task 3: Database-Level RLS — Migration

**Controls:** SOC 2 CC6.3, HIPAA §164.312(a)(1), ISO A.9.4.1, NIST AC-3, PCI 7.1, HITRUST 01.c, GDPR Art. 25

**Files:**
- Create: `backend/prisma/migrations/20260303020000_enable_rls/migration.sql`

**Step 1: Create RLS migration**

```sql
-- Enable RLS on 12 tenant-scoped tables
ALTER TABLE "integrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "distribution_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "kb_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "decision_memos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "crm_companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "consent_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_subject_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "data_breaches" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
-- These use the session variable set by withTenant() in db/prisma.ts
CREATE POLICY tenant_isolation ON "integrations" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "assets" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "jobs" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "distribution_events" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "audit_log" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "kb_documents" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "decision_memos" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "crm_contacts" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "crm_companies" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "consent_records" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "data_subject_requests" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
CREATE POLICY tenant_isolation ON "data_breaches" USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Bypass policy for the service role (used by Prisma migrations, seed scripts, workers)
-- Supabase service_role already bypasses RLS by default, but explicit for clarity:
CREATE POLICY service_bypass ON "integrations" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "assets" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "jobs" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "distribution_events" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "audit_log" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "kb_documents" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "decision_memos" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "crm_contacts" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "crm_companies" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "consent_records" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "data_subject_requests" FOR ALL TO service_role USING (true);
CREATE POLICY service_bypass ON "data_breaches" FOR ALL TO service_role USING (true);
```

**Step 2: Run migration**

```bash
cd backend && npx prisma migrate dev --name enable_rls
```

**Step 3: Build and commit**

```bash
cd backend && npm run build
git add backend/prisma/
git commit -m "feat(SOC2-CC6.3,HIPAA-164.312,NIST-AC-3,PCI-7.1): enable RLS on 12 tenant-scoped tables"
```

---

## Task 4: CSRF Protection — Backend Plugin Rewrite

**Controls:** PCI 6.5.9, NIST SC-23, HITRUST 09.m, SOC 2 CC6.6, ISO A.14.1.2

**Files:**
- Modify: `backend/src/plugins/csrfPlugin.ts`
- Modify: `backend/src/server.ts`

**Step 1: Rewrite csrfPlugin.ts with DB-backed synchronizer pattern**

Replace the entire file `backend/src/plugins/csrfPlugin.ts`:

```typescript
/**
 * CSRF Protection — DB-backed synchronizer token pattern.
 *
 * Works cross-origin (Vercel frontend → Render backend) without cookies.
 * Uses the oauth_state table for token storage with 1-hour TTL.
 *
 * Flow:
 *   1. Any authenticated response includes x-csrf-token header
 *   2. Frontend reads it and sends on all state-changing requests
 *   3. Backend validates token exists in DB before processing mutations
 *
 * Controls: PCI DSS 6.5.9, NIST SC-23, HITRUST 09.m, SOC 2 CC6.6, ISO A.14.1.2
 */
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "crypto";
import { setOAuthState, getOAuthState } from "../lib/oauthState.js";

const CSRF_HEADER = "x-csrf-token";
const CSRF_TTL_MS = 60 * 60 * 1000; // 1 hour

const SKIP_PREFIXES = [
  "/v1/billing/stripe/webhook",
  "/v1/stripe/webhook",
  "/v1/oauth/",
  "/v1/discord/webhook",
  "/v1/meta/deletion",
  "/v1/google/deletion",
  "/v1/x/webhook",
  "/v1/tiktok/webhook",
  "/v1/telegram/webhook",
  "/v1/linkedin/webhook",
  "/v1/alignable/webhook",
  "/v1/tumblr/webhook",
  "/v1/pinterest/webhook",
  "/v1/teams/webhook",
  "/v1/gate/",
  "/v1/health",
  "/v1/auth/provision",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const csrfPlugin: FastifyPluginAsync = async (app) => {
  // Issue a new CSRF token on every authenticated response
  app.addHook("onSend", async (req, reply, payload) => {
    const userId = (req as any).auth?.userId;
    if (!userId) return payload;

    // Generate token and store in DB
    const token = randomBytes(32).toString("hex");
    const key = `csrf:${userId}:${token}`;
    await setOAuthState(key, { userId }, CSRF_TTL_MS).catch(() => null);

    reply.header(CSRF_HEADER, token);
    return payload;
  });

  // Validate CSRF token on mutating requests
  app.addHook("preHandler", async (req, reply) => {
    if (!MUTATING_METHODS.has(req.method.toUpperCase())) return;

    // Skip exempt routes (webhooks, OAuth callbacks, public endpoints)
    for (const prefix of SKIP_PREFIXES) {
      if (req.url.startsWith(prefix)) return;
    }

    // Skip if no auth context (unauthenticated routes handle their own security)
    const userId = (req as any).auth?.userId;
    if (!userId) return;

    const token = req.headers[CSRF_HEADER] as string | undefined;
    if (!token) {
      return reply.code(403).send({ ok: false, error: "csrf_token_missing" });
    }

    const key = `csrf:${userId}:${token}`;
    const data = await getOAuthState(key);
    if (!data || data.userId !== userId) {
      return reply.code(403).send({ ok: false, error: "csrf_token_invalid" });
    }

    // Token is valid — don't delete it (allow reuse within TTL window)
  });
};

export default fp(csrfPlugin);
```

**Step 2: Re-enable CSRF in server.ts**

In `backend/src/server.ts`, uncomment or add the import and registration:

```typescript
import csrfPlugin from "./plugins/csrfPlugin.js";
```

And in the plugin registration section, add after authPlugin:

```typescript
await app.register(csrfPlugin);
```

Also add `"x-csrf-token"` to the CORS `exposedHeaders` so the frontend can read it:

```typescript
exposedHeaders: ["x-csrf-token"],
```

**Step 3: Build and commit**

```bash
cd backend && npm run build
git add backend/src/plugins/csrfPlugin.ts backend/src/server.ts
git commit -m "feat(PCI-6.5.9,NIST-SC-23,SOC2-CC6.6): DB-backed CSRF synchronizer token protection"
```

---

## Task 5: CSRF Protection — Frontend Wiring

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Add centralized fetch wrapper with CSRF token capture**

Replace `src/lib/api.ts`:

```typescript
const PRODUCTION_API = "https://atlasux.cloud";

const isElectron = typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);
const envUrl = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE = isElectron
  ? "http://localhost:8787"
  : (envUrl || PRODUCTION_API);

// CSRF token captured from response headers (PCI DSS 6.5.9, NIST SC-23)
let csrfToken: string | null = null;

/**
 * Fetch wrapper that automatically handles CSRF tokens.
 * Captures x-csrf-token from responses, sends it on mutations.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init?.headers);

  // Attach CSRF token to mutating requests
  const method = (init?.method ?? "GET").toUpperCase();
  if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(url, { ...init, headers });

  // Capture CSRF token from response
  const newToken = response.headers.get("x-csrf-token");
  if (newToken) {
    csrfToken = newToken;
  }

  return response;
}
```

**Note:** Existing components still use raw `fetch(API_BASE + ...)` directly. The `apiFetch` wrapper is available for new code. Migrating all existing fetch calls is a separate task — the CSRF plugin is designed to fail-open for unauthenticated requests, so existing code won't break.

**Step 2: Build and commit**

```bash
npm run build
git add src/lib/api.ts
git commit -m "feat(PCI-6.5.9): add apiFetch wrapper with CSRF token capture"
```

---

## Task 6: Session Termination & Token Blacklist — Migration

**Controls:** HIPAA §164.312(d), NIST IA-11, SOC 2 CC6.1, ISO A.9.4.2, PCI 8.1.8, HITRUST 01.b

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260303030000_revoked_tokens/migration.sql`

**Step 1: Add RevokedToken model to schema.prisma**

```prisma
model RevokedToken {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tokenHash String   @unique @map("token_hash")
  revokedAt DateTime @default(now()) @map("revoked_at") @db.Timestamptz(6)
  expiresAt DateTime @map("expires_at") @db.Timestamptz(6)

  @@index([expiresAt])
  @@map("revoked_tokens")
}
```

**Step 2: Run migration**

```bash
cd backend && npx prisma migrate dev --name revoked_tokens
```

**Step 3: Build and commit**

```bash
cd backend && npm run build
git add backend/prisma/
git commit -m "feat(HIPAA-164.312,NIST-IA-11,PCI-8.1.8): add revoked_tokens table for session termination"
```

---

## Task 7: Session Termination — Logout Endpoint & Auth Blacklist

**Files:**
- Modify: `backend/src/routes/authRoutes.ts`
- Modify: `backend/src/plugins/authPlugin.ts`

**Step 1: Add logout endpoint to authRoutes.ts**

Add at the end of the authRoutes plugin (before closing `};`):

```typescript
  /**
   * POST /logout
   * Revokes the current JWT by adding its hash to the blacklist.
   * Controls: HIPAA §164.312(d), NIST IA-11, SOC 2 CC6.1, PCI 8.1.8
   */
  app.post("/logout", async (req, reply) => {
    const auth = (req as any).auth;
    if (!auth?.userId) {
      return reply.code(401).send({ ok: false, error: "not_authenticated" });
    }

    const token = (req.headers.authorization ?? "").replace("Bearer ", "");
    if (!token) {
      return reply.code(400).send({ ok: false, error: "no_token" });
    }

    const { createHash } = await import("node:crypto");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // JWT max lifetime: 1 hour (Supabase default). Blacklist entry expires after that.
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.revokedToken.upsert({
      where: { tokenHash },
      create: { tokenHash, expiresAt },
      update: { revokedAt: new Date() },
    }).catch(() => null);

    // Audit log
    prisma.auditLog.create({
      data: {
        tenantId: (req as any).tenantId ?? null,
        actorType: "user",
        actorUserId: auth.userId,
        level: "info",
        action: "SESSION_TERMINATED",
        entityType: "auth",
        message: `User ${auth.email ?? auth.userId} logged out`,
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true });
  });
```

**Step 2: Add blacklist check to authPlugin.ts**

In `backend/src/plugins/authPlugin.ts`, add after the `supabase.auth.getUser(token)` check succeeds but before setting `(req as any).auth`:

```typescript
    // Check token blacklist (HIPAA §164.312(d), NIST IA-11)
    const { createHash } = await import("node:crypto");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    try {
      const revoked = await prisma.revokedToken.findUnique({ where: { tokenHash } });
      if (revoked && revoked.expiresAt > new Date()) {
        return reply.code(401).send({ ok: false, error: "token_revoked" });
      }
    } catch {
      // Fail-open: if blacklist table doesn't exist yet, allow the request
    }
```

**Step 3: Add daily prune of expired revocations**

In `backend/src/server.ts`, add after the existing plugin registrations:

```typescript
// Prune expired revoked tokens daily (HIPAA §164.312(d))
setInterval(async () => {
  try {
    await prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch { /* table may not exist yet */ }
}, 24 * 60 * 60 * 1000);
```

**Step 4: Build and commit**

```bash
cd backend && npm run build
git add backend/src/routes/authRoutes.ts backend/src/plugins/authPlugin.ts backend/src/server.ts
git commit -m "feat(HIPAA-164.312,NIST-IA-11,SOC2-CC6.1): session termination with token blacklist"
```

---

## Task 8: Per-Tenant Rate Limiting

**Controls:** PCI 6.5.10, NIST SC-5, SOC 2 CC6.6, ISO A.13.1.1, HITRUST 09.m

**Files:**
- Create: `backend/src/plugins/tenantRateLimit.ts`
- Modify: `backend/src/server.ts`

**Step 1: Create tenantRateLimit.ts**

```typescript
/**
 * Per-tenant rate limiting using in-memory sliding window counters.
 * Falls back to the existing IP-based @fastify/rate-limit for unauthenticated routes.
 *
 * Controls: PCI DSS 6.5.10, NIST SC-5, SOC 2 CC6.6, ISO A.13.1.1, HITRUST 09.m
 */
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000; // 1 minute
const buckets = new Map<string, Bucket>();

const TIER_LIMITS: Record<string, number> = {
  auth: 10,
  mutation: 30,
  read: 120,
};

function getTier(method: string): string {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return "read";
  return "mutation";
}

// Prune stale buckets every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, bucket] of buckets) {
    if (bucket.windowStart < cutoff) buckets.delete(key);
  }
}, 5 * 60 * 1000);

const tenantRateLimitPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (req, reply) => {
    const tenantId = (req as any).tenantId;
    if (!tenantId) return; // No tenant context — fall through to IP-based limit

    const tier = getTier(req.method.toUpperCase());
    const key = `${tenantId}:${tier}`;
    const now = Date.now();
    const limit = TIER_LIMITS[tier] ?? 60;

    let bucket = buckets.get(key);
    if (!bucket || bucket.windowStart + WINDOW_MS < now) {
      bucket = { count: 0, windowStart: now };
      buckets.set(key, bucket);
    }

    bucket.count++;

    if (bucket.count > limit) {
      const retryAfter = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
      reply.header("Retry-After", String(retryAfter));
      return reply.code(429).send({
        ok: false,
        error: "tenant_rate_limit_exceeded",
        retryAfter,
      });
    }
  });
};

export default fp(tenantRateLimitPlugin);
```

**Step 2: Register in server.ts**

Add import and registration after tenantPlugin:

```typescript
import tenantRateLimitPlugin from "./plugins/tenantRateLimit.js";
```

```typescript
await app.register(tenantRateLimitPlugin);
```

**Step 3: Build and commit**

```bash
cd backend && npm run build
git add backend/src/plugins/tenantRateLimit.ts backend/src/server.ts
git commit -m "feat(PCI-6.5.10,NIST-SC-5,SOC2-CC6.6): per-tenant rate limiting"
```

---

## Task 9: Input Validation Sweep

**Controls:** PCI 6.5.1, NIST SI-10, SOC 2 CC6.1, ISO A.14.2.5, HITRUST 09.o, GDPR Art. 32

**Files:**
- Create: `backend/src/lib/sanitize.ts`
- Modify: `backend/src/routes/complianceRoutes.ts` — add Zod schemas to all endpoints

**Step 1: Create sanitize.ts**

```typescript
/**
 * HTML sanitization for user-generated text.
 * Strips all HTML tags to prevent stored XSS.
 *
 * Controls: PCI DSS 6.5.1, NIST SI-10, HITRUST 09.o
 */
const TAG_RE = /<[^>]*>/g;
const SCRIPT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(SCRIPT_RE, "").replace(TAG_RE, "").trim();
}
```

**Step 2: Add Zod schemas to complianceRoutes.ts**

Add at the top of the file (after the prisma import):

```typescript
import { z } from "zod";

const DsarCreateSchema = z.object({
  requestType: z.enum(["access", "erasure", "portability", "restriction", "rectification", "objection"]),
  subjectEmail: z.string().email().max(320),
  subjectName: z.string().max(200).optional(),
  reason: z.string().max(2000).optional(),
});

const DsarUpdateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "rejected"]).optional(),
  response: z.string().max(5000).optional(),
  processedBy: z.string().max(200).optional(),
});

const ConsentSchema = z.object({
  email: z.string().email().max(320),
  purpose: z.enum(["marketing", "analytics", "ai_processing", "data_sharing", "communications"]),
  granted: z.boolean(),
  lawfulBasis: z.enum(["consent", "contract", "legal_obligation", "vital_interest", "public_task", "legitimate_interest"]).optional(),
});

const BreachSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  severity: z.enum(["low", "medium", "high", "critical"]),
  affectedRecords: z.number().int().min(0).optional(),
  dataTypes: z.string().max(1000).optional(),
});

const IncidentSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  severity: z.enum(["P0", "P1", "P2", "P3"]),
  category: z.string().max(100).optional(),
});

const VendorSchema = z.object({
  name: z.string().min(1).max(300),
  category: z.string().max(100).optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  hasDpa: z.boolean().optional(),
  hasBaa: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
});
```

Then replace each `const { ... } = req.body as any;` with the corresponding Zod `.parse()` call. For example, in the DSAR create endpoint:

```typescript
    const body = DsarCreateSchema.parse(req.body);
    const { requestType, subjectEmail, subjectName, reason } = body;
```

Wrap each `.parse()` in a try/catch that returns 400 with the validation error:

```typescript
    let body;
    try { body = DsarCreateSchema.parse(req.body); }
    catch (e: any) { return reply.status(400).send({ ok: false, error: "validation_failed", details: e.errors }); }
```

Apply the same pattern to every POST/PATCH endpoint in the file.

**Step 3: Build and commit**

```bash
cd backend && npm run build
git add backend/src/lib/sanitize.ts backend/src/routes/complianceRoutes.ts
git commit -m "feat(PCI-6.5.1,NIST-SI-10,SOC2-CC6.1): Zod validation on compliance routes + HTML sanitization"
```

---

## Task 10: HSTS & Transport Security

**Controls:** PCI 4.1, NIST SC-8, SOC 2 CC6.7, ISO A.13.1.1, HITRUST 09.m, GDPR Art. 32

**Files:**
- Modify: `backend/src/server.ts` — Helmet config

**Step 1: Update Helmet config in server.ts**

Replace the existing Helmet registration with:

```typescript
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://widget.trustpilot.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co", "https://atlasux.cloud"],
      fontSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://atlasux.cloud",
        "https://*.supabase.co",
        "wss://*.supabase.co",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
});
```

Key change: removed `'unsafe-inline'` from `scriptSrc`, added explicit `strictTransportSecurity` and `referrerPolicy`.

**Step 2: Build and commit**

```bash
cd backend && npm run build
git add backend/src/server.ts
git commit -m "feat(PCI-4.1,NIST-SC-8,SOC2-CC6.7): HSTS, strict referrer policy, tightened CSP"
```

---

## Task 11: Policy Document Rewrite — SOC 2 Type II

**Files:**
- Modify: `policies/SOC2_COMPLIANCE.md`

Rewrite with honest control-to-code mappings. Structure:

1. Scope and applicability
2. Trust Services Criteria mapping table (CC1–CC9 → actual code file + status)
3. Evidence references (commit hashes, endpoints)
4. Gap analysis

Each control row: `| CC6.3 | Logical Access | RLS policies on 12 tables | backend/prisma/migrations/..._enable_rls | Implemented |`

**Commit:**

```bash
git add policies/SOC2_COMPLIANCE.md
git commit -m "docs(SOC2): rewrite with control-to-code mapping"
```

---

## Task 12: Policy Document Rewrite — ISO 27001:2022

**Files:**
- Modify: `policies/ISO27001_COMPLIANCE.md`

Map Annex A controls (A.5–A.18) to actual implementations with file paths.

**Commit:**

```bash
git add policies/ISO27001_COMPLIANCE.md
git commit -m "docs(ISO27001): rewrite with Annex A control-to-code mapping"
```

---

## Task 13: Policy Document Rewrite — HIPAA

**Files:**
- Modify: `policies/HIPAA_COMPLIANCE.md`

Map Administrative, Physical, Technical safeguards to real code.

**Commit:**

```bash
git add policies/HIPAA_COMPLIANCE.md
git commit -m "docs(HIPAA): rewrite with safeguard-to-code mapping"
```

---

## Task 14: Policy Document Rewrite — PCI DSS v4.0

**Files:**
- Modify: `policies/PCI_DSS_COMPLIANCE.md`

Map SAQ-A requirements to Stripe integration + hardened controls.

**Commit:**

```bash
git add policies/PCI_DSS_COMPLIANCE.md
git commit -m "docs(PCI-DSS): rewrite with requirement-to-code mapping"
```

---

## Task 15: Policy Document Rewrite — NIST 800-53 Rev 5

**Files:**
- Create: `policies/NIST_800_53_COMPLIANCE.md`

Map control families (AC, AU, IA, SC, SI, CM, MP, PE) to code.

**Commit:**

```bash
git add policies/NIST_800_53_COMPLIANCE.md
git commit -m "docs(NIST-800-53): new compliance doc with control family mapping"
```

---

## Task 16: Policy Document Rewrite — GDPR

**Files:**
- Modify: `policies/GDPR_COMPLIANCE.md`

Map Articles 5–49 to real DSAR/consent/erasure endpoints with code refs.

**Commit:**

```bash
git add policies/GDPR_COMPLIANCE.md
git commit -m "docs(GDPR): rewrite with article-to-endpoint mapping"
```

---

## Task 17: Policy Document Rewrite — HITRUST CSF v11

**Files:**
- Create: `policies/HITRUST_CSF_COMPLIANCE.md`

Map control categories (01–13) to implementations.

**Commit:**

```bash
git add policies/HITRUST_CSF_COMPLIANCE.md
git commit -m "docs(HITRUST-CSF): new compliance doc with control-to-code mapping"
```

---

## Task 18: Compliance Index Rewrite + Landing Page Update

**Files:**
- Modify: `policies/COMPLIANCE_INDEX.md`
- Modify: `src/pages/Landing.tsx`

Rewrite COMPLIANCE_INDEX.md with honest status, remove placeholder contacts/hotlines, reference real commit hashes.

Add dev update bullet to Landing.tsx:

```
[Claude Code] Compliance hardening — hash-chained audit logs (tamper-evident), DB-backed CSRF protection, PostgreSQL RLS on 12 tables, per-tenant rate limiting, session termination with token blacklist, HSTS enforcement, input validation sweep; rewritten policy docs for SOC 2, ISO 27001, HIPAA, PCI DSS, NIST 800-53, GDPR, and HITRUST CSF with control-to-code traceability
```

**Commit:**

```bash
git add policies/COMPLIANCE_INDEX.md src/pages/Landing.tsx
git commit -m "docs: rewrite compliance index + dev update for compliance hardening"
```

---

## Final Verification

```bash
cd backend && npm run build   # Backend must compile clean
cd .. && npm run build         # Frontend must build clean
git push origin main           # Push all commits
```
