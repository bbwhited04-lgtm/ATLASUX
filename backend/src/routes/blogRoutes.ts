import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { KbDocumentStatus } from "@prisma/client";

const BlogPostSchema = z.object({
  title:    z.string().min(1).max(500),
  body:     z.string().min(1).optional(),
  content:  z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  publish:  z.boolean().optional(),
  slug:     z.string().max(120).optional(),
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
  // GET /v1/blog/posts — list published blog posts for this tenant
  app.get("/posts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    const q = (req.query as any) ?? {};
    const tid = tenantId || q.org_id || q.orgId || null;

    if (!tid || !isUUID(tid)) {
      return reply.send({ ok: true, items: [], posts: [] });
    }

    const docs = await prisma.kbDocument.findMany({
      where: {
        tenantId: tid,
        tags: { some: { tag: { name: "blog-post" } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { tags: { include: { tag: true } } },
    });

    const posts = docs.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title,
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

    // Ensure slug is unique per tenant by appending timestamp if needed
    const baseSlug = slugify(body?.slug ? String(body.slug) : title);
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
};
