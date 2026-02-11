import crypto from "crypto";

type PairSession = {
  code: string;
  createdAt: number;
  expiresAt: number;
};

const TEN_MIN = 10 * 60 * 1000;

// Dev-only in-memory session store.
// In production: move to Supabase table (pair_sessions) and bind to org/user.
const sessions = new Map<string, PairSession>();

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `AX-${pick(4)}-${pick(4)}`;
}

export function startPair(appUrl: string) {
  const code = makeCode();
  const now = Date.now();
  const session: PairSession = {
    code,
    createdAt: now,
    expiresAt: now + TEN_MIN
  };
  sessions.set(code, session);

  // Pair URL is what we encode into QR. Mobile would open this and exchange for a token.
  const base = appUrl || "https://atlasux.cloud";
  const pair_url = `${base.replace(/\/$/, "")}/mobile/pair?code=${encodeURIComponent(code)}`;

  return { code, pair_url, expires_in_seconds: Math.floor(TEN_MIN / 1000) };
}

export function confirmPair(code: string) {
  const s = sessions.get(code);
  if (!s) return { ok: false as const, error: "invalid_code" };
  if (Date.now() > s.expiresAt) {
    sessions.delete(code);
    return { ok: false as const, error: "code_expired" };
  }

  // Issue a dev token (placeholder). In prod: JWT, device binding, MFA, etc.
  const token = crypto.randomBytes(24).toString("base64url");
  sessions.delete(code);

  return {
    ok: true as const,
    token,
    device: {
      name: "iPhone",
      os: "iOS",
      connection: "Wi-Fi"
    }
  };
}
