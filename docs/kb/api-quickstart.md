# API Quickstart

## Overview

The Atlas UX API is a RESTful JSON API built on Fastify 5. All endpoints are mounted under `/v1` and require authentication via JWT tokens and tenant identification via the `x-tenant-id` header.

## Base URL

```
Production: https://your-backend-url.onrender.com/v1
Local:      http://localhost:8787/v1
```

## Authentication

### Obtaining a Token

Authenticate with the API to receive a JWT token:

```bash
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Your Name"
  }
}
```

### Using the Token

Include the JWT token in every request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Tenant Context

Every API request must include the tenant identifier:

```
x-tenant-id: your-tenant-uuid
```

Without this header, requests will fail with a "tenant id required" error.

## Your First Request

### List Agents

```bash
curl -X GET "https://your-backend-url/v1/agents" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID"
```

**Response:**
```json
{
  "agents": [
    {
      "id": "atlas",
      "name": "Atlas",
      "role": "CEO",
      "status": "active"
    },
    {
      "id": "binky",
      "name": "Binky",
      "role": "CRO",
      "status": "active"
    }
  ]
}
```

### Create a Job

```bash
curl -X POST "https://your-backend-url/v1/jobs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CHAT",
    "payload": {
      "agent": "atlas",
      "message": "Summarize today pending tasks"
    }
  }'
```

**Response:**
```json
{
  "job": {
    "id": "job-uuid",
    "type": "CHAT",
    "status": "queued",
    "createdAt": "2026-02-26T10:00:00Z"
  }
}
```

### Check Job Status

```bash
curl -X GET "https://your-backend-url/v1/jobs/job-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID"
```

**Response:**
```json
{
  "job": {
    "id": "job-uuid",
    "type": "CHAT",
    "status": "completed",
    "result": {
      "response": "Here are today's pending tasks..."
    },
    "createdAt": "2026-02-26T10:00:00Z",
    "completedAt": "2026-02-26T10:00:05Z"
  }
}
```

## Common API Patterns

### Pagination

List endpoints support offset/limit pagination:

```bash
GET /v1/kb/chunks?offset=0&limit=50
```

Maximum limit per page is 500. Response includes total count for calculating pages.

### Filtering

Many endpoints support query parameter filtering:

```bash
GET /v1/jobs?status=completed&type=EMAIL_SEND
GET /v1/audit?level=error&agent=atlas
```

### File Upload

Upload files to tenant-scoped storage:

```bash
curl -X POST "https://your-backend-url/v1/files" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -F "file=@document.pdf"
```

Per-tenant quotas apply: 500 files, 500 MB default.

### Signed URL Download

Get a time-limited download URL for a stored file:

```bash
GET /v1/files/file-uuid/url
```

Returns a signed Supabase storage URL.

## Key Endpoints

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/agents` | List all agents |
| GET | `/v1/agents/:id` | Get agent details |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/jobs` | List jobs (filterable) |
| POST | `/v1/jobs` | Create a new job |
| GET | `/v1/jobs/:id` | Get job status and result |

### Knowledge Base
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/kb` | List KB documents |
| POST | `/v1/kb` | Create KB document |
| GET | `/v1/kb/:id` | Get document details |
| GET | `/v1/kb/chunks` | List document chunks (paginated) |

### Audit Log
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/audit` | List audit entries (filterable) |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/files` | List tenant files |
| POST | `/v1/files` | Upload a file |
| GET | `/v1/files/:id/url` | Get signed download URL |
| DELETE | `/v1/files/:id` | Delete a file |

### CRM
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/crm/contacts` | List contacts |
| POST | `/v1/crm/contacts` | Create contact |
| PUT | `/v1/crm/contacts/:id` | Update contact |
| DELETE | `/v1/crm/contacts/:id` | Delete contact |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/telegram/save-chat` | Save default Telegram chat |
| GET | `/v1/telegram/default-chat` | Get default chat ID |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/workflows` | List all workflows |
| POST | `/v1/workflows/:id/trigger` | Trigger a workflow |

### Billing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/billing/stripe/webhook` | Stripe webhook endpoint |

## Rate Limiting

API endpoints enforce rate limits to prevent abuse:

- Default: Varies by endpoint
- Configured as `{ max: N, timeWindow: "1 minute" }` per route
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when the limit resets

## Error Handling

### Standard Error Response
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Descriptive error message"
}
```

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing or invalid parameters) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## Best Practices

1. **Always include both headers**: `Authorization` and `x-tenant-id` on every request
2. **Handle rate limits**: Implement exponential backoff when receiving 429 responses
3. **Poll job status**: Jobs are async; poll `/v1/jobs/:id` until status is "completed" or "failed"
4. **Use pagination**: Large datasets should be fetched in pages to avoid timeouts
5. **Log audit entries**: Reference audit log entries when debugging unexpected behavior
6. **Respect file quotas**: Check quota status before bulk uploads

## SDK and Tools

### cURL
All examples in this guide use cURL. Replace placeholder values with your actual credentials.

### JavaScript/TypeScript
```typescript
const API_BASE = 'https://your-backend-url/v1';
const headers = {
  'Authorization': `Bearer ${token}`,
  'x-tenant-id': tenantId,
  'Content-Type': 'application/json'
};

const response = await fetch(`${API_BASE}/agents`, { headers });
const data = await response.json();
```

### Postman
Import the API endpoints into a Postman collection. Set `Authorization` and `x-tenant-id` as collection-level variables for convenience.
