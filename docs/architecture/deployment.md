# Deployment Architecture

Atlas UX is deployed on a single **AWS Lightsail** instance running both the
frontend static files and backend API/worker processes. The database is an
**AWS Lightsail Managed PostgreSQL** instance. A GitHub Actions pipeline handles
CI for desktop (Tauri) builds.

---

## Infrastructure Overview

```
+--------------------------------------------------------------+
|                        GitHub Repository                      |
|  (source of truth for all code, configs, and CI pipelines)   |
+------+------------------+-----------------------------------+
       |                  |
       v                  v
  +-----------+    +--------------------+
  | Lightsail |    | Lightsail Managed  |
  | Instance  |    | PostgreSQL 16      |
  | 3.94.224.34|   +--------------------+
  +-----------+
  | Frontend  |
  | (static)  |
  | Backend   |
  | (PM2)     |
  +-----------+
```

## AWS Lightsail Instance (3.94.224.34)

The single Lightsail instance hosts both the frontend and backend.

### Frontend

The React SPA is deployed as static files served by the web server on the Lightsail instance.

| Setting        | Value                              |
|----------------|------------------------------------|
| Build command  | `npm run build`                    |
| Output dir     | `./dist`                           |
| Deploy path    | `/home/bitnami/dist/`              |
| Deploy method  | `scp` from local/CI to instance    |
| Framework      | Vite                               |
| Node version   | 18+                                |

#### Build & Deploy Process

```
Local machine (or CI)
        |
        v
npm run build (Vite)
  - Compiles TypeScript
  - Bundles React app
  - Splits chunks (react-vendor, router, ui-vendor, charts)
  - Outputs to ./dist
        |
        v
scp -r ./dist/* bitnami@3.94.224.34:/home/bitnami/dist/
        |
        v
Static files served via HTTPS at atlasux.cloud
```

#### Environment Variables (Frontend)

| Variable               | Description                        |
|------------------------|------------------------------------|
| `VITE_APP_GATE_CODE`  | Alpha access gate code             |
| `VITE_API_BASE_URL`   | Backend URL (`https://atlasux.cloud`) |

These are baked into the build at compile time (Vite `VITE_` prefix).

### Backend

The backend runs as multiple Node.js processes managed by **PM2** on the same Lightsail instance.

#### Service Inventory

```
+------------------------------------------------------------------+
|                    PM2 Process Manager                             |
+------------------------------------------------------------------+
|                                                                   |
|  [Process]  web                                                   |
|  Command: npm run start                                           |
|  Purpose: Fastify HTTP API server (port 8787)                     |
|                                                                   |
|  [Process]  email-worker                                          |
|  Command: npm run worker:email                                    |
|  Purpose: Polls jobs table for EMAIL_SEND, sends via MS Graph     |
|                                                                   |
|  [Process]  engine-worker                                         |
|  Command: npm run worker:engine                                   |
|  Purpose: Orchestration loop, ticks every 5s, processes jobs      |
|                                                                   |
|  [Process]  scheduler                                             |
|  Command: (scheduler entry point)                                 |
|  Purpose: Cron-like triggers, fires workflows on schedule         |
|                                                                   |
+------------------------------------------------------------------+
```

#### Build & Deploy Process

```
Local machine (or CI)
        |
        v
cd backend && npm run build (tsc)
  - Compiles TypeScript to JavaScript
  - Outputs to backend/dist/
        |
        v
scp files to bitnami@3.94.224.34
        |
        v
ssh: pm2 restart all
```

#### Environment Variable Management

Environment variables are set in the shell profile or PM2 ecosystem config on the Lightsail instance. All processes share the same set of environment variables.

#### Key Environment Variables

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

## AWS Lightsail Managed PostgreSQL (Database)

### Database

| Setting          | Value                              |
|------------------|------------------------------------|
| PostgreSQL       | Version 16                         |
| Hosting          | AWS Lightsail Managed Database     |
| Connection       | Direct connection string           |

```
Application ----> PostgreSQL (DATABASE_URL)
                       |
                  Managed by AWS Lightsail
                  Automatic backups
                  High availability option

Prisma Migrate -> Direct connection (DIRECT_URL) -> PostgreSQL
                       |
                  Required for migration DDL
```

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
                       v
              +----------------+
              | AWS Lightsail  |
              | 3.94.224.34    |
              | atlasux.cloud  |
              +--------+-------+
              |  Nginx / Caddy |
              |  (reverse proxy)|
              +--------+-------+
              |        |       |
         +----v--+ +---v---+  |
         |Static | |Fastify|  |
         |Files  | |API    |  |
         |(SPA)  | |:8787  |  |
         +-------+ +---+---+  |
                       |       |
         +-------------+---+---+
         |             |       |
    +----v---+  +----v----+  +-----v-----+
    | Engine |  | Email   |  | Scheduler |
    | Worker |  | Worker  |  | Worker    |
    +----+---+  +----+----+  +-----+-----+
         |            |              |
         +------------+--------------+
                      |
               +------v------+
               |  Lightsail  |
               |  Managed    |
               |  PostgreSQL |
               +------+------+
                      |
       +--------------+--------------+
       |              |              |
  +----v-------+  +---v--------+  +--v-----------+
  |  OpenAI    |  |  DeepSeek  |  |  OpenRouter   |
  |  API       |  |  API       |  |  API          |
  +------------+  +------------+  +---------------+
```

## Scaling Considerations

### Current State (Alpha)

- Single Lightsail instance running all services via PM2
- AWS Lightsail Managed PostgreSQL
- Static frontend files served from the same instance

### Future Scaling

| Component     | Scaling Strategy                                    |
|---------------|-----------------------------------------------------|
| Web API       | Vertical scaling (larger Lightsail instance) or migrate to ECS/EKS |
| Engine worker | Horizontal scaling with job locking on separate instances |
| Email worker  | Horizontal scaling with job locking                 |
| Scheduler     | Single instance only (to avoid duplicate triggers)  |
| Database      | Lightsail DB plan upgrade, read replicas            |
| Frontend      | Move to CloudFront CDN for global distribution      |

The scheduler must remain a single instance to prevent duplicate workflow
triggers. The engine and email workers can scale horizontally because the job
queue uses row-level locking to prevent duplicate processing.

## Health Monitoring

| Service        | Health Check                                |
|----------------|---------------------------------------------|
| Web API        | PM2 process monitoring + HTTP health check  |
| Engine worker  | PM2 process monitoring + logs               |
| Email worker   | PM2 process monitoring + logs               |
| Scheduler      | PM2 process monitoring + logs               |
| Database       | AWS Lightsail console monitoring            |

## Deployment Checklist

When deploying changes:

1. Build frontend: `npm run build`
2. Build backend: `cd backend && npm run build`
3. If schema changed: run `npx prisma migrate deploy` against production
4. Deploy frontend: `scp -r ./dist/* bitnami@3.94.224.34:/home/bitnami/dist/`
5. Deploy backend: `scp` backend/dist to instance, then `ssh` and `pm2 restart all`
6. If env vars changed: update on the Lightsail instance and restart PM2
7. Verify: check PM2 logs for startup errors (`pm2 logs`)
8. Verify: check frontend loads and can reach API

## Related Documentation

- [Architecture Overview](./README.md)
- [Backend Architecture](./backend.md)
- [Frontend Architecture](./frontend.md)
- [Job System Architecture](./job-system.md)
