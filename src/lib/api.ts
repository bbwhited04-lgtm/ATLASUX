const PRODUCTION_API = "https://atlasux-backend.onrender.com";

// Desktop (Electron): use local backend on localhost:8787.
// Run `cd backend && npm run start` to connect to Supabase directly.
// Web/cloud: use env var or fall back to Render production backend.
const isElectron = typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);
const envUrl = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE = isElectron
  ? "http://localhost:8787"
  : (envUrl || PRODUCTION_API);
