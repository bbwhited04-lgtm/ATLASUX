# Atlas UX — Opera Browser Extension

Opera browser extension for the Atlas UX AI Employee Productivity Platform. Connect to your Atlas UX workspace directly from the Opera toolbar to chat with AI agents, monitor jobs, review decisions, and track activity in real time.

## Install (Developer Mode)

1. Open Opera and navigate to `opera://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extensions/opera/` directory from this repository
5. The Atlas UX icon appears in the Opera toolbar

## Setup

1. Click the Atlas UX icon in the toolbar
2. Enter your **API URL** (default: `https://atlas-ux.onrender.com`)
3. Enter your **Auth Token** (JWT bearer token from your Atlas UX account)
4. Enter your **Tenant ID** (your organization identifier)
5. Click **Connect**

The extension tests the connection automatically. A green status dot confirms you are connected.

## Features

- **Agent Chat** — Talk to Atlas (CEO), Binky (CRO), Cheryl (Support), or Sunday (Comms) directly from the popup
- **Live Stats** — See active jobs, pending decisions, and online agents at a glance
- **Activity Feed** — Recent audit log entries with color-coded severity levels, auto-refreshing every 15 seconds
- **Job Creation** — Create new jobs (content generation, research, email, social posts, analysis) without leaving your current tab
- **Context Menus** — Right-click selected text to ask Atlas, send to Cheryl for support, or research with Archy
- **Badge Counter** — The toolbar icon shows a badge with the number of active jobs
- **Dashboard Link** — One-click access to the full Atlas UX web application
- **Settings Page** — Configure connection, notification preferences, and polling intervals

## Opera-Specific Notes

- Opera is Chromium-based and uses the same `chrome.*` extension APIs as Chrome and Edge
- This extension uses Manifest V3 with a background service worker
- The popup UI is 400px wide with a 520px max-height, optimized for Opera's extension popout
- No sidebar API (`opr.sidebarAction`) is used; standard popup for maximum compatibility
- Compatible with Opera 110+ (Chromium 110+)

## File Structure

```
extensions/opera/
  manifest.json      Manifest V3 configuration
  popup.html         Main popup UI
  popup.css          Dark theme styles for popup
  popup.js           Popup logic (chat, stats, activity, jobs)
  background.js      Service worker (context menus, alarms, badge)
  content.js         Content script (selection capture, page info)
  options.html       Settings page UI
  options.css        Settings page styles
  options.js         Settings page logic
  icons/
    icon16.svg       16x16 toolbar icon
    icon48.svg       48x48 extension management icon
    icon128.svg      128x128 store listing icon
  README.md          This file
```

## Building for Opera Web Store

1. Ensure all files are present in the `extensions/opera/` directory
2. Create a ZIP archive of the folder contents (not the folder itself):
   ```bash
   cd extensions/opera && zip -r ../atlas-ux-opera.zip . -x "*.DS_Store" -x "__MACOSX/*"
   ```
3. Go to [addons.opera.com/developer](https://addons.opera.com/developer/)
4. Click **Add new extension** and upload the ZIP
5. Fill in the store listing details (description, screenshots, category)
6. Submit for review

## Permissions Explanation

| Permission       | Reason                                                       |
|-----------------|--------------------------------------------------------------|
| `storage`       | Saves connection credentials and preferences locally         |
| `activeTab`     | Reads selected text from the current tab for context menus   |
| `contextMenus`  | Adds right-click menu items (Ask Atlas, Send to Cheryl, etc) |
| `notifications` | Shows desktop notifications for job completions and decisions|
| `alarms`        | Periodic background checks for active job count (badge)      |
| Host permission | Connects to the Atlas UX API (onrender.com / localhost)      |

All data is stored locally in the browser. No data is sent to third parties. The extension only communicates with the Atlas UX API endpoint you configure.
