# 💳 Atlas UX - Stripe Product Setup Guide

## 📋 Product Configuration

### **Main Product: "Atlas UX"**
- **Type:** Service
- **Description:** AI-powered desktop assistant that operates directly from your PC with comprehensive integrations, automation, and learning capabilities.
- **Statement Descriptor:** ATLAS_UX (appears on credit card statements)

---

## 🎨 Product Image/Logo

Upload your Atlas UX logo to Stripe. Use this SVG or convert to PNG (minimum 512x512px):

**Logo SVG Code:**
```svg
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width="512" height="512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#06b6d4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="40" fill="url(#grad)"/>
  <path d="M100 40L40 70v60c0 33.3 23.04 64.44 54 72 30.96-7.56 54-38.7 54-72V70l-60-30zm0 108c-19.86 0-36-16.14-36-36s16.14-36 36-36 36 16.14 36 36-16.14 36-36 36z" fill="white"/>
  <circle cx="100" cy="112" r="20" fill="url(#grad)"/>
</svg>
```

**How to Upload:**
1. Go to: https://dashboard.stripe.com/products
2. Click "Add product"
3. Upload the logo image
4. Fill in product details below

---

## 💰 Pricing Tiers Setup

### **IMPORTANT: Create 4 Separate Prices (NOT 4 Products)**

Create **ONE product** called "Atlas UX" with **FOUR different prices** for the different tiers.

---

## 🏗️ Step-by-Step Stripe Setup

### **Step 1: Create the Product**

1. Go to: https://dashboard.stripe.com/products
2. Click **"Add product"**
3. Fill in:
   - **Name:** `Atlas UX`
   - **Description:** 
     ```
     AI-powered desktop assistant with Neptune Control system and Pluto job runner. 
     Includes 65+ integrations with ChatGPT, Claude, social media platforms, 
     CRM tools, and cloud storage. Features voice recognition, automation, 
     and mobile app sync.
     ```
   - **Image:** Upload your logo (512x512px minimum)
   - **Statement descriptor:** `ATLAS_UX`

4. Click **"Save product"** (don't add pricing yet)

---

### **Step 2: Add Pricing Tiers**

Now add **4 prices** to the same product:

---

#### **Price #1: Starter**

Click **"Add another price"** on your Atlas UX product:

**Settings:**
- **Price model:** Standard pricing
- **Price:** `$99.00` USD
- **Billing period:** Monthly
- **Price description:** `Starter - 1 User Seat`
- **Lookup key:** `atlas_ux_starter_monthly`
- **Metadata:**
  ```
  tier: starter
  seats: 1
  max_integrations: 10
  jobs_limit: 500
  features: basic
  ```

---

#### **Price #2: Professional** ⭐ (Most Popular)

Click **"Add another price"** again:

**Settings:**
- **Price model:** Standard pricing
- **Price:** `$249.00` USD
- **Billing period:** Monthly
- **Price description:** `Professional - 5 User Seats`
- **Lookup key:** `atlas_ux_professional_monthly`
- **Metadata:**
  ```
  tier: professional
  seats: 5
  price_per_seat: 49.80
  max_integrations: 65
  jobs_limit: unlimited
  features: full
  popular: true
  ```

---

#### **Price #3: Business**

Click **"Add another price"** again:

**Settings:**
- **Price model:** Per-unit pricing (metered billing)
- **Price:** `$45.00` USD per unit
- **Billing period:** Monthly
- **Price description:** `Business - Per User/Month (Min 10 seats)`
- **Lookup key:** `atlas_ux_business_monthly`
- **Metadata:**
  ```
  tier: business
  min_seats: 10
  max_seats: 49
  price_per_seat: 45
  max_integrations: 65
  jobs_limit: unlimited
  features: full
  custom_integrations: 3
  support: dedicated_manager
  ```

---

#### **Price #4: Enterprise**

Click **"Add another price"** again:

**Settings:**
- **Price model:** Per-unit pricing (metered billing)
- **Price:** `$40.00` USD per unit
- **Billing period:** Monthly
- **Price description:** `Enterprise - Per User/Month (Min 50 seats)`
- **Lookup key:** `atlas_ux_enterprise_monthly`
- **Metadata:**
  ```
  tier: enterprise
  min_seats: 50
  price_per_seat: 40
  max_integrations: unlimited
  jobs_limit: unlimited
  features: full
  custom_integrations: unlimited
  support: 24_7_priority
  sla: 99_9
  on_premise: true
  volume_discount: true
  ```

---

## 📊 Volume-Based Enterprise Pricing

For Enterprise volume discounts, create additional prices:

#### **Enterprise 100+** (Optional)
- **Price:** `$35.00` per user/month
- **Lookup key:** `atlas_ux_enterprise_100_monthly`
- **Metadata:** `min_seats: 100, tier: enterprise_100`

#### **Enterprise 250+** (Optional)
- **Price:** `$30.00` per user/month
- **Lookup key:** `atlas_ux_enterprise_250_monthly`
- **Metadata:** `min_seats: 250, tier: enterprise_250`

#### **Enterprise 500+** (Optional)
- **Price:** `$25.00` per user/month
- **Lookup key:** `atlas_ux_enterprise_500_monthly`
- **Metadata:** `min_seats: 500, tier: enterprise_500`

---

## 🎟️ Annual Pricing (20% Discount)

Create annual variants for each tier:

### **Starter Annual**
- **Price:** `$950.00` USD (save $238)
- **Billing period:** Yearly
- **Lookup key:** `atlas_ux_starter_annual`

### **Professional Annual**
- **Price:** `$2,388.00` USD (save $597)
- **Billing period:** Yearly
- **Lookup key:** `atlas_ux_professional_annual`

### **Business Annual**
- **Price:** `$43.00` per user/year (save $54 per user)
- **Billing period:** Yearly
- **Lookup key:** `atlas_ux_business_annual`

### **Enterprise Annual**
- **Price:** `$38.00` per user/year (save $48 per user)
- **Billing period:** Yearly
- **Lookup key:** `atlas_ux_enterprise_annual`

---

## 🔑 Copy These IDs After Creation

After creating each price, copy the **Price ID** (starts with `price_`):

```env
# Stripe Price IDs (copy from Stripe dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_STARTER_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS_ANNUAL=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_ANNUAL=price_xxxxxxxxxxxxx

# Enterprise volume tiers (optional)
STRIPE_PRICE_ENTERPRISE_100_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_250_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE_500_MONTHLY=price_xxxxxxxxxxxxx
```

---

## ⚙️ Additional Stripe Settings

### **Customer Portal**
Enable customer portal so users can manage their own subscriptions:

1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Enable:
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Cancel subscription
   - ✅ Update subscription (allow plan switching)
3. Set cancellation flow:
   - ❌ Cancel immediately (bad UX)
   - ✅ Cancel at period end (recommended)
4. Save settings

### **Webhooks**
Set up webhooks to sync subscription changes:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.updated`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

---

## 🧪 Test Mode

**IMPORTANT:** Start in **Test Mode** first!

1. Toggle **"Test mode"** in Stripe dashboard (top right)
2. Create all products/prices in test mode
3. Use test credit cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
4. Test the entire flow
5. When ready, repeat setup in **Live Mode**

---

## 📱 Stripe CLI (Optional - For Local Testing)

Install Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Product "Atlas UX" created with logo
- [ ] 4 monthly prices created (Starter, Professional, Business, Enterprise)
- [ ] 4 annual prices created (with 20% discount)
- [ ] Lookup keys set for all prices
- [ ] Metadata added to all prices
- [ ] Customer portal enabled
- [ ] Webhook endpoint configured
- [ ] Test mode working
- [ ] Price IDs copied to environment variables

---

## 🚀 Next Steps

1. ✅ Complete Stripe setup (this guide)
2. ⚙️ Add Stripe API keys to environment variables
3. 🔧 Implement backend integration (see STRIPE_INTEGRATION.md)
4. 🧪 Test in development
5. 🌐 Deploy to production
6. 🎉 Start accepting payments!

---

## 💡 Pro Tips

1. **Use Lookup Keys:** They let you reference prices by name instead of IDs
2. **Add Rich Metadata:** Store plan features/limits in Stripe metadata
3. **Test Thoroughly:** Use test mode extensively before going live
4. **Set Up Dunning:** Configure failed payment retry logic
5. **Enable Tax Collection:** Stripe Tax handles global tax compliance
6. **Add Coupons:** Create promotional codes for marketing campaigns

---

## 🔗 Useful Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Products:** https://dashboard.stripe.com/products
- **Pricing:** https://dashboard.stripe.com/prices
- **Customers:** https://dashboard.stripe.com/customers
- **Webhooks:** https://dashboard.stripe.com/webhooks
- **API Keys:** https://dashboard.stripe.com/apikeys
- **Documentation:** https://stripe.com/docs

---

## 📞 Support

**Stripe Support:**
- Email: support@stripe.com
- Chat: https://support.stripe.com
- Phone: 1-888-926-2289 (US)

**Atlas UX Support:**
- Create backend integration using the code in `/supabase/functions/server/stripe-integration.tsx`
