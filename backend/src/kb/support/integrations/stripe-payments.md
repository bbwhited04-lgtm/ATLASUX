---
title: "Stripe Payments & Billing"
category: "Integrations"
tags: ["stripe", "billing", "payments", "subscription", "PCI"]
related:
  - integrations/api-keys
  - security-privacy/how-we-protect-your-data
  - troubleshooting/common-errors
---

# Stripe Payments & Billing

Atlas UX uses **Stripe** to handle all billing and payment processing. Stripe is one of the most trusted payment platforms in the world, processing hundreds of billions of dollars annually for businesses of all sizes.

## How Stripe Handles Your Billing

When you subscribe to Atlas UX at $99/mo, your payment is processed entirely through Stripe. Here is what that means for you:

- **Your credit card details never touch our servers.** When you enter your card number, it goes directly to Stripe's secure infrastructure. Atlas UX never sees, stores, or has access to your full card number.
- **Stripe is PCI DSS Level 1 certified** -- the highest level of payment security certification. This is the same standard used by major banks.
- **Your subscription renews automatically** each month. You will receive a receipt from Stripe via email after each charge.

## What Plans Are Available

Atlas UX offers tiered plans to match your business size:

- **Starter** -- For solo operators and small shops. Includes Lucy AI receptionist, appointment booking, and SMS confirmations.
- **Pro** -- For growing teams. Adds multi-user access, advanced analytics, and priority support.
- **Enterprise** -- Custom pricing for larger operations with multiple locations.

All plans include a full-featured trial so you can see Lucy in action before committing.

## Managing Your Subscription

You can manage your subscription at any time without contacting support:

1. Log in to your Atlas UX dashboard.
2. Go to **Settings > Billing**.
3. Click **Manage Subscription** to open the Stripe Customer Portal.

From the Stripe portal, you can:

- **Update your payment method** -- Add a new card or switch to a different one.
- **View invoice history** -- Download PDF receipts for your records or for tax purposes.
- **Change your plan** -- Upgrade or downgrade between tiers.
- **Cancel your subscription** -- Cancellation takes effect at the end of your current billing period. You keep full access until then.

## Payment Security

Stripe's security goes well beyond basic encryption:

- **Tokenization** -- Your card details are replaced with a secure token. Even if someone accessed our database, they would find only tokens, not card numbers.
- **3D Secure** -- For cards that support it, Stripe adds an extra verification step through your bank.
- **Fraud detection** -- Stripe's machine learning monitors every transaction for suspicious activity.

On our side, all Stripe webhook events are verified using cryptographic signatures to ensure they genuinely come from Stripe. See [How We Protect Your Data](../security-privacy/how-we-protect-your-data.md) for more on our security practices.

## Frequently Asked Questions

**Will I be charged before my trial ends?**
No. You will not be charged until your trial period is complete and you choose to continue.

**Can I get a refund?**
Contact our support team within 14 days of a charge and we will work with you. See [Getting Help](../troubleshooting/getting-help.md).

**Why does my bank show a small temporary charge?**
Stripe may place a temporary hold (usually $0 or $1) to verify your card. This disappears within a few days.

**I see "API key expired" in my dashboard. What do I do?**
This error relates to backend integration keys, not your payment method. See [Common Errors](../troubleshooting/common-errors.md) for a fix.

**Is my billing data separate from other businesses?**
Absolutely. Atlas UX enforces strict tenant isolation -- your billing, call logs, and business data are completely separated from every other customer. See [Data Privacy](../security-privacy/data-privacy.md) for details.


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
