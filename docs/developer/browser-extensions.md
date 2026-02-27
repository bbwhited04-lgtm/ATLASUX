# Browser Extensions -- Developer Guide

This document covers the architecture, browser-specific differences, and development workflow for the Atlas UX browser extensions.

---

## Architecture Overview

The extensions follow a shared web extension pattern. All three browser targets (Chrome/Edge, Firefox, Safari) use Manifest V3 and ship the same core feature set. Each browser directory contains its own manifest and markup adapted to that browser's requirements, but the popup UI, background logic, and content script are functionally identical.

```
User clicks icon
       |
  +---------+     message passing     +---------------+
  |  Popup  | <---------------------> |  Background   |
  | (popup) |                         | (service_worker|
  +---------+                         |  or scripts)  |
       |                              +-------+-------+
       |  chrome.storage.local                |
       |  (credentials, settings)             |
       |                              +-------+-------+
       +-- fetch() -----------------> | Atlas UX API  |
                                      | /v1/*         |
                                      +-------+-------+
                                              |
                                      +-------+-------+
                                      | Content Script |
                                      | (page context) |
                                      +---------------+
```

---

## Directory Structure

```
extensions/
  chrome/                 # Chrome & Edge (Manifest V3, service_worker)
    manifest.json
    popup.html
    popup.css
    popup.js
    background.js         # Service worker
    content.js            # Content script
    options.html          # Settings page
    icons/
      icon16.svg
      icon48.svg
      icon128.svg

  firefox/                # Firefox (Manifest V3, background scripts with type "module")
    manifest.json
    popup.html
    popup.css
    popup.js
    background.js
    content.js
    options.html
    icons/
      icon16.svg
      icon48.svg
      icon128.svg

  safari/                 # Safari (Manifest V3, requires Xcode wrapper)
    manifest.json
    popup.html
    popup.css
    popup.js
    background.js
    content.js
    options.html
    icons/
      icon16.svg
      icon48.svg
      icon128.svg
      icon256.svg          # Safari requires higher-resolution icons
      icon512.svg
```

---

## Manifest V3 Differences

### Chrome / Edge

```json
{
  "background": {
    "service_worker": "background.js"
  },
  "options_page": "options.html",
  "minimum_chrome_version": "110"
}
```

Chrome uses a service worker for the background script. The worker is event-driven and may be terminated after a period of inactivity. Use `chrome.alarms` for periodic tasks (badge updates, polling).

### Firefox

```json
{
  "background": {
    "scripts": ["background.js"],
    "type": "module"
  },
  "browser_specific_settings": {
    "gecko": {
      "id": "atlasux@deadapp.info",
      "strict_min_version": "109.0"
    }
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}
```

Key differences from Chrome:
- Background uses `scripts` array with `"type": "module"` instead of `service_worker`.
- The `browser_specific_settings.gecko` block provides the extension ID (required for AMO submission) and minimum Firefox version.
- Options page is declared under `options_ui` with `open_in_tab: true` instead of `options_page`.

### Safari

```json
{
  "background": {
    "service_worker": "background.js"
  },
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}
```

Key differences:
- Uses `service_worker` like Chrome, but Safari's service worker lifetime is shorter. Workers may be suspended more aggressively.
- The `alarms` permission is not listed. Safari does not reliably support `chrome.alarms`. Use `setInterval` in the service worker instead, and be aware the timer resets when the worker is suspended.
- Safari requires additional icon sizes (256px, 512px) for the macOS app wrapper.
- Only `https://` host permissions are listed; `http://localhost` is omitted since Safari extensions target production use.

---

## API Integration Pattern

All API calls go through a shared helper pattern:

```js
function apiHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${credentials.authToken}`,
    "x-tenant-id": credentials.tenantId,
  };
}

async function apiFetch(path, opts = {}) {
  const base = credentials.apiUrl.replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    headers: apiHeaders(),
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

The base URL defaults to `https://atlas-ux.onrender.com`. All API routes are prefixed with `/v1`. The `x-tenant-id` header is required by the backend's `tenantPlugin` for multi-tenant isolation.

---

## Message Passing

The extension uses `chrome.runtime.sendMessage` and `chrome.runtime.onMessage` for communication between components.

### Popup to Background

```js
// Popup notifies background when credentials change
chrome.runtime.sendMessage({ type: "CREDENTIALS_UPDATED", credentials });
chrome.runtime.sendMessage({ type: "CREDENTIALS_CLEARED" });
```

### Background to Popup

```js
// Background forwards context menu selections to the popup
chrome.runtime.sendMessage({
  type: "CONTEXT_MENU_TEXT",
  text: selectedText,
  agent: "atlas"
});
```

### Content Script to Background

```js
// Content script sends selected text when requested
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_SELECTION") {
    sendResponse({ text: window.getSelection().toString() });
  }
});
```

On Firefox, `browser.runtime.sendMessage` also works but `chrome.*` APIs are supported via the WebExtension polyfill that Firefox provides natively for Manifest V3.

---

## Storage

Credentials and settings are stored in `chrome.storage.local`:

```js
// Credentials object
{ atlasCredentials: { apiUrl, authToken, tenantId } }

// Settings object
{ atlasSettings: { pollInterval, notificationsEnabled, badgeEnabled } }
```

`chrome.storage.local` is persistent across browser sessions (except in Firefox with temporary add-ons). It is not synced across devices; use `chrome.storage.sync` if cross-device sync is needed in the future.

---

## Context Menus

Context menu items are registered in `background.js` during the `onInstalled` event:

```js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-atlas",
    title: "Ask Atlas about this",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "send-cheryl",
    title: "Send to Cheryl (Support)",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "research-archy",
    title: "Research with Archy",
    contexts: ["selection"],
  });
});
```

When a context menu item is clicked, the background script gets the selected text from the content script and forwards it to the popup via message passing.

---

## Badge Updates

The toolbar badge displays the count of active jobs. Update logic runs on a timer:

- **Chrome / Firefox**: Use `chrome.alarms.create("badge-update", { periodInMinutes: 0.25 })` and listen on `chrome.alarms.onAlarm`.
- **Safari**: `chrome.alarms` is not available. Use `setInterval(updateBadge, 15000)` inside the service worker. Note that the interval resets when Safari suspends the worker.

```js
async function updateBadge() {
  try {
    const data = await apiFetch("/v1/jobs?status=running&limit=1");
    const count = data?.total ?? 0;
    chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
    chrome.action.setBadgeBackgroundColor({ color: "#06b6d4" });
  } catch {
    chrome.action.setBadgeText({ text: "" });
  }
}
```

---

## Notifications

Desktop notifications fire when a job completes:

```js
chrome.notifications.create("job-complete-" + jobId, {
  type: "basic",
  iconUrl: "icons/icon128.svg",
  title: "Job Completed",
  message: `${jobType} job finished successfully.`,
});
```

The `notifications` permission must be declared in the manifest. On macOS with Safari, notifications route through the system notification center.

---

## Building for Production

### Chrome / Edge

1. Remove any development files or source maps.
2. Zip the `extensions/chrome/` directory:
   ```
   cd extensions/chrome && zip -r ../../build/atlas-ux-chrome.zip . -x ".*"
   ```
3. Upload the zip to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
4. Edge uses the same zip, uploaded to the [Microsoft Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge).

### Firefox

1. Zip the `extensions/firefox/` directory:
   ```
   cd extensions/firefox && zip -r ../../build/atlas-ux-firefox.zip . -x ".*"
   ```
2. Upload to [addons.mozilla.org](https://addons.mozilla.org) (AMO).
3. AMO requires a review. Provide source code if requested (the review team may ask for it since the extension makes API calls).

### Safari

1. Convert the extension to an Xcode project:
   ```
   xcrun safari-web-extension-converter ./extensions/safari \
     --project-location ./build/safari-ext \
     --app-name "Atlas UX" \
     --bundle-identifier cloud.atlasux.safari
   ```
2. Open the Xcode project, configure signing with your Apple Developer certificate.
3. Archive and distribute through the Mac App Store or direct notarized distribution.

---

## Testing

### Chrome / Edge

1. Go to `chrome://extensions` (or `edge://extensions`).
2. Enable Developer mode.
3. Click **Load unpacked** and select `extensions/chrome/`.
4. After making changes, click the reload icon on the extension card.

### Firefox

1. Go to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on** and select `extensions/firefox/manifest.json`.
3. After making changes, click **Reload** next to the extension.

### Safari

1. Build and run the Xcode project (Cmd+R).
2. After making changes to web extension files, rebuild in Xcode.
3. If the extension does not update, disable and re-enable it in Safari Settings > Extensions.

---

## Common Gotchas

### CORS

Extensions bypass CORS for domains listed in `host_permissions`. If you add a new API domain, add it to `host_permissions` in the manifest. Without it, `fetch()` calls will fail with CORS errors.

### Service Worker Lifecycle

Chrome and Safari service workers are ephemeral. They start on events and may be terminated after 30 seconds of inactivity (or sooner on Safari). Do not rely on in-memory state in the background script. Store any persistent data in `chrome.storage.local`.

### Popup State Loss

The popup DOM is destroyed when the popup closes. Chat history, scroll position, and form input are lost. Credentials survive because they are read from `chrome.storage.local` on every popup open.

### Firefox `browser.*` vs `chrome.*`

Firefox supports both `browser.*` (Promise-based) and `chrome.*` (callback-based) APIs in Manifest V3. The codebase uses `chrome.*` for cross-browser compatibility.

---

## Adding New Features

When adding a new feature that should work across all browsers:

1. Implement the feature in `extensions/chrome/` first.
2. Copy the relevant changes to `extensions/firefox/` and `extensions/safari/`.
3. Adjust for browser differences:
   - Firefox: check if the feature uses `chrome.alarms` or other APIs that differ.
   - Safari: check if the feature relies on APIs not available in Safari (alarms, certain notification options). Use fallbacks where needed.
4. Test in all three browsers before committing.
5. Update the manifest in each directory if new permissions are needed.
