# Configuring MCP Servers for AI Agents

## Overview

Having MCP servers available means nothing if your AI agent cannot connect to them. This guide covers the practical configuration for wiring MCP servers into the major AI development tools — Claude Code, Claude Desktop, Cursor, Windsurf, and custom agent setups. It includes multi-server configurations, environment variable management, authentication patterns, and troubleshooting for the most common connection failures.

## Claude Desktop Configuration

Claude Desktop reads MCP server configurations from a JSON file at a platform-specific location:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### Basic Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

Each key under `mcpServers` is a unique name you choose. The object defines:
- `command` — the executable to run (usually `npx`, `node`, or `python`)
- `args` — arguments passed to the command
- `env` — environment variables set for the server process

### Multi-Server Setup

Add multiple servers by adding more keys. Each server runs as an independent process:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/slack-mcp-server"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-xxxxxxxxxxxx",
        "SLACK_TEAM_ID": "T01234567"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/mydb"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSA_xxxxxxxxxxxx"
      }
    }
  }
}
```

Claude Desktop starts all configured servers when the application launches. Each server appears in the tools panel, and Claude can use tools from any connected server within a single conversation.

## Claude Code Configuration

Claude Code supports MCP configuration at three levels, checked in this priority order:

### 1. Project-Level (`.mcp.json`)

Place a `.mcp.json` file in your project root. This is committed to version control and shared with the team:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

Note the `${SUPABASE_ACCESS_TOKEN}` syntax — Claude Code resolves environment variables from the shell environment, keeping secrets out of committed files.

### 2. User-Level (`~/.claude/settings.json`)

For servers you want available across all projects:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### 3. Slash Command

Within Claude Code, use `/mcp` to manage servers interactively — add, remove, and test connections without editing config files.

## Cursor Configuration

Cursor reads MCP configuration from its settings. Access via `Cursor Settings > Features > MCP Servers`, or edit the configuration file directly:

- **macOS:** `~/.cursor/mcp.json`
- **Windows:** `%USERPROFILE%\.cursor\mcp.json`
- **Linux:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_xxxxxxxxxxxx"
      }
    }
  }
}
```

Cursor shows connected MCP servers in the chat panel. Tools from MCP servers appear alongside Cursor's built-in tools, and the AI can use them in Agent mode.

## Windsurf Configuration

Windsurf (Codeium) supports MCP through its configuration at:

- **macOS:** `~/.codeium/windsurf/mcp_config.json`
- **Windows:** `%USERPROFILE%\.codeium\windsurf\mcp_config.json`

The format is identical to Claude Desktop:

```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "@anthropic/firebase-mcp-server"],
      "env": {
        "FIREBASE_TOKEN": "your-ci-token"
      }
    }
  }
}
```

## Custom Agent Configuration

For custom agents built with the Anthropic SDK, Claude SDK, or other frameworks, MCP server connections are managed programmatically:

### Using the MCP Client SDK

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Create a client for each MCP server
const transport = new StdioClientTransport({
  command: "npx",
  args: ["-y", "@modelcontextprotocol/server-github"],
  env: {
    GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN
  }
});

const client = new Client({
  name: "my-agent",
  version: "1.0.0"
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: "search_repositories",
  arguments: { query: "mcp server" }
});
```

### Multi-Server Client Pattern

For agents that need multiple MCP servers, create a client per server and aggregate the tool lists:

```typescript
const servers = [
  { name: "github", package: "@modelcontextprotocol/server-github" },
  { name: "slack", package: "@anthropic/slack-mcp-server" },
  { name: "postgres", package: "@modelcontextprotocol/server-postgres" }
];

const clients = new Map();

for (const server of servers) {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", server.package],
    env: getEnvForServer(server.name)
  });
  const client = new Client({ name: "my-agent", version: "1.0.0" });
  await client.connect(transport);
  clients.set(server.name, client);
}

// Aggregate all tools across servers
const allTools = [];
for (const [name, client] of clients) {
  const { tools } = await client.listTools();
  allTools.push(...tools.map(t => ({ ...t, server: name })));
}
```

## Environment Variable Management

Never hardcode API keys in configuration files that are committed to version control.

### Shell Environment Variables

Set variables in your shell profile (`~/.bashrc`, `~/.zshrc`, or Windows environment):

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
export SLACK_BOT_TOKEN="xoxb-xxxxxxxxxxxx"
export STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxx"
```

Then reference them in MCP config with `${VARIABLE_NAME}` syntax (Claude Code) or use them directly in the `env` block (Claude Desktop).

### `.env` Files

For project-specific secrets, use a `.env` file (gitignored) and load variables before starting the AI tool:

```bash
# .env (never commit this)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxx
```

### Credential Rotation

API keys expire and get rotated. When you rotate a key:
1. Update the environment variable or `.env` file
2. Restart the AI tool (Claude Desktop, Cursor, etc.) — MCP servers inherit environment at startup
3. Verify the connection by using a tool from that server

## Authentication Patterns

### API Key Authentication

The simplest pattern — pass an API key through an environment variable:

```json
{
  "env": {
    "API_KEY": "your-key-here"
  }
}
```

### OAuth2 Authentication

Some MCP servers (Google Workspace, Notion) use OAuth2. These typically:
1. Open a browser for the initial authorization flow
2. Store refresh tokens locally
3. Automatically refresh access tokens

The first connection may require interactive browser authorization. Subsequent connections use stored tokens.

### Token File Authentication

Some servers read credentials from files:

```json
{
  "command": "npx",
  "args": ["-y", "my-server", "--credentials", "/path/to/credentials.json"]
}
```

## Troubleshooting Common Issues

### Server fails to start

**Symptom:** MCP server shows as disconnected or errored in the tools panel.

**Fixes:**
- Check that `npx` can resolve the package: run `npx -y <package-name> --help` in your terminal
- Verify Node.js version is 18+ (`node --version`)
- Check environment variables are set correctly
- Look at stderr output — the server may be logging startup errors

### Tools not appearing

**Symptom:** Server connects but no tools show up.

**Fixes:**
- The server may require authentication before listing tools — check env vars
- Some servers lazily register tools — try making a request first
- Run the MCP Inspector (`npx @modelcontextprotocol/inspector`) to see what the server exposes

### Timeout errors

**Symptom:** Tool calls hang or return timeout errors.

**Fixes:**
- The external API may be slow — check API status pages
- Network connectivity issues between the server process and the API
- Some MCP clients have configurable timeouts — increase if needed
- For long-running operations, check if the server supports async patterns

### Permission denied

**Symptom:** Tool calls return authorization errors.

**Fixes:**
- Verify API key permissions match the tools being called
- Check token expiration — regenerate if needed
- For OAuth2 servers, re-authorize through the browser flow
- Ensure the API key is for the correct environment (test vs production)

### Multiple servers conflicting

**Symptom:** Tool names collide across servers, or the wrong server handles a call.

**Fixes:**
- Each MCP server runs independently — tool names should be unique across servers
- If two servers expose the same tool name, rename the server config key to differentiate
- Check which server a tool belongs to in the tools panel

## Atlas UX Multi-Server Example

A complete configuration for an Atlas UX development environment:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": { "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}" }
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": { "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}" }
    },
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp"],
      "env": { "STRIPE_SECRET_KEY": "${STRIPE_SECRET_KEY}" }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/slack-mcp-server"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_TEAM_ID": "${SLACK_TEAM_ID}"
      }
    },
    "notion": {
      "command": "npx",
      "args": ["-y", "@anthropic/notion-mcp-server"],
      "env": { "NOTION_API_TOKEN": "${NOTION_TOKEN}" }
    }
  }
}
```

This gives an AI agent working on Atlas UX access to source control, database management, error tracking, payment processing, team communication, and documentation — the full development lifecycle through MCP.

## Resources

- https://modelcontextprotocol.io/docs/concepts/transports — MCP transport configuration documentation
- https://docs.anthropic.com/en/docs/agents-and-tools/mcp — Anthropic's guide to MCP configuration for Claude
- https://github.com/modelcontextprotocol/servers — Official server repository with configuration examples

## Image References

1. Multi-MCP server configuration connecting AI agent to multiple tools — search: "MCP multi server configuration AI agent diagram"
2. Claude Desktop MCP settings panel showing connected servers — search: "Claude Desktop MCP server settings interface"
3. Environment variable flow from shell to MCP server process — search: "environment variable configuration server process flow"
4. OAuth2 authentication flow for MCP server connections — search: "OAuth2 authentication flow AI tool integration"
5. Troubleshooting decision tree for MCP connection issues — search: "MCP server troubleshooting connection debugging flowchart"

## Video References

1. https://www.youtube.com/watch?v=jFbPnCoYjKk — "Setting Up MCP Servers in Claude Desktop, Cursor, and Windsurf"
2. https://www.youtube.com/watch?v=wQTBmGOIhZI — "Multi-MCP Server Configuration for AI Development Workflows"
