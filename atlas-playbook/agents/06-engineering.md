# Agent 06: Engineering

## Role
Principal engineer designing Atlas UX's technical architecture. Balance speed-to-market
(solo founder) with reliability (phone agents can't go down).

## Atlas UX Technical Context
- Frontend: Vite + React + Tailwind
- Backend: Node.js on Render
- Database: Supabase (PostgreSQL)
- Voice: [Twilio / Vonage / Vapi — specify current provider]
- AI: Claude API / OpenAI for agent intelligence
- Deployment: Vercel (frontend), Render (backend)
- Electron: Desktop app build exists

## 1. System Architecture

```
[Customer's Phone]
    │
    ▼
[Telephony Provider (Twilio/Vapi)]
    │ Webhook on incoming call
    ▼
[Lucy Voice Service]
    ├── Speech-to-Text (real-time)
    ├── AI Brain (Claude/OpenAI) → generates response
    ├── Text-to-Speech → plays to caller
    ├── Calendar API → checks/books appointments
    └── Notification Service → alerts business owner
    │
    ▼
[Atlas UX Backend (Render)]
    ├── API Layer (Express/Fastify)
    ├── Auth (Supabase Auth)
    ├── Business Logic
    ├── Webhook Handlers (Stripe, Telephony, Calendar)
    └── Mercer Outbound Queue
    │
    ▼
[Data Layer]
    ├── Supabase PostgreSQL (users, businesses, calls, subscriptions)
    ├── Supabase Storage (call recordings)
    ├── Redis (session cache, rate limits) — add when needed
    └── Stripe (billing)
    │
    ▼
[Frontend (Vercel)]
    ├── Landing page (atlasux.cloud)
    ├── Dashboard (call logs, analytics, settings)
    ├── Onboarding wizard
    └── Billing management

[Slack Integration]
    ├── SlackWorker bot
    ├── Channel management
    └── Real-time agent activity (for streams)
```

## 2. Database Schema (Core)

```sql
-- Businesses (the customer)
businesses(
  id uuid PK,
  owner_id uuid FK → users,
  name text NOT NULL,
  type text, -- salon, plumber, hvac, etc.
  phone text, -- business phone number
  timezone text DEFAULT 'America/New_York',
  greeting_script text, -- custom Lucy greeting
  hours jsonb, -- operating hours per day
  created_at timestamptz,
  updated_at timestamptz
)

-- Lucy Call Logs
calls(
  id uuid PK,
  business_id uuid FK → businesses,
  caller_phone text,
  caller_name text, -- if identified
  direction text CHECK (direction IN ('inbound', 'outbound')),
  agent text CHECK (agent IN ('lucy', 'mercer')),
  status text, -- answered, missed, voicemail, transferred
  duration_seconds int,
  summary text, -- AI-generated call summary
  transcript jsonb, -- full conversation
  recording_url text, -- encrypted storage URL
  outcome text, -- booked, message_taken, transferred, spam
  appointment_id uuid FK → appointments NULL,
  created_at timestamptz
)
INDEX: (business_id, created_at DESC), (caller_phone), (status)

-- Appointments (booked by Lucy)
appointments(
  id uuid PK,
  business_id uuid FK → businesses,
  call_id uuid FK → calls NULL,
  customer_name text,
  customer_phone text,
  service text,
  scheduled_at timestamptz,
  duration_minutes int DEFAULT 60,
  status text, -- confirmed, cancelled, completed, no_show
  calendar_event_id text, -- external calendar ID
  reminder_sent boolean DEFAULT false,
  created_at timestamptz
)
INDEX: (business_id, scheduled_at), (status)

-- Subscriptions
subscriptions(
  id uuid PK,
  business_id uuid FK → businesses,
  stripe_subscription_id text,
  tier text, -- limited, standalone, business, standalone_business, enterprise
  seats int DEFAULT 1,
  status text, -- active, past_due, cancelled, trialing
  current_period_end timestamptz,
  created_at timestamptz
)

-- Mercer Campaigns
mercer_campaigns(
  id uuid PK,
  name text,
  target_vertical text, -- salon, plumber, etc.
  target_region text,
  script_template text,
  status text, -- active, paused, completed
  calls_made int DEFAULT 0,
  demos_booked int DEFAULT 0,
  created_at timestamptz
)

-- Mercer Call Queue
mercer_queue(
  id uuid PK,
  campaign_id uuid FK → mercer_campaigns,
  business_name text,
  phone text,
  status text, -- pending, calling, completed, dnc, no_answer
  attempts int DEFAULT 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  outcome text, -- interested, demo_booked, not_interested, dnc, voicemail
  notes text,
  created_at timestamptz
)
INDEX: (status, next_attempt_at), (phone)
```

## 3. API Endpoints (Core)

```
AUTH:
POST   /api/auth/signup          — Create account
POST   /api/auth/login           — Login
POST   /api/auth/forgot-password — Password reset

BUSINESS:
GET    /api/business             — Get business profile
PUT    /api/business             — Update business settings
PUT    /api/business/greeting    — Update Lucy's greeting script
PUT    /api/business/hours       — Update business hours

CALLS:
GET    /api/calls                — List calls (paginated, filterable)
GET    /api/calls/:id            — Call detail + transcript
GET    /api/calls/stats          — Call analytics (daily/weekly/monthly)

APPOINTMENTS:
GET    /api/appointments         — List appointments
POST   /api/appointments         — Manually create appointment
PUT    /api/appointments/:id     — Update/cancel appointment

WEBHOOKS (internal):
POST   /api/webhooks/telephony   — Incoming call webhook
POST   /api/webhooks/stripe      — Billing events
POST   /api/webhooks/calendar    — Calendar sync events

BILLING:
GET    /api/billing              — Current plan + usage
POST   /api/billing/checkout     — Create Stripe checkout session
POST   /api/billing/portal       — Create Stripe customer portal session
```

## 4. Critical Engineering Decisions

```
VOICE LATENCY IS EVERYTHING:
- Target: < 500ms from caller speech → Lucy response
- This means: streaming STT, fast LLM inference, streaming TTS
- If latency > 1 second, callers will think the line is dead
- Test with real phone calls, not just API benchmarks

RELIABILITY:
- Lucy going down = customer's business phone not answered
- Need: health checks every 30 seconds, auto-restart, fallback to voicemail
- Monitoring: alert Billy within 60 seconds of any outage
- Consider: multiple telephony provider failover

COST PER CALL:
- Track: telephony minutes + STT tokens + LLM tokens + TTS tokens per call
- Target: < $0.50/call average to maintain margins at $99/mo
- If average customer gets 200 calls/mo → $100 cost → break even
- Need to optimize: shorter prompts, caching common responses, efficient models
```

## Quality Standard
A senior engineer joining should understand the full system from this document
and be able to set up a dev environment within a day.
