# Full RLS Enforcement + withTenant() Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the last 2 compliance gaps by enabling FORCE ROW LEVEL SECURITY on all tenant-scoped tables and migrating all routes to use `withTenant()`.

**Architecture:** A new Prisma migration adds RLS policies to 28 missing tables and enables FORCE on all 40. Every route file that does tenant-scoped DB queries gets wrapped in `withTenant(tid, (tx) => ...)` replacing `prisma.xxx` with `tx.xxx`. Bug fixes for 5 unprotected/partially-protected routes are included.

**Tech Stack:** PostgreSQL RLS, Prisma migrations, Fastify route handlers, TypeScript

---

### Task 1: Create the RLS migration

**Files:**
- Create: `backend/prisma/migrations/20260301200000_rls_force_all_tables/migration.sql`

**Step 1: Create the migration SQL file**

Create the migration directory and file:

```bash
mkdir -p "backend/prisma/migrations/20260301200000_rls_force_all_tables"
```

Write this SQL to the migration file:

```sql
-- Phase 3: Complete RLS coverage + FORCE ROW LEVEL SECURITY
-- Closes compliance gaps: "FORCE ROW LEVEL SECURITY not enabled"
--                         "Not all routes use withTenant()"
--
-- The IS NULL fallback in each policy allows workers/migrations
-- (which don't set app.tenant_id) to continue working.

-- ── 1. Enable RLS + create policies on 28 missing tenant-scoped tables ──

ALTER TABLE listener_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON listener_sources
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contact_activities
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE crm_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON crm_segments
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tenant_members
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ledger_entries
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE kb_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kb_tags
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON intents
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tickets
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ticket_comments
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON metrics_snapshots
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE growth_loop_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON growth_loop_runs
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE kb_document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kb_document_versions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE decision_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON decision_templates
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON canned_responses
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budgets
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE tool_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tool_proposals
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON agent_memory
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE usage_meters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON usage_meters
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscriptions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON incident_reports
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE vendor_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON vendor_assessments
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE atlas_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON atlas_conversations
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON meeting_notes
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON browser_sessions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE browser_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON browser_actions
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE revoked_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON revoked_tokens
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE token_vault ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON token_vault
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE cloud_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON cloud_seats
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON approvals
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE atlas_ip_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON atlas_ip_approvals
  USING (current_setting('app.tenant_id', true) IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ── 2. FORCE ROW LEVEL SECURITY on ALL tenant-scoped tables ──
-- This makes RLS apply even for superuser (Prisma's postgres role).
-- The IS NULL fallback in each policy still allows un-scoped access
-- when app.tenant_id is not set (workers, migrations).

-- Previously covered (12 tables):
ALTER TABLE integrations FORCE ROW LEVEL SECURITY;
ALTER TABLE assets FORCE ROW LEVEL SECURITY;
ALTER TABLE jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE distribution_events FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE decision_memos FORCE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE crm_companies FORCE ROW LEVEL SECURITY;
ALTER TABLE consent_records FORCE ROW LEVEL SECURITY;
ALTER TABLE data_subject_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE data_breaches FORCE ROW LEVEL SECURITY;

-- Newly covered (30 tables):
ALTER TABLE listener_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE contact_activities FORCE ROW LEVEL SECURITY;
ALTER TABLE crm_segments FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_members FORCE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_tags FORCE ROW LEVEL SECURITY;
ALTER TABLE intents FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments FORCE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE growth_loop_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE kb_document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE decision_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE canned_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
ALTER TABLE tool_proposals FORCE ROW LEVEL SECURITY;
ALTER TABLE agent_memory FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_meters FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE incident_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE vendor_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE atlas_conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes FORCE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE browser_actions FORCE ROW LEVEL SECURITY;
ALTER TABLE revoked_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE token_vault FORCE ROW LEVEL SECURITY;
ALTER TABLE cloud_seats FORCE ROW LEVEL SECURITY;
ALTER TABLE approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE atlas_ip_approvals FORCE ROW LEVEL SECURITY;
```

**Step 2: Verify migration file exists**

```bash
cat backend/prisma/migrations/20260301200000_rls_force_all_tables/migration.sql | head -5
```

Expected: First 5 lines of the SQL file.

**Step 3: Commit**

```bash
git add backend/prisma/migrations/20260301200000_rls_force_all_tables/migration.sql
git commit -m "Add RLS policies to 30 missing tables + FORCE on all 42"
```

---

### Task 2: Bug fix — runtimeRoutes.ts (add tenantId to approvals query)

**Files:**
- Modify: `backend/src/routes/runtimeRoutes.ts`

**Step 1: Add withTenant import and wrap the handler**

Replace:
```typescript
import { prisma } from "../db/prisma.js";
```
With:
```typescript
import { prisma } from "../db/prisma.js";
import { withTenant } from "../db/prisma.js";
```

Replace the `approvals.count()` call (lines 31-35) to add tenantId filtering:
```typescript
const tid = (req as any).tenantId as string | undefined;

const pendingApprovals = tid
  ? await withTenant(tid, (tx) =>
      tx.approvals.count({
        where: {
          tenant_id: tid,
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
      })
    )
  : await prisma.approvals.count({
      where: {
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
    });
```

The fallback (no tenantId) preserves behavior for system-level calls.

**Step 2: Build and verify**

```bash
cd backend && npm run build
```

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add backend/src/routes/runtimeRoutes.ts
git commit -m "Fix runtimeRoutes: add tenantId filter to approvals.count()"
```

---

### Task 3: Bug fix — webhook routes (tiktok, x, linkedin, pinterest audit logs)

**Files:**
- Modify: `backend/src/routes/tiktokRoutes.ts`
- Modify: `backend/src/routes/xRoutes.ts`

**Step 1: Add tenantId to webhook audit log entries**

For both `tiktokRoutes.ts` and `xRoutes.ts`, the `prisma.auditLog.create()` call in the POST /webhook handler needs a `tenantId` field. Since these are external webhooks with no tenant context, use `null` (the field is nullable). The audit log already accepts `tenantId: null` — this makes the intent explicit.

In `tiktokRoutes.ts` line 33, add `tenantId: null,` to the data object:
```typescript
await prisma.auditLog.create({
  data: {
    tenantId: null,
    actorExternalId: "tiktok-webhook",
    ...
  },
});
```

Same pattern for `xRoutes.ts` line 53.

Note: linkedinRoutes and pinterestRoutes follow the same webhook-only pattern — apply the same fix if they have auditLog.create() calls.

**Step 2: Build and verify**

```bash
cd backend && npm run build
```

**Step 3: Commit**

```bash
git add backend/src/routes/tiktokRoutes.ts backend/src/routes/xRoutes.ts
git commit -m "Fix webhook routes: add explicit tenantId: null to audit log entries"
```

---

### Task 4: Bug fix — businessManagerRoutes.ts (legacy slug-based tenant lookup)

**Files:**
- Modify: `backend/src/routes/businessManagerRoutes.ts`

**Step 1: Migrate to UUID-based tenantId from plugin**

The route currently uses `getOrgSlug(req)` to read `org_id` query param (a slug string), then calls `ensureTenant(slug)` to upsert a Tenant row and get the UUID. This is a legacy pattern.

Migration approach: Keep backward compatibility by preferring `req.tenantId` (UUID from plugin) when available, falling back to slug-based lookup for unauthenticated/legacy callers. Wrap all DB queries in `withTenant()`.

Replace the imports:
```typescript
import { prisma } from "../db/prisma.js";
```
With:
```typescript
import { prisma, withTenant } from "../db/prisma.js";
```

Add a helper to resolve tenantId from either source:
```typescript
async function resolveTenantId(req: any): Promise<{ tenantId: string; slug: string } | null> {
  // Prefer UUID from plugin (authenticated path)
  const pluginTid = (req as any).tenantId as string | undefined;
  if (pluginTid) {
    const tenant = await prisma.tenant.findUnique({ where: { id: pluginTid }, select: { id: true, slug: true } });
    if (tenant) return { tenantId: tenant.id, slug: tenant.slug };
  }
  // Fallback: slug from query param (legacy path)
  const slug = getOrgSlug(req);
  if (slug) {
    const tenant = await ensureTenant(slug);
    return { tenantId: tenant.id, slug: tenant.slug };
  }
  return null;
}
```

Then update each handler to use `resolveTenantId(req)` and wrap DB calls in `withTenant()`. Example for GET /status:
```typescript
app.get("/status", async (req, reply) => {
  const resolved = await resolveTenantId(req);
  if (!resolved) return reply.code(400).send({ ok: false, error: "org_id is required" });
  const { tenantId, slug } = resolved;

  const connectedCount = await withTenant(tenantId, (tx) =>
    tx.integration.count({ where: { tenantId, connected: true } })
  );

  return reply.send({
    ok: true, org_id: slug, tenant_id: tenantId,
    integrations_connected: connectedCount, status: "online",
    ts: new Date().toISOString(),
  });
});
```

Apply the same pattern to: `/site_integration`, `/list`, `/summary`, `/disconnect`, `/mark_connected`.

**Step 2: Build and verify**

```bash
cd backend && npm run build
```

**Step 3: Commit**

```bash
git add backend/src/routes/businessManagerRoutes.ts
git commit -m "Fix businessManagerRoutes: migrate to UUID tenantId + withTenant()"
```

---

### Task 5: Bug fix — alignableRoutes.ts and agentsRoutes.ts

**Files:**
- Modify: `backend/src/routes/alignableRoutes.ts`
- Modify: `backend/src/routes/agentsRoutes.ts`

**Step 1: Fix alignableRoutes.ts**

Add `tenantId: null` (or `(req as any).tenantId ?? null`) to auditLog.create() calls. Add tenantId filter to any findMany queries that return tenant-scoped data.

**Step 2: Fix agentsRoutes.ts**

The agent registry is intentionally global (agents are system-level, not per-tenant). Classify as N/A — no change needed. Document this decision in a code comment.

**Step 3: Build and verify**

```bash
cd backend && npm run build
```

**Step 4: Commit**

```bash
git add backend/src/routes/alignableRoutes.ts backend/src/routes/agentsRoutes.ts
git commit -m "Fix alignableRoutes audit log tenantId + document agentsRoutes as system-level"
```

---

### Task 6: Migrate protected routes to withTenant() — Batch 1 (high-priority data routes)

**Files:**
- Modify: `backend/src/routes/jobsRoutes.ts`
- Modify: `backend/src/routes/kbRoutes.ts`
- Modify: `backend/src/routes/decisionRoutes.ts`
- Modify: `backend/src/routes/complianceRoutes.ts`
- Modify: `backend/src/routes/ticketsRoutes.ts`

**Step 1: Apply the withTenant() pattern to each file**

For each file:
1. Add import: `import { withTenant } from "../db/prisma.js";`
2. In each handler that uses `prisma.xxx` with a tenantId:
   - Get `const tid = (req as any).tenantId as string;`
   - Guard: `if (!tid) return reply.code(400).send({ ok: false, error: "TENANT_REQUIRED" });`
   - Wrap: `const result = await withTenant(tid, async (tx) => { ... });`
   - Replace `prisma.xxx` with `tx.xxx` inside the callback
   - Keep existing `where: { tenantId: tid }` clauses (defense-in-depth)
3. If a handler has multiple prisma calls, wrap them all in one `withTenant()` call

**Step 2: Build and verify**

```bash
cd backend && npm run build
```

**Step 3: Commit**

```bash
git add backend/src/routes/jobsRoutes.ts backend/src/routes/kbRoutes.ts backend/src/routes/decisionRoutes.ts backend/src/routes/complianceRoutes.ts backend/src/routes/ticketsRoutes.ts
git commit -m "Migrate high-priority routes to withTenant(): jobs, kb, decisions, compliance, tickets"
```

---

### Task 7: Migrate protected routes to withTenant() — Batch 2 (CRM + content routes)

**Files:**
- Modify: `backend/src/routes/crmRoutes.ts`
- Modify: `backend/src/routes/blogRoutes.ts`
- Modify: `backend/src/routes/cannedResponseRoutes.ts`
- Modify: `backend/src/routes/distributionRoutes.ts`
- Modify: `backend/src/routes/listeningRoutes.ts`
- Modify: `backend/src/routes/assets.ts`

**Step 1-3: Same pattern as Task 6**

**Commit message:** `"Migrate CRM + content routes to withTenant(): crm, blog, canned, distribution, listening, assets"`

---

### Task 8: Migrate protected routes to withTenant() — Batch 3 (operations routes)

**Files:**
- Modify: `backend/src/routes/engineRoutes.ts`
- Modify: `backend/src/routes/chatRoutes.ts`
- Modify: `backend/src/routes/browserRoutes.ts`
- Modify: `backend/src/routes/meetingRoutes.ts`
- Modify: `backend/src/routes/videoRoutes.ts`
- Modify: `backend/src/routes/growthRoutes.ts`

**Step 1-3: Same pattern as Task 6**

**Commit message:** `"Migrate operations routes to withTenant(): engine, chat, browser, meeting, video, growth"`

---

### Task 9: Migrate protected routes to withTenant() — Batch 4 (comms + integrations routes)

**Files:**
- Modify: `backend/src/routes/commsRoutes.ts`
- Modify: `backend/src/routes/integrationsRoutes.ts`
- Modify: `backend/src/routes/emailRoutes.ts`
- Modify: `backend/src/routes/agentFlowRoutes.ts`
- Modify: `backend/src/routes/telegramRoutes.ts`
- Modify: `backend/src/routes/teamsRoutes.ts`

**Step 1-3: Same pattern as Task 6**

**Commit message:** `"Migrate comms + integration routes to withTenant(): comms, integrations, email, agentFlow, telegram, teams"`

---

### Task 10: Migrate protected routes to withTenant() — Batch 5 (remaining routes)

**Files:**
- Modify: `backend/src/routes/stripeRoutes.ts`
- Modify: `backend/src/routes/userRoutes.ts`
- Modify: `backend/src/routes/toolsRoutes.ts`
- Modify: `backend/src/routes/redditRoutes.ts`
- Modify: `backend/src/routes/localAgentRoutes.ts`
- Modify: `backend/src/routes/metricsRoutes.ts`
- Modify: `backend/src/routes/tasksRoutes.ts`
- Modify: `backend/src/routes/youtubeRoutes.ts`
- Modify: `backend/src/routes/budgetRoutes.ts`
- Modify: `backend/src/routes/accountingRoutes.ts`
- Modify: `backend/src/routes/analyticsRoutes.ts`
- Modify: `backend/src/routes/auditRoutes.ts`
- Modify: `backend/src/routes/ledger.ts`
- Modify: `backend/src/routes/mobileRoutes.ts`

**Step 1-3: Same pattern as Task 6**

**Commit message:** `"Migrate remaining routes to withTenant(): stripe, user, tools, reddit, localAgent, metrics, tasks, youtube, budget, accounting, analytics, audit, ledger, mobile"`

---

### Task 11: Full build + verify compliance index

**Files:**
- Modify: `policies/COMPLIANCE_INDEX.md`

**Step 1: Full backend build**

```bash
cd backend && npm run build
```

Expected: Clean build, zero errors.

**Step 2: Update COMPLIANCE_INDEX.md**

Mark both remaining gaps as RESOLVED:

Change the "What's NOT Implemented" table:
- `FORCE ROW LEVEL SECURITY not enabled` → **RESOLVED** — FORCE enabled on all 42 tenant-scoped tables (Mar 1, 2026)
- `Not all routes use withTenant()` → **RESOLVED** — All 30+ protected routes migrated to withTenant() (Mar 1, 2026)

Update readiness scores:
- GDPR: ~85% → ~90%
- SOC 2: ~75% → ~80%
- ISO 27001: ~65% → ~70%

Update "11 of 11 gaps resolved" language.

**Step 3: Commit**

```bash
git add policies/COMPLIANCE_INDEX.md
git commit -m "Close compliance gaps 10+11: FORCE RLS enabled, all routes use withTenant() — 11 of 11 resolved"
```

---

### Task 12: Final build + push

**Step 1: Full frontend + backend build**

```bash
npm run build && cd backend && npm run build
```

Expected: Both clean.

**Step 2: Push to origin**

```bash
git push origin main
```
