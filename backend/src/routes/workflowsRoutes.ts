import type { FastifyPluginAsync } from "fastify";
import { workflowCatalogAll, n8nWorkflows } from "../workflows/registry.js";
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import * as fs from "node:fs";

function resolveWorkflowFile(repoRelativePath: string) {
  // In dev we run from backend/ with src present. In prod we run dist/.
  const cwd = process.cwd();
  const cand = [
    path.join(cwd, "src", repoRelativePath),
    path.join(cwd, "dist", repoRelativePath),
    path.join(cwd, repoRelativePath),
  ];
  for (const p of cand) {
    if (fs.existsSync(p)) return p;
  }
  return cand[0];
}

export const workflowsRoutes: FastifyPluginAsync = async (app) => {
  // Catalog (internal handlers + n8n template library)
  app.get("/", async () => ({ ok: true, workflows: workflowCatalogAll }));

  // Fetch raw n8n workflow JSON template by id (for UI import / preview)
  app.get("/n8n/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const wf = n8nWorkflows.find(w => w.id === id);
    if (!wf) return reply.code(404).send({ ok: false, error: "not found" });
    const abs = resolveWorkflowFile(wf.file);
    const raw = await readFile(abs, "utf-8");
    let json: any = null;
    try { json = JSON.parse(raw); } catch { json = raw; }
    return reply.send({ ok: true, workflow: wf, json });
  });
};
