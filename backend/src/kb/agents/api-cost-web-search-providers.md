# Web Search API Pricing Comparison

## Why AI Applications Need Search

LLMs have knowledge cutoff dates and cannot access real-time information. Web search APIs bridge this gap, enabling AI agents to retrieve current data — prices, availability, news, competitor information, local business details — and incorporate it into responses. For AI receptionist platforms like Atlas UX, web search powers knowledge enrichment, competitive analysis, and real-time information lookup during customer interactions.

The search API market has diversified significantly, with traditional search engines, AI-native search providers, and specialized research APIs all competing for developer attention. Pricing models range from generous free tiers to premium per-query charges.

## Provider Pricing Breakdown

### You.com (Search API)

| Plan | Monthly Price | Queries/Month | Cost per Query |
|------|--------------|---------------|----------------|
| Free | $0 | 1,000 | $0.000 |
| Basic | $100 | 10,000 | $0.010 |
| Standard | $500 | 100,000 | $0.005 |
| Enterprise | Custom | Custom | ~$0.003 |

You.com offers three search modes:
- **Web Search**: Standard web results with snippets. Cheapest option.
- **News Search**: Filtered for recent news articles.
- **RAG Search**: Returns AI-generated answers with citations. Higher quality but costs more credits.

You.com's RAG mode is particularly useful for AI applications because it returns pre-synthesized answers rather than raw URLs, reducing the need for additional LLM processing.

### Brave Search API

| Plan | Monthly Price | Queries/Month | Cost per Query |
|------|--------------|---------------|----------------|
| Free | $0 | 2,000 | $0.000 |
| Base | $3 | 2,000 + $0.003/extra | $0.003 |
| Pro (AI snippets) | $5 | 1,000 + $0.005/extra | $0.005 |

Brave Search is privacy-focused and runs on its own independent index (not a Bing/Google reseller). The free tier is generous at 2,000 queries per month. The Pro tier includes AI-generated summaries alongside traditional results, which can replace a separate LLM summarization step.

**Standout features**: Local results, discussion forum results, and no user tracking. Their independent index means results sometimes surface content that Google/Bing miss.

### Exa (Neural Search)

| Plan | Monthly Price | Queries/Month | Cost per Query |
|------|--------------|---------------|----------------|
| Free | $0 | 1,000 | $0.000 |
| Basic | $100 | 10,000 | $0.010 |
| Growth | $500 | 100,000 | $0.005 |
| Enterprise | Custom | Custom | Negotiable |

Additional costs:
- Content retrieval (full page text): ~$0.001 per page
- Highlights (key passages): ~$0.001 per result

Exa is fundamentally different from traditional search. It uses neural embeddings to find semantically similar content rather than keyword matching. This makes it excellent for finding conceptually related documents, research papers, and niche content that keyword search misses.

**Best for**: Research-heavy applications, finding similar companies/products, academic content discovery.

### Tavily

| Plan | Monthly Price | Queries/Month | Cost per Query |
|------|--------------|---------------|----------------|
| Free | $0 | 1,000 | $0.000 |
| Basic | $50 | 5,000 + $0.01/extra | $0.010 |
| Pro | $200 | 25,000 + $0.008/extra | $0.008 |
| Enterprise | Custom | Custom | ~$0.005 |

Tavily is built specifically for AI agents and LLM applications. Every result includes a relevance score, clean extracted text, and a pre-formatted answer. The API handles the entire search-extract-summarize pipeline that developers would otherwise build manually.

**Standout features**: Built-in content extraction (no separate scraping needed), topic and domain filtering, answer generation with citations.

### SerpAPI

| Plan | Monthly Price | Searches/Month | Cost per Search |
|------|--------------|----------------|-----------------|
| Free | $0 | 100 | $0.000 |
| Developer | $75 | 5,000 | $0.015 |
| Production | $150 | 15,000 | $0.010 |
| Scale | $300 | 30,000 | $0.010 |
| Enterprise | Custom | 100,000+ | ~$0.005 |

SerpAPI scrapes and parses results from actual search engines (Google, Bing, Yahoo, Baidu, Yandex, and more). This means you get the exact results a user would see on Google, including featured snippets, knowledge panels, local results, and shopping data.

**Standout features**: Supports 15+ search engines, Google Maps/Shopping/News/Images results, structured data extraction from SERPs. The most comprehensive option for applications that need Google-equivalent results.

### Google Custom Search JSON API

| Tier | Cost per Query | Daily Limit |
|------|---------------|-------------|
| Free | $0.00 | 100 queries/day |
| Paid | $5.00 per 1,000 queries | 10,000 queries/day |

Google's official API provides direct access to Google's search index. Pricing is straightforward at $0.005 per query. The free tier is very limited (100/day). Results are Google-quality but lack the AI-augmented features of newer providers.

**Limitations**: Must configure a Custom Search Engine (CSE) with specific sites, or use the entire web. No built-in content extraction — you get URLs and snippets only.

### Bing Web Search API (Azure)

| Tier | Monthly Queries | Cost per 1,000 Queries |
|------|----------------|----------------------|
| Free (S1) | 3 per second, 1,000/mo | $0.00 |
| S1 | 250 per second | $3.00 |
| S2 | 250 per second | $6.00 (with entity/image) |

Bing's API through Azure Cognitive Services is competitively priced. The free tier allows 1,000 queries per month. Bing also offers Entity Search, Image Search, and News Search as separate endpoints with their own pricing.

## Feature Comparison

| Provider | Independent Index | AI Summaries | Content Extraction | Structured Data | Free Tier |
|----------|------------------|-------------|-------------------|-----------------|-----------|
| You.com | Partial | Yes (RAG mode) | No | Limited | 1,000/mo |
| Brave | Yes | Yes (Pro) | No | Yes | 2,000/mo |
| Exa | Yes (neural) | No | Yes ($) | No | 1,000/mo |
| Tavily | No (aggregated) | Yes | Yes (included) | Yes | 1,000/mo |
| SerpAPI | No (scrapes Google) | No | Partial | Yes (SERP features) | 100/mo |
| Google CSE | Yes (Google) | No | No | Limited | 100/day |
| Bing | Yes (Bing) | No | No | Yes | 1,000/mo |

## How Atlas UX Rotates 5 Providers

Atlas UX's `lib/webSearch.ts` implements a multi-provider web search strategy using You.com, Brave, Exa, Tavily, and SerpAPI. The rotation serves two purposes:

**Resilience**: If any single provider experiences downtime or rate limiting, queries automatically route to alternatives. In production, search API outages are common enough that single-provider dependency is a reliability risk.

**Cost distribution**: By spreading queries across 5 providers, each provider's free tier extends further, and no single provider's rate limits are hit. With 5 providers each offering ~1,000 free queries per month, the platform gets approximately 5,000 free searches per month before any paid tier is needed.

**Implementation pattern**: The search module randomizes provider selection for each query. If the selected provider fails or times out, it falls back to the next provider in a randomized list. This prevents predictable traffic patterns that could trigger abuse detection.

**Result normalization**: Each provider returns data in different formats. The search module normalizes results into a consistent structure (title, URL, snippet, relevance score) regardless of which provider actually served the request.

## Cost Analysis at Scale

Monthly search costs for different usage levels:

| Monthly Queries | Cheapest Option | Cost | Best Quality | Cost |
|----------------|-----------------|------|-------------|------|
| 1,000 | Any provider (free tier) | $0 | Tavily | $0 |
| 5,000 | Multi-provider rotation (free tiers) | $0 | Tavily Basic | $50 |
| 10,000 | Brave ($0.003/query) | $30 | Tavily Pro | $200 |
| 50,000 | Brave | $150 | Tavily + SerpAPI | $500+ |
| 100,000 | Google CSE | $500 | SerpAPI Enterprise | ~$500 |

The multi-provider rotation strategy used by Atlas UX is optimal for the 1,000-10,000 queries/month range, where free tiers cover most or all usage.

## Key Takeaways

1. **Free tiers are generous**: Most providers offer 1,000-2,000 free queries per month. Multi-provider rotation extends this to 5,000+ monthly free queries.
2. **AI-native search is worth the premium**: Tavily and Exa provide cleaner, more LLM-ready results that save on downstream processing costs.
3. **SerpAPI for Google-equivalent results**: When you need exactly what Google returns (local results, knowledge panels, shopping), SerpAPI is the only reliable option.
4. **Brave for independence**: The only major provider with a fully independent search index (not reselling Google/Bing), offering unique results.
5. **Provider rotation is a production requirement**: No single search API has 100% uptime. Multi-provider fallback is essential for production reliability.

## Resources

- https://brave.com/search/api/ — Brave Search API documentation and pricing
- https://docs.exa.ai/reference/getting-started — Exa neural search API documentation
- https://docs.tavily.com/ — Tavily search API for AI agents

## Image References

1. "Web search API providers comparison chart pricing tiers" — search: `web search api providers comparison pricing chart`
2. "Multi-provider search rotation fallback architecture diagram" — search: `multi provider api rotation fallback architecture diagram`
3. "Neural search versus keyword search results comparison" — search: `neural search vs keyword search comparison diagram`
4. "Search API request flow from AI agent to results diagram" — search: `search api request flow ai agent diagram`
5. "Web search cost per query comparison bar chart providers" — search: `web search api cost per query comparison bar chart`

## Video References

1. https://www.youtube.com/watch?v=RoGHEiiEuGY — "Best Search APIs for AI Agents: Complete Comparison" by Cole Medin
2. https://www.youtube.com/watch?v=e-pMaOYn4G8 — "Building AI Agents with Web Search: Tavily, Exa, and Brave" by AI Jason
