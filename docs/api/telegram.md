# Atlas UX API -- Telegram

Two-way chat bridge between Telegram and Atlas UX agents. Users can message the bot on Telegram to chat with any agent in real-time.

**Required Environment Variables:** `BOTFATHERTOKEN`, `TELEGRAM_WEBHOOK_SECRET` (optional)

## Bot Info

```
GET /v1/telegram/me
```

Verifies the bot is reachable via the Telegram Bot API.

**Auth:** JWT + `x-tenant-id` header.

**Response:**

```json
{ "ok": true, "bot": { "id": 123456, "first_name": "AtlasBot", "username": "atlas_ux_bot" } }
```

## Send Message

```
POST /v1/telegram/send
```

Sends a message to a Telegram chat.

**Request Body:**

```json
{
  "chat_id": "123456789",
  "text": "Hello from Atlas!",
  "parse_mode": "Markdown"
}
```

**Response:**

```json
{ "ok": true, "message_id": 42 }
```

## Incoming Webhook

```
POST /v1/telegram/webhook
```

Receives incoming Telegram messages. The bot processes commands and routes regular messages through the chat engine.

**Auth:** Validated via `x-telegram-bot-api-secret-token` header (if `TELEGRAM_WEBHOOK_SECRET` is set).

**Supported Commands:**

| Command | Description |
|---------|-------------|
| `/start` | Register this chat or show welcome message |
| `/help` | List available agents |
| `/clear` | Reset conversation history |
| `/atlas` | Switch to Atlas agent |
| `/binky` | Switch to Binky agent |
| `/cheryl` | Switch to Cheryl agent |
| `/agent [name]` | Switch to any named agent |

**Response:** Always `{ "ok": true }`.

## Save Chat ID

```
POST /v1/telegram/save-chat
```

Links a Telegram chat ID to the current tenant.

**Auth:** JWT + `x-tenant-id` header.

**Request Body:**

```json
{ "chatId": "123456789" }
```

## Get Default Chat

```
GET /v1/telegram/default-chat
```

Returns the saved Telegram chat ID for the tenant.

**Auth:** JWT + `x-tenant-id` header.

**Response:**

```json
{ "ok": true, "chatId": "123456789" }
```

## Set Webhook URL

```
POST /v1/telegram/set_webhook
```

Registers the Atlas webhook URL with Telegram.

**Request Body:**

```json
{ "url": "https://atlas-ux.onrender.com/v1/telegram/webhook" }
```

## Delete Webhook

```
DELETE /v1/telegram/webhook
```

Removes the webhook (switches back to polling mode).

## Webhook Info

```
GET /v1/telegram/webhook-info
```

Returns current webhook configuration from Telegram.

## Get Updates (Polling)

```
GET /v1/telegram/updates
```

Polls for recent incoming messages (auth required). Used when webhook is not configured.

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/telegram/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"123456789","text":"Hello!"}'
```
