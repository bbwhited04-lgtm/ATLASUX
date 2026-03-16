# Landing Page Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing page to convert trade business owners — replace 0% conversion rate with a live demo CTA, 3-tier pricing, trust signals, and vertical-specific messaging.

**Architecture:** Refactor `Landing.tsx` (993 lines) into focused section components. New hero with "Call Lucy Now" as primary CTA using live Twilio number (573) 742-2028. Replace 6-tier pricing confusion with 3 clear tiers. Add founder trust section. Form submits to backend instead of mailto.

**Tech Stack:** React 18, Tailwind CSS, existing dark theme (`#0a0f1e` bg, `#69b2cd` cyan accent), HashRouter

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Rewrite | `src/pages/Landing.tsx` | Orchestrates sections, slimmed to imports + layout |
| Create | `src/components/landing/HeroSection.tsx` | Hero with "Call Lucy" CTA + phone number |
| Create | `src/components/landing/PricingSection.tsx` | 3-tier pricing table with trial CTA |
| Create | `src/components/landing/TrustSection.tsx` | Founder story, guarantee, testimonial placeholders |
| Create | `src/components/landing/HowItWorks.tsx` | 3-step "how Lucy works" explainer |
| Create | `src/components/landing/VerticalSection.tsx` | Vertical-specific value props (salons, plumbers, HVAC) |
| Create | `src/components/landing/EarlyAccessForm.tsx` | Signup form posting to backend |
| Keep | `src/components/landing/AgentRoster.tsx` | Extract existing agent roster section |
| Keep | `src/components/landing/IntegrationsSection.tsx` | Extract existing integrations section |
| Modify | `src/components/public/PublicHeader.tsx` | Add "Call Lucy" phone link in header |
| Modify | `src/routes.ts` | Add `/salons` and `/plumbers` vertical routes |
| Create | `src/pages/Salons.tsx` | Salon-specific landing page |
| Create | `src/pages/Plumbers.tsx` | Plumber-specific landing page |

---

## Chunk 1: Hero + Header (Priority: P0 — conversion blocker)

### Task 1: Create HeroSection component

**Files:**
- Create: `src/components/landing/HeroSection.tsx`

- [ ] **Step 1: Create the hero component**

Hero must communicate in <10 seconds:
- What: AI receptionist that answers your phone
- Why: Never lose a customer to a missed call
- Proof: Live phone number to call right now
- Price: Starting at $99/mo, 14-day free trial

```tsx
// Key elements:
// - Headline: "Never Miss Another Call"
// - Subhead: "Lucy answers your business phone 24/7 — books appointments, takes messages, sounds human."
// - Primary CTA: phone icon + "Call Lucy Now: (573) 742-2028" (tel: link)
// - Secondary CTA: "Start Free Trial — No Credit Card"
// - Social proof: "Answers in <2 rings · Books appointments · Costs less than one missed job"
// - Keep existing gradient bg + grid pattern from current Landing.tsx
```

- [ ] **Step 2: Verify it renders in dev**

Run: `npm run dev` — check localhost:5173

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/HeroSection.tsx
git commit -m "feat: add hero section with Call Lucy CTA"
```

### Task 2: Update PublicHeader with phone CTA

**Files:**
- Modify: `src/components/public/PublicHeader.tsx`

- [ ] **Step 1: Add phone link to header**

Add a "Call Lucy: (573) 742-2028" link with phone icon in the header right slot, visible on desktop. On mobile, show phone icon only.

- [ ] **Step 2: Verify responsive behavior**

Check at 375px, 768px, 1024px widths.

- [ ] **Step 3: Commit**

```bash
git add src/components/public/PublicHeader.tsx
git commit -m "feat: add Call Lucy phone CTA to header"
```

---

## Chunk 2: Pricing Section (Priority: P0 — tier confusion)

### Task 3: Create PricingSection component

**Files:**
- Create: `src/components/landing/PricingSection.tsx`

- [ ] **Step 1: Create 3-tier pricing component**

Tiers per playbook Phase C decision:
- **Standard $99/mo**: Lucy answers calls 24/7, 200 calls/mo, appointment booking, SMS confirmations, call summaries, 1 business location
- **Team $149/mo**: Everything in Standard + 5 team seats, priority support, Mercer outbound (when available), advanced analytics
- **Enterprise $40/seat/mo**: Custom, multi-location, dedicated onboarding, SLA, API access

Each tier card:
- Price with "/mo" suffix
- "Most Popular" badge on Standard
- Feature list with checkmarks
- CTA button: "Start 14-Day Free Trial" (Standard/Team) / "Contact Us" (Enterprise)
- Annual toggle: "$990/yr (save $198)" for Standard

Value reframe above pricing: "Less than one missed $150 appointment per month"

- [ ] **Step 2: Verify pricing renders correctly**

Run dev server, scroll to pricing section.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/PricingSection.tsx
git commit -m "feat: add 3-tier pricing section"
```

---

## Chunk 3: Trust & Social Proof (Priority: P0 — trust deficit)

### Task 4: Create TrustSection component

**Files:**
- Create: `src/components/landing/TrustSection.tsx`

- [ ] **Step 1: Create trust section**

Elements:
- Founder story: "I'm Billy. I built Lucy because my barber kept missing calls and losing customers. Now she answers for businesses like yours."
- Photo placeholder (use initials avatar until real photo)
- Money-back guarantee badge: "30 days or your money back"
- Testimonial placeholders (3 cards): "Your story here — be one of our first 50 customers and get grandfathered pricing forever"
- Billy's contact: "Questions? Text me: [phone number placeholder]"
- Trust badges: "256-bit encrypted · SOC2 ready · HIPAA aware · 99.9% uptime"

- [ ] **Step 2: Verify rendering**

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/TrustSection.tsx
git commit -m "feat: add trust section with founder story and guarantees"
```

### Task 5: Create HowItWorks component

**Files:**
- Create: `src/components/landing/HowItWorks.tsx`

- [ ] **Step 1: Create 3-step explainer**

Steps:
1. "Forward Your Number" — Point your business phone to Lucy (takes 2 minutes)
2. "Lucy Answers" — She greets callers by your business name, books appointments, takes messages
3. "You Get Notified" — Instant text/email with call summary, new bookings on your calendar

Each step: number badge, icon, title, 1-sentence description.

Below steps: "Try it now — call (573) 742-2028 and hear Lucy answer"

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/HowItWorks.tsx
git commit -m "feat: add how-it-works 3-step explainer"
```

---

## Chunk 4: Vertical Sections + Pages (Priority: P1 — targeting)

### Task 6: Create VerticalSection component

**Files:**
- Create: `src/components/landing/VerticalSection.tsx`

- [ ] **Step 1: Create vertical value props**

3 vertical cards on main landing page:
- **Salons & Barbers**: "Lucy books appointments while you color hair. Never lose a $60 cut to voicemail."
- **Plumbers & HVAC**: "Never lose a $300 service call again. Lucy answers while you're under the sink."
- **Dentists & Medical**: "Lucy handles appointment requests, insurance questions, and emergency routing."

Each card links to dedicated vertical page.

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/VerticalSection.tsx
git commit -m "feat: add vertical-specific value prop section"
```

### Task 7: Create Salons vertical landing page

**Files:**
- Create: `src/pages/Salons.tsx`
- Modify: `src/routes.ts`

- [ ] **Step 1: Create salon-specific page**

Reuses HeroSection but with salon messaging:
- "Never Lose a Booking Again"
- "Lucy answers your salon phone, books appointments, and sends confirmations — while you focus on your clients."
- Same CTA: Call Lucy number
- Salon-specific features: appointment booking, service menu awareness, walk-in availability
- Pricing section (reuse component)

- [ ] **Step 2: Add route**

Add `/salons` route in `src/routes.ts` under PublicLayout.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Salons.tsx src/routes.ts
git commit -m "feat: add salon vertical landing page"
```

### Task 8: Create Plumbers vertical landing page

**Files:**
- Create: `src/pages/Plumbers.tsx`
- Modify: `src/routes.ts`

- [ ] **Step 1: Create plumber-specific page**

Same pattern as Salons but with plumber messaging:
- "Never Lose a $300 Job to Voicemail"
- "Lucy answers your phone on the job site, captures the details, and texts you the summary."
- Plumber-specific features: emergency triage, job detail capture, callback scheduling

- [ ] **Step 2: Add route, commit**

```bash
git add src/pages/Plumbers.tsx src/routes.ts
git commit -m "feat: add plumber vertical landing page"
```

---

## Chunk 5: Form + Landing Assembly (Priority: P0 — signup flow)

### Task 9: Create EarlyAccessForm component

**Files:**
- Create: `src/components/landing/EarlyAccessForm.tsx`

- [ ] **Step 1: Create form component**

Replace mailto-based form with a real form that:
- Collects: name, email, business name, business type (dropdown: Salon, Plumber, HVAC, Dentist, Other), phone number
- Posts to backend `/v1/leads` (or existing early access endpoint)
- Shows success state: "We'll text you within 24 hours to get Lucy set up."
- Fallback: if backend fails, fall back to mailto

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/EarlyAccessForm.tsx
git commit -m "feat: add early access signup form"
```

### Task 10: Rewrite Landing.tsx to assemble sections

**Files:**
- Rewrite: `src/pages/Landing.tsx`

- [ ] **Step 1: Slim Landing.tsx to section imports**

New section order (playbook-informed):
1. HeroSection — "Call Lucy Now" + trial CTA
2. HowItWorks — 3-step explainer
3. VerticalSection — salon/plumber/dentist cards
4. PricingSection — 3 tiers
5. TrustSection — founder + guarantees
6. Agent Roster (keep existing, extract to component)
7. Integrations (keep existing, extract to component)
8. EarlyAccessForm — signup
9. Keep existing SEO component

Remove: Dev updates list (809 items), selling points duplication, platform availability box.

- [ ] **Step 2: Extract AgentRoster from Landing.tsx**

Move lines 332-399 to `src/components/landing/AgentRoster.tsx`.

- [ ] **Step 3: Extract IntegrationsSection from Landing.tsx**

Move lines 404-450 to `src/components/landing/IntegrationsSection.tsx`.

- [ ] **Step 4: Verify full page renders**

Run: `npm run dev` — scroll through all sections.

- [ ] **Step 5: Run production build**

Run: `npm run build` — verify no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Landing.tsx src/components/landing/
git commit -m "feat: assemble new landing page from playbook recommendations"
```

---

## Chunk 6: Backend Lead Capture (Priority: P1)

### Task 11: Add leads endpoint

**Files:**
- Create: `backend/src/routes/leadRoutes.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Create lead capture route**

`POST /v1/leads` — accepts: name, email, businessName, businessType, phone. Stores in a new `leads` table or uses existing CRM contact creation. Returns 201.

- [ ] **Step 2: Register route in server.ts**

- [ ] **Step 3: Build backend**

Run: `cd backend && npm run build`

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/leadRoutes.ts backend/src/server.ts
git commit -m "feat: add /v1/leads endpoint for landing page signups"
```

---

## Execution Order

1. **Tasks 1-2** (Hero + Header) — ship immediately, biggest conversion impact
2. **Task 3** (Pricing) — remove tier confusion
3. **Tasks 4-5** (Trust + HowItWorks) — build credibility
4. **Task 10** (Assemble Landing) — wire it all together
5. **Task 9 + 11** (Form + Backend) — capture leads
6. **Tasks 6-8** (Verticals) — targeted pages

Total: ~11 tasks, shipping in priority order.
