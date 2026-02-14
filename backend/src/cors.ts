import cors from "cors";
import type { Env } from "./env.js";

export function makeCors(env: Env) {
  const raw = (env.ALLOWED_ORIGINS || env.APP_URL || "").split(",").map(s => s.trim()).filter(Boolean);
  const allowlist = new Set(raw.length ? raw : ["http://localhost:5173", "http://localhost:3000"]);
  return cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/server-to-server
      if (allowlist.has(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  });
}
