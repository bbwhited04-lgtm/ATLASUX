# Contributing Guide

## Code Style

### TypeScript

- Strict TypeScript everywhere (frontend and backend)
- Use `.js` extensions in backend imports (ESM module resolution)
- Prefer `const` over `let`; avoid `var`
- Use Zod for runtime validation (see `backend/src/env.ts`)

### Frontend

- Functional React components only (no class components)
- Use hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
- Tailwind CSS for styling -- no inline styles or CSS modules
- Dark theme only: `bg-slate-900`, `text-slate-400`, `border-cyan-500/20`
- Never use light theme classes (`bg-white`, `text-slate-800`)
- Radix UI for accessible primitives (Dialog, Tabs, Select, etc.)
- Lucide React for icons

### Backend

- Fastify plugins for route grouping
- Route files export a single `FastifyPluginAsync`
- Per-route rate limits via `config.rateLimit`
- Prisma import: `import { prisma } from "../db/prisma.js"`
- All mutations must write to `audit_log`
- Tenant ID from `(req as any).tenantId`

## Commit Conventions

### Build in Public Rule

Every commit MUST also update `src/pages/Landing.tsx` Dev Updates section:

1. Add a plain-English bullet describing the change in the `<ul>` inside `<section id="updates">`
2. Update the `"Last updated:"` span to today's date
3. Include the Landing.tsx change in the SAME commit

### Commit Message Format

Keep commit messages concise and descriptive:

```
fix: correct tenant header extraction in business manager
add: Agent Watcher live activity monitor
update: landing dev updates for Feb 26 session
```

Prefixes: `add`, `fix`, `update`, `refactor`, `docs`, `chore`

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes, ensuring Landing.tsx is updated
3. Test locally (frontend + backend)
4. Push and create a PR with a clear description
5. Describe what changed and why
6. Include screenshots for UI changes

## Multi-Tenancy Rules

- Every new database table MUST have a `tenant_id` FK to `tenants`
- Every query MUST scope by tenant ID
- Never expose data from one tenant to another

## Audit Trail Rules

- Every mutation (create, update, delete) MUST log to `audit_log`
- Use the pattern:
  ```typescript
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorType: "system",
      actorUserId: null,
      actorExternalId: agentName,
      level: "info",
      action: "DESCRIPTIVE_ACTION",
      entityType: "entity_name",
      entityId: entityId,
      message: "Human-readable description",
      meta: { ...context },
      timestamp: new Date(),
    },
  }).catch(() => null);
  ```
- The `.catch(() => null)` ensures audit failures never break the main operation

## Safety Constraints

- Never bypass SGL evaluation for engine intents
- Recurring purchases are blocked by default
- Daily action cap (`MAX_ACTIONS_PER_DAY`) must be respected
- Approval required for spend above the configured limit or risk tier >= 2
- All agent actions go through Atlas (single executor rule)

## File Organization

- Frontend components go in `src/components/`
- Route files go in `backend/src/routes/`
- Agent configs go in `Agents/Atlas/` or `Agents/Sub-Agents/{NAME}/`
- Workflow definitions go in `workflows/`
- Policy documents go in `policies/`
