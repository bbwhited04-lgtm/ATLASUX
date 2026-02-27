# CRM Best Practices

## Overview

The Atlas UX CRM module provides contact management, customer segmentation, activity tracking, and agent-assisted relationship management. Accessible at `/app/crm`, it serves as the central hub for all customer data and interactions across your organization.

## Core CRM Features

### Contact Management
- Create, edit, and organize contacts with detailed profiles
- Store contact information: name, email, phone, company, role, notes
- Tag contacts for flexible categorization
- Link contacts to specific business entities within your tenant

### Customer Segments
- Group contacts by shared characteristics (industry, size, engagement level)
- Create dynamic segments based on activity and interaction history
- Use segments to target email campaigns and social outreach
- Agents reference segments when personalizing communications

### Activity Tracking
- Log every interaction: emails, calls, meetings, support tickets
- Track engagement metrics per contact
- View activity timeline for complete interaction history
- Agents automatically log their interactions with contacts

## Setting Up Your CRM

### Step 1: Import Contacts
- Navigate to `/app/crm`
- Use the import function to upload existing contact lists (CSV format)
- Map fields to CRM columns during import
- Deduplicate entries automatically

### Step 2: Define Segments
Create segments that reflect your business categories:

| Segment | Criteria | Use Case |
|---------|----------|----------|
| Hot Leads | Recent activity + high engagement score | Priority outreach by Mercer |
| Existing Customers | Active subscription + purchase history | Retention campaigns by Fran/Penny |
| Enterprise Prospects | Company size 100+ employees | LinkedIn outreach by Link |
| Support-Active | Open tickets or recent support contact | Priority handling by Cheryl |
| Cold Leads | No activity in 60+ days | Re-engagement campaigns |

### Step 3: Configure Agent Access
Agents with CRM access can read and write contact data:
- **Mercer** (Acquisition): Manages lead generation and outreach
- **Cheryl** (Support): Accesses customer profiles during support interactions
- **Binky** (CRO): Analyzes CRM data for revenue strategy
- **Social publishers**: Reference CRM segments for targeted content

## CRM Best Practices

### Data Hygiene
- **Deduplicate regularly**: Merge duplicate contacts to maintain clean data
- **Update stale records**: Flag contacts with no activity in 90+ days for review
- **Standardize fields**: Use consistent formatting for phone numbers, addresses, and company names
- **Remove invalid entries**: Purge bounced email addresses and disconnected numbers

### Segmentation Strategy
- **Start broad, then refine**: Begin with 3-5 core segments and add specificity over time
- **Behavioral segmentation**: Group by actions (purchased, downloaded, attended webinar) not just demographics
- **Lifecycle stages**: Track contacts from prospect to lead to customer to advocate
- **Review quarterly**: Reassess segment definitions as your business evolves

### Activity Logging
- **Log everything**: Every touchpoint matters for understanding the customer journey
- **Use consistent activity types**: Define standard categories (email, call, meeting, support, purchase)
- **Include context**: Notes should explain what was discussed, not just that contact happened
- **Timestamp accuracy**: Ensure all activities are logged with correct dates and times

### Agent-Assisted CRM

Atlas UX agents enhance CRM operations:

**Research and Enrichment**
- Ask Binky to research a contact's company and add firmographic data
- Use Archy to find industry news relevant to key accounts
- Have Daily-Intel flag contacts whose companies are in the news

**Outreach Automation**
- Mercer identifies acquisition targets based on CRM segment criteria
- Social publishers create content targeted to specific segments
- Email workflows send personalized messages based on CRM data

**Support Integration**
- Cheryl references CRM profiles when handling support tickets
- Support interactions are logged as CRM activities automatically
- Escalation paths consider customer tier and history

**Analytics and Reporting**
- Tina (CFO) analyzes customer lifetime value from CRM and ledger data
- Binky generates revenue forecasts based on pipeline segments
- Atlas compiles cross-functional reports incorporating CRM metrics

## CRM Workflows

### Lead Nurture Workflow
1. New contact enters CRM (manual entry or form submission via Frank)
2. Contact is automatically assigned to a segment based on profile data
3. Mercer evaluates lead quality and assigns a score
4. High-scoring leads receive personalized outreach
5. Activity is tracked through the pipeline until conversion or disqualification

### Customer Onboarding Workflow
1. New customer record created after purchase
2. Cheryl sends a welcome email with onboarding resources
3. Claire schedules an onboarding call
4. Petra creates a project for the onboarding process
5. Follow-up activities are logged at each milestone

### Retention Workflow
1. CRM flags customers with declining engagement
2. Binky analyzes the segment for common factors
3. Targeted re-engagement content is created by the social team
4. Personalized email campaign sent via the email worker
5. Results are tracked in CRM and reported to Atlas

## Data Privacy and Compliance

### Multi-Tenancy
All CRM data is scoped to your tenant. Contacts in one organization are never visible to another.

### Audit Trail
Every CRM modification (create, update, delete) is logged to the audit trail with:
- Actor (user or agent)
- Action performed
- Entity affected
- Timestamp
- Previous and new values (for updates)

### GDPR Considerations
- Support data export for individual contacts (right of access)
- Enable contact deletion workflows (right to erasure)
- Log consent status where applicable
- Minimize data collection to what is necessary for business operations

## Troubleshooting

### Missing Contact Data
- Check that the import mapped fields correctly
- Verify the tenant context is set (contacts are tenant-scoped)
- Review the audit log for any failed create operations

### Segment Not Updating
- Confirm segment criteria match the contact data format
- Check that the CRM module has the latest data (manual refresh if needed)
- Verify agent CRM writes are being committed (check job status)

### Activity Not Logging
- Ensure the `x-tenant-id` header is present in all API calls
- Verify the agent has CRM write access for their role
- Check the audit log for activity creation errors
