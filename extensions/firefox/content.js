/* ═══════════════════════════════════════════════════════
   Atlas UX — Firefox Extension Content Script
   Minimal footprint — message handlers only
   ═══════════════════════════════════════════════════════ */

const api = typeof browser !== "undefined" ? browser : chrome;

// ─── Message Listener ───
api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getSelection": {
      const selection = window.getSelection();
      sendResponse({
        selection: selection ? selection.toString().substring(0, 2000) : "",
      });
      return false;
    }

    case "getPageInfo": {
      const meta = document.querySelector('meta[name="description"]');
      const canonical = document.querySelector('link[rel="canonical"]');

      sendResponse({
        title: document.title || "",
        url: canonical ? canonical.href : window.location.href,
        description: meta ? meta.content : "",
        hostname: window.location.hostname,
      });
      return false;
    }

    default:
      return false;
  }
});
