/* =============================================
   Atlas UX — Safari Extension Background Service Worker
   ============================================= */

const api = typeof browser !== "undefined" ? browser : chrome;

// ---------------------------------------------------------------------------
// Installation & Setup
// ---------------------------------------------------------------------------

api.runtime.onInstalled.addListener((details) => {
  // Set default API URL on install
  if (details.reason === "install") {
    api.storage.local.set({
      apiUrl: "https://atlas-ux.onrender.com/v1",
      pollInterval: 15,
      notifyJobs: true,
      notifyDecisions: true,
    });
  }

  // Create context menus
  createContextMenus();
});

// Recreate context menus on startup (Safari may lose them)
api.runtime.onStartup.addListener(() => {
  createContextMenus();
  restoreBadge();
});

// ---------------------------------------------------------------------------
// Context Menus
// ---------------------------------------------------------------------------

function createContextMenus() {
  // Remove existing menus first to avoid duplicates
  api.contextMenus.removeAll(() => {
    api.contextMenus.create({
      id: "ask-atlas",
      title: "Ask Atlas about this",
      contexts: ["selection"],
    });

    api.contextMenus.create({
      id: "send-cheryl",
      title: "Send to Cheryl (Support)",
      contexts: ["selection"],
    });

    api.contextMenus.create({
      id: "research-archy",
      title: "Research this topic",
      contexts: ["selection"],
    });
  });
}

// Handle context menu clicks
api.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;

  // Store the action and text so the popup can pick it up
  api.storage.local.set({
    contextAction: info.menuItemId,
    contextText: info.selectionText.substring(0, 1000), // limit length
  });

  // Open the popup — on Safari, the best we can do is trigger the action
  // The popup will check storage on init for context data
  api.action.openPopup().catch(() => {
    // openPopup may not be supported in all Safari versions;
    // the user can click the toolbar icon manually
  });
});

// ---------------------------------------------------------------------------
// Badge Updates — Safari-safe (setInterval, no chrome.alarms)
// ---------------------------------------------------------------------------

let badgeInterval = null;

function startBadgePolling() {
  stopBadgePolling();
  badgeInterval = setInterval(updateBadge, 60000); // every 60 seconds
  // Also run immediately
  updateBadge();
}

function stopBadgePolling() {
  if (badgeInterval) {
    clearInterval(badgeInterval);
    badgeInterval = null;
  }
}

async function updateBadge() {
  try {
    const data = await api.storage.local.get([
      "apiUrl",
      "authToken",
      "tenantId",
    ]);
    if (!data.apiUrl || !data.authToken || !data.tenantId) {
      setBadge("", "#475569");
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "x-tenant-id": data.tenantId,
    };

    const token = data.authToken.startsWith("Bearer ")
      ? data.authToken
      : `Bearer ${data.authToken}`;
    headers["Authorization"] = token;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${data.apiUrl}/jobs?status=running&limit=1`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      setBadge("!", "#ef4444");
      return;
    }

    const body = await res.json();
    const count =
      typeof body.total === "number"
        ? body.total
        : Array.isArray(body)
          ? body.length
          : 0;

    if (count > 0) {
      setBadge(String(count), "#06b6d4");
    } else {
      setBadge("", "#475569");
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      setBadge("!", "#ef4444");
    }
  }
}

function setBadge(text, color) {
  api.action.setBadgeText({ text });
  api.action.setBadgeBackgroundColor({ color });

  // Persist to storage so we can restore after service worker restart
  api.storage.local.set({ badgeText: text, badgeColor: color });
}

async function restoreBadge() {
  try {
    const data = await api.storage.local.get(["badgeText", "badgeColor"]);
    if (data.badgeText !== undefined) {
      api.action.setBadgeText({ text: data.badgeText });
    }
    if (data.badgeColor) {
      api.action.setBadgeBackgroundColor({ color: data.badgeColor });
    }
  } catch (_) {
    // no badge data saved
  }
}

// Start badge polling on load
startBadgePolling();

// ---------------------------------------------------------------------------
// Message Handler
// ---------------------------------------------------------------------------

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getContextData":
      api.storage.local
        .get(["contextAction", "contextText"])
        .then((data) => {
          sendResponse(data);
          // Clear after reading
          api.storage.local.remove(["contextAction", "contextText"]);
        })
        .catch(() => sendResponse({}));
      return true; // async response

    case "updateBadge":
      if (typeof message.count === "number" && message.count > 0) {
        setBadge(String(message.count), "#06b6d4");
      } else {
        setBadge("", "#475569");
      }
      sendResponse({ ok: true });
      return false;

    case "clearBadge":
      setBadge("", "#475569");
      sendResponse({ ok: true });
      return false;

    case "ping":
      sendResponse({ pong: true });
      return false;

    default:
      return false;
  }
});

// ---------------------------------------------------------------------------
// Notifications (for decision requests and job completions)
// ---------------------------------------------------------------------------

async function checkForNotifications() {
  try {
    const data = await api.storage.local.get([
      "apiUrl",
      "authToken",
      "tenantId",
      "notifyJobs",
      "notifyDecisions",
      "lastNotificationCheck",
    ]);

    if (!data.apiUrl || !data.authToken || !data.tenantId) return;

    const since = data.lastNotificationCheck || new Date().toISOString();

    const headers = {
      "Content-Type": "application/json",
      "x-tenant-id": data.tenantId,
    };
    const token = data.authToken.startsWith("Bearer ")
      ? data.authToken
      : `Bearer ${data.authToken}`;
    headers["Authorization"] = token;

    // Check pending decisions
    if (data.notifyDecisions !== false) {
      try {
        const res = await fetch(
          `${data.apiUrl}/decisions?status=pending&limit=3`,
          { headers }
        );
        if (res.ok) {
          const body = await res.json();
          const items = Array.isArray(body) ? body : body.items || [];
          for (const dec of items) {
            const createdAt = dec.createdAt || dec.timestamp;
            if (createdAt && new Date(createdAt) > new Date(since)) {
              api.notifications.create(`decision-${dec.id}`, {
                type: "basic",
                iconUrl: "icons/icon128.svg",
                title: "Decision Required",
                message: dec.title || dec.summary || "A decision needs your approval.",
              });
            }
          }
        }
      } catch (_) {
        // skip
      }
    }

    // Save check timestamp
    api.storage.local.set({
      lastNotificationCheck: new Date().toISOString(),
    });
  } catch (_) {
    // skip
  }
}

// Check for notifications every 2 minutes
setInterval(checkForNotifications, 120000);
