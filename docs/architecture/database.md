# Database Architecture

Atlas UX uses PostgreSQL 16 hosted on Supabase as its primary data store. The
schema is managed by Prisma ORM with 30+ models, all enforcing multi-tenant
isolation through mandatory `tenant_id` foreign keys.

---

## Infrastructure

```
+-------------------+          +-------------------+
|   Application     |          |   Supabase        |
|   (Fastify API +  |          |                   |
|    Workers)       |          |  +-------------+  |
|                   |          |  | PostgreSQL  |  |
|  Prisma Client ---|---TCP----|->| Port 5432   |  |
|  (DATABASE_URL)   |  Pool    |  +-------------+  |
|                   |          |                   |
|  Prisma Migrate---|---TCP----|->  (DIRECT_URL)   |
|  (migrations)     |  Direct  |                   |
+-------------------+          +-------------------+
```

### Connection Strategy

Two connection URLs serve different purposes:

| Variable       | Purpose                    | Connection Type         |
|----------------|----------------------------|------------------------|
| `DATABASE_URL` | Application queries        | Via Pgbouncer (pooled)  |
| `DIRECT_URL`   | Migrations and introspection | Direct to PostgreSQL   |

Pgbouncer provides connection pooling, which is critical for handling concurrent
requests from the API server and multiple worker processes. Direct connections
are used only for schema migrations, which require persistent connections that
Pgbouncer's transaction-mode pooling cannot support.

## Schema Design Principles

### Multi-Tenant Isolation

Every table has a `tenant_id` column that is a foreign key to the `tenants`
table. This is the foundational security boundary:

```
tenants
  |
  |-- 1:N --> agents         (tenant_id FK)
  |-- 1:N --> jobs           (tenant_id FK)
  |-- 1:N --> audit_log      (tenant_id FK)
  |-- 1:N --> integrations   (tenant_id FK)
  |-- 1:N --> decision_memos (tenant_id FK)
  |-- 1:N --> workflows      (tenant_id FK)
  |-- 1:N --> kb_documents   (tenant_id FK)
  |-- 1:N --> ... (all other tables)
```

No query should ever return data across tenant boundaries. The `tenantPlugin`
ensures every request is scoped, and Prisma queries always include a
`where: { tenantId }` clause.

### Pending Tenant Additions

Three table groups still need `tenant_id` columns (deferred security item P):

- `publish_events`
- `atlas_ip_*` tables
- `atlas_suggestions`

These require database migrations that have not yet been applied.

## Key Models

### Core Models

```
+-------------------+       +-------------------+       +-------------------+
|     tenants       |       |     agents        |       |      users        |
|-------------------|       |-------------------|       |-------------------|
| id (PK)           |<------| tenant_id (FK)    |       | id (PK)           |
| name              |       | id (PK)           |       | email             |
| slug              |       | name              |       | ...               |
| ...               |       | role              |       +-------------------+
+-------------------+       | email             |
                            | reportsTo         |
                            | personality       |
                            | ...               |
                            +-------------------+
```

### Job System Models

```
+-------------------+       +-------------------+
|      jobs         |       |   job_results     |
|-------------------|       |-------------------|
| id (PK)           |------>| job_id (FK)       |
| tenant_id (FK)    |       | id (PK)           |
| type              |       | output            |
| status            |       | error             |
| payload           |       | ...               |
| priority          |       +-------------------+
| attempts          |
| maxRetries        |
| scheduledAt       |
| startedAt         |
| completedAt       |
| ...               |
+-------------------+
```

### Audit and Decisions

```
+-------------------+       +-------------------+
|    audit_log      |       |  decision_memos   |
|-------------------|       |-------------------|
| id (PK)           |       | id (PK)           |
| tenant_id (FK)    |       | tenant_id (FK)    |
| actorType         |       | action            |
| actorUserId       |       | amount            |
| actorExternalId   |       | riskTier          |
| level             |       | justification     |
| action            |       | status            |
| entityType        |       | reviewedBy        |
| entityId          |       | reviewedAt        |
| message           |       | ...               |
| meta (JSON)       |       +-------------------+
| timestamp         |
+-------------------+
```

### Knowledge Base

```
+-------------------+       +-------------------+
|   kb_documents    |       |    kb_chunks      |
|-------------------|       |-------------------|
| id (PK)           |------>| document_id (FK)  |
| tenant_id (FK)    |       | id (PK)           |
| title             |       | content           |
| content           |       | embedding         |
| status            |       | chunkIndex        |
| createdBy (req)   |       | ...               |
| ...               |       +-------------------+
+-------------------+

Status values: draft | published | archived
```

### Integrations

```
+-------------------+
|   integrations    |
|-------------------|
| id (PK)           |
| tenant_id (FK)    |
| provider (TEXT)   |    <-- Was enum, migrated to TEXT (20260225120000)
| config (JSON)     |    <-- Stores provider-specific data (e.g., chat_id)
| accessToken       |
| refreshToken      |
| ...               |
+-------------------+
```

The `provider` field was changed from an enum to TEXT to support adding new
integration providers without requiring schema migrations.

## Schema File

The Prisma schema is located at `backend/prisma/schema.prisma` and is 30KB+.
It defines all models, relations, enums, and indexes.

## Migration Strategy

Prisma Migrate manages all schema changes:

```bash
# Development: create and apply migrations
npx prisma migrate dev --name description_of_change

# Production: apply pending migrations
npx prisma migrate deploy

# Introspect existing database
npx prisma db pull

# Seed database with initial data
npx prisma db seed
```

Migrations are stored in `backend/prisma/migrations/` as timestamped
directories, each containing a `migration.sql` file.

Key migration history:

| Migration                    | Change                                 |
|------------------------------|-----------------------------------------|
| `20260225120000`             | Changed `integration.provider` from enum to TEXT |
| (various)                    | 30+ migrations building up the full schema |

## Seeding

The database can be seeded with:

```bash
npx prisma db seed
```

Additionally, `seedAiKb.ts` provides 200+ AI/tech knowledge base documents for
the KB system.

## Indexes and Performance

Key indexes exist on:

- `tenant_id` on every table (for tenant-scoped queries)
- `jobs.status` + `jobs.scheduledAt` (for engine loop polling)
- `audit_log.tenant_id` + `audit_log.timestamp` (for audit queries)
- `kb_chunks.embedding` (for vector similarity search)

## File Storage

File storage uses Supabase Storage (S3-compatible) rather than database blobs:

```
Supabase Bucket: kb_uploads
  tenants/
    {tenantId}/
      file1.pdf
      file2.docx
      ...
```

The `/v1/files` route provides:

- **List** — List files for a tenant
- **Upload** — Upload to tenant-scoped path
- **Download** — Generate signed URLs for secure download
- **Delete** — Remove files

A real Supabase service role key (JWT format) is used for storage operations.

## Database GUI

Prisma Studio provides a visual interface for database exploration during
development:

```bash
npx prisma studio
```

This opens a web-based GUI for browsing and editing data directly.

## Related Documentation

- [Architecture Overview](./README.md)
- [Backend Architecture](./backend.md)
- [Security Architecture](./security.md)
- [Job System Architecture](./job-system.md)
