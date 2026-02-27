# System Overview

Atlas UX is a full-stack AI employee productivity platform. It combines a web SPA frontend, a Fastify API backend, multiple background workers, and a PostgreSQL database into an autonomous agent orchestration system.

## High-Level Architecture

```
                          +------------------+
                          |   Vercel (CDN)   |
                          |  React SPA (Vite)|
                          +--------+---------+
                                   |
                          HTTPS (Bearer JWT + x-tenant-id)
                                   |
                          +--------v---------+
                          | Render: Web API  |
                          | Fastify 5 + Node |
                          +--------+---------+
                                   |
              +--------------------+--------------------+
              |                    |                     |
    +---------v------+  +---------v------+  +-----------v---------+
    | Supabase       |  | External APIs  |  | Render Workers      |
    | PostgreSQL 16  |  | (AI, OAuth,    |  | - Engine Loop       |
    | + File Storage |  |  Graph, Stripe)|  | - Email Sender      |
    +----------------+  +----------------+  | - Scheduler         |
                                            | - Job Worker        |
                                            | - Social Monitor    |
                                            +---------------------+
```

## Components

### Frontend (Vercel)

- React 18 SPA built with Vite
- HashRouter for client-side routing
- Tailwind CSS dark theme
- Communicates with backend via `fetch()` to `/v1/*` endpoints
- Sends `Authorization: Bearer <JWT>` and `x-tenant-id` headers

### Backend API (Render — Web Service)

- Fastify 5 server on Node.js 20+
- 43 route files under `/v1` prefix
- Three global plugins: `authPlugin`, `tenantPlugin`, `auditPlugin`
- Handles all CRUD operations, AI chat routing, OAuth flows
- Can optionally run the engine tick inline (`ENGINE_ENABLED=true`)

### Database (Supabase)

- PostgreSQL 16 with PgBouncer for connection pooling
- 30+ tables, all scoped by `tenant_id`
- Prisma ORM for schema management and queries
- Supabase bucket (`kb_uploads`) for file storage at `tenants/{tenantId}/`

### Background Workers (Render — Worker Services)

| Worker | File | Purpose |
|--------|------|---------|
| Engine Loop | `backend/src/workers/engineLoop.ts` | Drains intent queue, executes workflows |
| Email Sender | `backend/src/workers/emailSender.ts` | Delivers queued emails (Microsoft Graph or Resend) |
| Scheduler | `backend/src/workers/schedulerWorker.ts` | Fires workflows on cron schedules |
| Job Worker | `backend/src/workers/jobWorker.ts` | Processes generic jobs |
| Reddit Worker | `backend/src/workers/redditWorker.ts` | Reddit platform monitoring |
| SMS Worker | `backend/src/workers/smsWorker.ts` | SMS delivery |
| Social Monitor | `backend/src/workers/socialMonitoringWorker.ts` | Social platform monitoring |

### External Integrations

- **AI Providers:** OpenAI, DeepSeek, Anthropic Claude, Google Gemini, OpenRouter, Cerebras
- **OAuth Platforms:** Google, Meta, X, Microsoft 365, Reddit, Pinterest, LinkedIn, TikTok, Tumblr
- **Communication:** Microsoft Graph (email, Teams), Telegram Bot API, Discord webhooks
- **Payments:** Stripe (billing, webhooks)
- **Infrastructure:** Supabase (auth, database, storage)

## Request Flow

1. User interacts with React frontend
2. Frontend sends request to `/v1/*` with JWT + tenant ID
3. `authPlugin` verifies JWT via Supabase Auth
4. `tenantPlugin` resolves tenant and verifies membership
5. Route handler processes the request
6. `auditPlugin` logs the request to `audit_log`
7. Response returns to frontend

## Engine Flow

1. User or scheduler creates an intent (status: `DRAFT`)
2. Engine loop claims the intent (`DRAFT` -> `VALIDATING`)
3. Subroutines build context packets
4. SGL evaluates the intent (ALLOW/REVIEW/BLOCK)
5. If ALLOW: workflow handler executes the action
6. Intent status updates to `EXECUTED` or `FAILED`
7. All steps logged to audit trail

## Desktop and Mobile

- **Electron:** Wraps the Vite frontend in a desktop window (`electron/main.js`)
- **Tauri:** Rust-based desktop wrapper (`src-tauri/`)
- **Expo:** React Native mobile app (`mobile/`)

All client apps connect to the same backend API.
