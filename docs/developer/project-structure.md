# Project Structure

## Root Directory

```
atlasux/
  src/                  # React 18 frontend (Vite + TypeScript + Tailwind)
  backend/              # Fastify 5 backend (TypeScript + Prisma)
  Agents/               # Agent configuration files (policies, skills, souls)
  policies/             # System governance: SGL.md, EXECUTION_CONSTITUTION.md
  workflows/            # Workflow definition markdown files (WF-001, WF-002, etc.)
  electron/             # Electron main process (main.js, preload.js)
  src-tauri/            # Tauri desktop app (Rust, tauri.conf.json)
  mobile/               # Expo React Native app
  docs/                 # Developer and architecture documentation
  schemas/              # Shared JSON schemas
  scripts/              # Build and utility scripts
  public/               # Static assets served by Vite
  dist/                 # Production build output (git-ignored)
  render.yaml           # Render deployment manifest
  vite.config.js        # Vite build configuration
  tailwind.config.js    # Tailwind CSS config
  package.json          # Frontend dependencies and scripts
  CLAUDE.md             # AI assistant project context
```

## Frontend — `src/`

```
src/
  App.tsx               # Root React component
  main.tsx              # Entry point (mounts to DOM)
  routes.ts             # HashRouter route definitions (createHashRouter)
  index.css             # Global styles (Tailwind imports)
  components/           # Feature components (40+ files, 10-70KB each)
    Dashboard.tsx       # Main app dashboard
    AgentsHub.tsx       # Agent management interface
    BusinessManager.tsx # Business operations (decisions, blog, budgets, tickets)
    ChatInterface.tsx   # AI chat interface
    JobRunner.tsx       # Job queue viewer
    Settings.tsx        # App settings
    RootLayout.tsx      # App shell (sidebar + content area)
    AppGate.tsx         # Access code gate component
    ui/                 # Shared UI primitives (buttons, dialogs, etc.)
  pages/                # Public-facing pages
    Landing.tsx         # Marketing landing page (includes Dev Updates section)
    blog/               # BlogHome, BlogPost, BlogCategory
    Privacy.tsx, Terms.tsx, About.tsx, Store.tsx, Payment.tsx
  lib/                  # Client utilities
    api.ts              # API_BASE URL resolution
    activeTenant.tsx    # ActiveTenantProvider context + useActiveTenant hook
  core/                 # Client-side domain logic
  config/               # Email maps, AI personality config
  routes/               # Route-level page components (e.g., mobile)
  styles/               # Additional CSS
  utils/                # Shared utility functions
```

## Backend — `backend/src/`

```
backend/
  src/
    server.ts           # Fastify app setup, plugin registration, route mounting
    index.ts            # Entry point (imports server.ts)
    ai.ts               # AI provider router (OpenAI, DeepSeek, Claude, Gemini)
    env.ts              # Zod-validated environment variable schema
    prisma.ts           # Prisma client singleton
    cors.ts             # CORS configuration
    plugins/            # Fastify plugins (global hooks)
      authPlugin.ts     # JWT auth via Supabase, decorates req.auth
      tenantPlugin.ts   # Tenant resolution from x-tenant-id header
      auditPlugin.ts    # Auto-logs every request to audit_log
    routes/             # 43 route files, all under /v1 prefix
    core/
      engine/           # Intent queue processing engine
        engine.ts       # engineTick() — claims + executes intents
        queue.ts        # claimNextIntent() — atomic SQL claim
        packets.ts      # buildPackets() — subroutine execution
      exec/             # Execution gate (SGL evaluation)
        atlasGate.ts    # atlasExecuteGate() — SGL + human approval check
      agent/            # Agent runtime
        agentTools.ts   # Tool definitions available to agents
        deepAgentPipeline.ts  # Deep-mode agent reasoning pipeline
        agentMemory.ts  # Agent memory persistence
      sgl.ts            # SGL evaluation function (ALLOW/REVIEW/BLOCK)
      kb/               # Knowledge base processing
    domain/             # Business logic (audit, content, ledger)
    services/           # Service layer (systemState, etc.)
    workers/            # Background worker processes
      engineLoop.ts     # Engine loop (drains intent queue)
      emailSender.ts    # Email delivery worker
      schedulerWorker.ts # Cron-like workflow scheduler
      jobWorker.ts      # Generic job processor
      redditWorker.ts   # Reddit monitoring worker
      smsWorker.ts      # SMS delivery worker
      socialMonitoringWorker.ts  # Social platform monitoring
    tools/              # External tool integrations
      Outlook/          # Microsoft Outlook integration
      Slack/            # Slack integration
    jobs/               # Job queue utilities
    integrations/       # Integration helpers
    lib/                # Shared backend utilities
  prisma/
    schema.prisma       # Database schema (30KB+, 30+ models)
    migrations/         # Prisma migration history
    seed.ts             # Database seed script
  docker-compose.yml    # Local PostgreSQL 16 for development

```

## Agents — `Agents/`

```
Agents/
  Atlas/                # CEO agent (primary executor)
    SKILL.md            # Atlas capabilities and tool access
    SOUL.md             # Personality and behavioral directives
    SOUL_LOCK.md        # Immutable personality constraints
    ATLAS_POLICY.md     # Operational policies
    MEMORY.md           # Persistent memory context
    Executive-Staff/    # Direct reports configuration
  Sub-Agents/           # 27 specialist agents
    BINKY/              # CRO (Chief Research Officer)
    SUNDAY/             # Communications & tech doc writer
    KELLY/, FRAN/, DWIGHT/, TIMMY/, TERRY/  # Social publishers
    CORNWALL/, LINK/, EMMA/, DONNA/, REYNOLDS/, PENNY/
    VENNY/, VICTOR/     # Media production
    PETRA/, SANDY/, FRANK/, PORTER/, CLAIRE/  # Operations
    MERCER/, ARCHY/, DAILY-INTEL/  # Intelligence
```

## Policies — `policies/`

```
policies/
  SGL.md                    # Statutory Guardrail Layer specification
  EXECUTION_CONSTITUTION.md # Execution rules (single executor, state machine)
  DATA_RETENTION.md         # Data retention policy
```

## Mobile — `mobile/`

```
mobile/
  app.json            # Expo configuration (slug: atlasux-mobile)
  App.tsx              # Root component
  app/                 # Expo Router file-based routing
    _layout.tsx        # Root layout
    index.tsx          # Home screen
    (tabs)/            # Tab navigator
  lib/
    api.ts             # API client
    theme.ts           # Dark theme constants
  assets/              # Icons, splash screen images
  package.json         # Expo dependencies
```
