# Integrations Overview

## Overview

Atlas UX connects with a wide range of external services to enable its AI agents to communicate, publish, manage data, and automate business processes. Each integration is configured per-tenant, meaning organizations maintain their own credentials and connections.

## Communication Integrations

### Microsoft Teams

Atlas UX integrates directly with Microsoft Teams through the Microsoft Graph API:
- **Send messages** to Teams channels using `teamId` and `channelId`
- **No Power Automate dependency** — uses direct Graph API calls
- **Required permission**: `ChannelMessage.Send` in Azure AD
- **Authentication**: Client credentials flow (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`)

If the required Azure AD permission is missing, the integration returns a 403 error with guidance on configuring the permission in the Azure portal.

### Telegram

Telegram integration enables real-time agent notifications and messaging:
- **Bot-based**: Uses a BotFather token (`BOTFATHERTOKEN` env var)
- **Endpoints**: Registered at `/v1/telegram`
- **Chat persistence**: `POST /v1/telegram/save-chat` and `GET /v1/telegram/default-chat` store chat IDs in Integration configuration
- **Agent trigger**: Agents automatically use Telegram when they detect keywords like "notify me," "ping me," or "alert me"
- **Frontend**: Accessible through the Messaging Hub component

### Email (Microsoft Graph / Resend)

Outbound email is sent through configured providers:

**Microsoft Graph (Primary)**
- Uses client credentials flow to send via Graph API
- Sender: `MS_SENDER_UPN` (default: `atlas@deadapp.info`)
- Endpoint: `/v1.0/users/{MS_SENDER_UPN}/sendMail`
- Each named agent has its own email address

**Resend (Alternative)**
- REST API-based email sending
- Requires `RESEND_API_KEY`
- Used as a fallback or alternative provider

**Email Worker**
- Separate process (`emailSender.ts`) polls the jobs table for `EMAIL_SEND` jobs
- Runs as a dedicated Render worker service
- Processes queued emails asynchronously

### Slack

Slack integration supports:
- Posting messages to channels
- Formatted messages with blocks and attachments
- Channel-based routing for different agent communications

## OAuth Providers

Atlas UX supports OAuth 2.0 authentication with multiple providers:

### Google OAuth
- **Status**: Pending verification (requires YouTube video demo)
- **Scopes**: Calendar, Gmail, Drive (configurable)
- **Flow**: Standard OAuth 2.0 authorization code flow
- **Credentials**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Meta (Facebook/Instagram) OAuth
- **Status**: Pending verification (waiting for permission)
- **Scopes**: Pages management, content publishing
- **Credentials**: `META_APP_ID`, `META_APP_SECRET`

### X (Twitter) OAuth
- **Status**: Active
- **Scopes**: Tweet posting, account management
- **Credentials**: `X_CLIENT_ID`, `X_CLIENT_SECRET`

### Apple / iCloud
- **Status**: Pending (developer app submitted, awaiting approval)
- **Planned**: iCloud OAuth via CloudKit for contact and photo sync
- **Architecture**: Fits the existing `oauthRoutes.ts` pattern

## Payment Integration

### Stripe

Stripe handles all billing and payment processing:
- Subscription management for pricing tiers
- Payment method collection and storage
- Invoice generation
- Webhook-based event processing for payment status updates
- Annual discount handling (20% off)

## Data and Storage

### Supabase

Supabase provides the primary database and file storage:

**PostgreSQL Database**
- Hosted on Supabase with connection pooling via Pgbouncer
- Direct connection URL available for migrations
- `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in environment

**File Storage**
- Bucket: `kb_uploads`
- Tenant paths: `tenants/{tenantId}/`
- Operations: upload, list, signed-URL download, delete
- Route: `/v1/files`
- Service role key required for server-side operations

## AI Providers

Multiple AI providers power agent reasoning and content generation:

| Provider | Use Case | Configuration |
|---|---|---|
| OpenAI | Primary reasoning and generation | `OPENAI_API_KEY` |
| DeepSeek | Alternative reasoning | `DEEPSEEK_API_KEY` |
| OpenRouter | Multi-model routing | Via `ai.ts` config |
| Cerebras | High-speed inference | Via `ai.ts` config |
| Google Gemini | Long-context summarization | Via `ai.ts` config |

Provider selection is automatic based on task type, context length, and latency requirements.

## Social Media Platforms

Each platform has a dedicated publishing agent:

| Platform | Agent | Status |
|---|---|---|
| X/Twitter | Kelly | Active |
| Facebook | Fran | Pending Meta verification |
| Threads | Dwight | Pending Meta verification |
| TikTok | Timmy | Pending verification |
| Tumblr | Terry | Active |
| Pinterest | Cornwall | Active |
| LinkedIn | Link | Active |
| Alignable | Emma | Active |
| Reddit | Donna | Active |
| Blog | Reynolds | Active |

## Integration Architecture

All integrations follow consistent patterns:

1. **Credentials**: Stored as environment variables, never in client code
2. **Per-tenant**: Each organization configures its own connections
3. **Audit logged**: All integration actions are recorded
4. **Rate limited**: Respects both Atlas UX and provider-side rate limits
5. **Error handling**: Failures are caught, logged, and escalated appropriately

## Key Takeaways

1. Atlas UX integrates with communication, payment, storage, AI, and social media platforms.
2. All integrations are per-tenant with isolated credentials.
3. Several OAuth verifications are pending provider approval.
4. The integration architecture is extensible — new services follow established patterns.
5. Every integration action is auditable and rate-limited.
