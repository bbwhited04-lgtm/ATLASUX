# Deployment & Operations

## Infrastructure

| Component | Service | Details |
|-----------|---------|---------|
| Frontend | AWS Lightsail | Static SPA served from `/home/bitnami/dist/` |
| Backend | AWS Lightsail | PM2-managed Node.js process |
| Database | AWS Lightsail Managed PostgreSQL 16 | Direct connection via `DATABASE_URL` |
| File Storage | AWS S3 | Bucket: `atlasux-files`, region: `us-east-1` |
| Domain | `atlasux.cloud` | Frontend: `www.atlasux.cloud`, API: `api.atlasux.cloud` |

**Server IP:** `3.94.224.34`

**SSH:**
```bash
ssh -i ~/.ssh/lightsail-default.pem bitnami@3.94.224.34
```

---

## Build & Deploy

### Frontend

```bash
# Build
npm run build        # Produces ./dist

# Deploy
scp -i ~/.ssh/lightsail-default.pem -r dist/* bitnami@3.94.224.34:/home/bitnami/dist/
```

### Backend

```bash
# Build
cd backend && npm run build    # tsc compile to ./dist

# Deploy
scp -i ~/.ssh/lightsail-default.pem -r backend/dist/* bitnami@3.94.224.34:/home/bitnami/backend/dist/

# Restart on server
ssh bitnami@3.94.224.34 'pm2 restart all'
```

### Database Migrations

```bash
cd backend && npx prisma migrate deploy    # Run pending migrations in production
npx prisma migrate dev                     # Dev: create + apply migrations
npx prisma studio                          # DB GUI
npx prisma db seed                         # Seed data
```

---

## PM2 Process Management

The backend runs under PM2 on the Lightsail instance.

```bash
pm2 list               # Show running processes
pm2 restart all         # Restart backend
pm2 logs               # Tail logs
pm2 monit              # Real-time monitoring
```

---

## Environment Variables

Complete reference from `backend/src/env.ts`:

### Core

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default: 8787) |
| `NODE_ENV` | Environment (production/development) |
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_URL` | Public app URL (e.g., `https://atlasux.cloud`) |
| `BACKEND_URL` | Public API URL (e.g., `https://api.atlasux.cloud`) |
| `APP_PROTOCOL` | Deep link protocol (e.g., `atlasux://oauth/callback`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

### Authentication

| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | HS256 signing key for JWTs |

### AI Providers

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_BASE_URL` | Optional base URL override |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DEEPSEEK_BASE_URL` | Optional base URL override |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `CEREBRAS_API_KEY` | Cerebras API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GROQ_API_KEY` | Groq LPU inference |
| `ANTHROPIC_API_KEY` | Anthropic Claude |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `WATSONX_API_KEY` | IBM watsonx.ai |
| `WATSONX_PROJECT_ID` | watsonx project ID |
| `WATSONX_URL` | watsonx endpoint |
| `SWARMS_API_KEY` | Swarms.ai multi-agent API |
| `PINECONE_API_KEY` | Pinecone vector DB |
| `PINECONE_INDEX` | Pinecone index name |

### OAuth Providers

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Google OAuth |
| `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` | Meta (Facebook/Instagram) |
| `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI` | X (Twitter) PKCE |
| `X_BEARER_TOKEN`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET` | X API tokens |
| `TUMBLR_AUTH_KEY`, `TUMBLR_OAUTH_SECRET`, `TUMBLR_REDIRECT_URI` | Tumblr OAuth 1.0a |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`, `MICROSOFT_REDIRECT_URI` | Microsoft 365 Graph |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_REDIRECT_URI` | Reddit |
| `PINTEREST_APP_ID`, `PINTEREST_SECRET_KEY`, `PINTEREST_REDIRECT_URI` | Pinterest |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | LinkedIn |
| `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI`, `ZOOM_WEBHOOK_SECRET` | Zoom |
| `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` | TikTok |
| `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`, `NOTION_REDIRECT_URI` | Notion |
| `AIRTABLE_CLIENT_ID`, `AIRTABLE_CLIENT_SECRET`, `AIRTABLE_REDIRECT_URI` | Airtable PKCE |
| `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REDIRECT_URI` | Dropbox |
| `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` | Slack OAuth v2 |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_REDIRECT_URI` | PayPal |
| `SQUARE_APP_ID`, `SQUARE_APP_SECRET`, `SQUARE_REDIRECT_URI` | Square |
| `MEETUP_CLIENT_ID`, `MEETUP_CLIENT_SECRET`, `MEETUP_REDIRECT_URI` | Meetup |

### Voice (Twilio + ElevenLabs)

| Variable | Purpose |
|----------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Default outbound number |
| `TWILIO_API_KEY_SID` | Twilio API key SID |
| `TWILIO_API_KEY_SECRET` | Twilio API key secret |
| `LUCY_VOICE_ENABLED` | Enable Lucy voice engine (`true`/`false`) |
| `LUCY_VOICE_NAME` | Google TTS voice name |
| `LUCY_VOICE_SPEAKING_RATE` | Speech rate |
| `LUCY_MAX_CONCURRENT_SESSIONS` | Max concurrent voice sessions |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ELEVENLABS_WEBHOOK_SECRET` | ElevenLabs webhook shared secret |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP project for TTS |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCP service account JSON path |

### Stripe Billing

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | General webhook secret |
| `STRIPE_SUB_WEBHOOK_SECRET` | Subscription webhook secret |
| `STRIPE_PRICE_STARTER_MONTHLY`, `_ANNUAL` | Starter plan price IDs |
| `STRIPE_PRICE_BUSINESS_PRO_MONTHLY`, `_ANNUAL` | Pro plan price IDs |
| `STRIPE_PRICE_STANDARD_MONTHLY`, `_ANNUAL` | Standard plan price IDs |
| `STRIPE_PRICE_TEAM_MONTHLY`, `_ANNUAL` | Team plan price IDs |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Enterprise plan price ID |
| `STRIPE_BETA_PROMO` | Beta promotional code |

### Email

| Variable | Purpose |
|----------|---------|
| `OUTBOUND_EMAIL_PROVIDER` | `microsoft` or `resend` |
| `OUTBOUND_EMAIL_FROM` | Sender address |
| `RESEND_API_KEY` | Resend API key |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_SENDER_UPN` | Microsoft Graph email |

### Messaging

| Variable | Purpose |
|----------|---------|
| `BOTFATHERTOKEN` | Telegram bot token |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook validation |
| `DISCORD_PUBLIC_KEY` | Discord Ed25519 public key |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `SLACK_BOT_TOKEN` | Slack bot token (xoxb-*) |
| `SLACK_LEADS_CHANNEL_ID` | Slack channel for lead alerts |

### Engine & Safety

| Variable | Purpose |
|----------|---------|
| `ENGINE_ENABLED` | Enable in-process engine loop |
| `ENGINE_TICK_INTERVAL_MS` | Engine tick interval (default: 5000) |
| `AUTO_SPEND_LIMIT_USD` | Auto-approval spend threshold |
| `MAX_ACTIONS_PER_DAY` | Daily action cap |
| `CONFIDENCE_AUTO_THRESHOLD` | Confidence threshold for auto-approval |
| `SCHEDULER_ENABLED` | Enable scheduler worker |
| `SCHEDULER_POLL_MS` | Scheduler polling interval |
| `TENANT_ID` | Owner tenant ID |
| `WORKERS_API_KEY` | API key for worker endpoints |

### Security

| Variable | Purpose |
|----------|---------|
| `TOKEN_ENCRYPTION_KEY` | 64 hex chars (32 bytes) AES-256 key for credential encryption |
| `VIRUS_SCAN_ENABLED` | Enable VirusTotal scanning |
| `VIRUSTOTAL_API_KEY` | VirusTotal API key |

### Web Search & News

| Variable | Purpose |
|----------|---------|
| `SERP_API_KEY` | SerpAPI |
| `YOU_COM_API_KEY` | You.com search |
| `BRAVE_SEARCH_API_KEY` | Brave Search |
| `EXA_API_KEY` | Exa search |
| `TAVILY_API_KEY` | Tavily search |
| `NEWSDATA_API_KEY` | NewsData.io |
| `NYT_API_KEY` | New York Times |
| `MEDIASTACK_API_KEY` | MediaStack global news |

### Other

| Variable | Purpose |
|----------|---------|
| `S3_BUCKET`, `S3_REGION` | AWS S3 file storage |
| `COMPOSIO_API_KEY` | Composio tool integrations |
| `STABILITY_API_KEY` | Stability AI image generation |
| `POSTIZ_API_KEY` | Postiz social media publishing |
| `GOOGLE_PLACES_API_KEY` | Google Places prospecting |
| `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET` | QuickBooks sandbox |
| `QUICKBOOKS_PROD_CLIENT_ID`, `QUICKBOOKS_PROD_CLIENT_SECRET` | QuickBooks production |
| `QUICKBOOKS_ENVIRONMENT` | `sandbox` or `production` |

### Frontend (root `.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_APP_GATE_CODE` | Owner gate access code |
| `VITE_API_BASE_URL` | Backend URL override (default: `https://api.atlasux.cloud`) |

---

## Health Checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Root liveness: `{ ok: true }` |
| `GET /v1/health` | App liveness |
| `GET /v1/ready` | DB readiness (runs `SELECT 1`) |
| `GET /v1/health/providers` | LLM circuit breaker status |
| `GET /v1/runtime/status` | Engine state, last tick, pending approvals |

---

## Monitoring

- **Fastify logger:** Structured JSON logging. Production level: `info`. Development: `debug`.
- **Sensitive header redaction:** Authorization, cookies, CSRF tokens, webhook secrets.
- **Audit trail:** All non-GET requests logged to `audit_log` with hash chain.
- **Circuit breaker:** `lib/circuitBreaker.ts` tracks LLM provider health. Status exposed via `/v1/health/providers`.
- **Watchdog worker:** `workers/watchdogWorker.ts` monitors system health.
