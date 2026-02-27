# Contacts API

The Contacts API provides CRM-style contact management. Contacts are tenant-scoped and support full-text search, tagging, and activity tracking.

## Base URL

```
/v1/crm
```

---

## GET /v1/crm/contacts

List contacts for the current tenant with optional search and pagination.

**Query Parameters:**

| Param    | Type   | Default | Description                                       |
|----------|--------|---------|---------------------------------------------------|
| `q`      | string | (none)  | Search across firstName, lastName, email, company, phone |
| `limit`  | number | 200     | Max results per page (capped at 500)              |
| `offset` | number | 0       | Pagination offset                                 |

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     "https://api.atlasux.cloud/v1/crm/contacts?q=acme&limit=50"
```

**Response (200):**

```json
{
  "ok": true,
  "contacts": [
    {
      "id": "contact_abc123",
      "tenantId": "9a8a332c-...",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane@acme.com",
      "phone": "+1-555-0123",
      "company": "Acme Corp",
      "source": "manual",
      "notes": "Met at conference",
      "tags": ["prospect", "enterprise"],
      "createdAt": "2026-02-20T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

## POST /v1/crm/contacts

Create a new contact.

**Request Body:**

| Field       | Type     | Required | Description                           |
|-------------|----------|----------|---------------------------------------|
| `firstName` | string   | No       | First name                            |
| `lastName`  | string   | No       | Last name                             |
| `email`     | string   | No       | Email address                         |
| `phone`     | string   | No       | Phone number                          |
| `company`   | string   | No       | Company/organization name             |
| `source`    | string   | No       | How the contact was acquired (default: `manual`) |
| `notes`     | string   | No       | Free-text notes                       |
| `tags`      | string[] | No       | Array of tag strings                  |

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "firstName": "Jane",
       "lastName": "Doe",
       "email": "jane@acme.com",
       "company": "Acme Corp",
       "source": "website",
       "tags": ["prospect"]
     }' \
     https://api.atlasux.cloud/v1/crm/contacts
```

**Response (201):**

```json
{
  "ok": true,
  "contact": {
    "id": "contact_abc123",
    "tenantId": "9a8a332c-...",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@acme.com",
    "company": "Acme Corp",
    "source": "website",
    "tags": ["prospect"],
    "createdAt": "2026-02-26T12:00:00.000Z"
  }
}
```

---

## PATCH /v1/crm/contacts/:id

Update an existing contact. Only include fields you want to change.

**Request:**

```bash
curl -X PATCH \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     -H "Content-Type: application/json" \
     -d '{"company": "Acme Inc", "tags": ["prospect", "qualified"]}' \
     https://api.atlasux.cloud/v1/crm/contacts/contact_abc123
```

---

## DELETE /v1/crm/contacts/:id

Delete a contact.

**Request:**

```bash
curl -X DELETE \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/crm/contacts/contact_abc123
```

---

## Activity Tracking

### POST /v1/crm/contacts/:id/activities

Log an activity against a contact.

**Request Body:**

| Field  | Type   | Required | Description                                    |
|--------|--------|----------|------------------------------------------------|
| `type` | enum   | Yes      | `email`, `call`, `note`, `meeting`, `mention`, `sms` |
| `note` | string | No       | Activity details                               |

### GET /v1/crm/contacts/:id/activities

List activities for a specific contact, ordered by most recent first.

---

## Deals

### GET /v1/crm/deals

List deals for the current tenant.

### POST /v1/crm/deals

Create a new deal linked to a contact.

| Field       | Type   | Required | Description           |
|-------------|--------|----------|-----------------------|
| `contactId` | string | Yes      | Associated contact ID |
| `title`     | string | Yes      | Deal title            |
| `valueCents`| number | No       | Deal value in cents   |
| `stage`     | string | No       | Pipeline stage        |
| `notes`     | string | No       | Deal notes            |

---

## Audit Trail

Contact creation is logged with action `CRM_CONTACT_CREATED` including the source field. All CRM mutations generate corresponding audit log entries.

---

## Search Tips

The `q` parameter searches case-insensitively across multiple fields simultaneously. For example, searching `q=acme` will match contacts where any of firstName, lastName, email, company, or phone contains "acme".
