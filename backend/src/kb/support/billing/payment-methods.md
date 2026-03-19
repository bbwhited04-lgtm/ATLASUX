---
title: "Payment Methods"
category: "Billing"
tags: ["payment", "credit-card", "debit-card", "stripe", "billing", "failed-payment", "retry"]
related: ["plans-and-pricing.md", "invoices-receipts.md", "cancellation.md", "free-trial-policy.md"]
---

# Payment Methods

Atlas UX uses Stripe to process all payments. Your card information is handled securely by Stripe and never touches our servers directly. Here is everything you need to know about paying for your subscription.

## Accepted Payment Methods

We accept major credit and debit cards:

- Visa
- Mastercard
- American Express
- Discover

All payments are processed in USD. Your card is charged automatically each month on your billing date.

## Adding or Updating Your Card

To add a payment method or update your card on file:

1. Log in to your Atlas UX dashboard
2. Go to **Settings** and then **Billing**
3. Click **Update Payment Method**
4. Enter your new card details
5. Click **Save**

Your new card will be used for all future charges. The old card is removed automatically. If you are updating your card because of a failed payment, the system will retry the charge on your new card shortly after you save it.

## How Charges Work

- **Monthly billing** -- Your subscription renews on the same date each month (the date you originally subscribed).
- **Automatic charges** -- We charge the card on file. You do not need to log in and pay manually each month.
- **Receipts** -- A receipt is emailed to you after each successful charge. You can also download invoices from your dashboard. See [Invoices and Receipts](invoices-receipts.md).

## Failed Payments

Sometimes a charge does not go through. Common reasons include an expired card, insufficient funds, or your bank flagging the transaction. Here is what happens:

### Automatic Retry

If a payment fails, Stripe automatically retries the charge. Retries happen over several days, giving you time to fix the issue without any immediate disruption.

### Grace Period

Your service is not shut off the moment a payment fails. You get a grace period during which Lucy continues answering calls and your account works normally. We will send you email notifications so you know there is a billing issue that needs attention.

### What to Do

If you get a failed payment notice:

1. **Check your card** -- Make sure it has not expired and has sufficient funds
2. **Update your card** -- If needed, add a new card in **Settings** then **Billing**
3. **Contact your bank** -- Sometimes banks block recurring charges. A quick call to your bank can resolve it
4. **Reach out to us** -- If you are having trouble, our support team can help sort it out

### What Happens If Payment Is Not Resolved

If retries are exhausted and no valid payment method is on file, your account will be paused:

- Lucy stops answering calls
- Your dashboard becomes read-only
- Your data is preserved -- nothing is deleted
- You can reactivate at any time by adding a valid card

This is the same as what happens after a trial ends. See [Free Trial Policy](free-trial-policy.md) for more on how paused accounts work.

## Security

Your payment information is safe:

- **Stripe handles everything.** Your card number is sent directly to Stripe's PCI-compliant servers. We never see or store your full card number.
- **Encrypted connections.** All payment data is transmitted over encrypted (HTTPS) connections.
- **No card data on our servers.** We only store a Stripe reference token, not your actual card details.

For more on how we protect your account, see [Security Settings](../account/security-settings.md).

## Common Questions

**Can I pay annually?**
Not yet, but we are considering it. For now, all subscriptions are monthly at $99/mo. See [Plans and Pricing](plans-and-pricing.md).

**Can I use a prepaid card?**
Most prepaid cards work as long as they support recurring charges. Some do not -- if your prepaid card is declined, try a standard debit or credit card.

**Who is the charge from on my statement?**
The charge will appear as "Atlas UX" or "ATLASUX" on your card statement.


---
## Media

> **Tags:** `stripe` · `payments` · `billing` · `subscriptions` · `checkout` · `webhooks`

### Official Resources
- [Official Documentation](https://docs.stripe.com)
- [Stripe Documentation](https://docs.stripe.com)
- [Stripe API Reference](https://docs.stripe.com/api)
- [Stripe Dashboard](https://dashboard.stripe.com)

### Video Tutorials
- [Stripe Payments Integration Tutorial](https://www.youtube.com/results?search_query=stripe+payments+integration+tutorial+2025) — *Credit: Stripe on YouTube* `tutorial`
- [Stripe Checkout & Subscriptions Guide](https://www.youtube.com/results?search_query=stripe+checkout+subscriptions+guide+tutorial) — *Credit: Stripe Dev on YouTube* `tutorial`

> *All video content is credited to original creators. Links direct to source platforms.*
