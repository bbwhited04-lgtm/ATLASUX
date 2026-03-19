# MCP Servers for Data & Search

## Overview

Data and search MCP servers give AI agents direct access to databases, vector stores, search engines, and web scraping tools. These servers transform AI conversations from passive text generation into active data retrieval and analysis sessions. Instead of describing your data to the AI, the AI queries it directly.

This guide covers the most useful data and search MCP servers, their tools, setup, and practical applications.

## Pinecone MCP Server

**What it does:** Connects to Pinecone, the managed vector database used for semantic search, RAG pipelines, and embedding storage. Query vectors, upsert records, and manage indexes.

**Key tools exposed:**
- `search-records` — semantic vector search across indexes
- `cascading-search` — multi-index search with fallback
- `upsert-records` — add or update vector records
- `rerank-documents` — re-rank search results for relevance
- `create-index-for-model` — create indexes optimized for specific embedding models
- `describe-index` / `describe-index-stats` — index metadata and statistics
- `list-indexes` — enumerate available indexes

**Setup:**
```json
{
  "mcpServers": {
    "pinecone": {
      "command": "npx",
      "args": ["-y", "@anthropic/pinecone-mcp-server"],
      "env": {
        "PINECONE_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** An AI agent building a RAG pipeline can create an index, upsert document embeddings, test search queries, and tune relevance — all conversationally. For Atlas UX, this pattern powers knowledge base search where Lucy retrieves relevant articles to answer customer questions.

## PostgreSQL MCP Server

**What it does:** Direct SQL access to PostgreSQL databases. Execute queries, explore schemas, and manage data. This is one of the most powerful and most dangerous MCP servers — it gives the AI direct database access.

**Key tools exposed:**
- `query` — execute read-only SQL queries
- `list_tables` — enumerate database tables
- `describe_table` — get column definitions and constraints
- `list_schemas` — schema enumeration

**Setup:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@host:5432/dbname"
      }
    }
  }
}
```

**Security note:** The reference implementation defaults to read-only access. If you need write access, you must explicitly configure it. Always use a database user with minimal required permissions. Never give an AI agent superuser access to a production database.

**Use case:** Data exploration and analysis. The AI can examine table structures, write analytical queries, identify data patterns, and generate reports — all while seeing the actual data rather than working from your verbal description of it.

## SQLite MCP Server

**What it does:** Read and write access to local SQLite database files. Ideal for development, prototyping, and working with embedded databases.

**Key tools exposed:**
- `read_query` — execute SELECT statements
- `write_query` — execute INSERT, UPDATE, DELETE
- `create_table` — DDL operations
- `list_tables` / `describe_table` — schema exploration
- `append_insight` — store analytical findings

**Setup:**
```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/database.db"]
    }
  }
}
```

**Use case:** Quick data analysis on local datasets. Drop a CSV into SQLite, connect the MCP server, and let the AI explore and analyze the data interactively. Also useful for prototyping database schemas before migrating to PostgreSQL.

## Elasticsearch MCP Server

**What it does:** Full-text search and analytics against Elasticsearch clusters. Execute searches, manage indexes, and analyze documents.

**Key tools exposed:**
- `search` — execute Elasticsearch queries (full DSL support)
- `index_document` — add documents to an index
- `get_document` — retrieve specific documents
- `list_indices` — enumerate available indexes
- `get_mapping` — inspect index mappings
- `cluster_health` — cluster status monitoring

**Setup:**
```json
{
  "mcpServers": {
    "elasticsearch": {
      "command": "npx",
      "args": ["-y", "mcp-server-elasticsearch"],
      "env": {
        "ELASTICSEARCH_URL": "http://localhost:9200",
        "ELASTICSEARCH_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Log analysis and search debugging. An AI agent can query application logs, analyze error patterns, check index health, and help build complex Elasticsearch queries using the full query DSL.

## Brave Search MCP Server

**What it does:** Web search through the Brave Search API. Provides both regular web search and local business search capabilities.

**Key tools exposed:**
- `brave_web_search` — general web search with pagination
- `brave_local_search` — local business and place search

**Setup:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Grounding AI responses with current information. When an AI agent needs to answer questions about recent events, current pricing, or real-time data, Brave Search provides web results that the agent can synthesize into accurate answers. The local search capability is particularly useful for trade businesses finding competitors or local suppliers.

## Exa MCP Server

**What it does:** Neural search powered by Exa (formerly Metaphor). Unlike traditional keyword search, Exa understands meaning and returns semantically relevant results. Particularly strong for finding technical content, research papers, and specific types of web pages.

**Key tools exposed:**
- `search` — semantic web search with content retrieval
- `find_similar` — find pages similar to a given URL
- `get_contents` — retrieve full page content from URLs

**Setup:**
```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Research-heavy tasks where keyword search falls short. Finding technical blog posts about specific patterns, locating similar tools or services, and gathering competitive intelligence. Exa's neural approach finds results that traditional search engines miss.

## Firecrawl MCP Server

**What it does:** Web scraping and crawling with automatic content extraction. Converts web pages to clean markdown, handles JavaScript-rendered pages, and can crawl entire sites.

**Key tools exposed:**
- `firecrawl_scrape` — scrape a single URL to clean markdown
- `firecrawl_crawl` — crawl a website following links
- `firecrawl_map` — discover all URLs on a site
- `firecrawl_search` — search and scrape in one step
- `firecrawl_extract` — structured data extraction with schemas

**Setup:**
```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Use case:** Competitive analysis, documentation ingestion, and content research. An AI agent can scrape a competitor's pricing page, extract structured data from product listings, or crawl documentation sites to build knowledge bases. Firecrawl handles the messy work of rendering JavaScript and extracting clean text.

## Apify MCP Server

**What it does:** Access to Apify's marketplace of 19,000+ web scraping and automation actors. This is the Swiss Army knife of data collection — if data exists on the public web, there is probably an Apify actor that can extract it.

**Key tools exposed:**
- `apify_actor_run` — execute any of 19K+ actors
- `apify_actor_search` — find actors by description
- `apify_get_dataset` — retrieve actor output data
- `apify_get_run_status` — check actor execution status

**Setup:**
```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["-y", "@apify/mcp-server"],
      "env": {
        "APIFY_API_TOKEN": "<your-api-token>"
      }
    }
  }
}
```

**Use case:** Large-scale data collection. Scraping Google Maps for lead generation, extracting social media profiles, monitoring competitor pricing, collecting reviews — Apify actors handle the scraping infrastructure while the AI agent orchestrates which actors to run and how to process the results. Atlas UX uses Apify's actor ecosystem for lead generation and market research tasks.

## Choosing the Right Data Servers

For most projects, start with one database server (PostgreSQL or SQLite depending on your stack) and one search server (Brave Search for general web, Exa for technical research). Add Pinecone if you are building RAG pipelines. Add Firecrawl or Apify when you need to extract data from websites.

The critical security consideration with data servers is access control. Database MCP servers give AI agents direct query access — always use read-only credentials unless write access is specifically required, and never expose production databases without careful permission scoping.

## Resources

- https://github.com/modelcontextprotocol/servers/tree/main/src — Official MCP server implementations for PostgreSQL, SQLite, Brave Search
- https://docs.pinecone.io/guides/get-started/overview — Pinecone documentation for vector database concepts
- https://docs.apify.com/platform — Apify platform documentation and actor marketplace

## Image References

1. Vector database architecture showing embeddings and similarity search — search: "vector database architecture embeddings similarity search diagram"
2. PostgreSQL query execution through AI agent workflow — search: "database AI agent query workflow diagram"
3. Web scraping pipeline converting pages to structured data — search: "web scraping pipeline structured data extraction"
4. Comparison of keyword search vs neural semantic search — search: "keyword search vs semantic search comparison"
5. Data flow from multiple MCP data servers into AI agent context — search: "MCP data server integration AI agent architecture"

## Video References

1. https://www.youtube.com/watch?v=pKlinDETp3k — "RAG with Pinecone and MCP: Building AI Search Pipelines"
2. https://www.youtube.com/watch?v=xZDB1naRUlk — "Web Scraping for AI Agents: Firecrawl and Apify Deep Dive"
