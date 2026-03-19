/**
 * Wiki MCP Server — Model Context Protocol endpoint for wiki.atlasux.cloud.
 *
 * MCP access is EXCLUSIVE to Pro tier (5+ deposited API keys).
 * Free and Builder tier users are rejected with an upgrade message.
 *
 * GET  /v1/wiki-mcp — public discovery (shows what MCP offers, how to earn access)
 * POST /v1/wiki-mcp — JSON-RPC 2.0 endpoint (Pro tier only)
 */

import type { FastifyPluginAsync } from "fastify";
import { validateWikiKey, tierHasMcp } from "./wikiKeyRoutes.js";

// ── Types ────────────────────────────────────────────────────────────────────

type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

// ── Internal wiki API caller ────────────────────────────────────────────────

async function callWikiApi(path: string, app: { inject: Function }): Promise<unknown> {
  const res = await app.inject({ method: "GET", url: `/v1/wiki${path}` });
  if (res.statusCode !== 200) throw new Error(`Wiki API error: ${res.statusCode}`);
  return JSON.parse(res.payload);
}

// ── MCP Tool definitions ────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "wiki_search",
    description: "Search the Atlas UX knowledge base. Covers AI image generation (16+ platforms), AI video generation (5 platforms), customer support, agent docs, compliance policies, and workflow definitions.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search terms (min 2 characters)" },
      },
      required: ["query"],
    },
  },
  {
    name: "wiki_read",
    description: "Read a specific wiki article. Returns full markdown content.",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string", description: "Section: image-gen, video-gen, support, agents, policies, workflows" },
        category: { type: "string", description: "Category within the section" },
        slug: { type: "string", description: "Article slug (filename without .md)" },
      },
      required: ["section", "category", "slug"],
    },
  },
  {
    name: "wiki_list",
    description: "List wiki articles. Filter by section and/or category, or search by keyword.",
    inputSchema: {
      type: "object",
      properties: {
        section: { type: "string", description: "Filter by section" },
        category: { type: "string", description: "Filter by category" },
        q: { type: "string", description: "Search query" },
      },
    },
  },
  {
    name: "wiki_sections",
    description: "List all wiki sections with article counts and descriptions.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "wiki_stats",
    description: "Get wiki statistics — total articles and breakdown by section.",
    inputSchema: { type: "object", properties: {} },
  },
];

// ── Routes ──────────────────────────────────────────────────────────────────

const wikiMcpRoutes: FastifyPluginAsync = async (app) => {
  // Public discovery — tells people what MCP offers and how to earn access
  app.get("/", async () => {
    return {
      name: "atlas-wiki",
      version: "2.0.0",
      description: "Atlas UX Knowledge Base MCP Server — 340+ articles on AI image/video generation, agent docs, compliance, and workflows.",
      protocol: "mcp",
      access: "Pro tier only. Deposit 5+ platform API keys at https://wiki.atlasux.cloud/#/api to unlock.",
      tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
      howToUnlock: [
        "1. Get a free API key at https://wiki.atlasux.cloud/#/api",
        "2. Accept the Terms of Service",
        "3. Deposit 5+ platform API keys (OpenAI, Anthropic, etc.)",
        "4. You're Pro — add this MCP server to your agent config",
      ],
    };
  });

  // JSON-RPC 2.0 endpoint — Pro tier only
  app.post("/", async (req, reply) => {
    // Validate API key
    const auth = await validateWikiKey(req.headers.authorization);
    if (!auth.valid) {
      return reply.status(401).send({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32000, message: auth.error ?? "Unauthorized" },
      });
    }

    // Gate: Pro tier only
    if (!tierHasMcp(auth.tier ?? "free")) {
      return reply.status(403).send({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message: "MCP access requires Pro tier. Deposit 5+ platform API keys at https://wiki.atlasux.cloud/#/api to unlock.",
        },
      });
    }

    const body = req.body as JsonRpcRequest;
    if (!body || body.jsonrpc !== "2.0" || !body.method) {
      return reply.status(400).send({
        jsonrpc: "2.0",
        id: body?.id ?? null,
        error: { code: -32600, message: "Invalid JSON-RPC request" },
      } as JsonRpcResponse);
    }

    const { id, method, params } = body;

    try {
      switch (method) {
        case "initialize": {
          return {
            jsonrpc: "2.0", id,
            result: {
              protocolVersion: "2024-11-05",
              serverInfo: { name: "atlas-wiki", version: "2.0.0" },
              capabilities: { tools: {} },
            },
          };
        }

        case "tools/list": {
          return { jsonrpc: "2.0", id, result: { tools: TOOLS } };
        }

        case "tools/call": {
          const toolName = (params as Record<string, unknown>)?.name as string;
          const toolArgs = (params as Record<string, unknown>)?.arguments as Record<string, string> ?? {};

          let result: unknown;

          switch (toolName) {
            case "wiki_search": {
              const q = toolArgs.query;
              if (!q) throw new Error("query is required");
              result = await callWikiApi(`/search?q=${encodeURIComponent(q)}`, app);
              break;
            }
            case "wiki_read": {
              const { section, category, slug } = toolArgs;
              if (!section || !category || !slug) throw new Error("section, category, and slug are required");
              result = await callWikiApi(`/articles/${section}/${category}/${slug}`, app);
              break;
            }
            case "wiki_list": {
              const qs = new URLSearchParams();
              if (toolArgs.section) qs.set("section", toolArgs.section);
              if (toolArgs.category) qs.set("category", toolArgs.category);
              if (toolArgs.q) qs.set("q", toolArgs.q);
              result = await callWikiApi(`/articles?${qs.toString()}`, app);
              break;
            }
            case "wiki_sections": {
              result = await callWikiApi("/sections", app);
              break;
            }
            case "wiki_stats": {
              result = await callWikiApi("/stats", app);
              break;
            }
            default:
              return {
                jsonrpc: "2.0", id,
                error: { code: -32601, message: `Unknown tool: ${toolName}` },
              } as JsonRpcResponse;
          }

          return {
            jsonrpc: "2.0", id,
            result: {
              content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
            },
          };
        }

        case "ping": {
          return { jsonrpc: "2.0", id, result: {} };
        }

        default:
          return {
            jsonrpc: "2.0", id,
            error: { code: -32601, message: `Method not found: ${method}` },
          } as JsonRpcResponse;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Internal error";
      return {
        jsonrpc: "2.0", id,
        error: { code: -32603, message },
      } as JsonRpcResponse;
    }
  });
};

export default wikiMcpRoutes;
