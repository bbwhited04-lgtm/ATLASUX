# Agent SDK Landscape: Building Production AI Agents

## From Frameworks to SDKs

The distinction between an agent framework and an agent SDK matters. Frameworks like CrewAI and LangGraph provide patterns for orchestrating agents — they are tool-agnostic and model-agnostic. SDKs, by contrast, are provided by AI model vendors and offer deep integration with a specific model's capabilities. They expose native features — tool calling, structured outputs, long context windows, vision — through purpose-built APIs rather than abstraction layers.

The agent SDK landscape in 2025 is a competitive battleground. Every major AI provider has released or is building an agent SDK, each reflecting their model's strengths and their vision of how agents should work. Understanding this landscape is critical for anyone building production AI systems.

## Anthropic Claude Agent SDK

### Architecture

Anthropic's Claude Agent SDK, released in 2025, is built around Claude's native tool-use capabilities. Claude models support tool calling as a first-class feature — the model can decide to call a tool, format the call correctly, and process the result — without the prompt engineering hacks that earlier approaches required.

The SDK provides:

- **Agent loop management**: Handles the observe-think-act cycle, including multi-turn conversations with tool calls
- **Tool registration**: Define tools with typed schemas, and the SDK handles formatting for Claude's tool-use API
- **MCP (Model Context Protocol) integration**: Native support for the emerging standard for tool connectivity
- **Memory and context management**: Strategies for managing long conversations within context window limits
- **Streaming**: Token-level and turn-level streaming for responsive UIs
- **Multi-agent coordination**: Support for multiple agents with different roles and tool access

### Strengths

The SDK's tight integration with Claude's Constitutional AI training is its primary differentiator. Claude models are trained to use tools safely — they consider whether a tool call is appropriate, handle errors gracefully, and explain their reasoning. This alignment at the model level reduces the amount of safety infrastructure that the application layer needs to provide.

MCP support is increasingly important. The Model Context Protocol standardizes how AI agents connect to external tools and data sources, enabling a plug-and-play ecosystem of tool providers. As MCP adoption grows, Claude Agent SDK users get access to a widening library of integrations without building custom connectors.

### Limitations

Claude-only. If your application needs to use GPT-4, Gemini, or open-source models, the Claude Agent SDK will not help. The ecosystem is younger than LangChain-based alternatives, with fewer community-contributed tools, examples, and tutorials.

## OpenAI Assistants API

### Architecture

OpenAI's Assistants API, launched in November 2023 and significantly updated in 2024, takes a managed-infrastructure approach. Instead of providing an SDK that runs in your application, OpenAI runs the agent loop on their servers.

The API defines:

- **Assistants**: Configured with instructions, tools, and model selection. Persistent across conversations.
- **Threads**: Conversation histories that can accumulate messages over time. Threads are stored server-side by OpenAI.
- **Runs**: Executions of an assistant on a thread. When you create a run, OpenAI's infrastructure handles the agent loop — calling tools, processing results, and generating responses.
- **Built-in tools**: Code Interpreter (sandboxed Python execution), File Search (vector-based retrieval over uploaded files), and Function Calling (custom tools).

### Strengths

The managed approach dramatically reduces the engineering burden. You do not implement the agent loop, manage state persistence, or handle tool execution orchestration. OpenAI does all of that. The Code Interpreter tool is particularly powerful — it gives the agent a sandboxed Python environment where it can write and execute code, analyze data, create visualizations, and process files.

File Search provides built-in RAG (Retrieval-Augmented Generation) without requiring a separate vector database. Upload files to the assistant, and it can search them during conversations using vector similarity.

### Limitations

Vendor lock-in is the primary concern. Your assistant configuration, conversation history, and file storage all live on OpenAI's infrastructure. Migrating to another provider means rebuilding everything.

Customization is limited compared to SDK-based approaches. You cannot modify the agent loop, add custom persistence logic, or implement bespoke safety mechanisms. The managed approach trades flexibility for convenience.

Cost can be high. Each run consumes tokens for the system prompt, conversation history, tool call formatting, and the model's reasoning. Long-running assistants with extensive conversation histories accumulate significant costs.

Observability is limited. Since the agent loop runs on OpenAI's servers, you see the inputs and outputs but not the intermediate reasoning. This makes debugging difficult when the assistant behaves unexpectedly.

## Google Vertex AI Agent Builder

### Architecture

Google's Vertex AI Agent Builder (evolved from Dialogflow and integrated with Gemini) provides a platform for building conversational agents and task-completion agents.

The platform offers:

- **Agent configuration**: Define agent behavior through natural language instructions, structured schemas, or Dialogflow-style flow design
- **Tool integration**: Connect agents to Google Cloud services, REST APIs, and data stores
- **Grounding**: Connect agents to Google Search or custom data sources to reduce hallucination
- **Multi-agent support**: Build agent networks where specialized agents handle different aspects of a workflow
- **Evaluation and testing**: Built-in tools for testing agent behavior against expected outcomes

### Strengths

Deep integration with Google Cloud services makes Vertex AI Agent Builder compelling for organizations already invested in GCP. Grounding with Google Search provides access to real-time information that would otherwise require custom web search integration. The Dialogflow heritage means strong support for structured conversational flows — useful for customer service and support applications.

Gemini models' large context windows (up to 1 million tokens in Gemini 1.5 Pro) enable agents to process entire documents, codebases, or conversation histories that would exceed other models' limits.

### Limitations

Tightly coupled to Google Cloud Platform. The platform-as-a-service model means less control over the agent's internal behavior. Documentation can be inconsistent as the platform has evolved through multiple product generations (Dialogflow, Vertex AI Conversation, Agent Builder).

## Amazon Bedrock Agents

### Architecture

Amazon Bedrock Agents, part of AWS's managed AI service, provides infrastructure for building and deploying AI agents within the AWS ecosystem.

Key components:

- **Foundation model selection**: Choose from Anthropic Claude, Meta Llama, Amazon Titan, and other models available on Bedrock
- **Knowledge bases**: Managed RAG with automatic document chunking, embedding, and vector storage
- **Action groups**: Define tools as AWS Lambda functions that the agent can invoke
- **Guardrails**: Configure content filtering, topic blocking, and PII redaction
- **Agent orchestration**: Managed agent loop with trace visibility

### Strengths

AWS ecosystem integration is the primary draw. Agents can invoke Lambda functions, query DynamoDB, interact with S3, and use any AWS service through action groups. The managed knowledge base provides turnkey RAG without provisioning vector databases.

Multi-model support through Bedrock means you are not locked into a single model provider. You can use Claude for complex reasoning and a smaller model for simple classification tasks within the same agent.

Guardrails provide configurable safety controls — content filtering, topic restrictions, and PII handling — without custom implementation.

### Limitations

AWS-centric. While Bedrock supports multiple models, the agent infrastructure is tightly coupled to AWS services. The Lambda-based tool execution model adds latency compared to in-process tool calls. Pricing can be complex, combining Bedrock model costs with Lambda execution costs and knowledge base storage costs.

## MCP: The Emerging Standard

### What is MCP?

The Model Context Protocol (MCP), introduced by Anthropic, is a specification for how AI agents connect to external tools and data sources. Think of it as USB for AI agents — a standardized interface that allows any MCP-compatible agent to use any MCP-compatible tool.

Before MCP, every agent framework had its own tool definition format. A tool built for LangChain could not be used with CrewAI without adaptation. MCP standardizes tool discovery, invocation, and response formatting.

### MCP Architecture

MCP defines three components:

- **MCP Servers**: Expose tools and data sources through a standardized protocol. An MCP server might provide access to a database, a web API, a file system, or any other resource.
- **MCP Clients**: Agent frameworks and SDKs that can discover and invoke MCP servers. The Claude Agent SDK is a native MCP client.
- **Transport**: The communication protocol between clients and servers (currently supports stdio and HTTP/SSE).

### Adoption

MCP adoption is accelerating. Anthropic's Claude Agent SDK supports MCP natively. LangChain and LangGraph have added MCP support. Independent developers are building MCP servers for hundreds of services — databases, SaaS APIs, developer tools, and more.

### How Atlas UX Uses MCP

Atlas UX leverages MCP for its wiki API and tool integrations. This means that as the MCP ecosystem grows, Atlas UX can add new capabilities — new data sources, new external services, new tool integrations — by connecting to MCP servers rather than building custom integrations from scratch.

## What Makes a Production-Ready Agent SDK

Not every agent SDK is production-ready. Based on the challenges teams encounter when moving from prototype to production, these are the requirements that separate production SDKs from experimental ones:

### Reliability

The agent loop must handle failures gracefully — tool call timeouts, malformed responses, rate limiting, network errors. A production SDK needs retry logic, circuit breakers, and fallback strategies.

### Observability

When an agent produces an unexpected result, you need to understand why. Production SDKs must provide detailed traces of the agent's reasoning, tool calls, and decision points. Without observability, debugging agent behavior is guesswork.

### Cost Management

Token consumption can be unpredictable, especially in multi-turn agent interactions. Production SDKs need token counting, budget limits, and strategies for managing context window usage.

### Safety and Guardrails

Production agents need configurable boundaries — what tools they can access, what actions they can take, when they must escalate to a human. These guardrails must be enforceable at the SDK level, not just the model level.

### State Management

Production agents often need to pause, persist state, and resume later. The SDK must support state serialization, checkpoint-based recovery, and long-running workflow management.

### Multi-Tenant Isolation

For platforms like Atlas UX that serve multiple customers, the SDK must support tenant-level isolation — separate configurations, separate tool access, separate data boundaries for each tenant.

Atlas UX addresses these production requirements through its custom architecture: the engine loop provides reliability and state management, SGL policies provide safety guardrails, the audit trail provides observability, per-tenant credential resolution provides isolation, and spending limits provide cost management. These are the features that turn an agent SDK into a production platform.

## Resources

- https://docs.anthropic.com/en/docs/agents-and-tools/agent-sdk — Anthropic Claude Agent SDK documentation
- https://modelcontextprotocol.io/ — Model Context Protocol specification and ecosystem
- https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html — Amazon Bedrock Agents documentation

## Image References

1. "Agent SDK comparison architecture Anthropic OpenAI Google AWS" — search: `agent sdk comparison architecture diagram`
2. "Model Context Protocol MCP architecture client server diagram" — search: `model context protocol mcp architecture diagram`
3. "OpenAI Assistants API architecture threads runs tools" — search: `openai assistants api architecture diagram`
4. "Production AI agent requirements checklist" — search: `production ai agent requirements checklist`
5. "AWS Bedrock Agents architecture Lambda knowledge base" — search: `aws bedrock agents architecture diagram`

## Video References

1. https://www.youtube.com/watch?v=vGP4pQdCocw — "Claude Agent SDK: Building Production AI Agents" by Anthropic
2. https://www.youtube.com/watch?v=TuV_WqFmgis — "MCP Explained: The Protocol Connecting AI to Everything" by AI Jason
