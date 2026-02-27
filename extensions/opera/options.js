/* ============================================
   Atlas UX — Opera Extension Options Logic
   ============================================ */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // --- Load saved settings ---
  async function loadSettings() {
    const stored = await new Promise((resolve) => {
      chrome.storage.local.get(
        ['apiUrl', 'token', 'tenantId', 'notifyJobCompletion', 'notifyDecisionRequests', 'pollingInterval'],
        (result) => resolve(result || {})
      );
    });

    if (stored.apiUrl) $('opt-api-url').value = stored.apiUrl;
    if (stored.token) $('opt-token').value = stored.token;
    if (stored.tenantId) $('opt-tenant').value = stored.tenantId;

    $('opt-notify-jobs').checked = stored.notifyJobCompletion !== false;
    $('opt-notify-decisions').checked = stored.notifyDecisionRequests !== false;

    if (stored.pollingInterval) {
      $('opt-polling').value = String(stored.pollingInterval);
    }

    // Set webapp link
    const url = stored.apiUrl || 'https://atlas-ux.onrender.com';
    $('link-webapp').href = url.replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  }

  // --- Save settings ---
  async function saveSettings() {
    const data = {
      apiUrl: $('opt-api-url').value.trim().replace(/\/+$/, ''),
      token: $('opt-token').value.trim(),
      tenantId: $('opt-tenant').value.trim(),
      notifyJobCompletion: $('opt-notify-jobs').checked,
      notifyDecisionRequests: $('opt-notify-decisions').checked,
      pollingInterval: parseInt($('opt-polling').value, 10) || 30,
    };

    await new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });

    // Update webapp link
    $('link-webapp').href = data.apiUrl.replace(/\/v1\/?$/, '').replace(/\/+$/, '');

    // Show feedback
    const feedback = $('save-feedback');
    feedback.classList.remove('hidden');
    setTimeout(() => {
      feedback.classList.add('hidden');
    }, 2500);
  }

  // --- Test connection ---
  async function testConnection() {
    const btn = $('btn-test');
    const status = $('test-status');

    const url = $('opt-api-url').value.trim().replace(/\/+$/, '');
    const tok = $('opt-token').value.trim();
    const tid = $('opt-tenant').value.trim();

    if (!url || !tok || !tid) {
      status.textContent = 'Fill in all connection fields first';
      status.className = 'test-status error';
      return;
    }

    btn.disabled = true;
    status.textContent = 'Testing...';
    status.className = 'test-status loading';

    try {
      const base = url + (url.endsWith('/v1') ? '' : '/v1');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const resp = await fetch(base + '/runtime/status', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + tok,
          'x-tenant-id': tid,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (resp.ok) {
        status.textContent = 'Connected successfully';
        status.className = 'test-status success';
      } else {
        status.textContent = 'HTTP ' + resp.status + ' — check credentials';
        status.className = 'test-status error';
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        status.textContent = 'Connection timed out';
      } else {
        status.textContent = 'Failed: ' + (err.message || 'Network error');
      }
      status.className = 'test-status error';
    } finally {
      btn.disabled = false;
    }
  }

  // --- Toggle token visibility ---
  function toggleToken() {
    const input = $('opt-token');
    const eyeOn = $('icon-eye');
    const eyeOff = $('icon-eye-off');

    if (input.type === 'password') {
      input.type = 'text';
      eyeOn.classList.add('hidden');
      eyeOff.classList.remove('hidden');
    } else {
      input.type = 'password';
      eyeOn.classList.remove('hidden');
      eyeOff.classList.add('hidden');
    }
  }

  // --- Clear data ---
  function showClearConfirm() {
    $('clear-confirm').classList.remove('hidden');
  }

  function hideClearConfirm() {
    $('clear-confirm').classList.add('hidden');
  }

  async function clearAllData() {
    await new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });

    // Reset form fields
    $('opt-api-url').value = 'https://atlas-ux.onrender.com';
    $('opt-token').value = '';
    $('opt-tenant').value = '';
    $('opt-notify-jobs').checked = true;
    $('opt-notify-decisions').checked = true;
    $('opt-polling').value = '30';

    hideClearConfirm();

    const status = $('test-status');
    status.textContent = 'All data cleared';
    status.className = 'test-status success';
    setTimeout(() => { status.textContent = ''; }, 2500);
  }

  // --- Webapp link ---
  function openWebapp(e) {
    e.preventDefault();
    const url = $('link-webapp').href;
    if (url && url !== '#') {
      chrome.tabs.create({ url });
    }
  }

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();

    $('btn-save').addEventListener('click', saveSettings);
    $('btn-test').addEventListener('click', testConnection);
    $('btn-toggle-token').addEventListener('click', toggleToken);
    $('btn-clear-data').addEventListener('click', showClearConfirm);
    $('btn-clear-cancel').addEventListener('click', hideClearConfirm);
    $('btn-clear-yes').addEventListener('click', clearAllData);
    $('link-webapp').addEventListener('click', openWebapp);
  });
})();
