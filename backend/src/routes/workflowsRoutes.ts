import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { workflowCatalog } from "../workflows/registry.js";
import { n8nWorkflows } from "../workflows/n8n/manifest.js";

// Build a single lookup map: workflow_key → { name, description, ownerAgent }
const CANONICAL: Record<string, { name: string; description: string; ownerAgent: string }> = {};

// 1. Registry workflows (WF-001, WF-002, WF-010, WF-020, WF-021)
for (const w of workflowCatalog) {
  CANONICAL[w.id] = { name: w.name, description: w.description, ownerAgent: w.ownerAgent };
}

// 2. n8n manifest workflows (WF-022 … WF-091)
for (const w of n8nWorkflows) {
  CANONICAL[w.id] = { name: w.name, description: w.description, ownerAgent: w.ownerAgent };
}

export const workflowsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (req) => {
    // Pull DB rows (may include N8N-* keys from legacy imports)
    const rows = (await prisma.$queryRaw`
      select workflow_key, agent_key, name, status, version
      from workflows
      order by workflow_key asc
    `) as any[];

    // Build a set of keys already in DB
    const dbKeys = new Set(rows.map((r: any) => String(r.workflow_key ?? "")));

    // Normalise DB rows, preferring canonical names
    const dbWorkflows = (rows ?? []).map((w: any) => {
      const key = String(w.workflow_key ?? "").trim();
      const canonical = CANONICAL[key];
      return {
        workflow_key: key,
        agent_key: canonical?.ownerAgent ?? (w.agent_key ? String(w.agent_key) : null),
        name: canonical?.name ?? (w.name ? String(w.name) : key),
        description: canonical?.description ?? null,
        status: w.status ? String(w.status) : "active",
        version: w.version ? String(w.version) : null,
      };
    });

    // Add canonical workflows that aren't in the DB yet (registry + manifest)
    const staticWorkflows = Object.entries(CANONICAL)
      .filter(([key]) => !dbKeys.has(key))
      .map(([key, meta]) => ({
        workflow_key: key,
        agent_key: meta.ownerAgent,
        name: meta.name,
        description: meta.description,
        status: "active",
        version: null,
      }));

    // Merge: DB rows first (they may have version/status), then static
    const all = [...dbWorkflows, ...staticWorkflows].sort((a, b) =>
      a.workflow_key.localeCompare(b.workflow_key, undefined, { numeric: true })
    );

    return { ok: true, workflows: all };
  });
};
