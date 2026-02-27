# Deployment Architecture

Atlas UX is deployed across three infrastructure providers: Vercel for the
frontend SPA, Render for the backend API and worker processes, and Supabase for
the database and file storage. A GitHub Actions pipeline handles CI for desktop
(Tauri) builds.

---

## Infrastructure Overview

```
+--------------------------------------------------------------+
|                        GitHub Repository                      |
|  (source of truth for all code, configs, and CI pipelines)   |
+------+------------------+------------------+-----------------+
       |                  |                  |
       v                  v                  v
  +---------+      +------------+      +-----------+
  | Vercel  |      |   Render   |      |  Supabase |
  | Frontend|      |  Backend   |      |  Database  |
  +---------+      +------------+      |  + Storage |
                   | 4 services |      +-----------+
                   +------------+
```

## Vercel (Frontend)

The React SPA is deployed on Vercel as a static site.

| Setting        | Value                              |
|----------------|------------------------------------|
| Build command  | `npm run build`                    |
| Output dir     | `./dist`                           |
| Framework      | Vite                               |
| Node version   | 18+                                |

### Build Process

```
GitHub push to main
        |
        v
Vercel detects change
        |
        v
npm install
        |
        v
npm run build (Vite)
  - Compiles TypeScript
  - Bundles React app
  - Splits chunks (react-vendor, router, ui-vendor, charts)
  - Outputs to ./dist
        |
        v
Deploy to Vercel CDN
  - Global edge distribution
  - Automatic HTTPS
  - Serves index.html for all routes (SPA)
```

### Environment Variables (Vercel)

| Variable               | Description                        |
|------------------------|------------------------------------|
| `VITE_APP_GATE_CODE`  | Alpha access gate code             |
| `VITE_API_BASE_URL`   | Backend URL (Render web service)   |

These are baked into the build at compile time (Vite `VITE_` prefix).

## Render (Backend)

The backend runs as four separate Render services, all from the same codebase
but with different start commands.

### Service Inventory

```
+------------------------------------------------------------------+
|                    Render Dashboard                                |
+------------------------------------------------------------------+
|                                                                   |
|  [Web Service]     srv-d62bnoq4d50c738b4e6g                     |
|  Name: web                                                       |
|  Command: npm run start                                          |
|  Purpose: Fastify HTTP API server (port 8787)                    |
|                                                                   |
|  [Worker Service]  srv-d6eoq07gi27c73ae4ing                     |
|  Name: email-worker                                              |
|  Command: npm run worker:email                                   |
|  Purpose: Polls jobs table for EMAIL_SEND, sends via MS Graph    |
|                                                                   |
|  [Worker Service]  srv-d6eoojkr85hc73frr5rg                     |
|  Name: engine-worker                                             |
|  Command: npm run worker:engine                                  |
|  Purpose: Orchestration loop, ticks every 5s, processes jobs     |
|                                                                   |
|  [Worker Service]  srv-d6fk5utm5p6s73bqrohg                     |
|  Name: scheduler                                                 |
|  Command: (scheduler entry point)                                |
|  Purpose: Cron-like triggers, fires workflows on schedule        |
|                                                                   |
+------------------------------------------------------------------+
```

### Build Configuration (render.yaml)

All four services share the same build process:

```yaml
services:
  - type: web
    name: web
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start

  - type: worker
    name: email-worker
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run worker:email

  - type: worker
    name: engine-worker
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run worker:engine

  - type: worker
    name: scheduler
    env: node
    buildCommand: npm install && npm run build
    startCommand: (scheduler start command)
```

### Build Process

```
GitHub push to main
        |
        v
Render detects change (all 4 services)
        |
        v
For each service:
  npm install
        |
        v
  npm run build (tsc)
    - Compiles TypeScript to JavaScript
    - Outputs to backend/dist/
        |
        v
  Start service with respective command
```

### Environment Variable Management

All four Render services share the same set of environment variables. When
updating variables, changes must be pushed to all four services:

```
PUT /v1/services/{service-id}/env-vars

IMPORTANT: This API replaces ALL env vars for the service.
           Always deduplicate keys before pushing.
           Push to all 4 service IDs.
```

Service IDs for env var updates:

- `srv-d62bnoq4d50c738b4e6g` (web)
- `srv-d6eoq07gi27c73ae4ing` (email-worker)
- `srv-d6eoojkr85hc73frr5rg` (engine-worker)
- `srv-d6fk5utm5p6s73bqrohg` (scheduler)

### Key Environment Variables (Render)

| Category    | Variables                                              |
|-------------|--------------------------------------------------------|
| Database    | `DATABASE_URL`, `DIRECT_URL`                           |
| AI          | `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`                   |
| OAuth       | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`             |
|             | `META_APP_ID`, `META_APP_SECRET`                       |
|             | `X_CLIENT_ID`, `X_CLIENT_SECRET`                       |
| Engine      | `ENGINE_ENABLED`, `ENGINE_TICK_INTERVAL_MS`            |
| Safety      | `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`          |
|             | `CONFIDENCE_AUTO_THRESHOLD`                            |
| Email       | `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`     |
|             | `MS_SENDER_UPN`, `OUTBOUND_EMAIL_PROVIDER`             |
| Telegram    | `BOTFATHERTOKEN`                                       |
| Supabase    | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`            |

## Supabase (Database + Storage)

### Database

| Setting          | Value                              |
|------------------|------------------------------------|
| PostgreSQL       | Version 16                         |
| Connection pool  | Pgbouncer (transaction mode)       |
| Direct access    | For migrations only                |

```
Application ----> Pgbouncer (DATABASE_URL) ----> PostgreSQL
                       |
                  Connection pooling
                  Transaction mode
                  Handles concurrent connections
                  from API + 3 workers

Prisma Migrate -> Direct connection (DIRECT_URL) -> PostgreSQL
                       |
                  No pooling
                  Required for migration DDL
```

### File Storage

| Setting     | Value                                    |
|-------------|------------------------------------------|
| Bucket      | `kb_uploads`                             |
| Path format | `tenants/{tenantId}/filename.ext`        |
| Auth        | Supabase service role key (JWT)          |
| API         | S3-compatible                            |

## GitHub Actions (CI/CD)

### Desktop Builds (Tauri)

GitHub Actions handles CI for the Electron/Tauri desktop application builds:

```
GitHub push (or manual trigger)
        |
        v
GitHub Actions workflow
        |
        v
Matrix build:
  - Windows (x64)
  - macOS (x64, arm64)
  - Linux (x64)
        |
        v
Build artifacts:
  - .exe (Windows)
  - .dmg (macOS)
  - .AppImage / .deb (Linux)
```

## Deployment Topology

```
                    End Users
                       |
          +------------+------------+
          |                         |
     +----v-----+            +-----v----+
     |  Vercel  |            |  Render  |
     |  CDN     |            |  Web     |
     |  (SPA)   |    /v1     |  (API)   |
     |          |----------->|  :8787   |
     +----------+            +----+-----+
                                  |
                    +-------------+-------------+
                    |             |             |
               +----v---+  +----v----+  +-----v-----+
               | Engine |  | Email   |  | Scheduler |
               | Worker |  | Worker  |  | Worker    |
               +----+---+  +----+----+  +-----+-----+
                    |            |              |
                    +------------+--------------+
                                 |
                          +------v------+
                          |  Supabase   |
                          | PostgreSQL  |
                          | + Storage   |
                          +-------------+
```

## Scaling Considerations

### Current State (Alpha)

- Single instance of each Render service
- Supabase free/pro tier database
- Vercel hobby/pro plan for frontend

### Future Scaling

| Component     | Scaling Strategy                                    |
|---------------|-----------------------------------------------------|
| Web API       | Horizontal scaling (multiple Render instances)      |
| Engine worker | Horizontal scaling with job locking                 |
| Email worker  | Horizontal scaling with job locking                 |
| Scheduler     | Single instance only (to avoid duplicate triggers)  |
| Database      | Supabase plan upgrade, read replicas               |
| Frontend      | Already globally distributed via Vercel CDN         |

The scheduler must remain a single instance to prevent duplicate workflow
triggers. The engine and email workers can scale horizontally because the job
queue uses row-level locking to prevent duplicate processing.

## Health Monitoring

| Service        | Health Check                                |
|----------------|---------------------------------------------|
| Web API        | Render automatic HTTP health check          |
| Engine worker  | Logs engine tick activity                   |
| Email worker   | Logs email processing activity              |
| Scheduler      | Logs scheduled workflow triggers            |
| Database       | Supabase dashboard monitoring               |

## Deployment Checklist

When deploying changes:

1. Push to GitHub main branch
2. Vercel auto-deploys frontend (2-3 minutes)
3. Render auto-deploys all 4 backend services (3-5 minutes)
4. If schema changed: run `npx prisma migrate deploy` against production
5. If env vars changed: push to all 4 Render services
6. Verify: check Render logs for startup errors
7. Verify: check frontend loads and can reach API

## Related Documentation

- [Architecture Overview](./README.md)
- [Backend Architecture](./backend.md)
- [Frontend Architecture](./frontend.md)
- [Job System Architecture](./job-system.md)
