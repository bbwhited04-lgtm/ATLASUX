# Business Manager

The Business Manager is the central hub for managing your organizations, digital assets, integrations, budgets, and agent decisions. It is the most feature-rich area of Atlas UX.

## Accessing the Business Manager

Navigate to **Business Manager** from the main sidebar, or use the route: `#/app/business`.

## Creating a Business Entity

1. Click **+ New Business** on the Business Manager page.
2. Enter your business name. A URL-safe slug is generated automatically.
3. The system creates a tenant record and sets up the default integrations.

Each business entity maps to a tenant in the multi-tenant architecture. All data -- assets, agents, decisions, files -- is scoped to this tenant.

## Managing Digital Assets

Assets represent the digital properties your business owns: websites, domains, social accounts, SaaS subscriptions, and more.

### Adding an Asset

1. Select your business from the list.
2. Navigate to the **Assets** tab.
3. Click **+ Add Asset** and fill in the details:

| Field      | Description                                           |
|------------|-------------------------------------------------------|
| Type       | `website`, `domain`, `social`, `saas`, `email`, etc.  |
| Name       | Human-readable name                                   |
| URL        | Primary URL or identifier                             |
| Platform   | Platform name (e.g., WordPress, Shopify)              |
| Cost       | Monthly cost, vendor, cadence, and category           |

### Cost Tracking

Each asset can have cost information attached. The system tracks:

- **Monthly cost** in cents (e.g., 2999 = $29.99)
- **Vendor** name
- **Cadence** (monthly, annual, one-time)
- **Category** (hosting, saas, social, etc.)

Cost changes are automatically logged to the financial ledger.

## Quick Navigation

When viewing a business entity, two quick-nav buttons appear:

- **Decisions** -- Jump directly to the Decision Memos for this tenant to review pending agent proposals.
- **Watch Live** -- Open the Agent Watcher to see real-time agent activity for this business.

## Integration Status

The Business Manager shows the connection status of all supported integrations:

- **OAuth providers**: Google, Microsoft, Meta, X, Reddit, Pinterest, LinkedIn, Tumblr
- **API key providers**: OpenAI, DeepSeek, Stripe, Twilio
- **Internal**: Supabase

Each provider card shows:
- Connection status (connected/disconnected)
- Last sync timestamp
- Available scopes

Click **Connect** on any provider to start the OAuth flow.

## Budget Overview

The Accounting summary panel shows:

- Total monthly operating costs across all assets
- Cost breakdown by category
- Ledger entry history

## Tenant Context

The Business Manager sends the `x-tenant-id` header on all API requests. When you switch between business entities, the active tenant ID updates in `localStorage` under `atlas_active_tenant_id`.

```typescript
import { useActiveTenant } from "@/lib/activeTenant";
const { tenantId, setTenantId } = useActiveTenant();
```

## Related Sections

- [Blog Manager](./blog-manager.md) -- Write and publish blog posts
- [Decisions](./decisions.md) -- Review agent approval requests
- [Agent Watcher](./agent-watcher.md) -- Monitor live agent activity
- [File Storage](./file-storage.md) -- Manage uploaded documents
