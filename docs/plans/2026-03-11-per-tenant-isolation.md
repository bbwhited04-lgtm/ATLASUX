# Per-Tenant Isolation — Full Multi-Tenancy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Atlas UX from a single-tenant system into a true multi-tenant SaaS where each customer gets their own isolated agents, workflows, credentials, scheduler, and integrations — with zero cross-tenant leakage.

**Architecture:** Add a `tenant_credentials` table for per-tenant API key storage. Create a `tenant_agent_config` table for per-tenant agent enablement/customization. Create a `tenant_workflow_config` table for per-tenant workflow enablement. Refactor all `process.env` credential lookups into a tenant-scoped credential resolver that falls back to env vars for the platform owner. Make the scheduler tenant-aware by iterating over active tenants. Add per-tenant Slack workspace support.

**Tech Stack:** Prisma (PostgreSQL), Fastify, TypeScript, existing multi-tenant DB schema

**Phases:**
- Phase 1: Tenant Credential Store (foundation — everything else depends on this)
- Phase 2: Tenant Agent Config (which agents each tenant gets)
- Phase 3: Tenant Workflow Config (which workflows each tenant can run)
- Phase 4: Credential Resolver (swap process.env for tenant-scoped lookups)
- Phase 5: Per-Tenant Scheduler
- Phase 6: Per-Tenant Slack
- Phase 7: Per-Tenant Email
- Phase 8: Admin Onboarding API (provision new tenants with config)

**Owner tenant ID:** `9a8a332c-c47d-4792-a0d4-56ad4e4a3391` — this tenant always gets full access, env var fallback, and is never restricted.

---

## Phase 1: Tenant Credential Store

The foundation. Every external service call needs to resolve credentials per-tenant instead of reading `process.env` directly.

### Task 1.1: Create Prisma migration for `tenant_credentials` table

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: Migration via `npx prisma migrate dev`

**Step 1: Add model to schema.prisma**

Add after the `Integration` model (~line 161):

```prisma
/// Per-tenant API credentials for external services.
/// Platform owner's credentials live in process.env as fallback.
model TenantCredential {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  provider   String   /// e.g. "postiz", "openai", "slack", "twilio", "flux1", "serp"
  key        String   /// encrypted API key or token
  label      String?  /// human-readable label ("My Postiz Key")
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@unique([tenantId, provider])
  @@map("tenant_credentials")
}
```

Also add the relation to the Tenant model:
```prisma
credentials  TenantCredential[]
```

**Step 2: Run migration**

```bash
cd backend && npx prisma migrate dev --name add_tenant_credentials
```

**Step 3: Verify**

```bash
npx prisma generate
npm run build
```

**Step 4: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add tenant_credentials table for per-tenant API key storage"
```

---

### Task 1.2: Create credential resolver service

**Files:**
- Create: `backend/src/services/credentialResolver.ts`

**Step 1: Write the resolver**

```typescript
/**
 * Tenant-scoped credential resolver.
 *
 * Lookup order:
 *   1. tenant_credentials table (per-tenant key)
 *   2. process.env fallback (platform owner only)
 *
 * The OWNER_TENANT_ID always falls through to process.env if no
 * tenant-specific credential exists. Other tenants get null if
 * no credential is stored — they must bring their own keys.
 */

import { prisma } from "../db/prisma.js";

const OWNER_TENANT_ID = process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391";

/** Maps provider names to their process.env key names */
const ENV_FALLBACK_MAP: Record<string, string> = {
  postiz:       "POSTIZ_API_KEY",
  openai:       "OPENAI_API_KEY",
  anthropic:    "ANTHROPIC_API_KEY",
  deepseek:     "DEEPSEEK_API_KEY",
  openrouter:   "OPENROUTER_API_KEY",
  cerebras:     "CEREBRAS_API_KEY",
  slack:        "SLACK_BOT_TOKEN",
  twilio_sid:   "TWILIO_ACCOUNT_SID",
  twilio_token: "TWILIO_AUTH_TOKEN",
  twilio_from:  "TWILIO_FROM_NUMBER",
  flux1:        "FLUX1_API_KEY",
  serp:         "SERP_API_KEY",
  resend:       "RESEND_API_KEY",
  sendgrid:     "SENDGRID_API_KEY",
  gemini:       "GEMINI_API_KEY",
  pinecone:     "PINECONE_API_KEY",
  stability:    "STABILITY_API_KEY",
  newsdata:     "NEWSDATA_API_KEY",
  tavily:       "TAVILY_API_KEY",
};

// In-memory cache: tenantId:provider → key (TTL 5 min)
const cache = new Map<string, { key: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolve a credential for a given tenant + provider.
 *
 * @returns The API key/token string, or null if not available.
 */
export async function resolveCredential(
  tenantId: string,
  provider: string,
): Promise<string | null> {
  const cacheKey = `${tenantId}:${provider}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.key;
  }

  // 1. Check tenant_credentials table
  try {
    const row = await prisma.tenantCredential.findUnique({
      where: { tenantId_provider: { tenantId, provider } },
      select: { key: true, isActive: true },
    });
    if (row?.isActive && row.key) {
      cache.set(cacheKey, { key: row.key, expiresAt: Date.now() + CACHE_TTL_MS });
      return row.key;
    }
  } catch {
    // DB error — fall through to env
  }

  // 2. Env fallback (owner tenant only)
  if (tenantId === OWNER_TENANT_ID) {
    const envKey = ENV_FALLBACK_MAP[provider];
    const envVal = envKey ? (process.env[envKey]?.trim() || null) : null;
    cache.set(cacheKey, { key: envVal, expiresAt: Date.now() + CACHE_TTL_MS });
    return envVal;
  }

  // 3. Non-owner tenant with no stored credential → null
  cache.set(cacheKey, { key: null, expiresAt: Date.now() + CACHE_TTL_MS });
  return null;
}

/**
 * Resolve a credential or throw if not available.
 * Use this when the credential is required for the operation.
 */
export async function requireCredential(
  tenantId: string,
  provider: string,
): Promise<string> {
  const key = await resolveCredential(tenantId, provider);
  if (!key) {
    throw new Error(
      `No ${provider} credential configured for tenant ${tenantId.slice(0, 8)}. ` +
      `Please add your ${provider} API key in Settings > Integrations.`
    );
  }
  return key;
}

/** Clear cache for a tenant (call after credential update). */
export function clearCredentialCache(tenantId?: string) {
  if (tenantId) {
    for (const k of cache.keys()) {
      if (k.startsWith(`${tenantId}:`)) cache.delete(k);
    }
  } else {
    cache.clear();
  }
}
```

**Step 2: Build and verify**

```bash
cd backend && npm run build
```

**Step 3: Commit**

```bash
git add backend/src/services/credentialResolver.ts
git commit -m "feat: add tenant-scoped credential resolver with env fallback for owner"
```

---

### Task 1.3: Create credentials management API routes

**Files:**
- Create: `backend/src/routes/credentialRoutes.ts`
- Modify: `backend/src/server.ts` (register route)

**Step 1: Write the route file**

```typescript
import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { clearCredentialCache } from "../services/credentialResolver.js";

/** Providers that tenants can configure */
const ALLOWED_PROVIDERS = new Set([
  "postiz", "openai", "anthropic", "deepseek", "openrouter",
  "slack", "twilio_sid", "twilio_token", "twilio_from",
  "flux1", "serp", "resend", "sendgrid", "gemini",
  "pinecone", "stability", "newsdata", "tavily",
]);

export const credentialRoutes: FastifyPluginAsync = async (app) => {
  /** GET / — list tenant's configured credentials (keys redacted) */
  app.get("/", async (req) => {
    const tenantId = (req as any).tenantId as string;
    const rows = await prisma.tenantCredential.findMany({
      where: { tenantId },
      select: { id: true, provider: true, label: true, isActive: true, createdAt: true, updatedAt: true },
      orderBy: { provider: "asc" },
    });
    return { ok: true, credentials: rows };
  });

  /** PUT /:provider — upsert a credential */
  app.put("/:provider", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const provider = (req.params as any).provider as string;
    const { key, label } = (req.body ?? {}) as { key?: string; label?: string };

    if (!ALLOWED_PROVIDERS.has(provider)) {
      return reply.code(400).send({ ok: false, error: `Unknown provider: ${provider}` });
    }
    if (!key || typeof key !== "string" || key.trim().length < 4) {
      return reply.code(400).send({ ok: false, error: "Invalid API key" });
    }

    const row = await prisma.tenantCredential.upsert({
      where: { tenantId_provider: { tenantId, provider } },
      create: { tenantId, provider, key: key.trim(), label: label?.trim() ?? null, isActive: true },
      update: { key: key.trim(), label: label?.trim() ?? undefined, isActive: true },
    });

    clearCredentialCache(tenantId);

    // Audit
    prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "user",
        level: "info",
        action: "CREDENTIAL_UPSERTED",
        entityType: "tenant_credential",
        entityId: row.id,
        message: `Credential for ${provider} ${row.id ? "updated" : "created"}`,
        meta: { provider },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return { ok: true, provider, active: true };
  });

  /** DELETE /:provider — remove a credential */
  app.delete("/:provider", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const provider = (req.params as any).provider as string;

    try {
      await prisma.tenantCredential.delete({
        where: { tenantId_provider: { tenantId, provider } },
      });
    } catch {
      return reply.code(404).send({ ok: false, error: "Credential not found" });
    }

    clearCredentialCache(tenantId);
    return { ok: true, deleted: provider };
  });
};
```

**Step 2: Register in server.ts**

Add import and registration alongside other routes.

**Step 3: Build and verify**

```bash
cd backend && npm run build
```

**Step 4: Commit**

```bash
git add backend/src/routes/credentialRoutes.ts backend/src/server.ts
git commit -m "feat: add /v1/credentials API for per-tenant API key management"
```

---

## Phase 2: Tenant Agent Config

### Task 2.1: Create `tenant_agent_config` table

**Files:**
- Modify: `backend/prisma/schema.prisma`

**Add model:**

```prisma
/// Per-tenant agent enablement and customization.
/// If no row exists for a tenant+agent, the agent is disabled for that tenant.
model TenantAgentConfig {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String   @map("tenant_id") @db.Uuid
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  agentId    String   @map("agent_id")       /// matches agents/registry.ts id
  enabled    Boolean  @default(true)
  customName String?  @map("custom_name")    /// tenant can rename their agent
  config     Json     @default("{}")         /// custom tools, permissions overrides
  createdAt  DateTime @default(now()) @map("created_at")

  @@unique([tenantId, agentId])
  @@map("tenant_agent_config")
}
```

**Run migration, generate, build, commit.**

---

### Task 2.2: Create agent config resolver

**Files:**
- Create: `backend/src/services/agentConfigResolver.ts`

Logic:
- Owner tenant: gets ALL agents from global registry (always)
- Other tenants: only get agents that have a row in `tenant_agent_config` with `enabled=true`
- New tenant provisioning (Task 8.1) will seed default agent config rows

---

### Task 2.3: Wire agent config into engine and Slack worker

**Files:**
- Modify: `backend/src/core/engine/engine.ts` — check agent is enabled for tenant before executing
- Modify: `backend/src/workers/slackWorker.ts` — filter agent responses to only enabled agents

---

## Phase 3: Tenant Workflow Config

### Task 3.1: Create `tenant_workflow_config` table

**Files:**
- Modify: `backend/prisma/schema.prisma`

```prisma
/// Per-tenant workflow enablement.
/// If no row exists, workflow is disabled for that tenant.
model TenantWorkflowConfig {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  workflowId  String   @map("workflow_id")   /// e.g. "WF-200"
  enabled     Boolean  @default(true)
  config      Json     @default("{}")        /// workflow-specific overrides
  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([tenantId, workflowId])
  @@map("tenant_workflow_config")
}
```

**Run migration, generate, build, commit.**

---

### Task 3.2: Wire workflow config into engine

**Files:**
- Modify: `backend/src/core/engine/engine.ts`

Before executing a workflow handler, check `tenant_workflow_config` for the tenant. If no row or `enabled=false`, reject with `WORKFLOW_NOT_ENABLED`. Owner tenant bypasses this check.

---

## Phase 4: Credential Resolver Integration

### Task 4.1: Refactor workflow registry to use `resolveCredential`

**Files:**
- Modify: `backend/src/workflows/registry.ts`

Replace every `process.env.POSTIZ_API_KEY`, `process.env.SLACK_BOT_TOKEN`, etc. with:
```typescript
const postizKey = await resolveCredential(ctx.tenantId, "postiz");
if (!postizKey) return { ok: false, message: "No Postiz API key configured. Add it in Settings > Integrations." };
```

WorkflowContext already has `tenantId`, so this flows naturally.

**Target replacements (16 env vars in registry.ts):**
- `POSTIZ_API_KEY` → `resolveCredential(ctx.tenantId, "postiz")`
- `SLACK_BOT_TOKEN` → `resolveCredential(ctx.tenantId, "slack")`
- `OPENAI_API_KEY` → `resolveCredential(ctx.tenantId, "openai")`
- `GEMINI_API_KEY` → `resolveCredential(ctx.tenantId, "gemini")`
- `TWILIO_*` → `resolveCredential(ctx.tenantId, "twilio_*")`
- etc.

---

### Task 4.2: Refactor agent email lookup to be tenant-scoped

**Files:**
- Modify: `backend/src/workflows/registry.ts`

Replace `agentEmail(agentId)` (which reads `process.env`) with a tenant-scoped lookup:
1. Check `tenant_agent_config.config.email` for the tenant
2. Fall back to `process.env.AGENT_EMAIL_*` for owner tenant only

---

### Task 4.3: Refactor LLM provider to use credential resolver

**Files:**
- Modify: `backend/src/core/engine/brainllm.ts`

The `callProvider()` function currently reads API keys from `process.env`. Add `tenantId` to the call chain and resolve keys per-tenant.

---

## Phase 5: Per-Tenant Scheduler

### Task 5.1: Make scheduler iterate over active tenants

**Files:**
- Modify: `backend/src/workers/schedulerWorker.ts`

Replace:
```typescript
const RESOLVED_TENANT_ID = TENANT_ID || "9a8a332c-...";
```

With:
```typescript
// On each tick, fetch all active tenants with enabled scheduling
const tenants = await prisma.tenant.findMany({
  where: { /* active, has subscription or free_beta */ },
  select: { id: true },
});

for (const tenant of tenants) {
  // Check which workflows are enabled for this tenant
  // Fire only those jobs
}
```

Owner tenant always runs the full schedule. Other tenants run only their enabled workflows.

---

## Phase 6: Per-Tenant Slack

### Task 6.1: Add tenant Slack config to credentials

Tenants store their own `SLACK_BOT_TOKEN` via the credentials API. The Slack worker resolves the token per-tenant.

### Task 6.2: Refactor Slack worker for multi-tenant

The Slack worker currently polls one workspace. For multi-tenant:
- Each tenant with a Slack credential gets their own polling loop
- Or: single worker iterates over tenants with Slack configured

---

## Phase 7: Per-Tenant Email

### Task 7.1: Add email config to tenant_agent_config

Each tenant's agents can have custom email addresses stored in `tenant_agent_config.config.email`. The `queueEmail` function resolves the sender per-tenant.

Owner tenant falls back to `@deadapp.info` addresses.

---

## Phase 8: Admin Onboarding API

### Task 8.1: Tenant provisioning seeds default config

**Files:**
- Modify: `backend/src/routes/authRoutes.ts`

When a new tenant is provisioned (`POST /v1/auth/provision`):
1. Create tenant
2. Create tenant_member (owner, free_beta)
3. Seed `tenant_agent_config` rows for allowed agents (based on seat tier)
4. Seed `tenant_workflow_config` rows for allowed workflows (based on seat tier)
5. No credentials seeded — user adds their own in Settings

### Task 8.2: Seat upgrade re-seeds config

When a user upgrades from free_beta → starter → pro:
- Add newly unlocked agent config rows
- Add newly unlocked workflow config rows
- Audit log the change

---

## Execution Priority

**Do first (unblocks everything):**
1. Phase 1: Tenant Credential Store (Tasks 1.1–1.3)
2. Phase 2: Tenant Agent Config (Tasks 2.1–2.3)
3. Phase 3: Tenant Workflow Config (Tasks 3.1–3.2)

**Do second (makes it real):**
4. Phase 4: Credential Resolver Integration (Tasks 4.1–4.3)
5. Phase 8: Admin Onboarding API (Tasks 8.1–8.2)

**Do third (polish):**
6. Phase 5: Per-Tenant Scheduler
7. Phase 6: Per-Tenant Slack
8. Phase 7: Per-Tenant Email

---

## Testing Strategy

Each phase should be tested by:
1. Creating a test tenant via `/v1/auth/provision`
2. Verifying the test tenant CANNOT access owner resources
3. Verifying the test tenant CAN access their own resources
4. Verifying the owner tenant still works exactly as before (regression)
5. Verifying credential resolver falls back to env vars for owner
6. Verifying credential resolver returns null for non-owner tenants without keys
