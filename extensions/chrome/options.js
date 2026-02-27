/* ===================================================================
   Atlas UX — Chrome Extension Options Page Logic
   =================================================================== */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const dom = {
    optApiUrl:        $("#optApiUrl"),
    optNotifyJob:     $("#optNotifyJob"),
    optNotifyDecision: $("#optNotifyDecision"),
    optPollInterval:  $("#optPollInterval"),
    optAutoConnect:   $("#optAutoConnect"),
    optFloatingButton: $("#optFloatingButton"),
    btnSave:          $("#btnSave"),
    btnClearData:     $("#btnClearData"),
    toast:            $("#toast"),
  };

  // ---- Load settings ----
  function loadSettings() {
    chrome.storage.local.get(["atlasCredentials", "atlasSettings"], (data) => {
      const creds = data.atlasCredentials || {};
      const settings = data.atlasSettings || {};

      dom.optApiUrl.value = creds.apiUrl || "https://atlas-ux.onrender.com";
      dom.optNotifyJob.checked = settings.notifyJobComplete !== false;
      dom.optNotifyDecision.checked = settings.notifyDecisionRequest !== false;
      dom.optPollInterval.value = String(settings.pollInterval || 15);
      dom.optAutoConnect.checked = settings.autoConnect !== false;
      dom.optFloatingButton.checked = settings.showFloatingButton === true;
    });
  }

  // ---- Save settings ----
  dom.btnSave.addEventListener("click", () => {
    const apiUrl = dom.optApiUrl.value.trim() || "https://atlas-ux.onrender.com";

    // Update API URL in credentials
    chrome.storage.local.get("atlasCredentials", (data) => {
      const creds = data.atlasCredentials || {};
      creds.apiUrl = apiUrl;
      chrome.storage.local.set({ atlasCredentials: creds });
    });

    // Save all settings
    const settings = {
      notifyJobComplete: dom.optNotifyJob.checked,
      notifyDecisionRequest: dom.optNotifyDecision.checked,
      pollInterval: parseInt(dom.optPollInterval.value, 10),
      autoConnect: dom.optAutoConnect.checked,
      showFloatingButton: dom.optFloatingButton.checked,
    };

    chrome.storage.local.set({ atlasSettings: settings }, () => {
      showToast("Settings saved successfully.");
    });
  });

  // ---- Clear all data ----
  dom.btnClearData.addEventListener("click", () => {
    if (!confirm("This will clear all stored credentials, settings, and cached data. Continue?")) {
      return;
    }

    chrome.storage.local.clear(() => {
      // Reset defaults
      chrome.storage.local.set({
        atlasCredentials: {
          apiUrl: "https://atlas-ux.onrender.com",
          authToken: "",
          tenantId: "",
        },
        atlasSettings: {
          notifyJobComplete: true,
          notifyDecisionRequest: true,
          pollInterval: 15,
          autoConnect: true,
          showFloatingButton: false,
        },
      }, () => {
        loadSettings();
        showToast("All data cleared and defaults restored.");
        // Notify background
        chrome.runtime.sendMessage({ type: "CREDENTIALS_CLEARED" }).catch(() => {});
      });
    });
  });

  // ---- Toast ----
  let toastTimer = null;

  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("visible");

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove("visible");
    }, 2500);
  }

  // ---- Init ----
  loadSettings();
})();
