# Email API

The Email API handles both inbound email processing (classification and routing to agents) and outbound email sending via Microsoft Graph or Resend. Each named AI agent has its own email address.

## Base URL

```
/v1/email
```

---

## Inbound Email Pipeline

### POST /v1/email/inbound

Receives inbound emails and routes them through a five-stage pipeline:

```
Mailbox --> Ingest --> Normalize --> Classify --> Dispatch --> Audit
```

**Authentication:** Requires the `x-inbound-secret` header matching the `INBOUND_EMAIL_SECRET` environment variable. If the env var is not set, all requests are rejected (fail-closed).

**Request:**

```bash
curl -X POST \
     -H "x-inbound-secret: $INBOUND_SECRET" \
     -H "Content-Type: application/json" \
     -d '{
       "tenantId": "9a8a332c-...",
       "to": "support@deadapp.info",
       "from": "customer@example.com",
       "fromName": "Jane Doe",
       "subject": "Help with my account",
       "text": "I need help resetting my password.",
       "messageId": "msg-12345",
       "provider": "microsoft"
     }' \
     https://api.atlasux.cloud/v1/email/inbound
```

**Request Body:**

| Field                 | Type   | Required | Description                                |
|-----------------------|--------|----------|--------------------------------------------|
| `tenantId`            | string | Yes      | Tenant UUID                                |
| `to` / `recipient`   | string | No       | Recipient email address                    |
| `from` / `sender`    | string | No       | Sender email address                       |
| `fromName`            | string | No       | Sender display name                        |
| `subject`             | string | No       | Email subject line                         |
| `text` / `body`       | string | No       | Plain text body                            |
| `html`                | string | No       | HTML body (stripped to text if no plain text)|
| `messageId`           | string | No       | Provider message ID for deduplication      |
| `provider`            | string | No       | Email provider (default: `manual`)         |

**Query Parameters:**

| Param        | Default | Description                                  |
|--------------|---------|----------------------------------------------|
| `runTickNow` | `true`  | Trigger an immediate engine tick after dispatch|

**Response (200):**

```json
{
  "ok": true,
  "pipeline": "mailbox->ingest->normalize->classify->dispatch->audit",
  "intentId": "intent_uuid",
  "agentKey": "cheryl",
  "workflowId": "WF-001",
  "classifyReason": "named_inbox",
  "tickResult": {}
}
```

---

## Classification Logic

The classifier determines which agent handles the email, in priority order:

1. **DB inbox table**: Looks up the `agent_inboxes` table by recipient address.
2. **Named inbox map**: Matches against known agent email addresses (petra, claire, sandy, frank, cheryl).
3. **Keyword match**: Project-related keywords (e.g., "project", "task", "sprint", "deadline") route to Petra (PM).
4. **Default**: Unmatched emails route to Cheryl (Support).

**Agent Routing Table:**

| Agent  | Workflow | Trigger Condition                |
|--------|----------|----------------------------------|
| cheryl | WF-001   | Default + support@ inbox         |
| petra  | WF-002   | Project-related keywords         |
| claire | WF-003   | Calendar inbox                   |
| sandy  | WF-004   | Booking inbox                    |
| frank  | WF-005   | Forms inbox                      |

---

## SMTP Configuration

### POST /v1/email/smtp-config

Store SMTP credentials server-side in the `token_vault`. The password is never stored in the client browser.

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "host": "smtp.example.com",
       "port": "587",
       "username": "user@example.com",
       "password": "app-password",
       "fromName": "Atlas UX",
       "fromEmail": "noreply@example.com",
       "tls": true
     }' \
     https://api.atlasux.cloud/v1/email/smtp-config
```

---

## Outbound Email (Worker)

Outbound email is handled by a separate worker process (`emailSender.ts`) that polls the `jobs` table for `EMAIL_SEND` job types.

**Supported Providers:**

| Provider   | Configuration                                          |
|------------|--------------------------------------------------------|
| Microsoft  | `MS_TENANT_ID` + `MS_CLIENT_ID` + `MS_CLIENT_SECRET`  |
| Resend     | `RESEND_API_KEY`                                       |

The Microsoft path uses client credentials to call Graph API `/v1.0/users/{MS_SENDER_UPN}/sendMail`. The sender UPN defaults to `atlas@deadapp.info`.

---

## Agent Email Addresses

Each named agent has a dedicated email address configured in `config/agentEmails.ts`. Inbound emails addressed to an agent's email are automatically routed to that agent.

---

## Environment Variables

| Variable                | Description                                  |
|-------------------------|----------------------------------------------|
| `INBOUND_EMAIL_SECRET`  | Secret for authenticating inbound webhooks   |
| `OUTBOUND_EMAIL_PROVIDER` | `microsoft` or `resend`                    |
| `MS_TENANT_ID`          | Microsoft Azure AD tenant ID                 |
| `MS_CLIENT_ID`          | Microsoft app client ID                      |
| `MS_CLIENT_SECRET`      | Microsoft app client secret                  |
| `MS_SENDER_UPN`         | Microsoft sender email (default: atlas@deadapp.info) |
| `RESEND_API_KEY`        | Resend API key (alternative provider)        |
