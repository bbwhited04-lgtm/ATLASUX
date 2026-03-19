# Model Context Protocol — Complete Guide

## What Is the Model Context Protocol?

The Model Context Protocol (MCP) is an open standard created by Anthropic that defines how AI applications connect to external tools, data sources, and services. Before MCP, every AI platform invented its own way to call functions — OpenAI had function calling, LangChain had tool abstractions, and every agent framework rolled its own integration layer. MCP replaces all of that with a single, universal protocol that any AI client can use to talk to any tool server.

Think of MCP the way USB standardized peripheral connections. Before USB, every printer, scanner, and keyboard needed its own proprietary cable and driver. MCP does the same thing for AI agents: one protocol, any tool, any AI model.

The protocol was open-sourced by Anthropic in late 2024 and has since been adopted by Claude Code, Cursor, Windsurf, Zed, Sourcegraph Cody, and dozens of other AI development tools. The specification lives at modelcontextprotocol.io and is versioned independently of any single AI provider.

## Why Anthropic Created MCP

The AI industry hit a fragmentation wall. Every tool integration was a one-off. If you wanted your AI assistant to read GitHub issues, query a database, and send Slack messages, you needed three separate custom integrations — and those integrations only worked with one specific AI client. Switch from ChatGPT to Claude to a custom agent, and you rebuilt everything from scratch.

Anthropic recognized that the real bottleneck to useful AI agents was not model capability but connectivity. Models could reason, plan, and generate — but they were trapped in text-in, text-out sandboxes with no standardized way to touch the real world. MCP was designed to solve that problem permanently by creating a protocol layer that decouples the AI client from the tool implementation.

The design goals were explicit: open source, transport agnostic, language agnostic, and simple enough that a single developer could build an MCP server in an afternoon.

## Protocol Architecture

MCP follows a client-server architecture built on JSON-RPC 2.0, the same lightweight remote procedure call protocol used by the Language Server Protocol (LSP) that powers IDE features like autocomplete and go-to-definition.

### The Three Roles

- **MCP Host:** The AI application the user interacts with (Claude Desktop, Cursor, a custom agent). The host manages one or more MCP clients.
- **MCP Client:** A protocol client inside the host that maintains a 1:1 connection with a specific MCP server. Each server gets its own client instance.
- **MCP Server:** A lightweight program that exposes tools, resources, or prompts to the AI via the MCP protocol. Servers can be local processes or remote services.

### JSON-RPC 2.0 Transport

Every MCP message is a JSON-RPC 2.0 request or response. A tool call looks like this:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_issues",
    "arguments": {
      "query": "bug label:critical",
      "repo": "owner/repo"
    }
  }
}
```

The server responds with a standard JSON-RPC result or error. This simplicity is intentional — any language that can send and receive JSON over a transport layer can implement MCP.

### Transport Layers

MCP supports two primary transport mechanisms:

**stdio (Standard I/O):** The host spawns the MCP server as a child process and communicates via stdin/stdout. This is the most common transport for local development tools like Claude Code. The server runs on your machine, starts instantly, and dies when the host exits. No network configuration needed.

**SSE (Server-Sent Events) over HTTP:** For remote servers, MCP uses HTTP with Server-Sent Events for server-to-client streaming and regular HTTP POST for client-to-server messages. This enables cloud-hosted MCP servers that multiple clients can connect to. The client sends requests to a POST endpoint, and the server pushes responses and notifications through an SSE stream.

**Streamable HTTP:** A newer transport option that uses a single HTTP endpoint supporting both request-response and streaming patterns. This simplifies deployment compared to SSE by eliminating the need for separate endpoints.

## Core Primitives

MCP servers expose three types of primitives to AI clients:

### Tools

Tools are executable functions the AI can call. Each tool has a name, description, and an input schema defined using JSON Schema. The AI model reads the tool description to decide when and how to use it.

```json
{
  "name": "create_issue",
  "description": "Create a new GitHub issue in a repository",
  "inputSchema": {
    "type": "object",
    "properties": {
      "repo": { "type": "string", "description": "owner/repo format" },
      "title": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["repo", "title"]
  }
}
```

Tools are model-controlled — the AI decides when to invoke them based on the user's request and the tool descriptions. This is the most commonly used primitive.

### Resources

Resources are data that the AI can read. They work like a virtual filesystem — the server exposes URIs that the client can fetch. Examples include file contents, database records, API responses, or live system state. Resources can be static or dynamic, and servers can notify clients when resources change.

Resources are typically application-controlled — the host application decides which resources to fetch and include in the AI's context, often based on user actions like selecting a file.

### Prompts

Prompts are reusable prompt templates that servers can expose. They allow servers to define structured interaction patterns — like a "code review" prompt that takes a diff as an argument and returns a formatted review request. Prompts are user-controlled, typically surfaced as slash commands or menu items.

## Sampling

MCP includes a sampling capability that allows servers to request the AI model to generate text on their behalf. This enables sophisticated agentic workflows where a tool server can ask the AI to reason about intermediate results before continuing. The host always maintains control and can approve or modify sampling requests, preserving the human-in-the-loop principle.

## Protocol Versioning

MCP uses date-based protocol versions (e.g., `2024-11-05`, `2025-03-26`). During the initialization handshake, the client and server negotiate which protocol version to use. The server declares the latest version it supports, and the client selects the highest version both parties understand. This ensures backward compatibility as the protocol evolves.

## How MCP Replaces Custom Function Calling

Before MCP, integrating an AI agent with external tools meant writing custom function definitions in the format your specific AI provider expected. OpenAI had its function calling JSON schema, Anthropic had tool use blocks, Google had function declarations — all slightly different, all requiring provider-specific code.

MCP eliminates this by standardizing the tool definition format. An MCP server written once works with Claude Code, Cursor, Windsurf, or any MCP-compatible client. The server author never needs to know which AI model will be calling their tools. The client handles translating MCP tool definitions into whatever format the underlying model expects.

This separation of concerns is powerful. Tool developers focus on building great integrations. AI client developers focus on great model experiences. Neither needs to worry about the other's implementation details.

## MCP in Atlas UX

Atlas UX leverages MCP through its wiki system at wiki.atlasux.cloud. The platform exposes knowledge base articles, agent configurations, and system documentation through MCP-compatible endpoints, allowing AI agents within the Atlas ecosystem to query and reference platform knowledge during conversations and task execution.

The wiki MCP integration follows the standard server pattern — exposing tools for searching articles, reading specific documents, and querying agent configurations. This gives Lucy and other Atlas agents real-time access to the platform's knowledge base without hardcoding article contents into prompts.

## The MCP Ecosystem Today

The MCP ecosystem has grown rapidly since launch. There are now hundreds of community-built MCP servers covering everything from GitHub and Slack to Stripe and PostgreSQL. Anthropic maintains a registry of verified servers, and the community contributes through the official GitHub organization at github.com/modelcontextprotocol.

Major IDE and AI tool vendors have adopted MCP as their standard integration layer. This network effect means that building one MCP server immediately makes your tool accessible to every MCP-compatible AI client — a multiplicative return on integration effort that no proprietary function calling format can match.

## Resources

- https://modelcontextprotocol.io/introduction — Official MCP documentation and specification
- https://www.anthropic.com/news/model-context-protocol — Anthropic's announcement of MCP
- https://github.com/modelcontextprotocol — Official MCP GitHub organization with SDKs and reference servers

## Image References

1. MCP client-server architecture diagram showing host, client, and server roles — search: "MCP model context protocol architecture diagram"
2. JSON-RPC 2.0 message flow between AI client and tool server — search: "JSON-RPC request response flow diagram"
3. Comparison of stdio vs SSE transport layers — search: "MCP transport stdio SSE comparison"
4. Before and after diagram showing fragmented tool integrations vs unified MCP — search: "AI tool integration standardization protocol"
5. MCP tool definition schema example with inputSchema — search: "MCP tool definition JSON schema example"

## Video References

1. https://www.youtube.com/watch?v=pJxGIlKfU4I — "What is MCP? Model Context Protocol Explained Simply"
2. https://www.youtube.com/watch?v=kQmXtrmQ5Zg — "MCP Crash Course: Build AI Agents with Model Context Protocol"
