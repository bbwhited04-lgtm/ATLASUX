/* =============================================
   Atlas UX — Safari Extension Options Page
   ============================================= */

const api = typeof browser !== "undefined" ? browser : chrome;

const $ = (sel) => document.querySelector(sel);

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  bindEvents();
});

// ---------------------------------------------------------------------------
// Load saved settings
// ---------------------------------------------------------------------------

async function loadSettings() {
  try {
    const data = await api.storage.local.get([
      "apiUrl",
      "authToken",
      "tenantId",
      "notifyJobs",
      "notifyDecisions",
      "pollInterval",
    ]);

    if (data.apiUrl) $("#optApiUrl").value = data.apiUrl;
    if (data.authToken) $("#optAuthToken").value = data.authToken;
    if (data.tenantId) $("#optTenantId").value = data.tenantId;

    // Toggles — default to true if not set
    $("#notifyJobs").checked = data.notifyJobs !== false;
    $("#notifyDecisions").checked = data.notifyDecisions !== false;

    // Poll interval
    if (data.pollInterval) {
      $("#pollInterval").value = String(data.pollInterval);
    }
  } catch (_) {
    // first run, no settings yet
  }
}

// ---------------------------------------------------------------------------
// Event binding
// ---------------------------------------------------------------------------

function bindEvents() {
  // Save
  $("#saveBtn").addEventListener("click", saveSettings);

  // Test connection
  $("#testConnectionBtn").addEventListener("click", testConnection);

  // Token visibility toggle
  $("#toggleTokenBtn").addEventListener("click", toggleTokenVisibility);

  // Clear data
  $("#clearDataBtn").addEventListener("click", () => {
    show($("#confirmModal"));
  });
  $("#confirmCancel").addEventListener("click", () => {
    hide($("#confirmModal"));
  });
  $("#confirmClear").addEventListener("click", clearAllData);
}

// ---------------------------------------------------------------------------
// Save settings
// ---------------------------------------------------------------------------

async function saveSettings() {
  const settings = {
    apiUrl: $("#optApiUrl").value.trim().replace(/\/+$/, ""),
    authToken: $("#optAuthToken").value.trim(),
    tenantId: $("#optTenantId").value.trim(),
    notifyJobs: $("#notifyJobs").checked,
    notifyDecisions: $("#notifyDecisions").checked,
    pollInterval: parseInt($("#pollInterval").value, 10),
  };

  try {
    await api.storage.local.set(settings);
    showSaveStatus("Settings saved.");
  } catch (err) {
    showSaveStatus("Failed to save: " + err.message);
  }
}

function showSaveStatus(msg) {
  const el = $("#saveStatus");
  el.textContent = msg;
  show(el);
  setTimeout(() => hide(el), 3000);
}

// ---------------------------------------------------------------------------
// Test connection
// ---------------------------------------------------------------------------

async function testConnection() {
  const urlVal = $("#optApiUrl").value.trim().replace(/\/+$/, "");
  const tokenVal = $("#optAuthToken").value.trim();
  const tenantVal = $("#optTenantId").value.trim();

  if (!urlVal) {
    showConnectionResult("Please enter an API URL.", "error");
    return;
  }

  const btn = $("#testConnectionBtn");
  btn.textContent = "Testing...";
  btn.disabled = true;

  try {
    const headers = { "Content-Type": "application/json" };
    if (tenantVal) headers["x-tenant-id"] = tenantVal;
    if (tokenVal) {
      headers["Authorization"] = tokenVal.startsWith("Bearer ")
        ? tokenVal
        : `Bearer ${tokenVal}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${urlVal}/runtime/status`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      showConnectionResult("Connection successful.", "success");
    } else {
      showConnectionResult(`HTTP ${res.status} — check your credentials.`, "error");
    }
  } catch (err) {
    const msg =
      err.name === "AbortError" ? "Request timed out." : err.message;
    showConnectionResult(`Failed: ${msg}`, "error");
  } finally {
    btn.textContent = "Test";
    btn.disabled = false;
  }
}

function showConnectionResult(msg, type) {
  const el = $("#connectionStatus");
  el.textContent = msg;
  el.className = `connection-result ${type}`;
  show(el);
  setTimeout(() => hide(el), 5000);
}

// ---------------------------------------------------------------------------
// Token visibility
// ---------------------------------------------------------------------------

function toggleTokenVisibility() {
  const input = $("#optAuthToken");
  const eyeOn = $("#eyeIcon");
  const eyeOff = $("#eyeOffIcon");

  if (input.type === "password") {
    input.type = "text";
    hide(eyeOn);
    show(eyeOff);
  } else {
    input.type = "password";
    show(eyeOn);
    hide(eyeOff);
  }
}

// ---------------------------------------------------------------------------
// Clear data
// ---------------------------------------------------------------------------

async function clearAllData() {
  try {
    await api.storage.local.clear();
    hide($("#confirmModal"));

    // Reset form
    $("#optApiUrl").value = "https://atlas-ux.onrender.com/v1";
    $("#optAuthToken").value = "";
    $("#optTenantId").value = "";
    $("#notifyJobs").checked = true;
    $("#notifyDecisions").checked = true;
    $("#pollInterval").value = "15";

    showSaveStatus("All data cleared.");
  } catch (err) {
    showSaveStatus("Failed to clear: " + err.message);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function show(el) {
  if (typeof el === "string") el = $(el);
  el?.classList.remove("hidden");
}

function hide(el) {
  if (typeof el === "string") el = $(el);
  el?.classList.add("hidden");
}
