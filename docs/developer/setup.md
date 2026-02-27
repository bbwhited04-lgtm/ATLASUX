# Local Development Setup

## Prerequisites

- **Node.js 20+** (check with `node -v`)
- **npm** (ships with Node)
- **Docker** and **Docker Compose** (for local PostgreSQL)
- **Git**

## 1. Clone and Install

```bash
git clone <repo-url> atlasux
cd atlasux

# Frontend dependencies (root)
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

## 2. Start Local PostgreSQL

The backend ships a `docker-compose.yml` that runs PostgreSQL 16.

```bash
docker-compose -f backend/docker-compose.yml up -d
```

This creates a database named `atlas` with user `atlas` / password `atlas` on port 5432.

## 3. Configure Environment Variables

### Frontend (root `.env`)

```env
VITE_APP_GATE_CODE=your-gate-code
VITE_API_BASE_URL=http://localhost:8787
```

### Backend (`backend/.env`)

```env
# Database (local Docker)
DATABASE_URL=postgresql://atlas:atlas@localhost:5432/atlas
DIRECT_URL=postgresql://atlas:atlas@localhost:5432/atlas

# Supabase (required even for local — token vault + auth)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI providers (at least one required for chat)
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=...

# Engine (optional for dev — disable if not testing engine)
ENGINE_ENABLED=false
ENGINE_TICK_INTERVAL_MS=5000
```

See [env-vars.md](./env-vars.md) for the complete variable reference.

## 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

Optionally seed the database:

```bash
npx prisma db seed
```

Launch Prisma Studio to browse data:

```bash
npx prisma studio
```

## 5. Start the Dev Servers

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev          # tsx watch mode, auto-recompiles on save
```

The Fastify server starts on `http://localhost:8787`.

**Terminal 2 — Frontend:**
```bash
npm run dev          # Vite dev server
```

The React app starts on `http://localhost:5173`.

## 6. Optional: Run Workers

Workers are separate Node processes. Start them only when testing engine or email features:

```bash
cd backend
npm run worker:engine      # Engine loop (intent processing)
npm run worker:email       # Email sender (drains EMAIL_SEND jobs)
npm run worker:scheduler   # Scheduler (fires workflows on cron)
npm run worker:jobs        # Generic job worker
```

## 7. Desktop App (Electron)

```bash
npm run electron:dev       # Starts Vite + Electron concurrently
```

## 8. Desktop App (Tauri)

Requires Rust toolchain. See [tauri-desktop.md](./tauri-desktop.md).

```bash
npm run tauri:dev
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `prisma generate` fails | Ensure `DATABASE_URL` is set in `backend/.env` |
| Port 5432 in use | Stop any local Postgres or change Docker port mapping |
| CORS errors | Verify `VITE_API_BASE_URL` matches backend port |
| Auth 401 on every request | Supabase URL + service role key must be valid |
| `AuditLevel enum missing` | Run `npx prisma migrate dev` to create enums |
