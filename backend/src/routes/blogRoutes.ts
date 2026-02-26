import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { KbDocumentStatus } from "@prisma/client";

const BlogPostSchema = z.object({
  title:            z.string().min(1).max(500),
  body:             z.string().min(1).optional(),
  content:          z.string().min(1).optional(),
  category:         z.string().max(100).optional(),
  publish:          z.boolean().optional(),
  slug:             z.string().max(120).optional(),
  featuredImageUrl: z.string().max(2000).optional(),
}).refine(d => d.body || d.content, { message: "body or content required" });

// System actor UUID used in alpha when no auth user is present.
// No FK constraint on createdBy so any valid UUID is accepted.
const SYSTEM_ACTOR = "00000000-0000-0000-0000-000000000001";

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function slugify(input: string): string {
  const s = (input ?? "").toString().trim().toLowerCase();
  const slug = s
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || `post-${Date.now()}`;
}

export const blogRoutes: FastifyPluginAsync = async (app) => {
  // GET /v1/blog/posts/:slug — fetch a single published post by slug
  app.get("/posts/:slug", async (req, reply) => {
    const { slug } = req.params as { slug: string };
    if (!slug) return reply.code(400).send({ ok: false, error: "slug_required" });

    const doc = await prisma.kbDocument.findFirst({
      where: {
        slug,
        status: KbDocumentStatus.published,
        tags: { some: { tag: { name: "blog-post" } } },
      },
      include: { tags: { include: { tag: true } } },
    });

    if (!doc) return reply.code(404).send({ ok: false, error: "not_found" });

    const category = doc.tags
      .map((t) => t.tag.name)
      .filter((n) => n !== "blog-post")
      .find(Boolean) ?? "Updates";

    return reply.send({
      ok: true,
      post: {
        id: doc.id,
        slug: doc.slug,
        title: doc.title,
        body: doc.body,
        featuredImageUrl: (doc as any).featuredImageUrl ?? null,
        category,
        excerpt: doc.body.slice(0, 220).replace(/#+\s/g, "").trim(),
        date: doc.createdAt.toISOString().slice(0, 10),
        status: doc.status,
        tags: doc.tags.map((t) => t.tag.name).filter((n) => n !== "blog-post"),
      },
    });
  });

  // GET /v1/blog/posts — list published blog posts (tenant-scoped or all-public)
  app.get("/posts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    const q = (req.query as any) ?? {};
    const tid = tenantId || q.org_id || q.orgId || null;

    // If no tenantId, return ALL published blog posts (public blog)
    const whereClause = (tid && isUUID(tid))
      ? { tenantId: tid, tags: { some: { tag: { name: "blog-post" } } } }
      : {
          status: KbDocumentStatus.published,
          tags: { some: { tag: { name: "blog-post" } } },
        };

    const docs = await prisma.kbDocument.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { tags: { include: { tag: true } } },
    });

    const posts = docs.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
      featuredImageUrl: (d as any).featuredImageUrl ?? null,
      category: d.tags
        .map((t) => t.tag.name)
        .filter((n) => n !== "blog-post")
        .find(Boolean) ?? "Updates",
      excerpt: d.body.slice(0, 220).replace(/#+\s/g, "").trim(),
      date: d.createdAt.toISOString().slice(0, 10),
      status: d.status,
    }));

    return reply.send({ ok: true, items: posts, posts });
  });

  // POST /v1/blog/posts — publish a new blog post (stored in KB)
  app.post("/posts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    const q = (req.query as any) ?? {};

    const tid = tenantId || q.org_id || q.orgId || null;
    if (!tid || !isUUID(tid)) {
      return reply.code(400).send({ ok: false, error: "tenantId_required" });
    }

    let parsed: z.infer<typeof BlogPostSchema>;
    try { parsed = BlogPostSchema.parse(req.body ?? {}); }
    catch (e: any) { return reply.code(400).send({ ok: false, error: "INVALID_BODY", details: e.errors }); }

    const title = parsed.title.trim();
    const content = (parsed.body ?? parsed.content ?? "").trim();
    const category = (parsed.category ?? "Updates").trim();
    const publish = parsed.publish !== false;
    const featuredImageUrl = parsed.featuredImageUrl?.trim() || null;

    // Ensure slug is unique per tenant by appending timestamp if needed
    const baseSlug = slugify(parsed.slug ? String(parsed.slug) : title);
    const slug = `${baseSlug}-${Date.now()}`;

    const created = await prisma.$transaction(async (tx) => {
      // Upsert the blog-post tag
      const blogTag = await tx.kbTag.upsert({
        where: { tenantId_name: { tenantId: tid, name: "blog-post" } },
        create: { tenantId: tid, name: "blog-post" },
        update: {},
      });

      // Create the KB document
      const doc = await tx.kbDocument.create({
        data: {
          tenantId: tid,
          title,
          slug,
          body: content,
          featuredImageUrl,
          status: publish ? KbDocumentStatus.published : KbDocumentStatus.draft,
          createdBy: SYSTEM_ACTOR,
        },
      });

      // Link blog-post tag
      await tx.kbTagOnDocument.create({
        data: { documentId: doc.id, tagId: blogTag.id },
      });

      // Link category as a tag too
      if (category) {
        const catName = category.toLowerCase();
        const catTag = await tx.kbTag.upsert({
          where: { tenantId_name: { tenantId: tid, name: catName } },
          create: { tenantId: tid, name: catName },
          update: {},
        });
        await tx.kbTagOnDocument.upsert({
          where: { documentId_tagId: { documentId: doc.id, tagId: catTag.id } },
          create: { documentId: doc.id, tagId: catTag.id },
          update: {},
        });
      }

      return doc;
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tid,
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: null,
        level: "info",
        action: publish ? "BLOG_POST_PUBLISHED" : "BLOG_POST_DRAFTED",
        entityType: "kb_document",
        entityId: created.id,
        message: `Blog post ${publish ? "published" : "drafted"}: "${title.slice(0, 80)}"`,
        meta: { slug: created.slug, category, publish },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, id: created.id, slug: created.slug });
  });

  // PATCH /v1/blog/posts/:id — update an existing blog post
  app.patch("/posts/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId || !isUUID(tenantId)) {
      return reply.code(400).send({ ok: false, error: "tenantId_required" });
    }

    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as any;

    const existing = await prisma.kbDocument.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "not_found" });

    const data: any = {};
    if (body.title !== undefined) data.title = String(body.title).trim();
    if (body.body !== undefined || body.content !== undefined) {
      data.body = String(body.body ?? body.content ?? "").trim();
    }
    if (body.featuredImageUrl !== undefined) {
      data.featuredImageUrl = body.featuredImageUrl?.trim() || null;
    }
    if (body.publish !== undefined) {
      data.status = body.publish ? KbDocumentStatus.published : KbDocumentStatus.draft;
    }
    if (body.excerpt !== undefined) {
      // excerpt is derived, not stored — ignore
    }

    const updated = await prisma.kbDocument.update({ where: { id }, data });

    // Update category tag if provided
    if (body.category) {
      const catName = String(body.category).toLowerCase().trim();
      const catTag = await prisma.kbTag.upsert({
        where: { tenantId_name: { tenantId, name: catName } },
        create: { tenantId, name: catName },
        update: {},
      });
      // Remove old non-"blog-post" tags and add the new category
      const existingTags = await prisma.kbTagOnDocument.findMany({
        where: { documentId: id },
        include: { tag: true },
      });
      for (const t of existingTags) {
        if (t.tag.name !== "blog-post") {
          await prisma.kbTagOnDocument.delete({
            where: { documentId_tagId: { documentId: id, tagId: t.tagId } },
          }).catch(() => null);
        }
      }
      await prisma.kbTagOnDocument.upsert({
        where: { documentId_tagId: { documentId: id, tagId: catTag.id } },
        create: { documentId: id, tagId: catTag.id },
        update: {},
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: null,
        level: "info",
        action: "BLOG_POST_UPDATED",
        entityType: "kb_document",
        entityId: id,
        message: `Blog post updated: "${(data.title ?? existing.title).slice(0, 80)}"`,
        meta: { slug: existing.slug },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, id: updated.id, slug: updated.slug });
  });

  // DELETE /v1/blog/posts/:id — delete a blog post
  app.delete("/posts/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId || !isUUID(tenantId)) {
      return reply.code(400).send({ ok: false, error: "tenantId_required" });
    }

    const { id } = req.params as { id: string };

    const existing = await prisma.kbDocument.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "not_found" });

    // Remove tag associations first, then the document
    await prisma.kbTagOnDocument.deleteMany({ where: { documentId: id } });
    await prisma.kbDocument.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: (req as any).auth?.userId ?? null,
        actorExternalId: null,
        level: "info",
        action: "BLOG_POST_DELETED",
        entityType: "kb_document",
        entityId: id,
        message: `Blog post deleted: "${existing.title.slice(0, 80)}"`,
        meta: { slug: existing.slug },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true });
  });
};
