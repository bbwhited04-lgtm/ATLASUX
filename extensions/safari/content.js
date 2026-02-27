/* =============================================
   Atlas UX — Safari Extension Content Script
   Minimal footprint — responds to messages only.
   ============================================= */

const api = typeof browser !== "undefined" ? browser : chrome;

// ---------------------------------------------------------------------------
// Message listener
// ---------------------------------------------------------------------------

api.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "getSelection": {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : "";
      sendResponse({ text });
      return false;
    }

    case "getPageInfo": {
      sendResponse({
        url: window.location.href,
        title: document.title,
        selection: (window.getSelection() || "").toString().trim(),
        meta: getPageMeta(),
      });
      return false;
    }

    case "extractContent": {
      // Extract main content from the page (for research / summarization)
      const content = extractMainContent();
      sendResponse({ content });
      return false;
    }

    default:
      return false;
  }
});

// ---------------------------------------------------------------------------
// Page metadata extraction
// ---------------------------------------------------------------------------

function getPageMeta() {
  const meta = {};

  // Description
  const descEl =
    document.querySelector('meta[name="description"]') ||
    document.querySelector('meta[property="og:description"]');
  if (descEl) meta.description = descEl.getAttribute("content");

  // Author
  const authorEl = document.querySelector('meta[name="author"]');
  if (authorEl) meta.author = authorEl.getAttribute("content");

  // Keywords
  const keywordsEl = document.querySelector('meta[name="keywords"]');
  if (keywordsEl) meta.keywords = keywordsEl.getAttribute("content");

  // OG Image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) meta.image = ogImage.getAttribute("content");

  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) meta.canonical = canonical.getAttribute("href");

  return meta;
}

// ---------------------------------------------------------------------------
// Content extraction (lightweight)
// ---------------------------------------------------------------------------

function extractMainContent() {
  // Try common content selectors in priority order
  const selectors = [
    "article",
    '[role="main"]',
    "main",
    ".post-content",
    ".article-content",
    ".entry-content",
    "#content",
    ".content",
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      return cleanText(el.innerText).substring(0, 5000);
    }
  }

  // Fallback: use body text, skip nav/footer/aside
  const body = document.body.cloneNode(true);
  const removals = body.querySelectorAll(
    "nav, footer, aside, header, script, style, noscript, iframe"
  );
  removals.forEach((el) => el.remove());

  return cleanText(body.innerText).substring(0, 5000);
}

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
