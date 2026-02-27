# Mobile Pairing API

The mobile pairing API enables linking a mobile device to an Atlas UX tenant using a short-lived pairing code. The web app generates a code displayed as a QR code, and the mobile app scans it to complete pairing.

## Base URL

```
/v1/mobile
```

---

## Pairing Flow

1. Web app calls `POST /v1/mobile/pair/start` to generate a pairing code.
2. The code is displayed as a QR code (format: `AX-XXXX-XXXX`).
3. Web app polls `GET /v1/mobile/pair/status/:code` until status changes.
4. Mobile app scans the QR code and calls `POST /v1/mobile/pair/confirm/:code`.
5. Status changes from `pending` to `confirmed`.
6. Web app detects the confirmation and proceeds.

---

## POST /v1/mobile/pair/start

Generate a new pairing code for the current tenant. Replaces any existing pending code for this tenant.

**Request:**

```bash
curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/mobile/pair/start
```

**Response (200):**

```json
{
  "ok": true,
  "code": "AX-3F7A-B2C1",
  "expiresAt": "2026-02-26T12:10:00.000Z"
}
```

The code is valid for 10 minutes. After expiration, it is automatically pruned.

---

## GET /v1/mobile/pair/status/:code

Poll the status of a pairing code. The web app calls this periodically to detect when the mobile device confirms.

**Request:**

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/mobile/pair/status/AX-3F7A-B2C1
```

**Response (200) -- pending:**

```json
{ "ok": true, "status": "pending", "deviceInfo": null }
```

**Response (200) -- confirmed:**

```json
{
  "ok": true,
  "status": "confirmed",
  "deviceInfo": { "name": "iPhone 16", "os": "iOS 19" }
}
```

**Response (200) -- expired:**

```json
{ "ok": true, "status": "expired" }
```

---

## POST /v1/mobile/pair/confirm/:code

Called by the mobile app to confirm a pairing. The body can include device information for display purposes.

**Request:**

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"deviceName": "iPhone 16", "os": "iOS 19"}' \
     https://api.atlasux.cloud/v1/mobile/pair/confirm/AX-3F7A-B2C1
```

**Request Body:**

| Field        | Type   | Required | Description                         |
|--------------|--------|----------|-------------------------------------|
| `deviceName` | string | No       | Device name (default: "iPhone")     |
| `os`         | string | No       | Operating system (default: "iOS")   |

**Response (200):**

```json
{ "ok": true }
```

**Error (404):**

```json
{ "ok": false, "error": "CODE_NOT_FOUND_OR_EXPIRED" }
```

---

## DELETE /v1/mobile/pair/:code

Cancel or unpair an existing pairing code.

**Request:**

```bash
curl -X DELETE \
     -H "Authorization: Bearer $TOKEN" \
     -H "x-tenant-id: $TENANT_ID" \
     https://api.atlasux.cloud/v1/mobile/pair/AX-3F7A-B2C1
```

**Response (200):**

```json
{ "ok": true }
```

---

## Implementation Details

- Pairing codes are stored **in-memory** on the backend server (not in the database).
- Codes expire after **10 minutes** (configurable via `PAIRING_TTL_MS`).
- Each tenant can have only one pending code at a time; generating a new code evicts the old one.
- Code format: `AX-XXXX-XXXX` where `X` is a hex character (derived from 4 random bytes).
- Expired codes are pruned on every API call to the pairing endpoints.

---

## Audit Trail

Both `MOBILE_PAIR_STARTED` and `MOBILE_PAIR_CONFIRMED` events are logged to the audit trail with the pairing code, expiration time, and device info.

---

## Limitations

- In-memory store means pairing state is lost on server restart.
- No native mobile app yet -- the pairing backend is ready for when the Apple developer account is approved.
- The QR code is rendered client-side using `qrcode.react` (QRCodeSVG component).
