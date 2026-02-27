/* ===================================================================
   Atlas UX — Chrome Extension Content Script
   Minimal: floating button, context menu bridge, toast notifications
   =================================================================== */

(() => {
  "use strict";

  let floatingBtn = null;
  let toastEl = null;

  // ---- Floating Button (bottom-right) ----
  function createFloatingButton() {
    if (floatingBtn) return;

    floatingBtn = document.createElement("div");
    floatingBtn.id = "atlas-ux-fab";
    floatingBtn.title = "Open Atlas UX";
    floatingBtn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" fill="url(#atlasGrad)"/>
        <text x="16" y="22" text-anchor="middle" font-family="Inter, Arial, sans-serif"
              font-weight="800" font-size="18" fill="white">A</text>
        <defs>
          <linearGradient id="atlasGrad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stop-color="#0891b2"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
    `;

    Object.assign(floatingBtn.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "44px",
      height: "44px",
      borderRadius: "12px",
      background: "linear-gradient(135deg, #0891b2, #06b6d4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: "2147483647",
      boxShadow: "0 4px 16px rgba(6, 182, 212, 0.4), 0 2px 4px rgba(0,0,0,0.3)",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
      border: "1px solid rgba(6, 182, 212, 0.3)",
    });

    floatingBtn.addEventListener("mouseenter", () => {
      floatingBtn.style.transform = "scale(1.08)";
      floatingBtn.style.boxShadow = "0 6px 24px rgba(6, 182, 212, 0.5), 0 2px 8px rgba(0,0,0,0.3)";
    });
    floatingBtn.addEventListener("mouseleave", () => {
      floatingBtn.style.transform = "scale(1)";
      floatingBtn.style.boxShadow = "0 4px 16px rgba(6, 182, 212, 0.4), 0 2px 4px rgba(0,0,0,0.3)";
    });

    floatingBtn.addEventListener("click", () => {
      // Open popup — can't programmatically open the popup, so send a message
      // to background to handle this, or just open the web app
      chrome.runtime.sendMessage({ type: "OPEN_POPUP" }).catch(() => {});
    });

    document.body.appendChild(floatingBtn);
  }

  // ---- Toast Notification ----
  function showToast(message, duration = 3000) {
    if (toastEl) toastEl.remove();

    toastEl = document.createElement("div");
    toastEl.id = "atlas-ux-toast";
    toastEl.textContent = message;

    Object.assign(toastEl.style, {
      position: "fixed",
      bottom: "76px",
      right: "20px",
      maxWidth: "320px",
      padding: "10px 16px",
      background: "rgba(15, 23, 42, 0.95)",
      color: "#e2e8f0",
      fontSize: "13px",
      fontFamily: "Inter, -apple-system, sans-serif",
      borderRadius: "10px",
      border: "1px solid rgba(6, 182, 212, 0.3)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      zIndex: "2147483646",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "opacity 0.2s ease, transform 0.2s ease",
      backdropFilter: "blur(8px)",
    });

    document.body.appendChild(toastEl);

    // Animate in
    requestAnimationFrame(() => {
      toastEl.style.opacity = "1";
      toastEl.style.transform = "translateY(0)";
    });

    // Animate out
    setTimeout(() => {
      if (toastEl) {
        toastEl.style.opacity = "0";
        toastEl.style.transform = "translateY(8px)";
        setTimeout(() => {
          if (toastEl) {
            toastEl.remove();
            toastEl = null;
          }
        }, 200);
      }
    }, duration);
  }

  // ---- Message Listener ----
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "SHOW_TOAST") {
      showToast(msg.message, msg.duration || 3000);
      sendResponse({ ok: true });
    }

    if (msg.type === "HIGHLIGHT_TEXT") {
      // Highlight selected text on the page (visual feedback)
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        try {
          const range = selection.getRangeAt(0);
          const highlight = document.createElement("mark");
          Object.assign(highlight.style, {
            background: "rgba(6, 182, 212, 0.25)",
            borderBottom: "2px solid #06b6d4",
            borderRadius: "2px",
            padding: "0 2px",
          });
          range.surroundContents(highlight);

          // Remove highlight after 3s
          setTimeout(() => {
            const parent = highlight.parentNode;
            if (parent) {
              parent.replaceChild(
                document.createTextNode(highlight.textContent),
                highlight
              );
              parent.normalize();
            }
          }, 3000);
        } catch {
          // Selection spans multiple elements — skip highlighting
        }
      }
      sendResponse({ ok: true });
    }

    return false;
  });

  // ---- Initialize ----
  // Only create the floating button if user has enabled it in settings
  chrome.storage.local.get("atlasSettings", (data) => {
    const settings = data.atlasSettings || {};
    // Default: don't show floating button to keep pages clean
    // User can enable it in extension settings
    if (settings.showFloatingButton) {
      createFloatingButton();
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.atlasSettings) {
      const newSettings = changes.atlasSettings.newValue || {};
      if (newSettings.showFloatingButton && !floatingBtn) {
        createFloatingButton();
      } else if (!newSettings.showFloatingButton && floatingBtn) {
        floatingBtn.remove();
        floatingBtn = null;
      }
    }
  });
})();
