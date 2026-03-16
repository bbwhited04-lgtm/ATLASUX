// Desktop (Electron): use local backend on localhost:8787.
// Web/cloud: use api.atlasux.cloud.
const isElectron = typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);
const envUrl = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE = isElectron
  ? "http://localhost:8787"
  : (envUrl || "https://api.atlasux.cloud");

// CSRF token captured from response headers (PCI DSS 6.5.9, NIST SC-23)
let csrfToken: string | null = null;

/**
 * Fetch wrapper that automatically handles CSRF tokens.
 * Captures x-csrf-token from responses, sends it on mutations.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(init?.headers);

  // Attach CSRF token to mutating requests
  const method = (init?.method ?? "GET").toUpperCase();
  if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    headers.set("x-csrf-token", csrfToken);
  }

  const response = await fetch(url, { ...init, headers });

  // Capture CSRF token from response
  const newToken = response.headers.get("x-csrf-token");
  if (newToken) {
    csrfToken = newToken;
  }

  return response;
}
