# Atlas UX API -- Metrics and Analytics

Two sets of endpoints for metrics: `/v1/metrics` for daily snapshot CRUD, and `/v1/analytics` for aggregated summaries, comparisons, and ROI analysis.

## Metrics Snapshots

### Create/Upsert Daily Snapshot

```
POST /v1/metrics/snapshot
```

Computes and stores a daily metrics snapshot. Intended for nightly cron execution.

**Auth:** Tenant ID via body or query param.

**Request Body:**

```json
{ "tenantId": "uuid" }
```

**Response:**

```json
{ "ok": true, "date": "2026-02-26", "id": "uuid", "data": {...} }
```

### Get Latest Snapshot

```
GET /v1/metrics/latest?tenantId=uuid
```

Returns the most recent metrics snapshot for the tenant.

**Response:**

```json
{ "ok": true, "id": "uuid", "date": "2026-02-26", "data": {...} }
```

## Analytics Summary

```
GET /v1/analytics/summary?range=7d
```

Aggregates data from distribution events, ledger entries, and growth loop runs.

**Auth:** JWT + `x-tenant-id` header.

**Query Parameters:**

| Param | Values | Default | Description |
|-------|--------|---------|-------------|
| `range` | `24h`, `7d`, `30d`, `90d` | `7d` | Time range |

**Response:**

```json
{
  "ok": true,
  "range": "7d",
  "summary": {
    "totalImpressions": 15000,
    "totalClicks": 450,
    "totalConversions": 12,
    "clickRate": "3.0%",
    "totalPosts": 28,
    "totalSpendCents": 25000,
    "totalSpendUsd": "250.00"
  },
  "byChannel": { "twitter": { "impressions": 5000, "clicks": 200, "conversions": 5, "posts": 10 } },
  "timeline": [{ "date": "2026-02-20", "impressions": 2000, "clicks": 60, "posts": 4 }],
  "spendByCategory": { "token_spend": 15000, "api_spend": 10000 },
  "growthRuns": [{ "runDate": "2026-02-26", "status": "completed", "summary": "..." }]
}
```

## Period Comparison

```
GET /v1/analytics/compare?range=7d
```

Compares the current period against the prior period of equal length.

**Response:**

```json
{
  "ok": true,
  "range": "7d",
  "current": { "impressions": 15000, "clicks": 450, "conversions": 12, "spendCents": 25000, "posts": 28 },
  "prior":   { "impressions": 12000, "clicks": 380, "conversions": 8, "spendCents": 20000, "posts": 22 },
  "delta":   { "impressions": "+25.0%", "clicks": "+18.4%", "conversions": "+50.0%", "spendCents": "+25.0%", "posts": "+27.3%" }
}
```

## ROI by Channel

```
GET /v1/analytics/roi?range=7d
```

Returns click-through rate and conversion rate per channel.

**Response:**

```json
{
  "ok": true,
  "range": "7d",
  "channels": [
    { "channel": "twitter", "impressions": 5000, "clicks": 200, "conversions": 5, "posts": 10, "ctr": "4.0%", "convRate": "2.5%" }
  ]
}
```

## Upsert Metrics Data

```
POST /v1/analytics/metrics
```

Store daily metrics from external integrations or webhooks.

**Request Body:**

```json
{ "date": "2026-02-26", "data": { "visitors": 1200, "pageViews": 4500 } }
```

### Get Stored Metrics

```
GET /v1/analytics/metrics?range=7d
```

Returns stored MetricsSnapshot records.

**Example:**

```bash
curl -s "https://atlas-ux.onrender.com/v1/analytics/summary?range=30d" \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```
