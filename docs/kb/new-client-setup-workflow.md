# New Client Setup Workflow

## Overview

The New Client Setup Workflow provisions a fully operational Atlas UX environment for a new customer in approximately 15 minutes. The process spans tenant creation, user provisioning, agent assignment, integration connections, and welcome sequence activation. Every step is automated with appropriate checkpoints and audit logging.

## End-to-End Timeline

```
[0:00]  Tenant Creation
[0:30]  Admin User Provisioning
[1:00]  Agent Assignment (tier-based)
[2:00]  Integration Connection Wizard
[8:00]  First-Run Checklist
[12:00] Welcome Workflow Trigger
[15:00] Fully Operational
```

Total elapsed time: approximately 15 minutes (automated steps + user interaction with connection wizard).

## Step 1: Tenant Creation (~30 seconds, automated)

When a new customer completes registration, a tenant record is created with a unique `tenant_id` (UUID). Default configuration includes timezone (detected or UTC), currency (USD), daily action cap (`MAX_ACTIONS_PER_DAY`), auto-spend limit (`AUTO_SPEND_LIMIT_USD`), and engine enabled. Supabase storage paths are created at `tenants/{tenantId}/` and default KB documents are seeded.

## Step 2: Admin User Provisioning (~30 seconds, automated)

The first user is provisioned as admin with a JWT token. The session initializes with the `tenant_id` in `localStorage` as `atlas_active_tenant_id`, and the frontend loads via the `useActiveTenant()` hook. The admin has full permissions: manage agents/workflows, approve decision memos, configure integrations, view audit logs, and manage billing.

## Step 3: Agent Assignment

**Duration**: ~1 minute
**System Action**: Automated based on subscription tier

Agents are assigned to the tenant based on their subscription tier:

### Starter Tier
Core team only:
- Atlas (CEO) — Strategic oversight and daily briefing
- Sunday (Writer) — Content creation
- Cheryl (Support) — Customer support monitoring
- Petra (PM) — Project coordination

### Professional Tier
Core team plus specialists:
- All Starter agents
- Binky (CRO) — Growth and revenue
- Tina (CFO) — Financial oversight
- Larry (Auditor) — Compliance monitoring
- Archy (Research) — Deep research
- Reynolds (Blog/SEO) — Blog and search optimization
- 3 social publishers (customer's choice)

### Enterprise Tier
Full agent roster:
- All Professional agents
- Mercer (Acquisition) — Deal pipeline
- Venny (Image Production) — Visual content
- Victor (Video Production) — Video content
- All 10 social publisher agents
- Daily-Intel — Intelligence aggregation
- Sandy (Bookings) — Scheduling automation
- Frank (Forms) — Form management
- Claire (Calendar) — Calendar management

Each assigned agent has its configuration record created with the tenant's `tenant_id`, enabling multi-tenant isolation.

## Step 4: Integration Connection Wizard

**Duration**: ~5 minutes (user-driven)
**System Action**: Guided interactive wizard

The connection wizard walks the customer through linking their external accounts:

**Priority** (recommended first): 1) Email Account (Microsoft 365 or Google Workspace), 2) Social Media Accounts (OAuth per platform), 3) Calendar (Google Calendar or Outlook).

**Secondary** (add later): CRM (Salesforce, HubSpot), Communication (Telegram, Slack, Teams), Storage (Google Drive, OneDrive, SharePoint), Analytics (Google Analytics, social analytics).

Each integration is stored in the `integrations` table with `tenantId`, `provider` (TEXT type), `config` (encrypted tokens/settings), and `status` (`active`, `pending`, or `error`).

## Step 5: First-Run Checklist

**Duration**: ~3 minutes (user-driven)
**System Action**: Interactive checklist in dashboard

The first-run checklist appears on the dashboard until all items are completed:

- [ ] **Connect your email** — Link a business email account for agent communication
- [ ] **Import contacts** — Upload a CSV or connect CRM to populate the contact database
- [ ] **Set budget limits** — Configure daily and monthly spending caps for agent operations
- [ ] **Configure social accounts** — Connect at least one social media platform
- [ ] **Review your agents** — Visit the Agent Hub to meet your AI team
- [ ] **Set your timezone** — Ensure scheduling works correctly for your location

Each checklist item links directly to the relevant settings page or wizard step. Completion is tracked in the tenant configuration and reported in onboarding metrics.

## Step 6: Welcome Workflow Trigger

**Duration**: ~2 minutes
**System Action**: Automated

Once the first-run checklist reaches at least 3 of 6 items completed (or after 15 minutes, whichever comes first):

1. The onboarding email sequence is activated (see Customer Onboarding Automation doc)
2. Day 1 welcome email is queued as an `EMAIL_SEND` job
3. CRM tags `new_customer` and `onboarding` are applied
4. Atlas generates a personalized welcome message based on the tenant's industry and tier
5. The daily morning brief pipeline (WF-010, WF-093-106) is activated for the tenant

## Step 7: Fully Operational

At this point, the tenant environment is complete:

- All assigned agents are active and responding to the engine loop
- Workflows are scheduled according to the tenant's tier
- Integrations are connected and authenticated
- The onboarding email sequence is running
- Daily intelligence gathering will begin at the next 05:00 UTC cycle
- Cheryl is actively monitoring for support needs

## Post-Setup Verification

Petra (PM) performs an automated verification 30 minutes after setup:

1. Confirm all assigned agents have initialized successfully
2. Verify integration connections are healthy (no expired tokens)
3. Check that the welcome email was delivered
4. Ensure the tenant's first scheduled workflows are queued
5. Flag any issues to Cheryl for proactive outreach

## Audit Trail

The entire setup process is logged with actions: `setup.tenant_created`, `setup.admin_provisioned`, `setup.agents_assigned`, `setup.integration_connected`, `setup.checklist_item_completed`, `setup.welcome_triggered`, and `setup.verified_operational`. Each entry includes `tenantId`, timestamp, and relevant metadata for full traceability.

## Failure Recovery

If any step fails during setup:
- The system retries the failed step up to 3 times
- If retries fail, Cheryl is notified to assist manually
- The customer sees a clear error message with a "Contact Support" option
- Partial setup state is preserved so the customer can resume without starting over
- All failures are logged with full error details for debugging
