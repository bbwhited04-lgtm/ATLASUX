import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { createStripeProductAndPrice } from "../services/stripeCatalog.js";
import { LedgerCategory, LedgerEntryType } from "@prisma/client";

const CreateProductSchema = z.object({
  fromAgent: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  priceUSD: z.number().nonnegative(),
  currency: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

const RequestCreateProductSchema = CreateProductSchema.extend({
  // optional "why" string that gets stored for human review
  rationale: z.string().optional(),
});

function requireRole(req: any, roles: string[]) {
  const role = String(req.tenantRole ?? "");
  if (!roles.includes(role)) {
    const msg = `requires_role_${roles.join("_")}`;
    const err: any = new Error(msg);
    err.statusCode = 403;
    throw err;
  }
}

export const stripeRoutes: FastifyPluginAsync = async (app) => {
  /**
   * GET /v1/stripe/health
   */
  app.get("/health", async (_req, reply) => {
    const hasKey = Boolean((process.env.STRIPE_SECRET_KEY ?? "").trim());
    return reply.send({ ok: true, stripe_key_configured: hasKey });
  });

  /**
   * POST /v1/stripe/products/request
   * Creates an Intent that a human (Exec/Atlas) can approve.
   */
  app.post("/products/request", async (req, reply) => {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;
    const body = RequestCreateProductSchema.parse(req.body ?? {});

    const intent = await prisma.intent.create({
      data: {
        tenantId,
        intentType: "stripe.create_product",
        payload: {
          ...body,
          createdAt: new Date().toISOString(),
        },
        status: "AWAITING_HUMAN",
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        actorType: "user",
        level: "info",
        action: "STRIPE_PRODUCT_REQUESTED",
        entityType: "intent",
        entityId: intent.id,
        message: `Requested Stripe product creation: ${body.name}`,
        meta: { fromAgent: body.fromAgent, name: body.name, priceUSD: body.priceUSD, currency: body.currency ?? "usd" },
        timestamp: new Date(),
      },
    });

    return reply.send({ ok: true, intentId: intent.id, status: intent.status });
  });

  /**
   * POST /v1/stripe/products
   * Directly creates a Stripe product + price using the server-owned STRIPE_SECRET_KEY.
   * RBAC: tenantRole must be one of [owner, admin, exec, atlas].
   */
  app.post("/products", async (req, reply) => {
    requireRole(req, ["owner", "admin", "exec", "atlas"]);

    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;
    const body = CreateProductSchema.parse(req.body ?? {});

    const result = await createStripeProductAndPrice({
      name: body.name,
      description: body.description ?? null,
      priceUSD: body.priceUSD,
      currency: body.currency ?? "usd",
      metadata: body.metadata ?? null,
    });

    // Audit (DB)
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        actorType: "user",
        level: "info",
        action: "STRIPE_PRODUCT_CREATED",
        entityType: "external",
        entityId: null,
        message: `Created Stripe product ${result.productId} (${body.name})`,
        meta: {
          fromAgent: body.fromAgent,
          name: body.name,
          priceUSD: body.priceUSD,
          currency: (body.currency ?? "usd").toLowerCase(),
          productId: result.productId,
          priceId: result.priceId,
        },
        timestamp: new Date(),
      },
    });

    // Ledger (0-cost catalog mutation, still traceable)
    await prisma.ledgerEntry.create({
      data: {
        tenantId,
        entryType: LedgerEntryType.debit,
        category: LedgerCategory.api_spend,
        amountCents: BigInt(0),
        currency: "USD",
        description: `Stripe catalog: created product ${body.name}`,
        externalRef: result.productId,
        meta: {
          fromAgent: body.fromAgent,
          priceUSD: body.priceUSD,
          priceId: result.priceId,
        },
        occurredAt: new Date(),
        createdAt: new Date(),
      },
    });

    return reply.send({
      ok: true,
      productId: result.productId,
      priceId: result.priceId,
    });
  });
};
