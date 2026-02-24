# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Atlas UX** is a full-stack AI employee productivity platform with autonomous agents that automate business tasks. It runs as both a web SPA (deployed on Vercel + Render) and an Electron desktop app. The project is in Alpha, targeting a 7-day stability test with built-in approval workflows and safety guardrails.

## Commands

### Frontend (root directory)
```bash
npm run dev            # Vite dev server at localhost:5173
npm run build          # Production build to ./dist
npm run preview        # Preview production build
npm run electron:dev   # Run Electron desktop app
npm run electron:build # Build Electron app
```

### Backend (cd backend/)
```bash
npm run dev            # tsx watch mode (auto-recompile)
npm run build          # tsc compile to ./dist
npm run start          # Start Fastify server (port 8787)
npm run worker:engine  # Run AI orchestration loop
npm run worker:email   # Run email sender worker
```

### Database
```bash
docker-compose -f backend/docker-compose.yml up   # Local PostgreSQL 16
npx prisma migrate dev                             # Run migrations
npx prisma studio                                  # DB GUI
npx prisma db seed                                 # Seed database
```

### Knowledge Base
```bash
cd backend && npm run kb:ingest-agents  # Ingest agent docs
cd backend && npm run kb:chunk-docs     # Chunk KB documents
```

## Architecture

### Directory Structure
- `src/` — React 18 frontend (Vite + TypeScript + Tailwind CSS)
  - `components/` — Feature components (40+, often 10–70KB each)
  - `pages/` — Public-facing pages (Landing, Blog, Privacy, Terms, Store)
  - `lib/` — Client utilities (`api.ts`, `activeTenant.tsx` context)
  - `core/` — Client-side domain logic (agents, audit, exec, SGL)
  - `config/` — Email maps, AI personality config
  - `routes.ts` — All app routes (HashRouter-based)
- `backend/src/` — Fastify 5 + TypeScript backend
  - `routes/` — 30+ route files, all mounted under `/v1`
  - `core/engine/` — Main AI orchestration engine
  - `plugins/` — Fastify plugins: `authPlugin`, `tenantPlugin`, `auditPlugin`
  - `domain/` — Business domain logic (audit, content, ledger)
  - `services/` — Service layer
  - `tools/` — Tool integrations (Outlook, Slack)
  - `workers/` — `engineLoop.ts` (ticks every 5s), `emailSender.ts`
  - `jobs/` — Database-backed job queue
  - `ai.ts` — AI provider setup (OpenAI, DeepSeek, OpenRouter, Cerebras)
  - `env.ts` — All environment variable definitions
- `backend/prisma/` — Prisma schema (30KB+) and migrations
- `electron/` — Electron main process and preload
- `Agents/` — Agent configurations and policies
- `policies/` — SGL.md (System Governance Language DSL), EXECUTION_CONSTITUTION.md
- `workflows/` — Predefined workflow definitions

### Key Architectural Patterns

**Multi-Tenancy:** Every DB table has a `tenant_id` FK. The backend's `tenantPlugin` extracts `x-tenant-id` from request headers.

**Authentication:** JWT-based via `authPlugin.ts`. Frontend sends token in Authorization header.

**Audit Trail:** All mutations must be logged to `audit_log` table via `auditPlugin`. This is a hard requirement for Alpha compliance.

**Job System:** Async work is queued to the `jobs` DB table (statuses: queued → running → completed/failed). The engine loop picks up jobs periodically.

**Engine Loop:** `workers/engineLoop.ts` is a separate Node process that ticks every `ENGINE_TICK_INTERVAL_MS` (default 5000ms). It handles the orchestration of autonomous agent actions.

**AI Agents:** Named agents (Atlas=CEO, Binky=CRO, etc.) each have their own email accounts and role definitions. Agent behavior is governed by SGL policies.

**Decisions/Approval Workflow:** High-risk actions (recurring charges, spend above `AUTO_SPEND_LIMIT_USD`, risk tier ≥ 2) require a `decision_memo` approval before execution.

**Frontend Routing:** Uses `HashRouter` from React Router v7. All routes are defined in `src/routes.ts`.

**Code Splitting:** Vite config splits chunks into `react-vendor`, `router`, `ui-vendor`, `charts`.

### Environment Variables

**Frontend (root `.env`):**
- `VITE_APP_GATE_CODE` — Access code gate
- `VITE_API_BASE_URL` — Backend URL (default: `http://localhost:8787`)

**Backend (`backend/.env`):**
- DB: `DATABASE_URL`, `DIRECT_URL` (Supabase Pgbouncer + direct)
- AI: `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`
- OAuth: `GOOGLE_CLIENT_ID/SECRET`, `META_APP_ID/SECRET`, `X_CLIENT_ID/SECRET`
- Engine: `ENGINE_ENABLED`, `ENGINE_TICK_INTERVAL_MS`
- Safety: `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, `CONFIDENCE_AUTO_THRESHOLD`
- Agent emails: one per named agent

### Deployment
- **Frontend:** Vercel (`npm run build`, deploys `./dist`)
- **Backend:** Render (`render.yaml`; build: `npm install && npm run build`; start: `npm run start`)
- **Database:** Supabase PostgreSQL

### Alpha Safety Constraints
The platform enforces hard safety guardrails:
- Recurring purchases blocked by default
- Daily action cap (`MAX_ACTIONS_PER_DAY`) enforced
- Daily posting cap enforced
- All mutations logged to audit trail
- Approval required for any spend above limit or risk tier ≥ 2
