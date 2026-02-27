# Multi-Tenancy for Users

## What is Multi-Tenancy?

Multi-tenancy is the architectural principle that allows Atlas UX to serve multiple organizations (tenants) from a single deployment while keeping each organization's data completely isolated. Think of it like an apartment building — everyone shares the same infrastructure, but each unit is private and self-contained.

In Atlas UX, every piece of data belongs to exactly one tenant. There is no shared data space, no cross-tenant visibility, and no way for one organization's agents to access another organization's information.

## How Tenant Isolation Works

### Database Level

Every table in the Atlas UX database includes a `tenant_id` foreign key. This means:
- Every agent action is scoped to a tenant
- Every audit log entry belongs to a tenant
- Every job, workflow, decision memo, and file is tenant-specific
- Database queries always filter by `tenant_id` — there are no cross-tenant queries in the application

### API Level

The backend enforces tenant isolation through the `tenantPlugin`:
- Every API request must include a tenant identifier (via `x-tenant-id` header or `tenantId` query parameter)
- The plugin extracts and validates the tenant ID before any route handler executes
- Routes that attempt to access data outside the requesting tenant's scope will fail

### Frontend Level

The frontend uses the `useActiveTenant()` hook to manage tenant context:
- The active tenant ID is stored in `localStorage` under `atlas_active_tenant_id`
- All API calls automatically include the tenant ID in request headers
- Switching tenants updates the context and refreshes all data views

## Data Separation

### What is Isolated

Everything. Specifically:
- **Agent configurations** — Each tenant has its own agent roster and settings
- **Audit logs** — Complete activity history, visible only to that tenant
- **Jobs and workflows** — Task queues are tenant-specific
- **Decision memos** — Approval workflows operate within tenant boundaries
- **Files and documents** — Stored in tenant-specific paths (`tenants/{tenantId}/`)
- **Integrations** — OAuth tokens, API keys, and connection settings
- **Knowledge base** — Documents and embeddings
- **Billing and subscriptions** — Payment information and plan details

### How Files are Stored

File storage uses a tenant-prefixed path structure in Supabase:
```
kb_uploads/
  tenants/
    {tenant-id-1}/
      document.pdf
      report.xlsx
    {tenant-id-2}/
      presentation.pptx
```

This physical separation ensures that even at the storage level, tenant data cannot be accidentally mixed.

## Tenant Switching

Users who belong to multiple organizations can switch between them:

1. The user selects a different organization from the tenant switcher
2. The `atlas_active_tenant_id` in localStorage is updated
3. All components re-render with data from the new tenant context
4. API calls switch to include the new tenant ID

Switching tenants is instantaneous — there is no logout/login required.

## Security Implications

### Defense in Depth

Tenant isolation is enforced at multiple layers:
- **Application layer**: The `tenantPlugin` validates every request
- **Query layer**: All database queries include `tenant_id` filters
- **Storage layer**: File paths are tenant-prefixed

### What This Prevents
- **Data leakage**: One tenant cannot see another's data
- **Cross-contamination**: An agent in Tenant A cannot affect Tenant B
- **Privilege escalation**: A user in one tenant cannot gain access to another tenant's resources
- **Audit interference**: Each tenant's audit trail is complete and independent

### JWT and Authentication

Authentication tokens (JWTs) are tenant-aware:
- Tokens include the user's tenant associations
- The `authPlugin` validates that the requesting user has access to the specified tenant
- Expired or invalid tokens are rejected before tenant resolution occurs

## For Developers

If you're building integrations or using the Atlas UX API:
- Always include `x-tenant-id` in your request headers
- Never hardcode tenant IDs — use the tenant switcher or API to resolve them
- Test with multiple tenants to ensure your integration handles isolation correctly
- Audit log entries will include your tenant ID automatically

## Common Questions

**Can I share data between tenants?**
No. Tenant isolation is absolute by design. If you need to share information between organizations, export from one and import to the other.

**What happens if I forget the tenant ID header?**
The API will reject the request. The `tenantPlugin` requires a valid tenant ID on every mutation and most read operations.

**Can agents from different tenants communicate?**
No. Agents are scoped to their tenant. An agent in Tenant A has no knowledge of or access to Tenant B.

**Is there a "super admin" that can see all tenants?**
Platform-level administration exists for operational purposes, but it is separate from the tenant-scoped application and not accessible through the standard API.

## Key Takeaways

1. Every piece of data in Atlas UX belongs to exactly one tenant.
2. Isolation is enforced at the database, API, and storage layers.
3. Users can belong to multiple tenants and switch between them seamlessly.
4. There is no cross-tenant data access — by design, not by policy.
5. The architecture ensures that even bugs or misconfigurations cannot leak data across tenants.
