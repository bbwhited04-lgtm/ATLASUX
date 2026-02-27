# Deployment

Atlas UX runs across three platforms: **Vercel** (frontend), **Render** (backend services), and **Supabase** (database + auth).

## Architecture

```
Vercel (frontend)  ──>  Render (backend API)  ──>  Supabase (PostgreSQL)
                        Render (engine worker)
                        Render (email worker)
                        Render (scheduler)
                        Render (jobs worker)
                        Render (social worker)
```

## Frontend: Vercel

The React SPA is deployed on Vercel. It builds with Vite and outputs to `./dist`.

```bash
npm run build    # Builds to ./dist
npm run preview  # Preview the production build locally
```

**Vercel configuration:**
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: 18+

**Frontend environment variables** (set in Vercel dashboard):

| Variable              | Example                        | Description            |
|-----------------------|--------------------------------|------------------------|
| `VITE_APP_GATE_CODE`  | `atlas2026`                   | Access code gate       |
| `VITE_API_BASE_URL`   | `https://atlasux-backend.onrender.com` | Backend API URL |

## Backend: Render

The backend runs as **six services** on Render, defined in `render.yaml`:

| Service                  | Type   | Start Command              | Purpose                          |
|--------------------------|--------|----------------------------|----------------------------------|
| `atlasux-backend`        | web    | `npm run start`            | Fastify API server               |
| `atlasux-email-worker`   | worker | `npm run worker:email`     | Email delivery (Microsoft/Resend)|
| `atlasux-engine-worker`  | worker | `npm run worker:engine`    | AI orchestration engine loop     |
| `atlasux-scheduler`      | worker | `npm run worker:scheduler` | Cron-like workflow triggers      |
| `atlasux-jobs-worker`    | worker | `npm run worker:jobs`      | General job processing           |
| `atlasux-social-worker`  | worker | `npm run worker:social`    | Social media publishing          |

All services share the same build step:

```yaml
buildCommand: npm install && npm run build
```

### render.yaml

```yaml
services:
  - type: web
    name: atlasux-backend
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /health

  - type: worker
    name: atlasux-scheduler
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run worker:scheduler

  - type: worker
    name: atlasux-email-worker
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run worker:email

  - type: worker
    name: atlasux-engine-worker
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run worker:engine

  - type: worker
    name: atlasux-jobs-worker
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run worker:jobs

  - type: worker
    name: atlasux-social-worker
    env: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm run worker:social
```

### Render Service IDs

| Service          | Render ID                          |
|------------------|------------------------------------|
| web              | `srv-d62bnoq4d50c738b4e6g`        |
| email-worker     | `srv-d6eoq07gi27c73ae4ing`        |
| engine-worker    | `srv-d6eoojkr85hc73frr5rg`        |
| scheduler        | `srv-d6fk5utm5p6s73bqrohg`        |

## Environment Variables on Render

All services need the same environment variables. When pushing env vars via the Render API, you must push to **all services** and **deduplicate keys** (the PUT endpoint replaces all vars):

```bash
# Push to all services
for SID in srv-d62bnoq4d50c738b4e6g srv-d6eoq07gi27c73ae4ing srv-d6eoojkr85hc73frr5rg srv-d6fk5utm5p6s73bqrohg; do
  curl -X PUT "https://api.render.com/v1/services/$SID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d @env-vars.json
done
```

**Key variables that must be set:**

```
DATABASE_URL=postgresql://...        # Supabase PgBouncer URL
DIRECT_URL=postgresql://...          # Supabase direct URL
SUPABASE_URL=https://...             # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...        # Supabase service role key
OPENAI_API_KEY=sk-...                # At least one AI provider
ENGINE_ENABLED=true                  # Enable engine (on engine worker)
SCHEDULER_ENABLED=true               # Enable scheduler (on scheduler)
OUTBOUND_EMAIL_PROVIDER=microsoft    # Email provider
MS_TENANT_ID=...                     # Microsoft Graph credentials
MS_CLIENT_ID=...
MS_CLIENT_SECRET=...
MS_SENDER_UPN=atlas@deadapp.info
```

See [environment-vars.md](./environment-vars.md) for the complete reference.

## Database: Supabase

PostgreSQL 16 is hosted on Supabase. Two connection strings are used:

- **`DATABASE_URL`** -- PgBouncer pooled connection (for runtime queries).
- **`DIRECT_URL`** -- Direct connection (for Prisma migrations).

File storage uses the `kb_uploads` Supabase bucket with tenant-scoped paths: `tenants/{tenantId}/`.

### Running Migrations in Production

```bash
cd backend
DATABASE_URL="postgres://..." DIRECT_URL="postgres://..." npx prisma migrate deploy
```

Never run `migrate dev` against production. Use `migrate deploy` which only applies pending migrations without generating new ones. Always use the direct URL (not PgBouncer) for migrations.

## Deployment Workflow

### Automatic Deploy

1. Push to `main` branch.
2. Vercel auto-deploys the frontend.
3. Render auto-deploys all backend services (connected to the same repo).

### Verifying Deployment

```bash
# Check backend health
curl https://atlasux-backend.onrender.com/v1/health

# Check runtime status
curl -H "Authorization: Bearer $TOKEN" \
     https://atlasux-backend.onrender.com/v1/runtime/status
```

## CORS Configuration

The backend allows requests from:

```typescript
const allowed = new Set([
  "https://www.atlasux.cloud",
  "https://atlasux.cloud",
  "http://localhost:5173",
  "http://localhost:3000",
]);
```

Custom headers allowed: `Content-Type`, `Authorization`, `x-tenant-id`, `x-user-id`, `x-device-id`, `x-request-id`, `x-client-source`, `x-inbound-secret`.

## Local Development

```bash
# Start the database
docker-compose -f backend/docker-compose.yml up -d

# Start the backend
cd backend && npm run dev

# Start the frontend (separate terminal)
npm run dev
```

The local frontend runs on `localhost:5173` and expects the backend at `localhost:8787`.

## Monitoring

- Check Render dashboard for service logs and health status.
- Query the `audit_log` table for system activity.
- Use the Agent Watcher UI (`/app/watcher`) for real-time monitoring.
- Runtime status endpoint: `GET /v1/runtime/status` shows engine state and last tick time.
