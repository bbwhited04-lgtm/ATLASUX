# What Is Atlas UX?

## Platform Overview

Atlas UX is a full-stack AI employee productivity platform that provides businesses with autonomous AI agents capable of executing real work. Unlike chatbots or simple automation tools, Atlas UX deploys a structured team of AI agents -- each with defined roles, responsibilities, and governance policies -- to handle day-to-day business operations.

The platform runs as a web application (SPA) and an Electron desktop app, with a Fastify backend, PostgreSQL database, and a multi-provider AI engine that orchestrates agent actions in real time.

## Core Value Proposition

Atlas UX replaces the need to hire, train, and manage multiple employees for routine business functions. A single Atlas UX deployment gives you:

- A CEO-level orchestrator (Atlas) that coordinates all agent activity
- A Chief Revenue Officer (Binky) that handles research, intelligence, and strategy
- A full social media publishing team (13 platform-specific agents)
- Financial oversight (Tina, CFO), legal counsel (Jenny, CLO), and IP protection (Benny)
- Customer support (Cheryl), project management (Petra), and calendar management (Claire)
- Content creation, image production, video production, and blog publishing agents

Every action is logged, auditable, and governed by the Statutory Guardrail Layer (SGL) and the Execution Constitution.

## Who Is Atlas UX For?

### Small Businesses
Owners who wear every hat benefit from Atlas UX taking over social media, email, CRM management, and content creation while they focus on core operations.

### Marketing Agencies
Agencies managing multiple clients can deploy Atlas UX per-tenant, giving each client a full AI workforce without scaling headcount.

### E-commerce Operators
Online stores use Atlas UX for product content generation, email campaigns, social media promotion, and customer engagement automation.

### Solopreneurs
Solo founders get an entire executive team -- from research and strategy to content and customer support -- without the payroll.

### SaaS Startups
Early-stage companies use Atlas UX for customer support automation, blog content, social distribution, and operational intelligence.

## How It Works

1. **Onboarding**: Create your organization, connect integrations (Microsoft 365, Telegram, Stripe, social platforms), and configure your AI workforce.
2. **Agent Activation**: Agents are deployed according to your subscription tier. Each agent has a defined role, communication policy, and tool access level.
3. **Workflow Execution**: The engine loop ticks every 5 seconds, picking up queued jobs and orchestrating agent actions. Workflows run automatically on schedule or on demand.
4. **Approval Workflows**: High-risk actions (spend above limits, recurring charges, risk tier 2+) require human approval via decision memos before execution.
5. **Audit Trail**: Every mutation is logged with actor, timestamp, entity, and action for full traceability.

## Key Differentiators

- **Multi-Agent Architecture**: Not one AI -- an entire governed team with chain-of-command reporting.
- **Audit-First Design**: Every action leaves a trace. No silent power, no invisible authority.
- **Safety Guardrails**: SGL enforces non-overridable execution boundaries. Recurring purchases blocked by default. Daily action and posting caps enforced.
- **Multi-Tenancy**: Full tenant isolation at the database level. Every table has a tenant_id foreign key.
- **Truth-First Philosophy**: Atlas UX rejects fake engagement, manufactured outrage, and algorithm exploitation through deception.

## Platform Components

| Component | Description |
|-----------|-------------|
| Dashboard | Live KPIs: active jobs, completions, agents, spend |
| Agents Hub | Agent roster, tools, workflows, deployment |
| Business Manager | Assets, ledger, integrations, jobs, audit, blog, decisions, budgets, tickets |
| CRM | Contacts, segments, activities |
| Chat Interface | Direct conversation with any agent |
| Knowledge Base | Document ingestion, chunking, agent-accessible reference |
| Messaging Hub | Telegram, Email, Teams, SMS |
| Agent Watcher | Real-time activity monitor with color-coded event feed |
| Store | Digital products, prompt packs, ebooks |

## Technical Foundation

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: Fastify 5, TypeScript, Prisma ORM
- **Database**: PostgreSQL 16 (Supabase)
- **AI Providers**: OpenAI, DeepSeek, OpenRouter, Cerebras, Gemini
- **Deployment**: Vercel (frontend), Render (backend + workers)
- **Desktop**: Electron
- **Mobile**: Expo React Native

## Philosophy

Atlas UX is built on the principle that truth, accountability, and long-term trust matter more than viral engagement or shortcut growth. The platform is designed for businesses that value structure over chaos, integrity over convenience, and systems over spectacle.

Every agent operates under Atlas. Atlas operates under Truth.
