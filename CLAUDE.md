# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Atlas UX** is a full-stack AI receptionist platform for trade businesses (plumbers, salons, HVAC). Lucy answers calls 24/7, books appointments, sends SMS confirmations, and notifies via Slack — for $99/mo. It runs as a web SPA and Electron desktop app, deployed on AWS Lightsail. The project is in Beta with built-in approval workflows and safety guardrails.

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
  - `plugins/` — Fastify plugins: `authPlugin`, `tenantPlugin`, `auditPlugin`, `csrfPlugin`, `tenantRateLimit`
  - `domain/` — Business domain logic (audit, content, ledger)
  - `services/` — Service layer (`elevenlabs.ts`, `credentialResolver.ts`, etc.)
  - `tools/` — Tool integrations (Outlook, Slack)
  - `workers/` — `engineLoop.ts` (ticks every 5s), `emailSender.ts`
  - `jobs/` — Database-backed job queue
  - `lib/encryption.ts` — AES-256-GCM encryption for stored credentials
  - `lib/webSearch.ts` — Multi-provider web search (You.com, Brave, Exa, Tavily, SerpAPI) with randomized rotation
  - `ai.ts` — AI provider setup (OpenAI, DeepSeek, OpenRouter, Cerebras)
  - `env.ts` — All environment variable definitions
- `backend/prisma/` — Prisma schema (30KB+) and migrations
- `electron/` — Electron main process and preload
- `Agents/` — Agent configurations and policies
- `policies/` — SGL.md (System Governance Language DSL), EXECUTION_CONSTITUTION.md
- `workflows/` — Predefined workflow definitions

### Key Architectural Patterns

**Multi-Tenancy:** Every DB table has a `tenant_id` FK. The backend's `tenantPlugin` extracts `x-tenant-id` from request headers.

**Authentication:** JWT-based via `authPlugin.ts` (HS256, issuer/audience validated). Frontend sends token in Authorization header. Revoked tokens are checked against a `revokedToken` table (fail-closed). Expired revoked tokens are pruned daily.

**CSRF Protection:** DB-backed synchronizer token pattern via `csrfPlugin.ts`. Tokens are issued on mutating responses, stored in `oauth_state` with 1-hour TTL, and validated on all state-changing requests. Webhook/callback endpoints are exempt (see `SKIP_PREFIXES` in the plugin).

**Audit Trail:** All mutations must be logged to `audit_log` table via `auditPlugin`. Successful GETs and health/polling endpoints are skipped to reduce noise. On DB write failure, audit events fall back to stderr (never lost). Hash chain integrity (SOC 2 CC7.2) via `lib/auditChain.ts`.

**Job System:** Async work is queued to the `jobs` DB table (statuses: queued → running → completed/failed). The engine loop picks up jobs periodically.

**Engine Loop:** `workers/engineLoop.ts` is a separate Node process that ticks every `ENGINE_TICK_INTERVAL_MS` (default 5000ms). It handles the orchestration of autonomous agent actions.

**AI Agents:** Named agents (Atlas=CEO, Binky=CRO, etc.) each have their own email accounts and role definitions. Agent behavior is governed by SGL policies.

**Decisions/Approval Workflow:** High-risk actions (recurring charges, spend above `AUTO_SPEND_LIMIT_USD`, risk tier ≥ 2) require a `decision_memo` approval before execution.

**Frontend Routing:** Uses `HashRouter` from React Router v7. All routes are defined in `src/routes.ts`.

**Code Splitting:** Vite config splits chunks into `react-vendor`, `router`, `ui-vendor`, `charts`.

**ElevenLabs Voice Agents:** Lucy's voice is powered by ElevenLabs Conversational AI. The integration lives in `services/elevenlabs.ts` (agent CRUD, phone number management, persona prompt builder) and `routes/elevenlabsRoutes.ts` (webhook endpoints + management API). Webhooks are validated via `ELEVENLABS_WEBHOOK_SECRET` using timing-safe comparison. Mid-call tools (book appointment, send SMS, take message) are registered as webhook tools on agent creation. Routes mount at `/v1/elevenlabs`.

**Credential Resolver:** `services/credentialResolver.ts` resolves per-tenant API keys. Lookup order: (1) `tenant_credentials` table (AES-256-GCM encrypted at rest via `TOKEN_ENCRYPTION_KEY`), (2) `process.env` fallback for the platform owner tenant only. Results are cached in-memory for 5 minutes.

### Environment Variables

**Frontend (root `.env`):**
- `VITE_APP_GATE_CODE` — Access code gate
- `VITE_API_BASE_URL` — Backend URL (default: `http://localhost:8787`)

**Backend (`backend/.env`):**
- DB: `DATABASE_URL` (AWS Lightsail PostgreSQL)
- AI: `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`
- Voice: `ELEVENLABS_API_KEY`, `ELEVENLABS_WEBHOOK_SECRET`
- Web search: `YOU_COM_API_KEY`, `BRAVE_SEARCH_API_KEY`, `EXA_API_KEY`, `TAVILY_API_KEY`, `SERP_API_KEY`
- OAuth: `GOOGLE_CLIENT_ID/SECRET`, `META_APP_ID/SECRET`, `X_CLIENT_ID/SECRET`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_SUB_WEBHOOK_SECRET`
- Security: `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY` (64 hex chars, AES-256), `VIRUS_SCAN_ENABLED`, `VIRUSTOTAL_API_KEY`
- Engine: `ENGINE_ENABLED`, `ENGINE_TICK_INTERVAL_MS`
- Safety: `AUTO_SPEND_LIMIT_USD`, `MAX_ACTIONS_PER_DAY`, `CONFIDENCE_AUTO_THRESHOLD`
- Agent emails: one per named agent

### Deployment
- **Frontend:** AWS Lightsail (`npm run build`, deploy via `scp` to `/home/bitnami/dist/` on `3.94.224.34`)
- **Backend:** AWS Lightsail (PM2 managed Node.js process on same instance)
- **Database:** AWS Lightsail Managed PostgreSQL 16
- **SSH:** `ssh -i ~/.ssh/lightsail-default.pem bitnami@3.94.224.34`

### Security Hardening
- **JWT validation:** issuer + audience claims enforced; token blacklist checked fail-closed
- **CSRF:** DB-backed synchronizer tokens on all mutating requests (webhook endpoints exempt)
- **Credential encryption:** Stored API keys encrypted at rest (AES-256-GCM via `TOKEN_ENCRYPTION_KEY`)
- **SQL injection fix:** `withTenant()` uses parameterized `$executeRaw` (not `$executeRawUnsafe`)
- **Webhook auth:** ElevenLabs webhooks validated via timing-safe secret comparison
- **Log redaction:** Authorization, cookie, CSRF, gate-key, and webhook-secret headers redacted from Fastify logs
- **HSTS + Helmet:** 1-year max-age, includeSubDomains, strict referrer policy

### Alpha Safety Constraints
The platform enforces hard safety guardrails:
- Recurring purchases blocked by default
- Daily action cap (`MAX_ACTIONS_PER_DAY`) enforced
- Daily posting cap enforced
- All mutations logged to audit trail (stderr fallback on DB failure)
- Approval required for any spend above limit or risk tier ≥ 2

---

## MANDATORY BUILD RULES — ALL AI TOOLS MUST FOLLOW

**These rules apply to Claude Code, Windsurf, Cursor, ChatGPT, Copilot, and any other AI tool working in this repo. No exceptions.**

### 1. Build before commit — ALWAYS
Before committing ANY backend change, run:
```bash
cd backend && npm run build
```
Before committing ANY frontend change, run:
```bash
npm run build
```
If either build fails, **do not commit**. Fix every error first. A broken build takes down production — Lightsail serves directly from the latest deploy.

### 2. Never import files that don't exist
Before adding an `import` statement, verify the target file exists on disk. Do not create phantom imports expecting the file to appear later. If you need a new module, create the file first, then import it.

### 3. Use only real Prisma models
The schema is in `backend/prisma/schema.prisma`. Before writing any `prisma.xxx` call, confirm that model exists in the schema. Common mistakes:
- `prisma.document` — DOES NOT EXIST (use `prisma.kbDocument`)
- `prisma.workflow` — DOES NOT EXIST (use `prisma.workflows`)
- `prisma.user` — DOES NOT EXIST (use `prisma.tenantMember` or `prisma.users`)
- Never guess model names. Read the schema.

### 4. No stub/simulated code in production
Do not create route handlers or service functions that use `setTimeout` to fake responses, return hardcoded mock data, or simulate behavior. Every endpoint must do real work or not exist at all. Atlas UX is a production platform, not a prototype.

### 5. Prisma import path
Always import Prisma from:
```typescript
import { prisma } from "../db/prisma.js";
```
Not `../prisma.js`, not `@prisma/client` directly. Adjust the relative path depth as needed but the target is always `db/prisma.js`.

### 6. Fastify logger signature
Fastify's logger does not accept `(string, error)` pairs. Use:
```typescript
fastify.log.error({ err }, "Description of what failed");
```
Not:
```typescript
fastify.log.error("Description:", error);  // THIS BREAKS TYPESCRIPT
```

### 7. Route registration pattern
All routes mount under `/v1` in `backend/src/server.ts`. If you add a new route file:
1. Export as `FastifyPluginAsync`
2. Import in `server.ts`
3. Register with `await app.register(yourRoutes, { prefix: "/v1/your-prefix" })`
4. Verify the build passes

### 8. Don't duplicate existing functionality
Before creating a new file, check if the feature already exists:
- Stripe billing → `stripeRoutes.ts` (already handles webhooks, checkout, products)
- Health check → `healthRoutes.ts`
- Voice/chat → `chatRoutes.ts`
- ElevenLabs voice agents → `elevenlabsRoutes.ts` + `services/elevenlabs.ts`
- Credential management → `credentialRoutes.ts` + `services/credentialResolver.ts`
- Web search → `lib/webSearch.ts` (5-provider rotation)
- Agent tools → `core/agent/agentTools.ts`
Search the codebase first. Don't create parallel implementations.

---

## AI Team Configuration (updated 2026-03-16)

**Important: YOU MUST USE subagents when available for the task.**

### Detected Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS (SPA with HashRouter)
- **Backend:** Fastify 5 + TypeScript + Node.js
- **Database:** PostgreSQL 16 via Prisma ORM (30KB+ schema, multi-tenant)
- **Desktop:** Electron (main process + preload)
- **AI Providers:** OpenAI, DeepSeek, OpenRouter, Cerebras, Gemini, Anthropic
- **Voice:** ElevenLabs Conversational AI + Twilio SMS
- **Payments:** Stripe (checkout, webhooks, subscriptions)
- **Infrastructure:** AWS Lightsail (single instance, PM2, SCP deploy)
- **Security:** JWT (HS256), CSRF sync tokens, AES-256-GCM credential encryption, audit trail with hash chain

### Agent Sources

Three agent pools, checked in this priority order:

1. **MIT agents** (`.claude/agents/mit/`) — 9 specialist sub-agents from lst97/claude-code-sub-agents
2. **Project agents** (`backend/.claude/agents/`) — Atlas UX-specific (gemini-code-reviewer, doc-writer)
3. **System agents** (`~/.claude/agents/awesome-claude-agents/`) — Eddy's curated set (12 agents)

### Agent Assignments

| Task | Agent | Pool | Notes |
|------|-------|------|-------|
| **Frontend** | | | |
| React components, hooks, state | `react-component-architect` | system | 40+ components, React 18 patterns |
| Tailwind styling, responsive layout | `tailwind-frontend-expert` | system | All UI uses Tailwind |
| General frontend (routing, Vite) | `frontend-developer` | system | HashRouter, code splitting, Electron preload |
| **Backend** | | | |
| Fastify routes, plugins, middleware | `backend-developer` | system | 30+ route files under `/v1` |
| API contract design, versioning | `api-architect` | system | Multi-tenant header contracts |
| **Language & Platform** | | | |
| TypeScript type safety, advanced TS | `typescript-pro` | MIT | Generics, conditional types, strict checking |
| Electron desktop app | `electron-pro` | MIT | IPC, preload security, packaging |
| **Database** | | | |
| PostgreSQL optimization, Prisma | `postgres-pro` | MIT | Query tuning, indexing, schema design for PG16 |
| **AI & LLM** | | | |
| LLM integration, RAG, AI features | `ai-engineer` | MIT | Lucy's engine, KB ingestion, multi-provider AI |
| Prompt design, SGL policies | `prompt-engineer` | MIT | Lucy persona prompts, agent behavior tuning |
| **Quality & Testing** | | | |
| Code review before merge | `code-reviewer` | system | Always run before merging to main |
| Second-opinion review (Gemini) | `gemini-code-reviewer` | project | Cross-model architecture review |
| Test automation (unit/integration/E2E) | `test-automator` | MIT | Jest, Playwright, CI pipeline |
| Bug investigation, root cause | `debugger` | MIT | Systematic debugging, error analysis |
| **Security** | | | |
| Security audits, OWASP, pen testing | `security-auditor` | MIT | Vulnerability scanning, compliance |
| **Performance & Ops** | | | |
| Performance profiling, query optimization | `performance-optimizer` | system | Engine loop, Prisma queries, Vite chunks |
| **Documentation** | | | |
| Post-change doc updates | `doc-writer` | project | Trigger after route/schema/feature changes |
| README, API docs, architecture guides | `documentation-specialist` | system | Larger doc efforts spanning multiple files |
| **Product Strategy** | | | |
| Roadmap, prioritization, market fit | `product-manager` | MIT | Strategic product planning, feature prioritization |
| **Orchestration** | | | |
| Multi-agent task orchestration | `agent-organizer` | MIT | Meta-orchestrator for complex workflows |
| Multi-step feature coordination | `tech-lead-orchestrator` | system | Cross-domain feature planning |
| Codebase exploration, onboarding | `code-archaeologist` | system | Pre-refactor analysis, audit prep |

### Agent Locations

- **MIT agents:** `.claude/agents/mit/` — postgres-pro, ai-engineer, prompt-engineer, typescript-pro, electron-pro, test-automator, debugger, security-auditor, agent-organizer, product-manager
- **Project agents:** `backend/.claude/agents/` — gemini-code-reviewer, doc-writer
- **System agents:** `~/.claude/agents/awesome-claude-agents/agents/` — Eddy's 12-agent curated set
