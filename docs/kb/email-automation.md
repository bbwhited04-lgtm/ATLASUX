# Email Automation

## Overview

Atlas UX provides end-to-end email automation through a dedicated email sender worker, Microsoft Graph API integration, and agent-driven content creation. Emails are queued as jobs, processed by the worker, and logged to the audit trail for full traceability.

## Architecture

### Email Sender Worker
The email sender is a separate Node.js process (`backend/src/workers/emailSender.ts`) that runs independently from the main API server. It:

1. Polls the `jobs` table for `EMAIL_SEND` job types
2. Picks up queued email jobs in priority order
3. Sends via the configured provider (Microsoft Graph or Resend)
4. Updates job status to completed or failed
5. Logs the outcome to the audit trail

### Microsoft Graph Integration
The primary email provider uses Microsoft 365 client credentials flow:

- **Authentication**: MS_TENANT_ID + MS_CLIENT_ID + MS_CLIENT_SECRET
- **Token Flow**: Client credentials grant -> access token
- **Send Endpoint**: `POST /v1.0/users/{MS_SENDER_UPN}/sendMail`
- **Sender Address**: Configured via `MS_SENDER_UPN` environment variable

### Resend (Fallback Provider)
An alternative provider path exists via the Resend API for environments where Microsoft 365 is not available. Requires a valid `RESEND_API_KEY`.

## How Email Automation Works

### 1. Job Creation
Email jobs are created through several paths:

- **Agent Activity**: Agents draft emails as part of workflows (daily briefs, reports, notifications)
- **Workflow Triggers**: Scheduled workflows (e.g., WF-010 Daily Exec Brief) generate email jobs
- **Manual Requests**: Users can trigger email sends through the Chat Interface or Job Runner
- **Support Workflows**: Cheryl's support intake (WF-001) generates response emails

### 2. Job Queue Processing
```
Job Status Flow:
queued -> running -> completed
                  -> failed (with error logged)
```

The worker processes one email at a time to respect rate limits and ensure reliable delivery. Failed jobs include error details in the job record for debugging.

### 3. Agent Email Accounts
Each named agent has a dedicated email address. Workflow completion reports follow chain-of-command:

- Reports go to Atlas (CEO) as the primary recipient
- CC goes to the agent's direct leader per the org hierarchy
- Agents never email themselves their own reports

### 4. Audit Logging
Every email send is logged with:
- Sender (agent or system)
- Recipient(s)
- Subject line
- Timestamp
- Job ID reference
- Success/failure status
- Tenant ID for multi-tenant isolation

## Email Workflow Examples

### Daily Executive Brief (WF-010)
Fires at 08:30 UTC daily:
1. Aggregates intelligence from all morning sweep workflows
2. Compiles financial summary, pending decisions, and priority items
3. Drafts the brief as a structured email
4. Queues for delivery to the organization owner
5. CC to Binky (CRO) for awareness

### Support Response (WF-001)
Triggered by incoming support requests:
1. Cheryl triages the support ticket
2. Drafts a response based on knowledge base articles and context
3. Response enters approval queue if risk level warrants review
4. Approved response is queued as an EMAIL_SEND job
5. Worker sends via Microsoft Graph

### Workflow Completion Notifications
When any workflow completes:
1. The executing agent drafts a summary report
2. Report is emailed to Atlas with CC to the agent's direct leader
3. Includes: workflow ID, execution time, outcomes, any follow-up items

### Blog Publish Confirmation (WF-108)
When Reynolds publishes a blog post:
1. Blog content and featured image URL are included in the notification
2. Email is sent to Atlas with the published URL
3. Social publishers receive distribution assignments

## Configuring Email Automation

### Environment Variables
```
OUTBOUND_EMAIL_PROVIDER=microsoft    # or "resend"
MS_TENANT_ID=<your-azure-tenant-id>
MS_CLIENT_ID=<your-azure-app-id>
MS_CLIENT_SECRET=<your-client-secret>
MS_SENDER_UPN=atlas@yourdomain.com
RESEND_API_KEY=<your-resend-key>     # if using Resend
```

### Render Deployment
The email worker runs as a separate Render service to ensure continuous job processing:
- Service type: Worker
- Start command: `npm run worker:email`
- Environment: Same variables as the main API service

### Testing Email Delivery
1. Open the Job Runner at `/app/jobs`
2. Create a manual EMAIL_SEND job with test recipient and content
3. Monitor job status for completion
4. Check the recipient's inbox for delivery
5. Review audit log for the send record

## Email Templates

Atlas UX agents use structured email formats:

### Business Communication
- Professional greeting with recipient name
- Clear subject line reflecting the content
- Structured body with sections for context, details, and action items
- Signature block with agent name and role

### Report Emails
- Header with report title and date
- Executive summary (2-3 sentences)
- Data tables or bullet-point findings
- Recommendations section
- Links to relevant dashboard views

### Support Responses
- Empathetic opening acknowledging the issue
- Solution or next steps clearly outlined
- Links to relevant help articles
- Escalation path if the issue is not resolved

## Troubleshooting

### Emails Not Sending
- Verify the email worker service is running on Render
- Check the `jobs` table for EMAIL_SEND jobs stuck in "queued" status
- Validate Microsoft Graph credentials (token expiry, permissions)
- Review worker logs for authentication errors

### Delivery Failures
- Check recipient email address validity
- Review Microsoft Graph API error responses in job metadata
- Verify sender UPN has send permissions in Azure AD
- Check for rate limiting (Microsoft Graph has per-user send limits)

### Missing Audit Records
- Confirm the email worker has database connectivity
- Check that the `auditLog.create` call is not failing silently
- Verify tenant ID is being passed correctly in the job payload

## Security

- Email credentials are stored as environment variables, never in code
- Microsoft Graph uses client credentials flow (no user interaction required)
- All email content is logged to the audit trail for compliance review
- Tenant isolation ensures emails are scoped to the correct organization
- SGL evaluates email content before sending (deceptive claims are blocked)
