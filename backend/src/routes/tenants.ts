import type { FastifyInstance } from "fastify";
import { Prisma, LedgerCategory, LedgerEntryType } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { randomUUID, timingSafeEqual } from "crypto";


function normalizeLedgerCategory(input: unknown): LedgerCategory {
  const v = String(input ?? "").trim().toLowerCase();
  switch (v) {
    case "hosting":
      return LedgerCategory.api_spend;
    case "saas":
      return LedgerCategory.api_spend;
    case "domain":
      return LedgerCategory.api_spend;
    case "email":
      return LedgerCategory.api_spend;
    case "social":
      return LedgerCategory.api_spend;
    case "infra":
      return LedgerCategory.api_spend;
    case "ads":
      return LedgerCategory.api_spend;
    case "other":
      return LedgerCategory.misc;
    case "subscription":
      return LedgerCategory.subscription;
    case "ai_spend":
    case "token_spend":
    case "api_spend":
    case "tokens":
    case "api":
      return LedgerCategory.token_spend;
    case "misc":
    default:
      return LedgerCategory.misc;
  }
}

function normalizeLedgerEntryType(input: unknown): LedgerEntryType {
  const v = String(input ?? "").trim().toLowerCase();
  return v === "credit" ? LedgerEntryType.credit : LedgerEntryType.debit;
}

type Actor = {
  actorUserId?: string | null;
  actorExternalId?: string | null;
  actorType?: string | null;
};

function getActor(req: any): Actor {
  const userId = (req as any).user?.id ?? null;
  return {
    actorUserId: userId,
    actorExternalId: null,
    actorType: userId ? "user" : "system",
  };
}

function auditMeta(before: any, after: any, extra?: Record<string, any>) {
  return {
    before: before ?? null,
    after: after ?? null,
    ...((extra ?? {}) as Record<string, any>),
  };
}

export async function tenantsRoutes(app: FastifyInstance) {
  // GET tenants — admin key returns ALL tenants, otherwise returns the caller's tenant only
  app.get("/", async (req, reply) => {
    const adminKey = (process.env.GATE_ADMIN_KEY ?? "").trim();
    const provided = (req.headers["x-gate-admin-key"] ?? "").toString().trim();

    // Admin mode: return all tenants
    if (adminKey && provided) {
      const adminBuf = Buffer.from(adminKey);
      const providedBuf = Buffer.from(provided);
      if (adminBuf.length === providedBuf.length && timingSafeEqual(adminBuf, providedBuf)) {
        const tenants = await prisma.tenant.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        });
        return reply.send({ ok: true, tenants });
      }
    }

    // User mode: return only the tenant from x-tenant-id header
    const reqTenantId = (req as any).tenantId as string | undefined;
    if (reqTenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: reqTenantId } });
      if (tenant) {
        return reply.send({ ok: true, tenants: [tenant] });
      }
    }

    return reply.code(403).send({ ok: false, error: "forbidden" });
  });

  // ✅ CREATE tenant (audited + ledger marker)
  // Requires authenticated user or admin key to prevent anonymous tenant creation
  app.post("/", async (req, reply) => {
    const userId = (req as any).auth?.userId ?? null;
    const adminKey = (process.env.GATE_ADMIN_KEY ?? "").trim();
    const providedAdmin = (req.headers["x-gate-admin-key"] ?? "").toString().trim();
    const isAdmin = !!(adminKey && providedAdmin === adminKey);

    if (!userId && !isAdmin) {
      return reply.code(401).send({ ok: false, error: "AUTHENTICATION_REQUIRED" });
    }

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
      const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const tenant = await tx.tenant.create({
          data: { name, slug },
        });

        await tx.auditLog.create({
          data: {
            tenantId: tenant.id,
            actorUserId: null,
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
            entryType: LedgerEntryType.debit,
            category: LedgerCategory.misc,
            amountCents: BigInt(0),
            currency: "USD",
            description: `Tenant created: ${tenant.name}`,
            externalRef: requestId,
            meta: { action: "TENANT_CREATED", entityType: "tenant", entityId: tenant.id },
            occurredAt: new Date(),
            createdAt: new Date(),
          },
        });

        return tenant;
      });

      return reply.send({ ok: true, tenant: created });
    } catch (e: any) {
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
