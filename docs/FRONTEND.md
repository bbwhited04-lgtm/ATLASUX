# Frontend Architecture

## Stack

- **React 18** with TypeScript
- **Vite** build tool
- **Tailwind CSS** for styling
- **React Router v7** with `HashRouter`
- **Electron** for desktop app

---

## Directory Structure

```
src/
  App.tsx              -- Root component
  main.tsx             -- Entry point
  routes.ts            -- All route definitions (HashRouter)
  index.css            -- Global styles
  components/          -- 40+ feature components (10-70KB each)
    Dashboard.tsx
    ChatInterface.tsx
    CRM.tsx
    Settings.tsx
    BusinessManager.tsx
    KnowledgeBaseHub.tsx
    MessagingHub.tsx
    AgentWatcher.tsx
    BrandAnalytics.tsx
    OrgMemory.tsx
    AgentCalibration.tsx
    AppGate.tsx          -- Gate code validation wrapper
    RootLayout.tsx       -- Authenticated app shell
    premium/             -- Premium-tier components
      CalendarScheduling.tsx
    public/
      PublicLayout.tsx   -- Shared layout for public pages
  pages/               -- Public-facing pages
    Landing.tsx
    Privacy.tsx, Terms.tsx, AcceptableUse.tsx
    Store.tsx, Product.tsx, Payment.tsx
    About.tsx, Compare.tsx, Support.tsx, FAQ.tsx
    Docs.tsx, Configure.tsx, GettingStarted.tsx
    Pitch.tsx
    Salons.tsx, Plumbers.tsx  -- Vertical landing pages
    blog/
      BlogHome.tsx, BlogPost.tsx, BlogCategory.tsx
  lib/
    api.ts             -- API client with CSRF handling
    activeTenant.tsx    -- Tenant context provider
  core/                -- Client-side domain logic
  config/              -- Email maps, AI personality config
  routes/              -- Route-level components
    mobile.tsx         -- Mobile pairing page
  types/               -- TypeScript type definitions
  utils/               -- Utility functions
  styles/              -- Additional style files
  mocks/               -- Mock data for development
  video/               -- Video-related utilities
  workflows/           -- Client-side workflow definitions
  content/             -- Static content
electron/              -- Electron main process + preload
```

---

## Routing

Uses `createHashRouter` from React Router v7. All URLs are hash-based (`#/path`).

### Public Routes (PublicLayout)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Landing | Marketing homepage |
| `/salons` | Salons | Vertical: salons |
| `/plumbers` | Plumbers | Vertical: plumbers |
| `/about` | About | About page |
| `/privacy` | Privacy | Privacy policy |
| `/terms` | Terms | Terms of service |
| `/acceptable-use` | AcceptableUse | AUP |
| `/store` | Store | Pricing / store |
| `/product` | Product | Product details |
| `/payment` | Payment | Payment page |
| `/compare` | Compare | Competitor comparison |
| `/support` | Support | Support page |
| `/docs` | Docs | Documentation |
| `/configure` | Configure | Configuration wizard |
| `/faq` | FAQ | FAQ page |
| `/getting-started` | GettingStarted | Onboarding guide |
| `/pitch` | Pitch | Investor pitch |
| `/blog` | BlogHome | Blog index |
| `/blog/category/:category` | BlogCategory | Category filter |
| `/blog/:slug` | BlogPost | Individual post |

### App Routes (AppGate -> RootLayout)

All under `/app`. Wrapped in `AppGate` (gate code validation) and `RootLayout` (authenticated shell).

| Path | Component | Description |
|------|-----------|-------------|
| `/app` | Dashboard | Main dashboard (index) |
| `/app/chat` | ChatInterface | AI chat |
| `/app/crm` | CRM | Contact management |
| `/app/calendar` | CalendarScheduling | Calendar (premium) |
| `/app/business-manager` | BusinessManager | Business operations hub |
| `/app/kb` | KnowledgeBaseHub | Knowledge base |
| `/app/settings` | Settings | Settings (agents, jobs, integrations tabs) |
| `/app/help` | HelpPage | Help |
| `/app/messaging` | MessagingHub | Multi-channel messaging |
| `/app/brand` | BrandAnalytics | Brand analytics |
| `/app/watcher` | AgentWatcher | Agent activity monitor |
| `/app/org-memory` | OrgMemory | Organizational brain |
| `/app/calibration` | AgentCalibration | Agent confidence calibration |

Several paths redirect to tabs within other pages (e.g., `/app/jobs` -> `/app/settings?tab=jobs`).

### Other

| Path | Component | Description |
|------|-----------|-------------|
| `/mobile` | MobilePage | Mobile device pairing |

---

## Lazy Loading

All non-critical components use lazy loading with `lazyRetry()`:

```typescript
function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch((err) => {
      // After deploy, old chunk hashes are gone
      // Single hard reload per session to fetch new chunks
      sessionStorage.setItem("chunk_reload", String(Date.now()));
      window.location.reload();
    })
  );
}
```

Each lazy component is wrapped in `<Suspense>` with a minimal "Loading..." fallback.

---

## API Client

Source: `src/lib/api.ts`

```typescript
export const API_BASE = isElectron
  ? "http://localhost:8787"              // Electron desktop
  : (envUrl || "https://api.atlasux.cloud");  // Web/cloud

export async function apiFetch(path: string, init?: RequestInit): Promise<Response>
```

**Features:**
- Automatic Electron detection (uses localhost for desktop, cloud for web)
- CSRF token management: captures `x-csrf-token` from response headers, sends it on all mutations
- Base URL configurable via `VITE_API_BASE_URL`

---

## State Management

### Tenant Context

`src/lib/activeTenant.tsx` provides a React context for the current tenant:
- Stores active `tenantId`, `role`, `seatType`
- Used by all authenticated components to scope API requests via `x-tenant-id` header

### Authentication

Gate code validation happens in `AppGate` component. Once validated, the app shell renders with authenticated context.

---

## Code Splitting

Vite config splits chunks for optimal caching:

| Chunk | Contents |
|-------|----------|
| `react-vendor` | React, ReactDOM |
| `router` | React Router |
| `ui-vendor` | UI libraries |
| `charts` | Chart libraries |

---

## Electron Desktop App

Source: `electron/`

```bash
npm run electron:dev     # Development mode
npm run electron:build   # Production build
```

The Electron app wraps the same React SPA but connects to `localhost:8787` instead of the cloud API. The `isElectron` check in `api.ts` handles this automatically.

---

## Build

```bash
npm run dev              # Vite dev server at localhost:5173
npm run build            # Production build to ./dist
npm run preview          # Preview production build
```

**Build output:** `./dist` directory containing static HTML/JS/CSS ready for deployment to Lightsail.
