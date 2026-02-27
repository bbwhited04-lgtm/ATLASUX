# Messaging Hub

The Messaging Hub brings all your communication channels into one place. It provides tabbed access to Telegram, Email, SMS, and Microsoft Teams messaging -- all integrated with your AI agents.

## Accessing the Messaging Hub

Navigate to **Messaging Hub** from the sidebar, or use the route: `#/app/messaging`.

## Tabs

### Telegram

The Telegram tab lets you connect your Atlas UX account to a Telegram bot for two-way communication with your AI agents.

**Setup:**

1. Open the Telegram tab in the Messaging Hub.
2. Find your chat ID (the bot will provide it when you message `/start`).
3. Paste the chat ID into the field and click **Save**.
4. The integration is now active.

Once connected, you can:

- Chat with Atlas (the CEO agent) by default.
- Switch agents using commands like `/binky`, `/cheryl`, or `/agent [name]`.
- Get `/help` to list all available agents.
- Use `/clear` to reset the conversation.

Messages sent through Telegram are routed through the same AI chat engine as the web interface, with full knowledge base context.

### Email

The Email tab shows the inbound email pipeline status and lets you configure SMTP settings for outbound mail.

**Inbound emails** are automatically classified and routed to the appropriate agent:

| Recipient                | Agent   | Role                |
|--------------------------|---------|---------------------|
| support@deadapp.info     | Cheryl  | Customer Support    |
| petra's email            | Petra   | Project Manager     |
| claire's email           | Claire  | Calendar Manager    |
| sandy's email            | Sandy   | Bookings            |
| frank's email            | Frank   | Forms               |

**SMTP Configuration:**

1. Click **Configure SMTP** in the Email tab.
2. Enter your SMTP server details (host, port, username, password).
3. Credentials are stored securely server-side in the token vault.

### SMS

The SMS tab is a placeholder for future Twilio integration. When configured, it will support sending and receiving SMS messages through your AI agents.

### Microsoft Teams

Teams integration is accessed via the Teams section. See the [Teams Integration guide](./teams-integration.md) for setup details.

## Agent Notifications

Agents can send you notifications across channels. When an agent action includes keywords like "telegram", "notify me", "ping me", or "alert me", the system triggers the `send_telegram_message` tool to deliver the notification to your linked Telegram chat.

## Tenant Scoping

All messaging operations are scoped to your active tenant. The `useActiveTenant()` hook provides the tenant context that the Messaging Hub uses for all API calls.

## API Endpoints Used

| Endpoint                     | Purpose                              |
|------------------------------|--------------------------------------|
| `POST /v1/telegram/send`    | Send a message via the Telegram bot  |
| `POST /v1/telegram/save-chat` | Save the default chat ID           |
| `GET /v1/telegram/default-chat` | Retrieve the saved chat ID       |
| `POST /v1/email/smtp-config`| Store SMTP credentials               |
| `POST /v1/teams/send`       | Send a Teams channel message         |

## Tips

- Keep your Telegram chat linked so agents can send you real-time notifications.
- The Telegram bot supports conversation history (last 20 messages) for context-aware replies.
- Agent email addresses are configured in the backend -- each agent has its own inbox for email routing.
