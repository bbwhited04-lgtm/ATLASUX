/* =============================================
   Atlas UX — Safari Extension Popup
   ============================================= */

const api = typeof browser !== "undefined" ? browser : chrome;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let credentials = { apiUrl: "", authToken: "", tenantId: "" };
let selectedAgent = "atlas";
let pollIntervals = { activity: null, stats: null };

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function show(el) {
  if (typeof el === "string") el = $(el);
  el?.classList.remove("hidden");
}

function hide(el) {
  if (typeof el === "string") el = $(el);
  el?.classList.add("hidden");
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();

  try {
    const data = await api.storage.local.get([
      "apiUrl",
      "authToken",
      "tenantId",
    ]);
    if (data.apiUrl && data.authToken && data.tenantId) {
      credentials.apiUrl = data.apiUrl;
      credentials.authToken = data.authToken;
      credentials.tenantId = data.tenantId;
      $("#apiUrl").value = credentials.apiUrl;
      $("#authToken").value = credentials.authToken;
      $("#tenantId").value = credentials.tenantId;
      await enterConnectedState();
    }
  } catch (_) {
    // storage unavailable or empty — stay on login
  }

  // Check if background sent us context-menu data
  try {
    const ctx = await api.storage.local.get(["contextAction", "contextText"]);
    if (ctx.contextAction && ctx.contextText) {
      // Clear the stored context immediately
      await api.storage.local.remove(["contextAction", "contextText"]);
      handleContextAction(ctx.contextAction, ctx.contextText);
    }
  } catch (_) {
    // no context data
  }
}

// ---------------------------------------------------------------------------
// Event binding
// ---------------------------------------------------------------------------

function bindEvents() {
  // Login
  $("#connectBtn").addEventListener("click", login);
  $("#authToken").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });
  $("#tenantId").addEventListener("keydown", (e) => {
    if (e.key === "Enter") login();
  });

  // Settings
  $("#settingsBtn").addEventListener("click", () => {
    api.runtime.openOptionsPage();
  });

  // Agent pills
  $$("#agentPills .agent-pill").forEach((pill) => {
    pill.addEventListener("click", () => selectAgent(pill.dataset.agent));
  });

  // Chat
  $("#sendBtn").addEventListener("click", handleSend);
  $("#chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Activity
  $("#refreshActivityBtn").addEventListener("click", fetchActivity);

  // Quick actions
  $("#newJobBtn").addEventListener("click", () => show("#jobModal"));
  $("#openDashboardBtn").addEventListener("click", openDashboard);
  $("#logoutBtn").addEventListener("click", logout);

  // Job modal
  $("#closeModalBtn").addEventListener("click", () => hide("#jobModal"));
  $("#submitJobBtn").addEventListener("click", submitJob);
  $("#jobModal").addEventListener("click", (e) => {
    if (e.target.id === "jobModal") hide("#jobModal");
  });
}

// ---------------------------------------------------------------------------
// Auth / Connection
// ---------------------------------------------------------------------------

async function login() {
  const urlVal = $("#apiUrl").value.trim();
  const tokenVal = $("#authToken").value.trim();
  const tenantVal = $("#tenantId").value.trim();

  if (!urlVal || !tokenVal || !tenantVal) {
    showLoginError("All fields are required.");
    return;
  }

  hide("#loginError");
  show("#connectSpinner");
  $("#connectBtnText").textContent = "Connecting...";
  $("#connectBtn").disabled = true;

  credentials.apiUrl = urlVal.replace(/\/+$/, "");
  credentials.authToken = tokenVal;
  credentials.tenantId = tenantVal;

  try {
    await apiRequest("GET", "/runtime/status");
    // Save credentials
    await api.storage.local.set({
      apiUrl: credentials.apiUrl,
      authToken: credentials.authToken,
      tenantId: credentials.tenantId,
    });
    await enterConnectedState();
  } catch (err) {
    showLoginError(err.message || "Connection failed.");
  } finally {
    hide("#connectSpinner");
    $("#connectBtnText").textContent = "Connect";
    $("#connectBtn").disabled = false;
  }
}

function showLoginError(msg) {
  const el = $("#loginError");
  el.textContent = msg;
  show(el);
}

async function logout() {
  stopPolling();
  credentials = { apiUrl: "", authToken: "", tenantId: "" };
  await api.storage.local.remove(["apiUrl", "authToken", "tenantId"]);

  // Reset UI
  hide("#mainView");
  show("#loginView");
  setConnectionDot("offline");
  $("#chatMessages").innerHTML =
    '<div class="chat-empty">Select an agent and send a message.</div>';
  $("#activityFeed").innerHTML =
    '<div class="activity-empty">No recent activity.</div>';
  $("#statJobs").textContent = "--";
  $("#statDecisions").textContent = "--";
  $("#statAgents").textContent = "--";
}

async function enterConnectedState() {
  hide("#loginView");
  show("#mainView");
  setConnectionDot("online");

  // Initial data load
  fetchStats();
  fetchActivity();
  startPolling();
}

// ---------------------------------------------------------------------------
// Connection indicator
// ---------------------------------------------------------------------------

function setConnectionDot(state) {
  const dot = $("#connectionDot");
  dot.className = "connection-status " + state;
  dot.title =
    state === "online"
      ? "Connected"
      : state === "idle"
        ? "Reconnecting..."
        : "Disconnected";
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

async function fetchStats() {
  try {
    const [jobsRes, decisionsRes] = await Promise.allSettled([
      apiRequest("GET", "/jobs?status=running&limit=1"),
      apiRequest("GET", "/decisions?status=pending&limit=1"),
    ]);

    // Active jobs
    if (jobsRes.status === "fulfilled") {
      const jobs = jobsRes.value;
      const count =
        typeof jobs.total === "number"
          ? jobs.total
          : Array.isArray(jobs)
            ? jobs.length
            : 0;
      $("#statJobs").textContent = count;
    }

    // Pending decisions
    if (decisionsRes.status === "fulfilled") {
      const decs = decisionsRes.value;
      const count =
        typeof decs.total === "number"
          ? decs.total
          : Array.isArray(decs)
            ? decs.length
            : 0;
      $("#statDecisions").textContent = count;
    }

    // Agent count — use the agent roster constant
    $("#statAgents").textContent = "27";

    // Update badge via background
    const jobCount = $("#statJobs").textContent;
    if (jobCount !== "--") {
      try {
        await api.runtime.sendMessage({
          type: "updateBadge",
          count: parseInt(jobCount, 10),
        });
      } catch (_) {
        // background may not be listening
      }
    }
  } catch (_) {
    // silently fail — will retry on next poll
  }
}

// ---------------------------------------------------------------------------
// Agent Chat
// ---------------------------------------------------------------------------

function selectAgent(agent) {
  selectedAgent = agent;
  $$("#agentPills .agent-pill").forEach((p) => {
    p.classList.toggle("active", p.dataset.agent === agent);
  });
  $("#chatInput").placeholder = `Message ${capitalize(agent)}...`;
}

async function handleSend() {
  const input = $("#chatInput");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  appendChatBubble(text, "user");
  appendTypingIndicator();

  try {
    const res = await sendChat(text, selectedAgent);
    removeTypingIndicator();
    const reply =
      res.reply || res.message || res.response || JSON.stringify(res);
    appendChatBubble(reply, "agent", selectedAgent);
  } catch (err) {
    removeTypingIndicator();
    appendChatBubble(`Error: ${err.message}`, "agent", selectedAgent);
  }
}

async function sendChat(message, agent) {
  return apiRequest("POST", "/chat", { message, agentSlug: agent });
}

function appendChatBubble(text, type, agentName) {
  const container = $("#chatMessages");
  // Clear empty state
  const empty = container.querySelector(".chat-empty");
  if (empty) empty.remove();

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${type}`;

  if (type === "agent" && agentName) {
    const nameEl = document.createElement("span");
    nameEl.className = "agent-name";
    nameEl.textContent = capitalize(agentName);
    bubble.appendChild(nameEl);
  }

  const textNode = document.createElement("span");
  textNode.textContent = text;
  bubble.appendChild(textNode);

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = $("#chatMessages");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble agent typing";
  bubble.id = "typingIndicator";

  const nameEl = document.createElement("span");
  nameEl.className = "agent-name";
  nameEl.textContent = capitalize(selectedAgent);
  bubble.appendChild(nameEl);

  const dots = document.createElement("span");
  dots.textContent = "Thinking...";
  bubble.appendChild(dots);

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
  const el = $("#typingIndicator");
  if (el) el.remove();
}

// ---------------------------------------------------------------------------
// Activity Feed
// ---------------------------------------------------------------------------

async function fetchActivity() {
  try {
    const res = await apiRequest("GET", "/audit?limit=5&sort=desc");
    const items = Array.isArray(res) ? res : res.items || res.data || [];
    renderActivity(items);
  } catch (_) {
    // silently fail
  }
}

function renderActivity(items) {
  const feed = $("#activityFeed");

  if (!items.length) {
    feed.innerHTML = '<div class="activity-empty">No recent activity.</div>';
    return;
  }

  feed.innerHTML = items
    .map((item) => {
      const level = (item.level || "info").toLowerCase();
      const agentName = item.actorExternalId || item.actorUserId || "System";
      const action = item.action || item.message || "Unknown action";
      const time = relativeTime(item.timestamp || item.createdAt);

      return `
      <div class="activity-item level-${level}">
        <span class="activity-badge ${level}">${level}</span>
        <div class="activity-content">
          <div class="activity-agent">${escapeHtml(agentName)}</div>
          <div class="activity-action">${escapeHtml(action)}</div>
        </div>
        <span class="activity-time">${time}</span>
      </div>`;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

async function submitJob() {
  const type = $("#jobType").value;
  const desc = $("#jobDesc").value.trim();

  if (!desc) {
    showToast("Please enter a description.", "error");
    return;
  }

  $("#submitJobBtn").disabled = true;

  try {
    await createJob(type, desc);
    showToast("Job created successfully.", "success");
    hide("#jobModal");
    $("#jobDesc").value = "";
    fetchStats();
  } catch (err) {
    showToast(`Failed: ${err.message}`, "error");
  } finally {
    $("#submitJobBtn").disabled = false;
  }
}

async function createJob(type, description) {
  return apiRequest("POST", "/jobs", { type, description });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function openDashboard() {
  const baseUrl = credentials.apiUrl.replace("/v1", "").replace("/api", "");
  // The web app is at a different URL (Vercel), fall back to a generic approach
  const dashUrl = baseUrl.includes("onrender.com")
    ? "https://atlasux.vercel.app/#/app/dashboard"
    : baseUrl.replace(/:\d+/, ":5173") + "/#/app/dashboard";

  api.tabs.create({ url: dashUrl });
}

// ---------------------------------------------------------------------------
// Context menu handling
// ---------------------------------------------------------------------------

function handleContextAction(action, text) {
  if (!credentials.apiUrl) return;

  let agent = "atlas";
  let prefix = "";

  switch (action) {
    case "ask-atlas":
      agent = "atlas";
      prefix = "Regarding this text: ";
      break;
    case "send-cheryl":
      agent = "cheryl";
      prefix = "Customer sent: ";
      break;
    case "research-archy":
      agent = "atlas";
      prefix = "Research this topic: ";
      break;
  }

  selectAgent(agent);

  const message = prefix + text;
  $("#chatInput").value = message;
  // Auto-send
  handleSend();
}

// ---------------------------------------------------------------------------
// Polling — Safari-safe (no alarms API)
// ---------------------------------------------------------------------------

function startPolling() {
  stopPolling(); // clear any existing intervals

  // Load user's preferred interval, default to 15s for activity, 30s for stats
  api.storage.local.get(["pollInterval"]).then((data) => {
    const interval = (data.pollInterval || 15) * 1000;
    pollIntervals.activity = setInterval(fetchActivity, interval);
    pollIntervals.stats = setInterval(fetchStats, interval * 2);
  });
}

function stopPolling() {
  if (pollIntervals.activity) {
    clearInterval(pollIntervals.activity);
    pollIntervals.activity = null;
  }
  if (pollIntervals.stats) {
    clearInterval(pollIntervals.stats);
    pollIntervals.stats = null;
  }
}

// Stop polling when popup closes
window.addEventListener("unload", stopPolling);

// ---------------------------------------------------------------------------
// API helper
// ---------------------------------------------------------------------------

async function apiRequest(method, path, body) {
  const url = credentials.apiUrl + path;

  const headers = {
    "Content-Type": "application/json",
    "x-tenant-id": credentials.tenantId,
  };

  if (credentials.authToken) {
    const token = credentials.authToken.startsWith("Bearer ")
      ? credentials.authToken
      : `Bearer ${credentials.authToken}`;
    headers["Authorization"] = token;
  }

  const opts = { method, headers };
  if (body && method !== "GET") {
    opts.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  opts.signal = controller.signal;

  try {
    const res = await fetch(url, opts);
    clearTimeout(timeout);

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        msg = errBody.error || errBody.message || msg;
      } catch (_) {
        // no json body
      }
      throw new Error(msg);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      setConnectionDot("idle");
      throw new Error("Request timed out.");
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function showToast(message, type = "info") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast ${type} visible`;

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.className = "toast hidden";
    }, 300);
  }, 2500);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  if (isNaN(diffMs)) return "";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return new Date(dateStr).toLocaleDateString();
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
