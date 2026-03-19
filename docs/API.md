# API Reference

All routes mount under `/v1` on the Fastify backend (port 8787). Authentication is JWT-based via `Authorization: Bearer <token>`. Tenant context is resolved from the `x-tenant-id` header. CSRF tokens are required for mutating requests from authenticated sessions (see [SECURITY.md](SECURITY.md)).

---

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/register` | No | Create account. Body: `{ email, password }`. Returns `{ token, userId }` |
| POST | `/v1/auth/login` | No | Validate credentials. Body: `{ email, password }`. Returns `{ token, userId }` |
| POST | `/v1/auth/provision` | Yes | Idempotent: ensures user has a tenant + membership. Returns `{ tenantId, seatType, role }` |
| POST | `/v1/auth/logout` | Yes | Revokes current JWT by adding SHA-256 hash to blacklist |

## Gate (Cloud Seat Access)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/gate/validate` | No | Validate a gate code. Body: `{ code }`. Returns `{ valid, role }` |
| GET | `/v1/gate/seats` | Admin key | List all cloud seats. Requires `x-gate-admin-key` header |
| POST | `/v1/gate/seats` | Admin key | Create a new cloud seat |
| PATCH | `/v1/gate/seats/:id/revoke` | Admin key | Revoke a seat instantly |
| PATCH | `/v1/gate/seats/:id/restore` | Admin key | Restore a revoked seat |

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Root liveness: `{ ok: true, status: "alive" }` |
| GET | `/v1/health` | No | Liveness probe |
| GET | `/v1/ready` | No | Readiness probe (DB connectivity check) |
| GET | `/v1/health/providers` | No | LLM provider circuit breaker status |

## Chat (AI)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/chat` | Yes | Send chat messages to AI. Rate limited: 30/min. Body: `{ messages[], agentId?, provider?, model?, sessionId? }`. Response: `{ provider, content }` |

The chat endpoint performs:
- Seat limit enforcement (token budget)
- SGL governance gate (ALLOW/REVIEW/BLOCK)
- Query classification into tiers: DIRECT, SKILL_ONLY, HOT_CACHE, FULL_RAG
- KB context injection based on tier
- Deep agent pipeline for agents with `deepMode: true`
- Token usage metering

## Agents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/agents` | Yes | List all agents from global registry |

## Engine

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/engine/tick` | Workers key | Manually trigger one engine tick. Requires `x-workers-key` header |
| POST | `/v1/engine/run` | Yes | Queue an engine run. Body: `{ tenantId, agentId, workflowId, input?, traceId? }` |

## Runtime

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/runtime/status` | Yes | Engine enabled state, last tick, pending approvals |

## System State

Routes mounted at `/v1/system-state` for managing DB-backed key-value state (e.g., `atlas_online`).

## Workflows

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/workflows` | Yes | List all workflows (DB + canonical registry) |

## Decision Memos

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/decisions` | Yes | Create a decision memo (proposal). Body: `{ agent, title, rationale, estimatedCostUsd?, billingType?, riskTier?, confidence?, expectedBenefit?, payload? }` |
| GET | `/v1/decisions` | Yes | List decision memos. Query: `?status=PROPOSED&take=50` |
| POST | `/v1/decisions/:id/approve` | Yes | Approve a decision memo. Rate limited: 10/min |
| POST | `/v1/decisions/:id/reject` | Yes | Reject a decision memo. Rate limited: 20/min |
| POST | `/v1/decisions/:id/execute` | Yes | Execute an approved broadcast |
| GET | `/v1/decisions/templates` | Yes | List decision templates |
| POST | `/v1/decisions/templates` | Yes | Create a decision template |

## Jobs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/jobs/list` | Yes | List jobs for tenant. Query: `?org_id=...` |
| POST | `/v1/jobs` | Yes | Create a job. Enforces seat-based job limits |

## CRM

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/crm/contacts` | Yes | List contacts. Query: `?q=search&limit=200&offset=0` |
| POST | `/v1/crm/contacts` | Yes | Create contact. Body: `{ firstName, lastName, email, phone, company, source, notes }` |
| PATCH | `/v1/crm/contacts/:id` | Yes | Update contact |
| DELETE | `/v1/crm/contacts/:id` | Yes | Delete contact |
| GET | `/v1/crm/contacts/:id/activities` | Yes | List contact activities |
| POST | `/v1/crm/contacts/:id/activities` | Yes | Log an activity |
| GET | `/v1/crm/companies` | Yes | List companies |
| POST | `/v1/crm/companies` | Yes | Create company |
| GET | `/v1/crm/segments` | Yes | List segments |
| POST | `/v1/crm/segments` | Yes | Create segment |

## Leads (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/leads` | No | Public lead capture from early access form. Body: `{ name, email, phone, businessName?, businessType?, message? }` |
| POST | `/v1/leads/prospect` | Yes | Google Places prospecting. Query: `?query=...&location=...` |

## Audit

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/audit/health` | Yes | Audit subsystem health |
| GET | `/v1/audit/list` | Yes | List audit logs. Query: `?tenantId=...&action=...&level=...&limit=50&cursor=...` |

## Ledger

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/ledger` | Yes | List ledger entries for tenant |

## Knowledge Base

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/kb/context` | Yes | Current tenant context for KB |
| GET | `/v1/kb/documents` | Yes | List KB documents |
| POST | `/v1/kb/documents` | Yes | Create KB document. Body: `{ title, body, status?, tags? }` |
| PATCH | `/v1/kb/documents/:id` | Yes | Update KB document |
| DELETE | `/v1/kb/documents/:id` | Yes | Delete KB document |

## Billing (Stripe)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/stripe/health` | Yes | Stripe key configuration status |
| POST | `/v1/stripe/products/request` | Yes (owner/admin) | Request Stripe product creation (creates Intent for approval). Rate limited: 10/min |
| POST | `/v1/stripe/products` | Yes (owner/admin) | Directly create Stripe product + price. Rate limited: 5/min |
| POST | `/v1/stripe/checkout-session` | No | Create Stripe Checkout Session. Body: `{ plan, billing, email }` |
| POST | `/v1/stripe/portal` | Yes | Create Stripe Customer Portal session. Body: `{ stripeCustomerId }` |
| POST | `/v1/stripe/subscription-webhook` | Webhook | Stripe subscription lifecycle webhook. Validates `stripe-signature` header |

## Twilio (Voice + SMS)

### Webhooks (form-urlencoded, no auth, CSRF-skipped)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/twilio/sms/inbound` | Twilio sig | Receive inbound SMS |
| POST | `/v1/twilio/voice/inbound` | Twilio sig | Receive inbound calls (routes to Lucy Voice or voicemail) |
| POST | `/v1/twilio/voice/status` | Twilio sig | Call status callbacks |
| POST | `/v1/twilio/voice/recording` | Twilio sig | Recording URL callback |

### WebSocket

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/twilio/voice/stream` | WS | Lucy Voice Engine media stream |
| GET | `/v1/twilio/voice/mercer-stream` | WS | Mercer outbound voice stream |

### API (JSON, auth required)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/twilio/call` | Yes | Place outbound call. Body: `{ to }` |
| GET | `/v1/twilio/calls` | Yes | Call log from audit trail. Query: `?limit=50&offset=0` |
| GET | `/v1/twilio/messages` | Yes | SMS log from audit trail |
| POST | `/v1/twilio/outbound/start` | Yes | Start batch dialing session. Body: `{ tags?, limit?, source? }` |
| POST | `/v1/twilio/outbound/single` | Yes | Dial a single CRM contact. Body: `{ contactId }` |
| GET | `/v1/twilio/outbound/status` | Yes | Check dialer status |
| POST | `/v1/twilio/outbound/stop` | Yes | Stop current dialing session |

## ElevenLabs (Conversational AI Voice)

### Webhooks (validated via shared secret)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/elevenlabs/tool/book-appointment` | Webhook secret | Mid-call: book appointment. Creates CRM contact, notifies Slack |
| POST | `/v1/elevenlabs/tool/send-sms` | Webhook secret | Mid-call: send SMS via Twilio |
| POST | `/v1/elevenlabs/tool/take-message` | Webhook secret | Mid-call: take a message, notify Slack |
| POST | `/v1/elevenlabs/webhook/post-call` | Webhook secret | Post-call summary and transcript capture |
| POST | `/v1/elevenlabs/webhook/personalize` | Webhook secret | Per-caller CRM lookup for personalization |

### Management API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/elevenlabs/agents` | Yes | Create ElevenLabs voice agent |
| PATCH | `/v1/elevenlabs/agents/:agentId` | Yes | Update agent |
| GET | `/v1/elevenlabs/agents/:agentId` | Yes | Get agent details |
| GET | `/v1/elevenlabs/agents` | Yes | List all agents |
| POST | `/v1/elevenlabs/phone-numbers` | Yes | Import Twilio number + assign agent |
| POST | `/v1/elevenlabs/outbound-call` | Yes | Initiate outbound call |

## OAuth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/oauth/:provider/connect` | Yes | Initiate OAuth flow. Query: `?org_id=...&user_id=...` |
| GET | `/v1/oauth/:provider/callback` | No | OAuth callback handler |

Supported providers: Google, Meta (Facebook/Instagram), X (Twitter), Microsoft 365, Reddit, Pinterest, LinkedIn, Zoom, Notion, Airtable, Dropbox, Slack, PayPal, Square, Meetup, TikTok, Tumblr.

## Integrations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/integrations` | Yes | List all integration statuses for tenant |
| GET | `/v1/integrations/status` | Yes | Detailed status with OAuth readiness |
| POST | `/v1/integrations/:provider/disconnect` | Yes | Disconnect and revoke tokens |

## Credentials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/credentials` | Yes | List tenant credentials (keys redacted) |
| PUT | `/v1/credentials/:provider` | Yes | Upsert a credential. Body: `{ key, label? }`. Encrypted at rest |
| DELETE | `/v1/credentials/:provider` | Yes | Delete a credential |

## Files (S3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/files` | Yes | List files for tenant |
| POST | `/v1/files/upload` | Yes | Upload file (multipart/form-data). Virus scanned, MIME validated |
| GET | `/v1/files/:path` | Yes | Get signed download URL |
| DELETE | `/v1/files/:path` | Yes | Delete a file |

## User

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/user/me` | Yes | Current user profile + memberships |
| GET | `/v1/user/me/usage` | Yes | Current period usage meters |
| GET | `/v1/user/me/usage/history` | Yes | Historical usage |
| GET | `/v1/user/me/subscription` | Yes | Subscription details |

## Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/analytics/summary` | Yes | Aggregated metrics. Query: `?range=7d` (24h, 7d, 30d, 90d) |
| GET | `/v1/analytics/call-costs` | Yes | Monthly voice call cost breakdown |

## Compliance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/compliance/dsar` | Yes | Create a data subject request (GDPR) |
| GET | `/v1/compliance/dsar` | Yes | List DSARs |
| PATCH | `/v1/compliance/dsar/:id` | Yes | Update DSAR status |
| POST | `/v1/compliance/consent` | Yes | Record consent |
| GET | `/v1/compliance/consent` | Yes | List consent records |
| POST | `/v1/compliance/breaches` | Yes | Report a data breach |
| GET | `/v1/compliance/breaches` | Yes | List data breaches |
| POST | `/v1/compliance/incidents` | Yes | Report an incident |
| GET | `/v1/compliance/incidents` | Yes | List incidents |
| POST | `/v1/compliance/vendors` | Yes | Create vendor assessment |
| GET | `/v1/compliance/vendors` | Yes | List vendor assessments |

## Org Memory (Organizational Brain)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/org-memory` | Yes | List recent memories. Query: `?category=...&limit=50&offset=0` |
| GET | `/v1/org-memory/search` | Yes | Semantic search via Pinecone |
| POST | `/v1/org-memory` | Yes | Store a memory manually |
| DELETE | `/v1/org-memory/:id` | Yes | Soft-delete (set confidence to 0) |
| GET | `/v1/org-memory/stats` | Yes | Dashboard metrics |

## Agent Calibration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/calibration` | Yes | List agent calibration scores |
| POST | `/v1/calibration/refresh` | Yes | Trigger recalibration for all agents |

## Diagnostics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/diagnostics/scheduler` | Yes | Scheduler status, last fires, environment flags |

## Social / Channel Routes

Each social platform has its own route file with OAuth callbacks, webhook handlers, and content management endpoints:

| Prefix | Description |
|--------|-------------|
| `/v1/meta` | Facebook/Instagram — data deletion callback (GDPR) |
| `/v1/google` | Google — data deletion callback |
| `/v1/x` | X (Twitter) — Account Activity API webhook |
| `/v1/reddit` | Reddit — Donna's approval queue |
| `/v1/linkedin` | LinkedIn — webhook + API |
| `/v1/tiktok` | TikTok — video/engagement webhook |
| `/v1/tumblr` | Tumblr — Zapier/Make webhook |
| `/v1/pinterest` | Pinterest — Zapier/Make webhook |
| `/v1/youtube` | YouTube — scraping, search, upload |
| `/v1/telegram` | Telegram Bot API bridge |
| `/v1/teams` | Microsoft Teams — channel messaging |
| `/v1/alignable` | Alignable — Zapier/Make webhook |
| `/v1/zoom` | Zoom — meeting/webinar webhook |
| `/v1/postiz` | Postiz — social media analytics proxy |
| `/v1/discord` | Discord — Ed25519 webhook verification |

## Other Routes

| Prefix | Description |
|--------|-------------|
| `/v1/business` | Business Manager data |
| `/v1/accounting` | Accounting data |
| `/v1/tenants` | Tenant management |
| `/v1/assets` | Asset management |
| `/v1/metrics` | Metrics snapshots |
| `/v1/distribution` | Distribution events |
| `/v1/growth` | Growth loop runs |
| `/v1/tickets` | Beta feedback tickets |
| `/v1/listening` | Social listening sources |
| `/v1/tools` | M365 tool registry and invocation |
| `/v1/agent-flow` | Atlas -> M365 -> Binky research flow |
| `/v1/blog` | Blog publisher (stores posts in KB) |
| `/v1/mobile` | Mobile device pairing (QR-based) |
| `/v1/comms` | Communications |
| `/v1/email` | Email sending |
| `/v1/canned-responses` | Messaging templates |
| `/v1/budgets` | Budget tracking |
| `/v1/outlook` | M365 inbox reading via Graph API |
| `/v1/calendar` | M365 calendar events |
| `/v1/meetings` | Meeting notes, transcripts, AI summarization |
| `/v1/video` | Video composition (FFmpeg), AI generation |
| `/v1/browser` | Governed headless Chromium (SGL + decision memos) |
| `/v1/local-agent` | Local vision agent (CDP-based) |
| `/v1/quickbooks` | QuickBooks OAuth2, webhook, status |
| `/v1/atlas` | Atlas orchestration endpoints |
