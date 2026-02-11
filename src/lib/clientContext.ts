// Lightweight client context for audit headers
export type ClientSource = "web" | "tauri" | "mobile";

export function getClientSource(): ClientSource {
  // Tauri exposes window.__TAURI__ in many setups
  const w = window as any;
  if (w && (w.__TAURI__ || w.__TAURI_IPC__ || w.__TAURI_INTERNALS__)) return "tauri";
  return "web";
}

export function getDeviceId(): string {
  const key = "atlasux_device_id";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto?.randomUUID ? crypto.randomUUID() : `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

export function getRequestId(): string {
  try {
    return crypto?.randomUUID ? crypto.randomUUID() : `req_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  } catch {
    return `req_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}
