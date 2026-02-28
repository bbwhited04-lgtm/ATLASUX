const PRODUCTION_API = "https://atlas-ux.onrender.com";

// Desktop (Electron): use local backend on localhost:8787.
// Run `cd backend && npm run start` to connect to Supabase directly.
// Web/cloud: use env var or fall back to Render production backend.
const isElectron = typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);
const envUrl = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE = isElectron
  ? "http://localhost:8787"
  : (envUrl || PRODUCTION_API);

/** Read a cookie value by name. */
function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Return headers object with the CSRF token attached (if available). */
export function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getCookie("csrf_token");
  if (token) headers["x-csrf-token"] = token;
  return headers;
}

// Auto-attach CSRF token to all mutating fetch requests to our backend.
// This avoids modifying every component that calls fetch().
const _origFetch = window.fetch;
window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
  const method = (init?.method ?? "GET").toUpperCase();
  const isMutating = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  const isOurBackend = url.startsWith(API_BASE) || url.startsWith("/");

  if (isMutating && isOurBackend) {
    const token = getCookie("csrf_token");
    if (token) {
      const headers = new Headers(init?.headers);
      if (!headers.has("x-csrf-token")) {
        headers.set("x-csrf-token", token);
      }
      return _origFetch.call(this, input, { ...init, headers });
    }
  }
  return _origFetch.call(this, input, init);
};
