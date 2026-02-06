# 🚀 Atlas UX - Stripe Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Create Stripe Account (2 min)
1. Go to https://stripe.com
2. Sign up for free
3. Enable **Test Mode** (toggle in top right)

---

### Step 2: Create Product (1 min)
1. Go to: https://dashboard.stripe.com/products
2. Click **"Add product"**
3. Fill in:
   - **Name:** `Atlas UX`
   - **Description:** `AI-powered desktop assistant with 65+ integrations`
   - Upload logo (use logo from `/STRIPE_SETUP_GUIDE.md`)

---

### Step 3: Create Prices (2 min)
Click **"Add another price"** 4 times to create these prices:

#### Price 1: Starter Monthly
- **Price:** `$99.00`
- **Recurring:** Monthly
- **Lookup key:** `atlas_ux_starter_monthly`

#### Price 2: Professional Monthly ⭐
- **Price:** `$249.00`
- **Recurring:** Monthly
- **Lookup key:** `atlas_ux_professional_monthly`

#### Price 3: Business Monthly
- **Price:** `$45.00`
- **Recurring:** Monthly
- **Usage type:** Per unit
- **Lookup key:** `atlas_ux_business_monthly`

#### Price 4: Enterprise Monthly
- **Price:** `$40.00`
- **Recurring:** Monthly
- **Usage type:** Per unit
- **Lookup key:** `atlas_ux_enterprise_monthly`

**Optional:** Repeat for annual prices (see full guide for details)

---

### Step 4: Get API Keys
1. Go to: https://dashboard.stripe.com/apikeys
2. **Copy both keys:**
   - Secret key (starts with `sk_test_`)
   - Publishable key (starts with `pk_test_`)

---

### Step 5: Copy Price IDs
1. Go back to: https://dashboard.stripe.com/products
2. Click on your "Atlas UX" product
3. **Copy each Price ID** (starts with `price_`)
4. You'll need these for your environment variables

---

### Step 6: Set Environment Variables

Add these to your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add these secrets:

```bash
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Copy your actual price IDs from Stripe dashboard
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
```

---

### Step 7: Test It! 🎉

1. Navigate to `/subscription` in your Atlas UX app
2. Click **"Upgrade Plan"**
3. Select a plan
4. Click **"Upgrade"** button
5. Use Stripe test card: `4242 4242 4242 4242`
6. Use any future expiry date
7. Use any 3-digit CVC

**Success!** You should see a subscription created.

---

## 🔔 Optional: Enable Webhooks (for production)

### For Local Testing:
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
scoop install stripe                    # Windows

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### For Production:
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/make-server-cb847823/webhooks/stripe
   ```
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **webhook signing secret** (starts with `whsec_`)
6. Add to Supabase secrets:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

---

## 🎨 Customize Customer Portal

1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Enable:
   - ✅ Update payment method
   - ✅ Cancel subscription (at period end)
   - ✅ View invoices
3. **Branding:**
   - Upload your logo
   - Set brand colors (Cyan #06b6d4)
   - Add support email
4. Save settings

---

## 💳 Test Cards

Use these in **Test Mode**:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success ✅ |
| `4000 0000 0000 0002` | Decline ❌ |
| `4000 0025 0000 3155` | 3D Secure |
| `4000 0000 0000 9995` | Insufficient funds |

- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

---

## 🚀 Go Live Checklist

When ready to accept real payments:

- [ ] Complete Stripe account verification
- [ ] Add business details
- [ ] Add bank account for payouts
- [ ] Switch to **Live Mode**
- [ ] Recreate all products/prices in live mode
- [ ] Update environment variables with live keys
- [ ] Test with a real $1 transaction
- [ ] Cancel test transaction
- [ ] Enable production webhooks
- [ ] Launch! 🎉

---

## 📊 Monitor Your Revenue

**Stripe Dashboard:** https://dashboard.stripe.com

Key sections:
- **Home:** Revenue overview
- **Payments:** All transactions
- **Subscriptions:** Active subscriptions
- **Customers:** Customer list
- **Invoices:** Billing history
- **Reports:** Financial reports

---

## 🆘 Troubleshooting

### "No such price" error
→ Check that price IDs in environment variables match Stripe dashboard

### "No such customer" error
→ User hasn't been created in Stripe yet, run checkout flow first

### Webhook signature verification failed
→ Check that `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint

### "Unauthorized" errors
→ Check that user is logged in and passing auth token

### Test mode vs Live mode
→ Make sure all keys (API keys + price IDs) are from the same mode

---

## 💡 Pro Tips

1. **Use Test Mode extensively** - Never skip testing!
2. **Set up failed payment emails** - Stripe can send these automatically
3. **Enable tax collection** - Stripe Tax handles global compliance
4. **Create promo codes** - Great for marketing campaigns
5. **Monitor churn rate** - Check which plans have highest cancellations
6. **Offer annual discount** - 20% off encourages longer commitments
7. **Use Stripe Sigma** - SQL queries for custom reports (paid feature)

---

## 📱 Mobile App Integration

Your mobile companion app can:
- View subscription status via API: `GET /make-server-cb847823/stripe/subscription`
- Approve pending tasks (requires active subscription)
- View usage stats: `GET /make-server-cb847823/stripe/usage`
- Open customer portal to manage billing

---

## 📞 Support

**Stripe Support:**
- Email: support@stripe.com
- Chat: https://support.stripe.com
- Phone: 1-888-926-2289 (US)
- Docs: https://stripe.com/docs

**Atlas UX Support:**
- Integration is complete ✅
- All API endpoints are live ✅
- Frontend UI is ready ✅
- Just add your Stripe keys! 🔑

---

## 🎉 You're Done!

Your subscription system is now fully operational. Users can:
- ✅ View pricing plans
- ✅ Purchase subscriptions
- ✅ Manage team seats
- ✅ View usage stats
- ✅ Download invoices
- ✅ Update payment methods
- ✅ Cancel subscriptions

**Happy selling!** 💰
