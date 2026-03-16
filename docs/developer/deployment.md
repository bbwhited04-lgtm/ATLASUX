# Deployment

Atlas UX runs on **AWS Lightsail**: a single instance at **3.94.224.34** hosts both the frontend (static files) and backend (PM2-managed Node.js processes). The database is an **AWS Lightsail Managed PostgreSQL** instance.

## Architecture

```
AWS Lightsail Instance (3.94.224.34)
  ├── Frontend static files (/home/bitnami/dist/)
  ├── Backend API (PM2: web)
  ├── Engine worker (PM2: engine-worker)
  ├── Email worker (PM2: email-worker)
  ├── Scheduler (PM2: scheduler)
  └── Jobs worker (PM2: jobs-worker)

AWS Lightsail Managed PostgreSQL
  └── PostgreSQL 16
```

## Frontend Deployment

The React SPA is built with Vite and deployed as static files via `scp`.

```bash
npm run build    # Builds to ./dist
npm run preview  # Preview the production build locally
```

**Deploy to production:**

```bash
scp -r ./dist/* bitnami@3.94.224.34:/home/bitnami/dist/
```

**Frontend environment variables** (baked in at build time):

| Variable              | Example                        | Description            |
|-----------------------|--------------------------------|------------------------|
| `VITE_APP_GATE_CODE`  | `atlas2026`                   | Access code gate       |
| `VITE_API_BASE_URL`   | `https://atlasux.cloud`       | Backend API URL        |

## Backend Deployment

The backend runs as multiple PM2-managed processes on the Lightsail instance.

| Process                  | Start Command              | Purpose                          |
|--------------------------|----------------------------|----------------------------------|
| `web`                    | `npm run start`            | Fastify API server               |
| `email-worker`           | `npm run worker:email`     | Email delivery (Microsoft/Resend)|
| `engine-worker`          | `npm run worker:engine`    | AI orchestration engine loop     |
| `scheduler`              | `npm run worker:scheduler` | Cron-like workflow triggers      |
| `jobs-worker`            | `npm run worker:jobs`      | General job processing           |

**Build and deploy:**

```bash
cd backend
npm run build
# scp dist/ to instance, then:
# ssh bitnami@3.94.224.34 "cd /home/bitnami/backend && pm2 restart all"
```

## Environment Variables

Environment variables are configured on the Lightsail instance (e.g., in the PM2 ecosystem config or shell profile). All processes share the same environment.

**Key variables that must be set:**

```
DATABASE_URL=postgresql://...        # Lightsail Managed PostgreSQL URL
DIRECT_URL=postgresql://...          # Direct connection for migrations
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

## Database: AWS Lightsail Managed PostgreSQL

PostgreSQL 16 is hosted on AWS Lightsail Managed Database. Two connection strings are used:

- **`DATABASE_URL`** -- Primary connection string (for runtime queries).
- **`DIRECT_URL`** -- Direct connection (for Prisma migrations).

### Running Migrations in Production

```bash
cd backend
DATABASE_URL="postgres://..." DIRECT_URL="postgres://..." npx prisma migrate deploy
```

Never run `migrate dev` against production. Use `migrate deploy` which only applies pending migrations without generating new ones.

## Deployment Workflow

### Manual Deploy

1. Build frontend and backend locally.
2. `scp` frontend dist to `/home/bitnami/dist/` on 3.94.224.34.
3. `scp` backend dist to the instance.
4. SSH in and run `pm2 restart all`.

### Verifying Deployment

```bash
# Check backend health
curl https://atlasux.cloud/v1/health

# Check runtime status
curl -H "Authorization: Bearer $TOKEN" \
     https://atlasux.cloud/v1/runtime/status

# Check PM2 process status
ssh bitnami@3.94.224.34 "pm2 status"
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

- Check PM2 process status and logs: `pm2 status`, `pm2 logs`
- Query the `audit_log` table for system activity.
- Use the Agent Watcher UI (`/app/watcher`) for real-time monitoring.
- Runtime status endpoint: `GET /v1/runtime/status` shows engine state and last tick time.
- AWS Lightsail console for instance and database metrics.
