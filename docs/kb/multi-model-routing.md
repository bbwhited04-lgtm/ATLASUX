# Multi-Model Routing

## Overview

Atlas UX routes AI requests across four providers — OpenAI, DeepSeek, Cerebras,
and OpenRouter — based on task complexity, latency requirements, and cost
constraints. The routing logic lives in `backend/src/ai.ts`, which exports
configured clients and helper functions for selecting the appropriate model
for each use case.

## Provider Configuration

Each provider is initialized from environment variables in `backend/src/env.ts`:

```typescript
// ai.ts — Provider initialization
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1"
});

export const cerebras = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: "https://api.cerebras.ai/v1"
});

export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});
```

All providers use the OpenAI SDK since they expose OpenAI-compatible APIs.
This means switching between providers requires only changing the client
reference, not rewriting the completion call.

## Model Selection by Use Case

### GPT-4 (OpenAI)

**Best for**: Complex reasoning, nuanced decisions, creative writing, approval
memo drafting, multi-step planning.

**When to use**:
- Agent orchestration decisions (Atlas routing tasks to other agents)
- Decision memo generation (risk assessment, cost-benefit analysis)
- Content creation requiring brand voice consistency
- Complex KB synthesis (combining information from multiple documents)
- Any task where accuracy is more important than speed or cost

**Model ID**: `gpt-4` or `gpt-4-turbo` (context-dependent)
**Context window**: 128K tokens (turbo), 8K tokens (base)
**Cost**: ~$30 per 1M input tokens, ~$60 per 1M output tokens (turbo)

### DeepSeek

**Best for**: Cost-effective routine tasks, code generation, structured data
extraction, translation, summarization.

**When to use**:
- Routine agent responses (acknowledgments, status updates)
- Code generation and debugging
- Data formatting and extraction
- Template-based content generation
- High-volume tasks where per-token cost matters

**Model ID**: `deepseek-chat` or `deepseek-coder`
**Context window**: 64K tokens
**Cost**: ~$0.14 per 1M input tokens, ~$0.28 per 1M output tokens

DeepSeek is roughly **200x cheaper** than GPT-4 for input tokens, making it
the default choice for tasks that do not require GPT-4's reasoning capability.

### Cerebras

**Best for**: Time-sensitive operations requiring fast inference, real-time
interactions, quick classification tasks.

**When to use**:
- Context window summarization (when truncation is needed mid-conversation)
- Quick classification (is this message urgent? which agent should handle it?)
- Real-time chat responses where latency matters
- Lightweight NLP tasks (sentiment analysis, entity extraction)
- The LONG_CONTEXT_SUMMARY route (one of 4 provider options)

**Model ID**: `llama3.1-70b` (via Cerebras inference)
**Context window**: 8K tokens
**Cost**: Competitive with DeepSeek for short completions
**Latency**: Significantly faster than GPT-4 due to custom silicon

### OpenRouter

**Best for**: Fallback routing, model diversity, accessing models not directly
available through other providers.

**When to use**:
- Primary provider is down or rate-limited
- Need access to specific models (Gemini, Claude, Mixtral) for specialized tasks
- A/B testing different models for quality comparison
- The LONG_CONTEXT_SUMMARY route (Gemini 1.5 Pro via OpenRouter for 1M context)

**Model IDs**: Varies (e.g., `google/gemini-pro-1.5`, `anthropic/claude-3-opus`)
**Context window**: Model-dependent
**Cost**: Model-dependent plus OpenRouter markup

## Routing Categories

### ORCHESTRATION_REASONING

Used by the engine loop when an agent needs to make a decision about what
to do next. This is the primary reasoning pathway.

```typescript
async function orchestrationReasoning(
  messages: ChatMessage[],
  tools: ToolDefinition[]
): Promise<CompletionResult> {
  // Always use GPT-4 for orchestration — accuracy is critical
  return openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages,
    tools,
    temperature: 0.3,  // Low temperature for consistent decisions
    max_tokens: 4096
  });
}
```

Temperature is set to **0.3** for orchestration to reduce randomness in
decision-making while allowing some flexibility in phrasing.

### LONG_CONTEXT_SUMMARY

Used when an agent's context exceeds the target window and needs to be
condensed. This route tries four providers in priority order:

1. **Gemini 1.5 Pro** (via OpenRouter) — 1M token context window
2. **Gemini 2.0 Flash** (via OpenRouter) — Fast, large context
3. **OpenRouter fallback** — Any available large-context model
4. **Cerebras** — Fast inference for shorter contexts

```typescript
async function longContextSummary(content: string): Promise<string> {
  const providers = [
    { client: openrouter, model: "google/gemini-pro-1.5" },
    { client: openrouter, model: "google/gemini-2.0-flash" },
    { client: openrouter, model: "meta-llama/llama-3.1-70b" },
    { client: cerebras, model: "llama3.1-70b" }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [
          { role: "system", content: "Summarize the following content concisely..." },
          { role: "user", content }
        ],
        temperature: 0.2,
        max_tokens: 2048
      });
      return result.choices[0].message.content!;
    } catch (err) {
      continue; // Try next provider
    }
  }
  throw new Error("All LONG_CONTEXT_SUMMARY providers failed");
}
```

The route has a **90-second timeout** to accommodate large context windows.
WF-106 (Atlas Daily Aggregation) uses ORCHESTRATION_REASONING instead of
LONG_CONTEXT_SUMMARY to avoid this timeout.

## Context Window Management

### Truncation Strategy

When the assembled context exceeds the model's window:

1. Count total tokens using `tiktoken`
2. If over limit, apply truncation in priority order:
   - Remove oldest conversation turns (keep last 20)
   - Reduce retrieved memories from 5 to 3
   - Reduce KB chunks from 5 to 2
   - Never truncate system prompt or SKILL.md

### Summarization Strategy

For conversations that need full history preservation:

1. Extract turns beyond the context window
2. Send them to LONG_CONTEXT_SUMMARY for condensation
3. Insert the summary as a single system message: "Previous conversation summary: ..."
4. Continue with the condensed context

Summarization is more expensive (requires an extra LLM call) but preserves
more information than simple truncation.

## Cost Comparison

Approximate costs per 1M tokens (as of February 2026):

| Provider | Model | Input | Output |
|----------|-------|-------|--------|
| OpenAI | GPT-4 Turbo | $10.00 | $30.00 |
| OpenAI | GPT-4o | $2.50 | $10.00 |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |
| Cerebras | llama3.1-70b | $0.60 | $0.60 |
| OpenRouter | Gemini 1.5 Pro | $1.25 | $5.00 |
| OpenRouter | Gemini 2.0 Flash | $0.10 | $0.40 |

### Cost Optimization Rules

The engine applies these rules to minimize costs without sacrificing quality:

1. **Default to DeepSeek** for all routine operations
2. **Escalate to GPT-4** only when the task involves reasoning, creativity,
   or high-stakes decisions
3. **Use Cerebras** for latency-sensitive operations (real-time chat, quick
   classifications)
4. **Use OpenRouter/Gemini** for large-context operations that exceed other
   models' windows

## Fallback Chain

When the primary provider fails, the engine tries fallback providers:

```
GPT-4 → OpenRouter (GPT-4 equivalent) → DeepSeek → Error

DeepSeek → Cerebras → OpenRouter → Error

Cerebras → DeepSeek → OpenRouter → Error
```

Each fallback attempt is logged to `audit_log` with the original provider,
the fallback provider, and the error that triggered the fallback.

## Model Selection in Practice

The engine determines which model to use based on a `routingHint` passed
by the calling code:

```typescript
type RoutingHint =
  | "orchestration"      // → GPT-4
  | "routine"            // → DeepSeek
  | "fast"               // → Cerebras
  | "long_context"       // → Gemini via OpenRouter
  | "creative"           // → GPT-4
  | "code"               // → DeepSeek Coder
  | "classification";    // → Cerebras

async function routeCompletion(
  hint: RoutingHint,
  messages: ChatMessage[],
  options?: CompletionOptions
): Promise<CompletionResult> {
  const { client, model } = selectProvider(hint);
  return client.chat.completions.create({
    model,
    messages,
    ...options
  });
}
```

Agents do not choose their own model. The engine selects the model based
on the task type, ensuring consistent cost and quality characteristics
across the platform.
