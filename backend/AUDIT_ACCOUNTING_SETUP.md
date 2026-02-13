# Audit Trail + Accounting Foundation

This backend now includes **automatic audit trail logging**.

## Goals
- Minimal backend usage (no noisy client-side logging)
- High survivability (doesn't crash if tables aren't created yet)
- Enterprise-ready append-only audit trail

## Setup (one-time)
Run the SQL files below in your Supabase SQL editor (in order):

1) `sql/audit_ledger_schema.sql`
2) `sql/001_content_jobs.sql` (only if you want Content Jobs + AI generation queue)


## What is logged automatically?
- Every API request (except `/health`) with:
  - method + path
  - status code
  - duration
  - header-derived context (user/device/source)
- You can also log high-value business events explicitly using `logBusinessEvent(...)`.

## Headers supported (optional)
Frontend/Tauri can send:
- `x-user-id`
- `x-org-id`
- `x-device-id`
- `x-source` (web|tauri|mobile|api)
- `x-request-id`

If omitted, logs still happen (actor becomes `system`/`device`).

## Endpoints
- `GET /v1/audit/list?limit=200`
- `GET /v1/audit/export.csv?limit=1000`
- `GET /v1/accounting/summary`
- `GET /v1/accounting/export.csv`

If tables are missing, endpoints return safe fallbacks (and you can create tables later without code changes).

## Content Jobs (optional)
If you enable Content Jobs, Atlas can persist AI generation requests/results in `public.content_jobs`.
This pairs with the ledger so paid vendor calls can be correlated to a job id.

Suggested route group (if enabled in code):
- `POST /v1/content/jobs`
- `GET /v1/content/jobs?org_id=...&limit=...`
- `GET /v1/content/jobs/:id`
- `PATCH /v1/content/jobs/:id`
