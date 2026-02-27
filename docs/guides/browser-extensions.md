# Browser Extensions -- User Guide

Atlas UX browser extensions bring the AI employee platform directly into your browser. Manage agents, chat, monitor jobs, and receive notifications without leaving the page you are working on.

The extensions are available for Chrome, Edge, Firefox, and Safari. All four share the same feature set: a dark-themed popup with live stats, agent chat, an activity feed, quick actions, context-menu integration, and desktop notifications.

---

## Installation

### Chrome

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `extensions/chrome/` directory from this repository.
5. The Atlas UX icon appears in the toolbar. Pin it for easy access.

### Edge

Edge is Chromium-based and uses the same extension format as Chrome.

1. Open `edge://extensions` in Edge.
2. Enable **Developer mode** (toggle in the bottom-left).
3. Click **Load unpacked**.
4. Select the `extensions/chrome/` directory (the same codebase works in both browsers).
5. Pin the Atlas UX icon in the Edge toolbar.

### Firefox

1. Open `about:debugging` in Firefox.
2. Click **This Firefox** in the left sidebar.
3. Click **Load Temporary Add-on**.
4. Navigate to `extensions/firefox/` and select `manifest.json`.
5. The extension loads and the Atlas UX icon appears in the toolbar.

Temporary add-ons are removed when Firefox restarts. For persistent installation, package the extension and submit it to addons.mozilla.org (AMO).

### Safari

Safari extensions require conversion to an Xcode project.

1. Make sure you have macOS 13 or later, Safari 16.4 or later, and Xcode 14 or later.
2. Run the converter from the repository root:
   ```
   xcrun safari-web-extension-converter ./extensions/safari \
     --project-location ./build/safari-ext \
     --app-name "Atlas UX" \
     --bundle-identifier cloud.atlasux.safari
   ```
3. Open the generated Xcode project and build it (Cmd+R).
4. In Safari, go to **Settings > Extensions** and enable **Atlas UX**.
5. If the extension does not appear, open **Safari > Develop > Allow Unsigned Extensions** first.

---

## First-Time Setup

After installing the extension in any browser:

1. Click the Atlas UX icon in the toolbar to open the popup.
2. You will see the **Connect to Atlas** login form with three fields:
   - **API URL** -- The backend endpoint. Defaults to `https://atlas-ux.onrender.com`. Change this only if you are running a local backend (`http://localhost:8787`).
   - **Auth Token** -- Your JWT bearer token. Obtain this from the Atlas UX web app after logging in.
   - **Tenant ID** -- Your organization's tenant UUID. Find this in the web app under Settings or in the URL.
3. Click **Connect**. The extension tests the connection against `/v1/runtime/status`. A green dot in the header confirms a successful connection.

Credentials are stored locally in `chrome.storage.local` and persist across browser sessions (except for temporary add-ons in Firefox).

---

## Using the Popup

Once connected, the popup shows four sections:

### Stats Bar

Three metrics at the top of the popup:
- **Active Jobs** -- Number of currently running jobs.
- **Pending** -- Number of decision memos awaiting approval.
- **Agents** -- Number of active/online agents.

Stats refresh automatically based on your configured polling interval (default: 15 seconds).

### Agent Chat

A mini chat panel for conversing with AI agents. Select an agent using the pill buttons:
- **Atlas** -- CEO agent, general questions and task delegation.
- **Binky** -- CRO agent, revenue and growth topics.
- **Cheryl** -- Support agent, help and troubleshooting.
- **Sunday** -- Communications and tech documentation.

Type a message and press Enter or click the send button. The agent's reply appears below. Chat history is kept for the current popup session.

### Activity Feed

A scrollable list of the five most recent audit log entries. Each entry shows an icon (color-coded by type), a description, and a relative timestamp. Click the refresh button to reload the feed manually.

### Quick Actions

Two buttons at the bottom:
- **New Job** -- Opens a modal to create a job. Choose a type (Content Create, Email Send, Research, Social Post, Custom) and provide a description.
- **Dashboard** -- Opens the full Atlas UX web app in a new tab.

---

## Context Menus

Right-click any selected text on a web page to see Atlas UX context menu items:

- **Ask Atlas about this** -- Sends the selected text to Atlas for analysis.
- **Send to Cheryl (Support)** -- Routes the text to the Cheryl support agent.
- **Research with Archy** -- Sends the text to the Archy research agent.

Selecting a context menu item opens the popup with the text pre-filled in the chat input and the appropriate agent selected.

---

## Options / Settings Page

Access the options page by clicking the gear icon in the popup header or through your browser's extension settings.

The options page lets you configure:
- **API URL** -- Change the backend endpoint.
- **Polling Interval** -- How often the extension refreshes stats and activity (in seconds).
- **Notifications** -- Enable or disable desktop notifications for job completions.
- **Badge Count** -- Toggle the toolbar badge that shows the number of active jobs.

---

## Troubleshooting

### Connection failed

- Verify the API URL is correct and includes the protocol (`https://`).
- Check that your auth token has not expired. Generate a new one from the web app.
- If using a local backend, confirm the server is running on port 8787 and that `http://localhost:8787/*` is in the extension's host permissions.

### Badge not updating

- Open the options page and confirm badge updates are enabled.
- Chrome and Firefox use the `alarms` API to schedule badge updates. If alarms are not firing, reload the extension.
- Safari does not support the `alarms` API and uses `setInterval` instead. The service worker may stop after a period of inactivity; reopen the popup to restart it.

### Notifications not showing

- Check that your operating system allows browser notifications.
- In the extension options, confirm notifications are enabled.
- In Chrome, go to `chrome://settings/content/notifications` and make sure the browser is not blocking notifications globally.

### Popup state resets when closed

This is expected behavior. Browser extension popups are destroyed when closed and recreated when opened. Credentials persist in storage, but chat history and unsaved form input do not survive a close/reopen cycle.

### CORS errors in the console

The extension's `host_permissions` in `manifest.json` must include the API domain. The default configuration covers `https://atlas-ux.onrender.com/*` and `http://localhost:8787/*`. If you are using a custom API domain, add it to the manifest's `host_permissions` array.
