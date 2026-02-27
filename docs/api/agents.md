# Atlas UX API -- Agents

Endpoints for listing AI agents in the platform. Agents are named AI employees (Atlas, Binky, Cheryl, etc.) each with a designated role and capabilities.

## List All Agents

```
GET /v1/agents
```

Returns every agent registered in the `agents` database table, ordered by `agent_key`.

**Auth:** JWT + `x-tenant-id` header.

**Response:**

```json
{
  "ok": true,
  "agents": [
    {
      "id": "atlas",
      "name": "Atlas",
      "title": "AI President & CEO",
      "tier": "Executive",
      "summary": "Chief executive officer of the AI employee organization."
    },
    {
      "id": "binky",
      "name": "Binky",
      "title": "Chief Revenue Officer",
      "tier": "Executive",
      "summary": "Manages growth, distribution, and revenue strategy."
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique agent key (lowercase) |
| `name` | string | Display name |
| `title` | string | Staff role / job title |
| `tier` | string | Always `"Executive"` in current schema |
| `summary` | string | One-line description of the agent |

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

**Notes:**

- The agent list is sourced from the `agents` database table (not the in-memory registry).
- The response shape maintains backward compatibility with the earlier static registry format so the frontend can render `id/name/title/summary` directly.
- There is no `GET /v1/agents/:id` endpoint at this time. Use the list endpoint and filter client-side.

## Agent Roster (Reference)

| ID | Name | Role |
|----|------|------|
| atlas | Atlas | CEO / President |
| binky | Binky | CRO |
| tina | Tina | CFO |
| larry | Larry | Governor |
| jenny | Jenny | CLO |
| cheryl | Cheryl | Customer Support |
| petra | Petra | Project Manager |
| sandy | Sandy | Bookings |
| sunday | Sunday | Comms / Tech Doc Writer |
| kelly | Kelly | X Publisher |
| fran | Fran | Facebook Publisher |
| donna | Donna | Reddit |
| link | Link | LinkedIn |
| reynolds | Reynolds | Blog Publisher |
