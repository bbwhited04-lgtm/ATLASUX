# 🔑 Atlas UX - Stripe Credentials Configuration

## ✅ Your Stripe Price IDs

You've created your Stripe products! Here are your Price IDs:

```
Starter:       price_1SwlTXKC49F2A9Oznk7DoYV8  (Min: 1 seat)
Professional:  price_1SwlUBKC49F2A9OzLo1QbkAl  (Min: 5 seats)
Business:      price_1SwljWKC49F2A9OzD2R2kTGf  (Min: 10 seats)
Enterprise:    price_1SwlkqKC49F2A9Oz505XsHQO  (Min: 50 seats)
```

---

## 🚀 Setup Instructions

### Step 1: Add Secrets to Supabase

Go to your Supabase Dashboard:
1. Open your project
2. Navigate to **Project Settings** → **Edge Functions**
3. Scroll to **Secrets** section
4. Click **"Add new secret"** for each of these:

```bash
# Stripe API Keys (Get from: https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs (Your actual IDs)
STRIPE_PRICE_STARTER_MONTHLY=price_1SwlTXKC49F2A9Oznk7DoYV8
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1SwlUBKC49F2A9OzLo1QbkAl
STRIPE_PRICE_BUSINESS_MONTHLY=price_1SwljWKC49F2A9OzD2R2kTGf
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1SwlkqKC49F2A9Oz505XsHQO

# Stripe Webhook Secret (Get after creating webhook endpoint)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📋 Step-by-Step: Adding Each Secret

### 1. Get Your Stripe API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. **Copy Secret Key** (starts with `sk_test_`)
3. **Copy Publishable Key** (starts with `pk_test_`)

### 2. Add to Supabase

**STRIPE_SECRET_KEY:**
```
Name:  STRIPE_SECRET_KEY
Value: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       (paste your actual secret key)
```

**STRIPE_PUBLISHABLE_KEY:**
```
Name:  STRIPE_PUBLISHABLE_KEY
Value: pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       (paste your actual publishable key)
```

### 3. Add Price IDs (Copy-Paste Ready)

**STRIPE_PRICE_STARTER_MONTHLY:**
```
Name:  STRIPE_PRICE_STARTER_MONTHLY
Value: price_1SwlTXKC49F2A9Oznk7DoYV8
```

**STRIPE_PRICE_PROFESSIONAL_MONTHLY:**
```
Name:  STRIPE_PRICE_PROFESSIONAL_MONTHLY
Value: price_1SwlUBKC49F2A9OzLo1QbkAl
```

**STRIPE_PRICE_BUSINESS_MONTHLY:**
```
Name:  STRIPE_PRICE_BUSINESS_MONTHLY
Value: price_1SwljWKC49F2A9OzD2R2kTGf
```

**STRIPE_PRICE_ENTERPRISE_MONTHLY:**
```
Name:  STRIPE_PRICE_ENTERPRISE_MONTHLY
Value: price_1SwlkqKC49F2A9Oz505XsHQO
```

---

## 🔔 Step 3: Set Up Webhooks

### 1. Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-cb847823/webhooks/stripe
   ```
   
   **Example:**
   ```
   https://abcdefghijk.supabase.co/functions/v1/make-server-cb847823/webhooks/stripe
   ```

4. Select these events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

5. Click **"Add endpoint"**

### 2. Copy Webhook Secret

After creating the endpoint:
1. Click on your webhook endpoint
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to Supabase:

```
Name:  STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       (paste your webhook secret)
```

---

## ✅ Verification Checklist

After adding all secrets, verify:

- [ ] **STRIPE_SECRET_KEY** added (starts with `sk_test_`)
- [ ] **STRIPE_PUBLISHABLE_KEY** added (starts with `pk_test_`)
- [ ] **STRIPE_PRICE_STARTER_MONTHLY** = `price_1SwlTXKC49F2A9Oznk7DoYV8`
- [ ] **STRIPE_PRICE_PROFESSIONAL_MONTHLY** = `price_1SwlUBKC49F2A9OzLo1QbkAl`
- [ ] **STRIPE_PRICE_BUSINESS_MONTHLY** = `price_1SwljWKC49F2A9OzD2R2kTGf`
- [ ] **STRIPE_PRICE_ENTERPRISE_MONTHLY** = `price_1SwlkqKC49F2A9Oz505XsHQO`
- [ ] **STRIPE_WEBHOOK_SECRET** added (starts with `whsec_`)
- [ ] Webhook endpoint created in Stripe
- [ ] Edge Functions deployed to Supabase

---

## 🧪 Testing

### 1. Test Checkout Flow

1. Open Atlas UX app
2. Navigate to `/subscription`
3. Click **"Upgrade Plan"**
4. Select **"Professional - $249/mo"**
5. Click **"Upgrade"** button
6. You should be redirected to Stripe Checkout

### 2. Complete Test Payment

Use Stripe test card:
```
Card Number: 4242 4242 4242 4242
Expiry:      12/34 (any future date)
CVC:         123 (any 3 digits)
ZIP:         12345 (any 5 digits)
```

### 3. Verify Subscription Created

After payment:
1. You'll be redirected back to `/subscription?success=true`
2. Your plan should show as "Professional"
3. Seats should show "0 / 5 used"

### 4. Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. You should see your subscription
3. Status: Active
4. Amount: $249.00/month

### 5. Test Webhook

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint
3. You should see events logged:
   - `customer.subscription.created`
   - `invoice.paid`
4. Status should be "Succeeded"

---

## 🔧 Troubleshooting

### Error: "No such price"
**Solution:** Check that price IDs in Supabase match exactly (copy-paste from above)

### Error: "Invalid API Key"
**Solution:** 
1. Make sure you're using **test** keys (start with `sk_test_` and `pk_test_`)
2. Verify keys are copied correctly (no extra spaces)

### Error: "Webhook signature verification failed"
**Solution:**
1. Check `STRIPE_WEBHOOK_SECRET` is set correctly
2. Make sure webhook URL matches your Supabase project URL
3. Verify webhook secret hasn't been regenerated

### Checkout doesn't redirect
**Solution:**
1. Check browser console for errors
2. Verify user is logged in (has auth token)
3. Check Supabase Edge Functions logs

### Subscription not showing in UI
**Solution:**
1. Check browser Network tab for API errors
2. Verify backend received webhook (check Supabase logs)
3. Check KV store for subscription data

---

## 📊 Minimum Quantity Enforcement

Your pricing structure:

| Plan | Price ID | Min Quantity | Price/Seat | Total Min Price |
|------|----------|--------------|------------|-----------------|
| **Starter** | `price_1SwlTXKC49F2A9Oznk7DoYV8` | 1 | $99 | $99/mo |
| **Professional** | `price_1SwlUBKC49F2A9OzLo1QbkAl` | 5 | $49.80 | $249/mo |
| **Business** | `price_1SwljWKC49F2A9OzD2R2kTGf` | 10 | $45 | $450/mo |
| **Enterprise** | `price_1SwlkqKC49F2A9Oz505XsHQO` | 50 | $40 | $2,000/mo |

The frontend will automatically enforce minimum quantities when creating checkout sessions.

---

## 🚀 Deploy Edge Functions

After adding secrets, deploy your Edge Functions:

```bash
# If using Supabase CLI locally
supabase functions deploy make-server-cb847823

# Or deploy through Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Select make-server-cb847823
# 3. Click "Deploy"
```

---

## 🎉 You're Ready!

Once all secrets are added:
1. ✅ Subscriptions will work
2. ✅ Checkout flow will redirect to Stripe
3. ✅ Webhooks will sync subscription status
4. ✅ Invoices will be tracked
5. ✅ Team management will work
6. ✅ Usage stats will update

**Start selling! 💰**

---

## 📞 Support

**If you get stuck:**

1. **Check Supabase Logs:**
   - Dashboard → Edge Functions → Logs
   - Look for errors in API calls

2. **Check Stripe Logs:**
   - Dashboard → Developers → Logs
   - See all API requests and webhook attempts

3. **Verify Environment Variables:**
   - Supabase → Settings → Edge Functions → Secrets
   - Make sure all 7 secrets are set

4. **Test in Stripe CLI:**
   ```bash
   stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/make-server-cb847823/webhooks/stripe
   ```

---

## 🔄 When Going Live

### Switch to Live Mode

1. **Recreate Prices in Live Mode:**
   - Toggle Stripe to "Live Mode"
   - Create same 4 prices
   - Copy new live price IDs

2. **Get Live API Keys:**
   - Dashboard → API Keys (Live Mode)
   - Copy `sk_live_` and `pk_live_` keys

3. **Update Supabase Secrets:**
   - Replace all `sk_test_` with `sk_live_`
   - Replace all `pk_test_` with `pk_live_`
   - Replace all test price IDs with live price IDs
   - Update webhook secret

4. **Recreate Webhook:**
   - Create new webhook in Live Mode
   - Use same URL
   - Copy new live webhook secret

5. **Test with Real Card:**
   - Make $1 test purchase
   - Verify it works
   - Refund immediately
   - Launch! 🚀

---

**All set! Your exact Price IDs are now integrated.** 🎊
