# Atlas UX Developer Documentation

Technical documentation for developing, deploying, and extending Atlas UX.

## Quick Links

| Document | Description |
|----------|-------------|
| [Local Setup](./setup.md) | Node 20, Docker, environment variables, running dev servers |
| [Project Structure](./project-structure.md) | Full directory tree with explanations |
| [Backend Guide](./backend-guide.md) | Fastify architecture, plugins, route conventions |
| [Frontend Guide](./frontend-guide.md) | Vite + React 18 + Tailwind, routing, components |
| [Database](./database.md) | Prisma schema, key tables, migrations |
| [AI Providers](./ai-providers.md) | OpenAI, DeepSeek, Claude, Gemini provider routing |
| [Engine Loop](./engine-loop.md) | Intent queue, tick cycle, workflow execution |
| [Agent System](./agent-system.md) | Agent registry, SKILL.md files, tools, delegation |
| [Testing](./testing.md) | Local testing, API testing with curl, worker testing |
| [Deployment](./deployment.md) | Render services, render.yaml, Vercel frontend |
| [Environment Variables](./env-vars.md) | Complete reference for all env vars |
| [Contributing](./contributing.md) | Code style, commit conventions, PR process |
| [Tauri Desktop](./tauri-desktop.md) | Building the Tauri desktop app |
| [Mobile (Expo)](./mobile-expo.md) | Expo React Native app structure and builds |

## Architecture Docs

For system-level design documents, see [docs/architecture/](../architecture/README.md).

## Tech Stack Summary

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Recharts
- **Backend:** Fastify 5, TypeScript, Prisma ORM, Zod validation
- **Database:** PostgreSQL 16 (Supabase-hosted in production)
- **AI:** OpenAI, DeepSeek, Anthropic Claude, Google Gemini, OpenRouter
- **Desktop:** Electron + Tauri (dual target)
- **Mobile:** Expo (React Native)
- **Deployment:** Vercel (frontend), Render (backend + workers)

## Getting Started

1. Read [Local Setup](./setup.md) to get your dev environment running
2. Read [Project Structure](./project-structure.md) to understand the codebase layout
3. Read [Backend Guide](./backend-guide.md) or [Frontend Guide](./frontend-guide.md) depending on what you are working on
4. Read [Contributing](./contributing.md) before submitting changes
