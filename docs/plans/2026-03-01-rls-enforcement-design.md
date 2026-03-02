# Full RLS Enforcement + withTenant() Migration — Design

**Date:** 2026-03-01
**Author:** Billy E. Whited / Claude Opus 4.6
**Status:** Approved
**Closes:** Compliance gaps 10/11 and 11/11

---

## Problem

Two open compliance gaps remain:

1. `FORCE ROW LEVEL SECURITY` is not enabled — Prisma connects as superuser and bypasses all RLS policies.
2. Not all routes use `withTenant()` — the helper exists but is called by zero routes. All tenant filtering relies on application-level WHERE clauses only.

Additionally, only 12 of 40 tenant-scoped tables have RLS policies defined.

## Approach

**Approach A: Wrap every route handler individually.**

Each route that does DB queries gets its body wrapped in `withTenant(tenantId, async (tx) => { ... })`, replacing `prisma.xxx` with `tx.xxx`. A new Prisma migration adds RLS policies to all missing tables and enables `FORCE ROW LEVEL SECURITY` on every tenant-scoped table.

## Design

### 1. New Prisma Migration

A single migration that:

#### 1a. Adds RLS + policy to 28 missing tables

Tables needing RLS added:
- listener_sources, contact_activities, crm_segments, tenant_members
- ledger_entries, kb_tags, intents, tickets, ticket_comments
- metrics_snapshots, growth_loop_runs, kb_document_versions
- decision_templates, canned_responses, budgets
- tool_proposals, agent_memory, usage_meters, subscriptions
- incident_reports, vendor_assessments
- atlas_conversations, meeting_notes, browser_sessions, browser_actions
- revoked_tokens, token_vault, cloud_seats

Policy pattern (identical to existing):
```sql
CREATE POLICY tenant_isolation ON <table>
  USING (
    current_setting('app.tenant_id', true) IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
```

#### 1b. Enables FORCE ROW LEVEL SECURITY on all 40 tables

```sql
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
```

The `IS NULL` fallback in the policy ensures migrations, workers, and un-scoped system queries still work when `app.tenant_id` is not set.

#### 1c. Tables excluded (no tenant_id)

tenants, users/app_users, oauth_state, workflows, system_state, runtime_state, approvals, enum tables (ledger_entry_type, ledger_category, kb_document_status, ticket_status, ticket_severity, ticket_category, seat_type).

### 2. Route Migration

Every protected route file gets this transformation:

- Import `withTenant` from `../db/prisma.js` (add alongside existing `prisma` import if prisma is still needed for non-tenant queries)
- Wrap DB-query blocks in `withTenant(tid, async (tx) => { ... })`
- Replace `prisma.xxx` with `tx.xxx` inside the callback
- Keep application-level `where: { tenantId }` clauses (defense-in-depth)
- Add `if (!tid)` guard returning 400 where missing

Routes to migrate (~30 files):
- jobsRoutes, filesRoutes, kbRoutes, videoRoutes, engineRoutes
- meetingRoutes, chatRoutes, decisionRoutes, cannedResponseRoutes
- commsRoutes, complianceRoutes, browserRoutes, growthRoutes
- distributionRoutes, agentFlowRoutes, integrationsRoutes, emailRoutes
- listeningRoutes, localAgentRoutes, metricsRoutes, mobileRoutes
- redditRoutes, stripeRoutes, tasksRoutes, teamsRoutes, telegramRoutes
- ticketsRoutes, toolsRoutes, userRoutes, youtubeRoutes

Routes left unchanged (no tenant-scoped DB queries):
- healthRoutes, workflowsRoutes, systemStateRoutes, oauthRoutes
- Webhook-only routes: linkedinRoutes, pinterestRoutes, tumblrRoutes, zoomRoutes

### 3. Bug Fixes

1. **runtimeRoutes.ts** — Add `tenantId` filter to `approvals.count()` query
2. **businessManagerRoutes.ts** — Migrate from legacy slug-based tenant lookup to UUID `req.tenantId`
3. **Webhook audit logs** (tiktok, x) — Use system tenant constant for audit entries from external webhooks

### 4. Compliance Index Update

Mark both gaps as RESOLVED in `COMPLIANCE_INDEX.md`. Update readiness scores:
- GDPR: ~85% → ~90%
- SOC 2: ~75% → ~80%
- ISO 27001: ~65% → ~70%

### 5. Risk Mitigation

- The `IS NULL` fallback means workers (engineLoop, emailSender) that don't set `app.tenant_id` continue to work — they see all rows.
- If a route forgets to call `withTenant()`, FORCE RLS means the query returns all rows (because `IS NULL` = true). This is the same as current behavior, not worse.
- The migration is additive — no data changes, no schema changes, only policy additions.
- Rollback: a single migration that drops the new policies and removes FORCE.
