# Frontend Guide

The Atlas UX frontend is a React 18 single-page application built with Vite, TypeScript, and Tailwind CSS.

## Build Tool — Vite

Configuration lives in `vite.config.js` at the project root.

```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router'],
          'ui-vendor': ['motion', 'lucide-react'],
          'charts': ['recharts'],
        },
      },
    },
  },
  server: { port: 5173 },
});
```

The `@` alias maps to `./src`, so imports look like `import { foo } from "@/lib/api"`.

Code splitting separates vendor libraries into four chunks: `react-vendor`, `router`, `ui-vendor`, and `charts`.

## Routing — HashRouter

The app uses `createHashRouter` from React Router v7. All routes are defined in `src/routes.ts`.

```typescript
// src/routes.ts
export const router = createHashRouter([
  { path: "/", Component: Landing },
  { path: "/about", Component: () => <S><About /></S> },
  { path: "/app", Component: () => <AppGate><RootLayout /></AppGate>,
    children: [
      { index: true, Component: Dashboard },
      { path: "jobs", Component: () => <S><JobRunner /></S> },
      { path: "chat", Component: () => <S><ChatInterface /></S> },
      { path: "agents", Component: () => <S><AgentsHub /></S> },
      // ... more routes
    ],
  },
]);
```

Key routing patterns:
- Public pages (`/`, `/about`, `/privacy`, `/blog`) are top-level routes
- App pages (`/app/*`) are nested under `AppGate` (access code gate) and `RootLayout` (sidebar shell)
- Lazy loading uses a custom `lazyRetry()` wrapper that auto-reloads on chunk load failure (post-deploy)
- Several routes redirect to tabs within `BusinessManager` (e.g., `/app/decisions` -> `/app/business-manager?tab=decisions`)

## Component Patterns

### AppGate

`src/components/AppGate.tsx` wraps the `/app` route tree. It requires a gate code (`VITE_APP_GATE_CODE`) before allowing access.

### RootLayout

`src/components/RootLayout.tsx` provides the app shell: sidebar navigation, header, and content outlet.

### Tenant Context

Tenant ID is managed via React context in `src/lib/activeTenant.tsx`:

```typescript
import { useActiveTenant } from "@/lib/activeTenant";

function MyComponent() {
  const { tenantId } = useActiveTenant();
  // tenantId is read from localStorage key "atlas_active_tenant_id"
}
```

The `ActiveTenantProvider` wraps the app and persists the selected tenant to `localStorage`.

### API Client

The API base URL is resolved in `src/lib/api.ts`:

```typescript
export const API_BASE =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8787";
```

Components make fetch calls to `${API_BASE}/v1/...` with the `x-tenant-id` header.

## Design System

The app uses a consistent dark theme throughout. Key Tailwind classes:

| Element | Classes |
|---------|---------|
| Background | `bg-slate-900/50 backdrop-blur-xl` |
| Cards | `rounded-2xl border border-cyan-500/20 bg-slate-900/50` |
| Headings | `text-white` or `bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent` |
| Body text | `text-slate-400` |
| Labels | `text-slate-500` |
| Accent | `text-cyan-400` |
| Active state | `bg-cyan-500` |

Never use white/light theme classes (`bg-white`, `text-slate-800`) -- they break visual consistency.

## UI Libraries

- **Radix UI** — Primitives: Dialog, Tabs, Select, Switch, Tooltip, Avatar, etc.
- **Lucide React** — Icon library
- **Motion** (Framer Motion) — Animations
- **Recharts** — Data visualization charts
- **Sonner** — Toast notifications
- **qrcode.react** — QR code generation (mobile pairing)

## Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| `Dashboard` | `src/components/Dashboard.tsx` | Main dashboard view |
| `AgentsHub` | `src/components/AgentsHub.tsx` | Agent management (status, tools, workflows, deployment) |
| `BusinessManager` | `src/components/business-manager.tsx` | Multi-tab business ops |
| `ChatInterface` | `src/components/ChatInterface.tsx` | AI chat |
| `KnowledgeBaseHub` | `src/components/KnowledgeBaseHub.tsx` | KB document browser |
| `MessagingHub` | `src/components/MessagingHub.tsx` | Telegram, Email, SMS tabs |
| `AgentWatcher` | `src/components/AgentWatcher.tsx` | Real-time audit log monitor |
| `Settings` | `src/components/Settings.tsx` | App settings |

## Dev Updates Requirement

Every commit must update the Dev Updates section in `src/pages/Landing.tsx`. Add a bullet describing the change and update the "Last updated" date. This is part of the Build in Public workflow.
