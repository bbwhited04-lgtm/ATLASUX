/* ============================================
   Atlas UX — Opera Extension Popup Logic
   ============================================ */

(function () {
  'use strict';

  // --- State ---
  let apiUrl = '';
  let token = '';
  let tenantId = '';
  let selectedAgent = 'atlas';
  let activityTimer = null;
  let statsTimer = null;

  // --- DOM refs ---
  const $ = (id) => document.getElementById(id);

  const els = {
    loginView:       () => $('login-view'),
    connectedView:   () => $('connected-view'),
    statusDot:       () => $('status-dot'),
    statusLabel:     () => $('status-label'),
    inputApiUrl:     () => $('input-api-url'),
    inputToken:      () => $('input-token'),
    inputTenant:     () => $('input-tenant'),
    btnConnect:      () => $('btn-connect'),
    connectText:     () => $('connect-text'),
    connectSpinner:  () => $('connect-spinner'),
    loginError:      () => $('login-error'),
    statJobs:        () => $('stat-jobs'),
    statDecisions:   () => $('stat-decisions'),
    statAgents:      () => $('stat-agents'),
    agentPills:      () => $('agent-pills'),
    chatMessages:    () => $('chat-messages'),
    chatInput:       () => $('chat-input'),
    btnSend:         () => $('btn-send'),
    activityFeed:    () => $('activity-feed'),
    btnRefresh:      () => $('btn-refresh-activity'),
    btnNewJob:       () => $('btn-new-job'),
    btnDashboard:    () => $('btn-dashboard'),
    newJobForm:      () => $('new-job-form'),
    jobType:         () => $('job-type'),
    jobDescription:  () => $('job-description'),
    btnCancelJob:    () => $('btn-cancel-job'),
    btnSubmitJob:    () => $('btn-submit-job'),
    btnLogout:       () => $('btn-logout'),
    btnOptions:      () => $('btn-options'),
    toastContainer:  () => $('toast-container'),
  };

  // --- Init ---
  async function init() {
    const stored = await chromeStorageGet(['apiUrl', 'token', 'tenantId']);
    if (stored.apiUrl && stored.token && stored.tenantId) {
      apiUrl = stored.apiUrl;
      token = stored.token;
      tenantId = stored.tenantId;
      showConnectedView();
      fetchStats();
      fetchActivity();
      startPolling();
    } else {
      showLoginView();
    }

    // Check for context menu action
    handleContextAction();
  }

  // --- Chrome storage helpers ---
  function chromeStorageGet(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => resolve(result || {}));
    });
  }

  function chromeStorageSet(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  function chromeStorageRemove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }

  // --- Views ---
  function showLoginView() {
    els.loginView().classList.remove('hidden');
    els.connectedView().classList.add('hidden');
    setStatus('red', 'Disconnected');
  }

  function showConnectedView() {
    els.loginView().classList.add('hidden');
    els.connectedView().classList.remove('hidden');
    setStatus('green', 'Connected');
  }

  function setStatus(color, label) {
    const dot = els.statusDot();
    dot.className = 'status-dot ' + color;
    els.statusLabel().textContent = label;
  }

  // --- Login ---
  async function login() {
    const url = els.inputApiUrl().value.trim().replace(/\/+$/, '');
    const tok = els.inputToken().value.trim();
    const tid = els.inputTenant().value.trim();

    if (!url || !tok || !tid) {
      showLoginError('All fields are required.');
      return;
    }

    setConnecting(true);
    hideLoginError();

    try {
      // Test connection
      const resp = await apiRequest('GET', '/runtime/status', null, url, tok, tid);
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(body || `HTTP ${resp.status}`);
      }

      // Save credentials
      apiUrl = url;
      token = tok;
      tenantId = tid;
      await chromeStorageSet({ apiUrl: url, token: tok, tenantId: tid });

      showConnectedView();
      fetchStats();
      fetchActivity();
      startPolling();
    } catch (err) {
      showLoginError('Connection failed: ' + (err.message || 'Unknown error'));
    } finally {
      setConnecting(false);
    }
  }

  function setConnecting(loading) {
    const btn = els.btnConnect();
    const text = els.connectText();
    const spinner = els.connectSpinner();
    btn.disabled = loading;
    text.textContent = loading ? 'Connecting...' : 'Connect';
    spinner.classList.toggle('hidden', !loading);
  }

  function showLoginError(msg) {
    const el = els.loginError();
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function hideLoginError() {
    els.loginError().classList.add('hidden');
  }

  // --- Logout ---
  async function logout() {
    stopPolling();
    apiUrl = '';
    token = '';
    tenantId = '';
    await chromeStorageRemove(['token', 'tenantId']);
    clearChat();
    showLoginView();
  }

  // --- API Request ---
  async function apiRequest(method, path, body, overrideUrl, overrideToken, overrideTenant) {
    const base = (overrideUrl || apiUrl).replace(/\/+$/, '');
    const url = base + (base.endsWith('/v1') ? '' : '/v1') + path;
    const tok = overrideToken || token;
    const tid = overrideTenant || tenantId;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const headers = {
      'Authorization': 'Bearer ' + tok,
      'x-tenant-id': tid,
      'Content-Type': 'application/json',
    };

    const options = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const resp = await fetch(url, options);
      clearTimeout(timeout);
      return resp;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // --- Fetch Stats ---
  async function fetchStats() {
    try {
      const [jobsResp, decisionsResp, agentsResp] = await Promise.allSettled([
        apiRequest('GET', '/jobs?status=running'),
        apiRequest('GET', '/decisions?status=pending'),
        apiRequest('GET', '/agents'),
      ]);

      if (jobsResp.status === 'fulfilled' && jobsResp.value.ok) {
        const data = await jobsResp.value.json();
        const count = Array.isArray(data) ? data.length : (data.count || data.total || 0);
        els.statJobs().textContent = count;
      } else {
        els.statJobs().textContent = '0';
      }

      if (decisionsResp.status === 'fulfilled' && decisionsResp.value.ok) {
        const data = await decisionsResp.value.json();
        const count = Array.isArray(data) ? data.length : (data.count || data.total || 0);
        els.statDecisions().textContent = count;
      } else {
        els.statDecisions().textContent = '0';
      }

      if (agentsResp.status === 'fulfilled' && agentsResp.value.ok) {
        const data = await agentsResp.value.json();
        const count = Array.isArray(data) ? data.length : (data.count || data.total || 0);
        els.statAgents().textContent = count;
      } else {
        els.statAgents().textContent = '0';
      }
    } catch (err) {
      console.warn('Stats fetch error:', err);
    }
  }

  // --- Chat ---
  function selectAgent(slug) {
    selectedAgent = slug;
    const pills = els.agentPills().querySelectorAll('.agent-pill');
    pills.forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.agent === slug);
    });
    els.chatInput().placeholder = 'Message ' + capitalize(slug) + '...';
  }

  function clearChat() {
    const container = els.chatMessages();
    container.innerHTML = '<div class="chat-empty">Select an agent and start chatting</div>';
  }

  function appendBubble(text, type, name) {
    const container = els.chatMessages();
    // Remove empty state
    const empty = container.querySelector('.chat-empty');
    if (empty) empty.remove();

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + type;

    const nameEl = document.createElement('div');
    nameEl.className = 'bubble-name';
    nameEl.textContent = name;
    bubble.appendChild(nameEl);

    const textEl = document.createElement('div');
    textEl.textContent = text;
    bubble.appendChild(textEl);

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    return bubble;
  }

  async function sendChat() {
    const input = els.chatInput();
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    appendBubble(message, 'user', 'You');

    // Show typing indicator
    const typing = document.createElement('div');
    typing.className = 'chat-bubble agent typing';
    const typingName = document.createElement('div');
    typingName.className = 'bubble-name';
    typingName.textContent = capitalize(selectedAgent);
    typing.appendChild(typingName);
    const typingText = document.createElement('div');
    typingText.textContent = 'Thinking';
    typing.appendChild(typingText);
    els.chatMessages().appendChild(typing);
    els.chatMessages().scrollTop = els.chatMessages().scrollHeight;

    try {
      const resp = await apiRequest('POST', '/chat', {
        message,
        agentSlug: selectedAgent,
      });

      typing.remove();

      if (resp.ok) {
        const data = await resp.json();
        const reply = data.reply || data.message || data.response || JSON.stringify(data);
        appendBubble(reply, 'agent', capitalize(selectedAgent));
      } else {
        appendBubble('Failed to get response. (HTTP ' + resp.status + ')', 'agent', capitalize(selectedAgent));
      }
    } catch (err) {
      typing.remove();
      appendBubble('Connection error: ' + err.message, 'agent', 'System');
    }
  }

  // --- Activity Feed ---
  async function fetchActivity() {
    try {
      const resp = await apiRequest('GET', '/audit?limit=5&sort=desc');
      if (!resp.ok) {
        els.activityFeed().innerHTML = '<div class="activity-empty">Could not load activity</div>';
        return;
      }

      const data = await resp.json();
      const items = Array.isArray(data) ? data : (data.items || data.logs || []);

      if (items.length === 0) {
        els.activityFeed().innerHTML = '<div class="activity-empty">No recent activity</div>';
        return;
      }

      els.activityFeed().innerHTML = items.map((item) => {
        const level = (item.level || 'info').toLowerCase();
        const barClass = ['error', 'critical'].includes(level) ? 'error' :
                         level === 'warn' ? 'warn' :
                         level === 'success' ? 'success' : 'info';
        const agent = item.actorExternalId || item.actorUserId || item.agent || 'system';
        const action = item.action || item.message || 'Unknown action';
        const time = relativeTime(item.timestamp || item.createdAt);

        return `
          <div class="activity-item">
            <div class="activity-bar ${barClass}"></div>
            <div class="activity-content">
              <div class="activity-top">
                <span class="activity-agent">${escapeHtml(agent)}</span>
                <span class="activity-time">${time}</span>
              </div>
              <div class="activity-action">${escapeHtml(action)}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.warn('Activity fetch error:', err);
      els.activityFeed().innerHTML = '<div class="activity-empty">Error loading activity</div>';
    }
  }

  // --- Create Job ---
  function showNewJobForm() {
    els.newJobForm().classList.remove('hidden');
    els.btnNewJob().disabled = true;
  }

  function hideNewJobForm() {
    els.newJobForm().classList.add('hidden');
    els.btnNewJob().disabled = false;
    els.jobDescription().value = '';
  }

  async function submitJob() {
    const type = els.jobType().value;
    const description = els.jobDescription().value.trim();
    if (!description) {
      showToast('Please enter a job description.', 'error');
      return;
    }

    els.btnSubmitJob().disabled = true;
    try {
      const resp = await apiRequest('POST', '/jobs', { type, description });
      if (resp.ok) {
        showToast('Job created successfully!', 'success');
        hideNewJobForm();
        fetchStats();
      } else {
        const body = await resp.text();
        showToast('Failed to create job: ' + body, 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      els.btnSubmitJob().disabled = false;
    }
  }

  // --- Dashboard ---
  function openDashboard() {
    const dashUrl = apiUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
    chrome.tabs.create({ url: dashUrl });
  }

  // --- Polling ---
  function startPolling() {
    stopPolling();
    activityTimer = setInterval(fetchActivity, 15000);
    statsTimer = setInterval(fetchStats, 30000);
  }

  function stopPolling() {
    if (activityTimer) { clearInterval(activityTimer); activityTimer = null; }
    if (statsTimer) { clearInterval(statsTimer); statsTimer = null; }
  }

  // --- Context Menu Action ---
  async function handleContextAction() {
    const stored = await chromeStorageGet(['contextAction', 'contextText', 'contextUrl']);
    if (!stored.contextAction || !stored.contextText) return;

    // Clear the stored context
    await chromeStorageRemove(['contextAction', 'contextText', 'contextUrl']);

    // Only proceed if connected
    if (!token || !tenantId) return;

    const text = stored.contextText;
    let agent = 'atlas';

    if (stored.contextAction === 'send-cheryl') {
      agent = 'cheryl';
    } else if (stored.contextAction === 'research-archy') {
      agent = 'archy';
    }

    // Switch to the right agent
    selectAgent(agent === 'archy' ? 'atlas' : agent);

    // Pre-fill the chat
    const prefix = stored.contextAction === 'research-archy'
      ? 'Research this topic: '
      : stored.contextAction === 'send-cheryl'
        ? 'Support request: '
        : 'Question: ';

    els.chatInput().value = prefix + text;
    els.chatInput().focus();
  }

  // --- Toast ---
  function showToast(msg, type) {
    const container = els.toastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 200);
    }, 3000);
  }

  // --- Utilities ---
  function relativeTime(iso) {
    if (!iso) return '';
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;

    if (diff < 0) return 'just now';
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    if (diff < 172800000) return 'yesterday';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Listen for messages from background ---
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'contextAction') {
      handleContextAction();
    }
    sendResponse({ ok: true });
  });

  // --- DOM Event Bindings ---
  document.addEventListener('DOMContentLoaded', () => {
    // Login
    els.btnConnect().addEventListener('click', login);
    els.inputTenant().addEventListener('keydown', (e) => {
      if (e.key === 'Enter') login();
    });

    // Agent pills
    els.agentPills().addEventListener('click', (e) => {
      const pill = e.target.closest('.agent-pill');
      if (pill) selectAgent(pill.dataset.agent);
    });

    // Chat
    els.btnSend().addEventListener('click', sendChat);
    els.chatInput().addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChat();
      }
    });

    // Activity refresh
    els.btnRefresh().addEventListener('click', fetchActivity);

    // Quick actions
    els.btnNewJob().addEventListener('click', showNewJobForm);
    els.btnDashboard().addEventListener('click', openDashboard);

    // New job form
    els.btnCancelJob().addEventListener('click', hideNewJobForm);
    els.btnSubmitJob().addEventListener('click', submitJob);

    // Logout
    els.btnLogout().addEventListener('click', logout);

    // Options
    els.btnOptions().addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // Init
    init();
  });
})();
