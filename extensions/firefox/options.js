/* ═══════════════════════════════════════════════════════
   Atlas UX — Firefox Extension Options Page Script
   ═══════════════════════════════════════════════════════ */

const api = typeof browser !== "undefined" ? browser : chrome;

// ─── DOM References ───
const els = {
  apiUrl: document.getElementById("optApiUrl"),
  authToken: document.getElementById("optAuthToken"),
  tenantId: document.getElementById("optTenantId"),
  testBtn: document.getElementById("optTestBtn"),
  testResult: document.getElementById("optTestResult"),
  notifyJobs: document.getElementById("optNotifyJobs"),
  notifyDecisions: document.getElementById("optNotifyDecisions"),
  notifyAgents: document.getElementById("optNotifyAgents"),
  pollInterval: document.getElementById("optPollInterval"),
  clearBtn: document.getElementById("optClearBtn"),
  saveBtn: document.getElementById("optSaveBtn"),
  feedback: document.getElementById("optFeedback"),
};

// ─── Load Settings on Page Load ───
document.addEventListener("DOMContentLoaded", loadSettings);

async function loadSettings() {
  try {
    const stored = await api.storage.local.get([
      "atlasApiUrl",
      "atlasAuthToken",
      "atlasTenantId",
      "atlasNotifyJobs",
      "atlasNotifyDecisions",
      "atlasNotifyAgents",
      "atlasPollInterval",
    ]);

    els.apiUrl.value =
      stored.atlasApiUrl || "https://atlas-ux.onrender.com/v1";
    els.authToken.value = stored.atlasAuthToken || "";
    els.tenantId.value = stored.atlasTenantId || "";

    // Notification toggles default to true if not set
    els.notifyJobs.checked =
      stored.atlasNotifyJobs !== undefined ? stored.atlasNotifyJobs : true;
    els.notifyDecisions.checked =
      stored.atlasNotifyDecisions !== undefined
        ? stored.atlasNotifyDecisions
        : true;
    els.notifyAgents.checked = stored.atlasNotifyAgents || false;

    els.pollInterval.value = stored.atlasPollInterval || "60";
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
}

// ─── Test Connection ───
els.testBtn.addEventListener("click", async () => {
  const urlVal = els.apiUrl.value.trim().replace(/\/+$/, "");
  const token = els.authToken.value.trim();
  const tenant = els.tenantId.value.trim();

  if (!urlVal || !token || !tenant) {
    showTestResult("error", "All connection fields are required.");
    return;
  }

  els.testBtn.disabled = true;
  els.testBtn.textContent = "Testing...";
  showTestResult("info", "Connecting...");

  try {
    const res = await fetch(`${urlVal}/runtime/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenant,
      },
    });

    if (res.ok) {
      const data = await res.json();
      showTestResult(
        "success",
        `Connected successfully. Status: ${data.status || "ok"}`
      );
    } else {
      showTestResult("error", `Server returned HTTP ${res.status}.`);
    }
  } catch (err) {
    showTestResult("error", `Connection failed: ${err.message}`);
  }

  els.testBtn.disabled = false;
  els.testBtn.textContent = "Test Connection";
});

function showTestResult(type, message) {
  els.testResult.style.display = "block";
  els.testResult.className =
    type === "success"
      ? "success-msg"
      : type === "error"
        ? "error-msg"
        : "success-msg";
  if (type === "info") {
    els.testResult.style.color = "#06b6d4";
    els.testResult.style.borderColor = "rgba(6,182,212,0.15)";
    els.testResult.style.background = "rgba(6,182,212,0.08)";
  }
  els.testResult.textContent = message;
}

// ─── Save Settings ───
els.saveBtn.addEventListener("click", async () => {
  const apiUrl = els.apiUrl.value.trim().replace(/\/+$/, "");
  const authToken = els.authToken.value.trim();
  const tenantId = els.tenantId.value.trim();

  if (!apiUrl) {
    showFeedback("error", "API URL is required.");
    return;
  }

  els.saveBtn.disabled = true;
  els.saveBtn.textContent = "Saving...";

  try {
    await api.storage.local.set({
      atlasApiUrl: apiUrl,
      atlasAuthToken: authToken,
      atlasTenantId: tenantId,
      atlasNotifyJobs: els.notifyJobs.checked,
      atlasNotifyDecisions: els.notifyDecisions.checked,
      atlasNotifyAgents: els.notifyAgents.checked,
      atlasPollInterval: els.pollInterval.value,
    });

    // Notify background to refresh badge with new settings
    api.runtime.sendMessage({ type: "refreshBadge" }).catch(() => {});

    showFeedback("success", "Settings saved successfully.");
  } catch (err) {
    showFeedback("error", `Failed to save: ${err.message}`);
  }

  els.saveBtn.disabled = false;
  els.saveBtn.textContent = "Save Settings";
});

// ─── Clear Data ───
els.clearBtn.addEventListener("click", async () => {
  if (!confirm("Clear all Atlas UX extension data? You will need to reconnect.")) {
    return;
  }

  try {
    await api.storage.local.clear();

    // Clear badge
    api.action.setBadgeText({ text: "" }).catch(() => {});

    // Reset form fields
    els.apiUrl.value = "https://atlas-ux.onrender.com/v1";
    els.authToken.value = "";
    els.tenantId.value = "";
    els.notifyJobs.checked = true;
    els.notifyDecisions.checked = true;
    els.notifyAgents.checked = false;
    els.pollInterval.value = "60";

    els.testResult.style.display = "none";
    showFeedback("success", "All data cleared.");
  } catch (err) {
    showFeedback("error", `Failed to clear data: ${err.message}`);
  }
});

// ─── Feedback ───
function showFeedback(type, message) {
  els.feedback.style.display = "block";
  els.feedback.className = type === "success" ? "success-msg" : "error-msg";
  els.feedback.textContent = message;

  // Auto-hide after 4 seconds
  setTimeout(() => {
    els.feedback.style.display = "none";
  }, 4000);
}
