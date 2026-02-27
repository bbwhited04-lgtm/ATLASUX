# Rate Limiting & API Quotas

## Overview

Atlas UX enforces rate limits and usage quotas at multiple layers to ensure
platform stability, fair resource allocation, and cost control. Limits vary
by subscription tier and are enforced both at the API gateway level (per-request
rate limits) and at the business logic level (daily/monthly quotas).

## Subscription Tiers

### Free Beta

The free tier is available during the Alpha period. It provides enough capacity
for evaluation and light usage.

| Resource | Limit |
|----------|-------|
| AI tokens | 50,000 / day |
| Storage | 500 MB |
| Active agents | 5 |
| API calls | 1,000 / day |
| Workflows | 10 |
| KB documents | 50 |
| Email sends | 20 / day |
| Social posts | 5 / day |

### Starter ($19/month)

Designed for small teams getting started with AI automation.

| Resource | Limit |
|----------|-------|
| AI tokens | 200,000 / day |
| Storage | 5 GB |
| Active agents | 15 |
| API calls | 10,000 / day |
| Workflows | 50 |
| KB documents | 500 |
| Email sends | 100 / day |
| Social posts | 20 / day |

### Pro ($49/month)

Full platform access for established businesses.

| Resource | Limit |
|----------|-------|
| AI tokens | 1,000,000 / day |
| Storage | 25 GB |
| Active agents | All (30+) |
| API calls | 100,000 / day |
| Workflows | Unlimited |
| KB documents | 5,000 |
| Email sends | 500 / day |
| Social posts | 100 / day |

### Enterprise (Custom Pricing)

Custom limits negotiated per contract. Includes dedicated support, SLA
guarantees, custom agent development, and on-premise deployment options.

## Per-Route Rate Limits

The backend uses the `@fastify/rate-limit` plugin to enforce per-route request
limits. Rate limit configuration is set in route options:

```typescript
server.post("/v1/agents/run", {
  config: {
    rateLimit: {
      max: 30,
      timeWindow: "1 minute"
    }
  }
}, handler);
```

### Default Limits by Route Category

| Route category | max | timeWindow | Notes |
|----------------|-----|------------|-------|
| Auth endpoints | 10 | 1 minute | Prevents brute force |
| AI completion | 30 | 1 minute | Most expensive routes |
| KB search | 60 | 1 minute | Vector search is fast |
| CRUD operations | 100 | 1 minute | Standard data access |
| File uploads | 10 | 1 minute | Large payloads |
| Webhook receivers | 200 | 1 minute | Must handle bursts |
| Health check | 1000 | 1 minute | Monitoring traffic |

### Rate Limit Headers

Every response includes rate limit headers:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1709035260
```

### 429 Response

When a client exceeds the rate limit, the server responds with:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 45 seconds.",
  "retryAfter": 45
}
```

The `Retry-After` header is also set, indicating how many seconds the client
should wait before retrying.

## Usage Metering

Daily and monthly usage is tracked in the `usage_meters` table:

```
usage_meters
  id          UUID (PK)
  tenant_id   UUID (FK → tenants)
  meter_type  TEXT          -- "tokens", "api_calls", "storage_bytes", "email_sends", "social_posts"
  period      TEXT          -- "daily" | "monthly"
  period_key  TEXT          -- "2026-02-26" or "2026-02"
  value       BIGINT        -- current usage count
  limit_value BIGINT        -- maximum allowed for this period
  updated_at  TIMESTAMPTZ
```

Usage is incremented atomically using PostgreSQL's `UPDATE ... SET value = value + $increment`:

```typescript
await prisma.$executeRaw`
  INSERT INTO usage_meters (id, tenant_id, meter_type, period, period_key, value, limit_value)
  VALUES (gen_random_uuid(), ${tenantId}, ${meterType}, 'daily', ${today}, ${amount}, ${limit})
  ON CONFLICT (tenant_id, meter_type, period, period_key)
  DO UPDATE SET value = usage_meters.value + ${amount}, updated_at = NOW()
`;
```

### Usage Check Before Execution

Before any metered operation, the engine checks current usage:

```typescript
async function checkQuota(tenantId: string, meterType: string): Promise<boolean> {
  const meter = await prisma.usageMeter.findFirst({
    where: { tenantId, meterType, period: "daily", periodKey: today() }
  });
  if (!meter) return true; // No meter yet = under limit
  return meter.value < meter.limitValue;
}
```

If the quota is exceeded, the operation is rejected with a descriptive error
message that includes current usage, limit, and when the quota resets.

## Token Counting

AI token usage is metered using the response's `usage` field from the LLM API:

```typescript
const response = await openai.chat.completions.create({ ... });
const tokensUsed = response.usage.prompt_tokens + response.usage.completion_tokens;
await incrementMeter(tenantId, "tokens", tokensUsed);
```

Both prompt and completion tokens count toward the daily limit. Embedding
tokens (for KB search) are tracked separately under the `embedding_tokens`
meter type but share the same daily pool.

## Grace Periods

To avoid disrupting active workflows, Atlas UX implements soft limits with
grace periods:

### 10% Grace Buffer

When a tenant reaches 100% of their quota, they enter a grace period that
allows up to 110% usage. During the grace period:

- Operations continue to execute
- The tenant receives a notification (Telegram and/or email)
- Usage is logged as "over_quota" in the audit trail
- The dashboard shows a warning banner

### Hard Cap at 110%

At 110% of the quota, all metered operations are blocked until the next
period reset (midnight UTC for daily quotas, first of month for monthly).

### Fail-Open Behavior

If the usage metering system itself fails (database error, timeout):

- **Default**: Operations proceed (fail-open) to avoid blocking legitimate work
- **Exception**: Financial operations (spend, subscriptions) fail-closed
- A warning is logged to `audit_log` with `level: "warn"` and
  `action: "METER_FAIL_OPEN"`

This design prioritizes availability over strict enforcement for non-financial
operations.

## Quota Reset Schedule

| Period | Resets at | Timezone |
|--------|----------|----------|
| Daily | 00:00 | UTC |
| Monthly | 1st of month, 00:00 | UTC |

A scheduled job runs at 00:05 UTC daily to archive the previous day's meters
and create fresh rows for the new day. Monthly archival runs on the 1st at
00:10 UTC.

## Dashboard Visibility

Tenants can view their usage on the Business Manager dashboard:

- **Token usage**: Bar chart showing daily consumption vs limit
- **API calls**: Counter with percentage of limit used
- **Storage**: Progress bar with total vs allocated
- **Agent activity**: Per-agent token consumption breakdown

Usage data refreshes every 60 seconds on the dashboard via polling.

## Alerting Thresholds

Automatic notifications are sent at:

| Threshold | Channel | Message |
|-----------|---------|---------|
| 75% | Dashboard banner | "Approaching daily limit" |
| 90% | Dashboard + Telegram | "90% of daily quota used" |
| 100% | Dashboard + Telegram + Email | "Daily quota reached, grace period active" |
| 110% | Dashboard + Telegram + Email | "Operations paused until quota reset" |

## Upgrading Limits

Tenants can upgrade their plan at any time via the subscription management
page. Limit increases take effect immediately — the `limit_value` in
`usage_meters` is updated in real time when the subscription changes.

Downgrades take effect at the end of the current billing period to avoid
mid-cycle disruption.
