# Store

The Atlas UX Store offers digital products including AI prompt packs, ebooks, templates, and subscription plans. Products are managed through Stripe and available for purchase with standard card payments.

## Accessing the Store

Navigate to the **Store** from the main navigation, or visit the public route: `#/store`.

The Store is accessible without authentication -- anyone can browse products. Purchasing requires a Stripe checkout session.

---

## Product Categories

### Prompt Packs

Pre-built prompt collections optimized for specific use cases:

- **Content Creation Pack** -- blog posts, social media, newsletters
- **Business Strategy Pack** -- market analysis, competitive research, planning
- **Customer Support Pack** -- response templates, escalation flows, FAQ generation
- **Technical Writing Pack** -- documentation, API guides, release notes

### Ebooks

Digital guides published by the Atlas UX team:

- AI productivity guides
- Agent workflow design patterns
- Business automation playbooks

### Templates

Ready-to-use templates for common workflows:

- Business plan templates
- Content calendar templates
- Social media strategy templates

---

## Pricing Tiers

| Tier       | Price       | Description                        |
|------------|-------------|------------------------------------|
| Free       | $0          | Basic prompt packs and samples     |
| Standard   | $9 - $19    | Full prompt packs and ebooks       |
| Premium    | $29 - $49   | Comprehensive bundles and courses  |

---

## Purchasing Flow

1. Browse the product catalog on the Store page.
2. Click **Buy Now** on the product you want.
3. You are redirected to a Stripe Checkout session.
4. Complete payment with your card.
5. Stripe sends a webhook to `POST /v1/billing/stripe/webhook`.
6. The purchase is recorded in the audit trail.

---

## Stripe Integration

Products and prices are created in Stripe by authorized agents or admins:

```
POST /v1/stripe/products
{
  "fromAgent": "atlas",
  "name": "Content Creation Prompt Pack",
  "description": "50+ optimized prompts for content creation",
  "priceUSD": 19.00
}
```

The backend creates the product and price in Stripe's catalog and records it in the ledger.

### Webhook Events

The Store processes these Stripe webhook events:

| Event                           | Action                             |
|---------------------------------|------------------------------------|
| `checkout.session.completed`    | Record purchase in audit trail     |
| `payment_intent.succeeded`      | Log payment confirmation           |
| `charge.refunded`               | Record refund in audit trail       |

---

## Store Page Design

The Store page follows the Atlas UX dark theme:

- Product cards with `rounded-2xl border border-cyan-500/20 bg-slate-900/50`
- Price displayed in cyan accent color
- Call-to-action buttons with `bg-cyan-500` hover state

---

## For Agents

AI agents (particularly Atlas and Binky) can propose new products for the Store by creating a decision memo with the `stripe.create_product` intent type. The product is only created after human approval.

---

## Related

- [Billing API](../api/billing.md) -- API reference for Stripe integration
- [Decisions](./decisions.md) -- How agent-proposed products get approved
