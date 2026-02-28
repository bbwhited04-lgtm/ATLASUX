import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../db/prisma.js";
import { createStripeProductAndPrice } from "../services/stripeCatalog.js";
import {
  stripeCreateCheckoutSession,
  stripeCreatePortalSession,
  stripeConstructWebhookEvent,
} from "../integrations/stripe.client.js";
import { LedgerCategory, LedgerEntryType } from "@prisma/client";
import { loadEnv } from "../env.js";

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
   * Rate limited to prevent abuse of the Stripe product creation flow.
   */
  app.post("/products/request", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    requireRole(req, ["owner", "admin", "exec", "atlas"]);
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).auth?.userId as string;
    const body = RequestCreateProductSchema.parse(req.body ?? {});

    const intent = await prisma.intent.create({
      data: {
        tenantId,
        intentType: "stripe.create_product",
        payload: {
          ...body,
          created_by: userId ?? null,
          createdAt: new Date().toISOString(),
        },
        status: "AWAITING_HUMAN",
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: null,
        actorExternalId: String(userId ?? ""),
        actorType: "system",
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
   * Rate limited — direct creation is a high-impact operation.
   */
  app.post("/products", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req, reply) => {
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
        actorUserId: null,
        actorExternalId: String(userId ?? ""),
        actorType: "system",
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

  /* ───────────────────────────────────────────────────────────────────────────
   * POST /v1/stripe/checkout-session
   * Creates a Stripe Checkout Session for cloud seating subscriptions.
   * Public endpoint — no auth required (customer provides email).
   * ─────────────────────────────────────────────────────────────────────────*/
  const CheckoutSchema = z.object({
    plan: z.enum(["starter", "business-pro"]),
    billing: z.enum(["monthly", "annual"]),
    email: z.string().email(),
  });

  app.post("/checkout-session", async (req, reply) => {
    const env = loadEnv(process.env);
    const body = CheckoutSchema.parse(req.body ?? {});

    const priceMap: Record<string, string | undefined> = {
      "starter:monthly": env.STRIPE_PRICE_STARTER_MONTHLY,
      "starter:annual": env.STRIPE_PRICE_STARTER_ANNUAL,
      "business-pro:monthly": env.STRIPE_PRICE_BUSINESS_PRO_MONTHLY,
      "business-pro:annual": env.STRIPE_PRICE_BUSINESS_PRO_ANNUAL,
    };

    const priceId = priceMap[`${body.plan}:${body.billing}`];
    if (!priceId) {
      return reply.status(400).send({ ok: false, error: "Price not configured for this plan/billing combo" });
    }

    const appUrl = env.APP_URL ?? "https://atlasux.cloud";

    const session = await stripeCreateCheckoutSession({
      priceId,
      customerEmail: body.email,
      successUrl: `${appUrl}/#/store?checkout=success`,
      cancelUrl: `${appUrl}/#/store?checkout=cancel`,
      allowPromotionCodes: true,
      metadata: { plan: body.plan, billing: body.billing },
    });

    return reply.send({ ok: true, url: session.url, sessionId: session.id });
  });

  /* ───────────────────────────────────────────────────────────────────────────
   * POST /v1/stripe/portal
   * Creates a Stripe Customer Portal session for managing subscription.
   * ─────────────────────────────────────────────────────────────────────────*/
  const PortalSchema = z.object({
    stripeCustomerId: z.string().min(1),
  });

  app.post("/portal", async (req, reply) => {
    const env = loadEnv(process.env);
    const body = PortalSchema.parse(req.body ?? {});
    const appUrl = env.APP_URL ?? "https://atlasux.cloud";

    const session = await stripeCreatePortalSession({
      customerId: body.stripeCustomerId,
      returnUrl: `${appUrl}/#/app/settings`,
    });

    return reply.send({ ok: true, url: session.url });
  });

  /* ───────────────────────────────────────────────────────────────────────────
   * POST /v1/stripe/subscription-webhook
   * Handles Stripe subscription lifecycle events.
   * On checkout.session.completed: generates 256-bit gate key, creates
   * cloud_seat + subscription record, emails the key to the customer.
   * On customer.subscription.deleted: revokes the cloud seat.
   * ─────────────────────────────────────────────────────────────────────────*/
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string", bodyLimit: 1048576 },
    (_req: any, body: any, done: any) => { done(null, body); },
  );

  app.post("/subscription-webhook", async (req, reply) => {
    const env = loadEnv(process.env);
    const secret = env.STRIPE_SUB_WEBHOOK_SECRET;
    if (!secret) {
      return reply.status(500).send({ ok: false, error: "Webhook secret not configured" });
    }

    const sig = req.headers["stripe-signature"] as string;
    if (!sig) {
      return reply.status(400).send({ ok: false, error: "Missing stripe-signature header" });
    }

    let event: any;
    try {
      event = await stripeConstructWebhookEvent(req.body as string, sig, secret);
    } catch (err: any) {
      req.log.error({ err }, "Stripe webhook signature verification failed");
      return reply.status(400).send({ ok: false, error: "Signature verification failed" });
    }

    const type = event.type as string;

    // ── checkout.session.completed — new subscription paid ────────────────
    if (type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_email ?? session.customer_details?.email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const plan = session.metadata?.plan ?? "starter";
      const billing = session.metadata?.billing ?? "monthly";

      // Generate 256-bit hex gate key
      const gateKey = crypto.randomBytes(32).toString("hex");

      // Create cloud seat
      await prisma.cloudSeat.create({
        data: {
          code: gateKey,
          label: `${plan} (${billing})`,
          email: email ?? null,
          role: "admin",
          active: true,
          meta: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            plan,
            billing,
          },
        },
      });

      // Create subscription record (use first tenant or create one)
      // Note: for cloud seating, tenant is created on first login with gate key
      req.log.info(
        { email, plan, billing, customerId, subscriptionId },
        "Cloud seat created for new subscription",
      );

      // Email the gate key via Microsoft email pipeline
      try {
        const msClientId = env.MS_CLIENT_ID;
        const msClientSecret = env.MS_CLIENT_SECRET;
        const msTenantId = env.MS_TENANT_ID;
        const senderUpn = env.MS_SENDER_UPN;

        if (msClientId && msClientSecret && msTenantId && senderUpn && email) {
          // Get MS Graph token
          const tokenRes = await fetch(
            `https://login.microsoftonline.com/${msTenantId}/oauth2/v2.0/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: msClientId,
                client_secret: msClientSecret,
                scope: "https://graph.microsoft.com/.default",
                grant_type: "client_credentials",
              }),
            },
          );
          const tokenData = await tokenRes.json() as any;

          if (tokenData.access_token) {
            await fetch(
              `https://graph.microsoft.com/v1.0/users/${senderUpn}/sendMail`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  message: {
                    subject: "Your Atlas UX Cloud Seat Key",
                    body: {
                      contentType: "HTML",
                      content: [
                        `<h2>Welcome to Atlas UX!</h2>`,
                        `<p>Your <strong>${plan}</strong> subscription is active.</p>`,
                        `<p>Use this key to sign in at the Atlas UX gate:</p>`,
                        `<div style="background:#0a1628;color:#22d3ee;padding:16px 24px;border-radius:12px;font-family:monospace;font-size:14px;word-break:break-all;margin:16px 0;">${gateKey}</div>`,
                        `<p>Keep this key safe — it's your login credential.</p>`,
                        `<p>Get started: <a href="https://atlasux.cloud/#/app">Open Atlas UX</a></p>`,
                        `<br/><p>— The Atlas UX Team</p>`,
                      ].join(""),
                    },
                    toRecipients: [{ emailAddress: { address: email } }],
                  },
                  saveToSentItems: true,
                }),
              },
            );
            req.log.info({ email }, "Gate key emailed to customer");
          }
        }
      } catch (emailErr: any) {
        req.log.error({ err: emailErr }, "Failed to email gate key (seat still created)");
      }

      return reply.send({ ok: true, event: type });
    }

    // ── customer.subscription.deleted — revoke seat ──────────────────────
    if (type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const subscriptionId = sub.id;

      // Find and revoke cloud seat(s) with this subscription
      const seats = await prisma.cloudSeat.findMany({
        where: { meta: { path: ["stripeSubscriptionId"], equals: subscriptionId } },
      });

      for (const seat of seats) {
        await prisma.cloudSeat.update({
          where: { id: seat.id },
          data: { active: false, revokedAt: new Date() },
        });
      }

      req.log.info({ subscriptionId, revoked: seats.length }, "Cloud seats revoked on subscription deletion");
      return reply.send({ ok: true, event: type, revoked: seats.length });
    }

    // ── customer.subscription.updated — handle status changes ────────────
    if (type === "customer.subscription.updated") {
      const sub = event.data.object;
      const subscriptionId = sub.id;
      const status = sub.status; // active | past_due | canceled | unpaid

      if (status === "past_due" || status === "unpaid") {
        const seats = await prisma.cloudSeat.findMany({
          where: { meta: { path: ["stripeSubscriptionId"], equals: subscriptionId } },
        });
        for (const seat of seats) {
          await prisma.cloudSeat.update({
            where: { id: seat.id },
            data: { active: false },
          });
        }
        req.log.info({ subscriptionId, status }, "Cloud seats deactivated due to payment issue");
      }

      if (status === "active") {
        const seats = await prisma.cloudSeat.findMany({
          where: { meta: { path: ["stripeSubscriptionId"], equals: subscriptionId } },
        });
        for (const seat of seats) {
          if (!seat.revokedAt) {
            await prisma.cloudSeat.update({
              where: { id: seat.id },
              data: { active: true },
            });
          }
        }
        req.log.info({ subscriptionId }, "Cloud seats reactivated");
      }

      return reply.send({ ok: true, event: type });
    }

    // Unhandled event type — acknowledge anyway
    return reply.send({ ok: true, event: type, handled: false });
  });
};
