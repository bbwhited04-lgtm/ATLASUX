# Kinds of Tools — A Complete Taxonomy for AI Agents

## Why Taxonomy Matters

When an agent has access to 50+ tools, it needs to reason about categories — not just individual tools. A clear taxonomy helps the LLM understand which class of tool to reach for, reduces selection errors, and helps developers design complete tool sets without gaps or overlaps.

## Read Tools

Read tools retrieve information without modifying state. They're safe to call repeatedly (idempotent) and should never have side effects.

**File Read** — Read file contents from disk. Claude Code's `Read` tool, MCP filesystem server's `read_file`. Use for configuration files, code, logs, documents.

**Database Query** — Execute SELECT queries or ORM reads. Prisma's `findMany`, raw SQL SELECT. Atlas UX uses this extensively via `prisma.kbDocument.findMany()` for KB retrieval.

**API Fetch** — GET requests to external APIs. Weather data, stock prices, user profiles. Example: Atlas UX's credential resolver fetches tenant API keys from the encrypted vault.

**Web Scrape** — Extract content from web pages. Tools like Firecrawl, Apify actors, Playwright's `page.content()`. Atlas UX has access to Apify's 19,000+ actor library via MCP.

## Write Tools

Write tools create or modify state. They are NOT idempotent — calling them twice produces duplicate results. They require extra caution.

**File Write** — Create or overwrite files on disk. Claude Code's `Write` and `Edit` tools. Always verify the target path exists before writing.

**Database Insert/Update** — Create or modify records. Prisma's `create`, `update`, `upsert`. Atlas UX logs every write to `audit_log`.

**API POST/PUT** — Send data to external services. Creating Stripe customers, posting Slack messages, sending Twilio SMS. Each call consumes resources or triggers actions.

**Email Send** — Compose and deliver email. Atlas UX's `emailSender.ts` worker processes queued emails. Never idempotent — each call sends a real message.

## Search Tools

Search tools find relevant information from large datasets. They combine read with relevance ranking.

**Vector Search** — Semantic similarity search against embedding databases. Atlas UX uses Pinecone with tiered namespaces (public, internal, tenant) via `queryTiered()` in `lib/pinecone.ts`.

**Web Search** — Query search engines for live information. Atlas UX rotates across 5 providers (You.com, Brave, Exa, Tavily, SerpAPI) via `lib/webSearch.ts` for resilience.

**Code Search** — Find code patterns across repositories. Claude Code's `Grep` tool (ripgrep), `Glob` for file patterns. Essential for understanding codebases.

**Semantic Search** — NLP-based search with intent understanding. Goes beyond keyword matching to understand meaning. The wiki bridge's `searchWikiForAgents()` scores by term relevance.

## Compute Tools

Compute tools transform data or perform calculations without external I/O.

**Math Operations** — Calculations, statistics, financial modeling. LLMs are notoriously bad at math — tools fix this.

**Code Execution** — Run code in sandboxed environments. Python interpreters, Node.js eval, Jupyter notebooks. Powerful but dangerous — always sandbox.

**Data Transformation** — Parse, convert, aggregate, filter. CSV to JSON, XML to structured data, date format conversion.

## Communication Tools

Communication tools interact with humans or external systems through messaging channels.

**Slack** — Post messages, create channels, read threads. Atlas UX agents can notify via Slack for appointment confirmations, daily summaries, and alerts.

**SMS** — Send text messages via Twilio, Vonage, or similar. Atlas UX sends appointment confirmations via `TWILIO_FROM_NUMBER`.

**Email** — Draft and send emails. Each Atlas UX agent has their own email address for authentic communication.

**Webhook** — Trigger HTTP callbacks to external systems. Stripe webhooks, ElevenLabs voice callbacks, CI/CD triggers.

## Media Tools

Media tools generate, edit, or analyze visual, audio, and video content.

**Image Generation** — DALL-E, Stable Diffusion, Flux, Midjourney, Ideogram. Atlas UX's image gen KB covers 16 platforms with cost comparisons.

**Video Generation** — Sora, Kling, Veo, RunwayML, Vidu. Atlas UX's video gen KB has 109 articles covering the full landscape.

**Audio Generation** — Text-to-speech via ElevenLabs, OpenAI TTS. Lucy's voice is powered by ElevenLabs Conversational AI.

**OCR** — Extract text from images. Tesseract, Google Vision, Claude's native vision. Useful for processing receipts, documents, screenshots.

## Observation Tools

Observation tools perceive the environment — giving agents "eyes" on the current state.

**Screenshots** — Capture visual state of applications. Playwright's `screenshot()`, Obsidian's `dev:screenshot`. Critical for UI verification.

**DOM Inspection** — Read the accessibility tree, element attributes, computed styles. Playwright's `snapshot()` provides a structured view of the page.

**Log Reading** — Tail application logs, read error output. Essential for debugging and monitoring.

## Navigation Tools

Navigation tools move through spaces — browsing, file traversal, pagination.

**Browser Control** — Navigate to URLs, click elements, fill forms. Playwright MCP server provides `browser_navigate`, `browser_click`, `browser_type`.

**File System Traversal** — List directories, glob patterns, find files. Claude Code's `Glob` and `LS` tools.

## Meta Tools

Meta tools manage other tools — discovery, chaining, delegation.

**Tool Discovery** — List available tools, fetch schemas. MCP's `tools/list`, Claude Code's `ToolSearch`. Essential when tool sets are dynamic.

**Tool Chaining** — Orchestrate multiple tool calls in sequence. Agent frameworks like CrewAI, LangGraph, and Atlas UX's engine loop handle this.

**Tool Delegation** — Dispatch subtasks to specialized agents. Claude Code's `Agent` tool creates subagents with focused tool sets.

## Atlas UX Tool Architecture

Atlas UX organizes tools across these categories in `agentTools.ts`:
- **Read:** KB context retrieval, customer lookup, appointment search
- **Write:** Appointment booking, record creation
- **Communication:** SMS via Twilio, Slack notifications, email
- **Search:** Tiered Pinecone vector search, wiki KB search, web search
- **Meta:** Decision memo creation for high-risk actions

## Resources

- [MCP Tools Specification](https://modelcontextprotocol.io/docs/concepts/tools) — How MCP defines and categorizes tool capabilities
- [Anthropic Tool Use — Choosing Tools](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — How Claude selects between available tools

## Image References

1. Tool taxonomy classification tree — "AI agent tool taxonomy classification tree diagram categories"
2. Read vs write tool comparison — "read write idempotent API operations comparison diagram"
3. Vector search architecture — "vector search embedding database architecture diagram Pinecone"
4. MCP tool discovery flow — "MCP model context protocol tool discovery listing flow diagram"
5. Agent tool ecosystem landscape — "AI agent tool ecosystem landscape 2025 categories"

## Video References

1. [Building AI Agents from Scratch — Anthropic](https://www.youtube.com/watch?v=F_gBoS4aJHE) — End-to-end agent building with tool categorization and design
2. [MCP Explained in 5 Minutes — Fireship](https://www.youtube.com/watch?v=dZp5DKtiKP8) — Quick overview of Model Context Protocol and tool interoperability
