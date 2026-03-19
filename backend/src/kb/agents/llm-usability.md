# LLM Usability: Building Great User Experiences with Language Models

## Overview

The difference between an LLM demo and a production application is usability. Raw model capabilities mean nothing if users cannot interact with them effectively. This article covers the full usability stack — from API design patterns and streaming architecture to error handling, prompt management, structured output, and evaluation metrics.

Great LLM usability means the user forgets they are talking to a model. The response arrives fast, the format is predictable, errors are handled gracefully, and the system adapts to what the user actually needs.

---

## API Design Patterns for LLM Integration

### The Completion Endpoint Pattern

The simplest integration pattern: a single endpoint that accepts a prompt and returns a completion. This is what OpenAI's `/v1/chat/completions` established as the industry standard.

```typescript
// Standard chat completion request
const response = await fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Explain DNS in one paragraph.' },
    ],
    temperature: 0.7,
    max_tokens: 500,
  }),
});
```

**Design considerations:**

- **Stateless by default:** Each request carries the full conversation history. The server does not maintain session state.
- **Model as parameter:** Let callers select the model. This enables A/B testing, cost optimization, and graceful degradation.
- **Temperature and sampling:** Expose these as parameters but provide sensible defaults.
- **Idempotency:** Include a client-generated `request_id` for retry safety.

### The Router Pattern

Route requests to different models based on task complexity, cost sensitivity, or latency requirements.

```typescript
function selectModel(task: string, urgency: string): string {
  if (task === 'classification' || task === 'extraction') {
    return 'gpt-4o-mini'; // Fast, cheap, good enough
  }
  if (task === 'code-generation' || task === 'reasoning') {
    return 'claude-sonnet-4-20250514'; // Best for complex tasks
  }
  if (urgency === 'batch') {
    return 'deepseek-chat'; // Cheapest for background processing
  }
  return 'gpt-4o'; // Default
}
```

### The Agent Pattern

For multi-step tasks, the API orchestrates multiple LLM calls with tool use between them.

```typescript
// Agent loop: plan → act → observe → repeat
async function agentLoop(userQuery: string) {
  const messages = [{ role: 'user', content: userQuery }];

  while (true) {
    const response = await llm.chat(messages, { tools: availableTools });

    if (response.finish_reason === 'stop') {
      return response.content; // Final answer
    }

    if (response.finish_reason === 'tool_calls') {
      for (const call of response.tool_calls) {
        const result = await executeTool(call.function.name, call.function.arguments);
        messages.push({ role: 'tool', content: result, tool_call_id: call.id });
      }
    }
  }
}
```

### The Middleware Pattern

Wrap LLM calls with middleware for logging, caching, rate limiting, content filtering, and cost tracking.

```typescript
const pipeline = compose(
  rateLimiter({ requestsPerMinute: 60 }),
  cacheLayer({ ttl: 3600, similarity: 0.95 }),
  contentFilter({ blockPII: true, blockHarmful: true }),
  costTracker({ budgetPerDay: 50 }),
  retryHandler({ maxRetries: 3, backoff: 'exponential' }),
  llmCall,
);
```

![API gateway pattern showing middleware layers between client and LLM provider](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/System_design_-_Teknopedia_English.svg/800px-System_design_-_Teknopedia_English.svg.png)

---

## Streaming vs Non-Streaming Responses

### Why Streaming Matters

For a 500-token response at 50 tokens/second, non-streaming takes 10 seconds before the user sees anything. With streaming, the first token appears in 200–500ms, and the user reads along as text generates. This dramatically improves perceived performance.

### Server-Sent Events (SSE) Implementation

The industry standard for LLM streaming is Server-Sent Events over HTTP.

```typescript
// Server-side streaming (Fastify)
app.post('/v1/chat/stream', async (request, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: request.body.messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      reply.raw.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  reply.raw.write('data: [DONE]\n\n');
  reply.raw.end();
});
```

```typescript
// Client-side consumption
const response = await fetch('/v1/chat/stream', { method: 'POST', body });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split('\n').filter(l => l.startsWith('data: '));

  for (const line of lines) {
    const data = line.slice(6);
    if (data === '[DONE]') return;
    const { content } = JSON.parse(data);
    appendToUI(content);
  }
}
```

### When NOT to Stream

- **Structured output (JSON):** Streaming partial JSON is painful to parse. Use non-streaming for JSON mode.
- **Tool calls:** Wait for the complete tool call specification before executing.
- **Batch processing:** No user waiting — throughput matters more than TTFT.
- **Short responses:** For responses under 50 tokens, streaming overhead is not worth it.

![Diagram showing streaming vs non-streaming response timing and user perception](https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Server-sent_Events_%28SSE%29.svg/800px-Server-sent_Events_%28SSE%29.svg.png)

---

## Error Handling

### Rate Limits

Every LLM provider rate-limits by tokens per minute (TPM) and requests per minute (RPM).

```typescript
async function llmCallWithRetry(params: LLMParams, maxRetries = 3): Promise<LLMResponse> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await llm.chat(params);
    } catch (err) {
      if (err.status === 429) {
        const retryAfter = parseInt(err.headers?.['retry-after'] || '5');
        const backoff = retryAfter * 1000 * Math.pow(2, attempt);
        await sleep(backoff + Math.random() * 1000); // Jitter
        continue;
      }
      throw err; // Non-retryable error
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Best practices:**

- Parse the `retry-after` header when available
- Use exponential backoff with jitter to avoid thundering herd
- Track rate limit headroom from response headers (`x-ratelimit-remaining-tokens`)
- Implement token counting client-side to predict rate limit hits before they happen

### Timeout Handling

LLM requests can take 5–120+ seconds depending on model size, prompt length, and load.

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    // ... other options
  });
} catch (err) {
  if (err.name === 'AbortError') {
    // Show user: "Response is taking longer than expected. Retrying with a faster model..."
    return fallbackToFasterModel(params);
  }
}
```

### Context Window Overflow

When the input exceeds the model's context window, the API returns an error. Handle this proactively.

```typescript
function ensureFitsContext(messages: Message[], maxTokens: number): Message[] {
  let totalTokens = countTokens(messages);

  if (totalTokens <= maxTokens) return messages;

  // Strategy 1: Truncate old messages (keep system + last N turns)
  const system = messages.filter(m => m.role === 'system');
  const conversation = messages.filter(m => m.role !== 'system');

  while (totalTokens > maxTokens && conversation.length > 2) {
    conversation.shift(); // Remove oldest message
    totalTokens = countTokens([...system, ...conversation]);
  }

  // Strategy 2: Summarize old context
  if (totalTokens > maxTokens) {
    const summary = await summarizeConversation(conversation.slice(0, -2));
    return [...system, { role: 'system', content: `Previous context: ${summary}` }, ...conversation.slice(-2)];
  }

  return [...system, ...conversation];
}
```

### Malformed Responses

LLMs sometimes return broken JSON, incomplete sentences, or off-topic responses. Always validate.

```typescript
function parseStructuredResponse<T>(raw: string, schema: ZodSchema<T>): T {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    return schema.parse(parsed);
  } catch {}

  // Try extracting JSON from markdown code block
  const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return schema.parse(parsed);
    } catch {}
  }

  // Try extracting JSON from anywhere in the response
  const braceMatch = raw.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      return schema.parse(parsed);
    } catch {}
  }

  throw new Error('Failed to extract valid structured response');
}
```

---

## Prompt Management

### The Problem

Prompts are code. They need versioning, testing, and deployment just like application code. Yet most teams hardcode prompts as string literals scattered across their codebase.

### Prompt Template System

```typescript
// prompts/booking-confirmation.yaml
// version: 2.3
// model: gpt-4o
// temperature: 0.3
// max_tokens: 200
// tested_date: 2024-11-15

const BOOKING_CONFIRMATION = `
You are {{agent_name}}, an AI receptionist for {{business_name}}.

A customer just booked an appointment:
- Service: {{service_type}}
- Date: {{date}}
- Time: {{time}}
- Customer: {{customer_name}}

Generate a warm, professional SMS confirmation message.
Keep it under 160 characters.
Include the business name, service, date, and time.
Do NOT include pricing.
`;

function renderPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Missing template variable: ${key}`);
    return vars[key];
  });
}
```

### Prompt Versioning Best Practices

1. **Store prompts in version control** — not in a database, not in a CMS. Git gives you diff, blame, and rollback.
2. **Test prompts against eval suites** — every prompt change should run through automated evaluations before deployment.
3. **Pin prompts to model versions** — a prompt validated on `gpt-4o-2024-08-06` may not work on the next version.
4. **Separate prompt logic from application logic** — prompts should be data, not interleaved with business logic.
5. **Track prompt performance metrics** — log which prompt version generated each response, so you can correlate quality changes with prompt changes.

---

## User Experience Patterns

### Typing Indicators

Show a thinking/typing indicator immediately when the user sends a message. Do not wait for the first token.

```typescript
// React component pattern
function ChatMessage({ onSend }) {
  const [isThinking, setIsThinking] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  async function handleSend(message: string) {
    setIsThinking(true);
    setStreamedText('');

    const stream = await sendMessage(message);

    for await (const chunk of stream) {
      setIsThinking(false); // Hide thinking indicator on first token
      setStreamedText(prev => prev + chunk);
    }
  }

  return (
    <div>
      {isThinking && <ThinkingDots />}
      {streamedText && <MessageBubble text={streamedText} />}
    </div>
  );
}
```

### Progressive Disclosure

For complex AI outputs (analysis, reports, multi-step results), reveal information progressively.

```
Step 1: Show a brief summary (1–2 sentences)
Step 2: Expandable sections for detailed analysis
Step 3: "Show reasoning" toggle for chain-of-thought
Step 4: Source citations as collapsible references
```

### Confidence Communication

Help users understand when the AI is confident vs uncertain.

- Use hedging language in prompts: "Based on the available information..."
- Show source citations when using RAG
- Offer "I'm not sure about this — would you like me to search for more information?"
- Never present uncertain information as fact

### Latency Perception Tricks

- **Instant acknowledgment:** "Let me look into that..." appears immediately
- **Progressive loading:** Show the response building token-by-token (streaming)
- **Predictive UI:** Pre-render likely UI states while waiting for the response
- **Background prefetch:** If you can predict the next question, start generating the answer early
- **Skeleton screens:** Show the shape of the response before content arrives

![User interface showing progressive loading states during LLM response generation](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/User_experience_-_Teknopedia.svg/800px-User_experience_-_Teknopedia.svg.png)

---

## Accessibility Considerations

### Screen Readers

- Streaming text confuses screen readers. Buffer streamed text into complete sentences before updating the DOM.
- Use ARIA live regions (`aria-live="polite"`) for new messages, not `aria-live="assertive"` which interrupts.
- Provide a "read full response" button that reads the complete message at once.

### Keyboard Navigation

- All interactive elements (send button, copy button, regenerate) must be keyboard-accessible
- Maintain focus management — after sending a message, focus should move to the response area
- Support Ctrl+Enter for send (not just Enter, which conflicts with multiline input)

### Cognitive Accessibility

- Offer adjustable response complexity: "Explain like I'm a beginner" vs "Technical detail"
- Break long responses into sections with clear headings
- Provide a "simplify this" button for complex responses
- Support text-to-speech for generated content

### Visual Accessibility

- Ensure sufficient contrast between user and AI message bubbles
- Do not rely solely on color to distinguish message types
- Support high-contrast and dark modes
- Make text resizable without breaking layout

---

## Structured Output

### JSON Mode

Most modern LLMs support a JSON mode that constrains output to valid JSON.

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: 'Extract the following fields as JSON: name, phone, service_requested, preferred_date',
    },
    {
      role: 'user',
      content: 'Hi, this is Mike Johnson, I need my AC serviced next Tuesday. My number is 555-0142.',
    },
  ],
});

// Output: { "name": "Mike Johnson", "phone": "555-0142", "service_requested": "AC service", "preferred_date": "next Tuesday" }
```

### Function Calling / Tool Use

Function calling lets the model output structured "calls" to predefined functions, which your code then executes.

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'book_appointment',
      description: 'Book an appointment for a customer',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          service: { type: 'string', enum: ['plumbing', 'hvac', 'electrical'] },
          date: { type: 'string', format: 'date' },
          time: { type: 'string', pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$' },
          notes: { type: 'string' },
        },
        required: ['customer_name', 'service', 'date', 'time'],
      },
    },
  },
];
```

### Structured Output with Zod (OpenAI)

OpenAI's structured output mode guarantees the response matches a JSON schema exactly.

```typescript
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const AppointmentSchema = z.object({
  customer: z.object({
    name: z.string(),
    phone: z.string(),
  }),
  service: z.enum(['plumbing', 'hvac', 'electrical', 'general']),
  urgency: z.enum(['emergency', 'standard', 'flexible']),
  preferred_datetime: z.string(),
  notes: z.string().optional(),
});

const response = await openai.beta.chat.completions.parse({
  model: 'gpt-4o',
  response_format: zodResponseFormat(AppointmentSchema, 'appointment'),
  messages: [/* ... */],
});

const appointment = response.choices[0].message.parsed;
// TypeScript knows this is z.infer<typeof AppointmentSchema>
```

![Diagram showing structured output flow from natural language through LLM to validated JSON schema](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/JSON_vector_logo.svg/800px-JSON_vector_logo.svg.png)

---

## Evaluation and Quality Metrics

### Automated Metrics

**BLEU (Bilingual Evaluation Understudy):**

- Measures n-gram overlap between generated and reference text
- Originally designed for machine translation
- Scale: 0–1 (higher is better)
- Limitation: Does not capture semantic equivalence — two valid paraphrases can score near zero

**ROUGE (Recall-Oriented Understudy for Gisting Evaluation):**

- Measures recall of n-grams from reference text in generated text
- ROUGE-1 (unigrams), ROUGE-2 (bigrams), ROUGE-L (longest common subsequence)
- Best for: Summarization evaluation
- Limitation: Same as BLEU — surface-level textual overlap, not semantic meaning

**BERTScore:**

- Uses BERT embeddings to compute semantic similarity
- Captures paraphrases and synonyms that BLEU/ROUGE miss
- Better correlation with human judgment for open-ended generation

**Perplexity:**

- Measures how "surprised" the model is by the text
- Lower is better (the model predicts the text more accurately)
- Useful for comparing model quality, not for evaluating specific outputs

### Human Evaluation

Automated metrics only go so far. For production quality assessment:

**Likert scale ratings:**

- Have evaluators rate responses on a 1–5 scale for relevance, helpfulness, accuracy, and harmlessness
- Requires clear rubrics and evaluator training
- 3+ evaluators per response for inter-rater reliability

**Pairwise comparison (A/B):**

- Show evaluators two responses side-by-side and ask which is better
- More reliable than absolute ratings
- Used by Chatbot Arena (LMSYS) to rank models

**Task-specific evaluation:**

- For classification: precision, recall, F1
- For extraction: exact match, character-level F1
- For code generation: pass@k (percentage of correct solutions in k attempts)
- For summarization: factual consistency, coverage, conciseness

### LLM-as-Judge

Use a strong LLM to evaluate the outputs of another LLM. This scales better than human evaluation while maintaining reasonable quality.

```typescript
const judgePrompt = `
You are evaluating the quality of an AI assistant's response.

User query: {{query}}
AI response: {{response}}
Reference answer: {{reference}}

Rate the response on these criteria (1-5 each):
1. Accuracy: Is the information factually correct?
2. Completeness: Does it fully address the user's question?
3. Clarity: Is it well-written and easy to understand?
4. Relevance: Does it stay on topic?

Output your ratings as JSON: { "accuracy": N, "completeness": N, "clarity": N, "relevance": N, "reasoning": "..." }
`;
```

**Caveats:**

- LLM judges have biases (prefer verbose responses, prefer their own outputs)
- Use multiple judge models and average scores
- Calibrate judge scores against human evaluations periodically
- GPT-4o and Claude Sonnet are the most commonly used judges

### Building an Eval Pipeline

```typescript
// Evaluation pipeline structure
interface EvalCase {
  id: string;
  input: string;
  expectedOutput?: string;  // For deterministic tasks
  criteria: string[];       // For open-ended tasks
  metadata: Record<string, unknown>;
}

interface EvalResult {
  caseId: string;
  modelOutput: string;
  scores: Record<string, number>;
  latencyMs: number;
  tokenCount: { input: number; output: number };
  cost: number;
}

async function runEvalSuite(
  cases: EvalCase[],
  model: string,
  promptVersion: string,
): Promise<EvalResult[]> {
  const results: EvalResult[] = [];

  for (const evalCase of cases) {
    const start = Date.now();
    const output = await llm.chat(model, evalCase.input);
    const latencyMs = Date.now() - start;

    const scores = await judgeResponse(evalCase, output);

    results.push({
      caseId: evalCase.id,
      modelOutput: output,
      scores,
      latencyMs,
      tokenCount: countTokens(evalCase.input, output),
      cost: calculateCost(model, evalCase.input, output),
    });
  }

  return results;
}
```

### Key Quality Indicators for Production

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| Task completion rate | % of requests that produce a useful response | >95% |
| Hallucination rate | % of responses with factual errors | <5% |
| Format compliance | % of responses matching expected structure | >99% |
| User satisfaction (CSAT) | User ratings of response quality | >4.0/5.0 |
| Retry rate | % of responses that users regenerate | <10% |
| Escalation rate | % of conversations handed to a human | <15% |

---

## Video Resources

1. [Building Production-Ready LLM Applications](https://www.youtube.com/watch?v=bMVIBNRXcZY) — Chip Huyen's talk on the full lifecycle of LLM application development, covering evaluation, prompt engineering, structured output, and monitoring patterns.

2. [OpenAI Function Calling and Structured Outputs Deep Dive](https://www.youtube.com/watch?v=pq34V_V5j18) — Practical walkthrough of OpenAI's function calling, tool use, and structured output features with production examples and error handling patterns.

---

## References

[1] OpenAI. "OpenAI API Reference: Chat Completions." OpenAI Platform Documentation, 2024. https://platform.openai.com/docs/api-reference/chat

[2] Zheng, L., et al. "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena." *NeurIPS 2023*. https://arxiv.org/abs/2306.05685

[3] Lin, C.-Y. "ROUGE: A Package for Automatic Evaluation of Summaries." *Text Summarization Branches Out*, ACL 2004. https://aclanthology.org/W04-1013/

[4] Anthropic. "Anthropic API Documentation: Messages and Streaming." Anthropic Docs, 2024. https://docs.anthropic.com/en/api/messages-streaming

[5] Zhang, T., et al. "BERTScore: Evaluating Text Generation with BERT." *ICLR 2020*. https://arxiv.org/abs/1904.09675
