# The Complete Guide to AI Agent Tooling

## What Are Tools?

In the context of LLM-based AI agents, **tools** are structured function interfaces that extend an agent's capabilities beyond text generation. Instead of guessing or hallucinating answers, an agent equipped with tools can read files, query databases, call APIs, send messages, generate images, and interact with the real world.

Tools bridge the gap between what an LLM *knows* and what it can *do*. A language model alone can reason about code but cannot execute it. It can draft an email but cannot send it. It can describe an image but cannot generate one. Tools give agents hands.

## How Tool Calling Works

Every major LLM provider implements some form of tool calling:

- **OpenAI Function Calling** — Tools defined as `functions` array in the API request. The model returns a `tool_calls` response with function name and JSON arguments. Your code executes the function and sends results back.
- **Anthropic Tool Use** — Tools defined in the `tools` array with `input_schema` (JSON Schema). Claude returns `tool_use` content blocks. Results are sent back as `tool_result` content blocks.
- **Model Context Protocol (MCP)** — An open standard for tool servers. Tools are discovered dynamically via `tools/list`, invoked via `tools/call`. Any MCP-compatible client can use any MCP server's tools.

All three follow the same fundamental pattern: **define → discover → invoke → handle response**.

## The Tooling Lifecycle

### 1. Define
Create a tool specification: name, description, input parameters (JSON Schema), and expected output format. The description is critical — it's what the LLM reads to decide *when* and *how* to use the tool.

### 2. Register
Make the tool available to the agent. In OpenAI, this means including it in the API request. In MCP, tools are served by a running server process. In Atlas UX, tools are registered in `agentTools.ts`.

### 3. Invoke
The LLM decides to use a tool based on the user's request and the tool's description. It generates structured JSON arguments matching the input schema. The runtime validates inputs and calls the handler.

### 4. Handle Response
The tool executes and returns a result. The result is injected back into the conversation as tool output. The LLM then incorporates the result into its response to the user.

### 5. Audit
Every tool invocation should be logged: who called it, what inputs were provided, what output was returned, how long it took, and whether it succeeded. Atlas UX logs all tool calls to the `audit_log` table with hash chain integrity (SOC 2 CC7.2).

## Taxonomy of Tool Types

| Category | Purpose | Examples |
|----------|---------|----------|
| **Read** | Retrieve information | File read, DB query, API GET, web scrape |
| **Write** | Create or modify state | File write, DB insert, API POST, email send |
| **Search** | Find relevant information | Vector search, web search, code search |
| **Compute** | Transform or calculate | Math operations, code execution, data aggregation |
| **Communication** | Interact with humans/systems | Slack post, SMS, webhook trigger |
| **Media** | Generate or process media | Image gen, video gen, OCR, audio transcription |
| **Observation** | Perceive environment | Screenshot, DOM inspection, log reading |
| **Navigation** | Move through spaces | Browser control, filesystem traversal |
| **Meta** | Manage other tools | Tool discovery, delegation, chaining |

## Atlas UX Tool Architecture

Atlas UX implements tools across several layers:

- **`core/agent/agentTools.ts`** — Agent-facing tool definitions for the engine loop. Tools include appointment booking, SMS sending, Slack notifications, and web search.
- **`services/credentialResolver.ts`** — Securely resolves per-tenant API keys from the encrypted credential vault (AES-256-GCM). Tools never see raw keys from other tenants.
- **`lib/webSearch.ts`** — Multi-provider web search tool with 5-provider rotation (You.com, Brave, Exa, Tavily, SerpAPI). Automatic failover on provider errors.
- **MCP Server** — Atlas UX's wiki is accessible via MCP, making 500+ knowledge articles available as tool-queryable context for any connected agent.
- **Decision Memos** — High-risk tool actions (spend above threshold, recurring charges, risk tier ≥ 2) require approval via the decision memo system before execution.

## Tooling KB Article Index

This knowledge base contains deep-dive articles on every aspect of agent tooling:

| Article | File | Topic |
|---------|------|-------|
| Bad Tool Definitions | `tools-bad-definitions.md` | Anti-patterns that break agents |
| Good Tool Definitions | `tools-good-definitions.md` | Patterns that make agents reliable |
| Security Issues | `tools-security-issues.md` | Threats and attack vectors in tool usage |
| Tool Taxonomy | `tools-taxonomy-kinds.md` | Complete classification of tool types |
| Finding Trustworthy Tools | `tools-finding-trustworthy.md` | Vetting MCP servers and providers |
| Proper Definitions | `tools-proper-definitions.md` | Schema design for reliable function calling |
| Tool Functionality | `tools-functionality-capabilities.md` | What tools can and can't do |
| Clean Outputs | `tools-clean-outputs.md` | Formatting responses for LLM consumption |
| Avoid Returning All Results | `tools-avoid-returning-all-results.md` | Pagination, filtering, result budgets |
| Error Handling | `tools-error-handling.md` | Helping agents recover from failures |
| Audit Tools | `tools-audit.md` | Logging, tracing, accountability |
| Security Tools | `tools-security-hardening.md` | Hardening your tool arsenal |
| Implementation Guide | `tools-implementation-guide.md` | From concept to production |
| Vision Tools | `tools-vision.md` | Giving agents eyes |
| Image Tools | `tools-image.md` | Generation, editing, and analysis |

## Key Principles

1. **Single responsibility** — Each tool does one thing well. Don't build a "do everything" tool.
2. **Descriptive schemas** — The LLM only knows what you tell it. Descriptions are documentation for machines.
3. **Minimal response** — Return only what the agent needs. Every extra token costs money and dilutes attention.
4. **Fail informatively** — When tools break, tell the agent *why* and *what to do about it*.
5. **Audit everything** — Every tool call is a potential compliance event. Log it.
6. **Secure by default** — Never leak credentials, never trust inputs, always validate.

## Resources

- [Anthropic Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) — Official guide to Claude's tool use system with best practices
- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) — OpenAI's documentation on function calling patterns
- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs/concepts/tools) — The open standard for tool interoperability

## Image References

1. Tool calling sequence diagram — "LLM tool calling sequence diagram function calling flow"
2. MCP architecture overview — "model context protocol MCP architecture diagram client server"
3. Agent tool ecosystem map — "AI agent tool ecosystem landscape 2025 diagram"
4. Function calling JSON schema — "OpenAI function calling JSON schema example diagram"
5. Tool lifecycle flowchart — "AI agent tool invocation lifecycle flowchart define register invoke"

## Video References

1. [Function Calling in LLMs Explained — Fireship](https://www.youtube.com/watch?v=p7nGcY73epw) — Fast-paced overview of how function calling works across providers
2. [Building AI Agents with Tool Use — Anthropic](https://www.youtube.com/watch?v=kSQEIHOCpds) — Anthropic's guide to building agents that use tools effectively
