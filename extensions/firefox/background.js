/* ═══════════════════════════════════════════════════════
   Atlas UX — Firefox Extension Background Script
   Runs as a persistent background script (MV3, module type)
   ═══════════════════════════════════════════════════════ */

const api = typeof browser !== "undefined" ? browser : chrome;

// ─── Constants ───
const DEFAULT_API_URL = "https://atlas-ux.onrender.com/v1";
const BADGE_ALARM_NAME = "atlasux-badge-poll";
const BADGE_INTERVAL_MINUTES = 1;

// ─── Install Handler ───
api.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Set default API URL
    await api.storage.local.set({ atlasApiUrl: DEFAULT_API_URL });
  }

  // Create context menus (re-created on every install/update)
  createContextMenus();
});

// On browser startup, re-create context menus
api.runtime.onStartup.addListener(() => {
  createContextMenus();
});

// ─── Context Menus ───
function createContextMenus() {
  api.contextMenus.removeAll().then(() => {
    api.contextMenus.create({
      id: "askAtlas",
      title: "Ask Atlas about \"%s\"",
      contexts: ["selection"],
    });

    api.contextMenus.create({
      id: "sendToCheryl",
      title: "Send to Cheryl (Support)",
      contexts: ["selection"],
    });

    api.contextMenus.create({
      id: "researchArchy",
      title: "Research with Archy",
      contexts: ["selection"],
    });

    api.contextMenus.create({
      id: "separator",
      type: "separator",
      contexts: ["selection"],
    });

    api.contextMenus.create({
      id: "atlasParent",
      title: "Atlas UX",
      contexts: ["page"],
    });

    api.contextMenus.create({
      id: "openDashboard",
      parentId: "atlasParent",
      title: "Open Dashboard",
      contexts: ["page"],
    });

    api.contextMenus.create({
      id: "openSettings",
      parentId: "atlasParent",
      title: "Extension Settings",
      contexts: ["page"],
    });
  });
}

// ─── Context Menu Click Handler ───
api.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case "askAtlas":
    case "sendToCheryl":
    case "researchArchy": {
      const selection = info.selectionText || "";
      // Store the action + selection for the popup to pick up
      await api.storage.local.set({
        contextAction: info.menuItemId,
        contextSelection: selection.substring(0, 1000),
      });
      // Open the popup (Firefox supports this via browserAction/action)
      api.action.openPopup().catch(() => {
        // Fallback: some browsers don't support openPopup()
        // The popup will check storage on next open
      });
      break;
    }

    case "openDashboard": {
      const stored = await api.storage.local.get(["atlasApiUrl"]);
      const baseUrl = (stored.atlasApiUrl || DEFAULT_API_URL)
        .replace("/v1", "")
        .replace("atlas-ux.onrender.com", "atlasux.vercel.app");
      api.tabs.create({ url: baseUrl + "/#/app/dashboard" });
      break;
    }

    case "openSettings": {
      api.runtime.openOptionsPage();
      break;
    }
  }
});

// ─── Badge Polling via Alarms ───
api.alarms.create(BADGE_ALARM_NAME, {
  periodInMinutes: BADGE_INTERVAL_MINUTES,
});

api.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== BADGE_ALARM_NAME) return;
  await updateBadge();
});

async function updateBadge() {
  try {
    const stored = await api.storage.local.get([
      "atlasApiUrl",
      "atlasAuthToken",
      "atlasTenantId",
    ]);

    if (!stored.atlasApiUrl || !stored.atlasAuthToken || !stored.atlasTenantId) {
      await api.action.setBadgeText({ text: "" });
      return;
    }

    const res = await fetch(`${stored.atlasApiUrl}/jobs?status=running&limit=1`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${stored.atlasAuthToken}`,
        "x-tenant-id": stored.atlasTenantId,
      },
    });

    if (!res.ok) {
      await api.action.setBadgeText({ text: "" });
      return;
    }

    const data = await res.json();
    const count = data.total ?? data.count ?? data.data?.length ?? 0;

    if (count > 0) {
      await api.action.setBadgeText({ text: String(count) });
      await api.action.setBadgeBackgroundColor({ color: "#06b6d4" });
      await api.action.setBadgeTextColor({ color: "#ffffff" });
    } else {
      await api.action.setBadgeText({ text: "" });
    }
  } catch (err) {
    // Silently fail — network may be unavailable
    await api.action.setBadgeText({ text: "" }).catch(() => {});
  }
}

// ─── Message Handler (popup <-> background communication) ───
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getCredentials": {
      api.storage.local
        .get(["atlasApiUrl", "atlasAuthToken", "atlasTenantId"])
        .then((stored) => {
          sendResponse({
            apiUrl: stored.atlasApiUrl || DEFAULT_API_URL,
            authToken: stored.atlasAuthToken || "",
            tenantId: stored.atlasTenantId || "",
          });
        });
      return true; // async response
    }

    case "refreshBadge": {
      updateBadge().then(() => sendResponse({ ok: true }));
      return true;
    }

    case "getPageInfo": {
      // Forward to content script in the active tab
      api.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          if (!tabs[0]) {
            sendResponse({ error: "No active tab" });
            return;
          }
          api.tabs
            .sendMessage(tabs[0].id, { type: "getPageInfo" })
            .then((info) => sendResponse(info))
            .catch((err) =>
              sendResponse({ error: err.message })
            );
        });
      return true;
    }

    case "getSelection": {
      api.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          if (!tabs[0]) {
            sendResponse({ selection: "" });
            return;
          }
          api.tabs
            .sendMessage(tabs[0].id, { type: "getSelection" })
            .then((result) => sendResponse(result))
            .catch(() => sendResponse({ selection: "" }));
        });
      return true;
    }

    default:
      return false;
  }
});

// ─── Run initial badge update ───
updateBadge();
