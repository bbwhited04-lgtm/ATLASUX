/**
 * Stripe Webhook — handles incoming Stripe events.
 *
 * Endpoint: POST /v1/billing/stripe/webhook
 *
 * Verifies the Stripe-Signature header using STRIPE_WEBHOOK_SECRET,
 * then processes relevant events (checkout.session.completed, etc.).
 *
 * Registered as a scoped plugin so we can use a raw body parser
 * without affecting JSON parsing on other routes.
 */

import type { FastifyPluginAsync } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../db/prisma.js";

// ── Stripe signature verification ─────────────────────────────────────────
function verifyStripeSignature(
  payload: Buffer,
  sigHeader: string,
  secret: string,
  toleranceSec = 300,
): { event: any } {
  const parts = sigHeader.split(",").reduce<Record<string, string[]>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) (acc[k] = acc[k] ?? []).push(v);
    return acc;
  }, {});

  const ts = parts["t"]?.[0];
  const sigs = parts["v1"] ?? [];
  if (!ts || sigs.length === 0) throw new Error("Missing signature elements");

  // Timestamp tolerance check
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(ts)) > toleranceSec) {
    throw new Error("Webhook timestamp outside tolerance");
  }

  // Compute expected signature
  const signedPayload = `${ts}.${payload.toString("utf8")}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  // Compare against all v1 signatures
  const match = sigs.some((sig) => {
    try {
      return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
    } catch {
      return false;
    }
  });

  if (!match) throw new Error("Signature mismatch");

  return { event: JSON.parse(payload.toString("utf8")) };
}

// ── Route plugin ──────────────────────────────────────────────────────────
export const billingWebhookRoutes: FastifyPluginAsync = async (app) => {
  // Use raw body parser for this scope only
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => {
    done(null, body);
  });

  app.post("/stripe/webhook", async (request, reply) => {
    const secret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
    if (!secret) {
      request.log.warn("STRIPE_WEBHOOK_SECRET not configured");
      return reply.code(503).send({ ok: false, error: "webhook_not_configured" });
    }

    const sigHeader = String(request.headers["stripe-signature"] ?? "");
    if (!sigHeader) {
      return reply.code(400).send({ ok: false, error: "missing_stripe_signature" });
    }

    const rawBody = Buffer.isBuffer(request.body)
      ? (request.body as Buffer)
      : Buffer.from(String(request.body ?? ""));

    // Verify signature
    let event: any;
    try {
      ({ event } = verifyStripeSignature(rawBody, sigHeader, secret));
    } catch (err: any) {
      request.log.warn({ err: err.message }, "Stripe signature verification failed");
      return reply.code(401).send({ ok: false, error: "invalid_signature" });
    }

    request.log.info({ type: event.type, id: event.id }, "Stripe webhook event");

    // ── Handle events ───────────────────────────────────────────────────
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data?.object;
          const email = session?.customer_email ?? session?.customer_details?.email ?? null;
          const amount = session?.amount_total ?? 0;
          const currency = session?.currency ?? "usd";
          const paymentId = session?.payment_intent ?? session?.id ?? null;

          request.log.info(
            { email, amount, currency, paymentId },
            "Checkout completed",
          );

          // Log to audit trail (use default tenant for storefront purchases)
          await prisma.auditLog.create({
            data: {
              tenantId: process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391",
              actorUserId: null,
              actorExternalId: email ?? "anonymous",
              actorType: "user",
              level: "info",
              action: "STRIPE_CHECKOUT_COMPLETED",
              entityType: "payment",
              entityId: paymentId,
              message: `Checkout completed: ${(amount / 100).toFixed(2)} ${currency.toUpperCase()} from ${email ?? "unknown"}`,
              meta: {
                sessionId: session?.id,
                paymentIntent: paymentId,
                email,
                amountCents: amount,
                currency,
                lineItems: session?.metadata ?? {},
              },
              timestamp: new Date(),
            },
          } as any).catch(() => null);
          break;
        }

        case "payment_intent.succeeded": {
          const pi = event.data?.object;
          request.log.info(
            { id: pi?.id, amount: pi?.amount, email: pi?.receipt_email },
            "Payment intent succeeded",
          );
          break;
        }

        case "charge.refunded": {
          const charge = event.data?.object;
          request.log.info(
            { id: charge?.id, amount: charge?.amount_refunded },
            "Charge refunded",
          );

          await prisma.auditLog.create({
            data: {
              tenantId: process.env.TENANT_ID || "9a8a332c-c47d-4792-a0d4-56ad4e4a3391",
              actorUserId: null,
              actorExternalId: charge?.billing_details?.email ?? "stripe",
              actorType: "system",
              level: "warn",
              action: "STRIPE_REFUND",
              entityType: "payment",
              entityId: charge?.id ?? null,
              message: `Refund: ${((charge?.amount_refunded ?? 0) / 100).toFixed(2)} ${(charge?.currency ?? "usd").toUpperCase()}`,
              meta: { chargeId: charge?.id, amountRefunded: charge?.amount_refunded },
              timestamp: new Date(),
            },
          } as any).catch(() => null);
          break;
        }

        default:
          request.log.info({ type: event.type }, "Unhandled Stripe event type (ignored)");
      }
    } catch (err: any) {
      request.log.error({ err, eventType: event.type }, "Error processing Stripe event");
    }

    // Always return 200 so Stripe doesn't retry
    return reply.send({ ok: true, received: event.type });
  });
};
