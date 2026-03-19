# Query It — Database & Prisma Prompts

Prompt templates for database design, querying, optimization, and operations with Prisma ORM on PostgreSQL. Built for multi-tenant architectures with 30KB+ schemas like Atlas UX.

---

## Database Prompts

### Prompt: Prisma Schema Design
**Use when:** Adding new models or modifying existing schema
**Complexity:** Medium

```
Design a Prisma model for {{DOMAIN_ENTITY}} in a multi-tenant PostgreSQL database.

Business requirements:
- {{REQUIREMENT_1}}
- {{REQUIREMENT_2}}
- {{REQUIREMENT_3}}

Existing related models: {{RELATED_MODELS}}
Expected row volume: {{ESTIMATED_ROWS}} per tenant

Generate the Prisma model with:
1. `id` — String @id @default(cuid())
2. `tenant_id` — String, FK to tenants table (@@index)
3. All business fields with appropriate types and constraints
4. `createdAt` / `updatedAt` — DateTime with @default(now()) / @updatedAt
5. Relations to existing models using @relation
6. Composite indexes (@@index) for common query patterns:
   - tenant_id + frequently filtered fields
   - tenant_id + sort fields
7. Unique constraints (@@unique) for business rules
8. Optional fields marked with `?`
9. Enum definitions if the model uses categorical values

Also provide:
- The migration command to run
- 3 example Prisma queries (create, findMany with filters, update)
- Seed data for development (5 realistic records)

Validate against existing schema to avoid naming conflicts.
```

**Expected output:** Complete Prisma model definition with indexes, relations, queries, and seed data.

---

### Prompt: Migration Generation
**Use when:** Creating safe database migrations
**Complexity:** Medium

```
Generate a Prisma migration for the following schema change:

Change description: {{CHANGE_DESCRIPTION}}
Affected models: {{MODELS}}
Current production data: {{DATA_STATUS}} (empty table / has data / large table)

Provide:
1. The Prisma schema changes (additions/modifications)
2. Run `npx prisma migrate dev --name {{MIGRATION_NAME}}` command
3. Review the generated SQL before applying — check for:
   - DROP operations (flag as destructive)
   - ALTER on large tables (estimate lock duration)
   - NOT NULL on populated columns (needs default or backfill)
   - Index creation on large tables (CONCURRENTLY if possible)
4. If data migration is needed:
   - SQL script to backfill data before/after schema change
   - Verification query to confirm backfill succeeded
5. Rollback plan:
   - The reverse migration SQL
   - Data restoration steps if needed

Production deployment order:
1. Deploy code that works with both old AND new schema
2. Run migration
3. Deploy code that uses new schema only
4. Clean up backward-compatible code
```

**Expected output:** Migration with safety analysis, backfill scripts, and rollback plan.

---

### Prompt: N+1 Query Detection
**Use when:** API endpoints are slow due to excessive database queries
**Complexity:** Medium

```
Analyze {{FILE_PATH}} for N+1 query problems with Prisma.

Common N+1 patterns to detect:
1. **Loop queries** — `for` loop containing `prisma.xxx.findUnique/findFirst`
2. **Missing includes** — fetching parent, then separately fetching children
3. **Lazy relation access** — accessing relations without `include` in the original query
4. **Sequential awaits** — `await` inside loops instead of batch operations

For each N+1 found:
- Show the problematic code
- Explain why it's N+1 (e.g., "1 query for users + N queries for each user's posts")
- Estimate the query count for {{TYPICAL_N}} records
- Provide the optimized version:
  - Use `include` for eager loading
  - Use `findMany` with `where: { id: { in: ids } }` for batch loading
  - Use `select` to fetch only needed fields
  - Use raw SQL with JOINs for complex cases

Show before/after query counts and expected latency improvement.
```

**Expected output:** N+1 instances with optimized Prisma queries showing query count reduction.

---

### Prompt: Index Recommendations
**Use when:** Queries are slow and you need to add proper indexes
**Complexity:** Medium

```
Recommend indexes for the {{MODEL_NAME}} table in the Prisma schema.

Current schema:
{{PRISMA_MODEL}}

Common query patterns:
- {{QUERY_PATTERN_1}}
- {{QUERY_PATTERN_2}}
- {{QUERY_PATTERN_3}}

Current indexes: {{EXISTING_INDEXES}}
Table size: {{ROW_COUNT}} rows

For each recommendation:
1. The index definition in Prisma (@@index or @unique)
2. The equivalent CREATE INDEX SQL
3. Which queries it improves and why
4. The index type: B-tree (default), GIN (arrays/JSONB), GiST (full-text)
5. Estimated size of the index on disk
6. Write performance impact (index maintenance cost)

Also check for:
- Over-indexing — indexes that duplicate or overlap
- Unused indexes — indexes not matching any query pattern
- Composite index column order — most selective column first
- Partial indexes — WHERE clause to index only relevant rows

Provide the EXPLAIN ANALYZE for the slowest query before and after indexing.
```

**Expected output:** Index recommendations with Prisma schema additions and query plan improvements.

---

### Prompt: Data Seeding Script
**Use when:** Creating development or test seed data
**Complexity:** Simple

```
Generate a Prisma seed script for {{MODELS}} with realistic data.

Requirements:
- Tenant: create {{NUM_TENANTS}} test tenant(s) with known IDs
- Per tenant: {{RECORDS_PER_TENANT}} records for each model
- Use realistic data (real-looking names, emails, phone numbers — not "test123")
- Maintain referential integrity (create parents before children)
- Use deterministic IDs for key records (so tests can reference them)
- Include edge cases:
  - Records with null optional fields
  - Records with maximum-length strings
  - Records at date boundaries
  - Records in different statuses (active, archived, deleted)

Script structure:
1. Clear existing seed data (deleteMany in reverse dependency order)
2. Create tenants
3. Create dependent records in order
4. Log summary of created records

Use `prisma.$transaction` for atomic seeding.
Output as a TypeScript file for `prisma/seed.ts`.
```

**Expected output:** Complete seed.ts file with realistic data and proper dependency ordering.

---

### Prompt: Backup and Restore Procedures
**Use when:** Setting up or documenting database backup/restore workflows
**Complexity:** Medium

```
Create backup and restore procedures for the PostgreSQL database.

Database: {{DATABASE_NAME}}
Host: {{DB_HOST}}
Size: {{DB_SIZE}}
Hosting: {{HOSTING_PROVIDER}}
Backup frequency: {{BACKUP_FREQUENCY}}
Retention: {{RETENTION_PERIOD}}

Generate:
1. **Automated backup script** (pg_dump):
   - Full database dump with compression
   - Schema-only dump (for version control)
   - Data-only dump (for data migration)
   - Timestamp-named backup files
   - Upload to {{BACKUP_STORAGE}} (S3, local, etc.)
   - Cleanup old backups beyond retention period

2. **Restore procedures**:
   - Full restore to empty database
   - Restore specific tables only
   - Point-in-time restore (if WAL archiving is available)
   - Restore to a different database name (for verification)

3. **Verification script**:
   - Compare row counts before/after
   - Verify referential integrity
   - Run application health check against restored database

4. **Cron job setup** for automated backups
5. **Disaster recovery playbook** — step-by-step for "database is gone"

Include all pg_dump/pg_restore flags explained.
```

**Expected output:** Backup scripts, restore procedures, and verification steps with exact commands.

---

### Prompt: Multi-Tenant Query Patterns
**Use when:** Writing tenant-scoped queries or implementing Row Level Security
**Complexity:** Complex

```
Implement multi-tenant data isolation for {{FEATURE_NAME}} using Prisma + PostgreSQL.

Isolation model: {{ISOLATION_MODEL}} (shared schema with tenant_id / schema per tenant / RLS)
Current approach: tenant_id column on every table, filtered in application code

Provide patterns for:
1. **Prisma middleware** to auto-inject tenant_id on all queries:
   - findMany, findFirst, findUnique — add WHERE tenant_id
   - create, createMany — set tenant_id from context
   - update, delete — add WHERE tenant_id (prevent cross-tenant writes)

2. **PostgreSQL RLS** (Row Level Security) setup:
   - ENABLE ROW LEVEL SECURITY on each table
   - CREATE POLICY for SELECT, INSERT, UPDATE, DELETE
   - SET app.current_tenant_id via Prisma connection
   - Session variable approach for RLS context

3. **Common pitfalls**:
   - Aggregate queries accidentally crossing tenants
   - JOIN queries needing tenant_id on both sides
   - Migrations that forget tenant_id on new tables
   - Background jobs that need explicit tenant context

4. **Testing patterns**:
   - Test that tenant A cannot see tenant B's data
   - Test that cross-tenant queries fail appropriately
   - Test that admin/system queries bypass tenant filter when needed

5. **Performance** — index tenant_id as the first column in composite indexes
```

**Expected output:** Multi-tenant isolation implementation with Prisma middleware and RLS policies.

---

### Prompt: Raw SQL for Complex Analytics
**Use when:** Prisma's query API is insufficient for analytical queries
**Complexity:** Complex

```
Write a raw SQL query for {{ANALYTICS_GOAL}} using Prisma's $queryRaw.

Requirements:
- {{METRIC_1}}
- {{METRIC_2}}
- {{METRIC_3}}
- Time range: {{TIME_RANGE}}
- Group by: {{GROUPING}}
- Tenant-scoped: WHERE tenant_id = $1

Query needs:
1. The raw SQL query with:
   - CTEs (Common Table Expressions) for readability
   - Window functions if needed (ROW_NUMBER, LAG, running totals)
   - Date/time functions (date_trunc, generate_series for filling gaps)
   - COALESCE for null handling
   - Proper parameterization ($1, $2 — never string interpolation)

2. The Prisma $queryRaw call:
   ```typescript
   const results = await prisma.$queryRaw`
     SELECT ... WHERE tenant_id = ${tenantId}
   `;
   ```

3. TypeScript type for the result rows
4. EXPLAIN ANALYZE output interpretation
5. Index recommendations for the query
6. Caching strategy if the query is expensive (materialized view, application cache)

IMPORTANT: Use $queryRaw (tagged template), NOT $queryRawUnsafe.
```

**Expected output:** Parameterized raw SQL with Prisma integration, typed results, and performance analysis.

---

## Resources

- https://www.prisma.io/docs/orm/prisma-client/queries
- https://www.postgresql.org/docs/current/sql-createindex.html
- https://www.postgresql.org/docs/current/ddl-rowsecurity.html

## Image References

1. **Database indexing B-tree structure** — search: "B-tree index structure PostgreSQL database"
2. **N+1 query problem diagram** — search: "N+1 query problem ORM database diagram"
3. **Multi-tenant database architecture** — search: "multi-tenant database architecture shared schema diagram"
4. **PostgreSQL EXPLAIN ANALYZE visual** — search: "PostgreSQL EXPLAIN ANALYZE query plan visualization tool"
5. **Prisma schema ERD** — search: "Prisma ORM schema entity relationship diagram"

## Video References

1. https://www.youtube.com/watch?v=PXSa4hjk1nA — "Prisma ORM Full Course — PostgreSQL, CRUD, Migrations"
2. https://www.youtube.com/watch?v=SdnRnDKqEwA — "PostgreSQL Performance Tuning and Query Optimization"
