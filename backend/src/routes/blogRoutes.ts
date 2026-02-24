import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { KbDocumentStatus } from "@prisma/client";

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
    const body = req.body as any;

    const tid = tenantId || q.org_id || q.orgId || null;
    if (!tid || !isUUID(tid)) {
      return reply.code(400).send({ ok: false, error: "tenantId_required" });
    }

    const title = String(body?.title ?? "").trim();
    const content = String(body?.body ?? body?.content ?? "").trim();
    const category = String(body?.category ?? "Updates").trim();
    const publish = body?.publish !== false;

    if (!title) return reply.code(400).send({ ok: false, error: "missing_title" });
    if (!content) return reply.code(400).send({ ok: false, error: "missing_body" });

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

    return reply.send({ ok: true, id: created.id, slug: created.slug });
  });
};
