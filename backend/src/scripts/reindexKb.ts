/**
 * Re-index KB — Context-enriched re-embedding to Pinecone namespaces.
 *
 * Reads all KbDocuments, builds context headers with tier/category/tags/related,
 * embeds with OpenAI text-embedding-3-small, upserts to correct Pinecone namespace.
 *
 * Run: cd backend && npx tsx src/scripts/reindexKb.ts [--dry-run]
 */
import { prisma } from "../db/prisma.js";
import { upsertChunks } from "../lib/pinecone.js";
import type { PineconeChunk } from "../lib/pinecone.js";

const DRY_RUN = process.argv.includes("--dry-run");

type DocWithMeta = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  tier: string;
  category: string | null;
  tenantId: string;
  tags: string[];
};

function buildContextHeader(doc: DocWithMeta, relatedSlugs: string[]): string {
  const parts = [
    `[Tier: ${doc.tier}]`,
    doc.category ? `[Category: ${doc.category}]` : null,
    doc.tags.length > 0 ? `[Tags: ${doc.tags.slice(0, 5).join(", ")}]` : null,
    `[Doc: ${doc.title}]`,
    relatedSlugs.length > 0 ? `[Related: ${relatedSlugs.slice(0, 5).join(", ")}]` : null,
  ].filter(Boolean);
  return parts.join(" ") + "\n---\n";
}

function findRelatedByCategory(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  if (!doc.category) return [];
  return allDocs
    .filter(d => d.id !== doc.id && d.category === doc.category)
    .slice(0, 5)
    .map(d => d.slug);
}

function findRelatedByTagOverlap(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  if (doc.tags.length === 0) return [];
  const docTags = new Set(doc.tags);
  return allDocs
    .filter(d => {
      if (d.id === doc.id) return false;
      // Lower threshold: even 1 shared tag creates a connection
      const overlap = d.tags.filter(t => docTags.has(t)).length;
      return overlap >= 1;
    })
    .sort((a, b) => {
      // Rank by overlap count descending
      const overlapA = a.tags.filter(t => docTags.has(t)).length;
      const overlapB = b.tags.filter(t => docTags.has(t)).length;
      return overlapB - overlapA;
    })
    .slice(0, 5)
    .map(d => d.slug);
}

/** Match docs sharing a slug prefix (e.g. "saas-metrics" ↔ "saas-pricing") */
function findRelatedBySlugPrefix(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  const parts = doc.slug.replace(/[_/]/g, "-").split("-");
  if (parts.length < 2) return [];
  // Try longest prefix first, then shorter
  for (let len = Math.min(parts.length - 1, 3); len >= 1; len--) {
    const prefix = parts.slice(0, len).join("-");
    if (prefix.length < 3) continue; // skip trivial prefixes
    const matches = allDocs
      .filter(d => d.id !== doc.id && d.slug.replace(/[_/]/g, "-").startsWith(prefix))
      .slice(0, 5)
      .map(d => d.slug);
    if (matches.length > 0) return matches;
  }
  return [];
}

/** Lightweight keyword overlap — extract top terms from title and match */
function findRelatedByKeywords(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  const stopWords = new Set(["the", "a", "an", "and", "or", "of", "in", "to", "for", "is", "on", "at", "by", "with", "from", "as", "how", "what", "why"]);
  const extractTerms = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

  const docTerms = new Set(extractTerms(`${doc.title} ${doc.slug.replace(/[-_]/g, " ")}`));
  if (docTerms.size === 0) return [];

  const scored = allDocs
    .filter(d => d.id !== doc.id)
    .map(d => {
      const terms = extractTerms(`${d.title} ${d.slug.replace(/[-_]/g, " ")}`);
      const overlap = terms.filter(t => docTerms.has(t)).length;
      return { slug: d.slug, score: overlap };
    })
    .filter(d => d.score >= 2)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map(d => d.slug);
}

/** Last resort — connect to nearest docs in same tier */
function findRelatedByTierCohort(doc: DocWithMeta, allDocs: DocWithMeta[]): string[] {
  return allDocs
    .filter(d => d.id !== doc.id && d.tier === doc.tier && d.tenantId === doc.tenantId)
    .slice(0, 3)
    .map(d => d.slug);
}

function namespaceForDoc(doc: DocWithMeta): string {
  if (doc.tier === "public") return "public";
  if (doc.tier === "internal") return "internal";
  return `tenant-${doc.tenantId}`;
}

async function main() {
  console.log(DRY_RUN ? "DRY RUN — no Pinecone writes" : "LIVE — writing to Pinecone");

  // Load all docs with tags
  const rawDocs = await prisma.kbDocument.findMany({
    include: { tags: { include: { tag: true } } },
  });

  const allDocs: DocWithMeta[] = rawDocs.map(d => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    body: d.body,
    tier: (d as any).tier ?? "tenant",
    category: (d as any).category ?? null,
    tenantId: d.tenantId,
    tags: d.tags.map(t => t.tag.name),
  }));

  console.log(`Found ${allDocs.length} documents`);

  // Load existing chunks from DB
  let dbChunks: any[] = [];
  try {
    dbChunks = await prisma.$queryRaw`
      select id::text as id, document_id::text as "documentId",
             tenant_id::text as "tenantId", idx, content
      from kb_chunks
      order by document_id, idx
    ` as any[];
    console.log(`Found ${dbChunks.length} existing chunks in DB`);
  } catch {
    console.log("No kb_chunks table — will chunk from doc bodies");
  }

  const chunksByDoc = new Map<string, any[]>();
  for (const c of dbChunks) {
    const arr = chunksByDoc.get(c.documentId) ?? [];
    arr.push(c);
    chunksByDoc.set(c.documentId, arr);
  }

  // Process each document
  let totalVectors = 0;
  let processed = 0;
  let orphanCount = 0;
  let rescuedOrphans = 0;
  const nsCounts: Record<string, number> = {};

  for (const doc of allDocs) {
    // Layer 1: Category + tag overlap (strongest signals)
    let related = [
      ...new Set([
        ...findRelatedByCategory(doc, allDocs),
        ...findRelatedByTagOverlap(doc, allDocs),
      ]),
    ];

    // Layer 2: Slug prefix similarity (if under 3 links)
    if (related.length < 3) {
      const slugRelated = findRelatedBySlugPrefix(doc, allDocs);
      related = [...new Set([...related, ...slugRelated])];
    }

    // Layer 3: Keyword overlap from title (if still under 3)
    if (related.length < 3) {
      const kwRelated = findRelatedByKeywords(doc, allDocs);
      related = [...new Set([...related, ...kwRelated])];
    }

    // Layer 4: Tier cohort fallback (no doc left behind)
    if (related.length === 0) {
      orphanCount++;
      related = findRelatedByTierCohort(doc, allDocs);
      if (related.length > 0) rescuedOrphans++;
    }

    related = related.slice(0, 5);

    const header = buildContextHeader(doc, related);
    const ns = namespaceForDoc(doc);
    if (!nsCounts[ns]) nsCounts[ns] = 0;

    // Get chunks: prefer DB chunks, fallback to body
    const existingChunks = chunksByDoc.get(doc.id);
    let chunks: PineconeChunk[] = [];

    if (existingChunks && existingChunks.length > 0) {
      chunks = existingChunks.map(c => ({
        id: `${doc.id}::${c.idx}`,
        content: header + c.content,
        tenantId: doc.tenantId,
        documentId: doc.id,
        slug: doc.slug,
        title: doc.title,
        tier: doc.tier,
        category: doc.category ?? undefined,
      }));
    } else if (doc.body && doc.body.length > 0) {
      // Single chunk from body (up to 7500 chars to leave room for header)
      chunks = [{
        id: `${doc.id}::0`,
        content: header + doc.body.slice(0, 7500),
        tenantId: doc.tenantId,
        documentId: doc.id,
        slug: doc.slug,
        title: doc.title,
        tier: doc.tier,
        category: doc.category ?? undefined,
      }];
    }

    if (chunks.length === 0) continue;

    if (!DRY_RUN) {
      await upsertChunks(chunks, ns);
    }

    totalVectors += chunks.length;
    nsCounts[ns] = (nsCounts[ns] ?? 0) + chunks.length;
    processed++;

    if (processed % 50 === 0) {
      console.log(`  ${processed}/${allDocs.length} docs processed (${totalVectors} vectors)`);
    }
  }

  console.log(`\nDone! ${processed} docs -> ${totalVectors} vectors`);
  console.log("Namespace breakdown:");
  for (const [ns, count] of Object.entries(nsCounts).sort()) {
    console.log(`  ${ns}: ${count} vectors`);
  }
  console.log(`\nOrphan report: ${orphanCount} docs had no category/tag links`);
  console.log(`  Rescued via tier-cohort fallback: ${rescuedOrphans}`);
  console.log(`  Truly isolated (no peers in tier): ${orphanCount - rescuedOrphans}`);

  if (DRY_RUN) {
    console.log("\nDRY RUN complete. No vectors written. Run without --dry-run to write.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
