import { prisma } from "../../prisma.js";
import { queryPinecone } from "../../lib/pinecone.js";
import { recallOrgMemory } from "../agent/orgMemory.js";

export type KbContextSource = "governance" | "agent" | "relevant";

export type KbContextItem = {
  documentId: string;
  slug: string;
  title: string;
  source: KbContextSource;
  charCount: number;
  chunkIds?: string[];
};

export type KbContextResult = {
  text: string;
  items: KbContextItem[];
  totalChars: number;
  budgetChars: number;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clampQuery(q?: string): string | undefined {
  if (!q) return undefined;
  const s = String(q).trim();
  if (!s) return undefined;
  return s.slice(0, 200);
}

type GetKbContextArgs = {
  tenantId: string;
  agentId: string; // "binky", "archy", etc.
  query?: string;
  // for audit logging (optional)
  requestedBy?: string;
  intentId?: string;
};

export async function getKbContext(args: GetKbContextArgs): Promise<KbContextResult> {
  const tenantId = args.tenantId;
  const agentId = args.agentId;
  const query = clampQuery(args.query);

  const budgetChars = envInt("KB_CONTEXT_CHAR_BUDGET", 60000);
  const maxDocChars = envInt("KB_CONTEXT_MAX_DOC_CHARS", 12000);
  const relevantLimit = envInt("KB_CONTEXT_RELEVANT_LIMIT", 5);

  if (!tenantId) {
    return { text: "", items: [], totalChars: 0, budgetChars };
  }

  const agentPrefix = `agent/${slugify(agentId)}/`;

  // 1) Governance pack — always.
  const governance = await prisma.kbDocument.findMany({
    where: {
      tenantId,
      OR: [
        { slug: { startsWith: "atlas-policy" } },
        { slug: { startsWith: "soul-lock" } },
        { slug: { startsWith: "audit-" } },
        { slug: { startsWith: "agent-comms" } },
      ],
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 50,
    select: { id: true, slug: true, title: true, body: true, updatedAt: true },
  });

  // 2) Agent pack — always.
  const agentDocs = await prisma.kbDocument.findMany({
    where: { tenantId, slug: { startsWith: agentPrefix } },
    orderBy: [{ slug: "asc" }],
    take: 200,
    select: { id: true, slug: true, title: true, body: true, updatedAt: true },
  });

  // 3) Relevant pack — vector-first with SQL fallback
  let relevant: typeof governance = [];
  let orgMemoryBlock = "";
  if (query && query.length >= 3) {
    try {
      // Vector search: KB docs + org memories in one Pinecone call
      const hits = await queryPinecone({
        tenantId,
        query,
        topK: relevantLimit + 5, // over-fetch to account for org-mem hits
        minScore: 0.3,
      });

      if (hits.length > 0) {
        // Split: KB doc hits vs org memory hits
        const kbDocIds = [...new Set(
          hits
            .filter(h => !h.chunkId.startsWith("org-mem-"))
            .map(h => h.documentId)
            .filter(Boolean),
        )].slice(0, relevantLimit);

        const orgHits = hits.filter(h => h.chunkId.startsWith("org-mem-"));
        if (orgHits.length > 0) {
          orgMemoryBlock = "[ORGANIZATIONAL MEMORY]\n" +
            orgHits.map(h => `- ${h.content}`).join("\n");
        }

        // Fetch full docs for KB hits
        if (kbDocIds.length > 0) {
          relevant = await prisma.kbDocument.findMany({
            where: { tenantId, id: { in: kbDocIds } },
            select: { id: true, slug: true, title: true, body: true, updatedAt: true },
          });
        }
      }
    } catch {
      // Pinecone unavailable — fall back to SQL ILIKE
    }

    // SQL fallback if vector search returned nothing
    if (relevant.length === 0) {
      relevant = await prisma.kbDocument.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
          ],
        },
        orderBy: [{ updatedAt: "desc" }],
        take: relevantLimit,
        select: { id: true, slug: true, title: true, body: true, updatedAt: true },
      });
    }

    // Also fetch org memory if vector search didn't return any
    if (!orgMemoryBlock) {
      try {
        const orgResult = await recallOrgMemory({
          tenantId, query, topK: 5, minScore: 0.35,
        });
        if (orgResult.memories.length > 0) {
          orgMemoryBlock = `[ORGANIZATIONAL MEMORY]\n${orgResult.text}`;
        }
      } catch { /* non-fatal */ }
    }
  }

  // De-dupe by doc id, and enforce priority: governance -> agent -> relevant
  const picked: Array<{ source: KbContextSource } & (typeof governance)[number]> = [];
  const seen = new Set<string>();
  for (const d of governance) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    picked.push({ ...d, source: "governance" });
  }
  for (const d of agentDocs) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    picked.push({ ...d, source: "agent" });
  }
  for (const d of relevant) {
    if (seen.has(d.id)) continue;
    // Avoid pulling massive unrelated docs when query overlaps governance/agent already handled
    seen.add(d.id);
    picked.push({ ...d, source: "relevant" });
  }

  // Bulk fetch chunks for all picked docs.
  const docIds = picked.map((d) => d.id);
  // NOTE: kb_chunks table may not exist in all deployments. Fall back to empty
  // gracefully — getKbContext will then use the document body field directly.
  let chunks: any[] = [];
  if (docIds.length) {
    try {
      chunks = (await prisma.$queryRaw`
        select id::text as id,
               document_id::text as "documentId",
               idx,
               content,
               source_updated_at as "sourceUpdatedAt"
        from kb_chunks
        where tenant_id = ${tenantId}::uuid
          and document_id = any(${docIds}::uuid[])
        order by document_id asc, idx asc
      `) as any[];
    } catch {
      // Table doesn't exist yet — fall through to body-field fallback below.
      chunks = [];
    }
  }

  const chunksByDoc = new Map<string, typeof chunks>();
  for (const c of chunks) {
    const arr = chunksByDoc.get(c.documentId) ?? [];
    arr.push(c);
    chunksByDoc.set(c.documentId, arr);
  }

  const items: KbContextItem[] = [];
  const parts: string[] = [];

  let used = 0;

  const pushBlock = (header: string, body: string) => {
    if (!body) return;
    const remaining = budgetChars - used;
    if (remaining <= 0) return;

    const combined = header + body;
    const slice = combined.length > remaining ? combined.slice(0, remaining) : combined;
    parts.push(slice);
    used += slice.length;
  };

  for (const d of picked) {
    if (used >= budgetChars) break;

    const remaining = budgetChars - used;
    if (remaining <= 0) break;

    const header =
      `\n\n[KB:${d.source.toUpperCase()}] ${d.title}\n` +
      `slug: ${d.slug}\n` +
      `---\n`;

    // Prefer fresh chunks when present
    const docChunks = chunksByDoc.get(d.id) ?? [];
    const freshChunks = docChunks.filter((c: any) => {
      // exact match is safest; DB stores timestamps with ms precision
      return new Date(c.sourceUpdatedAt).getTime() === new Date(d.updatedAt).getTime();
    });

    let content = "";
    let chunkIds: string[] | undefined = undefined;

    if (freshChunks.length) {
      const maxForDoc = Math.min(maxDocChars, remaining);
      const acc: string[] = [];
      let docUsed = 0;
      const ids: string[] = [];
      for (const c of freshChunks) {
        if (docUsed >= maxForDoc) break;
        const take = c.content.length > (maxForDoc - docUsed) ? c.content.slice(0, maxForDoc - docUsed) : c.content;
        acc.push(take);
        docUsed += take.length;
        ids.push(c.id);
      }
      content = acc.join("\n");
      chunkIds = ids;
    } else {
      // fallback to body
      const maxForDoc = Math.min(maxDocChars, remaining);
      content = (d.body ?? "").slice(0, maxForDoc);
    }

    if (!content.trim()) continue;

    pushBlock(header, content);

    const charCount = Math.min(content.length + header.length, budgetChars - (used - (content.length + header.length)));
    items.push({
      documentId: d.id,
      slug: d.slug,
      title: d.title,
      source: d.source,
      charCount: Math.min(content.length, maxDocChars),
      chunkIds,
    });
  }

  // Append org memory block if present (fits within budget)
  if (orgMemoryBlock && used < budgetChars) {
    const remaining = budgetChars - used;
    const trimmed = orgMemoryBlock.slice(0, remaining);
    parts.push("\n\n" + trimmed);
    used += trimmed.length + 2;
  }

  const text = parts.join("");

  // Optional audit: record what KB injected
  if (args.intentId && args.requestedBy) {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorUserId: null,
          actorExternalId: String(args.requestedBy ?? ""),
          actorType: "system",
          level: "info",
          action: "KB_CONTEXT_BUILT",
          entityType: "intent",
          entityId: args.intentId,
          message: `KB context built for agent ${agentId} (${items.length} items, ${used}/${budgetChars} chars)`,
          meta: { agentId, query: query ?? null, budgetChars, usedChars: used, items },
          timestamp: new Date(),
        },
      });
    } catch {
      // do not fail engine on audit errors
    }
  }

  return { text, items, totalChars: used, budgetChars };
}
