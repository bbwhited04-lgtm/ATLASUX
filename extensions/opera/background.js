/* ============================================
   Atlas UX — Opera Extension Background
   Service Worker (Manifest V3)
   ============================================ */

// --- Installation ---
chrome.runtime.onInstalled.addListener((details) => {
  // Set default storage values
  chrome.storage.local.get(['apiUrl'], (result) => {
    if (!result.apiUrl) {
      chrome.storage.local.set({
        apiUrl: 'https://atlas-ux.onrender.com',
        notifyJobCompletion: true,
        notifyDecisionRequests: true,
        pollingInterval: 30,
      });
    }
  });

  // Create context menus
  chrome.contextMenus.create({
    id: 'ask-atlas',
    title: "Ask Atlas about \"%s\"",
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'send-cheryl',
    title: "Send to Cheryl (Support): \"%s\"",
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'research-archy',
    title: "Research with Archy: \"%s\"",
    contexts: ['selection'],
  });

  // Set up periodic job check alarm
  chrome.alarms.create('checkJobs', { periodInMinutes: 1 });
});

// --- Context Menu Clicks ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.selectionText) return;

  // Store context data for the popup to consume
  chrome.storage.local.set({
    contextAction: info.menuItemId,
    contextText: info.selectionText,
    contextUrl: tab ? tab.url : '',
  });

  // Open popup (triggers popup to read the context)
  chrome.action.openPopup().catch(() => {
    // openPopup() may not be available in all contexts;
    // the user can click the extension icon instead
  });
});

// --- Alarms ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'checkJobs') return;

  try {
    const stored = await chrome.storage.local.get(['apiUrl', 'token', 'tenantId']);
    if (!stored.apiUrl || !stored.token || !stored.tenantId) {
      chrome.action.setBadgeText({ text: '' });
      return;
    }

    const base = stored.apiUrl.replace(/\/+$/, '');
    const url = base + (base.endsWith('/v1') ? '' : '/v1') + '/jobs?status=running';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + stored.token,
        'x-tenant-id': stored.tenantId,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const count = Array.isArray(data) ? data.length : (data.count || data.total || 0);

      if (count > 0) {
        chrome.action.setBadgeText({ text: String(count) });
        chrome.action.setBadgeBackgroundColor({ color: '#06b6d4' });
      } else {
        chrome.action.setBadgeText({ text: '' });
      }
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    // Silently fail — network may be unavailable
    chrome.action.setBadgeText({ text: '' });
  }
});

// --- Message Handling ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getContext') {
    chrome.storage.local.get(['contextAction', 'contextText', 'contextUrl'], (result) => {
      sendResponse(result || {});
      // Clear after reading
      chrome.storage.local.remove(['contextAction', 'contextText', 'contextUrl']);
    });
    return true; // Keep channel open for async response
  }

  if (msg.type === 'checkConnection') {
    chrome.storage.local.get(['apiUrl', 'token', 'tenantId'], (result) => {
      sendResponse({
        connected: !!(result.apiUrl && result.token && result.tenantId),
      });
    });
    return true;
  }

  sendResponse({ ok: true });
});
