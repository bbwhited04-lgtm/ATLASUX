/**
 * Golden Dataset Manager — generate, approve, and query golden eval queries.
 */
import { prisma } from "../../db/prisma.js";
import { runLLM, simpleCall } from "../engine/brainllm.js";
import { loadEnv } from "../../env.js";

const TENANT_ID = "9a8a332c-c47d-4792-a0d4-56ad4e4a3391"; // platform owner

function repairAndParseJsonArray(text: string): any[] | null {
  // Extract JSON array from LLM output
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    // Try extracting individual objects if array brackets are missing
    const objects = text.match(/\{[^{}]*\}/g);
    if (objects && objects.length > 0) {
      try {
        return objects.map(o => JSON.parse(o.replace(/'/g, '"')));
      } catch { return null; }
    }
    return null;
  }

  let raw = match[0]
    .replace(/,\s*([}\]])/g, "$1")      // trailing commas
    .replace(/'/g, '"')                  // single to double quotes
    .replace(/[\x00-\x1f]/g, " ")       // control chars
    .replace(/,\s*$/, "")               // trailing comma before end
    .replace(/"\s*\n\s*"/g, '", "');     // missing commas between strings

  // Try parsing as-is
  try { const r = JSON.parse(raw); return Array.isArray(r) ? r : null; } catch {}

  // If truncated (no closing bracket), try to close it
  if (!raw.trimEnd().endsWith("]")) {
    // Find the last complete object
    const lastBrace = raw.lastIndexOf("}");
    if (lastBrace > 0) {
      const truncated = raw.slice(0, lastBrace + 1) + "]";
      try { const r = JSON.parse(truncated); return Array.isArray(r) ? r : null; } catch {}
    }
  }

  return null;
}

// Generate candidate golden queries from existing KB docs
export async function generateCandidateQueries(tenantId: string = TENANT_ID): Promise<number> {
  // 1. Load all published KB docs grouped by category
  const docs = await prisma.kbDocument.findMany({
    where: { tenantId, status: "published" },
    select: { id: true, slug: true, title: true, body: true, tier: true, category: true },
  });

  // Filter out system-generated docs (tripwire signal clips, etc.)
  const EXCLUDED_SLUG_PREFIXES = ["tripwire-"];
  const realDocs = docs.filter(d => !EXCLUDED_SLUG_PREFIXES.some(p => d.slug.startsWith(p)));

  // 2. Group docs by category (batch LLM calls)
  const byCategory = new Map<string, typeof realDocs>();
  for (const doc of realDocs) {
    const cat = (doc as any).category ?? "general";
    const arr = byCategory.get(cat) ?? [];
    arr.push(doc);
    byCategory.set(cat, arr);
  }

  let totalGenerated = 0;

  // 3. For each category, generate queries per-doc (1 doc = 1 LLM call = shorter JSON = more reliable)
  for (const [category, catDocs] of byCategory) {
    const batch = catDocs.slice(0, 5); // up to 5 docs per category

    for (const doc of batch) {
      const docSummary = `Title: "${doc.title}"\nSlug: ${doc.slug}\nTier: ${(doc as any).tier ?? "tenant"}\nContent: ${(doc.body ?? "").slice(0, 500)}`;

      const prompt = [
        `Generate 3 test queries a user might ask to find this document in a knowledge base.`,
        ``,
        docSummary,
        ``,
        `Return a JSON array of 3 objects. Each: {"query":"...","querySource":"chat","expectedDocumentIds":["${doc.slug}"],"expectedAnswer":"...","difficulty":"medium"}`,
        `querySource must be one of: voice, chat, engine, admin`,
        `difficulty must be one of: easy, medium, hard`,
        `Return ONLY the JSON array, no other text.`,
      ].join("\n");

      try {
        const res = await runLLM(
          simpleCall("ATLAS", `golden-gen-${Date.now()}`, "golden_query_gen", "DRAFT_GENERATION_FAST", prompt),
        );

        const parsed = repairAndParseJsonArray(res.text);
        if (!parsed) continue;

        for (const q of parsed) {
          if (!q.query || typeof q.query !== "string") continue;

          await prisma.kbEvalQuery.create({
            data: {
              tenantId,
              query: q.query,
              querySource: q.querySource ?? "chat",
              expectedDocumentIds: Array.isArray(q.expectedDocumentIds) ? q.expectedDocumentIds : [doc.slug],
              expectedAnswer: q.expectedAnswer ?? null,
              difficulty: q.difficulty ?? "medium",
              category,
              tier: (doc as any).tier ?? "tenant",
              status: "candidate",
            },
          });
          totalGenerated++;
        }
      } catch (err: any) {
        console.error(`Error generating queries for ${doc.slug}:`, err?.message);
      }

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return totalGenerated;
}

// Approve a candidate query (make it golden)
export async function approveQuery(id: string): Promise<void> {
  await prisma.kbEvalQuery.update({
    where: { id },
    data: { status: "approved", approvedAt: new Date() },
  });
}

// Approve all candidates at once
export async function approveAllCandidates(tenantId: string = TENANT_ID): Promise<number> {
  const result = await prisma.kbEvalQuery.updateMany({
    where: { tenantId, status: "candidate" },
    data: { status: "approved", approvedAt: new Date() },
  });
  return result.count;
}

// Retire a query
export async function retireQuery(id: string): Promise<void> {
  await prisma.kbEvalQuery.update({
    where: { id },
    data: { status: "retired", retiredAt: new Date() },
  });
}

// Get all approved (golden) queries
export async function getApprovedQueries(tenantId: string = TENANT_ID) {
  return prisma.kbEvalQuery.findMany({
    where: { tenantId, status: "approved" },
    orderBy: { createdAt: "asc" },
  });
}

// Check coverage: which categories/tiers have fewer than min golden queries
export async function checkCoverage(tenantId: string = TENANT_ID) {
  const env = loadEnv(process.env);
  const minCoverage = Number(env.KB_EVAL_GOLDEN_MIN_COVERAGE ?? 5);

  const queries = await getApprovedQueries(tenantId);

  const byCat = new Map<string, number>();
  const byTier = new Map<string, number>();
  const bySource = new Map<string, number>();

  for (const q of queries) {
    byCat.set(q.category ?? "unknown", (byCat.get(q.category ?? "unknown") ?? 0) + 1);
    byTier.set(q.tier ?? "unknown", (byTier.get(q.tier ?? "unknown") ?? 0) + 1);
    bySource.set(q.querySource, (bySource.get(q.querySource) ?? 0) + 1);
  }

  const gaps: Array<{ dimension: string; name: string; count: number; min: number }> = [];

  // Check all known categories from KB docs
  const allCategories = await prisma.kbDocument.findMany({
    where: { tenantId, status: "published" },
    select: { category: true },
    distinct: ["category"],
  });
  for (const { category } of allCategories) {
    const cat = category ?? "general";
    const count = byCat.get(cat) ?? 0;
    if (count < minCoverage) {
      gaps.push({ dimension: "category", name: cat, count, min: minCoverage });
    }
  }

  for (const tier of ["public", "internal", "tenant"]) {
    const count = byTier.get(tier) ?? 0;
    if (count < 3) {
      gaps.push({ dimension: "tier", name: tier, count, min: 3 });
    }
  }

  for (const source of ["voice", "chat", "engine", "admin"]) {
    const count = bySource.get(source) ?? 0;
    if (count < 2) {
      gaps.push({ dimension: "querySource", name: source, count, min: 2 });
    }
  }

  return { total: queries.length, gaps };
}
