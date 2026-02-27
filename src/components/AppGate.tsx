import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";

const SESSION_KEY = "atlasux_gate_ok";
const SEAT_KEY    = "atlasux_seat_info";

function normalize(s: string) {
  return (s ?? "").trim();
}

function isGateOpen() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Validate code against backend cloud seats DB (revocable). */
async function validateRemote(code: string): Promise<{
  valid: boolean;
  seat?: { id?: string; label: string; role: string };
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/v1/gate/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return await res.json();
  } catch {
    // Backend unreachable — can't validate cloud seats
    return { valid: false, error: "backend_unreachable" };
  }
}

export default function AppGate({ children }: { children: React.ReactNode }) {
  // Support comma-separated codes (owner + cloud seats baked at build time)
  const bakedCodes = useMemo(() => {
    const raw = normalize(import.meta.env.VITE_APP_GATE_CODE ?? "");
    if (!raw) return [];
    return raw.split(",").map((c) => c.trim()).filter(Boolean);
  }, []);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [fails, setFails] = useState(0);

  // Fail closed if not configured (safer)
  if (!bakedCodes.length) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-cyan-500/20">
          <CardHeader>
            <CardTitle>Private Beta</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Access is currently limited.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Allow through once authorized (session + immediate state)
  if (authed || isGateOpen()) return <>{children}</>;

  const now = Date.now();
  const isLocked = now < lockedUntil;

  const grantAccess = (seatInfo?: { label: string; role: string }) => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (seatInfo) sessionStorage.setItem(SEAT_KEY, JSON.stringify(seatInfo));
    } catch {
      // ignore storage failures; authed state still lets user in
    }
    setError(null);
    setAuthed(true);
  };

  const onSubmit = async () => {
    if (isLocked || checking) return;

    const trimmed = normalize(code);

    // 1. Check baked-in codes (instant, works offline)
    if (bakedCodes.includes(trimmed)) {
      // For baked codes, also check backend for revocation (non-blocking)
      // If backend is down, baked codes still work (graceful degradation)
      const remote = await validateRemote(trimmed).catch(() => null);
      if (remote && !remote.valid && remote.error === "seat_revoked") {
        setError("This access code has been revoked.");
        return;
      }
      grantAccess(remote?.seat ?? { label: "Owner", role: "owner" });
      return;
    }

    // 2. Check backend cloud seats DB (for codes not baked in)
    setChecking(true);
    const result = await validateRemote(trimmed);
    setChecking(false);

    if (result.valid && result.seat) {
      grantAccess(result.seat);
      return;
    }

    // Failure
    const nextFails = fails + 1;
    setFails(nextFails);

    if (result.error === "seat_revoked") {
      setError("This access code has been revoked.");
    } else if (result.error === "backend_unreachable") {
      setError("Invalid access code.");
    } else {
      setError("Invalid access code.");
    }

    // Simple lockout friction after 5 failures (30s)
    if (nextFails >= 5) {
      setLockedUntil(Date.now() + 30_000);
      setFails(0);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-cyan-500/20">
        <CardHeader>
          <CardTitle>Private Beta</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your access code to continue.
          </p>

          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Access code"
            type="password"
            autoComplete="off"
            disabled={isLocked || checking}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSubmit();
            }}
          />

          {error && <div className="text-sm text-red-500">{error}</div>}

          {isLocked && (
            <div className="text-xs text-muted-foreground">
              Too many attempts. Try again in{" "}
              {Math.ceil((lockedUntil - now) / 1000)}s.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              className="bg-cyan-500 hover:bg-cyan-400"
              onClick={onSubmit}
              disabled={isLocked || checking}
            >
              {checking ? "Checking..." : "Continue"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                window.location.hash = "#/";
              }}
            >
              Back
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Access is stored for this session.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
