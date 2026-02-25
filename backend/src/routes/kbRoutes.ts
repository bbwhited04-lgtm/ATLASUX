import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { KbDocumentStatus } from "@prisma/client";
import { n8nWorkflows } from "../workflows/n8n/manifest.js";

const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000001";

const WRITE_ROLES = new Set(["CEO", "CRO", "CAS", "CSS"]);

function canWrite(role: unknown): boolean {
  const r = String(role ?? "").trim().toUpperCase();
  return WRITE_ROLES.has(r);
}

function slugify(input: string): string {
  const s = (input ?? "").toString().trim().toLowerCase();
  const slug = s
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || `doc-${Date.now()}`;
}

function normalizeStatus(input: any): KbDocumentStatus {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "published") return KbDocumentStatus.published;
  if (v === "archived") return KbDocumentStatus.archived;
  return KbDocumentStatus.draft;
}

type KbChunkRow = { idx: number; charStart: number; charEnd: number; content: string };

function makeChunksByChars(body: string, targetSize: number, softWindow: number): KbChunkRow[] {
  const s = body ?? "";
  const len = s.length;
  if (len === 0) return [];
  const chunks: KbChunkRow[] = [];
  let pos = 0;
  let idx = 0;

  while (pos < len) {
    let end = Math.min(pos + targetSize, len);

    // Try to end on a newline boundary for readability.
    // Prefer forward newline within softWindow; otherwise fall back to a backward newline.
    if (end < len) {
      const forward = s.indexOf("\n", end);
      if (forward !== -1 && forward - end <= softWindow) {
        end = forward + 1;
      } else {
        const back = s.lastIndexOf("\n", end);
        if (back > pos + 200) end = back + 1;
      }
    }

    if (end <= pos) end = Math.min(pos + targetSize, len);

    chunks.push({ idx, charStart: pos, charEnd: end, content: s.slice(pos, end) });
    idx++;
    pos = end;
  }

  return chunks;
}

export async function kbRoutes(app: FastifyInstance) {
  // Context endpoint for the frontend
  app.get("/context", async (req, reply) => {
    return reply.send({
      ok: true,
      tenantId: (req as any).tenantId,
      role: (req as any).tenantRole ?? "member",
      userId: (req as any).auth?.userId ?? null,
    });
  });

  // List docs
  app.get("/documents", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const q = String((req.query as any)?.q ?? "").trim();
    const statusRaw = String((req.query as any)?.status ?? "").trim();
    const tag = String((req.query as any)?.tag ?? "").trim();

    const status = statusRaw ? normalizeStatus(statusRaw) : null;

    const docs = await prisma.kbDocument.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
                { body: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(tag
          ? {
              tags: {
                some: { tag: { name: { equals: tag, mode: "insensitive" } } },
              },
            }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
      include: {
        tags: { include: { tag: true } },
      },
    });

    return reply.send({
      ok: true,
      documents: docs.map((d) => ({
        id: d.id,
        title: d.title,
        slug: d.slug,
        status: d.status,
        updatedAt: d.updatedAt,
        createdAt: d.createdAt,
        tags: d.tags.map((t) => t.tag.name),
      })),
    });
  });

  // Get one
  app.get("/documents/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const id = String((req.params as any)?.id ?? "").trim();

    const doc = await prisma.kbDocument.findFirst({
      where: { id, tenantId },
      include: { tags: { include: { tag: true } } },
    });

    if (!doc) return reply.code(404).send({ ok: false, error: "not_found" });

    // Read chunk count via SQL to avoid Prisma-client model drift in some deployments.
    const chunkCountRows = (await prisma.$queryRaw`
      select count(*)::int as count
      from kb_chunks
      where tenant_id = ${tenantId}::uuid
        and document_id = ${doc.id}::uuid
    `) as any[];
    const chunkCount = chunkCountRows?.[0]?.count ?? 0;

return reply.send({
      ok: true,
      document: {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        body: doc.body,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        tags: doc.tags.map((t) => t.tag.name),
        chunkCount,
        isChunked: chunkCount > 0,
      },
    });
  });

// Get chunks for a document (read-only)
app.get("/documents/:id/chunks", async (req, reply) => {
  const tenantId = (req as any).tenantId as string;
  const id = String((req.params as any)?.id ?? "").trim();

  const doc = await prisma.kbDocument.findFirst({
    where: { id, tenantId },
    select: { id: true, updatedAt: true },
  });
  if (!doc) return reply.code(404).send({ ok: false, error: "not_found" });

  const chunks = ((await prisma.$queryRaw`
    select idx,
           char_start as "charStart",
           char_end as "charEnd",
           content,
           source_updated_at as "sourceUpdatedAt"
    from kb_chunks
    where tenant_id = ${tenantId}::uuid
      and document_id = ${id}::uuid
    order by idx asc
    limit 2000
  `) as any[]);

  return reply.send({
    ok: true,
    documentId: id,
    sourceUpdatedAt: chunks[0]?.sourceUpdatedAt ?? null,
    chunks,
  });
});

// Regenerate chunks for a document (write roles only)
app.post("/documents/:id/chunks/regenerate", async (req, reply) => {
  const tenantId = (req as any).tenantId as string;
  const role = (req as any).tenantRole;
  const userId = (req as any).auth?.userId as string | undefined;
  const id = String((req.params as any)?.id ?? "").trim();

  if (!canWrite(role)) {
    return reply.code(403).send({ ok: false, error: "role_cannot_write_kb" });
  }
  if (!userId) {
    return reply.code(401).send({ ok: false, error: "missing_user" });
  }

  const doc = await prisma.kbDocument.findFirst({
    where: { id, tenantId },
    select: { id: true, body: true, updatedAt: true, title: true, slug: true },
  });
  if (!doc) return reply.code(404).send({ ok: false, error: "not_found" });

  const targetSize = Number((req.body as any)?.chunkSize ?? process.env.KB_CHUNK_SIZE ?? 4000);
  const softWindow = Number((req.body as any)?.softWindow ?? process.env.KB_CHUNK_SOFT_WINDOW ?? 600);

  const body = doc.body ?? "";
  const chunks = makeChunksByChars(body, targetSize, softWindow);

  await prisma.$transaction(async (tx) => {
    // Delete existing chunks
    await tx.$executeRaw`
      delete from kb_chunks
      where tenant_id = ${tenantId}::uuid
        and document_id = ${id}::uuid
    `;

    if (chunks.length > 0) {
      const now = new Date();
      // Insert new chunks (row-by-row keeps this simple and safe for alpha)
      for (const c of chunks) {
        await tx.$executeRaw`
          insert into kb_chunks
            (tenant_id, document_id, idx, char_start, char_end, content, source_updated_at, created_at, updated_at)
          values
            (${tenantId}::uuid, ${id}::uuid, ${c.idx}, ${c.charStart}, ${c.charEnd}, ${c.content}, ${doc.updatedAt}, now(), ${now})
        `;
      }
    }

    // Touch the document updatedBy for audit trace
    await tx.kbDocument.update({
      where: { id },
      data: { updatedBy: userId },
    });
  });

  return reply.send({
    ok: true,
    documentId: id,
    chunksWritten: chunks.length,
    chunkSize: targetSize,
    softWindow,
  });
});

  // Create
  app.post("/documents", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const role = (req as any).tenantRole;
    const userId = (req as any).auth?.userId as string | undefined;

    if (!canWrite(role)) {
      return reply.code(403).send({ ok: false, error: "role_cannot_write_kb" });
    }
    if (!userId) {
      return reply.code(401).send({ ok: false, error: "missing_user" });
    }

    const body = req.body as any;
    const title = String(body?.title ?? "").trim();
    const content = String(body?.body ?? "").trim();
    const status = normalizeStatus(body?.status);
    const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];

    if (!title) return reply.code(400).send({ ok: false, error: "missing_title" });

    const slug = slugify(body?.slug ? String(body.slug) : title);

    // upsert tags then connect
    const created = await prisma.$transaction(async (tx) => {
      const doc = await tx.kbDocument.create({
        data: {
          tenantId,
          title,
          slug,
          body: content,
          status,
          createdBy: userId,
        },
      });

      for (const name of tags.slice(0, 25)) {
        const tagRow = await tx.kbTag.upsert({
          where: { tenantId_name: { tenantId, name } },
          create: { tenantId, name },
          update: {},
        });

        await tx.kbTagOnDocument.upsert({
          where: { documentId_tagId: { documentId: doc.id, tagId: tagRow.id } },
          create: { documentId: doc.id, tagId: tagRow.id },
          update: {},
        });
      }

      return doc;
    });

    return reply.send({ ok: true, id: created.id });
  });

  // ── Version history ────────────────────────────────────────────────────────

  // List versions (no body to keep response small)
  app.get("/documents/:id/versions", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const id = String((req.params as any)?.id ?? "").trim();

    const doc = await prisma.kbDocument.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!doc) return reply.code(404).send({ ok: false, error: "not_found" });

    const versions = await prisma.kbDocumentVersion.findMany({
      where: { documentId: id, tenantId },
      select: { id: true, versionNum: true, editedBy: true, editedAt: true, changeSummary: true, title: true },
      orderBy: { versionNum: "desc" },
    });

    return reply.send({ ok: true, documentId: id, versions });
  });

  // Get a specific version by versionNum (includes body)
  app.get("/documents/:id/versions/:vnum", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const id   = String((req.params as any)?.id   ?? "").trim();
    const vnum = parseInt(String((req.params as any)?.vnum ?? ""), 10);

    if (isNaN(vnum)) return reply.code(400).send({ ok: false, error: "invalid_version_number" });

    const doc = await prisma.kbDocument.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!doc) return reply.code(404).send({ ok: false, error: "not_found" });

    const version = await prisma.kbDocumentVersion.findFirst({
      where: { documentId: id, tenantId, versionNum: vnum },
    });

    if (!version) return reply.code(404).send({ ok: false, error: "version_not_found" });

    return reply.send({ ok: true, version });
  });

  // Manually snapshot current doc body as a new version
  app.post("/documents/:id/versions/snapshot", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const role     = (req as any).tenantRole;
    const userId   = (req as any).auth?.userId as string | undefined;
    const id       = String((req.params as any)?.id ?? "").trim();

    if (!canWrite(role)) return reply.code(403).send({ ok: false, error: "role_cannot_write_kb" });
    if (!userId)         return reply.code(401).send({ ok: false, error: "missing_user" });

    const body = (req.body as any) ?? {};
    const changeSummary = body.changeSummary != null ? String(body.changeSummary) : null;

    const version = await prisma.$transaction(async (tx) => {
      const doc = await tx.kbDocument.findFirst({ where: { id, tenantId } });
      if (!doc) return null;

      const agg = await tx.kbDocumentVersion.aggregate({
        where: { documentId: id, tenantId },
        _max: { versionNum: true },
      });
      const nextNum = (agg._max.versionNum ?? 0) + 1;

      return tx.kbDocumentVersion.create({
        data: {
          tenantId,
          documentId: id,
          title:         doc.title,
          body:          doc.body ?? "",
          editedBy:      userId,
          versionNum:    nextNum,
          ...(changeSummary != null ? { changeSummary } : {}),
        },
      });
    });

    if (!version) return reply.code(404).send({ ok: false, error: "not_found" });

    return reply.send({ ok: true, version });
  });

  // Update
  app.patch("/documents/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const role = (req as any).tenantRole;
    const userId = (req as any).auth?.userId as string | undefined;
    const id = String((req.params as any)?.id ?? "").trim();

    if (!canWrite(role)) {
      return reply.code(403).send({ ok: false, error: "role_cannot_write_kb" });
    }
    if (!userId) {
      return reply.code(401).send({ ok: false, error: "missing_user" });
    }

    const body = req.body as any;
    const title = body?.title != null ? String(body.title).trim() : null;
    const content = body?.body != null ? String(body.body) : null;
    const status = body?.status != null ? normalizeStatus(body.status) : null;
    const slug = body?.slug != null ? slugify(String(body.slug)) : null;
    const tags = body?.tags != null
      ? (Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [])
      : null;

    // Snapshot before edit if body or title is changing
    const needsSnapshot = content != null || title != null;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.kbDocument.findFirst({ where: { id, tenantId } });
      if (!existing) return null;

      // Auto-snapshot BEFORE applying changes
      if (needsSnapshot) {
        const agg = await tx.kbDocumentVersion.aggregate({
          where: { documentId: id, tenantId },
          _max: { versionNum: true },
        });
        const nextNum = (agg._max.versionNum ?? 0) + 1;
        await tx.kbDocumentVersion.create({
          data: {
            tenantId,
            documentId:   id,
            title:        existing.title,
            body:         existing.body ?? "",
            editedBy:     userId,
            versionNum:   nextNum,
            changeSummary: "auto-snapshot before edit",
          },
        });
      }

      const doc = await tx.kbDocument.update({
        where: { id },
        data: {
          ...(title ? { title } : {}),
          ...(slug ? { slug } : {}),
          ...(content != null ? { body: content } : {}),
          ...(status ? { status } : {}),
          updatedBy: userId,
        },
      });

      if (tags) {
        // reset tags
        await tx.kbTagOnDocument.deleteMany({ where: { documentId: id } });

        for (const name of tags.slice(0, 25)) {
          const tagRow = await tx.kbTag.upsert({
            where: { tenantId_name: { tenantId, name } },
            create: { tenantId, name },
            update: {},
          });

          await tx.kbTagOnDocument.upsert({
            where: { documentId_tagId: { documentId: id, tagId: tagRow.id } },
            create: { documentId: id, tagId: tagRow.id },
            update: {},
          });
        }
      }

      return doc;
    });

    if (!updated) return reply.code(404).send({ ok: false, error: "not_found" });

    return reply.send({ ok: true });
  });

  // Delete (soft delete is safer; keep hard delete for now, gated by roles)
  app.delete("/documents/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const role = (req as any).tenantRole;
    const id = String((req.params as any)?.id ?? "").trim();

    if (!canWrite(role)) {
      return reply.code(403).send({ ok: false, error: "role_cannot_write_kb" });
    }

    await prisma.kbDocument.deleteMany({ where: { id, tenantId } });

    return reply.send({ ok: true });
  });

  // ── Atlas KB Seeder ────────────────────────────────────────────────────────
  // POST /v1/kb/seed-atlas — seeds all workflow definitions into KB so Atlas can find them.
  // Does an upsert by slug so re-running is safe.
  app.post("/seed-atlas", async (req, reply) => {
    const body = req.body as any;
    // Accept tenantId from plugin, query param, or request body (for direct curl calls)
    const tenantId: string =
      (req as any).tenantId ||
      String((req.query as any)?.tenantId ?? "").trim() ||
      String(body?.tenantId ?? "").trim();

    if (!tenantId) {
      return reply.code(400).send({ ok: false, error: "tenantId_required" });
    }

    // Upsert the atlas-workflow tag once
    const wfTag = await prisma.kbTag.upsert({
      where: { tenantId_name: { tenantId, name: "atlas-workflow" } },
      create: { tenantId, name: "atlas-workflow" },
      update: {},
    });

    let seeded = 0;
    let skipped = 0;

    for (const wf of n8nWorkflows) {
      const slug = `atlas-wf-${wf.id.toLowerCase()}`;
      const body = [
        `# ${wf.name}`,
        ``,
        `**ID:** ${wf.id}`,
        `**Category:** ${wf.category}`,
        `**Owner Agent:** ${wf.ownerAgent}`,
        `**Trigger:** ${wf.trigger}`,
        `**Human-in-Loop:** ${wf.humanInLoop ? "Yes" : "No"}`,
        ``,
        `## Description`,
        ``,
        wf.description,
        ``,
        `## File`,
        ``,
        `\`${wf.file}\``,
      ].join("\n");

      try {
        // Check if already exists
        const existing = await prisma.kbDocument.findFirst({
          where: { tenantId, slug },
          select: { id: true },
        });

        if (existing) {
          await prisma.kbDocument.update({
            where: { id: existing.id },
            data: { title: wf.name, body, status: KbDocumentStatus.published, updatedBy: SYSTEM_ACTOR },
          });
          skipped++;
        } else {
          const doc = await prisma.kbDocument.create({
            data: {
              tenantId,
              title: wf.name,
              slug,
              body,
              status: KbDocumentStatus.published,
              createdBy: SYSTEM_ACTOR,
            },
          });

          await prisma.kbTagOnDocument.upsert({
            where: { documentId_tagId: { documentId: doc.id, tagId: wfTag.id } },
            create: { documentId: doc.id, tagId: wfTag.id },
            update: {},
          });

          // Category tag
          const catTag = await prisma.kbTag.upsert({
            where: { tenantId_name: { tenantId, name: wf.category } },
            create: { tenantId, name: wf.category },
            update: {},
          });
          await prisma.kbTagOnDocument.upsert({
            where: { documentId_tagId: { documentId: doc.id, tagId: catTag.id } },
            create: { documentId: doc.id, tagId: catTag.id },
            update: {},
          });

          seeded++;
        }
      } catch (err) {
        // Non-fatal — log and continue
        console.error(`KB seed failed for ${wf.id}:`, err);
      }
    }

    return reply.send({
      ok: true,
      seeded,
      updated: skipped,
      total: n8nWorkflows.length,
    });
  });
}
