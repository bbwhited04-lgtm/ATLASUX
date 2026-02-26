import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { Prisma } from "@prisma/client";

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

const ACTIVITY_TYPES = ["email", "call", "note", "meeting", "mention", "sms"] as const;
type ActivityType = typeof ACTIVITY_TYPES[number];

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

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CRM_CONTACT_UPDATED",
        entityType: "crm_contact",
        entityId: id,
        message: `Contact updated: ${id}`,
        meta: {},
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, contact: updated });
  });

  app.delete("/contacts/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const existing = await prisma.crmContact.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.crmContact.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CRM_CONTACT_DELETED",
        entityType: "crm_contact",
        entityId: id,
        message: `Contact deleted: ${id}`,
        meta: {},
        timestamp: new Date(),
      },
    } as any).catch(() => null);

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

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CRM_CONTACTS_BULK_DELETED",
        entityType: "crm_contact",
        entityId: ids.join(",").slice(0, 200),
        message: `Bulk deleted ${count} contacts`,
        meta: { ids, count },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

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

  // ── Contact Activities ─────────────────────────────────────────────────────

  app.get("/contacts/:id/activities", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;

    const contact = await prisma.crmContact.findFirst({ where: { id, tenantId } });
    if (!contact) return reply.code(404).send({ ok: false, error: "Not found" });

    const activities = await prisma.contactActivity.findMany({
      where: { contactId: id, tenantId },
      orderBy: { occurredAt: "desc" },
      take: 100,
    });

    return reply.send({ ok: true, activities });
  });

  app.post("/contacts/:id/activities", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const body = (req.body ?? {}) as any;

    const contact = await prisma.crmContact.findFirst({ where: { id, tenantId } });
    if (!contact) return reply.code(404).send({ ok: false, error: "Not found" });

    const type = s(body.type);
    if (!type || !(ACTIVITY_TYPES as readonly string[]).includes(type)) {
      return reply.code(400).send({
        ok: false,
        error: `type must be one of: ${ACTIVITY_TYPES.join(", ")}`,
      });
    }

    const activity = await prisma.contactActivity.create({
      data: {
        tenantId,
        contactId: id,
        type: type as ActivityType,
        subject: s(body.subject) ?? undefined,
        body: s(body.body) ?? undefined,
        meta: body.meta ?? Prisma.DbNull,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
      },
    });

    return reply.code(201).send({ ok: true, activity });
  });

  app.delete("/activities/:activityId", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { activityId } = req.params as any;
    const existing = await prisma.contactActivity.findFirst({ where: { id: activityId, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.contactActivity.delete({ where: { id: activityId } });
    return reply.send({ ok: true });
  });

  // ── Segments ───────────────────────────────────────────────────────────────

  app.get("/segments", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const segments = await prisma.crmSegment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ ok: true, segments });
  });

  app.post("/segments", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    if (!s(body.name)) return reply.code(400).send({ ok: false, error: "name required" });

    const segment = await prisma.crmSegment.create({
      data: {
        tenantId,
        name: s(body.name)!,
        description: s(body.description) ?? undefined,
        filters: body.filters ?? {},
      },
    });

    return reply.code(201).send({ ok: true, segment });
  });

  app.patch("/segments/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const body = (req.body ?? {}) as any;

    const existing = await prisma.crmSegment.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    const segment = await prisma.crmSegment.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: s(body.name) ?? existing.name } : {}),
        ...(body.description !== undefined ? { description: s(body.description) ?? undefined } : {}),
        ...(body.filters !== undefined ? { filters: body.filters } : {}),
      },
    });

    return reply.send({ ok: true, segment });
  });

  app.delete("/segments/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const existing = await prisma.crmSegment.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.crmSegment.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  app.get("/segments/:id/contacts", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const segment = await prisma.crmSegment.findFirst({ where: { id, tenantId } });
    if (!segment) return reply.code(404).send({ ok: false, error: "Not found" });

    const filters = (segment.filters ?? {}) as any;

    const where: any = { tenantId };

    if (filters.q && typeof filters.q === "string" && filters.q.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName:  { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
        { company:   { contains: q, mode: "insensitive" } },
        { phone:     { contains: q, mode: "insensitive" } },
      ];
    }

    if (Array.isArray(filters.tags) && filters.tags.length) {
      where.tags = { hasEvery: filters.tags };
    }

    if (filters.source && typeof filters.source === "string") {
      where.source = { equals: filters.source, mode: "insensitive" };
    }

    if (filters.company && typeof filters.company === "string") {
      where.company = { contains: filters.company, mode: "insensitive" };
    }

    const contacts = await prisma.crmContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ ok: true, contacts, total: contacts.length });
  });

  // ── CSV Import ────────────────────────────────────────────────────────────

  app.post("/contacts/import-csv", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    const rows: any[] = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) return reply.code(400).send({ ok: false, error: "No rows provided" });
    if (rows.length > 5000) return reply.code(400).send({ ok: false, error: "Max 5000 rows per import" });

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const firstName = s(row.firstName ?? row.first_name ?? row["First Name"] ?? row["First"]);
      const lastName  = s(row.lastName ?? row.last_name ?? row["Last Name"] ?? row["Last"]);
      const email     = s(row.email ?? row.Email ?? row["E-mail"] ?? row["Email Address"] ?? row["E-mail Address"]);
      const phone     = s(row.phone ?? row.Phone ?? row["Phone Number"] ?? row["Phone number"]);
      const company   = s(row.company ?? row.Company ?? row["Organization"] ?? row["Company Name"]);
      const notes     = s(row.notes ?? row.Notes ?? row["Note"]);

      if (!email && !phone && !firstName && !lastName) {
        skipped++;
        continue;
      }

      try {
        await prisma.crmContact.create({
          data: {
            tenantId,
            firstName: firstName ?? undefined,
            lastName:  lastName  ?? undefined,
            email:     email     ?? undefined,
            phone:     phone     ?? undefined,
            company:   company   ?? undefined,
            notes:     notes     ?? undefined,
            source:    "csv",
            tags:      [],
          },
        });
        created++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err?.message?.slice(0, 80) ?? "unknown error"}`);
        skipped++;
      }
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CRM_CSV_IMPORTED",
        entityType: "crm_contact",
        entityId: null,
        message: `CSV import: ${created} created, ${skipped} skipped`,
        meta: { created, skipped, totalRows: rows.length, errorCount: errors.length },
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, created, skipped, errors: errors.slice(0, 10) });
  });

  // ── Deduplication ──────────────────────────────────────────────────────────

  app.get("/contacts/duplicates", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    // Find emails that appear more than once
    const emailDups = await prisma.$queryRaw<{ email: string }[]>`
      SELECT email
      FROM crm_contacts
      WHERE tenant_id = ${tenantId}::uuid
        AND email IS NOT NULL
        AND email <> ''
      GROUP BY email
      HAVING COUNT(*) > 1
    `;

    // Find phones that appear more than once
    const phoneDups = await prisma.$queryRaw<{ phone: string }[]>`
      SELECT phone
      FROM crm_contacts
      WHERE tenant_id = ${tenantId}::uuid
        AND phone IS NOT NULL
        AND phone <> ''
      GROUP BY phone
      HAVING COUNT(*) > 1
    `;

    const groups: { field: string; value: string; contacts: any[] }[] = [];

    for (const row of emailDups) {
      const contacts = await prisma.crmContact.findMany({
        where: { tenantId, email: row.email },
        orderBy: { createdAt: "asc" },
      });
      groups.push({ field: "email", value: row.email, contacts });
    }

    for (const row of phoneDups) {
      const contacts = await prisma.crmContact.findMany({
        where: { tenantId, phone: row.phone },
        orderBy: { createdAt: "asc" },
      });
      groups.push({ field: "phone", value: row.phone, contacts });
    }

    return reply.send({ ok: true, groups });
  });

  app.post("/contacts/merge", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;
    const keepId: string = body.keepId;
    const mergeIds: string[] = Array.isArray(body.mergeIds) ? body.mergeIds : [];

    if (!keepId) return reply.code(400).send({ ok: false, error: "keepId required" });
    if (!mergeIds.length) return reply.code(400).send({ ok: false, error: "mergeIds[] required" });

    const keepContact = await prisma.crmContact.findFirst({ where: { id: keepId, tenantId } });
    if (!keepContact) return reply.code(404).send({ ok: false, error: "keepId contact not found" });

    const mergedContacts = await prisma.crmContact.findMany({
      where: { tenantId, id: { in: mergeIds } },
    });

    if (mergedContacts.length !== mergeIds.length) {
      return reply.code(404).send({ ok: false, error: "One or more mergeIds not found" });
    }

    // Union all tags
    const allTags = new Set<string>([...keepContact.tags]);
    for (const c of mergedContacts) {
      for (const t of c.tags) allTags.add(t);
    }

    await prisma.$transaction([
      prisma.crmContact.update({
        where: { id: keepId },
        data: { tags: Array.from(allTags) },
      }),
      prisma.crmContact.deleteMany({
        where: { tenantId, id: { in: mergeIds } },
      }),
    ]);

    const contact = await prisma.crmContact.findUnique({ where: { id: keepId } });
    return reply.send({ ok: true, contact, mergedCount: mergeIds.length });
  });
};
