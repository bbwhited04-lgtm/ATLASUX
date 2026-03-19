# AI Stack Monthly Budget Calculator

## Planning Your AI Spend

The biggest mistake teams make with AI budgeting is treating it as a single line item. In reality, a production AI application touches 6-10 different services, each with its own pricing model, scaling curve, and optimization levers. A "simple chatbot" might use LLM inference, embeddings, vector storage, web search, and SMS delivery — each billed differently.

This guide provides a template for calculating total monthly AI costs across all service categories, with example budgets at four spending tiers and Atlas UX's actual stack cost as a real-world reference.

## Budget Categories

### 1. LLM Inference (Chat + Agents)

This is typically the largest cost category. Estimate based on:
- **Requests per day**: How many LLM calls does your application make?
- **Average input tokens**: System prompt + user message + context
- **Average output tokens**: Model response length
- **Model tier**: Which model handles which request type?

**Formula**: `(daily_requests x avg_input_tokens x input_price_per_token) + (daily_requests x avg_output_tokens x output_price_per_token) x 30`

| Usage Level | Model | Monthly Estimate |
|------------|-------|-----------------|
| Light (100 requests/day, GPT-4o-mini) | GPT-4o-mini | $3-8 |
| Medium (500 requests/day, mixed routing) | Mini + Sonnet | $30-80 |
| Heavy (2000 requests/day, mixed routing) | Mini + GPT-4o + Opus | $150-500 |
| Agent-heavy (5000+ requests/day) | Full stack | $300-2000 |

### 2. Image Generation

Estimate based on images generated per month and average resolution:

| Usage Level | Provider | Monthly Estimate |
|------------|---------|-----------------|
| Light (50 images/mo) | DALL-E 3 Standard | $2 |
| Medium (200 images/mo) | Flux Pro (Replicate) | $10 |
| Heavy (1000 images/mo) | Leonardo Artisan plan | $30 |
| Production (5000+ images/mo) | Self-hosted SDXL | $20-50 (GPU) |

### 3. Voice (TTS + STT)

Estimate based on minutes of audio processed per month:

| Usage Level | Components | Monthly Estimate |
|------------|-----------|-----------------|
| Light (100 min TTS, 100 min STT) | OpenAI TTS + Whisper | $3 |
| Medium (500 min each) | ElevenLabs + Whisper | $25-50 |
| Heavy (3000 min conversational) | ElevenLabs Conv AI + Whisper | $200-400 |
| Call center (10,000+ min) | Full voice stack + telephony | $800-2000 |

### 4. Video Generation

Estimate based on clips generated per month:

| Usage Level | Provider | Monthly Estimate |
|------------|---------|-----------------|
| Light (10 clips/mo, 5s each) | Pika Standard | $10 |
| Medium (50 clips/mo) | Kling Pro | $28 |
| Heavy (200 clips/mo) | Runway Unlimited | $76 |
| Production (500+ clips/mo) | Self-hosted Wan | $30-60 (GPU) |

### 5. Embeddings

Typically a one-time cost per document plus occasional re-embedding:

| Corpus Size | Provider | Monthly Estimate |
|------------|---------|-----------------|
| 1,000 documents | OpenAI small | <$1 (one-time) |
| 10,000 documents | OpenAI small | <$1 (one-time) |
| 100,000 documents | OpenAI small | ~$4 (one-time) |
| Ongoing (1000 new docs/mo) | OpenAI small | <$1 |

### 6. Vector Database

Ongoing storage and query costs:

| Scale | Provider | Monthly Estimate |
|------|---------|-----------------|
| Small (< 10K vectors) | Pinecone Serverless | $1-5 |
| Medium (100K vectors) | Pinecone Serverless | $5-20 |
| Large (1M vectors) | Pinecone Pod s1 | $70 |
| Self-hosted | Qdrant / pgvector | $0-10 (infrastructure) |

### 7. Web Search

API costs for real-time information retrieval:

| Usage Level | Provider | Monthly Estimate |
|------------|---------|-----------------|
| Light (500 queries/mo) | Free tiers (multi-provider) | $0 |
| Medium (5,000 queries/mo) | Free tiers + Brave overflow | $10-20 |
| Heavy (20,000 queries/mo) | Tavily Pro | $200 |
| Multi-provider rotation | 5 providers | $0-50 |

### 8. SMS / Phone (Twilio)

For applications with telephony features:

| Component | Cost |
|-----------|------|
| Phone number | $1.15/mo |
| Inbound SMS | $0.0079/message |
| Outbound SMS | $0.0079/message |
| Inbound voice | $0.0085/min |
| Outbound voice | $0.014/min |

| Usage Level | Monthly Estimate |
|------------|-----------------|
| Light (100 SMS, 50 min voice) | $3 |
| Medium (500 SMS, 200 min voice) | $10 |
| Heavy (2000 SMS, 1000 min voice) | $35 |
| Call center (10,000 SMS, 5000 min) | $150 |

### 9. Email (Transactional)

| Provider | Free Tier | Paid Rate |
|----------|-----------|-----------|
| SendGrid | 100/day | $0.001/email |
| Resend | 100/day, 3,000/mo | $0.001/email |
| Mailgun | 100/day | $0.0008/email |
| AWS SES | N/A | $0.0001/email |

Monthly cost for most startups: $0-10.

### 10. Infrastructure (Hosting)

| Component | Typical Cost |
|-----------|-------------|
| Application server (VPS/Lightsail) | $10-40/mo |
| Managed database (PostgreSQL) | $15-50/mo |
| Object storage (S3) | $1-10/mo |
| CDN | $0-20/mo |
| Domain + SSL | $1-2/mo |

## Example Budget Tiers

### Tier 1: Bootstrapper ($50/month)

For solo developers building an MVP or side project.

| Category | Provider Choice | Monthly Cost |
|----------|----------------|-------------|
| LLM | GPT-4o-mini only (200 req/day) | $8 |
| Images | DALL-E 3 (30 images) | $2 |
| Voice | None or minimal Whisper | $0 |
| Video | None | $0 |
| Embeddings | OpenAI small (one-time) | $0 |
| Vector DB | pgvector (existing DB) | $0 |
| Web Search | Free tiers (3 providers) | $0 |
| SMS/Phone | None or Twilio minimal | $2 |
| Email | Free tier (SendGrid) | $0 |
| Infrastructure | Lightsail / DigitalOcean | $25 |
| **Total** | | **~$37** |

Buffer for spikes: $50/month budget.

### Tier 2: Indie Developer ($200/month)

For a shipped product with paying users, moderate traffic.

| Category | Provider Choice | Monthly Cost |
|----------|----------------|-------------|
| LLM | GPT-4o-mini + Sonnet 4 (500 req/day) | $40 |
| Images | Flux Pro (100 images) | $5 |
| Voice | ElevenLabs Starter + Whisper | $8 |
| Video | Pika Standard (20 clips) | $10 |
| Embeddings | OpenAI small (10K docs) | $1 |
| Vector DB | Pinecone Serverless | $5 |
| Web Search | Free tiers + Brave | $5 |
| SMS/Phone | Twilio (300 SMS, 100 min) | $8 |
| Email | Resend (500/mo) | $0 |
| Infrastructure | Lightsail (larger) + managed DB | $45 |
| **Total** | | **~$127** |

Buffer for growth: $200/month budget.

### Tier 3: Small Team ($500/month)

For a team of 2-5 with a growing user base and multiple AI features.

| Category | Provider Choice | Monthly Cost |
|----------|----------------|-------------|
| LLM | Multi-model routing (1500 req/day) | $120 |
| Images | Leonardo Artisan (500 images) | $30 |
| Voice | ElevenLabs Pro + Whisper + Twilio voice | $130 |
| Video | Kling Pro (50 clips) | $28 |
| Embeddings | OpenAI small (50K docs) | $2 |
| Vector DB | Pinecone Serverless | $15 |
| Web Search | Multi-provider rotation | $15 |
| SMS/Phone | Twilio (1000 SMS, 500 min) | $20 |
| Email | SendGrid (5,000/mo) | $5 |
| Infrastructure | Lightsail + managed DB + S3 | $70 |
| **Total** | | **~$435** |

Buffer for variable usage: $500/month budget.

### Tier 4: Growth Stage ($2,000/month)

For a product with significant traction, multiple AI-powered features, and scaling infrastructure.

| Category | Provider Choice | Monthly Cost |
|----------|----------------|-------------|
| LLM | Full multi-provider routing (5000+ req/day) | $450 |
| Images | Self-hosted SDXL + DALL-E 3 overflow | $60 |
| Voice | ElevenLabs Scale + conversational AI | $400 |
| Video | Runway Pro + Kling Premier | $100 |
| Embeddings | OpenAI small (ongoing ingestion) | $5 |
| Vector DB | Pinecone (higher volume) | $40 |
| Web Search | Tavily Pro + fallbacks | $220 |
| SMS/Phone | Twilio (5000 SMS, 3000 min voice) | $80 |
| Email | AWS SES (50,000/mo) | $5 |
| Infrastructure | Multiple instances + managed DB + CDN | $200 |
| **Total** | | **~$1,560** |

Buffer for spikes and new features: $2,000/month budget.

## Atlas UX Stack Cost Reference

Atlas UX provides a real-world reference for what a production AI receptionist platform costs to run. Approximate monthly breakdown:

| Category | Provider(s) | Estimated Monthly Cost |
|----------|------------|----------------------|
| LLM Inference | OpenAI (GPT-4o, GPT-4o-mini), DeepSeek, OpenRouter, Cerebras | $100-300 |
| Voice (Lucy) | ElevenLabs Conversational AI + Twilio | $150-400 |
| Embeddings | OpenAI text-embedding-3-small | <$1 |
| Vector DB | Pinecone (3,386 vectors, 3 namespaces) | $2-5 |
| Web Search | You.com, Brave, Exa, Tavily, SerpAPI (rotation) | $0-20 |
| SMS | Twilio (confirmations, notifications) | $10-30 |
| Email | Transactional email | <$5 |
| Infrastructure | AWS Lightsail (instance + managed PostgreSQL) | $30-60 |
| Stripe Processing | Payment processing fees | Variable |
| **Total estimated** | | **$300-850/month** |

Key observations from Atlas UX's cost structure:
- **Voice is the largest variable cost**: Lucy's phone calls drive the majority of per-tenant costs. Optimizing call duration and model routing for voice conversations has the highest ROI.
- **LLM costs are manageable with routing**: Multi-provider routing keeps inference costs below what a single-provider GPT-4o approach would cost.
- **Vector DB is negligible at current scale**: 3,386 vectors cost almost nothing. This category only becomes significant at 100K+ vectors.
- **Free search tiers stretch far**: With 5 providers in rotation, web search costs are near zero at current query volumes.
- **Infrastructure is a fixed, predictable cost**: AWS Lightsail provides predictable monthly billing without surprise charges.

## Budget Planning Template

Use this template to calculate your own monthly AI budget:

```
MONTHLY AI BUDGET CALCULATOR
=============================

1. LLM Inference
   Daily requests: ___
   Avg input tokens/request: ___
   Avg output tokens/request: ___
   Primary model + price: ___
   Secondary model + price: ___
   Estimated monthly: $___

2. Image Generation
   Images per month: ___
   Provider + per-image cost: ___
   Estimated monthly: $___

3. Voice (TTS + STT)
   TTS minutes/month: ___
   STT minutes/month: ___
   Provider(s): ___
   Estimated monthly: $___

4. Video Generation
   Clips per month: ___
   Avg duration: ___
   Provider: ___
   Estimated monthly: $___

5. Embeddings
   New documents/month: ___
   Provider: ___
   Estimated monthly: $___

6. Vector Database
   Total vectors: ___
   Queries/day: ___
   Provider: ___
   Estimated monthly: $___

7. Web Search
   Queries/month: ___
   Provider(s): ___
   Estimated monthly: $___

8. SMS/Phone
   SMS messages/month: ___
   Voice minutes/month: ___
   Estimated monthly: $___

9. Email
   Emails/month: ___
   Provider: ___
   Estimated monthly: $___

10. Infrastructure
    Servers: ___
    Database: ___
    Storage: ___
    CDN: ___
    Estimated monthly: $___

SUBTOTAL: $___
Buffer (20-30%): $___
TOTAL BUDGET: $___
```

## Cost Scaling Patterns

As your application grows, costs do not scale linearly across all categories:

- **Linear scaling**: LLM inference, SMS, voice — costs grow proportionally with usage.
- **Sub-linear scaling**: Embeddings (one-time per document), infrastructure (vertical scaling is cheaper than horizontal).
- **Step-function scaling**: Vector DB (pod upgrades), subscriptions (plan tier jumps).
- **Near-zero scaling**: Email (extremely cheap at all volumes), web search (free tiers absorb growth).

Understanding these patterns helps predict costs at 2x, 5x, and 10x your current scale without simply multiplying everything by the growth factor.

## Key Takeaways

1. **LLM inference and voice are the big two** — together they typically represent 60-80% of total AI spend.
2. **Free tiers are a real strategy** — multi-provider rotation for search, embeddings, and basic LLM usage can keep early-stage costs near zero.
3. **Budget 20-30% buffer** — AI usage is spiky and unpredictable, especially during growth phases.
4. **Infrastructure is the most predictable cost** — use managed services with fixed pricing (Lightsail, DigitalOcean) to anchor your budget.
5. **Optimize the expensive categories first** — model routing for LLM inference and call duration optimization for voice deliver the highest ROI.

## Resources

- https://openai.com/api/pricing/ — OpenAI comprehensive API pricing
- https://www.twilio.com/en-us/pricing — Twilio SMS and voice pricing
- https://aws.amazon.com/lightsail/pricing/ — AWS Lightsail predictable pricing tiers

## Image References

1. "AI startup monthly cost breakdown pie chart budget" — search: `ai startup monthly cost breakdown pie chart`
2. "Cloud infrastructure cost comparison chart AWS GCP Azure" — search: `cloud infrastructure cost comparison aws gcp azure chart`
3. "AI API cost scaling curve linear versus step function" — search: `api cost scaling curve linear step function diagram`
4. "SaaS unit economics cost per user AI application" — search: `saas unit economics cost per user ai application chart`
5. "Monthly budget planning template spreadsheet AI stack" — search: `monthly budget planning template ai tech stack`

## Video References

1. https://www.youtube.com/watch?v=a-gqJj6rMOs — "How Much Does It Actually Cost to Build an AI App?" by Greg Isenberg
2. https://www.youtube.com/watch?v=SzerzlOlBVc — "AI Startup Costs Breakdown: Real Numbers from Production" by Y Combinator
