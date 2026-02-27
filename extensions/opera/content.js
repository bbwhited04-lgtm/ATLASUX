/* ============================================
   Atlas UX — Opera Extension Content Script
   Minimal — no DOM injection for clean pages
   ============================================ */

(function () {
  'use strict';

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'getSelection') {
      sendResponse({
        selection: window.getSelection().toString(),
      });
      return;
    }

    if (msg.type === 'getPageInfo') {
      sendResponse({
        url: location.href,
        title: document.title,
        selection: window.getSelection().toString(),
      });
      return;
    }

    sendResponse({ ok: true });
  });
})();
