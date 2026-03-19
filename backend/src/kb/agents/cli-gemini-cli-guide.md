# Google Gemini CLI — Complete Reference

Gemini CLI is Google's open-source agentic coding tool that runs in the terminal, powered by the Gemini family of models. It brings Google's massive context windows (up to 1 million tokens) to the command line, enabling it to process entire codebases in a single pass. Gemini CLI is free to use with a Google account and supports the same agentic patterns as Claude Code — file editing, shell execution, and multi-step task completion.

## Installation and Setup

Gemini CLI is installed via npm and requires Node.js 18+:

```bash
npm install -g @anthropic-ai/gemini-cli
```

Or use npx for one-off execution:

```bash
npx @google/gemini-cli
```

Authentication uses your Google account. On first run, Gemini CLI opens a browser for OAuth authentication. Alternatively, set a Gemini API key:

```bash
export GEMINI_API_KEY="your-api-key"
```

Free tier users get generous daily limits through the Gemini API. For higher throughput, use a Google Cloud billing account or Vertex AI integration.

Launch with `gemini` in any project directory to start an interactive session.

## GEMINI.md — Project Instructions

Like Claude Code's CLAUDE.md, Gemini CLI loads `GEMINI.md` files for project-specific instructions. The loading order mirrors the convention established by other tools:

- **Repository root** `GEMINI.md` — Project-wide rules and context
- **Current directory** `GEMINI.md` — Directory-specific instructions
- **Home directory** `~/.gemini/GEMINI.md` — User-level defaults

Gemini CLI also reads `CLAUDE.md` files as a compatibility measure, so projects already configured for Claude Code often work without changes.

Example GEMINI.md:

```markdown
# Project Context

This is a Python FastAPI backend with SQLAlchemy ORM.

## Rules
- Use type hints on all function signatures
- Async endpoints only
- Pydantic v2 models for request/response schemas
- Alembic for all database migrations
```

## Tool System

Gemini CLI provides a set of built-in tools for interacting with your project:

**File tools** — Read files, write files, search for files by glob patterns, search file contents with regex. These map closely to the tools available in Claude Code.

**Shell execution** — Run arbitrary bash commands with output capture. Commands execute in the project directory with full access to your development environment.

**Search tools** — Both file-name search (glob) and content search (grep-style) are available as discrete tools the model can invoke.

**Web search** — Gemini CLI can search Google for documentation, error messages, and reference material during a session.

The tool system follows a permission model where file reads are always allowed, but writes and shell execution may require confirmation depending on your configuration.

## MCP Server Support

Gemini CLI supports the Model Context Protocol, allowing you to extend its capabilities with external tool servers. Configuration lives in `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

MCP servers provide additional tools that appear alongside built-in tools. This enables database queries, API integrations, browser automation, and custom tooling without modifying Gemini CLI itself.

## Agent Mode

Gemini CLI operates as an agent by default — it reads your request, formulates a plan, and executes it step by step using available tools. The agent loop continues until the task is complete or it needs your input.

Key agent behaviors:

- **Automatic file discovery** — Gemini searches for relevant files before making changes, ensuring it understands the existing code
- **Iterative refinement** — After making changes, it can run tests or builds and fix issues based on the results
- **Multi-step planning** — Complex tasks are broken into sequential steps with intermediate verification
- **Error recovery** — When a command fails, Gemini analyzes the error and attempts corrective action

## Context Window Management

Gemini's massive context window (up to 1M tokens with Gemini 1.5 Pro, 2M with Gemini 2.5 Pro) is its standout advantage. In practice, this means:

- **Entire codebases in context** — Small to medium projects can be loaded entirely, eliminating the need for strategic context management
- **Long sessions without compaction** — Sessions can run much longer before hitting context limits
- **Full file reads** — No need to truncate large files or read partial content

However, larger context windows come with tradeoffs: higher latency for initial processing and increased cost for cloud-billed usage. For most interactive sessions, the practical context window is more than sufficient.

## Google Cloud Integration

Gemini CLI integrates with the broader Google Cloud ecosystem:

**Vertex AI** — For enterprise users, Gemini CLI can route requests through Vertex AI, providing enterprise SLAs, data residency controls, and VPC Service Controls.

**Google Cloud Authentication** — Use `gcloud auth` credentials for seamless integration with Google Cloud projects.

**Cloud-specific context** — When working in Google Cloud projects, Gemini CLI understands GCP services (Cloud Run, Cloud Functions, BigQuery, etc.) and can generate appropriate configurations and deployment scripts.

## Comparison with Claude Code

Both tools fill the same niche — terminal-based agentic coding — but with different strengths:

| Aspect | Gemini CLI | Claude Code |
|--------|-----------|-------------|
| Context window | 1M-2M tokens | ~200K tokens |
| Price | Free tier available | API-key billing only |
| Model lock-in | Gemini models only | Claude models only |
| MCP support | Yes | Yes |
| Project files | GEMINI.md (reads CLAUDE.md too) | CLAUDE.md |
| Permission system | Basic allow/deny | Granular tool-level |
| Hooks | Limited | Full lifecycle hooks |
| Subagents | Not yet supported | Full subagent system |
| IDE integration | VS Code extension | VS Code + JetBrains |

Gemini CLI excels when you need to process large codebases at once or want free-tier access. Claude Code excels in its richer permission model, hooks system, and subagent architecture for complex orchestration.

## Tips for Power Users

**Leverage the context window** — Do not be afraid to ask Gemini to read and analyze large sets of files at once. Its context window can handle it.

**Use with CLAUDE.md compatibility** — If you already have CLAUDE.md files, Gemini CLI reads them, so you can use both tools interchangeably without duplicating project configuration.

**Combine with Google Search** — Gemini CLI has native access to Google's search for looking up documentation, error messages, and best practices during coding sessions.

**Set up MCP servers** — Extending Gemini CLI with MCP servers for databases, APIs, and custom tools makes it significantly more capable for full-stack development.

## Resources

- [Gemini CLI GitHub Repository](https://github.com/google-gemini/gemini-cli)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## Image References

1. Gemini CLI terminal session with large codebase analysis — search: "gemini cli terminal coding agent"
2. Gemini CLI context window comparison chart vs other AI tools — search: "gemini context window million tokens"
3. Gemini CLI MCP server configuration diagram — search: "gemini cli mcp server integration"
4. Gemini CLI agent mode multi-step task execution — search: "gemini cli agent mode code editing"
5. Google Cloud Vertex AI integration with Gemini CLI — search: "vertex ai gemini cli integration"

## Video References

1. [Gemini CLI — Google's Free AI Coding Agent](https://www.youtube.com/watch?v=hGiNdyPm1Xo) — Overview of Gemini CLI features and free-tier usage
2. [Gemini CLI vs Claude Code — Which Terminal AI Wins?](https://www.youtube.com/watch?v=0sQVdGm7xNc) — Practical comparison on real coding tasks
