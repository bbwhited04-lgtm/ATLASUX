# Claude Code CLI — Complete Reference

Claude Code is Anthropic's official agentic coding tool that operates directly in your terminal. Unlike IDE-based AI assistants, Claude Code runs as a standalone CLI process with deep filesystem and shell access, enabling it to read, write, search, and execute code autonomously while keeping the developer in control through a robust permissions system.

## Installation and Setup

Claude Code requires Node.js 18+ and is installed globally via npm:

```bash
npm install -g @anthropic-ai/claude-code
```

After installation, run `claude` in any project directory to start an interactive session. On first launch, you authenticate with your Anthropic account or API key. Claude Code automatically detects your project structure, git status, and available tooling.

You can also run Claude Code in non-interactive mode for scripting and CI/CD:

```bash
claude -p "Explain the authentication flow in this codebase"
echo "Fix the failing test in auth.test.ts" | claude
```

The `--output-format json` flag returns structured responses for pipeline integration, and `--yes` auto-accepts permission prompts for fully automated workflows.

## CLAUDE.md — Project Instructions

CLAUDE.md files are the primary mechanism for giving Claude Code persistent project context. These markdown files are automatically loaded at session start and override default behavior. Claude Code checks multiple locations in priority order:

- **Repository root** `CLAUDE.md` — Project-wide instructions, build commands, architecture notes
- **Current directory** `CLAUDE.md` — Directory-specific context (e.g., backend vs frontend conventions)
- **Parent directories** — Inherited up the tree
- **`~/.claude/CLAUDE.md`** — User-level defaults that apply to all projects

Best practices for CLAUDE.md files include documenting build commands, directory structure, naming conventions, architectural patterns, and hard rules (like "never use `any` types" or "always run build before commit"). The more specific and actionable your CLAUDE.md, the better Claude Code performs.

## Slash Commands

Claude Code provides built-in slash commands for session management:

- **`/help`** — Display available commands and usage information
- **`/clear`** — Reset conversation context, freeing up the context window
- **`/compact`** — Summarize the conversation so far to reduce token usage while preserving key context. Accepts an optional prompt to guide what to preserve
- **`/cost`** — Show token usage and cost breakdown for the current session
- **`/doctor`** — Diagnose configuration issues, check API connectivity, and verify tool access
- **`/init`** — Generate a CLAUDE.md file for the current project by analyzing the codebase
- **`/review`** — Trigger a code review of staged or recent changes
- **`/commit`** — Stage changes and create a commit with an AI-generated message
- **`/bug`** — Report a bug to the Anthropic team with session context
- **`/memory`** — View or edit persistent memory entries
- **`/status`** — Display current session state, model, and permissions

The `/compact` command is particularly important for long sessions. When your context window fills up, compaction preserves the essential state while freeing tokens for continued work.

## Permission Modes

Claude Code operates in three permission tiers that control how much autonomy the agent has:

**Default mode** requires approval for file writes, command execution, and MCP tool calls. Read operations (file reads, grep, glob) are always allowed.

**Auto-accept mode** (`--yes` or pressing Shift+Tab to toggle) allows Claude to execute without asking, suitable for trusted operations or CI pipelines. You can scope auto-acceptance to specific tools.

**Deny lists** in `.claude/settings.json` let you permanently block specific tools or commands (e.g., never allow `rm -rf` or `git push --force`). Settings can be configured at the project level (`.claude/settings.json` checked into the repo) or locally (`.claude/settings.local.json` gitignored).

The permissions system supports granular tool-level control. You can allow `Write` but deny `Bash`, or allow `Bash` but only for specific command patterns.

## Hooks System

Hooks let you run custom scripts at specific points in Claude Code's execution lifecycle:

**PreToolUse** hooks fire before a tool executes. Use cases include blocking certain file patterns from being edited, running linters before writes, or logging tool usage. If the hook exits non-zero, the tool call is blocked.

**PostToolUse** hooks fire after a tool completes. Common uses: auto-formatting after file writes, running tests after code changes, sending notifications.

**Notification** hooks fire when Claude Code wants to notify the user (e.g., task complete, waiting for input). You can pipe these to system notifications, Slack, or other alerting systems.

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "command": "node .claude/hooks/pre-write.js"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "npx prettier --write $CLAUDE_FILE_PATH"
      }
    ]
  }
}
```

The hook script receives context about the tool call via environment variables and stdin (JSON payload with tool name, parameters, and result for PostToolUse).

## MCP Server Integration

Claude Code supports the Model Context Protocol (MCP), allowing you to extend its capabilities with external tool servers. MCP servers can provide database access, API integrations, browser automation, and any custom tooling.

Configure MCP servers in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "..." }
    }
  }
}
```

MCP tools appear alongside built-in tools and are subject to the same permission system. Claude Code discovers available tools from connected servers at startup and can call them during any task.

## Memory System

Claude Code maintains persistent memory across sessions through two mechanisms:

**CLAUDE.md files** serve as explicit, version-controlled project memory. The `/init` command bootstraps one by analyzing your codebase.

**User memory** (`~/.claude/memory/`) stores personal preferences, learned patterns, and cross-project context. Memory entries are created automatically or via `/memory` commands. This persists across all projects.

**Project memory** (`.claude/memory/`) stores project-specific learned context that can be shared with the team via version control.

## Agent and Subagent Architecture

Claude Code can spawn subagents — lightweight Claude instances that run specific tasks in parallel. The main agent delegates work to subagents for tasks like searching across multiple directories, running independent analysis, or coordinating multi-step workflows.

Subagents inherit the parent's permissions and CLAUDE.md context but operate in their own conversation thread. This enables parallel execution without context window bloat. Custom subagent definitions can be placed in `.claude/agents/` as markdown files specifying the agent's role, tools, and instructions.

## Worktrees

Claude Code supports git worktrees for parallel development. With the `EnterWorktree` and `ExitWorktree` tools, Claude can work on multiple branches simultaneously without stashing or switching. This is particularly useful for:

- Working on a feature while fixing a bug on another branch
- Running comparisons between branch implementations
- Parallel refactoring across related branches

## IDE Integrations

**VS Code** — The Claude Code VS Code extension embeds Claude Code directly in your editor with a dedicated panel, inline diff previews, and terminal integration. It preserves the full CLI capability while adding visual context.

**JetBrains** — JetBrains plugin support provides similar integration for IntelliJ, WebStorm, PyCharm, and other JetBrains IDEs. Claude Code appears as a tool window with full access to the project.

Both integrations support clicking file references to jump to source, inline diff acceptance/rejection, and synchronized terminal sessions.

## Power User Tips

**Context management** is the most important skill. Use `/compact` regularly in long sessions. Reference specific files with `@filename` patterns in your messages. Break large tasks into focused subtasks rather than asking for everything at once.

**Custom slash commands** can be created by placing markdown files in `.claude/commands/`. Each file defines a prompt template that becomes available as a slash command.

**Cost tracking** with `/cost` helps monitor API usage. Claude Code shows per-message token counts and cumulative session cost. The `--max-cost` flag sets a hard spending cap.

**Headless mode** (`claude -p "task" --yes`) enables full automation for CI/CD, code review bots, migration scripts, and batch processing. Combine with `--output-format json` for programmatic consumption.

**Multi-turn refinement** works best when you build iteratively — start with a broad request, review the output, then refine with specific feedback rather than trying to specify everything upfront.

**Git integration** is native. Claude Code understands your git state, can create branches, stage files, write commit messages, and even open pull requests via `gh` CLI integration. The `/commit` command is a common workflow endpoint.

## Pricing and Models

Claude Code uses your Anthropic API key and charges per token at standard API rates. It defaults to the latest Claude model (Opus/Sonnet) and supports model selection via the `--model` flag or `ANTHROPIC_MODEL` environment variable. Extended thinking can be enabled for complex reasoning tasks.

Typical session costs range from $0.50 to $5.00 depending on task complexity and context window usage. The `/cost` command provides real-time tracking.

## Resources

- [Claude Code Official Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Claude Code GitHub Repository](https://github.com/anthropics/claude-code)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)

## Image References

1. Claude Code terminal session showing interactive prompt with syntax highlighting — search: "claude code cli terminal session"
2. CLAUDE.md file structure diagram showing inheritance hierarchy — search: "claude code project configuration markdown"
3. Permission modes comparison chart for Claude Code — search: "claude code permissions system diagram"
4. MCP server architecture diagram with Claude Code as client — search: "model context protocol architecture diagram"
5. Claude Code VS Code extension sidebar panel screenshot — search: "claude code vscode extension integration"

## Video References

1. [Claude Code: Best practices for agentic coding](https://www.youtube.com/watch?v=bFkHOVcMFr8) — Anthropic's official guide to effective Claude Code usage
2. [Claude Code Deep Dive — Full Tutorial](https://www.youtube.com/watch?v=eCSCYMo3PBs) — Comprehensive walkthrough of Claude Code features and workflows
