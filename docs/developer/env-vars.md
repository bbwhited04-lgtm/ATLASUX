# Environment Variables Reference

All environment variables are validated by Zod in `backend/src/env.ts`. Frontend variables use the `VITE_` prefix and are embedded at build time.

## Frontend Variables (root `.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_GATE_CODE` | Yes | Access code for the AppGate component |
| `VITE_API_BASE_URL` | No | Backend URL (default: `http://localhost:8787`) |
| `VITE_BACKEND_URL` | No | Alias for `VITE_API_BASE_URL` |

## Backend Variables (`backend/.env`)

### Server

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8787` | HTTP server port |
| `NODE_ENV` | No | — | `development` or `production` |

### Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (PgBouncer in production) |
| `DIRECT_URL` | Yes | Direct PostgreSQL connection (for migrations) |

### Public URLs

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | No | Public app URL (e.g., `https://atlasux.cloud`) |
| `APP_PROTOCOL` | No | Deep link protocol (e.g., `atlasux://oauth/callback`) |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

### Supabase

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (JWT) |

### AI Providers

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | OpenAI API key |
| `OPENAI_BASE_URL` | No | Custom OpenAI endpoint |
| `DEEPSEEK_API_KEY` | No | DeepSeek API key |
| `DEEPSEEK_BASE_URL` | No | Custom DeepSeek endpoint |
| `OPENROUTER_API_KEY` | No | OpenRouter API key (Claude/Gemini fallback) |
| `CEREBRAS_API_KEY` | No | Cerebras API key |
| `GEMINI_API_KEY` | No | Google Gemini API key |

### OAuth — Google

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | No | Google OAuth callback URL |

### OAuth — Meta (Facebook/Instagram)

| Variable | Required | Description |
|----------|----------|-------------|
| `META_APP_ID` | No | Meta app ID |
| `META_APP_SECRET` | No | Meta app secret |
| `META_REDIRECT_URI` | No | Meta OAuth callback URL |

### OAuth — X (Twitter)

| Variable | Required | Description |
|----------|----------|-------------|
| `X_CLIENT_ID` | No | X OAuth 2.0 client ID |
| `X_CLIENT_SECRET` | No | X OAuth 2.0 client secret |
| `X_REDIRECT_URI` | No | X OAuth callback URL |
| `X_BEARER_TOKEN` | No | X API bearer token |
| `X_ACCESS_TOKEN` | No | X user access token |
| `X_ACCESS_TOKEN_SECRET` | No | X user access token secret |

### OAuth — Tumblr

| Variable | Required | Description |
|----------|----------|-------------|
| `TUMBLR_REQUEST_TOKEN_URL` | No | Tumblr OAuth 1.0a request token URL |
| `TUMBLR_AUTHORIZE_URL` | No | Tumblr authorization URL |
| `TUMBLR_ACCESS_TOKEN_URL` | No | Tumblr access token URL |
| `TUMBLR_AUTH_KEY` | No | Tumblr OAuth consumer key |
| `TUMBLR_OAUTH_SECRET` | No | Tumblr OAuth consumer secret |
| `TUMBLR_REDIRECT_URI` | No | Tumblr OAuth callback URL |

### OAuth — Microsoft 365

| Variable | Required | Description |
|----------|----------|-------------|
| `MICROSOFT_CLIENT_ID` | No | MS Graph OAuth client ID |
| `MICROSOFT_CLIENT_SECRET` | No | MS Graph OAuth client secret |
| `MICROSOFT_TENANT_ID` | No | MS tenant ID (`common` for multi-tenant) |
| `MICROSOFT_REDIRECT_URI` | No | MS OAuth callback URL |

### OAuth — Reddit

| Variable | Required | Description |
|----------|----------|-------------|
| `REDDIT_CLIENT_ID` | No | Reddit OAuth client ID |
| `REDDIT_CLIENT_SECRET` | No | Reddit OAuth client secret |
| `REDDIT_REDIRECT_URI` | No | Reddit OAuth callback URL |

### OAuth — Pinterest

| Variable | Required | Description |
|----------|----------|-------------|
| `PINTEREST_APP_ID` | No | Pinterest app ID |
| `PINTEREST_SECRET_KEY` | No | Pinterest secret key |
| `PINTEREST_REDIRECT_URI` | No | Pinterest OAuth callback URL |

### OAuth — LinkedIn

| Variable | Required | Description |
|----------|----------|-------------|
| `LINKEDIN_CLIENT_ID` | No | LinkedIn OAuth client ID |
| `LINKEDIN_CLIENT_SECRET` | No | LinkedIn OAuth client secret |
| `LINKEDIN_REDIRECT_URI` | No | LinkedIn OAuth callback URL |

### OAuth — TikTok

| Variable | Required | Description |
|----------|----------|-------------|
| `TIKTOK_CLIENT_KEY` | No | TikTok client key |
| `TIKTOK_CLIENT_SECRET` | No | TikTok client secret |
| `TIKTOK_REDIRECT_URI` | No | TikTok OAuth callback URL |

### Stripe

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | No | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |

### Email Sending

| Variable | Required | Description |
|----------|----------|-------------|
| `OUTBOUND_EMAIL_PROVIDER` | No | `microsoft`, `resend`, or `none` |
| `OUTBOUND_EMAIL_FROM` | No | Sender address for Resend |
| `RESEND_API_KEY` | No | Resend API key |
| `MS_TENANT_ID` | No | Microsoft tenant for email sending |
| `MS_CLIENT_ID` | No | Microsoft client ID for email |
| `MS_CLIENT_SECRET` | No | Microsoft client secret for email |
| `MS_SENDER_UPN` | No | Microsoft sender UPN (e.g., `atlas@deadapp.info`) |

### Telegram

| Variable | Required | Description |
|----------|----------|-------------|
| `BOTFATHERTOKEN` | No | Telegram bot token from BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | No | Webhook verification secret |

### Discord

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_PUBLIC_KEY` | No | Discord bot public key (Ed25519) |

### Engine & Safety

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENGINE_ENABLED` | No | `false` | Enable engine tick in server process |
| `ENGINE_TICK_INTERVAL_MS` | No | `5000` | Tick interval (server embedded mode) |
| `AUTO_SPEND_LIMIT_USD` | No | — | Threshold for auto-approval of spend |
| `MAX_ACTIONS_PER_DAY` | No | — | Daily action cap |
| `CONFIDENCE_AUTO_THRESHOLD` | No | — | Minimum confidence for auto-execution |

### Scheduler

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SCHEDULER_ENABLED` | No | — | Enable the scheduler worker |
| `SCHEDULER_POLL_MS` | No | — | Scheduler polling interval |
| `TENANT_ID` | No | — | Default tenant for scheduled workflows |

### Workers

| Variable | Required | Description |
|----------|----------|-------------|
| `WORKERS_API_KEY` | No | Shared secret for worker API calls |
