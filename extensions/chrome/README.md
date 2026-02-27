# Atlas UX -- Chrome & Edge Extension

Browser extension for the Atlas UX AI employee productivity platform. Manage agents, chat, view jobs, and get notifications directly from your Chrome or Edge toolbar.

---

## Install

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select this `extensions/chrome/` directory.
4. Pin the Atlas UX icon in the toolbar.

### Edge

Edge is Chromium-based and loads the same extension without modification.

1. Open `edge://extensions`.
2. Enable **Developer mode** (bottom-left toggle).
3. Click **Load unpacked** and select this `extensions/chrome/` directory.

---

## Setup

1. Click the Atlas UX icon in the toolbar.
2. Enter your credentials:
   - **API URL**: `https://atlas-ux.onrender.com` (default) or `http://localhost:8787` for local development.
   - **Auth Token**: Your JWT bearer token from the Atlas UX web app.
   - **Tenant ID**: Your organization's tenant UUID.
3. Click **Connect**. A green status dot confirms the connection.

---

## Features

- **Stats bar** -- Active jobs, pending decisions, and online agent counts at a glance.
- **Agent chat** -- Talk to Atlas, Binky, Cheryl, or Sunday from the popup.
- **Activity feed** -- Recent audit log entries with auto-refresh.
- **Quick actions** -- Create new jobs and open the dashboard in one click.
- **Context menus** -- Right-click selected text to query agents (Ask Atlas, Send to Cheryl, Research with Archy).
- **Badge** -- Toolbar icon shows the count of active jobs.
- **Notifications** -- Desktop alerts when jobs complete.
- **Options page** -- Configure API URL, polling interval, and notification preferences.
- **Dark theme** -- Slate-900 background with cyan-500 accents, matching the Atlas UX web app.

---

## File Structure

```
chrome/
  manifest.json      Manifest V3 configuration
  popup.html         Popup markup
  popup.css          Popup styles (dark theme)
  popup.js           Popup logic (login, chat, stats, activity)
  background.js      Service worker (context menus, badge, notifications, alarms)
  content.js         Content script (text selection for context menus)
  options.html       Settings page
  icons/
    icon16.svg       Toolbar icon (16x16)
    icon48.svg       Extension management icon (48x48)
    icon128.svg      Chrome Web Store icon (128x128)
```

---

## Development

1. Make changes to any file in this directory.
2. Go to `chrome://extensions` and click the reload icon on the Atlas UX card.
3. Reopen the popup to see your changes.

The popup is a standalone HTML page. You can also open `popup.html` directly in a browser tab for faster iteration on layout and styles (API calls will not work outside the extension context).

---

## Building for Chrome Web Store

1. Remove development artifacts and source maps.
2. Create a zip:
   ```
   zip -r atlas-ux-chrome.zip . -x ".*" -x "README.md"
   ```
3. Upload to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Fill in the store listing (description, screenshots, category).
5. Submit for review.

For Edge, upload the same zip to the [Microsoft Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge).

---

## Permissions Explained

| Permission | Why |
|---|---|
| `storage` | Persist credentials and settings across sessions. |
| `activeTab` | Access the current tab for context menu text selection. |
| `contextMenus` | Register right-click menu items (Ask Atlas, Send to Cheryl, Research with Archy). |
| `notifications` | Show desktop notifications when jobs complete. |
| `alarms` | Schedule periodic badge updates and stats polling. |
| `host_permissions: https://atlas-ux.onrender.com/*` | Allow API calls to the production backend. |
| `host_permissions: http://localhost:8787/*` | Allow API calls to a local development backend. |
