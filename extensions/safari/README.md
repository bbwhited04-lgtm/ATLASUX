# Atlas UX -- Safari Web Extension

Safari Web Extension for the Atlas UX AI Employee Productivity Platform. Provides quick access to agent chat, job management, activity monitoring, and decision approvals directly from your browser toolbar.

## Requirements

- macOS 13 (Ventura) or later
- Safari 16.4 or later
- Xcode 14 or later
- Command Line Tools for Xcode (`xcode-select --install`)

## Convert to Xcode Project

Safari Web Extensions must be wrapped in a native macOS/iOS app. Apple provides a converter tool that generates the Xcode project from the web extension directory.

```bash
xcrun safari-web-extension-converter \
  /path/to/extensions/safari \
  --project-location /path/to/output \
  --app-name "Atlas UX" \
  --bundle-identifier cloud.atlasux.safari
```

This creates an Xcode project with the native app container and embeds the web extension files.

## Build and Run

1. Open the generated `.xcodeproj` in Xcode.
2. Select your development team under **Signing & Capabilities** (or use "Sign to Run Locally" for personal testing).
3. Build and run (Cmd+R). This installs the extension locally.

## Enable in Safari

1. Open **Safari > Settings > Extensions**.
2. Check the box next to **Atlas UX** to enable it.
3. Grant the requested permissions when prompted.

### Allow Unsigned Extensions (Development Only)

If the extension does not appear in Settings:

1. In Safari, open **Safari > Settings > Advanced**.
2. Check **Show features for web developers**.
3. A **Develop** menu appears in the menu bar. Click **Develop > Allow Unsigned Extensions**.
4. Return to **Safari > Settings > Extensions** and enable Atlas UX.

You must re-enable unsigned extensions each time Safari restarts.

## Testing

1. Click the Atlas UX icon in the Safari toolbar to open the popup.
2. Enter your credentials:
   - **API URL**: `https://atlas-ux.onrender.com/v1` (default).
   - **Auth Token**: Your JWT bearer token from the Atlas UX web app.
   - **Tenant ID**: Your organization's tenant UUID.
3. Click **Connect**. A green status dot confirms the connection.
4. Verify the stats bar shows active jobs, pending decisions, and agent count.
5. Select an agent pill (Atlas, Binky, Cheryl, Sunday) and send a test message.
6. Right-click selected text on any page to see the Atlas UX context menu items.
7. Open the options page (Settings > Extensions > Atlas UX > Preferences) to configure notifications and polling.

## File Structure

```
extensions/safari/
  manifest.json       Manifest V3 configuration
  popup.html          Popup markup
  popup.css           Popup styles (dark theme, SF Pro font)
  popup.js            Popup logic (login, chat, stats, activity)
  background.js       Service worker (context menus, badge, notifications)
  content.js          Content script (page info and text extraction)
  options.html        Settings page
  options.css         Settings styles
  options.js          Settings logic
  icons/
    icon16.svg        Toolbar icon (16x16)
    icon48.svg        Extension management icon (48x48)
    icon128.svg       Standard icon (128x128)
    icon256.svg       macOS app icon (256x256)
    icon512.svg       macOS app icon (512x512)
```

## Safari-Specific Notes

- Uses `browser.*` API namespace with a `chrome.*` fallback for compatibility.
- No `chrome.alarms` API -- badge polling and data refresh use `setInterval` in the service worker.
- Safari suspends service workers aggressively; all state is persisted to `browser.storage.local`.
- Popup dimensions are constrained to 380x550px (Safari enforces max 400x600px).
- Context menus require Safari 17+.
- SVG icons are used (Safari supports them natively in extensions).
- CSS uses `-apple-system` and SF Pro in the font stack for native macOS integration.

## API Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/runtime/status` | GET | Connection test |
| `/v1/jobs` | GET/POST | List active jobs, create new jobs |
| `/v1/decisions` | GET | List pending decisions |
| `/v1/audit` | GET | Recent activity feed |
| `/v1/chat` | POST | Send messages to agents |

## Permissions Explained

| Permission | Why |
|---|---|
| `storage` | Persist credentials and settings across sessions. |
| `activeTab` | Access the current tab for context menu text selection. |
| `contextMenus` | Register right-click menu items (Ask Atlas, Send to Cheryl, Research). |
| `notifications` | Show macOS system notifications for decisions and job events. |
| `host_permissions` | Allow API calls to `https://atlas-ux.onrender.com`. |

## Distribution

Safari extensions are distributed as macOS apps through the Mac App Store:

1. Archive the Xcode project: **Product > Archive**.
2. In the Organizer, click **Distribute App** and follow the App Store submission flow.
3. Once approved, the extension is available in the Mac App Store and can be enabled in Safari Settings > Extensions.
