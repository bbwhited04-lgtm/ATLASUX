# Atlas UX API -- Knowledge Base

The Knowledge Base (KB) stores documents used by agents for context enrichment during chat and workflow execution. Supports full CRUD, versioning, tagging, and chunking for RAG.

**Write Roles:** Only users with roles `CEO`, `CRO`, `CAS`, or `CSS` can create/update/delete documents.

## Context

```
GET /v1/kb/context
```

Returns the current tenant context (useful for frontend bootstrapping).

**Response:** `{ "ok": true, "tenantId": "uuid", "role": "CEO", "userId": "uuid" }`

## List Documents

```
GET /v1/kb/documents?q=search&status=published&tag=governance
```

**Auth:** JWT + `x-tenant-id` header.

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Full-text search across title, slug, body |
| `status` | string | Filter: `draft`, `published`, `archived` |
| `tag` | string | Filter by tag name |

**Response:**

```json
{
  "ok": true,
  "documents": [
    { "id": "uuid", "title": "Agent Policies", "slug": "agent-policies", "status": "published", "updatedAt": "...", "createdAt": "...", "tags": ["governance"] }
  ]
}
```

## Get Document

```
GET /v1/kb/documents/:id
```

Returns full document including body, chunk count, and tags.

## Create Document

```
POST /v1/kb/documents
```

**Auth:** Requires write role.

**Request Body:**

```json
{
  "title": "Agent Onboarding Guide",
  "body": "# Onboarding\n\nWelcome to Atlas UX...",
  "slug": "agent-onboarding",
  "status": "published",
  "tags": ["onboarding", "agents"]
}
```

**Response:** `{ "ok": true, "id": "uuid" }`

## Update Document

```
PATCH /v1/kb/documents/:id
```

Partial update. Automatically creates a version snapshot before applying changes to title or body.

**Request Body:** Any subset of `{ title, body, slug, status, tags }`.

## Delete Document

```
DELETE /v1/kb/documents/:id
```

Hard delete (write role required).

## Version History

### List Versions

```
GET /v1/kb/documents/:id/versions
```

### Get Specific Version

```
GET /v1/kb/documents/:id/versions/:vnum
```

### Create Snapshot

```
POST /v1/kb/documents/:id/versions/snapshot
```

Manually snapshots the current document state as a new version.

**Request Body:** `{ "changeSummary": "Pre-edit snapshot" }`

## Chunks

### List Chunks

```
GET /v1/kb/documents/:id/chunks?limit=100&offset=0
```

### Regenerate Chunks

```
POST /v1/kb/documents/:id/chunks/regenerate
```

Re-chunks the document body. Write role required.

**Request Body:** `{ "chunkSize": 4000, "softWindow": 600 }`

## Cache Management

```
POST /v1/kb/cache/flush          # Flush entire KB cache
DELETE /v1/kb/cache/:agentId     # Invalidate cache for a specific agent
GET /v1/kb/cache/stats           # View cache statistics
```

## Seed Atlas Workflows

```
POST /v1/kb/seed-atlas
```

Seeds all workflow definitions from the n8n manifest into KB documents. Safe to re-run (upserts by slug).

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/kb/documents?status=published \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```
