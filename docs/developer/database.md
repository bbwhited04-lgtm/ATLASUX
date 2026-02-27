# Database Guide

Atlas UX uses PostgreSQL 16 as its primary database, managed through Prisma ORM. In production the database is hosted on Supabase with PgBouncer for connection pooling.

## Schema Location

The Prisma schema is at `backend/prisma/schema.prisma` (30KB+, 30+ models).

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // PgBouncer URL (pooled)
  directUrl = env("DIRECT_URL")      // Direct connection (migrations)
}
```

## Key Tables

### `tenants`

Root entity for multi-tenancy. Every other table has a `tenant_id` FK pointing here.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key (auto-generated) |
| `slug` | String | Unique tenant slug |
| `name` | String | Display name |

### `jobs`

Async work queue. Workers poll this table for work.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | FK to tenants |
| `job_type` | String | e.g. `EMAIL_SEND`, `ENGINE_RUN` |
| `status` | Enum | `queued`, `running`, `succeeded`, `failed` |
| `priority` | Int | Higher = processed first |
| `input` | JSON | Job payload |
| `output` | JSON | Result after completion |
| `error` | JSON | Error details on failure |
| `retry_count` | Int | Current retry attempt |
| `max_retries` | Int | Default 3 |
| `next_retry_at` | Timestamp | Exponential backoff schedule |

### `audit_log`

Immutable append-only log of all system activity.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Nullable (some system events are tenant-less) |
| `actor_user_id` | UUID | FK to app_users (nullable) |
| `actor_external_id` | String | Non-DB actor identifier |
| `actor_type` | String | `user` or `system` |
| `level` | AuditLevel | `info`, `warn`, `error`, `security` |
| `action` | String | e.g. `ENGINE_CLAIMED_INTENT`, `EMAIL_SENT` |
| `entity_type` | String | e.g. `intent`, `job`, `agent` |
| `entity_id` | UUID | Related entity |
| `meta` | JSON | Additional context |

### `intents`

Engine intent queue. Each row represents an action waiting to be processed.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | FK to tenants |
| `agent_id` | UUID | Requesting agent (nullable) |
| `intent_type` | String | e.g. `ENGINE_RUN`, `CHAT_CALL` |
| `payload` | JSON | Intent parameters |
| `sgl_result` | String | SGL decision after evaluation |
| `status` | String | `DRAFT` -> `VALIDATING` -> `EXECUTED`/`FAILED`/`BLOCKED_SGL`/`AWAITING_HUMAN` |

### `decision_memos`

Approval workflow for high-risk actions.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | FK to tenants |
| `agent` | String | Requesting agent name |
| `title` | String | Decision title |
| `rationale` | String | Why this action is needed |
| `estimated_cost_usd` | Float | Projected cost |
| `risk_tier` | Int | 0 = low, higher = more risk |
| `requires_approval` | Boolean | Human approval needed |
| `status` | String | `PROPOSED`, `APPROVED`, `REJECTED` |
| `job_id` | UUID | FK to source job (nullable) |
| `intent_id` | UUID | FK to source intent (nullable) |

### `agent_registry`

Agent definitions per tenant.

### `kb_documents`

Knowledge base articles with title, slug, body, status (`draft`/`published`/`archived`), and tenant scoping. Tags are managed via `kb_tags` and the join table `kb_tag_on_document`.

### `integrations`

OAuth integration state per tenant. Stores provider name, access/refresh tokens, scopes, and config. Unique constraint on `(tenant_id, provider)`.

### Other Notable Tables

- `crm_contacts`, `crm_companies`, `crm_segments` — CRM data
- `ledger_entries` — Financial ledger (amount in cents)
- `assets` — Business assets (URLs, metrics)
- `tenant_members` — User-to-tenant membership with role and seat type
- `tickets`, `ticket_comments` — Support ticket system
- `budgets` — Budget tracking
- `approvals` — Intent approval records

## Migrations

```bash
cd backend

# Create and apply a new migration
npx prisma migrate dev --name describe_your_change

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset database (destroys all data)
npx prisma migrate reset
```

## Enums

Key Prisma enums defined in the schema:

- `job_status`: `queued`, `running`, `succeeded`, `failed`
- `AuditLevel`: `info`, `warn`, `error`, `security`
- `LedgerEntryType`, `LedgerCategory`: Financial categorization
- `KbDocumentStatus`: `draft`, `published`, `archived`
- `TicketStatus`, `TicketSeverity`, `TicketCategory`: Ticket management
- `SeatType`: `free_beta`, `pro`, `enterprise`
