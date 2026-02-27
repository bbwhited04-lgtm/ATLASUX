# Atlas UX API -- User

Per-user identity, usage metering, subscription management, and seat administration.

## Current User Profile

```
GET /v1/user/me
```

Returns the authenticated user's profile and tenant memberships. Auto-provisions a User record from Supabase auth data on first call.

**Auth:** JWT + `x-tenant-id` header.

**Response:**

```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Jane",
    "avatarUrl": null,
    "createdAt": "2026-02-26T..."
  },
  "tenants": [
    { "tenantId": "uuid", "name": "Acme Corp", "slug": "acme-corp", "role": "owner", "seatType": "pro" }
  ],
  "currentSeat": "pro"
}
```

## Update Profile

```
PATCH /v1/user/me
```

**Request Body:**

```json
{ "displayName": "Jane Doe", "avatarUrl": "https://..." }
```

## List User Tenants

```
GET /v1/user/me/tenants
```

Returns all tenants the user belongs to.

## Usage Metering

### Current Usage

```
GET /v1/user/me/usage
```

Returns current month usage and limits for the active tenant.

**Response:**

```json
{
  "ok": true,
  "usage": { "tokensUsed": 45000, "jobsCreated": 12, "storageBytes": 1048576 },
  "limits": { "tokenBudgetPerDay": 100000, "storageLimitBytes": 536870912, "agentLimit": 10, "jobsPerDay": 50 },
  "seatType": "pro"
}
```

### Usage History

```
GET /v1/user/me/usage/history?months=6
```

Returns usage data over the last N months.

## Subscription

```
GET /v1/user/me/subscription
```

Returns current subscription info or free_beta defaults if no subscription exists.

**Response:**

```json
{
  "ok": true,
  "subscription": {
    "id": "uuid",
    "seatType": "pro",
    "status": "active",
    "stripeCustomerId": "cus_xxx",
    "currentPeriodStart": "2026-02-01T...",
    "currentPeriodEnd": "2026-03-01T..."
  },
  "limits": { "tokenBudgetPerDay": 100000, "storageLimitBytes": 536870912 }
}
```

## Pricing Tiers (Public)

```
GET /v1/user/pricing
```

Returns all available pricing tiers. No authentication required.

**Response:**

```json
{
  "ok": true,
  "tiers": [
    { "tier": "free_beta", "priceDisplay": "Free", "tokenBudgetPerDay": 10000, "jobsPerDay": 10 },
    { "tier": "starter", "priceDisplay": "$19/mo", "tokenBudgetPerDay": 50000, "jobsPerDay": 30 },
    { "tier": "pro", "priceDisplay": "$49/mo", "tokenBudgetPerDay": 100000, "jobsPerDay": 50 },
    { "tier": "enterprise", "priceDisplay": "Custom", "tokenBudgetPerDay": 500000, "jobsPerDay": 200 }
  ]
}
```

## Seat Management (Admin)

### List Seats

```
GET /v1/user/tenants/:tenantId/seats
```

Returns all members and their seat allocations. Requires `admin` or `owner` role.

**Response:**

```json
{
  "ok": true,
  "totalSeats": 5,
  "seatCounts": { "pro": 3, "starter": 2 },
  "members": [
    { "userId": "uuid", "email": "jane@example.com", "displayName": "Jane", "role": "owner", "seatType": "pro", "joinedAt": "..." }
  ]
}
```

### Change Seat Type

```
PATCH /v1/user/tenants/:tenantId/seats/:userId
```

Changes a member's seat type. Requires `admin` or `owner` role.

**Request Body:**

```json
{ "seatType": "pro" }
```

**Valid Seat Types:** `free_beta`, `starter`, `pro`, `enterprise`

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/user/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```
