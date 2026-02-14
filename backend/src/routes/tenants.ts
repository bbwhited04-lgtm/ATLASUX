import type { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { randomUUID } from "crypto";

export async function tenantsRoutes(app: FastifyInstance) {
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
      const tenant = await prisma.$transaction(async (tx) => {
        const created = await tx.tenant.create({
          data: {
            name,
            slug,
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: created.id,
            actorUserId: actor.actorUserId,
            actorExternalId: actor.actorExternalId,
            actorType: actor.actorType,
            level: "info",
            action: "TENANT_CREATED",
            entityType: "tenant",
            entityId: created.id,
            message: `Tenant created: ${created.name}`,
            meta: auditMeta(null, created, { requestId }),
            timestamp: new Date(),
          },
        });

        await tx.ledgerEntry.create({
          data: {
            tenantId: created.id,
            entryType: "debit",
            category: "misc",
            amountCents: BigInt(0),
            currency: "USD",
            description: `Tenant created: ${created.name}`,
            externalRef: requestId,
            meta: { action: "TENANT_CREATED", entityType: "tenant", entityId: created.id },
            occurredAt: new Date(),
          },
        });

        return created;
      });

      return reply.send({ ok: true, tenant });
    } catch (err: any) {
      // Unique constraint (slug already exists)
      if (err?.code === "P2002") {
        return reply.code(409).send({ ok: false, error: "tenant_exists" });
      }
      console.error(err);
      return reply.code(500).send({ ok: false, error: "internal_error" });
    }});
}
