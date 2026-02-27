# Webhook Integration Guide

## Overview

Atlas UX receives inbound webhooks from three external services: Stripe
(billing events), Telegram (bot messages), and Microsoft Teams (Graph API
notifications). Each integration follows a common security pattern — signature
or token verification, raw body parsing, idempotent processing, and audit
logging — but the specific implementation details vary by provider.

## Common Patterns

All webhook endpoints share these implementation patterns:

### Raw Body Parsing

Webhook signature verification requires access to the raw, unparsed request
body. Fastify's default JSON parsing must be bypassed for webhook routes:

```typescript
server.post("/v1/billing/stripe/webhook", {
  config: {
    rawBody: true  // Fastify stores raw body for signature verification
  }
}, handler);
```

The raw body is available as `request.rawBody` (Buffer) while the parsed
JSON is still accessible via `request.body`.

### Idempotency

External services may deliver the same webhook event multiple times (network
retries, at-least-once delivery). Atlas UX handles this by:

1. Extracting a unique event ID from the payload (e.g., Stripe's `event.id`)
2. Checking the `audit_log` for a prior entry with that event ID
3. If found, returning 200 immediately without reprocessing
4. If not found, processing the event and logging it

### Audit Logging

Every webhook receipt is logged to `audit_log`:

```typescript
await prisma.auditLog.create({
  data: {
    tenantId,
    actorType: "system",
    actorExternalId: "webhook:" + provider,
    level: "info",
    action: "WEBHOOK_RECEIVED",
    entityType: "webhook",
    entityId: eventId,
    message: `Received ${eventType} from ${provider}`,
    meta: { eventType, payload: sanitizedPayload },
    timestamp: new Date()
  }
} as any).catch(() => null);
```

### Error Responses

Webhook endpoints must respond quickly to avoid provider timeouts and retries:

- **200** — Event received and processed (or already processed / idempotent skip)
- **400** — Invalid payload (malformed JSON, missing required fields)
- **401** — Signature verification failed
- **500** — Internal error (provider will retry)

Processing that takes longer than a few seconds should be offloaded to the
job queue rather than handled synchronously in the webhook handler.

## Stripe Webhooks

### Endpoint

```
POST /v1/billing/stripe/webhook
```

### Signature Verification

Stripe signs every webhook payload using HMAC-SHA256 with the webhook endpoint's
signing secret (`STRIPE_WEBHOOK_SECRET` environment variable).

The `Stripe-Signature` header contains a timestamp and one or more signatures:

```
t=1709035260,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

Verification uses the Stripe SDK's built-in method with timing-safe comparison:

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function handleStripeWebhook(request: FastifyRequest, reply: FastifyReply) {
  const sig = request.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody!,             // raw body as Buffer
      sig,                          // Stripe-Signature header
      process.env.STRIPE_WEBHOOK_SECRET!  // endpoint signing secret
    );
  } catch (err) {
    reply.code(401).send({ error: "Invalid signature" });
    return;
  }

  // Process event...
  reply.code(200).send({ received: true });
}
```

The `constructEvent` method internally:
1. Extracts the timestamp from the `t=` field
2. Constructs the signed payload: `${timestamp}.${rawBody}`
3. Computes HMAC-SHA256 using the webhook secret
4. Compares the computed signature against the `v1=` signature using
   `crypto.timingSafeEqual` to prevent timing attacks
5. Validates the timestamp is within tolerance (default: 300 seconds)

### Handled Event Types

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, update tenant plan, log to audit |
| `payment_intent.succeeded` | Record successful payment in ledger |
| `charge.refunded` | Mark payment as refunded, adjust usage limits |
| `customer.subscription.updated` | Sync plan changes (upgrades/downgrades) |
| `customer.subscription.deleted` | Downgrade to free tier, notify tenant |
| `invoice.payment_failed` | Flag account, send dunning notification |

### Tenant Resolution

Stripe events include the customer ID in `event.data.object.customer`. This
is mapped to a tenant via the `subscriptions` table:

```typescript
const customerId = event.data.object.customer as string;
const subscription = await prisma.subscription.findFirst({
  where: { stripeCustomerId: customerId }
});
const tenantId = subscription?.tenantId;
```

## Telegram Webhooks

### Endpoint

```
POST /v1/telegram/webhook
```

### Secret Token Validation

Telegram's Bot API supports a `secret_token` parameter when setting the
webhook URL. When configured, Telegram includes this token in every webhook
request via the `X-Telegram-Bot-Api-Secret-Token` header.

```typescript
async function handleTelegramWebhook(request: FastifyRequest, reply: FastifyReply) {
  const secretToken = request.headers["x-telegram-bot-api-secret-token"] as string;
  const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedToken || secretToken !== expectedToken) {
    reply.code(401).send({ error: "Invalid secret token" });
    return;
  }

  const update = request.body as TelegramUpdate;
  // Process update...
  reply.code(200).send({ ok: true });
}
```

### Webhook Setup

The webhook is registered with Telegram's Bot API during deployment:

```bash
curl -X POST "https://api.telegram.org/bot${BOTFATHERTOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.atlasux.com/v1/telegram/webhook",
    "secret_token": "${TELEGRAM_WEBHOOK_SECRET}",
    "allowed_updates": ["message", "callback_query"]
  }'
```

### Update Processing

Telegram sends updates for various event types. Atlas UX handles:

| Update type | Action |
|-------------|--------|
| `message.text` | Route to appropriate agent for processing |
| `callback_query` | Handle inline keyboard button presses |
| `/start` command | Initialize chat, save chat_id to Integration config |
| `/status` command | Return current system status summary |
| `/help` command | Return available commands |

### Chat ID Storage

When a user starts a conversation, their `chat_id` is saved to the
`Integration` table under the Telegram integration's `config` JSON field:

```typescript
await prisma.integration.update({
  where: { id: telegramIntegrationId },
  data: {
    config: { chat_id: update.message.chat.id }
  }
});
```

This stored `chat_id` is used by the `send_telegram_message` agent tool
to send proactive notifications.

## Teams Webhooks (Graph API)

### Endpoint

```
POST /v1/teams/webhook
```

### Notification Validation

Microsoft Graph API change notifications include a validation token on
initial subscription setup. The endpoint must echo this token back:

```typescript
if (request.query.validationToken) {
  reply.type("text/plain").code(200).send(request.query.validationToken);
  return;
}
```

For actual notifications, the payload includes a `clientState` value that
was set during subscription creation. This acts as a shared secret:

```typescript
const notification = request.body.value[0];
if (notification.clientState !== process.env.TEAMS_WEBHOOK_CLIENT_STATE) {
  reply.code(401).send({ error: "Invalid client state" });
  return;
}
```

### Subscription Management

Graph API subscriptions expire and must be renewed periodically. Atlas UX
uses the scheduler worker to renew subscriptions before expiration:

| Resource | Subscription type | Max lifetime | Renewal interval |
|----------|-------------------|--------------|------------------|
| Channel messages | `/teams/{id}/channels/{id}/messages` | 60 minutes | Every 45 minutes |
| Chat messages | `/chats/{id}/messages` | 60 minutes | Every 45 minutes |

### Notification Processing

Graph API notifications contain only a reference to the changed resource,
not the full data. The webhook handler must make a follow-up API call to
fetch the actual content:

```typescript
const resourceUrl = notification.resource;
// e.g., "/teams/{teamId}/channels/{channelId}/messages/{messageId}"

const message = await graphClient.api(resourceUrl).get();
```

This two-step pattern (notification + fetch) ensures the webhook handler
responds quickly while the actual data retrieval happens asynchronously.

## Security Best Practices

1. **Never log raw webhook payloads** that contain PII or payment data.
   Always sanitize before writing to audit_log.

2. **Rotate webhook secrets** periodically. When rotating:
   - Set the new secret in the provider's dashboard first
   - Update the environment variable
   - The old secret remains valid briefly (Stripe supports multiple
     active secrets during rotation)

3. **Validate timestamps** where supported (Stripe). Reject events with
   timestamps older than 5 minutes to prevent replay attacks.

4. **Use HTTPS only**. All webhook URLs must use TLS. Providers will reject
   HTTP endpoints.

5. **Monitor webhook delivery** via the provider's dashboard. Failed
   deliveries indicate endpoint issues that need immediate attention.

## Testing Webhooks Locally

For local development, use a tunnel service to expose your local server:

```bash
# Using ngrok
ngrok http 8787

# Then register the tunnel URL with the provider
# e.g., https://abc123.ngrok.io/v1/billing/stripe/webhook
```

Stripe also provides a CLI for forwarding webhook events:

```bash
stripe listen --forward-to localhost:8787/v1/billing/stripe/webhook
```

This outputs a temporary webhook signing secret for local testing.
