# Database Schema

Atlas UX uses PostgreSQL (hosted on Supabase) with Prisma ORM. The schema is defined in `backend/prisma/schema.prisma` and is over 30KB, covering 25+ models across multi-tenant business operations, AI orchestration, CRM, content management, and financial tracking.

## Key Models

### Tenant

The root entity for multi-tenancy. Every business organization is a tenant.

```prisma
model Tenant {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug      String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
  // ... 20+ relation fields
  @@map("tenants")
}
```

### TenantMember

Maps users to tenants with role and seat type. Composite primary key on `(tenantId, userId)`.

```prisma
model TenantMember {
  tenantId String   @map("tenant_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  role     String   @default("member")
  seatType SeatType @default(free_beta) @map("seat_type")
  @@id([tenantId, userId])
  @@map("tenant_members")
}
```

### Job

The async job queue. Workers poll this table for pending work.

```prisma
model Job {
  id         String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId   String     @map("tenant_id") @db.Uuid
  status     job_status @default(queued)
  jobType    String     @map("job_type")
  priority   Int        @default(0)
  input      Json       @default("{}")
  output     Json       @default("{}")
  error      Json       @default("{}")
  retryCount Int        @default(0) @map("retry_count")
  maxRetries Int        @default(3) @map("max_retries")
  nextRetryAt DateTime? @map("next_retry_at")
  @@index([tenantId, status], map: "jobs_tenant_status_idx")
  @@index([status, nextRetryAt], map: "jobs_retry_idx")
  @@map("jobs")
}
```

Job statuses: `queued` -> `running` -> `succeeded` | `failed`

### AuditLog

Immutable audit trail for all system activity. Required for Alpha compliance.

```prisma
model AuditLog {
  id              String     @id @db.Uuid
  tenantId        String?    @map("tenant_id") @db.Uuid
  actorUserId     String?    @map("actor_user_id") @db.Uuid
  actorExternalId String?    @map("actor_external_id")
  actorType       String?    @default("user")
  level           AuditLevel @default(info)
  action          String
  entityType      String?    @map("entity_type")
  entityId        String?    @map("entity_id") @db.Uuid
  message         String?
  meta            Json       @default("{}")
  @@index([tenantId, createdAt(sort: Desc)])
  @@map("audit_log")
}
```

### Intent

The engine's work queue. Agents create intents; the engine loop processes them.

```prisma
model Intent {
  id         String  @id @db.Uuid
  tenantId   String  @map("tenant_id") @db.Uuid
  agentId    String? @map("agent_id") @db.Uuid
  intentType String? @map("intent_type")
  payload    Json?
  sglResult  String? @map("sgl_result")
  status     String? @default("DRAFT")
  @@index([status, createdAt])
  @@map("intents")
}
```

### DecisionMemo

Approval workflow for high-risk actions. Links to both intents and jobs.

```prisma
model DecisionMemo {
  id        String @id @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  agent     String
  title     String
  rationale String
  // ... risk assessment fields, approval status
  @@map("decision_memos")
}
```

### Integration

OAuth token storage for third-party platform connections (X, Meta, LinkedIn, etc.).

```prisma
model Integration {
  id           String   @id @db.Uuid
  tenantId     String   @map("tenant_id") @db.Uuid
  provider     String   // TEXT type (was enum, migrated)
  connected    Boolean  @default(false)
  access_token String?
  refresh_token String?
  scopes       Json     @default("[]")
  config       Json     @default("{}")
  @@unique([tenantId, provider])
  @@map("integrations")
}
```

### KbDocument

Knowledge base documents with tagging support and publication workflow.

```prisma
model KbDocument {
  id        String           @id @db.Uuid
  tenantId  String           @map("tenant_id") @db.Uuid
  title     String
  slug      String
  body      String
  status    KbDocumentStatus @default(draft) // draft | published | archived
  createdBy String           @map("created_by") @db.Uuid
  @@unique([tenantId, slug])
  @@map("kb_documents")
}
```

## Enums

```prisma
enum AuditLevel { info warn error }
enum job_status { queued running succeeded failed cancelled }
enum SeatType { free_beta pro enterprise }
enum KbDocumentStatus { draft published archived }
enum LedgerEntryType { income expense refund credit debit }
enum LedgerCategory { ai_usage subscription tools marketing ... }
```

## Naming Conventions

| Convention        | Example                        | Notes                                |
|-------------------|--------------------------------|--------------------------------------|
| Prisma model      | `KbDocument`                   | PascalCase                           |
| DB table          | `kb_documents`                 | snake_case via `@@map()`             |
| Prisma field      | `tenantId`                     | camelCase                            |
| DB column         | `tenant_id`                    | snake_case via `@map()`              |
| UUID columns      | `@db.Uuid`                     | All IDs are PostgreSQL UUID          |
| Timestamps        | `@db.Timestamptz(6)`           | Timezone-aware, microsecond precision|

## Migrations Workflow

```bash
# Create a new migration after editing schema.prisma
cd backend
npx prisma migrate dev --name describe_your_change

# Apply migrations in production
npx prisma migrate deploy

# View the database in a GUI
npx prisma studio

# Reset the database (destructive!)
npx prisma migrate reset

# Seed the database
npx prisma db seed
```

## Prisma Client Import

Always import the Prisma client from the canonical location:

```typescript
import { prisma } from "../db/prisma.js";
```

Do **not** import from `"../prisma.js"` -- that path is incorrect.

## Indexing Strategy

Most tables have composite indexes that include `tenantId` as the first column, ensuring efficient tenant-scoped queries:

```prisma
@@index([tenantId, status], map: "jobs_tenant_status_idx")
@@index([tenantId, createdAt(sort: Desc)], map: "audit_log_tenant_time_idx")
@@index([tenantId, occurredAt(sort: Desc)], map: "ledger_entries_tenant_occurred_at_idx")
```

## Connection Configuration

The Prisma datasource uses two URLs:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // PgBouncer pooled connection
  directUrl = env("DIRECT_URL")      // Direct connection for migrations
}
```

`DATABASE_URL` points to the Supabase PgBouncer endpoint for connection pooling. `DIRECT_URL` bypasses pooling and is required for schema migrations.
