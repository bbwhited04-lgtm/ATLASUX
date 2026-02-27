/* ===================================================================
   Atlas UX — Chrome Extension Popup Logic
   =================================================================== */

(() => {
  "use strict";

  // ---- State ----
  let credentials = null;       // { apiUrl, authToken, tenantId }
  let selectedAgent = "atlas";
  let activityTimer = null;

  // ---- DOM refs ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    connectionStatus: $("#connectionStatus"),
    loginSection:     $("#loginSection"),
    mainSection:      $("#mainSection"),
    loginForm:        $("#loginForm"),
    loginError:       $("#loginError"),
    btnLogin:         $("#btnLogin"),
    btnLogout:        $("#btnLogout"),
    btnSettings:      $("#btnSettings"),
    inputApiUrl:      $("#inputApiUrl"),
    inputAuthToken:   $("#inputAuthToken"),
    inputTenantId:    $("#inputTenantId"),
    statJobs:         $("#statJobs"),
    statDecisions:    $("#statDecisions"),
    statAgents:       $("#statAgents"),
    chatMessages:     $("#chatMessages"),
    chatForm:         $("#chatForm"),
    chatInput:        $("#chatInput"),
    activityFeed:     $("#activityFeed"),
    btnRefreshActivity: $("#btnRefreshActivity"),
    btnNewJob:        $("#btnNewJob"),
    btnDashboard:     $("#btnDashboard"),
    newJobModal:      $("#newJobModal"),
    btnCloseModal:    $("#btnCloseModal"),
    newJobForm:       $("#newJobForm"),
    jobError:         $("#jobError"),
    footerSettingsLink: $("#footerSettingsLink"),
  };

  // ---- API helpers ----
  function apiHeaders() {
    const h = {
      "Content-Type": "application/json",
    };
    if (credentials?.authToken) h["Authorization"] = `Bearer ${credentials.authToken}`;
    if (credentials?.tenantId) h["x-tenant-id"] = credentials.tenantId;
    return h;
  }

  function apiUrl(path) {
    const base = (credentials?.apiUrl || "https://atlas-ux.onrender.com").replace(/\/+$/, "");
    return `${base}${path}`;
  }

  async function apiFetch(path, opts = {}) {
    const url = apiUrl(path);
    const res = await fetch(url, {
      headers: apiHeaders(),
      ...opts,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }

  // ---- Storage helpers ----
  function saveCredentials(creds) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ atlasCredentials: creds }, resolve);
    });
  }

  function loadCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.get("atlasCredentials", (data) => {
        resolve(data.atlasCredentials || null);
      });
    });
  }

  function clearCredentials() {
    return new Promise((resolve) => {
      chrome.storage.local.remove("atlasCredentials", resolve);
    });
  }

  // ---- UI state management ----
  function showLogin() {
    dom.loginSection.style.display = "";
    dom.mainSection.style.display = "none";
    dom.btnLogout.style.display = "none";
    dom.connectionStatus.className = "status-dot disconnected";
    dom.connectionStatus.title = "Disconnected";
    stopActivityPolling();
  }

  function showMain() {
    dom.loginSection.style.display = "none";
    dom.mainSection.style.display = "";
    dom.btnLogout.style.display = "";
    dom.connectionStatus.className = "status-dot connected";
    dom.connectionStatus.title = "Connected";
    fetchStats();
    fetchActivity();
    startActivityPolling();
  }

  function setConnectionError() {
    dom.connectionStatus.className = "status-dot error";
    dom.connectionStatus.title = "Connection error";
  }

  // ---- Login ----
  dom.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    dom.loginError.style.display = "none";

    const apiUrlVal = dom.inputApiUrl.value.trim() || "https://atlas-ux.onrender.com";
    const authToken = dom.inputAuthToken.value.trim();
    const tenantId  = dom.inputTenantId.value.trim();

    if (!authToken) {
      showLoginError("Auth token is required.");
      return;
    }
    if (!tenantId) {
      showLoginError("Tenant ID is required.");
      return;
    }

    setLoginLoading(true);

    // Temporarily set credentials to test connection
    credentials = { apiUrl: apiUrlVal, authToken, tenantId };

    try {
      await apiFetch("/v1/runtime/status");
      await saveCredentials(credentials);
      // Notify background
      chrome.runtime.sendMessage({ type: "CREDENTIALS_UPDATED", credentials });
      showMain();
    } catch (err) {
      credentials = null;
      showLoginError(`Connection failed: ${err.message}`);
      setConnectionError();
    } finally {
      setLoginLoading(false);
    }
  });

  function showLoginError(msg) {
    dom.loginError.textContent = msg;
    dom.loginError.style.display = "";
  }

  function setLoginLoading(loading) {
    const btnText = dom.btnLogin.querySelector(".btn-text");
    const spinner = dom.btnLogin.querySelector(".btn-spinner");
    dom.btnLogin.disabled = loading;
    btnText.style.display = loading ? "none" : "";
    spinner.style.display = loading ? "" : "none";
  }

  // ---- Logout ----
  dom.btnLogout.addEventListener("click", async () => {
    credentials = null;
    await clearCredentials();
    chrome.runtime.sendMessage({ type: "CREDENTIALS_CLEARED" });
    dom.chatMessages.innerHTML = '<div class="chat-empty">Select an agent and start chatting.</div>';
    showLogin();
  });

  // ---- Settings ----
  dom.btnSettings.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  dom.footerSettingsLink.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // ---- Stats ----
  async function fetchStats() {
    // Active jobs
    try {
      const data = await apiFetch("/v1/jobs?status=running&limit=1");
      const count = data?.total ?? data?.jobs?.length ?? "--";
      dom.statJobs.textContent = count;
    } catch {
      dom.statJobs.textContent = "--";
    }

    // Pending decisions
    try {
      const data = await apiFetch("/v1/decisions?status=pending&limit=1");
      const count = data?.total ?? data?.decisions?.length ?? "--";
      dom.statDecisions.textContent = count;
    } catch {
      dom.statDecisions.textContent = "--";
    }

    // Agents — use agent roster count as static or fetch
    try {
      const data = await apiFetch("/v1/agents");
      const arr = data?.agents || data || [];
      const online = Array.isArray(arr) ? arr.filter(a => a.status === "active" || a.status === "online").length : arr.length;
      dom.statAgents.textContent = online || (Array.isArray(arr) ? arr.length : "--");
    } catch {
      dom.statAgents.textContent = "--";
    }
  }

  // ---- Chat ----
  // Agent selector
  $$(".agent-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      $$(".agent-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      selectedAgent = pill.dataset.agent;
    });
  });

  dom.chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = dom.chatInput.value.trim();
    if (!msg) return;

    appendChatBubble("user", msg);
    dom.chatInput.value = "";

    // Show typing indicator
    const typingEl = appendChatBubble("agent", "Thinking...", selectedAgent, true);

    try {
      const data = await apiFetch("/v1/chat", {
        method: "POST",
        body: JSON.stringify({
          message: msg,
          agent: selectedAgent,
        }),
      });
      typingEl.remove();
      const reply = data?.reply || data?.message || data?.response || JSON.stringify(data);
      appendChatBubble("agent", reply, selectedAgent);
    } catch (err) {
      typingEl.remove();
      appendChatBubble("agent", `Error: ${err.message}`, selectedAgent);
    }
  });

  function appendChatBubble(role, text, agentName, isTyping) {
    // Clear empty placeholder
    const empty = dom.chatMessages.querySelector(".chat-empty");
    if (empty) empty.remove();

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}${isTyping ? " typing" : ""}`;

    if (role === "agent" && agentName) {
      const nameEl = document.createElement("div");
      nameEl.className = "agent-name";
      nameEl.textContent = agentName;
      bubble.appendChild(nameEl);
    }

    const textEl = document.createElement("div");
    textEl.textContent = text;
    bubble.appendChild(textEl);

    dom.chatMessages.appendChild(bubble);
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    return bubble;
  }

  // ---- Activity Feed ----
  async function fetchActivity() {
    try {
      const data = await apiFetch("/v1/audit?limit=5");
      const entries = data?.entries || data?.logs || data || [];
      renderActivity(Array.isArray(entries) ? entries : []);
    } catch {
      dom.activityFeed.innerHTML = '<div class="activity-empty">Could not load activity.</div>';
    }
  }

  function renderActivity(entries) {
    if (!entries.length) {
      dom.activityFeed.innerHTML = '<div class="activity-empty">No recent activity.</div>';
      return;
    }

    dom.activityFeed.innerHTML = entries.map((entry) => {
      const iconClass = getActivityIconClass(entry);
      const iconChar = getActivityIconChar(entry);
      const msg = entry.message || entry.action || "Activity";
      const time = formatTime(entry.timestamp || entry.createdAt);
      return `
        <div class="activity-item">
          <div class="activity-icon ${iconClass}">${iconChar}</div>
          <div class="activity-body">
            <div class="activity-msg">${escapeHtml(msg)}</div>
            <div class="activity-time">${time}</div>
          </div>
        </div>
      `;
    }).join("");
  }

  function getActivityIconClass(entry) {
    const action = (entry.action || entry.entityType || "").toLowerCase();
    if (action.includes("job")) return "job";
    if (action.includes("decision")) return "decision";
    if (action.includes("agent")) return "agent";
    if (action.includes("error") || action.includes("fail")) return "error";
    return "default";
  }

  function getActivityIconChar(entry) {
    const action = (entry.action || entry.entityType || "").toLowerCase();
    if (action.includes("job")) return "J";
    if (action.includes("decision")) return "D";
    if (action.includes("agent")) return "A";
    if (action.includes("error") || action.includes("fail")) return "!";
    return "~";
  }

  function formatTime(ts) {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return "just now";
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  dom.btnRefreshActivity.addEventListener("click", fetchActivity);

  function startActivityPolling() {
    stopActivityPolling();
    // Load poll interval from storage, default 15s
    chrome.storage.local.get("atlasSettings", (data) => {
      const interval = (data.atlasSettings?.pollInterval || 15) * 1000;
      activityTimer = setInterval(() => {
        fetchActivity();
        fetchStats();
      }, interval);
    });
  }

  function stopActivityPolling() {
    if (activityTimer) {
      clearInterval(activityTimer);
      activityTimer = null;
    }
  }

  // ---- New Job Modal ----
  dom.btnNewJob.addEventListener("click", () => {
    dom.newJobModal.style.display = "";
    dom.jobError.style.display = "none";
  });
  dom.btnCloseModal.addEventListener("click", () => {
    dom.newJobModal.style.display = "none";
  });
  dom.newJobModal.querySelector(".modal-backdrop").addEventListener("click", () => {
    dom.newJobModal.style.display = "none";
  });

  dom.newJobForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    dom.jobError.style.display = "none";

    const jobType = $("#jobType").value;
    const description = $("#jobDescription").value.trim();
    if (!description) {
      dom.jobError.textContent = "Description is required.";
      dom.jobError.style.display = "";
      return;
    }

    try {
      await apiFetch("/v1/jobs", {
        method: "POST",
        body: JSON.stringify({
          type: jobType,
          description,
          priority: "normal",
        }),
      });
      dom.newJobModal.style.display = "none";
      $("#jobDescription").value = "";
      fetchStats();
      fetchActivity();
    } catch (err) {
      dom.jobError.textContent = `Failed: ${err.message}`;
      dom.jobError.style.display = "";
    }
  });

  // ---- Dashboard button ----
  dom.btnDashboard.addEventListener("click", () => {
    const base = credentials?.apiUrl || "https://atlas-ux.onrender.com";
    // The web app is typically on a different domain — open the frontend
    // For now, open the API root or a known frontend URL
    const webAppUrl = base.replace(/\/v1\/?$/, "").replace("atlas-ux.onrender.com", "atlasux.vercel.app");
    chrome.tabs.create({ url: webAppUrl });
  });

  // ---- Context menu text from background ----
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "CONTEXT_MENU_TEXT") {
      dom.chatInput.value = msg.text;
      if (msg.agent) {
        selectedAgent = msg.agent;
        $$(".agent-pill").forEach((p) => {
          p.classList.toggle("active", p.dataset.agent === msg.agent);
        });
      }
      // Show main section if logged in
      if (credentials) {
        showMain();
      }
      sendResponse({ ok: true });
    }
  });

  // ---- Init ----
  async function init() {
    credentials = await loadCredentials();
    if (credentials?.authToken && credentials?.tenantId) {
      // Pre-fill form for reference
      dom.inputApiUrl.value = credentials.apiUrl || "";
      dom.inputAuthToken.value = credentials.authToken || "";
      dom.inputTenantId.value = credentials.tenantId || "";

      // Test connection
      try {
        await apiFetch("/v1/runtime/status");
        showMain();
      } catch {
        setConnectionError();
        showMain(); // Still show main, stats will show --
      }
    } else {
      dom.inputApiUrl.value = "https://atlas-ux.onrender.com";
      showLogin();
    }
  }

  init();
})();
