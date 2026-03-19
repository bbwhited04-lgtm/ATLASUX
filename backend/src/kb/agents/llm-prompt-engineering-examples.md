# Proper Prompt Engineering with Examples

## Overview

This article provides a comprehensive library of real, copy-paste-ready prompt examples organized by use case. Each example includes the complete prompt, an explanation of why it works, suggested model parameters, and common variations. These prompts are designed for production systems and follow the best practices established in prompt engineering research.

All examples use the multi-message conversation format (system/user/assistant) compatible with OpenAI, Anthropic, Google, and most open-source model APIs.

![Illustration of input-output prompt engineering workflow](https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Artificial_neural_network.svg/800px-Artificial_neural_network.svg.png)

---

## 1. Classification Prompts

### 1.1 Sentiment Classification

```
System: You are a sentiment analysis engine. Classify text into exactly
one category. Respond with only the JSON object, no additional text.

User: Classify the sentiment of the following customer review.

Categories: positive, negative, neutral, mixed

Review: """
The build quality is excellent and it arrived on time. However, the
instructions were confusing and the customer support line had a 45-minute
wait time. Overall I'd buy again but they need to improve support.
"""

Respond with:
{"sentiment": "<category>", "confidence": <0.0-1.0>, "reasoning": "<one sentence>"}
```

**Expected output:**
```json
{"sentiment": "mixed", "confidence": 0.9, "reasoning": "Positive product quality and delivery offset by negative support experience"}
```

**Why it works:**
- Explicit category list eliminates ambiguity
- JSON schema constrains the output format
- Confidence score enables downstream thresholding
- Reasoning field provides interpretability for debugging
- Triple-quote delimiters separate data from instructions

**Recommended settings:** Temperature 0.0, top_p 1.0. Classification is deterministic — you want the same answer every time.

### 1.2 Intent Classification (Multi-Label)

```
System: You are an intent classifier for a customer service chatbot.
A message may have multiple intents. Return all that apply.

User: Classify the intents in this customer message.

Available intents:
- order_status: asking about an order's current status
- return_request: wanting to return or exchange a product
- billing_question: questions about charges, invoices, payments
- product_question: questions about product features or availability
- complaint: expressing dissatisfaction
- compliment: expressing satisfaction
- account_change: wanting to update account information

Message: "I want to return order #12345 and also update my email address.
By the way, the jacket from my last order was amazing."

Respond with:
{"intents": ["<intent1>", "<intent2>", ...], "primary_intent": "<most important intent>"}
```

**Why it works:** Multi-label classification is specified explicitly. The `primary_intent` field helps routing logic prioritize.

**Recommended settings:** Temperature 0.0.

### 1.3 Category Classification with Rejection

```
System: You classify support tickets into engineering teams. If a ticket
does not clearly fit any team, classify it as "unroutable" rather than
guessing. Accuracy matters more than coverage.

User: Teams and their responsibilities:
- platform: infrastructure, deployment, CI/CD, monitoring
- backend: APIs, databases, server logic, authentication
- frontend: UI components, styling, browser compatibility
- ml: model training, inference, data pipelines, embeddings
- security: vulnerabilities, access control, compliance

Ticket: "The login page loads but clicking 'Sign In' does nothing.
Console shows a CORS error from the auth endpoint."

{"team": "<team>", "confidence": "<high|medium|low>", "reason": "<explanation>"}
```

**Why it works:** The "unroutable" escape hatch prevents forced misclassification, which is critical in production routing systems.

![Classification pipeline showing input text flowing through prompt to categorized output](https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Colored_neural_network.svg/800px-Colored_neural_network.svg.png)

---

## 2. Extraction Prompts

### 2.1 Named Entity Extraction

```
System: You are a precise entity extraction system. Extract only entities
that are explicitly stated in the text. Never infer or guess entities that
are not directly mentioned.

User: Extract all named entities from the following news article paragraph.

Entity types to extract:
- PERSON: full names of people
- ORG: company or organization names
- LOCATION: cities, countries, addresses
- DATE: specific dates or date ranges
- MONEY: monetary amounts with currency

Text: """
On March 15, 2026, Anthropic CEO Dario Amodei announced a $500 million
partnership with Amazon Web Services to expand Claude's infrastructure
in the European Union. The deal was brokered at their San Francisco
headquarters.
"""

Respond with JSON:
{
  "entities": [
    {"text": "<exact text>", "type": "<entity type>", "start_char": <int>}
  ]
}
```

**Why it works:**
- "Extract only entities that are explicitly stated" prevents hallucination
- Character offset enables highlighting in a UI
- Exact entity type taxonomy matches standard NER conventions

**Recommended settings:** Temperature 0.0.

### 2.2 Structured Data Extraction from Unstructured Text

```
System: Extract structured data from business emails. If a field is not
mentioned in the email, set it to null. Never fabricate information.

User: Extract the following fields from this vendor email:

Fields:
- vendor_name: string
- invoice_number: string | null
- amount_due: number | null
- currency: string (ISO 4217, default "USD")
- due_date: string (ISO 8601) | null
- line_items: array of {description: string, quantity: number, unit_price: number}
- payment_terms: string | null

Email: """
Hi Team,

Please find attached invoice INV-2026-0892 for the Q1 consulting
engagement. The total is EUR 24,750.00 and payment is due net 30
from the invoice date of March 1, 2026.

Line items:
- Strategy workshop (2 days) @ EUR 3,500/day = EUR 7,000
- Technical assessment (3 days) @ EUR 4,250/day = EUR 12,750
- Final report and recommendations = EUR 5,000

Best regards,
Sarah Chen
Vertex Consulting GmbH
"""
```

**Why it works:** The explicit field schema with types and null defaults prevents the model from guessing. ISO format specifications ensure parseable output.

### 2.3 Log Parsing and Extraction

```
System: You parse application log lines into structured events. Handle
all common log formats (syslog, JSON, Apache, nginx, custom). If you
cannot parse a line, return it with type "unparseable".

User: Parse these log lines into structured JSON events:

```
2026-03-15T14:23:45.123Z ERROR [auth-service] Failed login attempt
  for user=admin@example.com from ip=192.168.1.100 reason="invalid_password"
  attempts=3
2026-03-15T14:23:46.001Z WARN [rate-limiter] Rate limit approaching
  for tenant=t_abc123 endpoint=/v1/chat current=95/100
2026-03-15T14:23:47.892Z INFO [engine] Job j_xyz789 completed in
  2340ms status=success output_tokens=1523
```

For each line, extract:
{"timestamp", "level", "service", "event_type", "details": {<key-value pairs>}}
```

**Recommended settings:** Temperature 0.0. Log parsing is purely deterministic.

---

## 3. Summarization Prompts

### 3.1 Executive Summary (Different Audiences)

```
System: You create concise executive summaries tailored to specific
audiences. Adjust technical depth, terminology, and focus areas based
on the target audience.

User: Summarize the following technical post-mortem for a non-technical
executive audience. Focus on business impact, customer impact, and
resolution status. Avoid technical jargon.

Maximum length: 150 words.

Post-mortem: """
Root cause: A race condition in the connection pool manager caused
database connections to leak when concurrent requests exceeded the
pool's max_connections (50) threshold. The leak accumulated over
approximately 6 hours until all available connections were exhausted,
causing all API requests to timeout with 504 errors.

Timeline:
- 02:00 UTC: Deploy v2.14.3 with new pooling configuration
- 08:15 UTC: First alerts for elevated p99 latency (>2s)
- 10:30 UTC: Connection pool exhausted, complete API outage
- 10:45 UTC: On-call engineer identified the issue
- 11:00 UTC: Rolled back to v2.14.2, service restored
- 11:15 UTC: All systems nominal

Impact: 45 minutes of complete downtime affecting ~12,000 active users.
Estimated revenue impact: $18,500 in failed transactions.
"""
```

**Why it works:** Specifying the audience and word limit forces the model to make appropriate content decisions rather than just truncating.

### 3.2 Progressive Summarization (Multiple Lengths)

```
User: Provide three summaries of the following article at different
levels of detail:

1. **Tweet** (max 280 characters): The core takeaway in one sentence
2. **Abstract** (max 100 words): Key findings and implications
3. **Brief** (max 300 words): Comprehensive summary with supporting details

Article: """
[article text here]
"""

Format each summary with its heading and word/character count in parentheses.
```

**Why it works:** Progressive summarization forces the model to identify the information hierarchy — what matters most when space is extremely constrained.

---

## 4. Code Generation Prompts

### 4.1 Function Generation with Constraints

```
System: You are a senior TypeScript developer. Write production-quality
code with proper types, error handling, and edge case coverage. Follow
these rules:
- Use explicit return types (never rely on inference for exported functions)
- Handle all error cases (don't just throw generic errors)
- Add JSDoc comments for public functions
- Prefer const over let, never use var
- Use early returns to reduce nesting

User: Write a function that validates and parses a cron expression string.

Requirements:
- Accept standard 5-field cron expressions (minute hour day month weekday)
- Support: exact values, ranges (1-5), steps (*/5), lists (1,3,5), and wildcards (*)
- Return a typed object with parsed fields or a descriptive error
- Include a function that generates the next N occurrence timestamps from a given start date
- Do not use any external libraries

Types to define:
- CronExpression (parsed representation)
- CronParseResult (success | error discriminated union)
- A function signature for getNextOccurrences(cron: CronExpression, from: Date, count: number): Date[]
```

**Why it works:**
- Explicit constraints prevent shortcuts (no external libraries)
- Discriminated union requirement enforces proper error handling
- The specification is precise enough to validate the output

**Recommended settings:** Temperature 0.2-0.3 for code generation. Slight randomness helps with creative solutions but keeps output focused.

### 4.2 Code Generation with Test Cases

```
User: Write a TypeScript function and its tests.

Function: `mergeDeepPartial<T>(target: T, ...sources: DeepPartial<T>[]): T`

Behavior:
- Deep merges multiple partial objects into a target
- Arrays are replaced, not merged (last source wins)
- undefined values in sources are skipped (don't overwrite)
- null values in sources DO overwrite (explicit null is intentional)
- Handles nested objects to arbitrary depth
- Returns a new object (does not mutate target)

Write the implementation, then write at least 8 test cases using
the following template:

```typescript
// Test: <description>
assert.deepEqual(
  mergeDeepPartial(target, source),
  expected
);
```

Include tests for:
- Basic flat merge
- Deep nested merge
- Array replacement
- undefined vs null handling
- Multiple sources (3+)
- Empty objects
- Prototype pollution prevention (source with __proto__)
- Type preservation (Date objects, etc.)
```

**Why it works:** Specifying test cases alongside implementation ensures the model considers edge cases during generation.

![Code generation workflow showing prompt decomposition into implementation and tests](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Neural_network_example.svg/600px-Neural_network_example.svg.png)

---

## 5. Analysis Prompts

### 5.1 Comparative Analysis

```
System: You are a technical analyst. When comparing options, use a
structured framework with consistent criteria. Always include
trade-offs — no option is universally best.

User: Compare these three state management approaches for a React 18
application with 50+ components, multi-tenant data, and real-time updates:

1. Zustand
2. Redux Toolkit (RTK)
3. React Context + useReducer

Evaluate on these criteria (rate each 1-5):
- Learning curve
- Boilerplate required
- TypeScript support
- DevTools quality
- Performance at scale (1000+ state updates/sec)
- Bundle size impact
- Server state integration (with React Query/SWR)
- Testing ease

Format as a comparison table, then provide a recommendation with
reasoning for our specific use case (multi-tenant, real-time).
```

### 5.2 Root Cause Analysis

```
System: You are a senior SRE performing root cause analysis. Follow the
"5 Whys" methodology. Distinguish between symptoms, contributing factors,
and root causes. Consider both technical and organizational factors.

User: Analyze this production incident:

Symptoms:
- API response times jumped from 200ms p50 to 15s p50
- Database CPU hit 100%
- 40% of requests returned 504 Gateway Timeout
- Started at 14:00 UTC, lasted 2 hours

Recent changes (last 48h):
- New search endpoint deployed (14:00 UTC)
- Database minor version upgrade (12:00 UTC, 2 days ago)
- No traffic spike (steady 500 req/s)

Relevant configuration:
- PostgreSQL 16 with 4 vCPU, 16GB RAM
- Connection pool: max 50 connections
- No query timeout configured
- New search endpoint uses: SELECT * FROM products WHERE
  description ILIKE '%' || $1 || '%' ORDER BY created_at DESC

Perform a structured root cause analysis:
1. Timeline reconstruction
2. 5 Whys analysis
3. Contributing factors
4. Root cause identification
5. Immediate mitigation steps
6. Long-term prevention measures
```

**Why it works:** Providing the methodology (5 Whys) and the output structure ensures a thorough analysis rather than a superficial diagnosis.

---

## 6. Creative Writing Prompts (with Constraints)

### 6.1 Marketing Copy with Brand Voice

```
System: You write marketing copy for B2B SaaS products targeting
small business owners. Your tone is:
- Conversational but professional (not corporate-speak)
- Confident without being pushy
- Problem-focused (lead with the pain, then the solution)
- Concrete (use numbers, not vague claims)

Never use: "revolutionize", "cutting-edge", "game-changer", "leverage",
"synergy", or "unlock". These are banned words.

User: Write a landing page hero section for Lucy, an AI receptionist
for trade businesses (plumbers, HVAC, electricians).

Key facts:
- Answers calls 24/7, never misses a call
- Books appointments via Outlook/Google Calendar
- Sends SMS confirmations to customers
- $99/month flat rate
- Average trade business misses 40% of calls
- Each missed call = $200-500 in lost revenue

Deliverables:
1. Headline (max 10 words)
2. Subheadline (max 25 words)
3. Three bullet points (each max 15 words)
4. CTA button text (max 5 words)
5. Social proof line (max 20 words)

Write 3 variations with different emotional angles:
A) Fear of loss (missed revenue)
B) Relief/freedom (no more phone anxiety)
C) Professional credibility (impress customers)
```

**Why it works:** Banned words list prevents cliches. Multiple variations give the team options. Word limits force conciseness.

**Recommended settings:** Temperature 0.7-0.9 for creative copy. Higher temperature produces more diverse variations.

---

## 7. Data Transformation Prompts

### 7.1 CSV to JSON Transformation

```
System: You are a data transformation engine. Convert between data
formats precisely. Preserve all data values exactly. Handle edge cases
(commas in quoted fields, null values, special characters).

User: Convert this CSV data to a JSON array. Apply these transformations:
- Convert "price" to a number (remove $ and commas)
- Convert "in_stock" to a boolean
- Convert "last_updated" to ISO 8601 format
- If "category" is empty, set to "uncategorized"
- Trim whitespace from all string values

CSV:
name,price,in_stock,category,last_updated
"Widget, Large",$1,299.99,yes,Electronics,03/15/2026
Small Gadget,$49.50,no,,03/14/2026
"Pro Kit ""Deluxe""",$299.00,yes,Bundles,03/13/2026

Output valid JSON only.
```

**Why it works:** Explicit transformation rules prevent ambiguity. Edge cases (commas in quoted fields, escaped quotes, empty values) are present in the data, testing the model's parsing accuracy.

### 7.2 Log to Structured Events

```
User: Transform these mixed-format application logs into a unified
JSON event stream. Normalize all timestamps to UTC ISO 8601.

Input logs:
Mar 15 14:23:45 web-01 nginx: 192.168.1.50 - - [15/Mar/2026:14:23:45 -0500] "GET /api/health HTTP/1.1" 200 15 "-" "curl/7.88"
{"time":"2026-03-15T19:23:46Z","level":"info","msg":"health check passed","service":"api","latency_ms":3}
2026-03-15 19:23:47,123 WARNING django.security.csrf Forbidden (CSRF token missing): /admin/login/

Output schema per event:
{
  "timestamp": "ISO 8601 UTC",
  "source": "nginx|api|django",
  "level": "info|warn|error",
  "message": "normalized description",
  "metadata": {<source-specific fields>}
}
```

**Recommended settings:** Temperature 0.0. Data transformation must be deterministic.

---

## 8. Multi-Step Reasoning Prompts

### 8.1 Mathematical Reasoning

```
User: Solve this step by step. Show all work.

A SaaS company has 1,200 customers. Their monthly churn rate is 3.5%.
They acquire 80 new customers per month at a CAC of $150 each.
Their average revenue per user (ARPU) is $89/month.

Calculate:
1. Net customer change per month
2. Monthly revenue
3. Monthly acquisition cost
4. Customer lifetime value (LTV) using LTV = ARPU / churn_rate
5. LTV:CAC ratio
6. Months until the customer base stops growing (if ever)
7. The steady-state customer count (where acquisitions = churn)

Show the formula, substitution, and result for each step.
Final answer: Are they in a healthy position? What's the one metric
they should focus on improving?
```

**Why it works:** Explicit "show all work" instruction triggers chain-of-thought reasoning. Numbered steps ensure nothing is skipped.

### 8.2 Logic and Planning

```
System: You are a systems architect planning a database migration.
Think through each step carefully, considering dependencies and risks.

User: Plan the migration of a production PostgreSQL 14 database to
PostgreSQL 16. The database has:
- 500GB of data across 120 tables
- 3 read replicas
- Continuous WAL archiving to S3
- Maximum acceptable downtime: 15 minutes
- The application uses Prisma ORM
- Current connections: ~200 concurrent

Requirements:
1. Create a step-by-step migration plan
2. For each step, identify: duration estimate, risk level, rollback procedure
3. Identify the critical path (steps that cannot be parallelized)
4. Calculate total estimated downtime
5. List pre-migration validation checks
6. List post-migration validation checks

Think through this carefully before responding. Consider what could
go wrong at each step.
```

---

## 9. Anti-Patterns: What NOT to Do

### Anti-Pattern 1: Vague Instructions

**Bad:**
```
Summarize this article.
```

**Fixed:**
```
Summarize this article in 3-5 bullet points for a technical audience.
Focus on the key findings and their implications for production systems.
Maximum 150 words.
```

**Problem:** Without constraints on length, audience, format, or focus, the model guesses — and often guesses wrong.

### Anti-Pattern 2: Contradictory Instructions

**Bad:**
```
Be concise and thorough. Give a brief overview but cover all details.
Keep it short but don't leave anything out.
```

**Fixed:**
```
Provide a two-level summary:
1. Executive overview (3 sentences max)
2. Detailed findings (one paragraph per finding, max 5 findings)
```

**Problem:** Contradictory instructions cause inconsistent outputs. Resolve contradictions by using structured sections at different detail levels.

### Anti-Pattern 3: Implicit Format Expectations

**Bad:**
```
List the pros and cons of microservices.
```

**Fixed:**
```
Compare microservices vs monolith architecture.

Format as a table:
| Criterion | Microservices | Monolith |
|-----------|--------------|----------|
(Include at least 8 criteria: deployment, scaling, complexity,
testing, debugging, team structure, latency, data consistency)
```

**Problem:** "List pros and cons" can produce bullet points, paragraphs, or a disorganized brain dump. Specify the exact format.

### Anti-Pattern 4: Missing Edge Case Handling

**Bad:**
```
Parse the user's name from this text.
```

**Fixed:**
```
Parse the user's name from this text. Handle these cases:
- Full name (first + last): return both
- Single name only: return as first_name, last_name = null
- No name found: return {"first_name": null, "last_name": null}
- Multiple names mentioned: return the primary/first mentioned name
- Name with title (Dr., Mr., etc.): strip the title
```

**Problem:** Without edge case specification, the model handles edge cases inconsistently across inputs.

### Anti-Pattern 5: Chain-of-Thought Suppression

**Bad:**
```
What's the answer to this math problem? Reply with just the number.
```

**Fixed:**
```
Solve this math problem step by step, then provide the final answer
on the last line in the format: ANSWER: <number>
```

**Problem:** Forcing terse answers on reasoning tasks eliminates the "working memory" that chain-of-thought provides, dramatically reducing accuracy.

![Side-by-side comparison of bad prompts vs improved prompts](https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Neural_network_representation.svg/600px-Neural_network_representation.svg.png)

---

## 10. Temperature and Sampling Settings Guide

| Use Case | Temperature | Top-p | Reasoning |
|----------|-------------|-------|-----------|
| Classification | 0.0 | 1.0 | Deterministic — same input should always produce same output |
| Data extraction | 0.0 | 1.0 | Precision is paramount, creativity is harmful |
| Code generation | 0.1-0.3 | 0.95 | Mostly deterministic with slight creativity for novel solutions |
| Summarization | 0.1-0.3 | 0.95 | Faithful to source, minor phrasing variation acceptable |
| Analysis/reasoning | 0.2-0.4 | 0.95 | Balance between consistency and exploring different angles |
| Creative writing | 0.7-0.9 | 0.95 | High variation desired for generating options |
| Brainstorming | 0.9-1.2 | 0.98 | Maximum diversity of ideas |
| Self-consistency voting | 0.5-0.8 | 0.95 | Moderate variation so samples explore different paths |

### Key Principles

- **Temperature 0.0** is not truly deterministic on all providers (GPU floating-point non-determinism), but it is as close as you can get
- **Top-p (nucleus sampling)** truncates the probability distribution — 0.95 means only tokens in the top 95% cumulative probability are considered
- **Never set both temperature AND top-p to extreme values** (e.g., temp 1.5 + top-p 1.0 produces incoherent output)
- **For production systems:** start at temperature 0.0 and increase only if output quality improves with variation

---

## 11. Token Budget Estimation

### Rough Heuristics

- English text: ~0.75 tokens per word (or ~4 characters per token)
- Code: ~0.5 tokens per word (more symbols = more tokens)
- JSON: ~1.2x the token count of equivalent plain text (brackets, quotes, colons)
- XML: ~1.5x (more verbose tags)

### Budget Calculation Template

```
Input budget:
  System prompt:     ~500 tokens
  Few-shot examples: ~200 tokens per example × 3 = 600
  User input data:   ~1000 tokens (estimate from average input size)
  Total input:       ~2,100 tokens

Output budget:
  Desired response:  ~800 tokens
  Safety margin:     +20% = 960 tokens

Total per request:   ~3,060 tokens
Model context limit: 128K tokens (well within limit)
Cost estimate:       $0.009/request at $3/M input + $15/M output tokens
```

### Controlling Output Length

- **max_tokens parameter:** Hard cap on output length (model stops generating)
- **Prompt instruction:** "Respond in 3-5 sentences" (soft cap, model may overshoot)
- **Combined approach:** Instruct for desired length AND set max_tokens as a safety net
- **Token counting libraries:** `tiktoken` (OpenAI), `anthropic-tokenizer`, `@anthropic-ai/tokenizer`

---

## 12. Prompt Templates for Production

### Template Pattern

Production systems should use parameterized prompt templates, not hardcoded strings:

```typescript
function buildExtractionPrompt(schema: Record<string, string>, inputText: string): string {
  const fieldList = Object.entries(schema)
    .map(([key, type]) => `- ${key}: ${type}`)
    .join('\n');

  return `Extract the following fields from the text below.
If a field is not mentioned, set it to null.
Respond with valid JSON only.

Fields:
${fieldList}

Text: """
${inputText}
"""`;
}
```

### Versioning Pattern

```typescript
const PROMPTS = {
  'sentiment-v1': { template: '...', model: 'claude-sonnet-4-20250514', temperature: 0.0 },
  'sentiment-v2': { template: '...', model: 'claude-sonnet-4-20250514', temperature: 0.0 },
  'extraction-v3': { template: '...', model: 'gpt-4o', temperature: 0.0 },
};
```

This enables A/B testing, rollback, and audit trails for prompt changes.

---

## Videos

1. [Advanced Prompt Engineering Techniques — Andrej Karpathy (YouTube)](https://www.youtube.com/watch?v=SjhIlw3Iffs)
2. [Building Production LLM Applications — LangChain (YouTube)](https://www.youtube.com/watch?v=jkrNMKz9pWU)

---

## References

[1] Brown, T., Mann, B., Ryder, N., et al. (2020). "Language Models are Few-Shot Learners." *NeurIPS 2020*. https://arxiv.org/abs/2005.14165

[2] Wei, J., Wang, X., Schuurmans, D., et al. (2022). "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models." *NeurIPS 2022*. https://arxiv.org/abs/2201.11903

[3] Anthropic (2024). "Prompt Engineering Guide." *Anthropic Documentation*. https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering

[4] OpenAI (2024). "Prompt Engineering Best Practices." *OpenAI Documentation*. https://platform.openai.com/docs/guides/prompt-engineering

[5] Khattab, O., Santhanam, K., et al. (2023). "DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines." https://arxiv.org/abs/2310.03714
