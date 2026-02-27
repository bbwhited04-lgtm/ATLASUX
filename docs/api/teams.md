# Atlas UX API -- Microsoft Teams

Integration with Microsoft Teams via the Graph API. Read operations use client-credentials (app-only) authentication. Send operations use Graph API with `Group.ReadWrite.All` permission.

**Required Environment Variables:** `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`

**Required Azure AD Permissions:** `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Read.All`, `Group.ReadWrite.All` (for sending)

## Connection Status

```
GET /v1/teams/status
```

Checks whether MS credentials are configured and valid.

**Response:**

```json
{ "ok": true, "connected": true }
```

## List Teams

```
GET /v1/teams/teams
```

Lists all Teams in the Microsoft 365 tenant (up to 50).

**Response:**

```json
{
  "ok": true,
  "teams": [
    { "id": "team-uuid", "displayName": "Engineering", "description": "Dev team" }
  ]
}
```

## List Channels

```
GET /v1/teams/:teamId/channels
```

Lists channels for a specific team.

**Response:**

```json
{
  "ok": true,
  "teamId": "team-uuid",
  "channels": [
    { "id": "channel-id", "displayName": "General", "description": null, "membershipType": "standard" }
  ]
}
```

## List Messages

```
GET /v1/teams/:teamId/channels/:channelId/messages?limit=20
```

Returns recent messages from a channel (max 50).

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 20 | Max messages (capped at 50) |

**Response:**

```json
{
  "ok": true,
  "teamId": "...",
  "channelId": "...",
  "messages": [
    { "id": "msg-id", "body": "Hello team", "contentType": "text", "from": "Atlas", "createdAt": "...", "importance": "normal" }
  ]
}
```

## Send Message

```
POST /v1/teams/send
```

Sends a message to a Teams channel via the Graph API.

**Request Body:**

```json
{
  "teamId": "team-uuid",
  "channelId": "channel-id",
  "text": "Hello from Atlas!",
  "fromAgent": "atlas",
  "title": "Optional Title"
}
```

**Response:**

```json
{ "ok": true }
```

## Cross-Agent Notification

```
POST /v1/teams/cross-agent
```

Sends a cross-agent notification to a Teams channel.

**Request Body:**

```json
{
  "teamId": "team-uuid",
  "channelId": "channel-id",
  "fromAgent": "atlas",
  "toAgent": "binky",
  "message": "Please review the Q1 report.",
  "context": "Optional context string"
}
```

**Example:**

```bash
curl -s -X POST https://atlas-ux.onrender.com/v1/teams/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"teamId":"...","channelId":"...","text":"Hello from Atlas!","fromAgent":"atlas"}'
```
