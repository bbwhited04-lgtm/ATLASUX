# Knowledge Base API

The Knowledge Base (KB) stores documents that AI agents use for context during reasoning and content generation. Documents support tagging, versioning, chunking for semantic retrieval, and full-text search.

## Base URL

```
/v1/kb
```

---

## GET /v1/kb/documents

List KB documents for the current tenant.

**Query Parameters:**

| Param    | Type   | Description                                      |
|----------|--------|--------------------------------------------------|
| `q`      | string | Full-text search across title, slug, and body     |
| `status` | string | Filter by status: `draft`, `published`, `archived`|
| `tag`    | string | Filter by tag name (case-insensitive)             |

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     "https://api.atlasux.cloud/v1/kb/documents?status=published&tag=seo"
```

**Response (200):**

```json
{
  "ok": true,
  "documents": [
    {
      "id": "doc_abc123",
      "title": "SEO Best Practices 2026",
      "slug": "seo-best-practices-2026",
      "status": "published",
      "tags": ["seo", "content-strategy"],
      "updatedAt": "2026-02-26T10:00:00.000Z",
      "createdAt": "2026-02-20T08:00:00.000Z"
    }
  ]
}
```

---

## GET /v1/kb/documents/:id

Get a single document with its full body, tags, and chunk count.

**Response (200):**

```json
{
  "ok": true,
  "document": {
    "id": "doc_abc123",
    "title": "SEO Best Practices 2026",
    "slug": "seo-best-practices-2026",
    "body": "# SEO Best Practices\n\nContent here...",
    "status": "published",
    "tags": ["seo", "content-strategy"],
    "chunkCount": 5,
    "isChunked": true,
    "createdAt": "2026-02-20T08:00:00.000Z",
    "updatedAt": "2026-02-26T10:00:00.000Z"
  }
}
```

---

## POST /v1/kb/documents

Create a new KB document. Requires a write role (CEO, CRO, CAS, or CSS).

**Request Body:**

| Field    | Type     | Required | Description                              |
|----------|----------|----------|------------------------------------------|
| `title`  | string   | Yes      | Document title                           |
| `body`   | string   | No       | Document content (markdown supported)     |
| `status` | string   | No       | `draft`, `published`, or `archived`      |
| `slug`   | string   | No       | URL-safe slug (auto-generated from title) |
| `tags`   | string[] | No       | Array of tag names (up to 25)            |

**Response (200):**

```json
{ "ok": true, "id": "doc_abc123" }
```

---

## PATCH /v1/kb/documents/:id

Update an existing document. Only include fields you want to change. Automatically creates a version snapshot before applying edits.

**Request:**

```bash
curl -X PATCH \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{"title": "Updated Title", "status": "published"}' \
     https://api.atlasux.cloud/v1/kb/documents/doc_abc123
```

---

## DELETE /v1/kb/documents/:id

Hard-delete a document. Requires a write role.

---

## Chunks

### GET /v1/kb/documents/:id/chunks

Paginated list of chunks for a document.

**Query Parameters:**

| Param    | Type   | Default | Description             |
|----------|--------|---------|-------------------------|
| `limit`  | number | 100     | Max chunks (up to 500)  |
| `offset` | number | 0       | Pagination offset       |

**Response (200):**

```json
{
  "ok": true,
  "documentId": "doc_abc123",
  "total": 5,
  "limit": 100,
  "offset": 0,
  "chunks": [
    {
      "idx": 0,
      "charStart": 0,
      "charEnd": 4000,
      "content": "# SEO Best Practices\n\n...",
      "sourceUpdatedAt": "2026-02-26T10:00:00.000Z"
    }
  ]
}
```

### POST /v1/kb/documents/:id/chunks/regenerate

Re-chunk a document. Deletes existing chunks and generates new ones.

**Request Body:**

| Field        | Type   | Default | Description                     |
|--------------|--------|---------|---------------------------------|
| `chunkSize`  | number | 4000    | Target chunk size in characters |
| `softWindow` | number | 600     | Newline search window           |

---

## Versions

### GET /v1/kb/documents/:id/versions

List version history for a document (without body content).

### GET /v1/kb/documents/:id/versions/:vnum

Get a specific version by number (includes body).

### POST /v1/kb/documents/:id/versions/snapshot

Manually create a version snapshot of the current document state.

---

## Cache Management

### POST /v1/kb/cache/flush

Flush the entire KB cache.

### DELETE /v1/kb/cache/:agentId

Invalidate cache for a specific agent (or all agents if agentId is empty).

### GET /v1/kb/cache/stats

Return cache hit/miss statistics.

---

## Seed Endpoint

### POST /v1/kb/seed-atlas

Seeds all workflow definitions into the KB as published documents with the `atlas-workflow` tag. Safe to re-run (upserts by slug).

---

## Write Roles

Only these tenant roles can create, update, or delete KB documents:

- `CEO` (Atlas)
- `CRO` (Binky)
- `CAS` (Customer Advocacy Specialist)
- `CSS` (Customer Support Specialist)
