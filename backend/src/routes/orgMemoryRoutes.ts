/**
 * orgMemoryRoutes.ts — REST API for the Organizational Brain.
 *
 * GET    /v1/org-memory          — list recent memories (paginated, filterable)
 * GET    /v1/org-memory/search   — semantic search via Pinecone
 * POST   /v1/org-memory          — store a memory manually
 * DELETE /v1/org-memory/:id      — soft-delete (set confidence to 0)
 * GET    /v1/org-memory/stats    — dashboard metrics
 */

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import {
  storeOrgMemory,
  recallOrgMemory,
  pruneStaleMemories,
  getOrgMemoryStats,
  classifyMemoryCategory,
} from "../core/agent/orgMemory.js";
import type { OrgMemoryCategory } from "../core/agent/orgMemory.js";

export const orgMemoryRoutes: FastifyPluginAsync = async (app) => {
  // ── List recent memories ──────────────────────────────────────────────────
  app.get("/", async (req, reply) => {
    const { tenantId } = req as any;
    const qs = req.query as Record<string, string>;
    const limit = Math.min(Number(qs.limit) || 50, 200);
    const offset = Number(qs.offset) || 0;
    const category = qs.category || undefined;

    const where: any = { tenantId, confidence: { gt: 0.1 } };
    if (category) where.category = category;

    const [rows, total] = await Promise.all([
      prisma.orgMemory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.orgMemory.count({ where }),
    ]);

    return reply.send({ memories: rows, total, limit, offset });
  });

  // ── Semantic search ───────────────────────────────────────────────────────
  app.get("/search", async (req, reply) => {
    const { tenantId } = req as any;
    const qs = req.query as Record<string, string>;
    const q = qs.q || "";
    if (q.length < 3) return reply.status(400).send({ error: "Query must be >= 3 characters" });

    const result = await recallOrgMemory({
      tenantId,
      query: q,
      category: qs.category || undefined,
      topK: Number(qs.topK) || 10,
    });

    return reply.send({ memories: result.memories, count: result.memories.length });
  });

  // ── Store a memory ────────────────────────────────────────────────────────
  app.post("/", async (req, reply) => {
    const { tenantId } = req as any;
    const body = req.body as any;

    const content = body?.content?.trim();
    if (!content || content.length < 10) {
      return reply.status(400).send({ error: "content is required (min 10 chars)" });
    }

    const category = (body.category as OrgMemoryCategory) || classifyMemoryCategory(content);
    const result = await storeOrgMemory({
      tenantId,
      category,
      content,
      source: body.source || "manual",
      tags: Array.isArray(body.tags) ? body.tags : [],
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
    });

    return reply.status(201).send(result);
  });

  // ── Soft-delete ───────────────────────────────────────────────────────────
  app.delete("/:id", async (req, reply) => {
    const { tenantId } = req as any;
    const { id } = req.params as { id: string };

    const existing = await prisma.orgMemory.findFirst({
      where: { id, tenantId },
    });
    if (!existing) return reply.status(404).send({ error: "Memory not found" });

    await prisma.orgMemory.update({
      where: { id },
      data: { confidence: 0 },
    });

    return reply.send({ ok: true, id });
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get("/stats", async (req, reply) => {
    const { tenantId } = req as any;
    const stats = await getOrgMemoryStats(tenantId);
    return reply.send(stats);
  });

  // ── Prune stale memories ──────────────────────────────────────────────────
  app.post("/prune", async (req, reply) => {
    const { tenantId } = req as any;
    const pruned = await pruneStaleMemories(tenantId);
    return reply.send({ pruned });
  });
};
