---
title: "Managing Integration API Keys"
category: "Integrations"
tags: ["API keys", "credentials", "security", "integrations", "advanced"]
related:
  - integrations/postiz-social-media
  - integrations/twilio-telephony
  - integrations/elevenlabs-voice
  - integrations/stripe-payments
  - security-privacy/how-we-protect-your-data
  - troubleshooting/common-errors
---

# Managing Integration API Keys

Atlas UX connects to several third-party services to power Lucy's voice, SMS, social media, and more. Each connection requires an API key -- a secure credential that authorizes Atlas UX to use that service on your behalf. This article explains how credentials work for advanced users who want to manage their own integrations.

## Where Credentials Are Stored

All API keys stored in Atlas UX are **encrypted at rest** using AES-256-GCM encryption. This is the same encryption standard used by banks and government agencies. Here is what that means:

- Your API key is encrypted before it is written to the database.
- The encrypted value is stored as a formatted string (`iv:tag:ciphertext`) that is useless without the master encryption key.
- Even if someone accessed the raw database, they would see only encrypted data, never your actual API keys.

For full details on our encryption approach, see [How We Protect Your Data](../security-privacy/how-we-protect-your-data.md).

## How the Credential Resolver Works

Atlas UX uses a per-tenant credential resolver that looks up your API keys in this order:

1. **Your tenant's stored credentials** -- If you have added a key for a specific integration, it uses that key.
2. **Platform default (owner tenant only)** -- If you are on the platform owner account and no tenant-specific key exists, the system falls back to environment-level defaults.

Results are cached in memory for 5 minutes for performance, then refreshed from the encrypted store. This means updates to your keys take effect within 5 minutes at most.

## Adding or Updating an API Key

1. Log in to your Atlas UX dashboard.
2. Go to **Settings > Integrations**.
3. Find the integration you want to configure.
4. Click **Connect** (for a new key) or **Update Key** (to change an existing one).
5. Paste your API key and click **Save**.

The key is encrypted immediately upon save. The previous key (if any) is overwritten.

## Removing an Integration

To disconnect an integration:

1. Go to **Settings > Integrations**.
2. Click **Disconnect** on the integration card.
3. Confirm the removal.

This deletes the encrypted credential from the database. The integration will stop working immediately. You can reconnect at any time by adding a new key.

## What Each Integration Requires

| Integration | Credential(s) Needed | What It Powers |
|---|---|---|
| **Postiz** | Postiz API Key | Social media posting and analytics. See [Postiz Integration](postiz-social-media.md). |
| **Twilio** | Account SID, Auth Token, From Number | Phone calls and SMS. See [Twilio Telephony](twilio-telephony.md). |
| **ElevenLabs** | ElevenLabs API Key | Lucy's AI voice. See [ElevenLabs Voice](elevenlabs-voice.md). |
| **Stripe** | Managed by Atlas UX | Billing and payments. You do not need to provide a Stripe key. See [Stripe Payments](stripe-payments.md). |
| **Google Calendar** | OAuth connection | Calendar sync and appointment booking. No API key needed -- you authorize via Google sign-in. |
| **Slack** | Slack Bot Token | Notifications to your Slack workspace. |

## Security Best Practices

- **Never share API keys** via email, chat, or text. Use the Atlas UX dashboard to enter them securely.
- **Rotate keys periodically.** If you suspect a key has been compromised, update it immediately in Settings > Integrations.
- **Use separate keys** for Atlas UX rather than reusing keys from other applications. This limits exposure if any single key is compromised.
- **Check the audit trail.** All credential changes are logged. See [Audit Trail](../security-privacy/audit-trail.md) to review who made changes and when.

## Common Issues

- **"Integration not connected"** -- The API key for that service is missing or was removed. Add it in Settings > Integrations.
- **"API key expired"** -- The key has been revoked or expired at the provider. Generate a new key from the provider's dashboard and update it in Atlas UX.

For more error explanations, see [Common Errors](../troubleshooting/common-errors.md). For help, see [Getting Help](../troubleshooting/getting-help.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
