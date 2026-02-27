# Security

Atlas UX is built with security as a core principle. This guide covers the key security features that protect your data and ensure safe AI agent operations.

## Multi-Tenancy

Every piece of data in Atlas UX is scoped to a tenant (business). This means:

- Each business has its own isolated data space.
- Jobs, agents, files, KB documents, CRM data, and audit logs are all separated by tenant.
- Every database table includes a `tenant_id` column that enforces this isolation.
- API requests include an `x-tenant-id` header to identify which tenant's data should be accessed.

You cannot accidentally access another tenant's data. The backend enforces tenant boundaries on every request.

## Authentication

Atlas UX uses JWT (JSON Web Token) based authentication:

1. When you log in, you receive a JWT token.
2. The token is sent with every API request in the Authorization header.
3. The backend validates the token on each request through the `authPlugin`.
4. Invalid or expired tokens are rejected with a 401 error.

During the private beta, the app also uses a gate code (access code) as an additional layer of access control. This is a session-level check that prevents unauthorized users from reaching the app interface.

## Audit Trail

Every action in Atlas UX is logged to an immutable audit trail. This is a hard requirement for alpha compliance.

### What Gets Logged

- All data mutations (creates, updates, deletes)
- Agent actions and decisions
- Job executions and status changes
- Approval decisions (approved or rejected)
- File uploads and deletions
- Login attempts and authentication events

### Audit Log Fields

Each audit entry contains:

| Field | Description |
|-------|------------|
| **Timestamp** | When the action occurred |
| **Tenant ID** | Which business the action belongs to |
| **Actor Type** | Who did it (user, agent, system) |
| **Actor User ID** | The user's identifier |
| **Actor External ID** | The agent's name (for agent actions) |
| **Level** | Severity (info, warn, error, debug) |
| **Action** | What was done (e.g., "job.created", "decision.approved") |
| **Entity Type** | What was affected (e.g., "job", "document", "decision_memo") |
| **Entity ID** | The ID of the affected record |
| **Message** | A human-readable description |
| **Meta** | Additional structured data about the action |

### Viewing the Audit Log

- **Settings > Audit Log** tab -- Shows the 100 most recent entries for your tenant.
- **Agent Watcher** -- Real-time streaming view of audit events.

## SGL (Statutory Guardrail Layer)

SGL is the non-overridable safety layer that governs all agent behavior. No agent, tenant, administrator, or founder can bypass SGL.

### How SGL Works

Before any agent takes an action with external side effects, SGL evaluates the intent and returns one of three decisions:

| Decision | Meaning |
|----------|---------|
| **ALLOW** | The action is safe to proceed |
| **REVIEW** | The action is ambiguous or regulated and requires human review |
| **BLOCK** | The action is prohibited and cannot proceed under any circumstances |

### Actions That Are Always Blocked

SGL permanently blocks these actions regardless of context:

- Statutory violations (federal, state, or international law)
- PHI/HIPAA unsafe handling
- Copyright or trademark infringement
- Fraudulent or deceptive claims
- Regulated financial execution without human authorization
- Government filings without signature
- Unauthorized bank transfers
- Any attempt to modify SGL logic itself

### Tamper Protection

If any agent or process attempts to alter or bypass SGL:
- The attempt is logged in the audit trail
- The system enters a restricted execution state
- A compliance review is triggered

SGL is versioned and can only be changed through a formal process: code update, version increment, audit record, and board acknowledgment.

## Safety Guardrails

Beyond SGL, Atlas UX enforces additional safety limits:

- **Daily action cap** -- Limits total agent actions per day to prevent runaway automation.
- **Daily posting cap** -- Limits social media posts to prevent spam.
- **Auto-spend limit** -- Any spend above this threshold requires human approval.
- **Recurring purchase block** -- Recurring charges are blocked by default.
- **Decision memos** -- High-risk actions require documented rationale and explicit human approval.

See [Approval Workflows](./approval-workflows.md) for details on the approval process.

## Data Retention

- Audit log entries are retained indefinitely for compliance.
- Deleted files are permanently removed from cloud storage.
- Job records are preserved in the database after completion.
- Decision memos (approved and rejected) are kept as a permanent record.

## Tips

- Review the audit log regularly to ensure agents are behaving as expected.
- Use the Agent Watcher for real-time monitoring during critical operations.
- Keep your access code confidential -- do not share it publicly.
- If you notice unexpected activity in the audit log, investigate immediately.
- SGL guardrails are your safety net -- they cannot be disabled, even by administrators.

## Related Guides

- [Approval Workflows](./approval-workflows.md) -- Human-in-the-loop approval process
- [Agent Watcher](./agent-watcher.md) -- Real-time audit log monitoring
- [Settings](./settings.md) -- Audit log and permission management
- [Agents Hub](./agents-hub.md) -- Agent authority and constraints
