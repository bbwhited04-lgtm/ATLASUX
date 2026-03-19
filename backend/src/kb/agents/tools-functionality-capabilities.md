# Tool Functionality — What Tools Can Actually Do for AI Agents

## The Capability Spectrum

Tools transform an LLM from a text oracle into an interactive agent that can perceive, reason, act, and learn. Each tool extends the agent along a specific capability axis. Understanding the full spectrum helps developers build complete tool sets and helps agents select the right tool for each situation.

## Information Retrieval

The most common tool category. Agents constantly need information they don't have in their training data or context window.

**Database Queries** — Structured data retrieval from PostgreSQL, MySQL, MongoDB. Atlas UX agents query `kbDocument`, `appointments`, `customers` via Prisma. The key constraint: always filter by `tenant_id` for multi-tenant isolation.

**API Fetches** — Live data from external services. Weather, stock prices, shipping status, calendar events. Unlike training data, API responses are current.

**File Reading** — Access local or remote files. Configuration files, logs, code, documents. Claude Code's `Read` tool can process text, images, PDFs, and Jupyter notebooks.

**Web Search** — Real-time information from search engines. Atlas UX rotates across 5 providers (You.com, Brave, Exa, Tavily, SerpAPI) for resilience. Critical for questions about current events, recent releases, or live pricing.

**Knowledge Base Lookup** — Vector search against curated knowledge stores. Atlas UX's `getKbContext()` pipeline searches across governance docs, agent docs, relevant matches, and wiki articles in a 4-tier priority system.

## Content Creation

Tools that produce artifacts — files, messages, media, documents.

**File Writing** — Create or modify files on disk. Code generation, configuration files, reports. Claude Code's `Write` and `Edit` tools handle this with diff-based editing for precision.

**Message Drafting** — Compose emails, Slack messages, SMS texts. Atlas UX agents each have their own email accounts for authentic outbound communication.

**Document Generation** — Reports, proposals, summaries, templates. Tools can generate structured documents from data queries.

**Media Generation** — Images (DALL-E, Flux, Midjourney), video (Sora, Kling, Veo), audio (ElevenLabs TTS). Atlas UX's KB covers 16 image gen and 10+ video gen platforms.

## System Interaction

Tools that interact with infrastructure and runtime environments.

**Command Execution** — Run shell commands, scripts, build tools. Claude Code's `Bash` tool can execute any command with timeout controls. Always sandbox untrusted execution.

**Process Management** — Start, stop, monitor processes. PM2 restart, Docker container management, worker orchestration. Atlas UX's engine loop runs as a separate PM2-managed process.

**Deployment** — Push code to production. SCP file transfer, CI/CD trigger, container deployment. Atlas UX deploys to AWS Lightsail via `scp` to the Bitnami instance.

## External Communication

Tools that send information to the outside world. These are the highest-risk category — they can't be undone.

**Email** — SMTP send, Gmail API, Outlook integration. Atlas UX's `emailSender.ts` worker processes the email queue.

**Slack** — Post messages, create channels, send DMs. Atlas UX notifies technicians via Slack when appointments are booked.

**SMS** — Text messages via Twilio. Lucy sends appointment confirmations via `TWILIO_FROM_NUMBER`.

**Webhooks** — HTTP callbacks to external services. ElevenLabs voice event callbacks, Stripe payment webhooks.

## Data Transformation

Tools that reshape, convert, or aggregate data without external I/O.

**Parsing** — CSV to JSON, XML to objects, HTML to markdown, PDF to text. Essential for processing varied input formats.

**Aggregation** — Sum, average, group, pivot data sets. Turn raw query results into insights.

**Format Conversion** — Date formats, unit conversions, currency, encoding/decoding. Common source of bugs when done by the LLM alone.

**Visualization** — Charts, graphs, diagrams from data. Mermaid diagrams, Chart.js, Excalidraw.

## Workflow Automation

Tools that orchestrate multi-step processes.

**Tool Chaining** — Output of one tool feeds input of next. "Search for customer → Get their appointments → Send reminder SMS."

**Conditional Branching** — Different tool calls based on intermediate results. "If customer has > 5 appointments, offer loyalty discount."

**Batch Operations** — Apply the same tool call across multiple items. "Send appointment reminders to all customers with appointments tomorrow."

**Scheduling** — Trigger actions at specific times. Cron jobs, delayed execution, recurring tasks.

## Environment Observation

Tools that give agents awareness of their surroundings.

**Screenshots** — Capture visual state. Playwright screenshots, OS screenshots, application captures.

**DOM Inspection** — Read page structure, element attributes, accessibility tree. Critical for web automation.

**Log Monitoring** — Read application logs, error streams, audit trails. Essential for debugging and alerting.

**System Metrics** — CPU, memory, disk, network usage. Cloud monitoring dashboards, health checks.

## Human-in-the-Loop

Tools that involve human decision-making in the agent's workflow.

**Approval Gates** — Request human approval before proceeding. Atlas UX's decision memo system requires approval for spend above `AUTO_SPEND_LIMIT_USD` or risk tier ≥ 2.

**Confirmation Dialogs** — Verify with the user before irreversible actions. "I'm about to send 50 SMS messages. Proceed?"

**Escalation** — Transfer control to a human when the agent is uncertain. Support ticket creation, Slack alert to on-call.

## What Tools Should NOT Do

Equally important is understanding the boundaries:

1. **Make autonomous financial decisions** — Always require approval for spending above threshold
2. **Send unsolicited communications** — Never email/SMS without user intent
3. **Modify security settings** — Never change auth, encryption, or access control without explicit human approval
4. **Delete production data** — Always soft-delete or require confirmation
5. **Access other tenants' data** — Tenant isolation is non-negotiable
6. **Operate without audit trails** — Every tool call must be logged
7. **Execute in unbounded loops** — Always set iteration limits and timeouts

## Resources

- [Anthropic: Tool Use Patterns](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — Official patterns for different tool use scenarios
- [OpenAI: Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) — Examples of tool capabilities across different use cases

## Image References

1. Agent capability spectrum diagram — "AI agent capability spectrum tools retrieval creation communication diagram"
2. Tool chain workflow example — "AI agent tool chaining workflow multi-step automation diagram"
3. Human-in-the-loop approval flow — "human in the loop AI approval workflow diagram gate"
4. Multi-tenant data isolation — "multi-tenant data isolation architecture diagram tenant boundary"
5. Read vs write tool risk matrix — "tool risk assessment matrix read write delete permission levels"

## Video References

1. [AI Agents Explained — IBM Technology](https://www.youtube.com/watch?v=F8NKVhkZZWI) — Comprehensive overview of what AI agents can do with tools
2. [Building Production AI Agents — LangChain](https://www.youtube.com/watch?v=DWUdGhRrv2c) — Real-world tool functionality patterns for production agents
