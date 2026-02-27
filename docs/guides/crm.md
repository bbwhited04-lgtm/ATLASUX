# CRM (Customer Relationship Management)

The CRM module helps you manage contacts, companies, and customer segments. It includes activity tracking, import tools, and search functionality.

## Opening the CRM

Click **CRM** in the sidebar or navigate to `/app/crm`.

## Tabs

The CRM has three main tabs:

| Tab | What It Contains |
|-----|-----------------|
| **Contacts** | Individual people with name, email, phone, company, and tags |
| **Companies** | Organizations with domain, industry, and notes |
| **Segments** | Groups of contacts for targeted campaigns or tracking |

## Managing Contacts

### Viewing Contacts

The Contacts tab displays a searchable list of all your contacts. Each row shows:
- Full name
- Email address
- Phone number
- Company
- Tags
- Source (how they were added)

### Searching

Use the search bar at the top to filter contacts by name, email, phone, company, or tags. Results update as you type.

### Adding a Contact

1. Click **+ Add Contact**.
2. Fill in the fields: first name, last name, email, phone, and company.
3. Click **Save**.
4. The new contact will appear in the list.

### Selecting Contacts

Use the checkboxes to select one or more contacts. You can:
- Select all visible contacts with the header checkbox.
- Perform bulk actions on selected contacts.

### Activity Timeline

1. Click on a contact name to open their detail view.
2. The activity timeline shows all logged interactions (notes, emails, calls, meetings).
3. Click **+ Add Activity** to log a new interaction:
   - Choose a type: note, email, call, or meeting
   - Enter a subject and body
   - Click **Save**

## Managing Companies

### Viewing Companies

Switch to the **Companies** tab to see a list of organizations. Each company shows:
- Name
- Domain (website)
- Industry
- Notes
- Date added

### Adding a Company

1. Click **+ Add Company**.
2. Enter the company name, domain, industry, and any notes.
3. Click **Save**.

### Searching Companies

Use the search bar to filter by company name or domain.

## Segments

Segments let you group contacts for targeted outreach or reporting.

### Creating a Segment

1. Switch to the **Segments** tab.
2. Click **+ New Segment**.
3. Enter a segment name.
4. Click **Create**.

### Viewing Segments

The segments list shows each segment with its creation date. Click on a segment to see its members.

## Importing Contacts

1. Click the **Import** button at the top of the Contacts tab.
2. Choose an import source:
   - **Google** -- Import from Google Contacts (requires Google integration)
   - **CSV** -- Upload a CSV file
   - **VCF** -- Upload a vCard file
   - **HubSpot** -- Import from HubSpot CRM
   - **Salesforce** -- Import from Salesforce
   - **Manual** -- Enter contacts one by one
3. Follow the prompts for your chosen source.

## Tips

- Tag contacts consistently to make filtering and segmentation easier.
- Use the activity timeline to keep a complete record of customer interactions.
- Import contacts from Google or a CSV file to get started quickly.
- All CRM data is scoped to your selected business (tenant).

## Related Guides

- [Messaging Hub](./messaging-hub.md) -- Send emails or messages to your contacts
- [Settings](./settings.md) -- Set up Google or CRM integrations for importing
