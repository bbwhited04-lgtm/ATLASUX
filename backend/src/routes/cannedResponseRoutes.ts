import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim().length ? v.trim() : null;
}

export const cannedResponseRoutes: FastifyPluginAsync = async (app) => {
  // GET / — list all canned responses, optional ?channel= filter
  app.get("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const q = (req.query as any);
    const channel = s(q.channel);

    const where: any = { tenantId };
    if (channel) {
      where.channel = channel;
    }

    const responses = await prisma.cannedResponse.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ ok: true, responses, total: responses.length });
  });

  // POST / — create a canned response
  app.post("/", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const body = (req.body ?? {}) as any;

    if (!s(body.title)) return reply.code(400).send({ ok: false, error: "title required" });
    if (!s(body.body)) return reply.code(400).send({ ok: false, error: "body required" });

    const response = await prisma.cannedResponse.create({
      data: {
        tenantId,
        title: s(body.title)!,
        body: s(body.body)!,
        channel: s(body.channel) ?? undefined,
        tags: Array.isArray(body.tags)
          ? body.tags.filter((t: unknown) => typeof t === "string")
          : [],
      },
    });

    return reply.code(201).send({ ok: true, response });
  });

  // PATCH /:id — update a canned response
  app.patch("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;
    const body = (req.body ?? {}) as any;

    const existing = await prisma.cannedResponse.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    const response = await prisma.cannedResponse.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: s(body.title) ?? existing.title } : {}),
        ...(body.body  !== undefined ? { body:  s(body.body)  ?? existing.body  } : {}),
        ...(body.channel !== undefined ? { channel: s(body.channel) ?? null } : {}),
        ...(Array.isArray(body.tags)
          ? { tags: body.tags.filter((t: unknown) => typeof t === "string") }
          : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CANNED_RESPONSE_UPDATED",
        entityType: "canned_response",
        entityId: id,
        message: `Canned response updated: ${response.title}`,
        meta: {},
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true, response });
  });

  // DELETE /:id — delete a canned response
  app.delete("/:id", async (req, reply) => {
    const tenantId = (req as any).tenantId as string | undefined;
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const { id } = req.params as any;

    const existing = await prisma.cannedResponse.findFirst({ where: { id, tenantId } });
    if (!existing) return reply.code(404).send({ ok: false, error: "Not found" });

    await prisma.cannedResponse.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "system",
        actorUserId: null,
        actorExternalId: (req as any).auth?.userId ?? null,
        level: "info",
        action: "CANNED_RESPONSE_DELETED",
        entityType: "canned_response",
        entityId: id,
        message: `Canned response deleted: ${existing.title}`,
        meta: {},
        timestamp: new Date(),
      },
    } as any).catch(() => null);

    return reply.send({ ok: true });
  });
};
