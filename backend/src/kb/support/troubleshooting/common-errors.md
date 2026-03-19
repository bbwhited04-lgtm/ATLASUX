---
title: "Common Error Messages"
category: "Troubleshooting"
tags: ["errors", "error messages", "fixes", "integration", "API key", "calendar", "SMS"]
related:
  - troubleshooting/lucy-not-answering
  - troubleshooting/sms-not-sending
  - troubleshooting/calendar-sync-issues
  - troubleshooting/getting-help
  - integrations/api-keys
---

# Common Error Messages

This guide explains the most common error messages you may see in your Atlas UX dashboard and how to fix each one. If your error is not listed here, see [Getting Help](getting-help.md) for how to contact support.

---

## "Integration not connected"

**What it means:** Atlas UX tried to use a third-party service (Postiz, Twilio, ElevenLabs, Google Calendar, etc.) but could not find valid credentials for that integration.

**How to fix it:**

1. Go to **Settings > Integrations**.
2. Find the integration that is showing an error.
3. Click **Connect** and enter the required API key or sign in with your account.
4. After connecting, wait up to 5 minutes for the system to pick up the new credentials.

**Why it happens:** This usually occurs when you first set up Atlas UX and have not connected all integrations yet, or when an API key has been deleted or revoked at the provider's end.

For details on managing credentials, see [API Keys](../integrations/api-keys.md).

---

## "API key expired"

**What it means:** The API key stored for an integration is no longer valid. The provider (Postiz, ElevenLabs, etc.) has expired or revoked it.

**How to fix it:**

1. Log in to the provider's website (e.g., postiz.com, elevenlabs.io).
2. Generate a new API key from their settings or API section.
3. Return to Atlas UX > **Settings > Integrations**.
4. Click **Update Key** on the affected integration and paste the new key.

**Tip:** Some providers expire keys after a set period. If this keeps happening, check the provider's key expiration policy.

---

## "Calendar access denied"

**What it means:** Atlas UX does not have permission to read or write to your Google Calendar. The OAuth connection is either broken or has insufficient permissions.

**How to fix it:**

1. Go to **Settings > Integrations > Google Calendar** and click **Reconnect**.
2. Sign in with the correct Google account.
3. On the permissions screen, grant **all requested permissions** (view and edit events).
4. If the error persists, go to [myaccount.google.com/permissions](https://myaccount.google.com/permissions), remove Atlas UX, and reconnect from scratch.

For a full walkthrough, see [Calendar Sync Issues](calendar-sync-issues.md).

---

## "SMS delivery failed"

**What it means:** An SMS message (usually an appointment confirmation) could not be delivered to the customer's phone number.

**How to fix it:**

1. **Check the phone number** -- Make sure the customer's number is valid and in the correct format (+1XXXXXXXXXX for US numbers).
2. **Check Twilio status** -- Go to Settings > Integrations and verify the Twilio connection is active.
3. **Look at the audit log** -- Find the SMS event and check for a Twilio error code:
   - **21211** -- Invalid phone number
   - **21608** -- Unverified number (Twilio trial accounts can only text verified numbers)
   - **30007** -- Carrier filtered the message as spam
4. **Try resending** -- If the number is correct, try sending again. Temporary carrier issues can cause one-time failures.

For a deeper dive, see [SMS Not Sending](sms-not-sending.md).

---

## "Tenant required" or "TENANT_REQUIRED"

**What it means:** The system could not identify which business account the request belongs to. This is an internal error related to multi-tenant isolation.

**How to fix it:**

1. **Log out and log back in** to your Atlas UX dashboard. This refreshes your session and tenant context.
2. **Clear your browser cache** if the error persists after re-logging.
3. If you still see this error, contact support -- it may indicate a session or authentication issue.

---

## "Webhook validation failed"

**What it means:** An incoming request from a third-party service (ElevenLabs, Stripe) failed security validation. Atlas UX rejected it because it could not verify the request was genuine.

**What to do:**

This error is typically not something you caused. It means either:
- A misconfigured webhook secret (admin issue)
- An unauthorized party attempted to send fake webhook data (the system correctly blocked it)

If you see this error frequently, contact support. See [How We Protect Your Data](../security-privacy/how-we-protect-your-data.md) for why webhook validation matters.

---

## "Rate limit exceeded"

**What it means:** Too many requests were made in a short period. Atlas UX enforces rate limits per tenant to ensure fair usage and system stability.

**How to fix it:**

1. Wait a few minutes and try again.
2. If you are running automations or scripts that call the Atlas UX API, reduce the request frequency.
3. Daily action caps are enforced as a safety measure. If you are hitting the cap during normal usage, contact support about adjusting your limits.

---

## Still Stuck?

If your error is not listed here or the fix did not work:

1. Take a screenshot of the error message.
2. Check the **Audit Log** for related entries.
3. Note what you were doing when the error appeared.
4. Contact support with these details. See [Getting Help](getting-help.md).


---
## Media

### Atlas UX Resources
- [Atlas UX Platform](https://atlasux.cloud)
- [Getting Started Guide](https://atlasux.cloud/#/wiki/getting-started)
- [Contact Support](https://atlasux.cloud/#/support)
