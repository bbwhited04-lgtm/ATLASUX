# 🔄 Migrate Stripe Credentials from Render to Supabase

## Current Situation

✅ You have Stripe credentials configured on **Render** (https://shortypro.onrender.com/)
✅ Atlas UX subscription system is built for **Supabase Edge Functions** (serverless)

**Action Required:** Copy Stripe credentials from Render to Supabase

---

## 📋 Step-by-Step Migration

### Step 1: Get Credentials from Render

1. Go to: https://dashboard.render.com
2. Select your **shortypro** service
3. Click **"Environment"** tab
4. Find these two values:
   ```
   STRIPE_SECRET_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. **Copy both values** (you'll paste them into Supabase)

---

### Step 2: Add Credentials to Supabase

1. Go to: https://supabase.com/dashboard
2. Select your **Atlas UX project**
3. Go to **Project Settings** (gear icon, bottom left)
4. Click **Edge Functions** in the left sidebar
5. Scroll to **Secrets** section
6. Click **"Add new secret"** for each:

#### Secret #1: Stripe Secret Key
```
Name:  STRIPE_SECRET_KEY
Value: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       ↑ Paste from Render
```
Click **"Save"**

#### Secret #2: Stripe Webhook Secret
```
Name:  STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       ↑ Paste from Render
```
Click **"Save"**

#### Secret #3: Stripe Publishable Key (Optional)
If you have this in Render, copy it too:
```
Name:  STRIPE_PUBLISHABLE_KEY
Value: pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
       ↑ Paste from Render (or get from Stripe dashboard)
```
Click **"Save"**

---

### Step 3: Add Your Price IDs (Already Done!)

✅ Your Price IDs are already hardcoded in the code:
- `price_1SwlTXKC49F2A9Oznk7DoYV8` (Starter)
- `price_1SwlUBKC49F2A9OzLo1QbkAl` (Professional)
- `price_1SwljWKC49F2A9OzD2R2kTGf` (Business)
- `price_1SwlkqKC49F2A9Oz505XsHQO` (Enterprise)

**Optional:** Add them as environment variables for easier updates:
```
STRIPE_PRICE_STARTER_MONTHLY=price_1SwlTXKC49F2A9Oznk7DoYV8
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1SwlUBKC49F2A9OzLo1QbkAl
STRIPE_PRICE_BUSINESS_MONTHLY=price_1SwljWKC49F2A9OzD2R2kTGf
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_1SwlkqKC49F2A9Oz505XsHQO
```

---

### Step 4: Update Stripe Webhook Endpoint

Your webhook is probably pointing to your **Render backend** right now. Update it to point to **Supabase**:

1. Go to: https://dashboard.stripe.com/webhooks
2. Find your existing webhook endpoint
3. Click **"Edit"**
4. Change the URL to:
   ```
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/make-server-cb847823/webhooks/stripe
   ```
   
   **Example:**
   ```
   https://abcdefghijk.supabase.co/functions/v1/make-server-cb847823/webhooks/stripe
   ```

5. Make sure these events are selected:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`

6. Click **"Update endpoint"**

---

## 🔍 Find Your Supabase Project URL

**Method 1: Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Look for **"Project URL"**
5. It will be: `https://xxxxx.supabase.co`

**Method 2: Check Your Code**
Look in `/utils/supabase/info.tsx` or environment variables

---

## ✅ Verification Checklist

After migration, verify in **Supabase Dashboard**:

- [ ] `STRIPE_SECRET_KEY` is set (starts with `sk_test_` or `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` is set (starts with `whsec_`)
- [ ] `STRIPE_PUBLISHABLE_KEY` is set (optional, starts with `pk_test_` or `pk_live_`)
- [ ] Stripe webhook URL updated to point to Supabase
- [ ] Webhook events are selected correctly
- [ ] Edge Functions are deployed

---

## 🧪 Test Your Migration

### Test 1: API Health Check
```bash
# Test that the server is responding
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-cb847823/health

# Expected response:
{"status":"ok"}
```

### Test 2: Get Available Plans
```bash
curl https://YOUR_PROJECT.supabase.co/functions/v1/make-server-cb847823/stripe/plans

# Should return your 4 pricing plans with Price IDs
```

### Test 3: Subscription Flow
1. Open Atlas UX app
2. Go to `/subscription`
3. Click **"Upgrade Plan"**
4. Select **"Professional"**
5. Click **"Upgrade"**
6. Should redirect to Stripe Checkout ✅

### Test 4: Complete Payment
Use test card:
```
Card: 4242 4242 4242 4242
Exp:  12/34
CVC:  123
ZIP:  12345
```

Should:
- ✅ Process payment
- ✅ Redirect back to Atlas UX
- ✅ Show "Professional" plan active
- ✅ Show "0 / 5 seats used"

### Test 5: Verify Webhook
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your Supabase webhook endpoint
3. You should see recent events:
   - `customer.subscription.created`
   - `invoice.paid`
4. Status should be "Succeeded" ✅

---

## 🔄 What About the Render Backend?

### Option A: Keep Both
- **Render:** Use for other features (if any)
- **Supabase:** Use for subscriptions + future features
- ✅ Both can coexist

### Option B: Migrate Everything to Supabase
- Move all backend logic to Supabase Edge Functions
- Deprecate Render backend
- ✅ Simpler architecture, one less service to manage

### Option C: Keep Render as Backup
- Supabase is primary
- Render is backup/fallback
- ✅ Redundancy for critical features

---

## 💡 Pro Tips

**1. Use Environment-Specific Keys**
- **Test Mode:** Use `sk_test_` keys during development
- **Live Mode:** Use `sk_live_` keys in production

**2. Never Commit Secrets**
- ❌ Don't put keys in code
- ✅ Always use environment variables
- ✅ Add `.env` to `.gitignore`

**3. Rotate Webhook Secrets Regularly**
- Change webhook secret every 90 days
- Update in both Stripe and Supabase

**4. Monitor Webhook Deliveries**
- Check Stripe Dashboard regularly
- Look for failed webhook attempts
- Debug issues quickly

---

## 🆘 Troubleshooting

### Error: "Invalid API Key"
**Solution:** 
- Check that `STRIPE_SECRET_KEY` in Supabase matches Stripe Dashboard
- Make sure you're using correct mode (test vs live)
- Verify no extra spaces when copying

### Error: "Webhook signature verification failed"
**Solution:**
- Check that `STRIPE_WEBHOOK_SECRET` in Supabase matches the webhook endpoint in Stripe
- Verify webhook URL points to Supabase, not Render
- Webhook secret starts with `whsec_`

### Checkout doesn't redirect
**Solution:**
1. Check browser console for errors
2. Verify Supabase Edge Functions are deployed
3. Check Supabase Function logs for errors
4. Test with curl to verify API is responding

### Subscription created but not showing in UI
**Solution:**
1. Check webhook is configured correctly
2. Verify webhook events were delivered (Stripe Dashboard)
3. Check Supabase logs for webhook processing errors
4. Manually call: `GET /stripe/subscription` to debug

---

## 📊 Architecture After Migration

```
┌─────────────────────────────────┐
│      ATLAS UX DESKTOP APP       │
│        (React + Electron)       │
└─────────────────────────────────┘
              │
              │ HTTPS API Calls
              ▼
┌─────────────────────────────────┐
│   SUPABASE EDGE FUNCTIONS       │
│   (Serverless, Auto-scaling)    │
│                                 │
│   • Stripe Integration          │
│   • Subscription Management     │
│   • Team Management             │
│   • Usage Tracking              │
│   • Invoice Management          │
└─────────────────────────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌─────────────┐    ┌─────────────┐
│   STRIPE    │    │  SUPABASE   │
│  PLATFORM   │    │  DATABASE   │
│             │    │  (KV Store) │
│ • Checkout  │    │             │
│ • Billing   │    │ • Subscr.   │
│ • Webhooks  │    │ • Users     │
│ • Invoices  │    │ • Usage     │
└─────────────┘    └─────────────┘
```

**Render Backend:** No longer needed for Stripe (can deprecate or use for other features)

---

## ✅ Final Checklist

- [ ] Copied `STRIPE_SECRET_KEY` from Render to Supabase
- [ ] Copied `STRIPE_WEBHOOK_SECRET` from Render to Supabase
- [ ] Updated Stripe webhook URL to point to Supabase
- [ ] Verified webhook events are selected
- [ ] Tested API health check
- [ ] Tested subscription flow with test card
- [ ] Verified webhook delivery in Stripe Dashboard
- [ ] Checked Supabase logs for errors
- [ ] Subscription shows correctly in Atlas UX UI

---

## 🎉 You're Done!

After migration:
- ✅ Stripe credentials are in Supabase
- ✅ Webhooks point to Supabase Edge Functions
- ✅ Everything is serverless
- ✅ Auto-scaling built-in
- ✅ No need to manage Render backend for subscriptions

**Your subscription system is now fully serverless!** 🚀

---

## 📞 Need Help?

**Check These Files:**
- `SETUP_COMPLETE.md` - Final setup checklist
- `STRIPE_CREDENTIALS.md` - Environment variables guide
- `STRIPE_QUICK_START.md` - 5-minute setup
- `SUBSCRIPTION_ARCHITECTURE.md` - How everything works

**Supabase Logs:**
- Dashboard → Edge Functions → make-server-cb847823 → Logs

**Stripe Logs:**
- Dashboard → Developers → Logs
- Dashboard → Webhooks → Your endpoint → Events

---

**Happy migrating!** 🔄✨
