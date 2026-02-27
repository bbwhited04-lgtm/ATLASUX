# Environment Variables

Atlas UX uses environment variables extensively across frontend and backend. The backend validates all variables at startup using a Zod schema in `backend/src/env.ts`.

## Frontend Variables (root `.env`)

Frontend variables must be prefixed with `VITE_` to be accessible in the browser bundle.

| Variable              | Required | Description                                    |
|-----------------------|----------|------------------------------------------------|
| `VITE_APP_GATE_CODE`  | No       | Access code gate for the app                   |
| `VITE_API_BASE_URL`   | Yes      | Backend API URL (default: `http://localhost:8787`) |

Set these in the Vercel dashboard for production, or in a root `.env` file for local development.

## Backend Variables (`backend/.env`)

### Core

| Variable       | Required | Description                                 |
|----------------|----------|---------------------------------------------|
| `PORT`         | No       | Server port (default: `8787`)               |
| `NODE_ENV`     | No       | Environment (`development`, `production`)   |
| `APP_URL`      | No       | Public app URL (e.g., `https://atlasux.cloud`) |
| `APP_PROTOCOL` | No       | Deep link protocol (e.g., `atlasux://oauth/callback`) |
| `ALLOWED_ORIGINS` | No    | Comma-separated CORS origins               |

### Database

| Variable       | Required | Description                                        |
|----------------|----------|----------------------------------------------------|
| `DATABASE_URL` | Yes      | PgBouncer pooled connection string (Supabase)      |
| `DIRECT_URL`   | Yes      | Direct PostgreSQL connection (for migrations)      |

### Supabase

| Variable                     | Required | Description                              |
|------------------------------|----------|------------------------------------------|
| `SUPABASE_URL`               | Yes      | Supabase project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes      | Service role key (never expose to client) |

### AI Providers

| Variable              | Required | Description                          |
|-----------------------|----------|--------------------------------------|
| `OPENAI_API_KEY`      | No*      | OpenAI API key                       |
| `OPENAI_BASE_URL`     | No       | Custom OpenAI-compatible endpoint    |
| `DEEPSEEK_API_KEY`    | No*      | DeepSeek API key                     |
| `DEEPSEEK_BASE_URL`   | No       | Custom DeepSeek endpoint             |
| `OPENROUTER_API_KEY`  | No*      | OpenRouter API key (Claude/Gemini)   |
| `ANTHROPIC_API_KEY`   | No*      | Direct Anthropic API key             |
| `GEMINI_API_KEY`      | No*      | Google Gemini API key                |
| `GL_GOOGLE_API_KEY`   | No       | Alternative Google API key name      |
| `CEREBRAS_API_KEY`    | No*      | Cerebras API key                     |

*At least one AI provider key is required for AI features.

### OAuth Providers

| Variable                   | Required | Description                     |
|----------------------------|----------|---------------------------------|
| `GOOGLE_CLIENT_ID`         | No       | Google OAuth client ID          |
| `GOOGLE_CLIENT_SECRET`     | No       | Google OAuth client secret      |
| `GOOGLE_REDIRECT_URI`      | No       | Google OAuth callback URL       |
| `META_APP_ID`              | No       | Meta (Facebook) app ID          |
| `META_APP_SECRET`          | No       | Meta app secret                 |
| `META_REDIRECT_URI`        | No       | Meta OAuth callback URL         |
| `X_CLIENT_ID`              | No       | X (Twitter) OAuth 2.0 client ID|
| `X_CLIENT_SECRET`          | No       | X client secret                 |
| `X_REDIRECT_URI`           | No       | X OAuth callback URL            |
| `X_BEARER_TOKEN`           | No       | X app-only bearer token         |
| `X_ACCESS_TOKEN`           | No       | X user access token             |
| `X_ACCESS_TOKEN_SECRET`    | No       | X user access token secret      |
| `TUMBLR_AUTH_KEY`          | No       | Tumblr OAuth 1.0a key           |
| `TUMBLR_OAUTH_SECRET`      | No       | Tumblr OAuth 1.0a secret        |
| `TUMBLR_REDIRECT_URI`      | No       | Tumblr callback URL             |
| `MICROSOFT_CLIENT_ID`      | No       | Microsoft 365 OAuth client ID   |
| `MICROSOFT_CLIENT_SECRET`  | No       | Microsoft 365 client secret     |
| `MICROSOFT_TENANT_ID`      | No       | Microsoft tenant (`common` for multi) |
| `MICROSOFT_REDIRECT_URI`   | No       | Microsoft OAuth callback URL    |
| `REDDIT_CLIENT_ID`         | No       | Reddit OAuth2 client ID         |
| `REDDIT_CLIENT_SECRET`     | No       | Reddit client secret             |
| `REDDIT_REDIRECT_URI`      | No       | Reddit callback URL              |
| `PINTEREST_APP_ID`         | No       | Pinterest OAuth2 app ID          |
| `PINTEREST_SECRET_KEY`     | No       | Pinterest secret key              |
| `PINTEREST_REDIRECT_URI`   | No       | Pinterest callback URL            |
| `LINKEDIN_CLIENT_ID`       | No       | LinkedIn OAuth2 client ID        |
| `LINKEDIN_CLIENT_SECRET`   | No       | LinkedIn client secret            |
| `LINKEDIN_REDIRECT_URI`    | No       | LinkedIn callback URL             |
| `TIKTOK_CLIENT_KEY`        | No       | TikTok OAuth2 client key          |
| `TIKTOK_CLIENT_SECRET`     | No       | TikTok client secret              |
| `TIKTOK_REDIRECT_URI`      | No       | TikTok callback URL               |

### Email Sending

| Variable                  | Required | Description                              |
|---------------------------|----------|------------------------------------------|
| `OUTBOUND_EMAIL_PROVIDER` | No       | `microsoft`, `resend`, or `none`         |
| `OUTBOUND_EMAIL_FROM`     | No*      | Sender address (required for Resend)     |
| `RESEND_API_KEY`          | No*      | Resend API key                           |
| `MS_TENANT_ID`            | No*      | Microsoft 365 tenant ID                  |
| `MS_CLIENT_ID`            | No*      | Microsoft 365 client ID                  |
| `MS_CLIENT_SECRET`        | No*      | Microsoft 365 client secret              |
| `MS_SENDER_UPN`           | No*      | Microsoft sender UPN (e.g., atlas@deadapp.info) |

*Required based on `OUTBOUND_EMAIL_PROVIDER` value.

### Messaging

| Variable                   | Required | Description                    |
|----------------------------|----------|--------------------------------|
| `BOTFATHERTOKEN`           | No       | Telegram Bot API token         |
| `TELEGRAM_WEBHOOK_SECRET`  | No       | Telegram webhook secret        |
| `DISCORD_PUBLIC_KEY`       | No       | Discord interaction public key |

### Engine and Safety

| Variable                      | Required | Description                                  |
|-------------------------------|----------|----------------------------------------------|
| `ENGINE_ENABLED`              | No       | Enable in-process engine (`true`/`false`)    |
| `ENGINE_TICK_INTERVAL_MS`     | No       | In-process tick interval (default: `5000`)   |
| `ENGINE_LOOP_IDLE_MS`         | No       | Worker idle sleep (default: `750`)           |
| `ENGINE_LOOP_OFFLINE_MS`      | No       | Worker offline sleep (default: `2500`)       |
| `ENGINE_LOOP_MAX_TICKS_PER_CYCLE` | No  | Max intents per cycle (default: `25`)        |
| `AUTO_SPEND_LIMIT_USD`       | No       | Max auto-spend before approval required      |
| `MAX_ACTIONS_PER_DAY`        | No       | Daily autonomous action cap                  |
| `CONFIDENCE_AUTO_THRESHOLD`  | No       | Min confidence for auto-execution            |

### Scheduler

| Variable              | Required | Description                               |
|-----------------------|----------|-------------------------------------------|
| `SCHEDULER_ENABLED`   | No       | Set to `false` to pause all scheduled jobs |
| `SCHEDULER_POLL_MS`   | No       | Polling interval (default: `60000`)       |
| `TENANT_ID`           | No       | Default tenant for scheduler jobs         |

### Workers

| Variable              | Required | Description                         |
|-----------------------|----------|-------------------------------------|
| `WORKERS_API_KEY`     | No       | API key for inter-worker auth       |
| `EMAIL_WORKER_POLL_MS`| No      | Email worker poll interval (default: `2000`) |
| `EMAIL_WORKER_BATCH`  | No       | Email worker batch size (default: `10`) |

### Payments

| Variable                | Required | Description                      |
|-------------------------|----------|----------------------------------|
| `STRIPE_SECRET_KEY`     | No       | Stripe secret API key            |
| `STRIPE_WEBHOOK_SECRET` | No       | Stripe webhook signing secret    |

## Zod Validation

The backend validates env vars at startup using Zod in `backend/src/env.ts`:

```typescript
const EnvSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  // ... all other variables
});

export function loadEnv(processEnv: NodeJS.ProcessEnv): Env {
  const parsed = EnvSchema.safeParse(processEnv);
  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${parsed.error.issues.map(...)}`);
  }
  return parsed.data;
}
```

Only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are strictly required. All other variables are optional and enable features when present.

## Pushing to Render

All four Render services need identical env vars. Use the Render API to push:

```bash
# Push to all services (replace ALL vars on each)
for SID in srv-d62bnoq4d50c738b4e6g srv-d6eoq07gi27c73ae4ing srv-d6eoojkr85hc73frr5rg srv-d6fk5utm5p6s73bqrohg; do
  curl -X PUT "https://api.render.com/v1/services/$SID/env-vars" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d @env-vars.json
done
```

The PUT endpoint **replaces all variables**, so always include the complete set. Deduplicate keys before pushing.
