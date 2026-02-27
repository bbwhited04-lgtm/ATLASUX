# Frequently Asked Questions

## General

### What is Atlas UX?
Atlas UX is an AI employee productivity platform built by DEAD APP CORP. It deploys autonomous AI agents — each with a defined role, name, and set of responsibilities — that automate business tasks including content publishing, financial oversight, customer support, market intelligence, and team coordination.

### How is this different from ChatGPT or other AI assistants?
AI assistants respond to prompts and generate text. Atlas UX agents execute tasks autonomously in your business systems. They send emails, publish content, monitor markets, enforce budgets, and coordinate with each other — all within a governed framework with spending limits and approval workflows.

### Do I need technical skills to use Atlas UX?
No. Atlas UX is designed for business users. Your AI agents come pre-configured with industry best practices. You set your preferences (spending limits, approval thresholds, publishing schedules) through the dashboard, and agents handle the rest.

### Is Atlas UX ready for production use?
Atlas UX is currently in Alpha, running a 7-day stability test to validate safe, reliable operation. The platform is functional and actively used, but Alpha constraints (conservative spending limits, mandatory approval workflows for recurring charges) remain in place until the stability test is complete.

### What platforms does Atlas UX run on?
Atlas UX runs as a web application (any modern browser), an Electron desktop app (Windows, macOS, Linux), and will have a mobile companion app (pending Apple developer approval).

---

## AI Agents

### How many agents does Atlas UX have?
Atlas UX deploys 30+ named agents organized in a corporate hierarchy — executives (CEO, CRO, CFO), governors, specialists (legal, IP, support), a publishing team (10+ platform specialists), and operations staff (PM, bookings, media production).

### Can agents make mistakes?
Yes, like any employee. That is why Atlas UX includes comprehensive governance: confidence thresholds, spending limits, risk tier classification, approval workflows, and audit logging. High-risk actions always require human approval. Every action is auditable and reversible where possible.

### Can I customize agent behavior?
On Business and Enterprise plans, you can customize agent configurations, adjust confidence thresholds, define role-specific tool access, and create custom workflows. Starter and Pro plans use standard configurations.

### Do agents work 24/7?
Yes. Agents operate around the clock. Scheduled workflows fire at configured times (intelligence sweeps start at 05:00 UTC, operations at 08:30 UTC), and agents respond to events and triggers whenever they occur.

### Can agents communicate with each other?
Yes. Agents coordinate through the internal job queue. One agent can create tasks for another, pass context, and chain multi-step processes. The CEO agent (Atlas) aggregates intelligence and assigns tasks across the team daily.

---

## Safety and Governance

### What prevents agents from spending too much money?
Multiple safeguards: the `AUTO_SPEND_LIMIT_USD` threshold requires approval for transactions above the limit, recurring charges are blocked by default during Alpha, daily action caps prevent runaway behavior, and the AI CFO (Tina) provides continuous financial oversight.

### What is a Decision Memo?
A Decision Memo is a structured approval request generated when an agent encounters an action that exceeds its autonomous authority. It includes the proposed action, rationale, risk assessment, cost estimate, and alternatives. You review and approve or deny directly from the dashboard.

### What if an agent does something I do not want?
Every agent action is logged in the audit trail. You can review what happened, when, and why. Actions that exceed safety thresholds require your approval before execution. You can adjust spending limits, confidence thresholds, and approval requirements at any time.

### Is my data secure?
Yes. Atlas UX implements multi-layer security: TLS encryption in transit, AES-256 encryption at rest, tenant isolation at the database/API/storage levels, JWT authentication, rate limiting, and immutable audit logging. No secrets are ever included in client-side code.

### Can one organization see another organization's data?
No. Tenant isolation is absolute and architecturally enforced. Every database record is scoped to a tenant. There are no cross-tenant queries, no shared data tables, and no administrative backdoors.

---

## Pricing and Billing

### Is there a free plan?
Yes. The Starter plan is permanently free with no time limit. It includes 1 user, basic agent access, 5 workflows per month, and 100 agent actions per day.

### What happens if I exceed my daily action limit?
Remaining actions are queued for the next day. Atlas UX never charges overage fees — the system pauses gracefully rather than billing extra.

### Can I change plans at any time?
Yes. Upgrades take effect immediately with prorated billing. Downgrades take effect at the start of your next billing cycle.

### Do you offer annual billing?
Yes. All paid plans offer a 20% discount when billed annually. Enterprise requires annual billing.

### What payment methods do you accept?
All major credit cards through Stripe. Enterprise customers can arrange invoice billing.

---

## Integrations

### Which platforms do agents publish to?
X/Twitter, Facebook, Threads, TikTok, Tumblr, Pinterest, LinkedIn, Alignable, Reddit, and your blog — 10+ platforms with dedicated specialist agents for each.

### Does Atlas UX integrate with Microsoft Teams?
Yes. Direct integration via Microsoft Graph API. Agents can send messages to Teams channels. No Power Automate dependency.

### Does Atlas UX integrate with Slack?
Yes. Agents can post messages and notifications to Slack channels with rich formatting.

### Can I get notifications on Telegram?
Yes. Configure your Telegram bot and agents will send real-time notifications. Keywords like "notify me" or "alert me" automatically trigger Telegram messages.

### Do you integrate with Stripe?
Yes. Stripe handles all billing and payment processing, including subscription management and invoice generation.

---

## Technical

### What is the API rate limit?
Rate limits scale with your plan: Starter (60/min), Pro (120/min), Business (300/min), Enterprise (600/min).

### Is there an API?
Yes. All Atlas UX functionality is accessible through the RESTful API under `/v1`. Authentication uses JWT bearer tokens with tenant identification via the `x-tenant-id` header.

### How does the audit log work?
Every mutation in the system is recorded in an append-only audit log with actor identity, action details, entity information, timestamp, and structured metadata. Entries cannot be modified or deleted through the application.

### Can I export my data?
Business and Enterprise plans include audit log export and data export capabilities. Compliance-ready export formats are available on Enterprise.

### Where is my data hosted?
Atlas UX backend runs on Render. The database is hosted on Supabase (PostgreSQL). File storage uses Supabase Storage. All infrastructure is US-based.
