# Model Context Protocol (MCP) for Knowledge Sharing Between AI Agents

## Introduction

The Model Context Protocol (MCP) is an open standard, introduced by Anthropic in late 2024, that defines how AI applications connect to external data sources and tools through a uniform interface. For multi-agent systems, MCP solves a fundamental problem: how do agents share knowledge without building custom integrations for every possible data source? Instead of each agent implementing its own database connector, API client, or file reader, MCP provides a standardized protocol where knowledge sources expose themselves as MCP servers and agents connect as MCP clients. This article covers MCP's architecture, how knowledge can be exposed as MCP resources and tools, multi-agent topologies for knowledge sharing, token economics of context window management, and Atlas UX's vision for wiki-as-MCP-server.

## What MCP Is and Why It Matters

### The Integration Problem

Before MCP, connecting an AI agent to a knowledge source required custom code for each integration. Want the agent to read from PostgreSQL? Write a database connector. Want it to search a wiki? Write an API client. Want it to access Slack history? Write another integration. Each connection requires authentication handling, error management, retry logic, and response formatting.

For a platform with 10 agents and 15 data sources, this means up to 150 custom integrations — each with its own maintenance burden.

### MCP's Solution

MCP standardizes the connection between AI applications and data sources using a client-server architecture with a well-defined protocol:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   AI Agent   │     │   AI Agent   │     │   AI Agent   │
│  (MCP Client)│     │  (MCP Client)│     │  (MCP Client)│
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │         MCP Protocol (JSON-RPC)          │
       │                    │                     │
┌──────┴───────┐     ┌──────┴───────┐     ┌──────┴───────┐
│  Wiki Server │     │  DB Server   │     │  Slack Server│
│ (MCP Server) │     │ (MCP Server) │     │ (MCP Server) │
└──────────────┘     └──────────────┘     └──────────────┘
```

Any MCP client can connect to any MCP server. Write one MCP server for your knowledge base, and every MCP-compatible agent can access it. Write one MCP client in your agent framework, and it can connect to every MCP server.

### Protocol Fundamentals

MCP uses JSON-RPC 2.0 over stdio (for local servers) or HTTP with Server-Sent Events (for remote servers). The protocol defines three core primitives:

- **Resources:** Read-only data that agents can access (documents, database records, files)
- **Tools:** Functions that agents can call to perform actions (search, create, update, delete)
- **Prompts:** Pre-built prompt templates that guide agent behavior in specific contexts

## MCP Server Architecture

### Server Structure

An MCP server exposes capabilities through a standardized interface:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "atlas-wiki", version: "1.0.0" },
  { capabilities: { resources: {}, tools: {} } }
);

// List available resources
server.setRequestHandler("resources/list", async () => ({
  resources: [
    {
      uri: "wiki://kb/vector-databases",
      name: "Vector Databases",
      description: "Guide to vector DB fundamentals, platforms, and indexing",
      mimeType: "text/markdown",
    },
    {
      uri: "wiki://kb/knowledge-graphs",
      name: "Knowledge Graphs",
      description: "Neo4j, Neptune, and graph-native intelligence",
      mimeType: "text/markdown",
    },
  ],
}));

// Read a specific resource
server.setRequestHandler("resources/read", async (request) => {
  const { uri } = request.params;
  const slug = uri.replace("wiki://kb/", "");
  const content = await loadArticle(slug);
  return {
    contents: [{
      uri,
      mimeType: "text/markdown",
      text: content,
    }],
  };
});

// Register a search tool
server.setRequestHandler("tools/list", async () => ({
  tools: [{
    name: "search_wiki",
    description: "Search the Atlas UX knowledge base for relevant articles",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        tier: { type: "number", enum: [1, 2, 3], description: "Filter by tier" },
        limit: { type: "number", default: 5, description: "Max results" },
      },
      required: ["query"],
    },
  }],
}));

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "search_wiki") {
    const results = await searchKnowledgeBase(args.query, args.tier, args.limit);
    return {
      content: [{
        type: "text",
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tools vs Resources vs Prompts

| Primitive | Purpose | Example | Agent Action |
|-----------|---------|---------|-------------|
| Resources | Read-only data access | KB articles, customer records, configs | Read and include in context |
| Tools | Executable functions | Search, create appointment, send SMS | Call with arguments, get result |
| Prompts | Guided interactions | "Analyze customer sentiment" template | Use as structured prompt |

**Resources** are best for static or slowly-changing knowledge: KB articles, documentation, configuration files. They are loaded into the agent's context window for reference.

**Tools** are best for dynamic interactions: searching the KB (because the query changes each time), creating records, or performing actions with side effects.

**Prompts** are best for standardized agent behaviors: a "handle complaint" prompt template that structures the agent's response pattern.

## Knowledge as MCP Resources vs Tools

### When to Use Resources

Resources work best when the agent needs to read and reference entire documents or data records:

```typescript
// Resource: full article content for deep reading
server.setRequestHandler("resources/read", async (request) => {
  const uri = request.params.uri;

  if (uri.startsWith("wiki://articles/")) {
    const articleId = uri.replace("wiki://articles/", "");
    const article = await prisma.kbDocument.findUnique({
      where: { id: articleId },
    });

    return {
      contents: [{
        uri,
        mimeType: "text/markdown",
        text: article?.content ?? "Article not found",
      }],
    };
  }

  // Dynamic resource: current system status
  if (uri === "wiki://system/status") {
    const status = await getSystemStatus();
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(status),
      }],
    };
  }
});
```

**Trade-off:** Resources consume context window tokens. A 3000-word article uses approximately 4000 tokens — a significant portion of the available context.

### When to Use Tools

Tools work best for dynamic queries where the agent needs to search, filter, or compute:

```typescript
// Tool: semantic search with metadata filtering
const searchTool = {
  name: "search_knowledge_base",
  description: "Search the knowledge base using semantic similarity with optional filters",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      tier: { type: "number", description: "1=core, 2=context, 3=reference" },
      category: { type: "string" },
      limit: { type: "number", default: 5 },
    },
    required: ["query"],
  },
};

// Tool: retrieve specific entity relationships from knowledge graph
const graphTool = {
  name: "query_knowledge_graph",
  description: "Query entity relationships in the knowledge graph",
  inputSchema: {
    type: "object",
    properties: {
      entity: { type: "string", description: "Entity name to look up" },
      relationship_type: { type: "string", description: "Type of relationship to traverse" },
      depth: { type: "number", default: 2, description: "How many hops to traverse" },
    },
    required: ["entity"],
  },
};
```

**Trade-off:** Tools require the agent to decide when and how to call them. If the agent does not realize it needs to search the KB, it will not call the tool.

### Hybrid Approach

The most effective pattern combines both: load essential context as resources (the agent always has it) and provide search/query tools for on-demand access to the broader KB:

```typescript
// Always-loaded resources: agent personality, core policies, current config
const essentialResources = [
  "wiki://config/agent-personality",
  "wiki://policies/safety-constraints",
  "wiki://config/current-tenant",
];

// On-demand tools: search the broader KB, query relationships
const onDemandTools = [
  "search_knowledge_base",
  "query_knowledge_graph",
  "get_article_by_slug",
];
```

## Multi-Agent MCP Topologies

### Hub-Spoke Topology

One central MCP server serves all agents. Simple to manage, single point of truth, but also a single point of failure:

```
        ┌─────────┐
        │  Agent A │
        └────┬─────┘
             │
┌────────┐   │   ┌────────┐
│ Agent B ├───┼───┤ Agent D│
└────────┘   │   └────────┘
             │
      ┌──────┴──────┐
      │  Central KB  │
      │  MCP Server  │
      └─────────────┘
             │
        ┌────┴─────┐
        │  Agent C  │
        └──────────┘
```

**Best for:** Small to medium agent teams (2-10 agents), single knowledge domain.

### Mesh Topology

Each agent can serve as both MCP client and MCP server, sharing its specialized knowledge with other agents:

```
┌──────────┐     ┌──────────┐
│  Lucy     │◄───►│  Atlas   │
│  (Voice)  │     │  (CEO)   │
└──┬───┬───┘     └──┬───┬───┘
   │   │            │   │
   │   └────────────┘   │
   │                    │
┌──┴───────┐     ┌──────┴──┐
│  Binky   │◄───►│  Delta  │
│  (CRO)   │     │  (Ops)  │
└──────────┘     └─────────┘
```

Each agent exposes its domain knowledge as an MCP server:
- Lucy exposes customer interaction history, call transcripts
- Atlas exposes strategic decisions, approval workflows
- Binky exposes marketing campaigns, customer segments
- Delta exposes operational status, deployment info

**Best for:** Large agent teams with distinct knowledge domains and peer-to-peer collaboration needs.

### Hierarchical Topology

Agents are organized in tiers, with higher-tier agents accessing broader knowledge through aggregating MCP servers:

```
           ┌──────────┐
           │  Atlas    │  Tier 0: Full access
           │  (CEO)    │
           └────┬─────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───┴───┐  ┌───┴───┐  ┌───┴───┐
│ Sales  │  │  Ops  │  │  Eng  │  Tier 1: Domain aggregators
│ Hub    │  │  Hub  │  │  Hub  │  (MCP servers)
└───┬───┘  └───┬───┘  └───┬───┘
    │          │          │
┌───┴───┐ ┌───┴───┐ ┌───┴───┐
│ Binky │ │ Delta │ │ Ephor │  Tier 2: Specialist agents
│ Lucy  │ │       │ │       │
└───────┘ └───────┘ └───────┘
```

**Best for:** Enterprise deployments with role-based access control, where different agents should see different knowledge tiers.

## Token Economics: Context Window Management

### The Token Budget Problem

Context windows are finite. Claude has 200K tokens, GPT-4o has 128K tokens, and most models perform best when context stays under 50% of the maximum. Every MCP resource loaded and every tool result returned consumes tokens from this budget.

**Token budget allocation (example for 128K context window):**

| Component | Token Budget | Percentage |
|-----------|-------------|------------|
| System prompt + personality | 2,000 | 1.5% |
| Conversation history | 10,000 | 8% |
| MCP resources (always loaded) | 8,000 | 6% |
| Tool results (on demand) | 15,000 | 12% |
| Generation budget | 5,000 | 4% |
| Safety margin | 88,000 | 68.5% |

### Strategies for Token Efficiency

**Summarization before injection:** Large documents should be summarized before loading as resources:

```typescript
async function loadResourceWithBudget(
  articleContent: string,
  maxTokens: number = 2000,
): Promise<string> {
  const tokenCount = estimateTokens(articleContent);

  if (tokenCount <= maxTokens) {
    return articleContent;
  }

  // Summarize to fit budget
  const summary = await llm.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{
      role: "user",
      content: `Summarize this article in under ${maxTokens} tokens, preserving key facts and code examples:\n\n${articleContent}`,
    }],
    max_tokens: maxTokens,
  });

  return summary.choices[0].message.content;
}
```

**Progressive disclosure:** Start with summaries, load full content only when the agent needs details:

```typescript
// Level 1: Title + one-line description (10 tokens each)
const articleIndex = articles.map(a => `- ${a.title}: ${a.summary}`);

// Level 2: Key points (100 tokens each)
// Loaded when agent identifies relevant articles

// Level 3: Full content (1000+ tokens each)
// Loaded only when agent needs to answer a specific question
```

**Context eviction:** Remove stale or low-relevance context to make room for new information:

```typescript
interface ContextEntry {
  content: string;
  tokens: number;
  relevanceScore: number;
  lastAccessedAt: Date;
}

function evictLeastRelevant(
  context: ContextEntry[],
  budgetTokens: number,
): ContextEntry[] {
  // Sort by relevance (descending)
  const sorted = [...context].sort((a, b) => b.relevanceScore - a.relevanceScore);

  let totalTokens = 0;
  const kept: ContextEntry[] = [];

  for (const entry of sorted) {
    if (totalTokens + entry.tokens <= budgetTokens) {
      kept.push(entry);
      totalTokens += entry.tokens;
    }
  }

  return kept;
}
```

## Atlas UX's Wiki-as-MCP-Server Vision

Atlas UX's wiki at wiki.atlasux.cloud serves as the public-facing knowledge base for AI tooling, workflow, and infrastructure knowledge. The vision extends this to an MCP server that other AI systems can connect to for knowledge access.

### Architecture

```
┌─────────────────────────────────────────┐
│          wiki.atlasux.cloud              │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ HTTP API  │  │ MCP Server│  │  Wiki  │ │
│  │ /v1/wiki  │  │ (stdio/  │  │  UI    │ │
│  │           │  │  SSE)    │  │        │ │
│  └─────┬────┘  └─────┬────┘  └────────┘ │
│        │             │                    │
│  ┌─────┴─────────────┴────┐              │
│  │    KB Article Store     │              │
│  │    (141+ articles)     │              │
│  │    Pinecone Vectors     │              │
│  └────────────────────────┘              │
└─────────────────────────────────────────┘
         │              │
    ┌────┴────┐    ┌────┴────┐
    │ Claude  │    │ Custom  │
    │ Code    │    │ Agent   │
    │ (client)│    │ (client)│
    └─────────┘    └─────────┘
```

### Tiered Access Model

The MCP server implements tiered access based on API key level:

- **Free tier:** Read article summaries, search by keyword (10 requests/hour)
- **Builder tier:** Full article access, semantic search, metadata filtering (100 requests/hour)
- **Pro tier:** Full access plus knowledge graph queries, custom embeddings, and the ability to contribute articles (unlimited)

### Token Exchange Economy

The Pro tier introduces a token exchange: users deposit API keys (OpenAI, Anthropic, etc.) and in return gain access to the full knowledge base via MCP. This creates a virtuous cycle where users contribute compute capacity and receive curated knowledge — knowledge that would cost them significantly more to build from scratch.

## Conclusion

MCP transforms knowledge sharing between AI agents from a custom integration problem into a standardized protocol problem. Instead of building N agents x M data sources custom connections, teams build M MCP servers and connect them to any MCP-compatible agent. For multi-agent systems, the choice of topology — hub-spoke for simplicity, mesh for peer collaboration, hierarchical for enterprise access control — depends on the agent team structure and knowledge sharing patterns. The critical constraint is token economics: context windows are finite, and MCP resource and tool usage must be budgeted carefully to avoid context overflow. Atlas UX's vision of wiki-as-MCP-server represents a natural evolution where curated knowledge becomes a service that any AI agent can connect to and query through a standard protocol.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopology-Star.svg/400px-NetworkTopology-Star.svg.png — Star/hub-spoke network topology representing centralized MCP server architecture
2. https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/NetworkTopology-Mesh.svg/400px-NetworkTopology-Mesh.svg.png — Mesh network topology showing peer-to-peer MCP agent connections
3. https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Client-server-model.svg/400px-Client-server-model.svg.png — Client-server model diagram illustrating the MCP client-server relationship
4. https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/JSON-RPC_logo.svg/400px-JSON-RPC_logo.svg.png — JSON-RPC protocol used as MCP's communication layer
5. https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Hierarchical_network.svg/400px-Hierarchical_network.svg.png — Hierarchical network topology for tiered MCP agent access

## Videos

1. https://www.youtube.com/watch?v=kQmXtrmQ5Zg — "Model Context Protocol (MCP) Explained" by Anthropic introducing the protocol and its design philosophy
2. https://www.youtube.com/watch?v=GJqqoLiKOgE — "Building MCP Servers" by Alex Albert demonstrating practical MCP server implementation

## References

1. Anthropic. (2024). "Model Context Protocol Specification." https://spec.modelcontextprotocol.io/
2. Anthropic. (2024). "Model Context Protocol Documentation." https://modelcontextprotocol.io/
3. Anthropic. (2024). "Introducing the Model Context Protocol." https://www.anthropic.com/news/model-context-protocol
4. MCP TypeScript SDK. GitHub Repository. https://github.com/modelcontextprotocol/typescript-sdk
