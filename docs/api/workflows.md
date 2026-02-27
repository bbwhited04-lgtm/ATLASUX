# Atlas UX API -- Workflows

Workflows define automated sequences of agent actions. The registry includes both database-stored workflows and canonical definitions from the code registry and n8n manifest.

## List Workflows

```
GET /v1/workflows
```

Returns all workflows, merging database rows with canonical definitions from the workflow registry (WF-001 through WF-021) and n8n manifest (WF-022 through WF-105+). Sorted by workflow key (numeric).

**Auth:** JWT + `x-tenant-id` header.

**Response:**

```json
{
  "ok": true,
  "workflows": [
    {
      "workflow_key": "WF-001",
      "agent_key": "cheryl",
      "name": "Support Intake",
      "description": "Routes inbound support emails to Cheryl for triage.",
      "status": "active",
      "version": "1"
    },
    {
      "workflow_key": "WF-010",
      "agent_key": "atlas",
      "name": "Morning Briefing",
      "description": "Atlas generates a daily briefing for the executive team.",
      "status": "active",
      "version": null
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `workflow_key` | string | Unique identifier (e.g., `WF-001`) |
| `agent_key` | string | Owner agent (e.g., `atlas`, `cheryl`) |
| `name` | string | Human-readable workflow name |
| `description` | string/null | Description of what the workflow does |
| `status` | string | `active` or other status from DB |
| `version` | string/null | Version string from DB |

**Notes:**

- Canonical workflows that are not yet in the database are included with `status: "active"` and `version: null`.
- DB rows take precedence over canonical definitions for `status` and `version`.
- The engine loop accepts both DB-stored and canonical workflow keys.

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```

## Workflow Schedule Reference

| Key | Time (UTC) | Agent | Description |
|-----|-----------|-------|-------------|
| WF-010 | 08:30 | Atlas | Morning Briefing |
| WF-031 | 06:00 | Binky | Daily Binky Brief |
| WF-033 | 05:00 | daily-intel | Daily Intel Sweep |
| WF-106 | 05:45 | Atlas | Daily Aggregation & Task Assignment |

## Workflow Categories

- **Intake** (WF-001 to WF-005): Support, Project, Calendar, Booking, Forms
- **Operations** (WF-010, WF-020, WF-021): Morning briefing, audits
- **n8n Manifest** (WF-022+): Social publishing, growth loops, intel sweeps
- **Platform Intel** (WF-093 to WF-105): Per-agent platform intelligence gathering
