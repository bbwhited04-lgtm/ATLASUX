# Mobile App

The Atlas UX Mobile Companion is an upcoming Expo React Native app that will let you monitor and manage your AI workforce from your phone. The backend pairing infrastructure is already built and ready.

## Pairing Your Device

The mobile app connects to your Atlas UX account using a QR code pairing flow.

### Step-by-Step

1. Open the **Settings** page in the Atlas UX web app.
2. Click **Pair Mobile Device**.
3. A QR code appears on screen with a pairing code (format: `AX-XXXX-XXXX`).
4. Open the Atlas UX mobile app and scan the QR code.
5. The web app detects the confirmation and shows a success message.

The pairing code is valid for **10 minutes**. If it expires, generate a new one.

### How It Works

- The web app calls `POST /v1/mobile/pair/start` to generate a code.
- The QR code is rendered using the `qrcode.react` library (QRCodeSVG component).
- The web app polls `GET /v1/mobile/pair/status/:code` every few seconds.
- When the mobile app scans and confirms, the status changes from `pending` to `confirmed`.
- Device info (name and OS) is displayed in the web app after confirmation.

## Available Tabs (Planned)

The mobile app will include the following tabs:

| Tab       | Description                                        |
|-----------|----------------------------------------------------|
| Dashboard | Overview of agent activity, pending approvals, KPIs |
| Chat      | Talk to any AI agent on the go                     |
| Agents    | View agent status and recent actions               |
| Jobs      | Monitor running and queued jobs                    |
| Settings  | Manage account, notifications, disconnect device   |

## Push Notifications

When available, the mobile app will support push notifications for:

- Decision memos requiring approval
- Agent task completions
- Error alerts from the engine
- Daily summary digests

## Current Status

The mobile pairing backend is fully implemented:

- In-memory pairing store with 10-minute TTL
- Four endpoints: start, status, confirm, delete
- Audit logging for all pairing events
- QR code rendering on the frontend

The native mobile app is pending Apple developer account approval. When approved, the Expo React Native app will be built and deployed to both iOS and Android.

## Unparing

To disconnect your mobile device:

1. Go to **Settings** in the web app.
2. Click **Unpair Device**.
3. This calls `DELETE /v1/mobile/pair/:code` to remove the pairing.

## Limitations

- Pairing state is stored in-memory, so it is lost on server restart.
- Only one device can be paired per tenant at a time (generating a new code evicts the old one).
- No native app binary is available yet -- the backend is ready and waiting for app store approval.
