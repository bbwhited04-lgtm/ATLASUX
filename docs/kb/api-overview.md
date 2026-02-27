# API Overview for Users

## Introduction

The Atlas UX API provides programmatic access to the platform's capabilities, allowing you to integrate AI agent operations into your existing tools and workflows. All API endpoints are served under the `/v1` prefix and follow RESTful conventions.

This document covers the essentials for getting started with the API. For detailed endpoint documentation, refer to the specific API reference sections.

## Base URL

**Production:**
```
https://your-instance.onrender.com/v1
```

**Local Development:**
```
http://localhost:8787/v1
```

The base URL is configured via the `VITE_API_BASE_URL` environment variable on the frontend.

## Authentication

### JWT Bearer Tokens

All API requests require authentication via JWT bearer tokens:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained through the authentication flow (login endpoint) and must be included in every request header. Expired tokens will receive a `401 Unauthorized` response.

### Tenant Identification

In addition to authentication, every request must identify which tenant (organization) it is operating on behalf of:

```
x-tenant-id: <your-tenant-id>
```

Alternatively, you can pass `tenantId` as a query parameter, but the header approach is preferred.

Requests without a valid tenant identifier will be rejected.

## Common Endpoints

### Agents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/agents` | List all agents in the tenant |
| GET | `/v1/agents/:id` | Get a specific agent's details |
| POST | `/v1/agents/:id/task` | Assign a task to an agent |

### Jobs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/jobs` | List jobs (filterable by status) |
| GET | `/v1/jobs/:id` | Get job details |
| POST | `/v1/jobs` | Create a new job |

### Workflows

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/workflows` | List available workflows |
| POST | `/v1/workflows/:id/run` | Trigger a workflow |
| GET | `/v1/workflows/:id/status` | Check workflow execution status |

### Decisions

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/decisions` | List pending Decision Memos |
| GET | `/v1/decisions/:id` | Get memo details |
| POST | `/v1/decisions/:id/approve` | Approve a Decision Memo |
| POST | `/v1/decisions/:id/deny` | Deny a Decision Memo |

### Audit Log

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/audit` | Query the audit log |

### Files

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/files` | List files in tenant storage |
| POST | `/v1/files` | Upload a file |
| GET | `/v1/files/:id/url` | Get a signed download URL |
| DELETE | `/v1/files/:id` | Delete a file |

### Integrations

| Method | Endpoint | Description |
|---|---|---|
| GET | `/v1/integrations` | List configured integrations |
| POST | `/v1/integrations` | Create/update an integration |

### Telegram

| Method | Endpoint | Description |
|---|---|---|
| POST | `/v1/telegram/save-chat` | Save a default chat ID |
| GET | `/v1/telegram/default-chat` | Get the saved chat ID |
| POST | `/v1/telegram/send` | Send a Telegram message |

### Mobile

| Method | Endpoint | Description |
|---|---|---|
| POST | `/v1/mobile/pair` | Initiate mobile device pairing |
| GET | `/v1/mobile/status` | Check pairing status |

## Request Format

### Headers

Every request should include:
```
Authorization: Bearer <token>
x-tenant-id: <tenant-id>
Content-Type: application/json
```

### Request Body

POST and PUT requests accept JSON bodies:
```json
{
  "key": "value"
}
```

## Response Format

All responses follow a consistent structure:

**Success:**
```json
{
  "data": { ... },
  "message": "Operation completed successfully"
}
```

**Error:**
```json
{
  "error": "Error description",
  "statusCode": 400
}
```

## Rate Limits

API endpoints are rate-limited to prevent abuse. Limits vary by endpoint and tier:

| Tier | Default Rate Limit |
|---|---|
| Starter | 60 requests/minute |
| Pro | 120 requests/minute |
| Business | 300 requests/minute |
| Enterprise | 600 requests/minute |

When rate-limited, the API returns:
- Status: `429 Too Many Requests`
- Header: `Retry-After` with the number of seconds to wait

## Error Codes

| Status Code | Meaning |
|---|---|
| 400 | Bad Request — invalid parameters |
| 401 | Unauthorized — invalid or expired token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found — resource does not exist |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error — contact support |

## Pagination

List endpoints support pagination:
```
GET /v1/jobs?page=1&limit=20
```

Responses include pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Webhooks

Atlas UX can send webhook notifications for key events. Configure webhook endpoints through the Integrations API. Webhook payloads include:
- Event type
- Timestamp
- Relevant data
- Signature for verification

## Best Practices

1. **Always include both** `Authorization` and `x-tenant-id` headers
2. **Handle rate limits** gracefully with exponential backoff
3. **Validate responses** — check status codes before processing data
4. **Use pagination** for list endpoints to avoid large payloads
5. **Store tokens securely** — never expose JWT tokens in client-side code or logs
6. **Monitor the audit log** for visibility into API-driven actions

## Key Takeaways

1. All endpoints live under `/v1` and require JWT authentication plus tenant identification.
2. Rate limits scale with your pricing tier.
3. Consistent request/response formats make integration straightforward.
4. Every API action is logged in the audit trail for full traceability.
