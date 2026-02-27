# Atlas UX -- Firefox Extension

Browser extension for the Atlas UX AI employee productivity platform. Manage agents, chat, view jobs, and get notifications directly from your Firefox toolbar.

---

## Install

1. Open `about:debugging` in Firefox.
2. Click **This Firefox** in the left sidebar.
3. Click **Load Temporary Add-on**.
4. Navigate to this `extensions/firefox/` directory and select `manifest.json`.
5. The Atlas UX icon appears in the toolbar.

Temporary add-ons are removed when Firefox restarts. For persistent installation, package and submit to addons.mozilla.org (see Building for AMO below).

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

## Firefox-Specific Notes

### `browser.*` vs `chrome.*`

Firefox supports both `browser.*` (Promise-based) and `chrome.*` (callback-based) API namespaces in Manifest V3. This extension uses `chrome.*` for cross-browser consistency.

### Gecko Settings

The manifest includes a `browser_specific_settings.gecko` block:

```json
{
  "gecko": {
    "id": "atlasux@deadapp.info",
    "strict_min_version": "109.0"
  }
}
```

The `id` is the extension's unique identifier for AMO. The `strict_min_version` ensures compatibility with Firefox 109+, which supports Manifest V3.

### Background Scripts

Firefox uses `"scripts": ["background.js"]` with `"type": "module"` instead of Chrome's `"service_worker": "background.js"`. The background runs as a persistent event page (not a true service worker), so in-memory state is more reliable than in Chrome, but you should still use `chrome.storage.local` for anything that must survive a browser restart.

### Options UI

The options page is declared as `options_ui` with `open_in_tab: true`, which opens settings in a full browser tab rather than an inline panel.

---

## File Structure

```
firefox/
  manifest.json      Manifest V3 with gecko settings
  popup.html         Popup markup
  popup.css          Popup styles (dark theme)
  popup.js           Popup logic (login, chat, stats, activity)
  background.js      Background script (context menus, badge, notifications)
  content.js         Content script (text selection for context menus)
  options.html       Settings page
  icons/
    icon16.svg       Toolbar icon (16x16)
    icon48.svg       Extension management icon (48x48)
    icon128.svg      AMO listing icon (128x128)
```

---

## Development

1. Make changes to any file in this directory.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Reload** next to the Atlas UX entry.
4. Reopen the popup to see your changes.

---

## Building for AMO

1. Create a zip of this directory:
   ```
   cd extensions/firefox
   zip -r ../../build/atlas-ux-firefox.zip . -x ".*" -x "README.md"
   ```
2. Go to [addons.mozilla.org](https://addons.mozilla.org) and sign in with a Firefox account.
3. Click **Submit a New Add-on** and upload the zip.
4. AMO will run an automated review. A manual review may follow.
5. If the reviewer requests source code, provide a link to this repository or upload a source archive.

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
