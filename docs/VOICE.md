# Voice Pipeline

Atlas UX provides AI-powered voice reception through two systems: ElevenLabs Conversational AI (primary) and a Twilio media stream pipeline (fallback/outbound). The voice system answers calls 24/7, books appointments, sends SMS confirmations, and notifies the business via Slack.

---

## Architecture

```
                   Inbound Call
                       |
                   +---v---+
                   | Twilio |
                   +---+---+
                       |
            +----------+-----------+
            |                      |
     LUCY_VOICE_ENABLED?     Voicemail fallback
            |                      |
     +------v-------+      +------v-------+
     | Twilio       |      | TwiML: Say + |
     | <Connect>    |      | Record       |
     | <Stream>     |      +--------------+
     +------+-------+
            |
     WebSocket Media Stream
            |
     +------v-----------+
     | Lucy Voice Engine |
     | (twilioStream.ts) |
     +-------------------+
            |
     ElevenLabs Conversational AI
            |
     +------v------------------+
     | Mid-call webhook tools  |
     | - book-appointment      |
     | - send-sms              |
     | - take-message          |
     +-------------------------+
            |
     +------v-----------+
     | Post-call webhook |
     | - transcript      |
     | - summary         |
     | - CRM activity    |
     +-------------------+
```

---

## Twilio Integration

### Inbound Calls

**Endpoint:** `POST /v1/twilio/voice/inbound` (form-urlencoded webhook)

When a call arrives:
1. Twilio sends webhook with `From`, `To`, `CallSid`, `CallStatus`.
2. Audit log entry created.
3. CRM contact lookup by phone number (last 7 digits match).
4. If `LUCY_VOICE_ENABLED=true`: returns TwiML `<Connect><Stream>` pointing to WebSocket URL.
5. If disabled: returns TwiML voicemail (`<Say>` greeting + `<Record>`).

### Inbound SMS

**Endpoint:** `POST /v1/twilio/sms/inbound`

1. Logs to audit trail.
2. CRM contact lookup + activity creation.
3. Returns TwiML auto-reply message.

### Status Callbacks

**Endpoint:** `POST /v1/twilio/voice/status`

Tracks call lifecycle: `ringing`, `in-progress`, `completed`, `no-answer`, `busy`, `failed`, `canceled`.

For unanswered outbound calls (`no-answer`, `busy`, `failed`, `canceled`), automatically queues a follow-up SMS via `queueFollowUpSms()`.

### Recording Callback

**Endpoint:** `POST /v1/twilio/voice/recording`

When voicemail recording completes:
1. Logs recording URL, SID, duration.
2. Queues `VOICEMAIL_TRANSCRIBE` job for async processing.

### Outbound Calls

**Endpoint:** `POST /v1/twilio/call` (authenticated)

Places an outbound call using Twilio REST API. Credentials resolved per-tenant via `credentialResolver`.

### Signature Validation

All Twilio webhooks validate the `x-twilio-signature` header using HMAC-SHA1 with the tenant's auth token. Falls back to canonical `TWILIO_WEBHOOK_BASE_URL` if proxy alters the request URL. See [SECURITY.md](SECURITY.md).

---

## ElevenLabs Conversational AI

### Personas

| Persona | Role | Description |
|---------|------|-------------|
| Lucy | Receptionist | Primary voice. Warm, professional. Answers all inbound calls |
| Claire | Calendar | Scheduling specialist |
| Mercer | Sales | Outbound sales calls |

### Voice Agent Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/elevenlabs/agents` | POST | Create agent for tenant |
| `/v1/elevenlabs/agents/:id` | PATCH | Update agent config |
| `/v1/elevenlabs/agents/:id` | GET | Get agent details |
| `/v1/elevenlabs/agents` | GET | List all agents |

Agent creation accepts: `businessName`, `businessType`, `greeting`, `persona`, `customPrompt`, `voiceId`, `language`, `escalationPhone`, `services`, `hoursOfOperation`.

### Phone Number Management

**Endpoint:** `POST /v1/elevenlabs/phone-numbers`

Imports a Twilio phone number into ElevenLabs and optionally assigns it to a voice agent. Body: `{ phoneNumber, label?, agentId? }`.

### Outbound Calls

**Endpoint:** `POST /v1/elevenlabs/outbound-call`

Initiates outbound call through ElevenLabs. Body: `{ agentId, phoneNumberId, toNumber, dynamicVars? }`.

---

## Mid-Call Webhook Tools

These endpoints are called BY ElevenLabs during an active call. Validated via shared secret (`ELEVENLABS_WEBHOOK_SECRET`).

### Book Appointment

**Endpoint:** `POST /v1/elevenlabs/tool/book-appointment`

1. Creates or finds CRM contact by phone number.
2. Logs audit entry.
3. Sends Slack notification to `SLACK_LEADS_CHANNEL_ID` with caller name, service type, preferred date.
4. Returns confirmation message to the voice agent.

**Body fields:** `caller_name`, `caller_phone`, `service_type`, `preferred_date`, `notes`

### Send SMS

**Endpoint:** `POST /v1/elevenlabs/tool/send-sms`

Sends an SMS via Twilio during the call (e.g., confirmation with business address). Credentials resolved per-tenant.

**Body fields:** `to_number`, `message`

### Take Message

**Endpoint:** `POST /v1/elevenlabs/tool/take-message`

Records a message from the caller and notifies the team via Slack.

**Body fields:** `caller_name`, `caller_phone`, `for_person`, `message`, `urgency`

Urgency levels: `normal` (memo emoji) or `urgent` (rotating light emoji).

---

## Post-Call Processing

### Post-Call Webhook

**Endpoint:** `POST /v1/elevenlabs/webhook/post-call`

Fired by ElevenLabs after a call ends. Captures:
- `transcript` (full conversation text, truncated to 5000 chars)
- `analysis.transcript_summary` (AI-generated summary)
- `conversation_id`
- `metadata.start_time_unix_secs`

All stored in the audit log for review.

### Personalization Webhook

**Endpoint:** `POST /v1/elevenlabs/webhook/personalize`

Called when a call connects to provide per-caller context:
1. Looks up caller in CRM by phone number.
2. Looks up tenant business name.
3. Returns `dynamic_variables`: `business_name`, `caller_name`, `caller_company`, `tenant_id`.

This allows Lucy to greet returning callers by name.

---

## Mercer Outbound Dialer

Batch outbound calling system for sales campaigns.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/twilio/outbound/start` | POST | Start batch session. Body: `{ tags?, limit?, source? }` |
| `/v1/twilio/outbound/single` | POST | Dial one CRM contact. Body: `{ contactId }` |
| `/v1/twilio/outbound/status` | GET | Check dialer status |
| `/v1/twilio/outbound/stop` | POST | Stop current session |

The Mercer voice stream (`/v1/twilio/voice/mercer-stream`) uses a separate WebSocket handler (`mercerStream.ts`) with contact-specific context (phone, name, company, industry).

After unanswered calls, `mercerPostCall.ts` queues follow-up SMS messages.

---

## WebSocket Streams

### Lucy Stream

**Endpoint:** `GET /v1/twilio/voice/stream` (WebSocket upgrade)

Handles Twilio media stream for inbound calls. Routes audio through the voice engine.

### Mercer Stream

**Endpoint:** `GET /v1/twilio/voice/mercer-stream` (WebSocket upgrade)

Handles outbound call streams. Contact info passed via query parameters: `contactPhone`, `contactName`, `contactId`, `contactCompany`, `contactIndustry`.

---

## Do-Not-Call List

The `DncPhone` model maintains a per-tenant do-not-call list. The outbound dialer checks this before placing calls.

---

## Call Cost Tracking

The `CallCost` model tracks per-call costs. Monthly aggregates available via `GET /v1/analytics/call-costs`.
