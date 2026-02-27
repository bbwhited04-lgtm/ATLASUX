# Atlas UX API -- CRM

Customer Relationship Management endpoints for managing contacts, companies, segments, and contact activities.

## Contacts

### List Contacts

```
GET /v1/crm/contacts?q=search&limit=200&offset=0
```

**Auth:** JWT + `x-tenant-id` header.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | -- | Search across firstName, lastName, email, company, phone |
| `limit` | number | 200 | Max results (capped at 500) |
| `offset` | number | 0 | Pagination offset |

**Response:**

```json
{ "ok": true, "contacts": [...], "total": 150 }
```

### Create Contact

```
POST /v1/crm/contacts
```

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "+1-555-0100",
  "company": "Acme Corp",
  "source": "manual",
  "notes": "Met at conference",
  "tags": ["vip", "enterprise"]
}
```

**Response:** `201` with `{ "ok": true, "contact": {...} }`.

### Update Contact

```
PATCH /v1/crm/contacts/:id
```

Partial update -- only include fields you want to change.

### Delete Contact

```
DELETE /v1/crm/contacts/:id
```

### Bulk Delete Contacts

```
DELETE /v1/crm/contacts
```

**Request Body:**

```json
{ "ids": ["uuid1", "uuid2", "uuid3"] }
```

**Response:** `{ "ok": true, "deleted": 3 }`

### Find Duplicates

```
GET /v1/crm/contacts/duplicates
```

Finds contacts sharing the same email or phone number.

**Response:**

```json
{ "ok": true, "groups": [{ "field": "email", "value": "dupe@example.com", "contacts": [...] }] }
```

### Merge Contacts

```
POST /v1/crm/contacts/merge
```

Merges duplicate contacts, keeping one and deleting the rest. Tags are unioned.

**Request Body:**

```json
{ "keepId": "uuid-to-keep", "mergeIds": ["uuid-to-remove-1", "uuid-to-remove-2"] }
```

### CSV Import

```
POST /v1/crm/contacts/import-csv
```

Bulk import up to 5,000 contacts. Auto-derives companies from contact data. Body limit: 20 MB.

**Request Body:**

```json
{
  "source": "csv",
  "rows": [
    { "firstName": "Jane", "lastName": "Doe", "email": "jane@example.com", "company": "Acme" }
  ]
}
```

**Response:** `{ "ok": true, "created": 45, "skipped": 2, "companiesCreated": 8, "errors": [] }`

## Companies

### List Companies

```
GET /v1/crm/companies?q=search
```

### Create Company

```
POST /v1/crm/companies
```

**Request Body:** `{ "name": "Acme Corp", "domain": "acme.com", "industry": "SaaS", "notes": "..." }`

### Delete Company

```
DELETE /v1/crm/companies/:id
```

## Contact Activities

### List Activities

```
GET /v1/crm/contacts/:id/activities
```

Returns up to 100 activities for a contact, newest first.

### Create Activity

```
POST /v1/crm/contacts/:id/activities
```

**Request Body:**

```json
{ "type": "call", "subject": "Follow-up call", "body": "Discussed pricing", "occurredAt": "2026-02-26T14:00:00Z" }
```

**Activity Types:** `email`, `call`, `note`, `meeting`, `mention`, `sms`

### Delete Activity

```
DELETE /v1/crm/activities/:activityId
```

## Segments

### List Segments

```
GET /v1/crm/segments
```

### Create Segment

```
POST /v1/crm/segments
```

**Request Body:** `{ "name": "Enterprise Leads", "description": "...", "filters": { "tags": ["enterprise"], "source": "linkedin" } }`

### Update Segment

```
PATCH /v1/crm/segments/:id
```

### Delete Segment

```
DELETE /v1/crm/segments/:id
```

### Get Segment Contacts

```
GET /v1/crm/segments/:id/contacts
```

Returns contacts matching the segment's filter criteria.

**Example:**

```bash
curl -s https://atlas-ux.onrender.com/v1/crm/contacts?q=jane \
  -H "Authorization: Bearer $TOKEN" \
  -H "x-tenant-id: $TENANT_ID"
```
