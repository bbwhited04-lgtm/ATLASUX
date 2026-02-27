const PRODUCTION_API = "https://atlasux-backend.onrender.com";

// In Electron production builds, always use the remote backend.
// localhost is only useful during local dev with the backend running.
const isElectron = typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);
const envUrl = import.meta.env.VITE_API_BASE_URL || "";
const isLocalhost = envUrl.includes("localhost") || envUrl.includes("127.0.0.1");

export const API_BASE =
  isElectron && isLocalhost ? PRODUCTION_API : envUrl || PRODUCTION_API;
