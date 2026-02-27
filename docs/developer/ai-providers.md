# AI Providers

Atlas UX supports multiple AI providers through a unified chat router in `backend/src/ai.ts`. The system can dynamically route requests to different providers based on the task type, cost requirements, or availability.

## Supported Providers

| Provider     | API Key Env Variable    | Default Model             | Endpoint                                          |
|-------------|-------------------------|---------------------------|---------------------------------------------------|
| OpenAI       | `OPENAI_API_KEY`       | `gpt-4o-mini`             | `api.openai.com/v1/chat/completions`             |
| DeepSeek     | `DEEPSEEK_API_KEY`     | `deepseek-chat`           | `api.deepseek.com/chat/completions`              |
| Claude       | `ANTHROPIC_API_KEY`    | `claude-3-5-haiku-20241022`| `api.anthropic.com/v1/messages`                  |
| Claude (OR)  | `OPENROUTER_API_KEY`   | `anthropic/claude-3-5-haiku`| `openrouter.ai/api/v1/chat/completions`         |
| Gemini       | `GEMINI_API_KEY`       | `gemini-2.0-flash`        | `generativelanguage.googleapis.com/v1beta/...`   |
| Gemini (OR)  | `OPENROUTER_API_KEY`   | `google/gemini-2.0-flash-exp:free` | `openrouter.ai/api/v1/chat/completions` |

**OR** = OpenRouter fallback. If a direct API key is not available, the provider falls through to OpenRouter.

## Chat Router -- `runChat()`

The core function is `runChat()` in `backend/src/ai.ts`. It accepts a provider name, messages array, and optional model override:

```typescript
import { runChat } from "../ai.js";

const result = await runChat(
  {
    provider: "openai",
    model: "gpt-4o-mini",  // optional, uses default if omitted
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Summarize this report..." },
    ],
  },
  process.env  // env object for API keys
);

// result: { provider, model, request_id, content }
```

## Provider Selection Logic

Each provider is tried based on the `provider` field in the request:

```
provider = "openai"   -> OpenAI API (requires OPENAI_API_KEY)
provider = "deepseek" -> DeepSeek API (requires DEEPSEEK_API_KEY)
provider = "claude"   -> Anthropic direct (ANTHROPIC_API_KEY), then OpenRouter fallback
provider = "gemini"   -> Google direct (GEMINI_API_KEY), then OpenRouter fallback
```

If no valid key is found for the requested provider, an error is thrown.

## Claude: Direct vs OpenRouter

Claude has two code paths:

**Direct Anthropic API** (preferred when `ANTHROPIC_API_KEY` is set):
```typescript
// Separates system messages from chat messages (Anthropic API requirement)
const sysMsgs = messages.filter(m => m.role === "system");
const chatMsgs = messages.filter(m => m.role !== "system");

await fetch("https://api.anthropic.com/v1/messages", {
  headers: {
    "x-api-key": anthropicKey,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 4096,
    system: sysMsgs.map(m => m.content).join("\n\n"),
    messages: chatMsgs,
  }),
});
```

**OpenRouter fallback** (when only `OPENROUTER_API_KEY` is set):
```typescript
await fetch("https://openrouter.ai/api/v1/chat/completions", {
  headers: {
    Authorization: `Bearer ${orKey}`,
    "HTTP-Referer": "https://atlasux.cloud",
    "X-Title": "Atlas UX",
  },
  body: JSON.stringify({ model: "anthropic/claude-3-5-haiku", messages }),
});
```

## Gemini: Direct vs OpenRouter

Gemini also has two paths. The direct Google API uses a different message format (`contents` with `parts`), while OpenRouter uses the standard OpenAI-compatible format.

```typescript
// Direct Google API — messages transformed to Google format
const contents = messages
  .filter(m => m.role !== "system")
  .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleKey}`,
  { method: "POST", body: JSON.stringify({ contents }) }
);
```

## Task-Specific Routing

The engine uses different provider configurations for different task types:

| Task Type                    | Typical Provider | Purpose                                      |
|------------------------------|------------------|----------------------------------------------|
| `ORCHESTRATION_REASONING`    | openai / claude  | Agent task planning, decision-making          |
| `LONG_CONTEXT_SUMMARY`       | gemini           | Summarizing large documents (90s timeout)     |
| General chat                 | openai           | Standard conversational responses             |

`ORCHESTRATION_REASONING` is preferred over `LONG_CONTEXT_SUMMARY` for time-sensitive operations (like WF-106 Atlas Aggregation) because it avoids the 90-second timeout that long-context providers may hit.

## Temperature and Parameters

All providers default to `temperature: 0.7`. The model can be overridden per request via `req.model`.

## Response Format

All providers return a normalized response:

```typescript
{
  provider: "openai",
  model: "gpt-4o-mini",
  request_id: "chatcmpl-abc123",
  content: "Here is the summary..."
}
```

## Error Handling

- Missing API key: `Error("OPENAI_API_KEY not set")`
- Provider API error: Re-throws the provider's error message.
- Unsupported provider: `Error("Unsupported provider: xyz")`
- No key for Claude/Gemini: `Error("No API key for Claude. Set ANTHROPIC_API_KEY or OPENROUTER_API_KEY.")`

## Environment Variables

| Variable              | Required | Description                          |
|-----------------------|----------|--------------------------------------|
| `OPENAI_API_KEY`      | No*      | OpenAI API key                       |
| `OPENAI_BASE_URL`     | No       | Custom OpenAI-compatible endpoint    |
| `DEEPSEEK_API_KEY`    | No*      | DeepSeek API key                     |
| `DEEPSEEK_BASE_URL`   | No       | Custom DeepSeek endpoint             |
| `OPENROUTER_API_KEY`  | No*      | OpenRouter key (Claude/Gemini fallback)|
| `ANTHROPIC_API_KEY`   | No*      | Direct Anthropic API key             |
| `GEMINI_API_KEY`      | No*      | Direct Google Gemini API key         |
| `GL_GOOGLE_API_KEY`   | No*      | Alternative Google API key env name  |
| `CEREBRAS_API_KEY`    | No*      | Cerebras API key (fast inference)    |

*At least one provider key must be set for AI features to work.

## Adding a New Provider

1. Add the API key to `backend/src/env.ts` (Zod schema).
2. Add a new `if (provider === "yourprovider")` block in `ai.ts`.
3. Follow the existing pattern: validate key, make fetch call, normalize response to `{ provider, model, request_id, content }`.
4. Update the environment variables documentation.
