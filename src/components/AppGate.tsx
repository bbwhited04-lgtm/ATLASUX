import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const SESSION_KEY = "atlasux_gate_ok";

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

export default function AppGate({ children }: { children: React.ReactNode }) {
  const expected = useMemo(
    () => normalize(import.meta.env.VITE_APP_GATE_CODE ?? ""),
    []
  );

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [fails, setFails] = useState(0);

  // Fail closed if not configured (safer)
  if (!expected) {
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

  const onSubmit = () => {
    if (isLocked) return;

    if (normalize(code) === expected) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignore storage failures; authed state still lets user in
      }
      setError(null);
      setAuthed(true); // forces immediate render (no “backspace opens app”)
      return;
    }

    const nextFails = fails + 1;
    setFails(nextFails);
    setError("Invalid access code.");

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
            disabled={isLocked}
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
              disabled={isLocked}
            >
              Continue
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
