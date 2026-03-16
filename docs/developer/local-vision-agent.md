# Local Vision Agent — Developer Reference

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  AWS Lightsail (Cloud)                                                  │
│                                                                  │
│  ┌──────────────────────────┐     ┌──────────────────────────┐  │
│  │  Fastify API Server      │     │  jobs table              │  │
│  │  /v1/local-agent/*       │────>│  LOCAL_VISION_TASK rows  │  │
│  │  (localAgentRoutes.ts)   │     └──────────────────────────┘  │
│  └──────────────────────────┘     ┌──────────────────────────┐  │
│                                    │  system_state table      │  │
│                                    │  local_agent_{tenantId}  │  │
│                                    └──────────────────────────┘  │
│                                    ┌──────────────────────────┐  │
│                                    │  Supabase Storage        │  │
│                                    │  browser-screenshots/    │  │
│                                    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ▲                    │
         │ HTTPS              │ HTTPS
         │ (poll/report)      │ (claim/result)
         │                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  User's Local Machine                                            │
│                                                                  │
│  ┌──────────────────────────┐     ┌──────────────────────────┐  │
│  │  localVisionAgent.ts     │────>│  Edge Browser (CDP)      │  │
│  │  (npm run worker:        │     │  --remote-debugging-     │  │
│  │   local-vision)          │     │    port=9222             │  │
│  └──────────────────────────┘     │  (already logged in)     │  │
│         │                          └──────────────────────────┘  │
│         │ HTTPS                                                  │
│         ▼                                                        │
│  ┌──────────────────────────┐                                    │
│  │  Anthropic API           │                                    │
│  │  Claude Vision (Sonnet)  │                                    │
│  │  Screenshot analysis     │                                    │
│  └──────────────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Server-Side Requirements

**Playwright is NOT needed on the server.**

The server only hosts the REST API endpoints in `localAgentRoutes.ts`. These are standard Fastify routes that read/write to Postgres and Supabase Storage. No browser, no Playwright, no Anthropic key required server-side.

What the server provides:
- Job queue (Postgres `jobs` table with `LOCAL_VISION_TASK` type)
- Registration/auth (API key stored in `system_state`)
- Heartbeat tracking (online status in `system_state`)
- Screenshot storage (Supabase `browser-screenshots/` bucket)
- Audit logging (all actions logged to `audit_log`)

## Local Machine Requirements

| Dependency | Why | Install |
|------------|-----|---------|
| Node.js 20+ | Runs the worker | System install |
| Playwright | CDP connection + page interaction | Already in `backend/package.json` |
| Playwright Chromium | Required by Playwright for CDP | `npx playwright install chromium` |
| Edge/Chrome | User's real browser with auth sessions | Already installed |
| Anthropic API key | Claude Vision for screenshot analysis | Get from console.anthropic.com |

## Files

| File | Location | Purpose |
|------|----------|---------|
| `localAgentRoutes.ts` | `backend/src/routes/` | Server API (6 endpoints) |
| `localVisionAgent.ts` | `backend/src/workers/` | Local worker script |
| `localVisionGovernance.ts` | `backend/src/tools/browser/` | Safety blocklists + session limits |

## API Endpoints

All mounted at `/v1/local-agent`.

### POST /register
- **Auth:** JWT (normal app auth)
- **Headers:** `x-tenant-id`
- **Gate:** Pro/Enterprise tier only
- **Returns:** `{ apiKey, tenantId }` — save the key
- **Storage:** Key stored in `system_state` as `local_agent_{tenantId}`

### GET /claim
- **Auth:** `Bearer local:{tenantId}:{key}`
- **Returns:** Next queued `LOCAL_VISION_TASK` job, or `{ job: null }`
- **Locking:** Optimistic lock via `updateMany WHERE status=queued`
- **Pattern:** Same as `emailSender.ts` — skip if `claimed.count !== 1`

### POST /heartbeat
- **Auth:** `Bearer local:{tenantId}:{key}`
- **Effect:** Sets `online: true` and `last_heartbeat` in `system_state`
- **Interval:** Worker sends every 30s (configurable via `HEARTBEAT_INTERVAL_MS`)

### POST /result/:jobId
- **Auth:** `Bearer local:{tenantId}:{key}`
- **Body:** `{ success, output, error, summary, actionsExecuted, screenshotCount }`
- **Effect:** Updates job status to `succeeded` or `failed`, creates audit log entry

### POST /screenshot
- **Auth:** `Bearer local:{tenantId}:{key}`
- **Body:** `{ jobId, screenshot (base64), filename? }`
- **Storage:** Supabase bucket `browser-screenshots/tenants/{tenantId}/{filename}`
- **Returns:** `{ path, signedUrl }` (1-hour signed URL)

### GET /status
- **Auth:** None (uses `x-tenant-id` header)
- **Returns:** `{ registered, online, lastHeartbeat }`
- **Logic:** `online = true` if heartbeat received within last 60 seconds

## Auth Model

Registration uses normal JWT auth (same as all other routes). After registration, the local agent uses a custom token format:

```
Authorization: Bearer local:{tenantId}:{apiKey}
```

This avoids JWT expiration issues for long-running workers. The key is a 256-bit random hex string stored in `system_state`.

## Worker Polling Loop

```
┌─────────────────────────────┐
│         START                │
└──────────┬──────────────────┘
           ▼
┌─────────────────────────────┐
│  Send heartbeat (every 30s) │◄──────────────────┐
└──────────┬──────────────────┘                    │
           ▼                                       │
┌─────────────────────────────┐                    │
│  GET /claim                  │                    │
│  Any LOCAL_VISION_TASK?      │                    │
└──────────┬──────────────────┘                    │
           │                                       │
     ┌─────┴─────┐                                │
     │ job=null   │ job found                      │
     ▼            ▼                                │
  sleep(5s)  ┌────────────────┐                    │
     │       │ Connect CDP     │                    │
     │       │ Navigate URL    │                    │
     │       │ Vision loop:    │                    │
     │       │  screenshot     │                    │
     │       │  → Claude Vision│                    │
     │       │  → execute      │                    │
     │       │  → repeat       │                    │
     │       │ POST /result    │                    │
     │       └────────┬───────┘                    │
     │                │                            │
     └────────────────┴────────────────────────────┘
```

## Vision Loop Detail

Each task iteration:

1. **Screenshot** — `page.screenshot({ type: "png" })` of current viewport
2. **Claude Vision** — Send screenshot + task context to `claude-sonnet-4-20250514`
3. **Parse response** — Structured JSON: `{ action, target, value, reasoning }`
4. **Governance check** — Validate any URLs against blocklist before navigating
5. **Execute** — `page.click()`, `page.fill()`, `page.goto()`, `page.evaluate(scroll)`, etc.
6. **Upload screenshot** — Best-effort upload to Supabase (skipped if credentials detected)
7. **Repeat** until `action: "done"`, `action: "error"`, or limits hit

## Delegation Flow

When an agent delegates to Vision:

```typescript
// In agentTools.ts — delegateTask()
if (target.id === "vision") {
  jobType = "LOCAL_VISION_TASK";     // not AGENT_TASK
  input = { task, targetUrl, ... };  // vision-specific schema
}
```

The URL is auto-extracted from the delegation text:
```
"delegate to vision: post content on https://tiktok.com/upload"
                                     ^^^^^^^^^^^^^^^^^^^^^^^^^ extracted
```

## Governance

`localVisionGovernance.ts` extends `browserGovernance.ts`:

| Rule | Value |
|------|-------|
| Max session duration | 5 minutes |
| Max actions per session | 30 |
| Max screenshot size | 5 MB |
| Blocked domains | Banking, government, healthcare, password managers, crypto |
| Blocked paths | `/wallet`, `/vault`, `/security-settings`, `/mfa`, `/api-key`, `/credentials` |
| Credential detection | Regex scan on vision text before screenshot upload |

## Environment Variables

For the local worker (in `backend/.env`):

```env
# Required
ATLAS_API_URL=https://atlasux.cloud
ATLAS_TENANT_ID=your-tenant-id
ATLAS_LOCAL_AGENT_KEY=hex-key-from-register
ANTHROPIC_API_KEY=sk-ant-...

# Optional (defaults shown)
CDP_ENDPOINT=http://localhost:9222
POLL_INTERVAL_MS=5000
HEARTBEAT_INTERVAL_MS=30000
```

For the server (`backend/.env` on Render):

```env
# No additional env vars needed for server-side local agent support.
# ANTHROPIC_API_KEY is optional in env.ts but only used by the local worker.
```

## Workflow

**WF-140 — Local Vision Task**

Catalog entry in `workflows/registry.ts`. Handler validates input and creates a `LOCAL_VISION_TASK` job. Can be triggered programmatically or via agent delegation.

## Seat Gating

`local-vision` is in the `PRO_ONLY_FEATURES` set in `seatLimits.ts`. The `/register` endpoint checks the user's `seatType` on their `TenantMember` record. Free and Starter users get a 403.
