# File Storage API

Atlas UX provides file management via Supabase Storage. Files are stored in the `kb_uploads` bucket and scoped to tenants using path-based isolation.

## Base URL

```
/v1/files
```

---

## Storage Architecture

- **Bucket**: `kb_uploads` (configurable via `KB_UPLOAD_BUCKET` env var)
- **Tenant paths**: `tenants/{tenantId}/` prefix enforced on all operations
- **Max file size**: 50 MB per upload
- **Max files per tenant**: 500 (configurable via `MAX_FILES_PER_TENANT`)
- **Max storage per tenant**: 500 MB (configurable via `MAX_STORAGE_MB_PER_TENANT`)

---

## GET /v1/files

List files for the current tenant. Returns up to 200 files sorted by most recently updated.

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/files
```

**Response (200):**

```json
{
  "ok": true,
  "files": [
    {
      "name": "product-roadmap.pdf",
      "path": "tenants/9a8a332c-.../1708934400000_product-roadmap.pdf",
      "size": 245760,
      "contentType": "application/pdf",
      "updatedAt": "2026-02-26T12:00:00.000Z"
    }
  ]
}
```

---

## POST /v1/files/upload

Upload a file using multipart/form-data. The file field name must be `file`.

**Rate limit:** 20 uploads per minute.

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -F "file=@/path/to/document.pdf" \
     https://api.atlasux.cloud/v1/files/upload
```

**Response (201):**

```json
{
  "ok": true,
  "file": {
    "name": "document.pdf",
    "path": "tenants/9a8a332c-.../1708934400000_document.pdf",
    "contentType": "application/pdf",
    "size": 102400
  }
}
```

**Error (429) -- quota exceeded:**

```json
{ "ok": false, "error": "File limit reached (500 files per tenant)" }
```

```json
{ "ok": false, "error": "Storage quota exceeded (500 MB per tenant)" }
```

---

## GET /v1/files/url?path=...

Get a signed download URL for a file. The signed URL is valid for 1 hour (3600 seconds).

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     "https://api.atlasux.cloud/v1/files/url?path=tenants/9a8a332c-.../document.pdf"
```

**Response (200):**

```json
{
  "ok": true,
  "url": "https://your-project.supabase.co/storage/v1/object/sign/kb_uploads/tenants/...?token=..."
}
```

**Error (403):** returned if the file path does not belong to the requesting tenant.

---

## DELETE /v1/files?path=...

Delete a file by its storage path.

**Request:**

```bash
curl -X DELETE \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     "https://api.atlasux.cloud/v1/files?path=tenants/9a8a332c-.../document.pdf"
```

**Response (200):**

```json
{ "ok": true }
```

---

## Usage Metering

Uploads are metered against the user's storage usage. The seat-level storage enforcement checks:

1. **Per-tenant file count** against `MAX_FILES_PER_TENANT`
2. **Per-tenant total bytes** against `MAX_STORAGE_MB_PER_TENANT`
3. **Per-user seat-level limit** from the subscription tier

---

## Audit Trail

File deletions are logged to the `audit_log` table with action `FILE_DELETED`.

---

## Environment Variables

| Variable                    | Default       | Description                     |
|-----------------------------|---------------|---------------------------------|
| `KB_UPLOAD_BUCKET`          | `kb_uploads`  | Supabase storage bucket name    |
| `MAX_FILES_PER_TENANT`      | `500`         | Max files per tenant            |
| `MAX_STORAGE_MB_PER_TENANT` | `500`         | Max storage in MB per tenant    |
| `SUPABASE_URL`              | (required)    | Supabase project URL            |
| `SUPABASE_SERVICE_ROLE_KEY` | (required)    | Supabase service role JWT key   |
