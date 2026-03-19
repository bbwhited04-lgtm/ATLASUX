# MCP Servers for Development

## Overview

Development MCP servers connect AI agents directly to the tools software teams use every day — version control, project management, error tracking, deployment, and database management. Instead of copy-pasting error logs or manually describing repository state, your AI agent can query these systems directly, take actions, and maintain full context about your development workflow.

This guide catalogs the most widely used development MCP servers, what tools they expose, how to set them up, and when to use them.

## GitHub MCP Server

**What it does:** Full read-write access to GitHub repositories, pull requests, issues, branches, files, and workflows. This is one of the most mature MCP servers in the ecosystem.

**Key tools exposed:**
- `create_or_update_file` — commit file changes directly
- `search_repositories` / `search_code` — find repos and code across GitHub
- `create_issue` / `list_issues` / `update_issue` — full issue management
- `create_pull_request` / `merge_pull_request` — PR lifecycle
- `create_branch` / `push_files` — branch management
- `get_file_contents` / `list_commits` — repository exploration
- `create_repository` / `fork_repository` — repo administration

**Setup:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

**Use case:** An AI agent reviewing a PR can read the diff, check related issues, examine test results, leave review comments, and even suggest file changes — all through MCP tool calls without leaving the conversation.

## GitLab MCP Server

**What it does:** Similar coverage to the GitHub server but for GitLab-hosted repositories. Supports both GitLab.com and self-hosted instances.

**Key tools exposed:**
- `create_merge_request` / `list_merge_requests` — MR management
- `create_issue` / `list_issues` — issue tracking
- `get_file_contents` / `list_repository_tree` — file browsing
- `create_branch` / `list_pipelines` — CI/CD visibility
- `search_projects` — project discovery

**Setup:**
```json
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "<your-token>",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

**Use case:** Teams using self-hosted GitLab can give their AI agents the same repository access they get with GitHub, including pipeline status checks and merge request automation.

## Linear MCP Server

**What it does:** Connects to Linear, the project management tool popular with engineering teams. Read and write access to issues, projects, teams, and cycles.

**Key tools exposed:**
- `linear_create_issue` / `linear_update_issue` — issue lifecycle
- `linear_search_issues` — find issues by query
- `linear_get_user_issues` — list assigned work
- `linear_create_comment` — add context to issues
- `linear_get_teams` — team discovery

**Setup:**
```json
{
  "mcpServers": {
    "linear": {
      "command": "npx",
      "args": ["-y", "mcp-linear"],
      "env": {
        "LINEAR_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** During a debugging session, the AI can create a Linear issue with reproduction steps, assign it to the right team, and link it to the relevant code — all within the same conversation where the bug was discovered.

## Sentry MCP Server

**What it does:** Connects to Sentry for error tracking and performance monitoring. Query issues, events, releases, and project configuration.

**Key tools exposed:**
- `search_issues` / `get_issue_details` — error investigation
- `search_events` / `search_issue_events` — event-level analysis
- `get_trace_details` — distributed tracing
- `find_releases` / `find_projects` — release management
- `analyze_issue_with_seer` — AI-powered root cause analysis
- `create_project` / `create_dsn` — project setup

**Setup:**
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "<your-auth-token>"
      }
    }
  }
}
```

**Use case:** When a user reports a bug, the AI agent can search Sentry for matching errors, pull stack traces, check which release introduced the issue, and correlate with deployment events — providing full context for the fix.

## Supabase MCP Server

**What it does:** Database management and project administration for Supabase (hosted PostgreSQL). Execute SQL, manage migrations, deploy edge functions, and configure projects.

**Key tools exposed:**
- `execute_sql` — run arbitrary SQL queries
- `apply_migration` — schema changes with migration tracking
- `list_tables` / `list_extensions` — schema exploration
- `deploy_edge_function` / `list_edge_functions` — serverless functions
- `get_logs` — real-time log access
- `create_project` / `get_project` — project lifecycle
- `generate_typescript_types` — type generation from schema

**Setup:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "<your-access-token>"
      }
    }
  }
}
```

**Use case:** An AI agent can explore your database schema, write and test queries, create migrations, and even deploy edge functions — turning natural language database requests into executed SQL with full awareness of your schema.

## Firebase MCP Server

**What it does:** Google Firebase project management — create apps, manage security rules, read project configuration, and handle environment settings.

**Key tools exposed:**
- `firebase_create_project` / `firebase_get_project` — project management
- `firebase_create_app` / `firebase_list_apps` — app registration
- `firebase_get_security_rules` — security rule inspection
- `firebase_get_sdk_config` — SDK configuration retrieval
- `firebase_init` — project initialization
- `firebase_read_resources` — resource exploration

**Setup:**
```json
{
  "mcpServers": {
    "firebase": {
      "command": "npx",
      "args": ["-y", "@anthropic/firebase-mcp-server"],
      "env": {
        "FIREBASE_TOKEN": "<your-ci-token>"
      }
    }
  }
}
```

**Use case:** Setting up a new Firebase project with proper security rules, app registrations, and SDK configuration — all through conversational AI without navigating the Firebase console.

## Vercel MCP Server

**What it does:** Deployment and project management for Vercel-hosted applications. Manage deployments, environment variables, domains, and project settings.

**Key tools exposed:**
- `list_deployments` / `get_deployment` — deployment status
- `list_projects` / `get_project` — project management
- `list_domains` — domain configuration
- `list_environment_variables` — env var management
- `search_docs` — Vercel documentation search

**Setup:**
```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp"],
      "env": {
        "VERCEL_API_TOKEN": "<your-token>"
      }
    }
  }
}
```

**Use case:** Checking deployment status, reviewing recent deploys for regressions, and managing environment variables across preview and production environments from within an AI conversation.

## Docker MCP Server

**What it does:** Container management — list, start, stop, and inspect Docker containers and images on the host machine.

**Key tools exposed:**
- `list_containers` / `inspect_container` — container status
- `start_container` / `stop_container` — lifecycle management
- `list_images` — image inventory
- `container_logs` — log retrieval
- `run_container` — create and start containers

**Setup:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
```

**Use case:** During development, an AI agent can check if required services (databases, caches, message queues) are running, restart failed containers, and read container logs to diagnose issues — all without the developer switching to a terminal.

## Choosing the Right Servers

For a typical full-stack development workflow, start with GitHub (or GitLab) and Sentry. These cover the two most common AI-assisted tasks: code management and error investigation. Add Supabase or Firebase if your project uses those platforms, and Linear if your team tracks work there.

The key principle is that each MCP server should save you context switches. If you find yourself regularly copy-pasting information from a tool into your AI chat, that tool probably has an MCP server that can eliminate that friction.

## Resources

- https://github.com/modelcontextprotocol/servers — Official MCP server repository with maintained servers
- https://mcp.so/ — Community directory of MCP servers with search and filtering
- https://docs.github.com/en/rest — GitHub REST API documentation (underlying the GitHub MCP server)

## Image References

1. GitHub MCP server architecture connecting AI to repository operations — search: "GitHub API AI agent integration architecture"
2. Sentry error tracking dashboard with AI-assisted debugging — search: "Sentry error tracking dashboard AI"
3. Development workflow diagram showing MCP servers connecting IDE to external tools — search: "AI development workflow tool integration diagram"
4. Supabase database management through AI conversation — search: "Supabase database management AI assistant"
5. CI/CD pipeline visualization with AI agent monitoring — search: "CI CD pipeline AI monitoring deployment"

## Video References

1. https://www.youtube.com/watch?v=pBm0sFlx1Dg — "How to Use MCP Servers with Claude Desktop — Full Setup Guide"
2. https://www.youtube.com/watch?v=SO2VD7J9yMI — "Build AI Agents with MCP: GitHub, Sentry, and More"
