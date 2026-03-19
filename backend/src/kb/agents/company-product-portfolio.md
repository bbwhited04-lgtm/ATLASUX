# Dead App Corp Product Portfolio

## Introduction

Dead App Corp's product portfolio tells a story of convergent evolution. What started as unrelated product experiments — a URL shortener, a viral marketing engine, a dead-app directory — gradually revealed a pattern: small businesses need AI-powered operations, not more software tools. Each shipped product contributed technical infrastructure, market insight, or hard-won lessons about what not to build. Today, the portfolio centers on three active products, each targeting a specific market with a specific AI-first thesis, backed by the institutional knowledge that only comes from building, shipping, and killing real products.

## Active Products

### Atlas UX — The Flagship

**What it is.** Atlas UX is a full-stack AI workforce platform for trade and service businesses. It provides a team of named AI agents — each with a specialized role — that handle business operations autonomously under human oversight. The platform runs as both a web SPA and an Electron desktop app, deployed on AWS Lightsail.

**The agent team.** Atlas (CEO agent, strategic orchestration), Lucy (AI receptionist, call handling and appointment booking), Binky (CRO, revenue operations), and a growing roster of specialized agents. Each agent has its own email account, personality configuration, and behavioral policies governed by the System Governance Language (SGL) — a domain-specific language that defines what agents can and cannot do.

**Technical architecture.** React 18 frontend with Vite and Tailwind CSS. Fastify 5 backend with TypeScript. PostgreSQL 16 via Prisma ORM with 30+ models, all multi-tenant (every table has a tenant_id). AI providers include OpenAI, DeepSeek, OpenRouter, Cerebras, Gemini, and Anthropic. Voice powered by ElevenLabs Conversational AI. Payments through Stripe. Telephony via Twilio.

**Safety architecture.** Atlas UX enforces hard safety guardrails that reflect lessons from the graveyard: decision-memo approval workflows for high-risk actions, risk-tier classification (tier 0 = auto-approve, tier 2+ = require human approval), daily action caps, daily posting caps, and a comprehensive audit trail with hash-chain integrity (SOC 2 CC7.2 compliant). AES-256-GCM encryption protects stored credentials at rest.

**Market position.** Atlas UX is the flagship platform from which specialized products can be extracted. It serves as both a production product for early customers and an R&D platform for testing new agent capabilities before spinning them into standalone offerings.

**Status.** Beta. Live on AWS Lightsail with real tenant data. Active development with weekly deploys.

### CallLucy.ai — The Standalone Receptionist

**What it is.** CallLucy.ai extracts Lucy — the AI receptionist — from Atlas UX and packages her as a standalone $99/month product for trade businesses. No platform complexity, no agent team, no dashboards with 40 tabs. Just Lucy, answering calls, booking appointments, sending confirmations, and notifying the business owner.

**Why it exists.** Atlas UX is powerful but complex. A 5-person plumbing company does not need an AI workforce platform — they need someone to answer the phone. CallLucy.ai strips away everything except the receptionist function, producing a product that can be explained in one sentence: "Lucy answers your phone 24/7 for $99/month."

**Technical relationship.** CallLucy.ai shares backend infrastructure with Atlas UX but presents a radically simplified frontend. Lucy's voice engine (ElevenLabs), telephony (Twilio), and booking logic are identical. The difference is surface area: CallLucy.ai exposes only what a trade business owner needs to see.

**Design philosophy.** Mobile-first, because trades professionals are on jobsites, not at desks. Setup must complete in under 5 minutes. No jargon, no configuration complexity, no "onboarding wizard" that takes 30 minutes. If a 45-year-old HVAC company owner cannot set it up between jobs, the product has failed.

**Target customer.** Trade and service businesses with 1-20 employees: plumbers, HVAC technicians, electricians, landscapers, salon owners, auto repair shops, general contractors. Revenue range $200K-$3M. Currently losing $2,000-10,000/month in missed calls. Has tried answering services and found them too expensive or too low-quality.

**Status.** In development. Lucy voice agent operational. Frontend being built mobile-first. Targeting initial launch for trade business beta users.

### Ask Essie — The AI Assistant

**What it is.** Ask Essie is an AI assistant product with its own brand identity, infrastructure, and target market. Built on separate AWS Lightsail infrastructure with its own PostgreSQL database.

**Brand assets.** Own domain, phone number, email, and social media handles. Positioned as a friendly, approachable AI assistant — the name "Essie" is deliberate, evoking a helpful person rather than a technology product.

**Target audience.** Tradesmen aged 40+. The product must be dead simple — no tech jargon, no complex interfaces. If it requires explanation, it is too complicated.

**Technical infrastructure.** Separate AWS Lightsail instance with dedicated database. Independent deployment pipeline. Shares some backend patterns with Atlas UX but operates as a standalone product.

**Status.** Early development. AWS infrastructure provisioned. Core concept validated.

## Shuttered Products

### Shorty Pro

**What it was.** A URL shortener with analytics — link management for marketers who needed Bitly alternatives with deeper tracking and customization.

**What worked.** The analytics pipeline was solid. The shortening service was reliable. Basic product-market fit existed — people used it.

**Why it died.** Market commoditization. The URL shortener space consolidated around Bitly, Rebrandly, and a handful of others. Competing on features in a commoditized market is economically unsustainable for a small team. The margins were too thin and the switching costs too low.

**Lesson extracted.** Do not compete on features in a crowded market. Create a new category or do not enter. This lesson directly shaped Atlas UX's positioning as "AI employees" rather than "better CRM" or "better scheduling."

### ViralDeadEngine

**What it was.** A content distribution and viral marketing tool that analyzed content patterns, optimized distribution timing, and attempted to systematize virality.

**What worked.** The content analysis engine was genuinely useful. Pattern detection across social platforms produced actionable insights.

**Why it died.** The core thesis — that virality is a repeatable engineering problem — was wrong. Virality is a distribution phenomenon with heavy tail dynamics. You cannot engineer a viral hit any more reliably than you can engineer a lottery win. The product oversold a promise it could not keep.

**Lesson extracted.** Small businesses do not want virality — they want reliable, predictable customer acquisition. Lucy does not promise viral marketing; she promises that the phone gets answered. Reliability beats excitement every time for the target customer.

### DeadApp.info

**What it was.** A directory and analysis platform for discontinued apps and services. A searchable graveyard of dead products with analysis of why they failed.

**What worked.** The concept resonated — people loved browsing the graveyard. The failure analysis was genuinely insightful. It generated media attention and traffic.

**Why it died.** The irony of a dead-app tracker becoming a dead app is not lost on anyone. The product had engagement but no monetization path. Users visited, browsed, and left. There was no recurring value proposition that justified a subscription or purchase.

**Lesson extracted.** Engagement without monetization is a hobby, not a business. Every Dead App Corp product now ships with a clear revenue model on day one. Lucy is $99/month. No freemium "figure out monetization later" experiments.

## Portfolio Strategy

Dead App Corp's portfolio strategy follows three principles derived from the graveyard.

**Extract, do not duplicate.** When a capability within Atlas UX proves it can stand alone (like Lucy as a receptionist), it gets extracted into a standalone product (CallLucy.ai) rather than rebuilt from scratch. This ensures the standalone product benefits from Atlas UX's battle-tested infrastructure while maintaining its own focused identity.

**One price, one promise.** Each product has a single, clear value proposition and a simple pricing model. Lucy answers calls for $99/month. No tiers, no per-call charges, no enterprise pricing negotiations. Complexity in pricing is a tax on the customer's decision-making, and trade business owners do not have time for that tax.

**Kill fast, learn faster.** Products that do not demonstrate value within 90 days get killed or pivoted. The graveyard is not a source of shame — it is a competitive advantage. Every dead product made the surviving products better. The willingness to kill is what makes it possible to ship boldly.

## Current Focus and Roadmap

The immediate priority is CallLucy.ai — getting the standalone AI receptionist into the hands of trade businesses and validating the $99/month product-market fit with real customers. Atlas UX continues as the platform layer, receiving capability upgrades that eventually trickle down to standalone products.

The medium-term roadmap expands Lucy's capabilities from receptionist to operations assistant: scheduling optimization, automated follow-up sequences, review solicitation, and basic invoicing. Each capability is built as a mid-call or post-call tool within the existing agent architecture.

The long-term vision is an ecosystem of specialized AI employees — each extracted from the Atlas UX platform, each serving a specific function, each priced simply enough that a trade business owner can adopt them one at a time without commitment anxiety. The graveyard taught Dead App Corp that the best products are the ones customers adopt without needing to be convinced.

## Resources

- https://www.calllucy.ai — CallLucy.ai standalone AI receptionist for trade businesses
- https://atlasux.com — Atlas UX AI workforce platform
- https://www.lennysnewsletter.com/p/how-the-biggest-consumer-apps-got — Lenny Rachitsky on product-led growth strategies relevant to Dead App Corp's distribution approach

## Image References

1. "product portfolio strategy active shuttered products lifecycle diagram" — Portfolio visualization showing active and shuttered products
2. "CallLucy AI receptionist mobile app interface trade business" — CallLucy.ai mobile-first interface concept
3. "Atlas UX platform dashboard AI agent workforce management" — Atlas UX platform dashboard showing agent team
4. "startup product graveyard lessons learned knowledge transfer" — Knowledge transfer from failed to successful products
5. "AI employee virtual worker product lineup SaaS platform" — Product lineup showing the AI employee ecosystem

## Video References

1. https://www.youtube.com/watch?v=f_LNNnNfpp4 — "How to Plan an MVP" by Y Combinator on minimum viable product strategy
2. https://www.youtube.com/watch?v=C27RVio2rOs — "Product Strategy in the AI Era" by Sequoia Capital on AI-first product development