import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

export const crmRoutes: FastifyPluginAsync = async (app) => {
  // ── Contacts ──────────────────────────────────────────────────────────────

  app.get("/contacts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const search = s(q.q);
    const limit = Math.min(Number(q.limit ?? 200), 500);
    const offset = Number(q.offset ?? 0);

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName:  { contains: search, mode: "insensitive" } },
        { email:     { contains: search, mode: "insensitive" } },
        { company:   { contains: search, mode: "insensitive" } },
        { phone:     { contains: search, mode: "insensitive" } },
      ];
    }

    const [contacts, total] = await Promise.all([
      prisma.crmContact.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      prisma.crmContact.count({ where }),
    ]);

    return reply.send({ ok: true, contacts, total });
  });

  app.post("/contacts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    const contact = await prisma.crmContact.create({
      data: {
        tenantId,
        firstName: s(body.firstName) ?? undefined,
        lastName:  s(body.lastName)  ?? undefined,
        email:     s(body.email)     ?? undefined,
        phone:     s(body.phone)     ?? undefined,
        company:   s(body.company)   ?? undefined,
        source:    s(body.source)    ?? "manual",
        notes:     s(body.notes)     ?? undefined,
        tags:      Array.isArray(body.tags) ? body.tags.filter((t: any) => typeof t === "string") : [],
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CRM_CONTACT_CREATED",
        entityType: "crm_contact",
        entityId: contact.id,
        message: `Contact created: ${[body.firstName, body.lastName].filter(Boolean).join(" ") || body.email || "unnamed"}`,
        meta: { source: contact.source },
        timestamp: new Date(),
      },
    }).catch(() => null);

    return reply.code(201).send({ ok: true, contact });
  });

  app.patch("/contacts/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const body = (req.body ?? {}) as any;

    const existing = await prisma.crmContact.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    const updated = await prisma.crmContact.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined ? { firstName: s(body.firstName) ?? undefined } : {}),
        ...(body.lastName  !== undefined ? { lastName:  s(body.lastName)  ?? undefined } : {}),
        ...(body.email     !== undefined ? { email:     s(body.email)     ?? undefined } : {}),
        ...(body.phone     !== undefined ? { phone:     s(body.phone)     ?? undefined } : {}),
        ...(body.company   !== undefined ? { company:   s(body.company)   ?? undefined } : {}),
        ...(body.notes     !== undefined ? { notes:     s(body.notes)     ?? undefined } : {}),
        ...(Array.isArray(body.tags)     ? { tags: body.tags.filter((t: any) => typeof t === "string") } : {}),
      },
    });

    return reply.send({ ok: true, contact: updated });
  });

  app.delete("/contacts/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const existing = await prisma.crmContact.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.crmContact.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  // Bulk delete
  app.delete("/contacts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length) return reply.code(400).send({ ok: false, error: "ids[] required" });

    const { count } = await prisma.crmContact.deleteMany({ where: { tenantId, id: { in: ids } } });
    return reply.send({ ok: true, deleted: count });
  });

  // ── Companies ─────────────────────────────────────────────────────────────

  app.get("/companies", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const search = s(q.q);
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name:     { contains: search, mode: "insensitive" } },
        { domain:   { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.crmCompany.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.crmCompany.count({ where }),
    ]);

    return reply.send({ ok: true, companies, total });
  });

  app.post("/companies", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    if (!s(body.name)) return reply.code(400).send({ ok: false, error: "name required" });

    const company = await prisma.crmCompany.create({
      data: {
        tenantId,
        name:     s(body.name)!,
        domain:   s(body.domain)   ?? undefined,
        industry: s(body.industry) ?? undefined,
        notes:    s(body.notes)    ?? undefined,
      },
    });

    return reply.code(201).send({ ok: true, company });
  });

  app.delete("/companies/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const existing = await prisma.crmCompany.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.crmCompany.delete({ where: { id } });
    return reply.send({ ok: true });
  });
};
