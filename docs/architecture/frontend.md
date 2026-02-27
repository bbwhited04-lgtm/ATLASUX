# Frontend Architecture

The Atlas UX frontend is a React 18 single-page application built with Vite,
TypeScript, and Tailwind CSS. It communicates with the Fastify backend over REST
and runs inside a HashRouter for compatibility with static hosting and the
Electron desktop shell.

---

## Technology Stack

| Concern       | Technology                         |
|---------------|------------------------------------|
| Framework     | React 18                           |
| Language      | TypeScript (strict)                |
| Build         | Vite                               |
| Styling       | Tailwind CSS                       |
| Routing       | React Router v7 (HashRouter)       |
| Desktop       | Electron (optional shell)          |
| Deployment    | Vercel (static `./dist`)           |

## Directory Structure

```
src/
 |-- components/          # Feature components (40+, 10-70KB each)
 |   |-- AgentsHub.tsx
 |   |-- AgentWatcher.tsx
 |   |-- BlogManager.tsx
 |   |-- BusinessManager.tsx
 |   |-- JobRunner.tsx
 |   |-- MessagingHub.tsx
 |   |-- MobileIntegration.tsx
 |   |-- TaskAutomation.tsx
 |   +-- ... (30+ more)
 |
 |-- pages/               # Public-facing pages
 |   |-- Landing.tsx       # Main landing page + dev updates
 |   |-- Blog.tsx
 |   |-- Privacy.tsx
 |   |-- Terms.tsx
 |   +-- Store.tsx
 |
 |-- lib/                  # Client utilities
 |   |-- api.ts            # Fetch wrapper, base URL config
 |   +-- activeTenant.tsx  # Active tenant context + useActiveTenant hook
 |
 |-- core/                 # Client-side domain logic
 |   |-- agents/           # Agent config, personality definitions
 |   |-- audit/            # Audit log viewer utilities
 |   |-- exec/             # Execution helpers
 |   +-- SGL/              # System Governance Language client
 |
 |-- config/               # Static config
 |   |-- emailMaps.ts      # Agent email <-> name mapping
 |   +-- aiPersonality.ts  # AI personality settings
 |
 +-- routes.ts             # All application routes
```

## Routing

All routes are defined in `src/routes.ts` and use HashRouter. This means URLs
look like `https://app.atlasux.com/#/app/agents` rather than path-based routes.
HashRouter was chosen for two reasons:

1. **Static hosting compatibility** — Vercel serves `index.html` for all paths
   without needing rewrite rules.
2. **Electron compatibility** — The desktop app loads files from the local
   filesystem where path-based routing does not work.

Key route groups:

```
/#/                    -> Landing page
/#/app/agents          -> AgentsHub (agent management)
/#/app/watcher         -> AgentWatcher (live activity monitor)
/#/app/jobs            -> JobRunner (job queue interface)
/#/app/business        -> BusinessManager (business CRUD)
/#/app/messaging       -> MessagingHub (Telegram, Email, SMS)
/#/app/blog            -> BlogManager (content authoring)
/#/app/tasks           -> TaskAutomation
/#/privacy             -> Privacy policy
/#/terms               -> Terms of service
```

## Code Splitting

Vite is configured to split the production bundle into named chunks to optimize
loading performance:

```
vite.config.ts
  manualChunks: {
    "react-vendor"  ->  react, react-dom
    "router"        ->  react-router, react-router-dom
    "ui-vendor"     ->  UI library dependencies
    "charts"        ->  charting libraries
  }
```

This keeps the initial bundle small (React + Router) and lazy-loads heavier
dependencies (charts, UI components) only when the user navigates to pages
that need them.

## Multi-Tenant Context

Tenant isolation on the frontend is managed by the `useActiveTenant()` hook
from `src/lib/activeTenant.tsx`:

```
localStorage key: "atlas_active_tenant_id"
                        |
                        v
              useActiveTenant()
                |           |
                v           v
         tenantId      setTenantId()
                |
                v
        x-tenant-id header on every API call
```

Every API call made by `src/lib/api.ts` reads the active tenant ID and sends it
as the `x-tenant-id` request header. The backend tenantPlugin uses this to scope
all database queries.

## API Communication

The `src/lib/api.ts` module provides a thin wrapper around `fetch`:

- Base URL read from `VITE_API_BASE_URL` (defaults to `http://localhost:8787`)
- Automatically attaches `Authorization: Bearer <jwt>` header
- Automatically attaches `x-tenant-id` header from the active tenant context
- Returns typed JSON responses

All backend calls go to `/v1/*` endpoints.

## Component Architecture

Components are feature-scoped and often large (10-70KB). Each component
typically owns its own:

- State management (React hooks, no external store)
- API calls (direct fetch via `api.ts`)
- Layout and styling (Tailwind classes inline)
- Error and loading states

There is no global state management library. State is either local to a component
or shared via React context (e.g., tenant context, auth context).

## Dark Theme System

The entire application uses a consistent dark theme. These are the canonical
Tailwind classes:

| Element         | Classes                                                       |
|-----------------|---------------------------------------------------------------|
| Page background | `bg-slate-900/50 backdrop-blur-xl`                            |
| Card            | `rounded-2xl border border-cyan-500/20 bg-slate-900/50`      |
| Heading         | `text-white` or `bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent` |
| Body text       | `text-slate-400`                                              |
| Labels          | `text-slate-500`                                              |
| Accent          | `text-cyan-400`                                               |
| Active state    | `bg-cyan-500`                                                 |
| Borders         | `border-cyan-500/20`                                          |

White or light theme classes (`bg-white`, `text-slate-800`, `border-slate-200`)
are never used. All new components must follow this convention.

## Access Gate

The frontend includes a gate code mechanism controlled by `VITE_APP_GATE_CODE`.
Users must enter the correct code before accessing the application. This is a
simple pre-auth gate for Alpha access control, not a replacement for real
authentication.

## Electron Desktop Shell

The application also runs as an Electron desktop app:

```
electron/
 |-- main.ts       # Electron main process (creates BrowserWindow)
 +-- preload.ts    # Preload script (context bridge)
```

- `npm run electron:dev` — Starts the Vite dev server and opens it in Electron
- `npm run electron:build` — Builds the frontend and packages the Electron app

The Electron shell loads the same SPA. No platform-specific code exists in the
React components — the app detects its environment via the preload context bridge
if needed.

## Dev Updates (Build in Public)

The `src/pages/Landing.tsx` file contains a "Dev Updates" section (around line
127) that serves as a public changelog. Every commit to the project adds a
plain-English bullet point describing what changed. This is a mandatory convention
for the project's "build in public" approach.

## Environment Variables

| Variable               | Purpose                                    |
|------------------------|--------------------------------------------|
| `VITE_APP_GATE_CODE`  | Access gate code for Alpha                 |
| `VITE_API_BASE_URL`   | Backend URL (default: `http://localhost:8787`) |

Both are set in the root `.env` file and are baked into the Vite build at
compile time (prefixed with `VITE_` for client-side access).

## Related Documentation

- [Architecture Overview](./README.md)
- [Backend Architecture](./backend.md)
- [Deployment Architecture](./deployment.md)
