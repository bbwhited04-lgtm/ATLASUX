# Local Vision Agent

The Local Vision Agent lets Atlas UX agents interact with websites through your real browser — the one you're already logged into. When a platform doesn't have an API or OAuth integration yet (TikTok in review, Meta pending approval, etc.), any agent can delegate the task to the Vision agent, which runs on your local machine and uses your authenticated browser sessions.

## How It Works

```
Atlas assigns Timmy: "Post trending AI content on TikTok"
    │
    ▼
Timmy has no TikTok OAuth → delegates to Vision agent
    │
    ▼
Backend creates LOCAL_VISION_TASK job (queued)
    │
    ▼
Your local machine polls, claims the job
    │
    ▼
Opens your Edge browser via CDP → navigates to TikTok
    │
    ▼
Screenshots → Claude Vision analyzes → determines actions
    │
    ▼
Executes: click compose, type content, publish
    │
    ▼
Uploads screenshots, reports result back to backend
```

## What Runs Where

| Component | Where It Runs | What It Does |
|-----------|---------------|--------------|
| API endpoints (`/v1/local-agent/*`) | AWS Lightsail (cloud server) | Receives registrations, serves job queue, stores results |
| Vision worker (`localVisionAgent.ts`) | **Your local machine** | Polls for jobs, drives your browser, calls Claude Vision |
| Edge browser | **Your local machine** | The browser you're already logged into |
| Claude Vision API | Anthropic cloud | Analyzes screenshots, decides next actions |

**Playwright is NOT installed on the server.** It's only needed on your local machine where the vision worker runs. The server just hosts the job queue API.

## Requirements

### On Your Local Machine

1. **Node.js 20+** — to run the worker
2. **Playwright** — already in `backend/package.json` as a dependency
3. **Chromium browser for Playwright** — install once:
   ```bash
   npx playwright install chromium
   ```
4. **Microsoft Edge** — launched with remote debugging enabled
5. **Anthropic API key** — for Claude Vision (Sonnet) screenshot analysis
6. **Pro or Enterprise subscription** — local vision is a premium feature

### On the Server (AWS Lightsail)

Nothing extra. The API endpoints are part of the regular Fastify backend. No Playwright, no browser, no Anthropic key needed server-side. The server just manages the job queue.

## Setup

### 1. Launch Edge with Remote Debugging

```bash
# Linux
msedge --remote-debugging-port=9222

# macOS
/Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge --remote-debugging-port=9222

# Windows
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=9222
```

Make sure you're logged into the platforms you need (TikTok, Facebook, LinkedIn, etc.) before starting the agent.

### 2. Register the Agent

From the app (or via curl), register to get an API key:

```bash
curl -X POST https://atlasux.cloud/v1/local-agent/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "x-tenant-id: YOUR_TENANT_ID" \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "ok": true,
  "apiKey": "abc123...hex...",
  "tenantId": "your-tenant-id",
  "instructions": "Use Authorization: Bearer local:{tenantId}:{apiKey} for all subsequent requests."
}
```

Save the `apiKey` — you'll need it in the next step.

### 3. Set Environment Variables

Create or update `backend/.env` with:

```env
ATLAS_API_URL=https://atlasux.cloud
ATLAS_TENANT_ID=your-tenant-id
ATLAS_LOCAL_AGENT_KEY=the-api-key-from-step-2
ANTHROPIC_API_KEY=sk-ant-your-key-here
CDP_ENDPOINT=http://localhost:9222
```

### 4. Run the Worker

```bash
cd backend
npm run worker:local-vision
```

You should see:
```
[localVision] Starting local vision agent
[localVision]   API: https://atlasux.cloud
[localVision]   Tenant: your-tenant-id
[localVision]   CDP: http://localhost:9222
[localVision]   Poll: 5000ms
[localVision] Heartbeat OK — agent online
```

The agent is now polling for tasks. When any agent delegates a task to Vision, it will pick it up automatically.

## Which Agents Can Delegate to Vision

- **Atlas** (CEO)
- **Binky** (CRO)
- **Sunday** (Comms Writer)
- **Cheryl** (Support)
- **Mercer** (Acquisition)

These agents have `localVision` in their tool permissions. When they detect phrases like "local browser", "no OAuth", "already logged in", or "use my browser", they'll suggest delegating to the Vision agent.

Example delegation from any agent's chat:
```
"delegate to vision: post this content on TikTok at https://tiktok.com/upload"
```

## Safety Rules

The local vision agent inherits all browser governance rules plus additional restrictions:

**Blocked sites** (never navigated to):
- Banking (Chase, Wells Fargo, Bank of America, etc.)
- Government (.gov domains, IRS, SSA, DMV)
- Healthcare (patient portals, MyChart, Epic)
- Password managers (1Password, Bitwarden, LastPass, Dashlane)
- Crypto wallets/exchanges (Coinbase, Binance, Kraken, MetaMask, OpenSea)

**Session limits:**
- 5 minutes max per task
- 30 actions max per task
- No password field interaction
- No payment form interaction
- Screenshots checked for visible credentials before upload

## Checking Status

Any component can check if the local agent is online:

```bash
curl https://atlasux.cloud/v1/local-agent/status \
  -H "x-tenant-id: YOUR_TENANT_ID"
```

Returns `online: true` if a heartbeat was received within the last 60 seconds.
