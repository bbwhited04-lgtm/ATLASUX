import type { FastifyPluginAsync } from "fastify";
import { prisma, withTenant } from "../db/prisma.js";
import { TicketCategory, TicketSeverity, TicketStatus } from "@prisma/client";

// Lightweight beta ticketing (NOT a full helpdesk).
// Goal: structured feedback + traceability tied to runs.

export const ticketsRoutes: FastifyPluginAsync = async (app) => {
  const asEnum = <T extends Record<string, string>>(e: T, v: unknown): T[keyof T] | undefined => {
    if (typeof v !== "string") return undefined;
    return (Object.values(e) as string[]).includes(v) ? (v as T[keyof T]) : undefined;
  };

  // Create ticket
  app.post("/", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const title = String(body.title ?? "").trim();
    if (!title) return reply.code(400).send({ ok: false, error: "title required" });

    const ticket = await withTenant(tenantId, async (tx) =>
      tx.ticket.create({
        data: {
          tenantId,
          reporterUserId: body.reporterUserId ? String(body.reporterUserId) : null,
          runId: body.runId ? String(body.runId) : null,
          agent: body.agent ? String(body.agent) : null,
          title,
          description: body.description ? String(body.description) : null,
	          category: asEnum(TicketCategory, body.category),
	          severity: asEnum(TicketSeverity, body.severity),
	          status: asEnum(TicketStatus, body.status),
          meta: body.meta ?? undefined,
        },
      })
    );

    return reply.send({ ok: true, ticket });
  });

  // List tickets
  app.get("/", async (req, reply) => {
    const q = (req.query as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });

    const where: any = { tenantId };
    if (q.status) where.status = String(q.status);
    if (q.severity) where.severity = String(q.severity);
    if (q.category) where.category = String(q.category);
    if (q.agent) where.agent = String(q.agent);
    if (q.runId) where.runId = String(q.runId);

    const take = Math.min(Number(q.take ?? 50), 200);
    const tickets = await withTenant(tenantId, async (tx) =>
      tx.ticket.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
      })
    );
    return reply.send({ ok: true, tickets });
  });

  // Get one ticket (+ optional comments)
  app.get("/:id", async (req, reply) => {
    const q = (req.query as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const id = String((req.params as any).id);

    const includeComments = String(q.includeComments ?? "false").toLowerCase() === "true";
    const ticket = await withTenant(tenantId, async (tx) =>
      tx.ticket.findFirst({
        where: { id, tenantId },
        include: includeComments ? { comments: { orderBy: { createdAt: "asc" } } } : undefined,
      })
    );

    if (!ticket) return reply.code(404).send({ ok: false, error: "not_found" });
    return reply.send({ ok: true, ticket });
  });

  // Update ticket (status/severity/category/title/description)
  app.patch("/:id", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const id = String((req.params as any).id);

    const data: any = {};
    if (body.status) data.status = String(body.status);
    if (body.severity) data.severity = String(body.severity);
    if (body.category) data.category = String(body.category);
    if (body.agent !== undefined) data.agent = body.agent ? String(body.agent) : null;
    if (body.runId !== undefined) data.runId = body.runId ? String(body.runId) : null;
    if (body.title) data.title = String(body.title);
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null;
    if (body.meta !== undefined) data.meta = body.meta;

    const result = await withTenant(tenantId, async (tx) => {
      // Verify tenant boundary BEFORE performing update (prevent TOCTOU)
      const existing = await tx.ticket.findFirst({ where: { id, tenantId } });
      if (!existing) return { found: false as const };

      const ticket = await tx.ticket.update({
        where: { id },
        data,
      }).catch(() => null);

      return { found: true as const, ticket };
    });

    if (!result.found) return reply.code(404).send({ ok: false, error: "not_found" });
    if (!result.ticket) return reply.code(500).send({ ok: false, error: "update_failed" });
    return reply.send({ ok: true, ticket: result.ticket });
  });

  // List comments for a ticket
  app.get("/:id/comments", async (req, reply) => {
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const ticketId = String((req.params as any).id);

    const result = await withTenant(tenantId, async (tx) => {
      const ticket = await tx.ticket.findFirst({ where: { id: ticketId, tenantId }, select: { id: true } });
      if (!ticket) return null;

      const comments = await tx.ticketComment.findMany({
        where: { ticketId },
        orderBy: { createdAt: "asc" },
      });
      return comments;
    });

    if (!result) return reply.code(404).send({ ok: false, error: "ticket_not_found" });
    return reply.send({ ok: true, comments: result });
  });

  // Add comment
  app.post("/:id/comments", async (req, reply) => {
    const body = (req.body as any) ?? {};
    const tenantId = String((req as any).tenantId ?? "");
    if (!tenantId) return reply.code(400).send({ ok: false, error: "tenantId required" });
    const ticketId = String((req.params as any).id);

    const text = String(body.body ?? "").trim();
    if (!text) return reply.code(400).send({ ok: false, error: "body required" });

    const result = await withTenant(tenantId, async (tx) => {
      const ticket = await tx.ticket.findFirst({ where: { id: ticketId, tenantId } });
      if (!ticket) return null;

      const comment = await tx.ticketComment.create({
        data: {
          tenantId,
          ticketId,
          authorUserId: body.authorUserId ? String(body.authorUserId) : null,
          body: text,
          meta: body.meta ?? undefined,
        },
      });

      return comment;
    });

    if (!result) return reply.code(404).send({ ok: false, error: "ticket_not_found" });
    return reply.send({ ok: true, comment: result });
  });
};
