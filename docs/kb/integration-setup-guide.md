# Integration Setup Guide

## Overview

Atlas UX connects to external services through OAuth integrations, API keys, and webhook configurations. This guide covers setup for all supported integrations: Microsoft 365, Telegram, Stripe, and social media platforms.

## Microsoft 365 Integration

### What It Enables
- Email sending via Microsoft Graph API
- Teams channel messaging
- SharePoint document access
- OneDrive file access
- Calendar integration (via Claire)

### Setup Steps

1. **Azure AD App Registration**
   - Go to Azure Portal > Azure Active Directory > App registrations
   - Create a new registration for Atlas UX
   - Note the Application (client) ID and Directory (tenant) ID

2. **Configure Permissions**
   Grant these Application permissions with admin consent:
   - `Mail.Send` -- Send email on behalf of users
   - `Group.ReadWrite.All` -- Teams channel messaging
   - `Sites.ReadWrite.All` -- SharePoint access
   - `Files.ReadWrite.All` -- OneDrive access
   - `Calendars.ReadWrite` -- Calendar access

3. **Generate Client Secret**
   - Go to Certificates & secrets
   - Create a new client secret
   - Copy the value immediately (it will not be shown again)

4. **Set Environment Variables**
   ```
   MS_TENANT_ID=<your-azure-directory-id>
   MS_CLIENT_ID=<your-application-id>
   MS_CLIENT_SECRET=<your-client-secret>
   MS_SENDER_UPN=atlas@yourdomain.com
   ```

5. **Test the Connection**
   - Send a test email through the Job Runner
   - Verify delivery in the recipient's inbox
   - Check the audit log for the send record

### Teams Integration
- Teams messages use `Group.ReadWrite.All` (Application permission)
- Requires team ID and channel ID from Teams admin
- Messages are sent via the Graph API `POST /teams/{teamId}/channels/{channelId}/messages`
- If you see a 403 error, verify the permission is granted with admin consent in Azure Portal

## Telegram Integration

### What It Enables
- Two-way chat with Atlas agents via Telegram
- Real-time AI responses to direct messages
- Agent notification delivery
- Command-based agent switching (`/atlas`, `/binky`, `/cheryl`)

### Setup Steps

1. **Create a Bot via BotFather**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow the prompts
   - Copy the bot token

2. **Set Environment Variable**
   ```
   BOTFATHERTOKEN=<your-bot-token>
   ```

3. **Configure Webhook**
   - The backend registers the Telegram webhook at startup
   - Routes are mounted at `/v1/telegram`

4. **Link Your Chat**
   - Open the Messaging Hub at `/app/messaging`
   - Go to the Telegram tab
   - Send a message to your bot on Telegram
   - Click "Set default" to save your chat ID
   - The green badge confirms which chat agents are targeting

5. **Test the Integration**
   - Send a message to the bot: "Hello Atlas"
   - You should receive an AI-powered response
   - Try `/binky` to switch to the CRO agent
   - Use `/help` to see all available commands

### Telegram Features
- `/atlas`, `/binky`, `/cheryl`, `/sunday` -- Switch active agent
- `/help` -- List all available agent commands
- `/clear` -- Reset conversation context
- Typing indicator shows while the agent processes
- Long responses auto-split at 4096 characters
- All conversations logged to audit trail

## Stripe Integration

### What It Enables
- Payment processing for digital products and subscriptions
- Billing webhook for checkout completions, payment successes, and refunds
- Audit trail logging for all financial transactions

### Setup Steps

1. **Create a Stripe Account**
   - Sign up at stripe.com
   - Complete business verification

2. **Get API Keys**
   - Navigate to Developers > API keys
   - Copy the Secret key (starts with `sk_`)

3. **Configure Webhook**
   - Go to Developers > Webhooks
   - Add an endpoint: `https://your-backend-url/v1/billing/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.refunded`
   - Copy the Webhook signing secret (starts with `whsec_`)

4. **Set Environment Variables**
   ```
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Create Products and Prices**
   - Set up products in the Stripe dashboard
   - Create price objects for each subscription tier
   - Link price IDs to the corresponding tiers in the platform

### Stripe Webhook Events
The webhook handler verifies HMAC signatures and processes:
- `checkout.session.completed` -- New subscription or one-time purchase
- `payment_intent.succeeded` -- Successful payment
- `charge.refunded` -- Refund processed

All events are logged to the audit trail with financial details.

## Social Media Platform Integrations

### OAuth Flow
Social platforms use OAuth for authentication:

1. User initiates connection from Settings > Integrations
2. Browser redirects to the platform's OAuth consent screen
3. User grants permissions
4. Platform returns an authorization code
5. Backend exchanges the code for access and refresh tokens
6. Tokens are stored in the Integration table (tenant-scoped)

### Supported Platforms

| Platform | OAuth Status | Agent |
|----------|-------------|-------|
| X (Twitter) | Verification in progress | Kelly |
| Facebook | Meta verification in progress | Fran |
| LinkedIn | Available | Link |
| Pinterest | Available | Cornwall |
| TikTok | Verification in progress | Timmy |
| Tumblr | Available | Terry |
| Reddit | Available | Donna |
| Alignable | Available | Emma |

### Platform Verification Notes
Some platforms require additional verification before OAuth access is granted:
- **Google Cloud**: Requires a YouTube video demo of the app
- **Meta (Facebook/Instagram)**: Waiting for app permission approval
- **TikTok**: Similar video verification requirement
- **Apple**: Developer app submitted, awaiting approval

### Connecting a Platform
1. Go to `/app/settings` > Integrations
2. Click "Connect" next to the platform
3. Complete the OAuth flow in the popup/redirect
4. Verify the connection shows "Connected" status
5. The corresponding social publisher agent is now active

## Google OAuth Integration

### What It Enables
- Google account authentication
- Gmail access (when approved)
- Google Calendar integration
- YouTube API access (pending verification)

### Setup
```
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

Note: Full Google OAuth verification requires a YouTube video demonstration of the application. This is currently in progress.

## Integration Management

### Business Manager > Integrations
The Integrations sub-view in Business Manager shows:
- Connected services with status indicators
- Connect/disconnect buttons for each integration
- Last sync timestamp
- Error states with diagnostic information

### Integration Data Model
Integrations are stored in the database with:
- `provider` (TEXT field -- supports any provider name)
- `config` (JSON -- stores provider-specific settings like chat_id for Telegram)
- `tenant_id` (scopes the integration to an organization)
- Token storage for OAuth credentials

## Troubleshooting

### Microsoft 365

**403 Forbidden on Teams**
- Go to Azure Portal > API permissions
- Verify `Group.ReadWrite.All` is granted
- Click "Grant admin consent" if not already done
- Wait 5-10 minutes for permission propagation

**Email Not Sending**
- Verify MS_SENDER_UPN has a valid mailbox
- Check that the client secret has not expired
- Confirm MS_TENANT_ID matches your Azure directory
- Review the email worker logs for token errors

### Telegram

**"Chat not linked" Error**
- Ensure you have set a default chat via the Messaging Hub
- The chat_id lookup handles both string and numeric types
- Try re-sending a message to the bot and re-linking

**No Response from Bot**
- Verify BOTFATHERTOKEN is correct
- Check that the webhook is registered (check backend startup logs)
- Confirm the backend is accessible from Telegram's servers (HTTPS required)

### Stripe

**Webhook Not Firing**
- Verify the webhook URL is correct and accessible
- Check that the signing secret matches
- Review Stripe dashboard > Webhooks > Recent events for delivery attempts
- Confirm the backend is processing POST requests at `/v1/billing/stripe/webhook`

### General

**Integration Shows "Disconnected"**
- OAuth tokens may have expired; reconnect the integration
- Check network connectivity between Atlas UX and the external service
- Review the audit log for integration-related errors
- Verify environment variables are set correctly on all Render services
