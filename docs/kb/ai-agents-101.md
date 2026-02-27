# Introduction to AI Agents

## What Are AI Agents?

AI agents are autonomous software entities that perform business tasks on your behalf. Unlike traditional automation tools that follow rigid scripts, AI agents reason about their environment, make decisions, and adapt to changing circumstances. In Atlas UX, agents function as virtual employees — each with a defined role, personality, and set of responsibilities.

## How Agents Work in Atlas UX

Atlas UX employs a roster of named agents, each assigned to a specific business function. The system is organized as a virtual corporate hierarchy:

### Executive Layer
- **Atlas** — CEO and primary orchestrator. Coordinates all agent activity, assigns tasks, and makes high-level decisions.
- **Binky** — CRO (Chief Revenue Officer). Manages revenue strategy, market intelligence, and growth initiatives.

### Governance Layer
- **Tina** — CFO. Oversees financial decisions, spending approvals, and budget compliance.
- **Larry** — Governor. Provides oversight and policy enforcement.
- **Jenny** — CLO (Chief Legal Officer). Handles legal compliance and risk assessment.
- **Benny** — Intellectual Property Specialist. Manages IP-related tasks and protections.

### Operations Layer
- **Sunday** — Communications and tech doc writer. Manages content strategy and coordinates the publishing team.
- **Petra** — Project Manager. Tracks tasks, timelines, and deliverables.
- **Cheryl** — Customer Support. Handles inbound inquiries and support tickets.
- **Sandy** — Bookings. Manages scheduling and appointments.

### Publishing Team
A dedicated set of agents handles multi-platform content distribution: Kelly (X/Twitter), Fran (Facebook), Dwight (Threads), Timmy (TikTok), Terry (Tumblr), Cornwall (Pinterest), Link (LinkedIn), Emma (Alignable), Donna (Reddit), Reynolds (Blog), and Penny (multi-platform ads).

### Media Production
- **Venny** — Image Production Specialist
- **Victor** — Video Production (reports to Venny)

## Autonomous vs. Supervised Modes

Agents operate in two primary modes:

### Autonomous Mode
When `ENGINE_ENABLED=true`, agents execute tasks independently within their defined safety boundaries. The engine loop ticks every few seconds, picking up queued jobs and delegating work to appropriate agents. Agents can chain actions, call tools, and complete multi-step workflows without human intervention.

**Autonomous execution requires:**
- Confidence score above `CONFIDENCE_AUTO_THRESHOLD`
- Action within the agent's defined role scope
- Spend below `AUTO_SPEND_LIMIT_USD`
- Risk tier at 0 or 1

### Supervised Mode
When an action exceeds safety thresholds, the agent pauses and creates a **Decision Memo** — a structured request for human approval. The agent explains what it wants to do, why, and what the expected outcome is. A human reviewer can approve, deny, or modify the proposed action.

## Confidence Thresholds

Every agent action carries a confidence score from 0.0 to 1.0. This score reflects how certain the agent is that the action is correct and appropriate:

| Confidence Range | Behavior |
|---|---|
| 0.9 - 1.0 | Auto-execute (if within safety limits) |
| 0.7 - 0.89 | Execute with logging and notification |
| 0.5 - 0.69 | Requires review — Decision Memo generated |
| Below 0.5 | Blocked — escalated to human operator |

The threshold for auto-execution is configurable via `CONFIDENCE_AUTO_THRESHOLD` in the backend environment. During Alpha, this is typically set conservatively to ensure human oversight of borderline decisions.

## Agent Communication

Agents communicate through several channels:
- **Internal job queue** — Structured task handoffs via the database-backed job system
- **Audit log** — Every action is recorded for transparency and debugging
- **Telegram** — Real-time notifications to human operators
- **Email** — Agents can send emails through configured Microsoft Graph or Resend providers

## Key Takeaways

1. Agents are not chatbots — they are task executors with defined roles and authority limits.
2. The system enforces governance at every level through SGL policies, confidence thresholds, and approval workflows.
3. Every agent action is auditable, reversible where possible, and subject to safety guardrails.
4. The agent roster mirrors a real corporate structure, making it intuitive to understand who does what.
