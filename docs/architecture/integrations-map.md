# Integrations Map

Atlas UX integrates with numerous external services for AI, communication, social publishing, payments, and identity management. This document catalogs all integrations.

## Integration Storage

OAuth tokens and integration state are stored in the `integrations` table, scoped per tenant:

```prisma
model Integration {
  id               String   @id @db.Uuid
  tenantId         String   @map("tenant_id") @db.Uuid
  provider         String   // TEXT (was enum, migrated in 20260225120000)
  connected        Boolean  @default(false)
  access_token     String?
  refresh_token    String?
  token_expires_at DateTime?
  scopes           Json     @default("[]")
  config           Json     @default("{}")
  status           Json     @default("{}")
  @@unique([tenantId, provider])
}
```

## AI Providers

| Provider | Route/File | API | Key Variable |
|----------|-----------|-----|--------------|
| OpenAI | `backend/src/ai.ts` | Chat Completions | `OPENAI_API_KEY` |
| DeepSeek | `backend/src/ai.ts` | Chat Completions (OpenAI-compatible) | `DEEPSEEK_API_KEY` |
| Anthropic (Claude) | `backend/src/ai.ts` | Messages API | `ANTHROPIC_API_KEY` |
| Google (Gemini) | `backend/src/ai.ts` | Generative AI API | `GEMINI_API_KEY` |
| OpenRouter | `backend/src/ai.ts` | Chat Completions (meta-provider) | `OPENROUTER_API_KEY` |
| Cerebras | Referenced in workflows | Fast inference | `CEREBRAS_API_KEY` |

## Communication Platforms

### Microsoft Graph (Email + Teams)

| Feature | Route | API |
|---------|-------|-----|
| Email sending | `emailSender.ts` worker | Graph API `/users/{upn}/sendMail` |
| Teams messaging | `/v1/teams` | Graph API `/teams/{id}/channels/{id}/messages` |

Authentication: Client credentials flow (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`).

### Telegram

| Feature | Route | API |
|---------|-------|-----|
| Bot messaging | `/v1/telegram` | Telegram Bot API |
| Save chat config | `/v1/telegram/save-chat` | Internal DB |
| Agent tool | `agentTools.ts` | `send_telegram_message` |

Token: `BOTFATHERTOKEN` env var.

### Discord

| Feature | Route | API |
|---------|-------|-----|
| Webhook verification | `/v1/discord/webhook` | Discord Interactions (Ed25519 signature) |

Signature verification uses `DISCORD_PUBLIC_KEY`.

## OAuth Platforms

All OAuth flows are handled by `backend/src/routes/oauthRoutes.ts` with provider-specific callback handling.

| Platform | Route Prefix | Key Variables | Agent |
|----------|-------------|---------------|-------|
| Google | `/v1/oauth` | `GOOGLE_CLIENT_ID/SECRET` | - |
| Meta (Facebook/Instagram) | `/v1/oauth` | `META_APP_ID/SECRET` | Fran |
| X (Twitter) | `/v1/oauth` | `X_CLIENT_ID/SECRET` | Kelly |
| Microsoft 365 | `/v1/oauth` | `MICROSOFT_CLIENT_ID/SECRET` | Porter |
| Reddit | `/v1/oauth` | `REDDIT_CLIENT_ID/SECRET` | Donna |
| Pinterest | `/v1/oauth` | `PINTEREST_APP_ID/SECRET_KEY` | Cornwall |
| LinkedIn | `/v1/oauth` | `LINKEDIN_CLIENT_ID/SECRET` | Link |
| TikTok | `/v1/oauth` | `TIKTOK_CLIENT_KEY/SECRET` | Timmy |
| Tumblr | `/v1/oauth` | `TUMBLR_AUTH_KEY/OAUTH_SECRET` | Terry |

### Verification Status

- **Google:** Pending (requires YouTube video demo)
- **Meta:** Pending approval
- **Apple:** Dev app submitted, waiting for permission
- **TikTok:** Pending verification

## Payments

### Stripe

| Feature | Route | API |
|---------|-------|-----|
| Payment processing | `/v1/stripe` | Stripe API |
| Billing webhooks | `/v1/billing` | Stripe Webhooks (signature verification) |

Uses `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

## Infrastructure

### Supabase

| Feature | Usage |
|---------|-------|
| PostgreSQL | Primary database (via Prisma) |
| Auth | JWT verification (`authPlugin.ts`) |
| Storage | File uploads (`kb_uploads` bucket) |

Variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

### File Storage

Files are stored in the Supabase `kb_uploads` bucket at tenant-scoped paths:

```
tenants/{tenantId}/filename.ext
```

Routes: `/v1/files` (list, upload, signed-URL download, delete).

## Social Platform Publishing

Social publishing agents use the OAuth tokens stored in `integrations` to post content:

| Platform | Agent | Publish Workflow |
|----------|-------|-----------------|
| X (Twitter) | Kelly | WF-042 |
| Facebook | Fran | WF-057 |
| Threads | Dwight | WF-055 |
| TikTok | Timmy | WF-054 |
| Tumblr | Terry | WF-049 |
| Pinterest | Cornwall | WF-048 |
| LinkedIn | Link | WF-045 |
| Alignable | Emma | WF-056 |
| Reddit | Donna | WF-051, WF-052 |
| Blog | Reynolds | WF-041, WF-108 |

## Tool Integrations

The `backend/src/tools/` directory contains specific integration code:

```
tools/
  Outlook/    # Microsoft Outlook calendar and email
  Slack/      # Slack workspace messaging
```

## GDPR Compliance Endpoints

| Platform | Route | Purpose |
|----------|-------|---------|
| Meta | `/v1/meta` | Data deletion callback |
| Google | `/v1/google` | Data deletion callback |

These endpoints handle platform-mandated data deletion requests for OAuth compliance.

## Mobile Pairing

| Feature | Route | Mechanism |
|---------|-------|-----------|
| QR-based pairing | `/v1/mobile` | In-memory store with 10-min TTL |

4 endpoints for device pairing. The web app generates QR codes; the mobile app scans and authenticates.
