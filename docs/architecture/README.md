# Architecture Overview

Atlas UX is a full-stack AI employee productivity platform where autonomous agents
automate business tasks. The system is composed of a React single-page application,
a Fastify API server, PostgreSQL database, background workers, and file storage —
deployed across Vercel, Render, and Supabase.

---

## High-Level System Diagram

```
                         Internet
                            |
              +-------------+-------------+
              |                           |
        +-----v------+            +------v-------+
        |   Vercel    |            |    Render    |
        |  (Frontend) |            |  (Backend)   |
        |  React SPA  |   REST    |  Fastify API |
        |  Vite build |---------->|  Port 8787   |
        +-------------+    /v1    +------+-------+
                                         |
                    +--------------------+--------------------+
                    |                    |                    |
             +------v------+     +------v------+     +------v------+
             |   Supabase  |     |   Render    |     |   Render    |
             | PostgreSQL  |     |   Workers   |     |  Scheduler  |
             |  + Storage  |     | Engine Loop |     |  Cron Jobs  |
             |  (Buckets)  |     | Email Send  |     |             |
             +-------------+     +-------------+     +-------------+
```

## Core Components

### Frontend (React SPA)

- **Framework:** React 18 with TypeScript
- **Build tool:** Vite with code splitting (react-vendor, router, ui-vendor, charts)
- **Styling:** Tailwind CSS with a dark theme (slate-900 backgrounds, cyan-500 accents)
- **Routing:** HashRouter from React Router v7
- **Deployment:** Vercel, serves static assets from `./dist`

The frontend communicates with the backend exclusively over REST. Every request
includes an `Authorization` header (JWT) and an `x-tenant-id` header for
multi-tenant isolation.

### Backend (Fastify API)

- **Framework:** Fastify 5 with TypeScript
- **ORM:** Prisma with PostgreSQL
- **Plugins:** authPlugin (JWT verification), tenantPlugin (tenant extraction),
  auditPlugin (mutation logging)
- **Routes:** 30+ route files mounted under `/v1`
- **Deployment:** Render web service (`srv-d62bnoq4d50c738b4e6g`)

The backend is the single source of truth. All business logic, authorization,
and data access pass through the Fastify server. Agent tools, OAuth flows, and
webhook handlers are all route-based.

### Database (PostgreSQL on Supabase)

- **Provider:** Supabase PostgreSQL 16
- **Schema:** 30+ Prisma models, all with `tenant_id` foreign key
- **Connections:** Pgbouncer pooling via `DATABASE_URL`, direct for migrations
  via `DIRECT_URL`
- **File storage:** Supabase bucket `kb_uploads` with tenant-scoped paths

### Background Workers (Render)

Four separate Render services run the backend workload:

| Service         | Render ID                        | Purpose                              |
|-----------------|----------------------------------|--------------------------------------|
| web (API)       | `srv-d62bnoq4d50c738b4e6g`       | Fastify HTTP server                  |
| email-worker    | `srv-d6eoq07gi27c73ae4ing`       | Polls jobs table for EMAIL_SEND      |
| engine-worker   | `srv-d6eoojkr85hc73frr5rg`       | Orchestration loop, ticks every 5s   |
| scheduler       | `srv-d6fk5utm5p6s73bqrohg`       | Cron-like workflow triggers           |

Workers share the same codebase but run different entry points. They connect
to the same Supabase database.

## Request Flow

A typical authenticated request follows this path:

```
Browser
  |
  |  1. GET /v1/agents   (Authorization: Bearer <jwt>, x-tenant-id: <tid>)
  v
Fastify Server
  |
  |-- authPlugin     -> Verify JWT, attach user to request
  |-- tenantPlugin   -> Extract tenant_id from header or query param
  |-- Route handler  -> Business logic, Prisma queries
  |-- auditPlugin    -> Log mutation to audit_log table (on write operations)
  |
  v
Response (JSON)
```

## Agent Orchestration Flow

Autonomous agent actions follow a different path through the engine worker:

```
Scheduler
  |  triggers workflow at scheduled time (e.g., WF-106 at 05:45 UTC)
  v
Jobs Table
  |  status: queued
  v
Engine Worker (ticks every 5s)
  |  picks up queued job, sets status: running
  |
  |-- Loads agent config (role, personality, tools)
  |-- Calls AI provider (OpenAI, DeepSeek, OpenRouter, Cerebras)
  |-- Executes tool calls (email, Slack, Telegram, data queries)
  |-- If high-risk: creates decision_memo for approval
  |-- Logs all actions to audit_log
  |
  v
Jobs Table
  |  status: completed or failed
  v
Audit Log (full trail)
```

## Safety Architecture

The platform enforces hard safety guardrails at multiple levels:

- **Spend limits:** Actions above `AUTO_SPEND_LIMIT_USD` require approval
- **Daily caps:** `MAX_ACTIONS_PER_DAY` enforced per agent
- **Risk tiers:** Risk tier >= 2 requires a `decision_memo` approval
- **Recurring blocks:** Recurring purchases are blocked by default
- **Audit trail:** Every mutation is logged; no silent changes
- **Confidence threshold:** Only auto-execute when above `CONFIDENCE_AUTO_THRESHOLD`

## Technology Stack Summary

| Layer        | Technology                                     |
|--------------|------------------------------------------------|
| Frontend     | React 18, TypeScript, Vite, Tailwind CSS       |
| Backend      | Fastify 5, TypeScript, Prisma                  |
| Database     | PostgreSQL 16 (Supabase)                       |
| File Storage | Supabase Storage (S3-compatible)               |
| AI Providers | OpenAI, DeepSeek, OpenRouter, Cerebras         |
| Auth         | JWT (custom), OAuth2 (Google, Meta, X)         |
| Desktop      | Electron (Tauri CI builds planned)             |
| Deployment   | Vercel (frontend), Render (backend + workers)  |
| Messaging    | Telegram Bot API, Microsoft Graph (email)      |

## Related Documentation

| Document | Description |
|----------|-------------|
| [System Overview](./system-overview.md) | Detailed system diagram with all components |
| [Multi-Tenancy](./multi-tenancy.md) | Tenant isolation via `x-tenant-id`, DB FK constraints |
| [Auth Flow](./auth-flow.md) | JWT authentication: login, token storage, verification |
| [Job System](./job-system.md) | Job lifecycle: `queued` -> `running` -> `completed`/`failed` |
| [SGL Governance](./sgl-governance.md) | Statutory Guardrail Layer: ALLOW/REVIEW/BLOCK |
| [Agent Hierarchy](./agent-hierarchy.md) | Org chart: Board -> Executive -> Governors -> Specialists |
| [Workflow System](./workflow-system.md) | Workflow registry (WF-001 to WF-108), scheduler triggers |
| [Audit System](./audit-system.md) | Immutable audit trail, compliance requirements |
| [Integrations Map](./integrations-map.md) | External integrations: Microsoft, Telegram, Stripe, social |

For hands-on development guides, see [docs/developer/](../developer/README.md).
