/* ===================================================================
   Atlas UX — Chrome Extension Background Service Worker
   =================================================================== */

const DEFAULT_API_URL = "https://atlas-ux.onrender.com";
const ALARM_CHECK_JOBS = "atlasCheckJobs";
const ALARM_INTERVAL_MIN = 1;

// ---- Context Menus ----
chrome.runtime.onInstalled.addListener(() => {
  // Set default API URL
  chrome.storage.local.get("atlasCredentials", (data) => {
    if (!data.atlasCredentials) {
      chrome.storage.local.set({
        atlasCredentials: { apiUrl: DEFAULT_API_URL, authToken: "", tenantId: "" },
      });
    }
  });

  // Set default settings
  chrome.storage.local.get("atlasSettings", (data) => {
    if (!data.atlasSettings) {
      chrome.storage.local.set({
        atlasSettings: {
          notifyJobComplete: true,
          notifyDecisionRequest: true,
          pollInterval: 15,
          autoConnect: true,
        },
      });
    }
  });

  // Create context menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "atlas-ask",
      title: "Ask Atlas about \"%s\"",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "atlas-cheryl",
      title: "Send to Cheryl (Support)",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "atlas-archy",
      title: "Research with Archy",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "atlas-separator",
      type: "separator",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "atlas-open",
      title: "Open Atlas UX Dashboard",
      contexts: ["page"],
    });
  });

  // Start the job-check alarm
  chrome.alarms.create(ALARM_CHECK_JOBS, { periodInMinutes: ALARM_INTERVAL_MIN });
});

// ---- Context Menu Click Handler ----
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "atlas-open") {
    chrome.tabs.create({ url: "https://atlasux.vercel.app" });
    return;
  }

  const selectedText = info.selectionText || "";
  let agent = "atlas";
  let prefix = "";

  switch (info.menuItemId) {
    case "atlas-ask":
      agent = "atlas";
      prefix = "";
      break;
    case "atlas-cheryl":
      agent = "cheryl";
      prefix = "Support request: ";
      break;
    case "atlas-archy":
      agent = "archy";
      prefix = "Research this: ";
      break;
  }

  const messageText = prefix + selectedText;

  // Try sending to the popup if it's open
  chrome.runtime.sendMessage({
    type: "CONTEXT_MENU_TEXT",
    text: messageText,
    agent,
  }).catch(() => {
    // Popup not open — store it so it picks up when opened
    chrome.storage.local.set({
      atlasPendingContext: { text: messageText, agent },
    });

    // Also try sending to the content script to show a notification
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_TOAST",
        message: `Saved to Atlas UX — open the extension to continue.`,
      }).catch(() => {});
    }
  });
});

// ---- Alarm Handler (check active jobs) ----
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_CHECK_JOBS) return;

  const data = await chrome.storage.local.get(["atlasCredentials", "atlasSettings", "atlasLastJobIds"]);
  const creds = data.atlasCredentials;
  const settings = data.atlasSettings || {};

  if (!creds?.authToken || !creds?.tenantId) {
    chrome.action.setBadgeText({ text: "" });
    return;
  }

  try {
    const apiUrl = (creds.apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${creds.authToken}`,
      "x-tenant-id": creds.tenantId,
    };

    // Fetch running jobs
    const res = await fetch(`${apiUrl}/v1/jobs?status=running&limit=50`, { headers });
    if (!res.ok) {
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#f87171" });
      return;
    }

    const body = await res.json();
    const jobs = body?.jobs || body || [];
    const count = body?.total ?? (Array.isArray(jobs) ? jobs.length : 0);

    // Update badge
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(count) });
      chrome.action.setBadgeBackgroundColor({ color: "#06b6d4" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }

    // Check for newly completed jobs (compare with last known running IDs)
    if (settings.notifyJobComplete) {
      const currentIds = new Set(
        Array.isArray(jobs) ? jobs.map((j) => j.id) : []
      );
      const lastIds = data.atlasLastJobIds || [];

      for (const prevId of lastIds) {
        if (!currentIds.has(prevId)) {
          // This job is no longer running — it may have completed
          showNotification(
            "Job Completed",
            `Job ${prevId.slice(0, 8)}... has finished.`
          );
        }
      }

      // Store current running IDs
      chrome.storage.local.set({
        atlasLastJobIds: Array.isArray(jobs) ? jobs.map((j) => j.id) : [],
      });
    }

    // Also check pending decisions
    if (settings.notifyDecisionRequest) {
      try {
        const dRes = await fetch(`${apiUrl}/v1/decisions?status=pending&limit=1`, { headers });
        if (dRes.ok) {
          const dBody = await dRes.json();
          const dCount = dBody?.total ?? (dBody?.decisions?.length) ?? 0;
          if (dCount > 0) {
            // We won't spam notifications — just keep badge updated
            const totalBadge = count + dCount;
            if (totalBadge > 0) {
              chrome.action.setBadgeText({ text: String(totalBadge) });
              chrome.action.setBadgeBackgroundColor({ color: "#06b6d4" });
            }
          }
        }
      } catch {
        // ignore decision check errors
      }
    }
  } catch (err) {
    console.error("[Atlas UX] Job check failed:", err);
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#f87171" });
  }
});

// ---- Notifications ----
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.svg",
    title: `Atlas UX — ${title}`,
    message,
    priority: 1,
  });
}

// ---- Message passing ----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CREDENTIALS_UPDATED") {
    // Re-arm the alarm to start checking immediately
    chrome.alarms.create(ALARM_CHECK_JOBS, {
      delayInMinutes: 0.1,
      periodInMinutes: ALARM_INTERVAL_MIN,
    });
    sendResponse({ ok: true });
  }

  if (msg.type === "CREDENTIALS_CLEARED") {
    chrome.action.setBadgeText({ text: "" });
    chrome.storage.local.remove("atlasLastJobIds");
    sendResponse({ ok: true });
  }

  if (msg.type === "GET_PENDING_CONTEXT") {
    chrome.storage.local.get("atlasPendingContext", (data) => {
      if (data.atlasPendingContext) {
        sendResponse(data.atlasPendingContext);
        chrome.storage.local.remove("atlasPendingContext");
      } else {
        sendResponse(null);
      }
    });
    return true; // async sendResponse
  }

  return false;
});

// ---- On startup: re-arm alarm ----
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get("atlasSettings", (data) => {
    if (data.atlasSettings?.autoConnect) {
      chrome.alarms.create(ALARM_CHECK_JOBS, { periodInMinutes: ALARM_INTERVAL_MIN });
    }
  });
});
