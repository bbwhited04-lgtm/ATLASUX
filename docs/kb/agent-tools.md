# Agent Tools

## What Are Agent Tools?

Agent tools are the capabilities that AI agents can invoke to interact with external systems, manipulate data, and perform real-world actions. Each tool is a registered function that an agent can call during task execution, similar to how a human employee might use software applications to get work done.

Tools are the bridge between agent reasoning and action. An agent decides what to do, then uses the appropriate tool to do it.

## Available Tool Categories

### Communication Tools

**Email (Microsoft Graph)**
- Send emails via the configured Microsoft Graph API
- Uses `MS_SENDER_UPN` (default: `atlas@deadapp.info`) as the sender
- Supports HTML formatting, attachments, CC/BCC
- Each named agent has its own configured email address

**Telegram**
- `send_telegram_message` — Send notifications and messages to configured Telegram chats
- Triggered automatically when agents detect keywords like "telegram," "notify me," "ping me," or "alert me"
- Uses the BotFather token for authentication
- Chat IDs are stored in the Integration configuration

**Microsoft Teams**
- Send messages to Teams channels via Graph API
- Uses `teamId` and `channelId` for targeting
- Requires `ChannelMessage.Send` permission in Azure AD
- No Power Automate dependency — direct Graph API integration

**Slack**
- Post messages to Slack channels
- Supports formatted messages with blocks and attachments

### Content Publishing Tools

**Social Media Publishing**
Each social platform has a dedicated publishing tool used by its assigned agent:
- X/Twitter (Kelly)
- Facebook (Fran)
- Threads (Dwight)
- TikTok (Timmy)
- Tumblr (Terry)
- Pinterest (Cornwall)
- LinkedIn (Link)
- Alignable (Emma)
- Reddit (Donna)
- Blog (Reynolds)

**Multi-Platform Ads**
- Penny manages cross-platform advertising campaigns
- Supports Facebook Ads and multi-platform distribution

### File Operations

**Supabase Storage**
- Upload files to tenant-specific paths (`tenants/{tenantId}/`)
- List files in a tenant's directory
- Generate signed download URLs
- Delete files
- Storage bucket: `kb_uploads`

**Knowledge Base**
- Ingest documents into the knowledge base
- Chunk documents for retrieval
- Query the KB for relevant context during reasoning

### Data and Analysis Tools

**Web Search**
- Search the web for current information
- Used by research agents (Archy) and intelligence agents (Daily Intel)
- Results are processed and summarized by the agent

**Content Generation**
- Generate text content using configured AI providers
- Supports multiple models for different quality/speed tradeoffs
- Long-context summarization via Gemini for large documents

### Workflow Tools

**Job Creation**
- Create new jobs in the queue for other agents to process
- Enables task chaining and multi-agent workflows

**Decision Memo Creation**
- Generate Decision Memos when approval is required
- Structured format with rationale, risk assessment, and alternatives

## Tool Registration

Tools are registered in `backend/src/tools/agentTools.ts`. Each tool definition includes:

```
Tool Definition
─────────────────────────
name:        Unique identifier (e.g., "send_telegram_message")
description: What the tool does (used by the agent for selection)
parameters:  JSON schema defining required and optional inputs
handler:     The function that executes the tool's action
permissions: Which agent roles can use this tool
```

## Tool Execution Flow

1. **Selection**: The agent's reasoning determines which tool to use based on the task
2. **Parameter extraction**: The agent extracts required parameters from the task context
3. **Validation**: The engine validates parameters against the tool's schema
4. **Policy check**: SGL rules verify the agent has permission to use this tool
5. **Execution**: The tool handler runs with the validated parameters
6. **Result capture**: The tool's output is captured and returned to the agent
7. **Audit logging**: The tool invocation and result are recorded in the audit log

## Tool Safety

### Permission Model
Not all agents can use all tools. Tool access is governed by:
- Agent role definitions — each role specifies which tools are available
- SGL policies — additional constraints on when tools can be used
- Tenant configuration — organizations can restrict tool availability

### Rate Limiting
External API tools (email, social media, web search) are subject to rate limits:
- Per-tool limits prevent abuse of any single integration
- Provider-level limits respect upstream API quotas
- Daily action caps provide an overall ceiling

### Sensitive Operations
Tools that perform sensitive operations (financial transactions, data deletion, external communications) automatically generate audit log entries with elevated severity and may trigger Decision Memos.

## Adding New Tools

The tool system is extensible. New tools can be added by:
1. Defining the tool schema in `agentTools.ts`
2. Implementing the handler function
3. Registering the tool with appropriate permission constraints
4. Updating agent role definitions to include the new tool

## Key Takeaways

1. Tools are the action layer — they connect agent reasoning to real-world effects.
2. Every tool invocation is validated, permission-checked, and audit-logged.
3. The tool set covers communication, publishing, file management, data analysis, and workflow orchestration.
4. Tool access is role-based — agents can only use tools appropriate to their function.
5. Rate limits and safety checks prevent misuse at every level.
