# Atlas Workflows Library

This folder is Atlas UX's workflow library.

## Structure

- `workflows/registry.ts`  
  Atlas-native workflow handlers (TypeScript) that run inside the backend.

- `workflows/n8n/**`  
  Imported/exported n8n workflow JSON templates (kept for portability, versioning, and audit).

- `workflows/n8n/manifest.ts`  
  A simple catalog of the n8n workflows in this repo (IDs, categories, file paths, webhook paths).

## How Atlas Uses n8n Workflows (recommended pattern)

Atlas should treat n8n as an **automation runner** and keep governance inside Atlas:

1. Atlas receives a request (UI / API)
2. Atlas writes an **audit log** entry and (optionally) a **decision memo / approval**
3. Atlas triggers an n8n workflow via HTTP webhook
4. Atlas stores the result (and any IDs/URLs returned) and writes a final audit log entry

### Suggested env vars

- `N8N_BASE_URL` (e.g. `https://deadappcorp.app.n8n.cloud`)
- `N8N_WEBHOOK_SECRET` (shared secret header)
- Optional: `N8N_WEBHOOK_PATH_PREFIX` if you want a namespace

### Suggested HTTP call shape

POST to:

`{N8N_BASE_URL}/webhook/{webhookPath}`

with JSON:

```json
{
  "tenantId": "...",
  "requestedBy": "...",
  "intentId": "...",
  "traceId": "...",
  "payload": { "title": "...", "body": "...", "tags": ["..."], "state": "draft" }
}
```

and header:

`x-atlas-key: {N8N_WEBHOOK_SECRET}`

## Tumblr

See: `workflows/n8n/social_media/tumblr_publish.json`

Webhook path: `atlas-tumblr-publish`

Expected payload:

```json
{
  "title": "Post title",
  "body": "<p>HTML body</p>",
  "tags": ["atlasux","alpha"],
  "state": "draft"
}
```

