# Atlas UX API -- Chat

The chat endpoint powers all AI conversations in Atlas UX. It routes messages through the SGL governance layer, enriches prompts with knowledge base context, and returns AI-generated responses.

## Send Chat Message

```
POST /v1/chat
```

Sends a message to an AI agent and receives a response. The backend enriches the conversation with knowledge base context, agent tools, and governance gates before forwarding to the AI provider.

**Auth:** JWT + `x-tenant-id` header.

**Rate Limit:** Global default (100 req/min).

**Request Body:**

```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "What workflows are running today?" }
  ],
  "provider": "openai",
  "model": "gpt-4o",
  "agentId": "atlas",
  "sessionId": "optional-session-id"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `messages` | array | Yes | OpenAI-compatible message array |
| `provider` | string | No | AI provider: `openai`, `deepseek`, `openrouter`, `cerebras` |
| `model` | string | No | Model ID (e.g., `gpt-4o`, `deepseek-chat`) |
| `agentId` | string | No | Agent to chat with (default: `atlas`) |
| `sessionId` | string | No | Session ID for deep agent pipeline |

**Response:**

```json
{
  "provider": "openai",
  "content": "Today there are 3 active workflows...",
  "usage": {
    "prompt_tokens": 1200,
    "completion_tokens": 350,
    "total_tokens": 1550
  }
}
```

**SGL Governance:**

Every chat request passes through the System Governance Language (SGL) evaluator:

- **ALLOW**: Request proceeds normally.
- **BLOCK** (403): Request violates a governance rule. Returns `{ "error": "sgl_block", "reasons": [...] }`.
- **REVIEW** (428): Requires human approval. Returns `{ "error": "human_approval_required", "reasons": [...] }`.

**Seat Enforcement:**

If the user exceeds their daily token budget, the endpoint returns `429`:

```json
{ "ok": false, "error": "daily_token_budget_exceeded" }
```

**Context Enrichment Tiers:**

The backend classifies queries into tiers to control how much context is injected:

| Tier | Description |
|------|-------------|
| `DIRECT` | Pure task, no KB context needed |
| `SKILL_ONLY` | Agent SKILL.md injected (filesystem, 0ms) |
| `HOT_CACHE` | Governance + agent docs from memory cache |
| `FULL_RAG` | Full retrieval-augmented generation from database |

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Summarize our Q1 strategy"}],
    "provider": "openai",
    "model": "gpt-4o",
    "agentId": "atlas"
  }'
```
