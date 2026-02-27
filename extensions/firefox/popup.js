/* ═══════════════════════════════════════════════════════
   Atlas UX — Firefox Extension Popup Script
   ═══════════════════════════════════════════════════════ */

const api = typeof browser !== "undefined" ? browser : chrome;

// ─── State ───
let credentials = { apiUrl: "", authToken: "", tenantId: "" };
let selectedAgent = "atlas";
let statsInterval = null;
let activityInterval = null;

// ─── DOM References ───
const $ = (id) => document.getElementById(id);

const els = {
  statusDot: $("statusDot"),
  logoutBtn: $("logoutBtn"),
  loginSection: $("loginSection"),
  mainSection: $("mainSection"),
  // Login form
  apiUrl: $("apiUrl"),
  authToken: $("authToken"),
  tenantId: $("tenantId"),
  loginBtn: $("loginBtn"),
  loginError: $("loginError"),
  // Stats
  statJobs: $("statJobs"),
  statDecisions: $("statDecisions"),
  statAgents: $("statAgents"),
  // Chat
  agentPills: $("agentPills"),
  chatMessages: $("chatMessages"),
  chatInput: $("chatInput"),
  chatSendBtn: $("chatSendBtn"),
  // Activity
  activityFeed: $("activityFeed"),
  refreshActivityBtn: $("refreshActivityBtn"),
  // Quick actions
  newJobBtn: $("newJobBtn"),
  openDashboardBtn: $("openDashboardBtn"),
  // Job modal
  jobModal: $("jobModal"),
  closeJobModal: $("closeJobModal"),
  jobType: $("jobType"),
  jobDesc: $("jobDesc"),
  jobError: $("jobError"),
  cancelJobBtn: $("cancelJobBtn"),
  submitJobBtn: $("submitJobBtn"),
};

// ─── Initialization ───
document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEventListeners();

  try {
    const stored = await api.storage.local.get([
      "atlasApiUrl",
      "atlasAuthToken",
      "atlasTenantId",
    ]);

    if (stored.atlasApiUrl && stored.atlasAuthToken && stored.atlasTenantId) {
      credentials.apiUrl = stored.atlasApiUrl;
      credentials.authToken = stored.atlasAuthToken;
      credentials.tenantId = stored.atlasTenantId;
      await testConnection();
    } else {
      showLogin();
    }
  } catch (err) {
    console.error("Init error:", err);
    showLogin();
  }

  // Check if background script sent context menu data
  try {
    const ctx = await api.storage.local.get([
      "contextAction",
      "contextSelection",
    ]);
    if (ctx.contextAction && ctx.contextSelection) {
      await api.storage.local.remove(["contextAction", "contextSelection"]);
      handleContextAction(ctx.contextAction, ctx.contextSelection);
    }
  } catch (_) {
    // Ignore — no context action pending
  }
}

// ─── Event Listeners ───
function bindEventListeners() {
  els.loginBtn.addEventListener("click", login);
  els.logoutBtn.addEventListener("click", logout);

  // Chat
  els.chatSendBtn.addEventListener("click", () => sendChat());
  els.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });

  // Agent pills
  els.agentPills.addEventListener("click", (e) => {
    const pill = e.target.closest(".agent-pill");
    if (!pill) return;
    document
      .querySelectorAll(".agent-pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    selectedAgent = pill.dataset.agent;
    els.chatInput.placeholder = `Message ${capitalize(selectedAgent)}...`;
  });

  // Activity
  els.refreshActivityBtn.addEventListener("click", fetchActivity);

  // Quick actions
  els.newJobBtn.addEventListener("click", () => {
    els.jobModal.style.display = "flex";
    els.jobDesc.value = "";
    hideError(els.jobError);
  });
  els.openDashboardBtn.addEventListener("click", openDashboard);

  // Modal
  els.closeJobModal.addEventListener("click", () => {
    els.jobModal.style.display = "none";
  });
  els.cancelJobBtn.addEventListener("click", () => {
    els.jobModal.style.display = "none";
  });
  els.submitJobBtn.addEventListener("click", submitJob);
  els.jobModal.addEventListener("click", (e) => {
    if (e.target === els.jobModal) els.jobModal.style.display = "none";
  });

  // Enter key on login fields
  [els.apiUrl, els.authToken, els.tenantId].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") login();
    });
  });
}

// ─── Login / Logout ───
async function login() {
  const apiUrl = els.apiUrl.value.trim().replace(/\/+$/, "");
  const authToken = els.authToken.value.trim();
  const tenantIdVal = els.tenantId.value.trim();

  if (!apiUrl || !authToken || !tenantIdVal) {
    showError(els.loginError, "All fields are required.");
    return;
  }

  hideError(els.loginError);
  setLoginLoading(true);

  credentials.apiUrl = apiUrl;
  credentials.authToken = authToken;
  credentials.tenantId = tenantIdVal;

  try {
    await testConnection();
    // Save credentials
    await api.storage.local.set({
      atlasApiUrl: apiUrl,
      atlasAuthToken: authToken,
      atlasTenantId: tenantIdVal,
    });
  } catch (err) {
    showError(
      els.loginError,
      err.message || "Connection failed. Check your credentials."
    );
    setStatus("disconnected");
    setLoginLoading(false);
  }
}

async function logout() {
  stopPolling();
  await api.storage.local.remove([
    "atlasApiUrl",
    "atlasAuthToken",
    "atlasTenantId",
  ]);
  credentials = { apiUrl: "", authToken: "", tenantId: "" };
  setStatus("disconnected");
  showLogin();

  // Clear badge
  try {
    await api.action.setBadgeText({ text: "" });
  } catch (_) {}
}

async function testConnection() {
  setStatus("connecting");

  const res = await apiRequest("GET", "/runtime/status");

  if (!res.ok) {
    throw new Error(`Server returned ${res.status}`);
  }

  setStatus("connected");
  showMain();
  setLoginLoading(false);

  // Initial data fetch
  fetchStats();
  fetchActivity();
  startPolling();
}

// ─── UI State ───
function showLogin() {
  els.loginSection.style.display = "block";
  els.mainSection.style.display = "none";
  els.logoutBtn.style.display = "none";

  // Pre-fill default URL
  if (!els.apiUrl.value) {
    els.apiUrl.value = "https://atlas-ux.onrender.com/v1";
  }
}

function showMain() {
  els.loginSection.style.display = "none";
  els.mainSection.style.display = "block";
  els.mainSection.classList.add("fade-in");
  els.logoutBtn.style.display = "flex";
}

function setStatus(status) {
  els.statusDot.className = `status-dot ${status}`;
  const titles = {
    connected: "Connected",
    connecting: "Connecting...",
    disconnected: "Disconnected",
  };
  els.statusDot.title = titles[status] || "Unknown";
}

function setLoginLoading(loading) {
  els.loginBtn.disabled = loading;
  els.loginBtn.querySelector(".btn-text").style.display = loading
    ? "none"
    : "inline";
  els.loginBtn.querySelector(".btn-spinner").style.display = loading
    ? "inline-block"
    : "none";
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = "block";
}

function hideError(el) {
  el.textContent = "";
  el.style.display = "none";
}

// ─── Stats ───
async function fetchStats() {
  try {
    // Fetch active jobs count
    const jobsRes = await apiRequest("GET", "/jobs?status=running&limit=1");
    if (jobsRes.ok) {
      const jobsData = await jobsRes.json();
      const count =
        jobsData.total ?? jobsData.count ?? jobsData.data?.length ?? 0;
      els.statJobs.textContent = count;
    }
  } catch (_) {
    els.statJobs.textContent = "--";
  }

  try {
    // Fetch pending decisions count
    const decRes = await apiRequest(
      "GET",
      "/decisions?status=pending&limit=1"
    );
    if (decRes.ok) {
      const decData = await decRes.json();
      const count =
        decData.total ?? decData.count ?? decData.data?.length ?? 0;
      els.statDecisions.textContent = count;
    }
  } catch (_) {
    els.statDecisions.textContent = "--";
  }

  try {
    // Fetch agent count
    const agentRes = await apiRequest("GET", "/agents?limit=1");
    if (agentRes.ok) {
      const agentData = await agentRes.json();
      const count =
        agentData.total ?? agentData.count ?? agentData.data?.length ?? 0;
      els.statAgents.textContent = count;
    }
  } catch (_) {
    els.statAgents.textContent = "--";
  }
}

// ─── Chat ───
async function sendChat() {
  const msg = els.chatInput.value.trim();
  if (!msg) return;

  // Clear placeholder
  const placeholder = els.chatMessages.querySelector(".chat-placeholder");
  if (placeholder) placeholder.remove();

  // Render user bubble
  appendBubble("user", msg);
  els.chatInput.value = "";
  els.chatSendBtn.disabled = true;

  // Show typing indicator
  const typingEl = appendTypingIndicator();

  try {
    const res = await apiRequest("POST", "/chat", {
      message: msg,
      agent: selectedAgent,
    });

    typingEl.remove();

    if (res.ok) {
      const data = await res.json();
      const reply =
        data.reply ??
        data.response ??
        data.message ??
        data.data?.reply ??
        "No response received.";
      appendBubble("agent", reply, selectedAgent);
    } else {
      appendBubble(
        "agent",
        `Error: Server returned ${res.status}`,
        selectedAgent
      );
    }
  } catch (err) {
    typingEl.remove();
    appendBubble("agent", `Error: ${err.message}`, selectedAgent);
  }

  els.chatSendBtn.disabled = false;
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

function appendBubble(type, text, agentName) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${type}`;

  if (type === "agent" && agentName) {
    const nameSpan = document.createElement("span");
    nameSpan.className = "agent-name";
    nameSpan.textContent = capitalize(agentName);
    div.appendChild(nameSpan);
  }

  const textNode = document.createTextNode(text);
  div.appendChild(textNode);
  els.chatMessages.appendChild(div);
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  return div;
}

function appendTypingIndicator() {
  const div = document.createElement("div");
  div.className = "chat-bubble agent typing";
  div.innerHTML = `
    <span class="agent-name">${capitalize(selectedAgent)}</span>
    <span class="typing-dots"><span></span><span></span><span></span></span>
  `;
  els.chatMessages.appendChild(div);
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  return div;
}

// ─── Activity Feed ───
async function fetchActivity() {
  try {
    const res = await apiRequest("GET", "/audit?limit=5");
    if (!res.ok) {
      els.activityFeed.innerHTML =
        '<div class="activity-placeholder">Failed to load activity</div>';
      return;
    }

    const data = await res.json();
    const entries = data.data ?? data.entries ?? data ?? [];

    if (!Array.isArray(entries) || entries.length === 0) {
      els.activityFeed.innerHTML =
        '<div class="activity-placeholder">No recent activity</div>';
      return;
    }

    els.activityFeed.innerHTML = "";
    entries.slice(0, 5).forEach((entry) => {
      const item = document.createElement("div");
      item.className = "activity-item";

      const level = (entry.level || "info").toLowerCase();
      const levelClass = ["error", "warn", "success", "debug"].includes(level)
        ? level
        : "info";

      const actor =
        entry.actorExternalId || entry.actorUserId || entry.actor || "";
      const agentName = actor.split("@")[0] || "system";
      const timeAgo = relativeTime(entry.timestamp || entry.createdAt);

      item.innerHTML = `
        <div class="activity-level-bar ${levelClass}"></div>
        <div class="activity-content">
          <div class="activity-action" title="${escapeHtml(entry.action || entry.message || "")}">${escapeHtml(entry.action || entry.message || "Unknown action")}</div>
          <div class="activity-meta">
            <span class="activity-agent">${escapeHtml(agentName)}</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      `;
      els.activityFeed.appendChild(item);
    });
  } catch (err) {
    els.activityFeed.innerHTML =
      '<div class="activity-placeholder">Error loading activity</div>';
  }
}

// ─── Job Creation ───
async function submitJob() {
  const type = els.jobType.value;
  const desc = els.jobDesc.value.trim();

  if (!desc) {
    showError(els.jobError, "Description is required.");
    return;
  }

  hideError(els.jobError);
  els.submitJobBtn.disabled = true;
  els.submitJobBtn.textContent = "Creating...";

  try {
    const res = await apiRequest("POST", "/jobs", {
      type,
      description: desc,
      payload: { description: desc },
    });

    if (res.ok) {
      els.jobModal.style.display = "none";
      els.jobDesc.value = "";
      fetchStats();
      fetchActivity();
    } else {
      const errData = await res.json().catch(() => ({}));
      showError(
        els.jobError,
        errData.message || errData.error || `Failed (${res.status})`
      );
    }
  } catch (err) {
    showError(els.jobError, err.message);
  }

  els.submitJobBtn.disabled = false;
  els.submitJobBtn.textContent = "Create Job";
}

// ─── Dashboard ───
function openDashboard() {
  const baseUrl = credentials.apiUrl
    .replace("/v1", "")
    .replace("atlas-ux.onrender.com", "atlasux.vercel.app");
  api.tabs.create({ url: baseUrl + "/#/app/dashboard" });
}

// ─── Context Menu Action Handler ───
function handleContextAction(action, selection) {
  if (!selection) return;

  const placeholder = els.chatMessages.querySelector(".chat-placeholder");
  if (placeholder) placeholder.remove();

  const agentMap = {
    askAtlas: "atlas",
    sendToCheryl: "cheryl",
    researchArchy: "archy",
  };

  const promptMap = {
    askAtlas: `Analyze this: "${selection}"`,
    sendToCheryl: `Customer inquiry about: "${selection}"`,
    researchArchy: `Research this topic: "${selection}"`,
  };

  const agent = agentMap[action] || "atlas";
  const prompt = promptMap[action] || selection;

  // Switch to the correct agent pill
  document
    .querySelectorAll(".agent-pill")
    .forEach((p) => p.classList.remove("active"));
  const matchingPill = document.querySelector(
    `.agent-pill[data-agent="${agent}"]`
  );
  if (matchingPill) matchingPill.classList.add("active");
  selectedAgent = agent;
  els.chatInput.placeholder = `Message ${capitalize(agent)}...`;

  // Send the message
  els.chatInput.value = prompt;
  sendChat();
}

// ─── Polling ───
function startPolling() {
  stopPolling();
  activityInterval = setInterval(fetchActivity, 15000);
  statsInterval = setInterval(fetchStats, 30000);
}

function stopPolling() {
  if (activityInterval) clearInterval(activityInterval);
  if (statsInterval) clearInterval(statsInterval);
  activityInterval = null;
  statsInterval = null;
}

// ─── API Helper ───
async function apiRequest(method, path, body) {
  const url = `${credentials.apiUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${credentials.authToken}`,
    "x-tenant-id": credentials.tenantId,
  };

  const options = { method, headers };
  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  return fetch(url, options);
}

// ─── Utilities ───
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function relativeTime(timestamp) {
  if (!timestamp) return "";
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (isNaN(diffMs) || diffMs < 0) return "just now";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
