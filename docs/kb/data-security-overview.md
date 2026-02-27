# Data Security Overview

## Overview

Atlas UX is built with security as a foundational requirement, not an afterthought. The platform implements multi-tenancy isolation, comprehensive audit logging, encrypted communications, and non-overridable governance through the Statutory Guardrail Layer (SGL). This document covers the security architecture, compliance measures, and data protection practices.

## Multi-Tenancy Security

### Tenant Isolation
Every database table includes a `tenant_id` foreign key. This ensures:

- Data from one organization is never visible to another
- API requests are scoped to the authenticated tenant
- Agent actions are confined to their tenant boundary
- File storage is organized by tenant path (`tenants/{tenantId}/`)

### Tenant Resolution
The backend's `tenantPlugin` extracts the tenant context from:
- `x-tenant-id` request header (primary method)
- `tenantId` query parameter (fallback for specific endpoints)

Every API route validates tenant context before processing. Requests without valid tenant identification are rejected.

### Cross-Tenant Prevention
Per the multi-agent ethics policy:
- No subagent may cross tenant boundaries
- Agent actions are scoped to their assigned tenant
- Data queries include tenant_id in WHERE clauses
- File access is restricted to the tenant's storage path

## Authentication and Authorization

### JWT Authentication
- The backend uses JWT-based authentication via `authPlugin.ts`
- Tokens are sent in the Authorization header from the frontend
- Token expiration and refresh are handled automatically
- Invalid or expired tokens result in 401 responses

### API Access
- All API endpoints require authentication (except public routes)
- Rate limiting is enforced per endpoint to prevent abuse
- API keys are scoped to specific tenants and permission levels

### Agent Authorization
- Each agent has defined tool access based on their role
- Tool permissions are specified in agent POLICY.md files
- Agents cannot access tools outside their authorized scope
- Atlas (CEO) is the only agent with execution authority

## Audit Trail

### Comprehensive Logging
Every mutation in the system is logged to the `audit_log` table:

```
{
  tenantId:       // Organization scope
  actorType:      // "user", "agent", "system"
  actorUserId:    // User who initiated the action
  actorExternalId: // External reference if applicable
  level:          // "info", "warn", "error", "critical"
  action:         // What was done
  entityType:     // What type of entity was affected
  entityId:       // Which entity was affected
  message:        // Human-readable description
  meta:           // Additional context (JSON)
  timestamp:      // When it happened
}
```

### Audit Requirements
- Audit logging is mandatory for Alpha compliance
- All agent actions are logged regardless of outcome
- Failed actions are logged with error details
- Audit records are immutable once created

### Monitoring
- **Agent Watcher** (`/app/watcher`): Real-time activity feed polling every 4 seconds
- **Business Manager > Audit Log**: Complete history with filtering by level, agent, and entity type
- **Security & Compliance tab**: Compliance status panel and security overview

## Statutory Guardrail Layer (SGL)

### Non-Overridable Boundaries
SGL defines execution boundaries that cannot be bypassed by any agent, tenant, administrator, or founder:

**Permanently Blocked Actions**:
- Statutory violations (federal, state, international law)
- PHI/HIPAA unsafe handling
- Copyright infringement
- Trademark infringement
- Fraudulent or deceptive claims
- Regulated financial execution without human authorization
- Government filings without signature
- Unauthorized bank transfers
- Attempts to modify SGL logic itself

### Decision Outputs
- **ALLOW**: Action proceeds with standard logging
- **REVIEW**: Action requires human review, legal packet, and chairman approval
- **BLOCK**: Action is prohibited and cannot be executed

### Tamper Protection
Attempts to alter or bypass SGL:
- Are logged to the audit trail
- Trigger a restricted execution state
- Require a compliance review before normal operations resume
- SGL logic changes require code update, version increment, audit record, and board acknowledgment

## Execution Constitution

### Single Executor Rule
Atlas is the sole execution layer. All other agents are advisory subroutines. This means:
- Only Atlas can call external APIs
- Only Atlas can move funds
- Only Atlas can provision accounts
- Only Atlas can publish content
- Only Atlas can send outbound communications

### Pre-Execution Requirements
Before any external action:
1. Intent must be validated
2. SGL must return ALLOW
3. Human approval must be present if flagged

### Human Authorization
Regulated actions require:
- Explicit approval from the authorized human
- Payload hash for integrity verification
- Timestamp for audit trail
- Identity of the approver

### State Transitions
All state changes emit an audit event through defined states:
```
DRAFT -> VALIDATING -> [BLOCKED_SGL | REVIEW_REQUIRED | AWAITING_HUMAN | APPROVED] -> EXECUTING -> [EXECUTED | FAILED]
```

## Data Encryption

### In Transit
- All API communications use HTTPS/TLS
- Database connections use SSL
- Webhook endpoints validate signatures (e.g., Stripe HMAC verification)

### At Rest
- Database hosted on Supabase with encryption at rest
- File storage in Supabase buckets with tenant-level access controls
- Environment variables stored securely (never committed to code)

## Safety Constraints

### Hard Limits
- **Recurring Purchase Block**: Recurring purchases blocked by default
- **Daily Action Cap**: `MAX_ACTIONS_PER_DAY` enforced across all agents
- **Daily Posting Cap**: Limits on social media publishing frequency
- **Auto-Spend Limit**: `AUTO_SPEND_LIMIT_USD` triggers approval workflow
- **Risk Tier Escalation**: Risk tier 2+ requires decision memos

### Content Safety
- No fabricated trends or distorted data
- No engagement manipulation or deceptive claims
- No impersonation of authority
- All published content passes SGL evaluation

## GDPR Compliance Considerations

### Data Subject Rights
- **Right of Access**: Export functionality for individual data
- **Right to Erasure**: Deletion workflows for contact and activity data
- **Right to Portability**: Data export in standard formats
- **Right to Rectification**: Edit and update capabilities for all stored data

### Data Minimization
- Collect only data necessary for business operations
- Review data retention policies periodically
- Purge unnecessary data according to retention schedules

### Consent Management
- Track consent status for marketing communications
- Respect opt-out preferences across all channels
- Log consent changes in the audit trail

## File Storage Security

### Supabase Storage
- Bucket: `kb_uploads`
- Tenant paths: `tenants/{tenantId}/`
- Per-tenant upload quotas: 500 files, 500 MB default (configurable)
- Signed URLs for download access (time-limited)
- Delete operations logged to audit trail

## Incident Response

### Detection
- Audit trail monitoring for anomalous patterns
- SGL tamper detection and restricted execution state
- Rate limit violation tracking
- Failed authentication attempt logging

### Response
- Automated restriction of compromised agent or endpoint
- Audit log preservation for forensic analysis
- Notification to organization owner
- Compliance review process initiation

## Security Compliance Status

The Business Manager > Security & Compliance tab shows:
- Audit trail status (active/inactive)
- Approval workflow status
- Action cap enforcement status
- Spend limit enforcement status
- Agent access control grouped by tier
- File inventory from Supabase storage
- Security overview statistics from live data
