import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { randomUUID } from "crypto";

type Actor = {
  actorUserId?: string | null;
  actorExternalId?: string | null;
  actorType?: string | null;
};

function getActor(req: any): Actor {
  const h = (req.headers ?? {}) as Record<string, any>;
  const actorUserId =
    (typeof h["x-actor-user-id"] === "string" && h["x-actor-user-id"]) ||
    (typeof h["x-user-id"] === "string" && h["x-user-id"]) ||
    null;

  const actorExternalId =
    (typeof h["x-actor-external-id"] === "string" && h["x-actor-external-id"]) ||
    (typeof h["x-external-id"] === "string" && h["x-external-id"]) ||
    null;

  const actorType =
    (typeof h["x-actor-type"] === "string" && h["x-actor-type"]) ||
    (actorUserId ? "user" : "system");

  return { actorUserId, actorExternalId, actorType };
}

function auditMeta(before: any, after: any, extra?: Record<string, any>) {
  return {
    before: before ?? null,
    after: after ?? null,
    ...((extra ?? {}) as Record<string, any>),
  };
}

export async function tenantsRoutes(app: FastifyInstance) {
  // ✅ GET all tenants
  app.get("/", async (_req, reply) => {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
    });

    return reply.send({ ok: true, tenants });
  });

  // ✅ CREATE tenant (audited + ledger marker)
  app.post("/", async (req, reply) => {
    const body = req.body as any;

    const name = String(body?.name ?? "").trim();

    const slug =
      body?.slug ??
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    if (!name) {
      return reply.code(400).send({ ok: false, error: "name_required" });
    }

    const actor = getActor(req);
    const requestId = randomUUID();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: { name, slug },
        });

        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            actorUserId: actor.actorUserId,
            actorExternalId: actor.actorExternalId,
            actorType: actor.actorType,
            level: "info",
            action: "TENANT_CREATED",
            entityType: "tenant",
            entityId: tenant.id,
            message: `Tenant created: ${tenant.name}`,
            meta: auditMeta(null, tenant, { requestId }),
            timestamp: new Date(),
          },
        });

        await tx.ledgerEntry.create({
          data: {
            tenantId: tenant.id,
            entryType: "debit",
            category: "misc",
            amountCents: BigInt(0),
            currency: "USD",
            description: `Tenant created: ${tenant.name}`,
            externalRef: requestId,
            meta: { action: "TENANT_CREATED", entityType: "tenant", entityId: tenant.id },
            occurredAt: new Date(),
          },
        });

        return tenant;
      });

      return reply.send({ ok: true, tenant: created });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        // 🔥 duplicate slug
        return reply.code(409).send({
          ok: false,
          error: "tenant_already_exists",
        });
      }

      console.error(e);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }
  });
}
